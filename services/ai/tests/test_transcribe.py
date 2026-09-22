"""M6: Whisper errors are sorted into "try again" (SpeechUnavailable) and "our mistake" (raised as-is)."""

import groq
import httpx2  # the HTTP library the Groq SDK is built on; its errors carry these request/response objects
import pytest

import speech.transcribe as speech

REQUEST = httpx2.Request("POST", "https://api.groq.test/openai/v1/audio/transcriptions")


def client_raising(error: Exception):
    """A stand-in for the Groq client whose transcription call raises `error`."""

    class Transcriptions:
        def create(self, **kwargs):
            raise error

    class Audio:
        transcriptions = Transcriptions()

    class Client:
        audio = Audio()

    return lambda: Client()


@pytest.mark.parametrize("error", [
    groq.APITimeoutError(request=REQUEST),
    groq.RateLimitError("slow down", response=httpx2.Response(429, request=REQUEST), body=None),
    groq.InternalServerError("oops", response=httpx2.Response(503, request=REQUEST), body=None),
])
def test_temporary_groq_trouble_becomes_speech_unavailable(monkeypatch, error):
    monkeypatch.setattr(speech, "client", client_raising(error))

    with pytest.raises(speech.SpeechUnavailable):
        speech.transcribe(b"audio", "q.webm")


def test_a_rejected_key_is_not_hidden_as_temporary(monkeypatch):
    error = groq.AuthenticationError("bad key", response=httpx2.Response(401, request=REQUEST), body=None)
    monkeypatch.setattr(speech, "client", client_raising(error))

    with pytest.raises(groq.AuthenticationError):
        speech.transcribe(b"audio", "q.webm")
