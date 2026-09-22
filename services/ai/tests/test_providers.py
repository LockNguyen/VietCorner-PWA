"""M5: the provider rotation. Pure logic, tested with fakes: no keys, no network, no waiting."""

import pytest

from rag.providers import (
    AllProvidersFailed,
    Provider,
    ProviderBroken,
    ProviderBusy,
    ProviderPool,
)

ALPHA = Provider("alpha", "https://alpha.test/v1", "key-a", "model-a")
BETA = Provider("beta", "https://beta.test/v1", "key-b", "model-b")

MESSAGES = [{"role": "user", "content": "hi"}]


class FakeClock:
    """Time that only moves when a test says so."""

    def __init__(self) -> None:
        self.seconds = 0.0

    def __call__(self) -> float:
        return self.seconds


def pool(call, clock=None, providers=(ALPHA, BETA)) -> ProviderPool:
    return ProviderPool(
        providers=list(providers),
        call=call,
        cooldown_seconds=60,
        deadline_seconds=7,
        provider_timeout_seconds=4,
        now=clock or FakeClock(),
    )


def test_asks_the_first_provider_while_it_is_healthy():
    used = []
    rotation = pool(lambda provider, messages, seconds: used.append(provider.name) or "ok")

    rotation.generate(MESSAGES)
    rotation.generate(MESSAGES)
    rotation.generate(MESSAGES)

    assert used == ["alpha", "alpha", "alpha"], "the list is an order of preference, not a rota"


def test_labels_each_answer_with_the_provider_that_wrote_it():
    def call(provider, messages, seconds):
        if provider.name == "alpha" and not answers:
            raise ProviderBusy("rate limited (HTTP 429)")
        return f"text from {provider.name}"

    answers = []
    clock = FakeClock()
    rotation = pool(call, clock)
    answers.append(rotation.generate(MESSAGES))  # alpha busy -> beta
    clock.seconds = 61
    answers.append(rotation.generate(MESSAGES))  # alpha rested -> alpha

    # Each label travels with its own answer. Nothing is read back from the shared pool afterwards.
    assert [(a.text, a.provider) for a in answers] == [("text from beta", "beta"), ("text from alpha", "alpha")]


def test_falls_over_to_the_next_provider_when_one_is_busy():
    def call(provider, messages, seconds):
        if provider.name == "alpha":
            raise ProviderBusy("rate limited (HTTP 429)")
        return "from beta"

    generation = pool(call).generate(MESSAGES)

    assert generation.text == "from beta"
    assert generation.provider == "beta"


def test_rests_a_busy_provider_until_the_cooldown_passes():
    calls = []

    def call(provider, messages, seconds):
        calls.append(provider.name)
        if provider.name == "alpha" and len(calls) == 1:
            raise ProviderBusy("no answer within 7.0 s")  # a timeout is temporary, like a rate limit
        return "ok"

    clock = FakeClock()
    rotation = pool(call, clock)

    rotation.generate(MESSAGES)  # alpha is busy, beta answers
    calls.clear()
    rotation.generate(MESSAGES)  # alpha is still resting, so it is not even tried
    assert calls == ["beta"]

    clock.seconds = 61  # the cooldown has passed: alpha is back, not gone for good
    calls.clear()
    rotation.generate(MESSAGES)
    assert "alpha" in calls


def test_a_provider_that_keeps_failing_rests_longer_each_time():
    clock = FakeClock()
    alpha_down = True
    calls = []

    def call(provider, messages, seconds):
        calls.append(provider.name)
        if provider.name == "alpha" and alpha_down:
            raise ProviderBusy("no answer within 4.0 s")
        return "ok"

    rotation = pool(call, clock)

    def alpha_asked_at(second: float) -> bool:
        clock.seconds = second
        calls.clear()
        rotation.generate(MESSAGES)
        return "alpha" in calls

    assert alpha_asked_at(0)  # fails: rest 60 s
    assert not alpha_asked_at(59)
    assert alpha_asked_at(60)  # fails again: rest 120 s
    assert not alpha_asked_at(179)
    assert alpha_asked_at(180)  # fails again: rest 240 s
    assert not alpha_asked_at(419)

    alpha_down = False
    assert alpha_asked_at(420)  # recovers: one success forgives the failures...
    alpha_down = True
    assert alpha_asked_at(421)  # ...so the next failure rests only 60 s again
    assert alpha_asked_at(481)


