---
# Hugging Face Space settings (read only by Hugging Face; GitHub shows them as a small table).
# sdk: docker -> build the Dockerfile in this folder. app_port -> the port uvicorn listens on (EXPOSE 8000).
title: VietCorner AI
emoji: ⛪
colorFrom: yellow
colorTo: red
sdk: docker
app_port: 8000
pinned: false
---

# VietCorner AI Service: a hands-on RAG course

A small Python service that answers church members' questions from policy and training PDFs, in Vietnamese or English. You build it yourself, one milestone at a time.

```
OFFLINE  PDF ─► extract_pages ─► chunk_pages ─► embed_passages ─► document_chunks (Postgres + pgvector)
ONLINE   question ─► embed_query ─► search_chunks ─► build_prompt ─► generate_answer ─► Answer(text, provider, sources, timings)
```

The Next.js app calls this service from its server (never from the browser) with a shared token. Full system docs: `.claude/architecture.md` → 6.4 assistant.

## How this course works
- Every function you write is marked `TODO(M#)` and raises `NotImplementedError`. Its docstring lists the steps.
- Every module starts with the same header: **What it does → Concept → Why this design → Inputs/Outputs → Common pitfalls.** Read the header before the code.
- Tests already exist. A milestone is done when its tests pass and its checkpoint works. Then ask for a review ("review M1").
- Rules of the codebase: pure logic is separate from I/O; all tunable numbers live in `config.py` with a reason; no RAG frameworks, so every stage is code you can read.

## Folder map
| Path | Role |
|---|---|
| `config.py` | Every constant and setting, each with a why |
| `domain.py` | Pipeline data types: `Page → Chunk → EmbeddedChunk → RetrievedChunk → Answer` |
| `ingest/` | Offline: PDFs → chunks in the database |
| `rag/` | Online: question → answer |
| `speech/` | Voice → text |
| `api/` | HTTP endpoints for the web app |
| `evaluation/` | Measure which embedding model works best on your documents. `questions.jsonl` and `answers/` are private: gitignored, on your PC only |
| `deploy/` | `push_to_space.py`: uploads only the files the Docker image needs to the Hugging Face Space |
| `tests/` | One test file per module. `sample_pdf.py` generates a bilingual test PDF |

## M0: Setup
1. Install **Python 3.12** and, on Windows, the **Microsoft Visual C++ Redistributable (x64)**. Without it, `import pymupdf` / `import torch` fail with "DLL load failed … The specified module could not be found". Then from `services/ai/` in PowerShell:
   ```
   python -m venv .venv
   .venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   copy .env.example .env
   pytest
   ```
   Expect every test to fail with `NotImplementedError`. That list is your to-do list.
2. Put the church PDFs in `services/ai/data/` (gitignored, never committed).
3. Create a Groq API key (console.groq.com) → `GROQ_API_KEY` in `.env`.
4. Start creating the Oracle Cloud Always Free account (needed in M6; approval can take time).

**Windows note:** printing Vietnamese can fail with `UnicodeEncodeError: charmap`, because the console uses an old code page. Force UTF-8 output: `$env:PYTHONIOENCODING="utf-8"` (PowerShell) or `export PYTHONIOENCODING=utf-8` (Git Bash).

## Chapters
Each chapter: **Goal · Concepts · You write · Checkpoint · Stretch.**

### M1: From PDF to chunks
- **Goal:** turn PDFs into small, citable pieces of text.
- **Concepts:** text layers vs. scanned images, Unicode NFC, sliding windows, overlap, metadata.
- **You write:** `ingest/extract.py` (`normalize_text`, `extract_pages`), `ingest/chunk.py` (`split_with_overlap`, `chunk_pages`).
- **Checkpoint:** `pytest tests/test_extract.py tests/test_chunk.py` passes. Run extraction on your real PDFs and print the page and chunk counts. **If a PDF yields no text, it's scanned** (tell Claude: OCR detour).
- **Stretch:** split on sentence boundaries instead of fixed word counts, and compare in M3.

### M2: Embeddings
- **Goal:** turn text into vectors where similar meaning means nearby vectors.
- **Concepts:** bi-encoders, normalization, cosine similarity = dot product, query vs. passage prefixes, loading a model once.
- **You write:** `rag/embeddings.py` (`embed_passages`, `embed_query`).
- **Checkpoint:** `pytest -m slow` passes (downloads bge-m3 the first time, ~2 GB). A Vietnamese question lands closer to the English passage about the same topic.
- **Stretch:** time `embed_query` 100 times and report p50/p95.

