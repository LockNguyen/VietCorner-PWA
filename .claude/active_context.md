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
  - [ ] M1 extract + chunk · [ ] M2 embeddings · [ ] M3 eval bake-off · [ ] M4 pgvector + ingest
  - [ ] M5 RAG answer · [ ] M6 API + Oracle deploy · [ ] M7 voice UI · [ ] M8 docs/release · [ ] M9 LiveKit (optional)
- [ ] Step 3: `i18n`: en/vi UI strings + `{en, vi}` DB content + toggle

## ⚠️ Known Constraints & Debt
- iOS push requires iOS 16.4+, Add to Home Screen, and a user tap to grant permission.
- Embeddings: self-hosted; the model is chosen in M3 (e5-base vs bge-m3 vs Vietnamese_Embedding). `EMBEDDING_DIM` and `schema.sql` wait for that result.
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
1. User: install Python 3.12, create a venv in `services/ai`, `pip install -r requirements.txt`, and run `pytest` (all fail with NotImplementedError = to-do list).
2. User: put the church PDFs in `services/ai/data/`, create the Groq key, and start the Oracle Cloud signup.
3. User implements M1 (`normalize_text`, `extract_pages`, `split_with_overlap`, `chunk_pages`), then says "review M1".
