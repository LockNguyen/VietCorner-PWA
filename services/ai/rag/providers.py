"""
What it does:  Holds the list of chat providers and hands out the next usable one, skipping any provider that
               recently hit its rate limit.
Concept:       Every free tier caps tokens per minute. One provider therefore throttles quickly, but several
               free tiers together rarely do: while one is cooling down, the next answers. Because almost every
               provider speaks the OpenAI chat format, they differ only by base URL, key and model id, so they
               can be data in a config list instead of code.
Why this design: The pool takes the actual network call as a parameter (`call`), so the rotation, the cooldown
               and the failover can be tested with fakes, without a key or a network. The pool knows nothing
               about Groq, Gemini or OpenRouter: it only knows Provider records.
Inputs/Outputs: config.CHAT_PROVIDERS + environment keys -> a working answer, or an error naming every failure.
Common pitfalls:
  - Treating every error as a rate limit. A wrong model id would then silently rotate forever; it is disabled
    for the process instead.
  - Forgetting that each provider has its own model id. "The model" and "the provider" travel together.
"""

import time
from collections.abc import Callable
from dataclasses import dataclass, field

from config import CHAT_PROVIDERS, PROVIDER_COOLDOWN_SECONDS

RATE_LIMIT_MARKERS = ("429", "rate limit", "rate_limit", "quota", "resource exhausted", "too many requests")


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


def is_rate_limit(error: Exception) -> bool:
    """True when the provider is telling us to slow down, rather than that we asked for something impossible."""
    message = f"{type(error).__name__}: {error}".lower()
    return any(marker in message for marker in RATE_LIMIT_MARKERS)


@dataclass
class ProviderPool:
    """Cycles through providers, resting the ones that hit their limit."""

    providers: list[Provider]
    call: Callable[[Provider, list[dict[str, str]]], str]
    cooldown_seconds: float = PROVIDER_COOLDOWN_SECONDS
    now: Callable[[], float] = time.monotonic  # injected so tests can move time without sleeping
    _next_index: int = 0
    _resting_until: dict[str, float] = field(default_factory=dict)
    _disabled: set[str] = field(default_factory=set)
    last_provider_name: str = ""

    def generate(self, messages: list[dict[str, str]]) -> str:
        """Try providers in turn until one answers. Raises RuntimeError only when all of them failed."""
        if not self.providers:
            raise RuntimeError("No chat providers configured. Add a key to .env (see config.CHAT_PROVIDERS).")

        failures: list[str] = []
        for offset in range(len(self.providers)):
            provider = self.providers[(self._next_index + offset) % len(self.providers)]
            if provider.name in self._disabled:
                continue
            if self._resting_until.get(provider.name, 0.0) > self.now():
                failures.append(f"{provider.name}: resting")
                continue

            try:
                answer = self.call(provider, messages)
            except Exception as error:
                if is_rate_limit(error):
                    # Rest this provider, then try the next one immediately: that is the whole point of the pool.
                    self._resting_until[provider.name] = self.now() + self.cooldown_seconds
                    failures.append(f"{provider.name}: rate limited")
                else:
                    # A bad model id or a rejected key will not fix itself, so stop asking this one.
                    self._disabled.add(provider.name)
                    failures.append(f"{provider.name}: {type(error).__name__}: {error}"[:120])
                continue

            # Start the next request one provider further along, so load spreads instead of piling on the first.
            self._next_index = (self._next_index + offset + 1) % len(self.providers)
            self.last_provider_name = provider.name
            return answer

        raise RuntimeError("Every chat provider failed: " + " | ".join(failures))
