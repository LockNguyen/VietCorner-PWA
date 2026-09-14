# Active Project State

## 🎯 High-Level Goal
MVP PWA (VietCorner) for a Vietnamese church community, mostly elderly users, to prove 3 features are possible:
1. **Group chat + push notifications**: users message within their groups. Pushes reach phones even after months of not opening the app. Accounts are created once and stay signed in.
2. **Voice AI assistant (RAG)**: push-to-talk questions answered from church policy and training documents.
3. **Bilingual EN/VI**: every text resource is stored in both languages, with an in-app language toggle.

Priority: prove it's possible + textbook-clear code + features removable by deleting folders. UI polish comes later.

## 🧱 Codebase Boundaries & Tech Stack
- Frontend/Backend: Next.js (App Router) + React + TypeScript + Tailwind, API routes as the backend
- Auth + DB: Supabase (email magic link, Postgres, pgvector)
- Push: Web Push API + service worker + `web-push` (VAPID keys)
- AI: Groq (Whisper speech-to-text, Llama answers); browser `speechSynthesis` for spoken replies
- Hosting: Vercel (HTTPS required for push/PWA testing on phones)
- Workflow: one feature at a time, dev → QA on real phones → next
- UI reference: top title bar, bottom tab bar, list rows (thumbnail + title + subtitle + chevron). MVP tabs: Groups, Assistant, Settings.
- Critical Files/Modules: `src/app/layout.tsx`, `src/components/TabBar.tsx`, `public/sw.js`, `src/app/manifest.ts`

## 📋 Current Session Task Breakdown
- [x] Initialize system architecture guardrails (CLAUDE.md, active_context.md, architecture.md)
- [x] Step 0: App shell (Next 16.3.5, Node 24.19.0). Build passes. Verified at mobile size: `/` → `/groups`, tabs switch, manifest served, service worker active.
- [ ] Step 1: `auth`: Supabase magic-link login, persistent session
- [ ] Step 2: `chat`: groups, messages, push subscribe + send (QA on iPhone + Android)
- [ ] Step 3: `i18n`: en/vi UI strings + `{en, vi}` DB content + toggle
- [ ] Step 4: `assistant`: record → Whisper → retrieve chunks → Llama → speak

## ⚠️ Known Constraints & Debt
- iOS push requires iOS 16.4+, Add to Home Screen, and a user tap to grant permission.
- Push subscriptions can expire; the server must delete subscriptions that return 404/410.
- **Open decision:** Groq has no embeddings API. Options: Supabase built-in `gte-small` (Edge Function, free) or transformers.js in Node. Decide before Step 4.
- Browser SpeechRecognition is unreliable in iOS home-screen PWAs, so use MediaRecorder + server-side Whisper instead.
- Vietnamese `speechSynthesis` voices vary by device; verify during Step 4 QA.
- The user must create Supabase, Groq, and Vercel accounts themselves.

- `public/sw.js` lives outside the feature folders. Chat's push handlers will be marked lines there.
- Git 2.55 installed, repo on `main`. One commit per completed step. `.env.local` is gitignored.
- Not yet tested on a real phone. Needs an HTTPS deploy (Vercel) before chat push QA.

## ➡️ Next 3 Micro-Steps
1. BLOCKED on user: create a Supabase project, enable Email (magic link) auth, add `http://localhost:3000/**` to redirect URLs, and fill in `.env.local`.
2. Packages installed (`@supabase/supabase-js`, `@supabase/ssr`). Next: add `src/lib/supabase/{client,server}.ts`.
3. Build `src/features/auth/` (login form, callback route, sign-out) and gate pages, then QA with a real email.
