"""
What it does:  Sends the prompt messages to a chat model and returns its answer and the provider that wrote it.
Concept:       The LLM is the "generation" in Retrieval-Augmented Generation. It does not know our documents;
               it only reads the sources we put in the prompt. A low temperature keeps it close to them.
Why this design: Nearly every provider (Groq, OpenRouter, Gemini, Cerebras, Together, Mistral) accepts the
               OpenAI chat format, so one client function serves all of them and the provider becomes data in
               config.CHAT_PROVIDERS. By default the request goes through a ProviderPool, which rotates across
               providers and rests any that hits its rate limit: several small free tiers add up to one usable
               one. Passing an explicit provider skips the rotation, which is what the model comparison needs.
Inputs/Outputs: chat messages -> Generation(text, provider name).
Common pitfalls:
  - Creating a client per call. The client is cached per provider so connections are reused.
  - Trusting the HTTP timeout as a deadline. It only limits the gap BETWEEN bytes, and some providers (OpenRouter)
    send blank keep-alive bytes while they think: one request ran 110 s under an "8 s" timeout. The call
    therefore runs on a background thread, and we stop waiting for it when its share of the deadline is used up.
  - Letting the SDK retry. It would sleep through a rate limit before the pool could switch providers.
"""

from concurrent.futures import ThreadPoolExecutor
from functools import lru_cache

import openai
from openai import OpenAI

from config import (
    GENERATION_DEADLINE_SECONDS,
    GENERATION_TEMPERATURE,
    GENERATION_WORKERS,
    MAX_ANSWER_TOKENS,
)
from domain import Generation
from rag.providers import (
    Provider,
    ProviderBroken,
    ProviderBusy,
    ProviderPool,
    load_providers,
)

# HTTP statuses that mean "not now" rather than "never": request timeout, conflict, rate limit (every 5xx too).
TEMPORARY_STATUS_CODES = {408, 409, 429}

# Where LLM calls run, so we can stop WAITING for one at its deadline (a thread can't be killed, only abandoned).
background_calls = ThreadPoolExecutor(max_workers=GENERATION_WORKERS, thread_name_prefix="llm")


@lru_cache(maxsize=None)
def client_for(base_url: str, api_key: str) -> OpenAI:
    """One HTTP client per endpoint, so the TLS connection is reused between questions."""
    return OpenAI(
        base_url=base_url,
        api_key=api_key,
        timeout=GENERATION_DEADLINE_SECONDS,  # bounds how long an abandoned call can sit silent
        max_retries=0,  # the ProviderPool is our retry strategy: fail fast so it can switch providers
    )


def complete(provider: Provider, messages: list[dict[str, str]]) -> str:
    """One chat completion against one provider. Raises whatever the SDK raises, or ProviderBusy if it wrote nothing."""
    response = client_for(provider.base_url, provider.api_key).chat.completions.create(
        model=provider.model,
        messages=messages,  # type: ignore[arg-type]
        temperature=GENERATION_TEMPERATURE,
        max_tokens=MAX_ANSWER_TOKENS,
    )
    answer = response.choices[0].message.content
    if not answer:
        # Seen with reasoning models: they spend every token on hidden thinking and write nothing. Busy, not
        # broken: let the next provider answer instead of sending an English apology to a Vietnamese speaker.
        raise ProviderBusy("empty answer")
    return answer.strip()


def classify_error(error: openai.OpenAIError) -> ProviderBusy | ProviderBroken:
    """Translate an SDK error into the pool's language: temporary (rest it) or permanent (drop it)."""
    if isinstance(error, openai.APIConnectionError):  # includes APITimeoutError
        return ProviderBusy(f"network: {error}")
    if isinstance(error, openai.APIStatusError):
        if error.status_code == 429:
            return ProviderBusy("rate limited (HTTP 429)")
        if error.status_code in TEMPORARY_STATUS_CODES or error.status_code >= 500:
            return ProviderBusy(f"HTTP {error.status_code}")
        return ProviderBroken(f"HTTP {error.status_code}: {error}")  # 400/401/403/404: our request or key is wrong
    return ProviderBroken(f"{type(error).__name__}: {error}")


def call_provider(provider: Provider, messages: list[dict[str, str]], seconds: float) -> str:
    """Ask one provider, waiting at most `seconds`. Raises ProviderBusy or ProviderBroken, as the pool expects."""
    future = background_calls.submit(complete, provider, messages)
    try:
        return future.result(timeout=seconds)
    except TimeoutError:
        # The thread keeps running until the provider replies; we just stop waiting for it.
        raise ProviderBusy(f"no answer within {seconds:.1f} s") from None
    except openai.OpenAIError as error:
        raise classify_error(error) from error


@lru_cache(maxsize=1)
def default_pool() -> ProviderPool:
    """The shared rotation, built once from the providers that have a key in .env."""
    return ProviderPool(providers=load_providers(), call=call_provider)


def generate_answer(
    messages: list[dict[str, str]],
    provider: Provider | None = None,
    *,
    deadline_seconds: float | None = None,
) -> Generation:
    """The chat model's answer, labelled with the provider that wrote it.

    provider=None  -> rotate across every configured provider, skipping resting and broken ones (normal use).
    provider=given -> ask exactly that provider, so comparisons are not confused by failover.
    deadline_seconds -> a shorter budget than config.GENERATION_DEADLINE_SECONDS, for callers in a hurry.
    """
    seconds = deadline_seconds or GENERATION_DEADLINE_SECONDS
    if provider is not None:
        return Generation(call_provider(provider, messages, seconds), provider.name)
    return default_pool().generate(messages, seconds)
