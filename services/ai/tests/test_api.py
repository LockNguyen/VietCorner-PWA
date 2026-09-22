"""M6: HTTP API, with the pipeline replaced by fakes."""

import pytest
from fastapi.testclient import TestClient

import api.main as main
from config import MAX_HISTORY_TURNS, MAX_QUESTION_CHARS
from domain import Answer, Source
from rag.providers import AllProvidersFailed
from speech.transcribe import SpeechUnavailable

AUTH = {"Authorization": "Bearer test-token"}


@pytest.fixture
def client(monkeypatch: pytest.MonkeyPatch) -> TestClient:
    monkeypatch.setattr(main, "SERVICE_TOKEN", "test-token")
    monkeypatch.setattr(
        main,
        "answer_question",
        lambda question: Answer(
            "Yes [1].", "fake-llm-model", [Source("doc.pdf", 2, 0.9)], {"embed_ms": 1.0}
        ),
    )

    def fake_transcribe(audio: bytes, filename: str) -> str:
        assert isinstance(audio, bytes), "the route must pass the recording's bytes"
        return "xin chào"

    monkeypatch.setattr(main, "transcribe", fake_transcribe)

    return TestClient(main.app)


def test_health_needs_no_token(client):
    assert client.get("/health").json() == {"status": "ok"}


def test_ask_rejects_a_missing_token(client):
    assert client.post("/ask", json={"question": "hi"}).status_code == 401


def test_ask_rejects_a_wrong_token(client):
    response = client.post(
        "/ask", json={"question": "hi"}, headers={"Authorization": "Bearer wrong"}
    )
    assert response.status_code == 401


def test_ask_rejects_a_blank_question(client):
    assert (
        client.post("/ask", json={"question": "   "}, headers=AUTH).status_code == 400
    )


def test_ask_returns_the_answer_with_sources_and_timings(client):
    response = client.post(
        "/ask", json={"question": "Do volunteers need a check?"}, headers=AUTH
    )

    assert response.status_code == 200
    assert response.json() == {
        "text": "Yes [1].",
        "provider": "fake-llm-model",
        "sources": [{"document": "doc.pdf", "page_number": 2, "similarity": 0.9}],
        "timings": {"embed_ms": 1.0},
    }


def test_transcribe_returns_the_text_of_an_uploaded_recording(client):
    files = {"audio": ("question.webm", b"fake audio bytes", "audio/webm")}
    response = client.post("/transcribe", files=files, headers=AUTH)

    assert response.status_code == 200
    assert response.json() == {"text": "xin chào"}


def test_ask_rejects_a_token_with_non_ascii_characters(client):
    headers = {"Authorization": "Bearer é".encode("latin-1")}
    assert client.post("/ask", json={"question": "hi"}, headers=headers).status_code == 401


def test_ask_rejects_a_question_that_is_too_long(client):
    too_long = "x" * (MAX_QUESTION_CHARS + 1)
    assert client.post("/ask", json={"question": too_long}, headers=AUTH).status_code == 422


def test_ask_says_try_again_when_every_provider_is_busy(client, monkeypatch):
    def busy(question):
        raise AllProvidersFailed("groq: rate limited")

    monkeypatch.setattr(main, "answer_question", busy)
    assert client.post("/ask", json={"question": "hi"}, headers=AUTH).status_code == 503


def test_transcribe_rejects_empty_audio(client):
    files = {"audio": ("question.webm", b"", "audio/webm")}
    assert client.post("/transcribe", files=files, headers=AUTH).status_code == 400


def test_transcribe_rejects_audio_that_is_too_large(client, monkeypatch):
    monkeypatch.setattr(main, "MAX_AUDIO_BYTES", 10)
    files = {"audio": ("question.webm", b"x" * 11, "audio/webm")}
    assert client.post("/transcribe", files=files, headers=AUTH).status_code == 413


def test_transcribe_says_try_again_when_whisper_is_busy(client, monkeypatch):
    def busy(audio, filename):
        raise SpeechUnavailable("rate limited")

    monkeypatch.setattr(main, "transcribe", busy)
    files = {"audio": ("question.webm", b"fake audio bytes", "audio/webm")}
    assert client.post("/transcribe", files=files, headers=AUTH).status_code == 503


def test_ask_rewrites_a_follow_up_before_answering(client, monkeypatch):
    asked = []
    monkeypatch.setattr(main, "condense_question", lambda question, history: f"{question} (about {history[0].text})")
    monkeypatch.setattr(main, "answer_question", lambda question: asked.append(question) or Answer(
        "Yes [1].", "fake-llm-model", [Source("doc.pdf", 2, 0.9)], {"embed_ms": 1.0}
    ))

    response = client.post(
        "/ask",
        json={"question": "What about the other one?", "history": [{"role": "user", "text": "Come and See groups"}]},
        headers=AUTH,
    )

    assert response.status_code == 200
    assert asked == ["What about the other one? (about Come and See groups)"], "retrieval must see the rewrite"


def test_ask_rejects_more_history_than_we_asked_for(client):
    history = [{"role": "user", "text": "hi"}] * (MAX_HISTORY_TURNS + 1)

    response = client.post("/ask", json={"question": "hi", "history": history}, headers=AUTH)

    assert response.status_code == 422
