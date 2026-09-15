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
- [ ] **Next: plan the next step in Plan Mode** (Step 3 `i18n` or Step 4 `assistant`)
- [ ] Step 3: `i18n`: en/vi UI strings + `{en, vi}` DB content + toggle
- [ ] Step 4: `assistant`: record → Whisper → retrieve chunks → Llama → speak

## ⚠️ Known Constraints & Debt
- iOS push requires iOS 16.4+, Add to Home Screen, and a user tap to grant permission.
- **Open decision (Step 4):** Groq has no embeddings API. Options: Supabase built-in `gte-small` (Edge Function, free) or transformers.js in Node.
- Browser SpeechRecognition is unreliable in iOS home-screen PWAs, so use MediaRecorder + server-side Whisper instead.
- Vietnamese `speechSynthesis` voices vary by device; verify during Step 4 QA.
- Netlify synchronous functions time out at ~10 s. Voice pipeline must fit.
- Supabase free projects pause after ~7 idle days (backlog B9).
- Everything else deferred is in `.claude/backlog.md`.

## ➡️ Next 3 Micro-Steps
1. Enter Plan Mode and choose the next feature step (i18n vs. assistant).
2. Write the plan using the standard feature shape (`features/<name>/api.ts`, `hooks/`, `components/`, `server/`, `schema.sql`).
3. Get approval, then build → QA → commit + push.
