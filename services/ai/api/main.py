"""
What it does:  Exposes the RAG pipeline over HTTP: GET /health, POST /ask, POST /transcribe.
Concept:       Model serving: the embedding model stays loaded in this long-running process, so each
               request only pays for inference. Only our Next.js server may call it. It proves that with a
               shared secret in the Authorization header ("Bearer <SERVICE_TOKEN>").
Why this design: Thin endpoints, the same rule as the web app's route.ts files: check the token -> call one
               pipeline function -> return JSON. Request/response shapes are Pydantic models, which
               validate input (and document the API at /docs when SHOW_API_DOCS=1).
               Every route is a plain `def`: FastAPI runs it on a worker thread, so a slow network call
               never freezes the other requests (see the sync decision in architecture.md).
Inputs/Outputs: JSON / uploaded audio -> JSON. One log line per request (never the question text: it is private).
Run locally:   uvicorn api.main:app --reload
Common pitfalls:
  - Comparing tokens with == (timing attacks). Use secrets.compare_digest, on bytes.
  - Loading the model on the first request (a slow first answer). Warm it up at startup.
  - `async def` around a blocking call: it freezes every request until the call returns.
"""

import logging
import secrets
from typing import Literal
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from dataclasses import asdict

from fastapi import Depends, FastAPI, Header, HTTPException, UploadFile
from pydantic import BaseModel, Field

from config import (
    DB_CONNECT_TIMEOUT_SECONDS,
    MAX_HISTORY_TURNS,
    MAX_AUDIO_BYTES,
    MAX_QUESTION_CHARS,
    SERVICE_TOKEN,
    SHOW_API_DOCS,
)
from domain import Turn
from rag.answer import answer_question
from rag.condense import condense_question
from rag.embeddings import embed_query
from rag.providers import AllProvidersFailed
from rag.store import connection_pool
from speech.transcribe import SpeechUnavailable, transcribe

# Libraries log warnings only (at INFO, httpx prints every HTTP request we make); our own lines log at INFO.
logging.basicConfig(level=logging.WARNING, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
log = logging.getLogger("vietcorner.api")
log.setLevel(logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Runs once at startup (before `yield`) and once at shutdown (after it)."""
    # Load bge-m3 and run one inference now, so the first real question doesn't pay ~4 s for it.
    # Blocking inside async def is fine here because during startup there aren't any requests yet.
    embed_query("warm up")
    # Opening the pool doesn't wait for a connection, so a wrong DATABASE_URL would look healthy until the
    # first question hung for 30 s. wait() makes startup fail right away instead.
    connection_pool().wait(timeout=DB_CONNECT_TIMEOUT_SECONDS)
    yield
    connection_pool().close()  # shutdown: hand connections back to Supabase cleanly


app = FastAPI(
    title="VietCorner AI service",
    lifespan=lifespan,
    docs_url="/docs" if SHOW_API_DOCS else None,
    redoc_url=None,
    openapi_url="/openapi.json" if SHOW_API_DOCS else None,
)


class HistoryTurn(BaseModel):
    role: Literal["user", "assistant"]
    text: str = Field(max_length=MAX_QUESTION_CHARS)


class AskRequest(BaseModel):
    question: str = Field(max_length=MAX_QUESTION_CHARS)  # too long -> FastAPI answers 422 by itself
    # Earlier turns, oldest first. Only used to rewrite a follow-up into a standalone question (M7);
    # the answer itself still comes from the documents alone. Sources are not sent back: they add tokens
    # and say nothing about what "it" or "that group" meant.
    history: list[HistoryTurn] = Field(default_factory=list, max_length=MAX_HISTORY_TURNS)


class SourceResponse(BaseModel):
    document: str
    page_number: int
    similarity: float


class AskResponse(BaseModel):
    text: str
    provider: str
    sources: list[SourceResponse]
    timings: dict[str, float]


class TranscribeResponse(BaseModel):
    text: str


def require_token(authorization: str | None = Header(default=None)) -> None:
    """FastAPI dependency: allow the request only with "Authorization: Bearer <SERVICE_TOKEN>"."""
    expected = f"Bearer {SERVICE_TOKEN}"

    if (
        not SERVICE_TOKEN
        or not authorization
        or not secrets.compare_digest(authorization.encode(), expected.encode())
    ):
        raise HTTPException(status_code=401, detail="Invalid or missing token.")


@app.get("/health")
def health() -> dict[str, str]:
    """Liveness check for uptime monitors and deploy scripts. No token needed, no secrets revealed."""
    return {"status": "ok"}


@app.post("/ask", dependencies=[Depends(require_token)])
def ask(request: AskRequest) -> AskResponse:
    """Answer a text question, resolving a follow-up against the conversation it belongs to."""
    question = request.question.strip()

    if not question:
        raise HTTPException(status_code=400, detail="Question is required.")

    # "Còn nhóm khác thì sao?" means nothing to a search index, so fold the conversation into the question
    # first. With no history this returns the question unchanged and costs nothing.
    history = [Turn(turn.role, turn.text) for turn in request.history]
    searchable = condense_question(question, history)

    try:
        answer = answer_question(searchable)
    except AllProvidersFailed as error:
        log.warning("ask 503 chars=%d reasons=%s", len(question), error)
        # Temporary (rate limits): tell the caller to retry, instead of a 500 that looks like a bug.
        raise HTTPException(
            status_code=503, detail="All AI providers are busy. Try again in a minute."
        )

    timings = " ".join(f"{name}={value:.0f}" for name, value in answer.timings.items())
    # Log whether the rewrite changed the question: that is how we tell a bad follow-up answer from bad
    # retrieval. The text itself is never logged, because church members' questions are private.
    log.info("ask 200 provider=%s chars=%d history=%d rewritten=%s sources=%d %s",
             answer.provider or "(refused)", len(question), len(history), searchable != question,
             len(answer.sources), timings)
    return AskResponse(
        text=answer.text,
        provider=answer.provider,
        sources=[SourceResponse(**asdict(source)) for source in answer.sources],
        timings=answer.timings,
    )


@app.post("/transcribe", dependencies=[Depends(require_token)])
def transcribe_audio(audio: UploadFile) -> TranscribeResponse:
    """Transcribe an uploaded recording (multipart form field named "audio")."""
    # Read one byte past the limit: enough to know it's too big, without reading a huge file.
    data = audio.file.read(MAX_AUDIO_BYTES + 1)
    if not data:
        raise HTTPException(status_code=400, detail="Audio is empty.")
    if len(data) > MAX_AUDIO_BYTES:
        raise HTTPException(status_code=413, detail="Audio is too large.")

    try:
        text = transcribe(audio=data, filename=audio.filename or "recording.webm")
    except SpeechUnavailable as error:
        log.warning("transcribe 503 bytes=%d reason=%s", len(data), error)
        raise HTTPException(
            status_code=503, detail="Speech recognition is busy. Try again in a minute."
        )

    log.info("transcribe 200 bytes=%d transcript_chars=%d", len(data), len(text))
    return TranscribeResponse(text=text)
