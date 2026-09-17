"""
What it does:  Sends the prompt messages to a chat model and returns the answer text.
Concept:       The LLM is the "generation" in Retrieval-Augmented Generation. It does not know our documents;
               it only reads the sources we put in the prompt. A low temperature keeps it close to them.
Why this design: Nearly every provider (Groq, OpenRouter, Gemini, Cerebras, Together, Mistral) accepts the
               OpenAI chat format, so one client function serves all of them and the provider becomes data in
               config.CHAT_PROVIDERS. By default the request goes through a ProviderPool, which rotates across
               providers and rests any that hits its rate limit: several small free tiers add up to one usable
               one. Passing an explicit provider skips the rotation, which is what the model comparison needs.
Inputs/Outputs: chat messages -> answer text.
Common pitfalls:
  - Creating a client per call. The client is cached per provider so connections are reused.
  - Setting no timeout: a slow provider would eat the web app's ~10 s budget.
"""

from functools import lru_cache

from openai import OpenAI

from config import GENERATION_TEMPERATURE, MAX_ANSWER_TOKENS
from rag.providers import Provider, ProviderPool, load_providers

GENERATION_TIMEOUT_SECONDS = 20  # why: a rotation retry still has to fit the caller's patience; tune per host.


@lru_cache(maxsize=None)
def client_for(base_url: str, api_key: str) -> OpenAI:
    """One HTTP client per endpoint, so the TLS connection is reused between questions."""
    return OpenAI(base_url=base_url, api_key=api_key, timeout=GENERATION_TIMEOUT_SECONDS)


def call_provider(provider: Provider, messages: list[dict[str, str]]) -> str:
    """One chat completion against one provider. Raises whatever the provider raises."""
    response = client_for(provider.base_url, provider.api_key).chat.completions.create(
        model=provider.model,
        messages=messages,  # type: ignore[arg-type]
        temperature=GENERATION_TEMPERATURE,
        max_tokens=MAX_ANSWER_TOKENS,
    )
    answer = response.choices[0].message.content
    return answer.strip() if answer else "I am sorry, but I was unable to generate an answer."


@lru_cache(maxsize=1)
def default_pool() -> ProviderPool:
    """The shared rotation, built once from the providers that have a key in .env."""
    return ProviderPool(providers=load_providers(), call=call_provider)


def generate_answer(messages: list[dict[str, str]], provider: Provider | None = None) -> str:
    """Answer text from a chat model.

    provider=None  -> rotate across every configured provider, skipping rate-limited ones (normal use).
    provider=given -> ask exactly that provider, so comparisons are not confused by failover.
    """
    if provider is not None:
        return call_provider(provider, messages)
    return default_pool().generate(messages)
