# VietCorner AI Service: a hands-on RAG course

A small Python service that answers church members' questions from policy and training PDFs, in Vietnamese or English. You build it yourself, one milestone at a time.

```
OFFLINE  PDF ─► extract_pages ─► chunk_pages ─► embed_passages ─► document_chunks (Postgres + pgvector)
ONLINE   question ─► embed_query ─► search_chunks ─► build_prompt ─► generate_answer ─► Answer(text, sources, timings)
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
| `evaluation/` | Measure which embedding model works best on your documents |
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
- **Concepts:** model serving, bearer tokens, constant-time comparison, health checks, systemd, reverse proxy + TLS (Caddy), firewalls.
- **You write:** `speech/transcribe.py`, `api/main.py`. Deploy on the Oracle VM (Claude guides and provides `deploy/` files).
- **Checkpoint:** `pytest tests/test_api.py` passes. From your PC: `curl https://<vm-ip>.sslip.io/health` → ok, `/ask` without a token → 401, with a token → answer. The service comes back after a VM reboot.

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
| Run the API | `uvicorn api.main:app --reload` → http://127.0.0.1:8000/docs |