def test_rest_never_exceeds_the_maximum():
    rotation = pool(lambda provider, messages, seconds: "ok")
    rotation.max_cooldown_seconds = 900
    rests = [rotation._next_rest("alpha") for _ in range(8)]

    assert rests == [60, 120, 240, 480, 900, 900, 900, 900]


def test_a_slow_provider_cannot_hide_the_healthy_one_behind_it():
    """Regression, 2026-09-22: gemini and openrouter timed out in a row, so the request ran out of time before
    reaching groq, which was healthy. With groq first, a slow fallback can't stand in its way."""
    clock = FakeClock()
    groq = Provider("groq", "u", "k", "m")
    gemini = Provider("gemini", "u", "k", "m")

    def call(provider, messages, seconds):
        if provider.name == "gemini":
            clock.seconds += seconds
            raise ProviderBusy("no answer")
        return "Xin chào!"

    rotation = pool(call, clock, providers=(groq, gemini))
    answers = [rotation.generate(MESSAGES).provider for _ in range(5)]

    assert answers == ["groq"] * 5


def test_stops_asking_a_provider_that_is_broken():
    calls = []

    def call(provider, messages, seconds):
        calls.append(provider.name)
        if provider.name == "alpha":
            raise ProviderBroken("HTTP 404: model not found")
        return "ok"

    clock = FakeClock()
    rotation = pool(call, clock)
    rotation.generate(MESSAGES)
    clock.seconds = 3600  # even an hour later
    calls.clear()
    rotation.generate(MESSAGES)

    assert calls == ["beta"], "a dead model id should be dropped, not retried forever"


def test_lets_a_bug_in_our_code_crash_instead_of_blaming_the_provider():
    def call(provider, messages, seconds):
        raise TypeError("our own mistake")

    with pytest.raises(TypeError):
        pool(call).generate(MESSAGES)


def test_one_stuck_provider_cannot_use_the_whole_budget():
    clock = FakeClock()
    offered = []

    def call(provider, messages, seconds):
        offered.append((provider.name, seconds))
        if provider.name == "alpha":
            clock.seconds += seconds  # alpha is stuck and uses every second it was given
            raise ProviderBusy("no answer")
        return "ok"

    generation = pool(call, clock).generate(MESSAGES)

    assert offered == [("alpha", 4), ("beta", 3)]  # capped at 4, then beta gets what is left of 7
    assert generation.provider == "beta"


def test_stops_trying_when_the_deadline_has_passed():
    clock = FakeClock()
    calls = []

    def call(provider, messages, seconds):
        calls.append(provider.name)
        clock.seconds += 7  # alpha used the whole budget
        raise ProviderBusy("no answer")

    with pytest.raises(AllProvidersFailed, match="out of time"):
        pool(call, clock).generate(MESSAGES)

    assert calls == ["alpha"], "beta must not be started after the deadline"


def test_raises_with_every_reason_when_all_providers_fail():
    def call(provider, messages, seconds):
        raise ProviderBusy("rate limited (HTTP 429)")

    with pytest.raises(AllProvidersFailed) as failure:
        pool(call).generate(MESSAGES)

    assert "alpha" in str(failure.value) and "beta" in str(failure.value)


def test_raises_a_helpful_error_when_nothing_is_configured():
    with pytest.raises(RuntimeError, match="No chat providers"):
        pool(lambda provider, messages, seconds: "ok", providers=()).generate(MESSAGES)
