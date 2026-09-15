"""
What it does:  Exposes the RAG pipeline over HTTP: GET /health, POST /ask, POST /transcribe.
Concept:       Model serving: the embedding model stays loaded in this long-running process, so each
               request only pays for inference. Only our Next.js server may call it. It proves that with a
               shared secret in the Authorization header ("Bearer <SERVICE_TOKEN>").
Why this design: Thin endpoints, the same rule as the web app's route.ts files: check the token -> call one
               pipeline function -> return JSON. Request/response shapes are Pydantic models, which
               validate input and document the API at /docs.
Inputs/Outputs: JSON / uploaded audio -> JSON.
Run locally:   uvicorn api.main:app --reload
Common pitfalls:
  - Comparing tokens with == (timing attacks). Use secrets.compare_digest.
  - Loading the model on the first request (a slow first answer). Warm it up at startup.
"""

import secrets

from fastapi import Depends, FastAPI, Header, HTTPException, UploadFile
from pydantic import BaseModel

from config import SERVICE_TOKEN
from rag.answer import answer_question
from speech.transcribe import transcribe

app = FastAPI(title="VietCorner AI service")


class AskRequest(BaseModel):
    question: str


class SourceResponse(BaseModel):
    document: str
    page_number: int
    similarity: float


class AskResponse(BaseModel):
    text: str
    sources: list[SourceResponse]
    timings: dict[str, float]


class TranscribeResponse(BaseModel):
    text: str


def require_token(authorization: str | None = Header(default=None)) -> None:
    """FastAPI dependency: allow the request only with "Authorization: Bearer <SERVICE_TOKEN>".

    TODO(M6):
      1. expected = f"Bearer {SERVICE_TOKEN}"
      2. If SERVICE_TOKEN is empty, or authorization is None, or not secrets.compare_digest(authorization, expected):
         raise HTTPException(status_code=401, detail="Invalid or missing token")
    """
    raise NotImplementedError("M6: implement require_token")


@app.get("/health")
def health() -> dict[str, str]:
    """Liveness check for uptime monitors and deploy scripts. No token needed, no secrets revealed."""
    return {"status": "ok"}


@app.post("/ask", dependencies=[Depends(require_token)])
def ask(request: AskRequest) -> AskResponse:
    """Answer a text question.

    TODO(M6):
      1. question = request.question.strip(). If empty: raise HTTPException(400, "question is required")
      2. answer = answer_question(question)
      3. Return AskResponse(text=answer.text, sources=[SourceResponse(**vars(s)) for s in answer.sources],
                            timings=answer.timings)
    """
    raise NotImplementedError("M6: implement ask")


@app.post("/transcribe", dependencies=[Depends(require_token)])
async def transcribe_audio(audio: UploadFile) -> TranscribeResponse:
    """Transcribe an uploaded recording (multipart form field named "audio").

    TODO(M6):
      1. data = await audio.read()
      2. text = transcribe(data, audio.filename or "recording.webm")
      3. Return TranscribeResponse(text=text)
    """
    raise NotImplementedError("M6: implement transcribe_audio")