### M3: Evaluation before optimization
- **Goal:** choose the embedding model with evidence from YOUR documents.
- **Concepts:** Recall@k, MRR, latency percentiles, writing realistic test questions.
- **You write:** `evaluation/metrics.py` and `evaluation/run_eval.py`. `evaluation/questions.jsonl` is already written: 41 real questions (34 Vietnamese, 7 English twins, 8 unanswerable or wrong-premise ones), each labelled with every page that answers it. Review and correct the labels; they are your ground truth.
- **Checkpoint:** `python -m evaluation.run_eval` writes `evaluation/results.md` comparing the 3 models in `config.CANDIDATE_MODELS`, with recall per language and the highest similarity reached by an unanswerable question (that number sets `SIMILARITY_FLOOR`). The winner and its numbers go into architecture.md Key Decisions.
- **Stretch:** sweep `CHUNK_WORDS` (150 / 300 / 500) for the winning model.

### M4: The vector database
- **Goal:** store chunks and search them in Postgres.
- **Concepts:** pgvector, the `<=>` cosine distance, HNSW indexes, transactions, idempotent ingestion, server-only tables.
- **You write:** `rag/store.py` (`replace_document_chunks`, `search_chunks`), `ingest/run_ingest.py`. Claude provides `schema.sql`, and you run it in Supabase.
- **Checkpoint:** `python -m ingest.run_ingest` loads your PDFs. Running it twice leaves the same row count. Searching 3 questions returns sensible pages.
- **Stretch:** add a connection pool (`psycopg_pool`) and measure the difference.

### M5: Retrieval-augmented generation
- **Goal:** answer questions from the retrieved sources, with citations, or admit not knowing.
- **Concepts:** grounding, hallucination, citations, similarity floor, temperature, dependency injection for testing.
- **You write:** `rag/prompt.py` (including `SYSTEM_PROMPT`), `rag/generate.py`, `rag/answer.py`.
- **Checkpoint:** `pytest tests/test_prompt.py tests/test_answer.py` passes. `python -m rag.answer "…"` answers 5 of your eval questions. Grade each for correctness and citations. Pick `GROQ_CHAT_MODEL` by comparing 2 models on Vietnamese answers.
- **Stretch:** answer-quality evaluation (backlog B13).

### M6: Serving and deploying
- **Goal:** run the pipeline as an always-on HTTPS service.
- **Concepts:** model serving, bearer tokens, constant-time comparison, health checks, containers (images, layers, build cache), baking models into images, run-time secrets. Later on the Oracle VM: reverse proxy + TLS (Caddy), firewalls.
- **You write:** `speech/transcribe.py`, `api/main.py`. Claude provides the `Dockerfile` + `.dockerignore`. Deploy to a Hugging Face Space now, the Oracle VM later (same image).
- **Checkpoint:** `pytest tests/test_api.py` passes. `curl <url>/health` → ok, `/ask` without a token → 401, with a token → answer. Works for the local container and for the Space.

### M7: Voice in the app
- **Goal:** ask aloud on an iPhone and hear the answer.
- **Concepts:** MediaRecorder, audio formats (iOS mp4, Chrome webm), UI state machines, speech synthesis.
- **You write:** `src/features/assistant/hooks/useVoiceRecorder.ts`, `useAssistant.ts` (Claude provides routes and UI).
- **Checkpoint:** from the iPhone Home Screen app, a Vietnamese voice question gets a spoken, cited answer in under 10 seconds.

### M8: Documentation and release
Claude completes architecture.md §6.4 (glossary, failure behavior, decisions) and deploys.

### M9 (optional): Real-time voice with LiveKit Agents
Wrap `answer_question` as a tool in a LiveKit voice agent, then compare its latency with the M7 measurements. Only after M7, so you know exactly what the framework does for you.

## Commands
| Task | Command (from `services/ai/`, venv active) |
|---|---|
| Fast tests | `pytest` |
| Model tests | `pytest -m slow` |
| Database tests | `pytest -m db` |
| Evaluate models | `python -m evaluation.run_eval` |
| Ingest PDFs | `python -m ingest.run_ingest` |
| Ask from the terminal | `python -m rag.answer "your question"` |
| Compare chat providers | `python -m evaluation.compare_models` → `evaluation/answers/<timestamp>.md` |
| Inspect the database | `python -m evaluation.check_database` |
| Run the API | `uvicorn api.main:app --reload` → http://127.0.0.1:8000/docs |
| Build the image | `docker build -t vietcorner-ai .` |
| Run the image | `docker run --rm -p 8000:8000 --env-file .env vietcorner-ai` |
| Deploy to the Space | `python -m deploy.push_to_space <user>/<space>` (add `--dry-run` to list the files first) |

## Files
Every module, and the one thing it is responsible for. The module header inside each file says *what it does →
concept → why this design → inputs/outputs → common pitfalls*.

