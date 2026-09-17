"""M5: the provider rotation. Pure logic, tested with fakes: no keys, no network, no waiting."""

import pytest

from rag.providers import Provider, ProviderPool, is_rate_limit

ALPHA = Provider("alpha", "https://alpha.test/v1", "key-a", "model-a")
BETA = Provider("beta", "https://beta.test/v1", "key-b", "model-b")

MESSAGES = [{"role": "user", "content": "hi"}]


class FakeClock:
    """Time that only moves when a test says so."""

    def __init__(self) -> None:
        self.seconds = 0.0

    def __call__(self) -> float:
        return self.seconds


class RateLimited(Exception):
    """Looks like what a provider raises when you exceed its tokens per minute."""

    def __init__(self) -> None:
        super().__init__("Error code: 429 - rate limit reached for model")


def pool(call, clock=None, providers=(ALPHA, BETA)) -> ProviderPool:
    return ProviderPool(providers=list(providers), call=call, cooldown_seconds=60, now=clock or FakeClock())


def test_recognises_rate_limits_but_not_other_errors():
    assert is_rate_limit(RateLimited())
    assert is_rate_limit(Exception("RESOURCE_EXHAUSTED: quota"))
    assert not is_rate_limit(Exception("model_not_found: no such model"))


def test_spreads_requests_across_providers():
    used = []
    rotation = pool(lambda provider, messages: used.append(provider.name) or "ok")

    rotation.generate(MESSAGES)
    rotation.generate(MESSAGES)
    rotation.generate(MESSAGES)

    assert used == ["alpha", "beta", "alpha"]


def test_falls_over_to_the_next_provider_when_one_is_rate_limited():
    def call(provider, messages):
        if provider.name == "alpha":
            raise RateLimited()
        return "from beta"

    rotation = pool(call)

    assert rotation.generate(MESSAGES) == "from beta"
    assert rotation.last_provider_name == "beta"


def test_rests_a_rate_limited_provider_until_the_cooldown_passes():
    calls = []

    def call(provider, messages):
        calls.append(provider.name)
        if provider.name == "alpha" and len(calls) == 1:
            raise RateLimited()
        return "ok"

    clock = FakeClock()
    rotation = pool(call, clock)

    rotation.generate(MESSAGES)  # alpha is rate limited, beta answers
    calls.clear()
    rotation.generate(MESSAGES)  # alpha is still resting, so it is not even tried
    assert calls == ["beta"]

    clock.seconds = 61  # the cooldown has passed
    calls.clear()
    rotation.generate(MESSAGES)
    assert "alpha" in calls


def test_stops_asking_a_provider_whose_error_will_not_fix_itself():
    calls = []

    def call(provider, messages):
        calls.append(provider.name)
        if provider.name == "alpha":
            raise Exception("model_not_found: decommissioned")
        return "ok"

    rotation = pool(call)
    rotation.generate(MESSAGES)
    calls.clear()
    rotation.generate(MESSAGES)

    assert calls == ["beta"], "a dead model id should be dropped, not retried forever"


def test_raises_with_every_reason_when_all_providers_fail():
    def call(provider, messages):
        raise RateLimited()

    with pytest.raises(RuntimeError) as failure:
        pool(call).generate(MESSAGES)

    assert "alpha" in str(failure.value) and "beta" in str(failure.value)


def test_raises_a_helpful_error_when_nothing_is_configured():
    with pytest.raises(RuntimeError, match="No chat providers"):
        pool(lambda provider, messages: "ok", providers=()).generate(MESSAGES)
