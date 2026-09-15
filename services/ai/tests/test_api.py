"""M6: HTTP API, with the pipeline replaced by fakes."""

import pytest
from fastapi.testclient import TestClient

import api.main as main
from domain import Answer, Source

AUTH = {"Authorization": "Bearer test-token"}


@pytest.fixture
def client(monkeypatch: pytest.MonkeyPatch) -> TestClient:
    monkeypatch.setattr(main, "SERVICE_TOKEN", "test-token")
    monkeypatch.setattr(main, "answer_question", lambda question: Answer("Yes [1].", [Source("doc.pdf", 2, 0.9)], {"embed_ms": 1.0}))
    monkeypatch.setattr(main, "transcribe", lambda audio, filename: "xin chào")
    return TestClient(main.app)


def test_health_needs_no_token(client):
    assert client.get("/health").json() == {"status": "ok"}


def test_ask_rejects_a_missing_token(client):
    assert client.post("/ask", json={"question": "hi"}).status_code == 401


def test_ask_rejects_a_wrong_token(client):
    response = client.post("/ask", json={"question": "hi"}, headers={"Authorization": "Bearer wrong"})
    assert response.status_code == 401


def test_ask_rejects_a_blank_question(client):
    assert client.post("/ask", json={"question": "   "}, headers=AUTH).status_code == 400


def test_ask_returns_the_answer_with_sources_and_timings(client):
    response = client.post("/ask", json={"question": "Do volunteers need a check?"}, headers=AUTH)

    assert response.status_code == 200
    assert response.json() == {
        "text": "Yes [1].",
        "sources": [{"document": "doc.pdf", "page_number": 2, "similarity": 0.9}],
        "timings": {"embed_ms": 1.0},
    }


def test_transcribe_returns_the_text_of_an_uploaded_recording(client):
    files = {"audio": ("question.webm", b"fake audio bytes", "audio/webm")}
    response = client.post("/transcribe", files=files, headers=AUTH)

    assert response.status_code == 200
    assert response.json() == {"text": "xin chào"}