| File | Job |
|---|---|
| `config.py` | Every constant and setting, each with the reason above it |
| `domain.py` | The pipeline's data: `Page → Chunk → EmbeddedChunk → RetrievedChunk → Generation → Answer`, plus `Turn`, `Source` |
| `ingest/extract.py` | `normalize_text` (NFC + whitespace), `extract_pages` (PyMuPDF, skips blank pages, 1-based) |
| `ingest/chunk.py` | `split_with_overlap`, `chunk_pages` (word windows, never across pages) |
| `ingest/run_ingest.py` | PDFs in `data/` → chunks → embeddings → database, idempotent per document |
| `rag/embeddings.py` | `load_model` (cached), `embed_passages`, `embed_query` (normalized, per-model prefixes) |
| `rag/store.py` | pgvector SQL: `replace_document_chunks`, `search_chunks`, `connect` (scripts), `connection_pool` (the API) |
| `rag/condense.py` | Rewrites a follow-up into a standalone question from the last turns; falls back to the user's words |
| `rag/prompt.py` | `SYSTEM_PROMPT` and the grounded prompt with numbered sources |
| `rag/providers.py` | The provider list and the pool: preference order, `ProviderBusy` (rest, growing) vs `ProviderBroken` (drop), one deadline per request |
| `rag/generate.py` | One OpenAI-compatible client for every provider; translates SDK errors; enforces the per-call cutoff on a background thread |
| `rag/answer.py` | The recipe: embed → search → refuse or prompt → generate, with dependency injection and timings |
| `speech/transcribe.py` | Whisper on Groq: one cached client, a timeout, `SpeechUnavailable` for temporary trouble |
| `api/main.py` | FastAPI `/health`, `/ask`, `/transcribe`: bearer token, input limits, error mapping, startup warm-up |
| `evaluation/` | `metrics.py`, `run_eval.py` (model bake-off → `results.md`), `corpus.py` (cached vectors), `explain.py` (trace one question), `check_database.py`, `compare_models.py` |
| `deploy/push_to_space.py` | Uploads only the files the image needs to a Hugging Face Space (allowlist, no history) |
| `Dockerfile`, `.dockerignore` | The image: CPU-only torch, bge-m3 baked in, offline at run time, non-root, port 8000 |
| `tests/` | One file per module; `sample_pdf.py` generates a bilingual test PDF. Markers: `slow` (model), `db` (database) |

## Failure behavior
| Situation | Behavior | Why |
|---|---|---|
| Best chunk below `SIMILARITY_FLOOR` | Bilingual "not found", `provider: ""`, no LLM call | Faster, and nothing to hallucinate from |
| Missing, wrong or non-ASCII token | 401 | Tokens are compared as bytes, so odd characters can't crash the check |
| Blank question / too long | 400 / 422 | Caps token cost and abuse |
| Empty or oversized audio | 400 / 413 | Reads at most limit+1 bytes, never a huge file |
| Provider busy: 429, 408, 409, 5xx, timeout, network | `ProviderBusy`: rested 60 s, doubling to 15 min; the next provider answers | Temporary trouble must not remove a provider for weeks |
| Provider broken: 400, 401, 403, 404 | `ProviderBroken`: disabled until restart | A wrong key or model id won't fix itself |
| Model writes nothing | `ProviderBusy("empty answer")` → the next provider tries | Reasoning models can spend every token on hidden thinking |
| Every provider resting or broken | 503 "try again in a minute" | Temporary, unlike a config error, which stays 500 |
| Slow or stuck provider | Cut off at `PROVIDER_TIMEOUT_SECONDS` (4 s); the whole request stops at `GENERATION_DEADLINE_SECONDS` (7 s) | An HTTP timeout only limits gaps between bytes: one request ran 110 s before this |
| Any other exception | 500 | It's our bug; don't disguise it as a provider problem |
| Whisper rate limit, timeout, 5xx | 503 (`SpeechUnavailable`); a rejected key stays 500 | One is temporary, the other is our mistake |
| Startup with a wrong `DATABASE_URL` | The server exits (`PoolTimeout`) | Fail at deploy time, not on the first question |
| Logging | One line per request: status, provider, sizes, timings. Never the question text. | Church members' questions are private |

## Glossary
| Term | Meaning |
|---|---|
| Chunk | A small piece of a page (~300 words), embedded and retrieved on its own |
| Embedding | A fixed-length list of numbers representing meaning; similar meaning → nearby vectors |
| Cosine similarity | How closely two vectors point the same way (1 = identical). The dot product, for normalized vectors. |
| HNSW | The graph index that makes nearest-neighbour search fast without comparing every row |
| Recall@k | The fraction of the relevant pages found in the top k results |
| MRR | Mean of 1/rank of the first relevant result: it rewards ranking the right page first |
| Grounding | Requiring the model to answer only from the provided sources, with citations |
| Hallucination | A fluent answer the sources do not support |
| Condensing | Rewriting a follow-up question so it stands on its own before retrieval |
