"""
What it does:  Holds the list of chat providers and asks them in order of preference, skipping any provider that
               is resting (temporary trouble) or disabled (permanent trouble), all within one time budget.
Concept:       Primary + fallbacks. Every free tier caps tokens per minute, so the first (fastest) provider
               eventually throttles; while it rests, the next one answers. Several small free tiers then behave
               like one larger one, and the fastest one answers whenever it can. Because almost every
               provider speaks the OpenAI chat format, they differ only by base URL, key and model id, so they
               can be data in a config list instead of code.
Why this design: The pool takes the actual network call as a parameter (`call`), so the rotation, the cooldown
               and the failover can be tested with fakes, without a key or a network. The pool knows nothing
               about Groq, Gemini or OpenRouter: it only knows Provider records and two exceptions of its own.
               `call` must translate its SDK's errors into ProviderBusy (rest it) or ProviderBroken (drop it);
               anything else is a bug in our code and is allowed to crash, not hidden as a provider problem.
               The deadline covers the whole request, so trying four slow providers can't add up to 4 x 8 s,
               and each provider gets at most a fixed share of it, so one stuck provider can't use it all.
               A provider that keeps failing rests longer each time (60 s, 2 min, 4 min ... 15 min): a
               degraded provider stops costing users seconds every minute, and one success forgives it.
               Why not take turns: we did, and a request that started at two slow providers ran out of time
               before reaching the healthy one (a 503 while Groq was fine).
Inputs/Outputs: config.CHAT_PROVIDERS + environment keys -> Generation(text, provider name), or an error naming
               every failure.
Common pitfalls:
  - Treating every error as permanent. One timeout would then remove a provider until the server restarts.
  - Treating every error as temporary. A wrong model id would then be retried every minute forever.
  - Putting a slow provider first in CHAT_PROVIDERS. Order is preference: fastest first.
  - Forgetting that each provider has its own model id. "The model" and "the provider" travel together.
"""

import time
from collections.abc import Callable
from dataclasses import dataclass, field

from config import (
    CHAT_PROVIDERS,
    GENERATION_DEADLINE_SECONDS,
    PROVIDER_COOLDOWN_SECONDS,
    PROVIDER_MAX_COOLDOWN_SECONDS,
    PROVIDER_TIMEOUT_SECONDS,
)
from domain import Generation


class ProviderBusy(Exception):
    """Temporary trouble (rate limit, timeout, network, 5xx). Rest the provider, then try it again."""


class ProviderBroken(Exception):
    """Permanent trouble (rejected key, unknown model). Stop asking this provider until the server restarts."""


class AllProvidersFailed(RuntimeError):
    """Every configured provider is resting or broken. Temporary, so the API answers 503 (try again)."""


@dataclass(frozen=True)
class Provider:
    """One way to get an answer: an OpenAI-compatible endpoint, a key, and the model to ask."""

    name: str  # "groq", "gemini", "openrouter-qwen": also the label in reports
    base_url: str
    api_key: str
    model: str


def load_providers() -> list[Provider]:
    """Every provider in config.CHAT_PROVIDERS whose API key is actually set.

    A provider without a key is skipped silently: that is what makes adding one a matter of pasting a key
    into .env rather than editing code.
    """
    return [
        Provider(entry["name"], entry["base_url"], entry["api_key"], entry["model"])
        for entry in CHAT_PROVIDERS
        if entry["api_key"] and entry["model"]
    ]



@dataclass
class ProviderPool:
    """Asks providers in order of preference, resting busy ones and dropping broken ones, within one time budget."""

    providers: list[Provider]
    # (provider, messages, seconds it may take) -> answer text. Raises ProviderBusy or ProviderBroken.
    call: Callable[[Provider, list[dict[str, str]], float], str]
    cooldown_seconds: float = PROVIDER_COOLDOWN_SECONDS  # the first rest; it doubles on each failure in a row
    max_cooldown_seconds: float = PROVIDER_MAX_COOLDOWN_SECONDS
    deadline_seconds: float = GENERATION_DEADLINE_SECONDS  # for the whole request, every provider included
    provider_timeout_seconds: float = PROVIDER_TIMEOUT_SECONDS  # the most one provider may use of it
    # Injected so tests can move time without sleeping.
    now: Callable[[], float] = time.monotonic
    _resting_until: dict[str, float] = field(default_factory=dict)
    _failures_in_a_row: dict[str, int] = field(default_factory=dict)
    _disabled: set[str] = field(default_factory=set)

    def generate(self, messages: list[dict[str, str]]) -> Generation:
        """Ask providers in list order until one answers or the time budget runs out.

        Raises AllProvidersFailed (temporary: the API answers 503) listing every provider's reason.
        """
        if not self.providers:
            raise RuntimeError(
                "No chat providers configured. Add a key to .env (see config.CHAT_PROVIDERS)."
            )

        failures: list[str] = []
        deadline = self.now() + self.deadline_seconds

        for provider in self.providers:
            if provider.name in self._disabled:
                continue
            if self._resting_until.get(provider.name, 0.0) > self.now():
                failures.append(f"{provider.name}: resting")
                continue

            seconds_left = deadline - self.now()
            if seconds_left <= 0:
                failures.append("out of time")
                break

            try:
                text = self.call(provider, messages, min(seconds_left, self.provider_timeout_seconds))
            except ProviderBusy as error:
                # Rest this provider, then try the next one immediately: that is the whole point of the pool.
                self._resting_until[provider.name] = self.now() + self._next_rest(provider.name)
                failures.append(f"{provider.name}: {error}"[:120])
                continue
            except ProviderBroken as error:
                # A rejected key or an unknown model will not fix itself, so stop asking this one.
                self._disabled.add(provider.name)
                failures.append(f"{provider.name}: {error}"[:120])
                continue

            self._failures_in_a_row[provider.name] = 0  # one success forgives earlier failures
            # The pool chose the provider, so the pool labels the answer: a `call` can't get it wrong.
            return Generation(text, provider.name)

        raise AllProvidersFailed("Every chat provider failed: " + " | ".join(failures))

    def _next_rest(self, name: str) -> float:
        """Seconds to rest a provider that just failed: doubles with each failure in a row, up to a maximum."""
        failures = self._failures_in_a_row.get(name, 0) + 1
        self._failures_in_a_row[name] = failures
        return min(self.cooldown_seconds * 2 ** (failures - 1), self.max_cooldown_seconds)
