"""M6: translating SDK errors for the pool, and the hard deadline on one call. No keys, no network."""

import time

import httpx2  # the HTTP library the OpenAI SDK is built on; its errors carry these request/response objects
import openai
import pytest

import rag.generate as generate
from rag.providers import Provider, ProviderBroken, ProviderBusy

PROVIDER = Provider("fake", "https://fake.test/v1", "key", "model")
REQUEST = httpx2.Request("POST", "https://fake.test/v1/chat/completions")


def http_error(status_code: int) -> openai.APIStatusError:
    return openai.APIStatusError("boom", response=httpx2.Response(status_code, request=REQUEST), body=None)


@pytest.mark.parametrize("status_code", [408, 409, 429, 500, 502, 503])
def test_temporary_http_errors_mean_busy(status_code):
    assert isinstance(generate.classify_error(http_error(status_code)), ProviderBusy)


@pytest.mark.parametrize("status_code", [400, 401, 403, 404])
def test_wrong_key_or_model_means_broken(status_code):
    assert isinstance(generate.classify_error(http_error(status_code)), ProviderBroken)


def test_timeouts_and_network_errors_mean_busy():
    assert isinstance(generate.classify_error(openai.APITimeoutError(request=REQUEST)), ProviderBusy)
    assert isinstance(generate.classify_error(openai.APIConnectionError(request=REQUEST)), ProviderBusy)


def test_stops_waiting_at_the_deadline_even_if_the_provider_never_finishes(monkeypatch):
    def keeps_sending_keep_alive_bytes(provider, messages):
        time.sleep(2)  # an HTTP timeout would never fire here: bytes keep arriving
        return "too late"

    monkeypatch.setattr(generate, "complete", keeps_sending_keep_alive_bytes)

    start = time.perf_counter()
    with pytest.raises(ProviderBusy, match="no answer within"):
        generate.call_provider(PROVIDER, [], seconds=0.2)

    assert time.perf_counter() - start < 1


def test_translates_sdk_errors_raised_inside_the_background_call(monkeypatch):
    def rejects_the_key(provider, messages):
        raise http_error(401)

    monkeypatch.setattr(generate, "complete", rejects_the_key)

    with pytest.raises(ProviderBroken, match="HTTP 401"):
        generate.call_provider(PROVIDER, [], seconds=1)


def test_an_empty_answer_lets_the_next_provider_try(monkeypatch):
    class EmptyReply:
        choices = [type("Choice", (), {"message": type("Message", (), {"content": None})()})()]

    class Completions:
        def create(self, **kwargs):
            return EmptyReply()

    class Client:
        chat = type("Chat", (), {"completions": Completions()})()

    monkeypatch.setattr(generate, "client_for", lambda base_url, api_key: Client())

    with pytest.raises(ProviderBusy, match="empty answer"):
        generate.call_provider(PROVIDER, [], seconds=1)
