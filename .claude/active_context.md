# Active Project State

## 🎯 High-Level Goal
MVP PWA (VietCorner) for a Vietnamese church community, mostly elderly users, to prove 3 features are possible:
1. **Group chat + push notifications**: users message within their groups. Pushes reach phones even after months of not opening the app. Accounts are created once and stay signed in.
2. **Voice AI assistant (RAG)**: push-to-talk questions answered from church policy and training documents.
3. **Bilingual EN/VI**: every text resource is stored in both languages, with an in-app language toggle.

Priority: prove it's possible + textbook-clear code + features removable by deleting folders. UI polish comes later.

## 🧱 Codebase Boundaries & Tech Stack
- Frontend/Backend: Next.js 16 (App Router) + React + TypeScript + Tailwind, API routes as the backend
- Auth + DB: Supabase (email one-time code, Postgres + RLS, Realtime; pgvector later)
- Push: Web Push API + service worker + `web-push` (VAPID keys)
- AI (planned): Groq (Whisper speech-to-text, Llama answers); browser `speechSynthesis` for spoken replies
- Hosting: Netlify via GitHub auto-deploy (https://vietcorners.netlify.app, repo `LockNguyen/VietCorner-PWA`)
- Workflow: one feature at a time, plan → dev → QA on real phones → commit + push
- **Feature shape** (CLAUDE.md): `api.ts` / `hooks/` / `components/` / `server/queries.ts` + `server/<action>.ts` / `schema.sql`
- Deferred work: `.claude/backlog.md` (B1 = API-only data access)
- Critical Files/Modules: `features/chat/api.ts`, `features/chat/hooks/useChatMessages.ts`, `features/chat/schema.sql`, `features/auth/server/refreshSession.ts`, `public/sw.js`

## 📋 Current Session Task Breakdown
- [x] Initialize system architecture guardrails (CLAUDE.md, active_context.md, architecture.md)
- [x] Step 0: App shell (Next 16.3.5, Node 24.19.0)
- [x] Step 1: `auth`: email one-time-code login (Gmail SMTP for the MVP). QA passed.
- [x] Step 2: `chat`: groups, live messages, push. Deployed; iPhone notification tap → live chat confirmed.
- [x] Restructure auth + chat into the standard feature shape. QA passed, deployed (`feba5d6`).
- [x] Backlog created (`.claude/backlog.md`).
- [x] Planned Step 4 in Plan Mode (mentor mode: Claude scaffolds, user implements ★ functions, Claude reviews)
- [ ] **Step 4: `assistant`** (Python AI service `services/ai` on an Oracle VM + web feature). Course: `services/ai/README.md`
  - [x] M0 scaffold: config, domain types, ★ stubs with concept headers, tests, README (Claude)
  - [ ] M0 user setup: Python 3.12 + venv + `pip install`, `pytest` runs, PDFs in `data/`, Groq key, start the Oracle account
  - [x] M1 extract + chunk (12/12 tests pass; real PDF: 288 pages, text layer OK, no OCR needed, 533 chunks)
  - [x] M2 embeddings (3/3 slow tests; query p50 132 ms / p95 142 ms; 533 chunks embedded in 423 s = one-time ingest cost)
  - [~] M3 eval set written by Claude: `evaluation/questions.jsonl`, 41 questions (33 answerable with
        multi-page labels, 8 unanswerable/wrong-premise). Baseline with bge-m3, page-level, TOP_K=5:
        Recall@5 0.73 (vi 0.65 / en 1.00), MRR 0.56. User still writes metrics.py + run_eval.py.
  - [ ] M4 pgvector + ingest
  - [ ] M5 RAG answer · [ ] M6 API + Oracle deploy · [ ] M7 voice UI · [ ] M8 docs/release · [ ] M9 LiveKit (optional)
- [ ] Step 3: `i18n`: en/vi UI strings + `{en, vi}` DB content + toggle

## ⚠️ Known Constraints & Debt
- iOS push requires iOS 16.4+, Add to Home Screen, and a user tap to grant permission.
- Embeddings: self-hosted; the model is chosen in M3 (e5-base vs bge-m3 vs Vietnamese_Embedding). `EMBEDDING_DIM` and `schema.sql` wait for that result.
- **The corpus is English-only** (T-Net course, 288 pages, 0 Vietnamese characters), so the real requirement is cross-language retrieval: Vietnamese question → English passage. M3 questions should be mostly Vietnamese about English content, and a Vietnamese-only fine-tuned model may score worse than a cross-lingual one. M5's prompt must answer in the question's language from English sources.
- Slide-style pages: 203 embedded images and 12 chunks under 20 words (min 8). Tiny chunks add retrieval noise. Options to test in M3: drop chunks under N words, or merge short pages.
- **A similarity threshold alone cannot separate answerable from unanswerable questions.** Measured on the eval set:
  best-chunk score is 0.53-0.67 for answerable questions and up to 0.61 for unanswerable ones, so the ranges overlap.
  M5 must lean on the prompt rule ("answer only from the sources, otherwise say you don't know"), with `SIMILARITY_FLOOR`
  as a coarse guard around 0.45-0.50, not as the decision.
- **Vietnamese/English gap is measurable:** English twins hit 1.00 Recall@5, their Vietnamese versions 0.65. Report per language.
- **Calibrate `SIMILARITY_FLOOR` (0.35 is too low).** Measured with bge-m3 on the course PDF: best match 0.57-0.65, median chunk 0.37-0.50. An unrelated question would still clear 0.35, so "I do not know" would never trigger. Pick the value from the score distribution in M3/M5.
- Vietnamese questions score lower than English ones on this English corpus (best ~0.57-0.59 vs 0.65): the cross-lingual gap is real but retrieval still finds the right pages.
- Chunks repeat page headers/footers ("T-Net International www.tnetwork.com"). Stripping repeated boilerplate is a possible M3 experiment.
- **Mentor mode:** never implement `TODO(M#)` bodies unless the user asks (CLAUDE.md).
- Python 3.12.10 installed (user scope, `%LOCALAPPDATA%\Programs\Python\Python312`; not on PATH in old terminals). `services/ai/.venv` created, requirements installed (torch 2.14, sentence-transformers 6.0.1, pymupdf 1.28.2).
- Installed the Microsoft Visual C++ Redistributable (it was missing, so PyMuPDF/torch DLLs failed to load). `pytest` verified: 32 fast tests collected, 2 pass (provided code), 30 fail only on ★ stubs (NotImplementedError + "write SYSTEM_PROMPT"). The first run takes ~2 min (cold torch import), later runs ~8 s. A harmless Starlette/httpx deprecation warning appears in test_api.
- Oracle A1 capacity/card verification risk. Fallback: run the service on the PC + Cloudflare Tunnel.
- Browser SpeechRecognition is unreliable in iOS home-screen PWAs, so use MediaRecorder + server-side Whisper instead.
- Vietnamese `speechSynthesis` voices vary by device; verify during Step 4 QA.
- Netlify synchronous functions time out at ~10 s. Voice pipeline must fit.
- Supabase free projects pause after ~7 idle days (backlog B9).
- Everything else deferred is in `.claude/backlog.md`.

## ➡️ Next 3 Micro-Steps
1. M3: user reviews the page labels in `evaluation/questions.jsonl` (they are the ground truth), then implements `evaluation/metrics.py` + `evaluation/run_eval.py` and runs the bake-off.
2. User: create the Groq key and start the Oracle Cloud signup (needed in M5/M6).
3. After the bake-off: Claude writes `schema.sql` with the winning model vector size for M4.
