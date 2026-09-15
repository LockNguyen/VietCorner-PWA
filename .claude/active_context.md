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
- Workflow: one feature at a time, dev → QA on real phones → next
- **Feature shape** (CLAUDE.md): `api.ts` / `hooks/` / `components/` / `server/queries.ts` + `server/<action>.ts` / `schema.sql`
- Critical Files/Modules: `features/chat/api.ts`, `features/chat/hooks/useChatMessages.ts`, `features/chat/schema.sql`, `features/auth/server/refreshSession.ts`, `public/sw.js`

## 📋 Current Session Task Breakdown
- [x] Initialize system architecture guardrails (CLAUDE.md, active_context.md, architecture.md)
- [x] Step 0: App shell (Next 16.3.5, Node 24.19.0)
- [x] Step 1: `auth`: email one-time-code login (Gmail SMTP for the MVP). QA passed.
- [x] Step 2: `chat`: deployed and working. iPhone notification tap → live chat fixed and confirmed by the user.
- [~] Restructure auth + chat into the standard feature shape (no behavior change). Code + docs done, tsc passes. Awaiting user QA, then push.
- [ ] Step 3: `i18n`: en/vi UI strings + `{en, vi}` DB content + toggle
- [ ] Step 4: `assistant`: record → Whisper → retrieve chunks → Llama → speak

## ⚠️ Known Constraints & Debt
- iOS push requires iOS 16.4+, Add to Home Screen, and a user tap to grant permission.
- **Open decision:** Groq has no embeddings API. Options: Supabase built-in `gte-small` (Edge Function, free) or transformers.js in Node. Decide before Step 4.
- Browser SpeechRecognition is unreliable in iOS home-screen PWAs, so use MediaRecorder + server-side Whisper instead.
- Vietnamese `speechSynthesis` voices vary by device; verify during Step 4 QA.
- Netlify synchronous functions time out at ~10 s. Matters for the voice assistant.
- Supabase free projects pause after ~7 idle days, breaking login and push. Launch needs a paid plan or a keep-alive.
- Gmail SMTP for the MVP. Before launch, switch to Resend/Brevo with the church domain.
- Chat gaps: no rate limit on sending, no mute, no private groups, no "load older", no automated RLS tests, shared-device subscription edge case.
- Perf idea: pages call `getUser()` (a network call) although the proxy already validated the session. Could use `getClaims()`.
- The tab bar still shows on `/login` (intentional, keeps the shell decoupled from auth).

## ➡️ Next 3 Micro-Steps
1. User QA of the restructure: sign in/out, join a group, send + receive live, push + notification tap on iPhone. Then commit is pushed to deploy.
2. Add an RLS test script (non-member insert/select must fail) so authorization isn't "silent".
3. Start Step 3 (i18n) using the standard feature shape.
