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
- Hosting: Netlify via GitHub auto-deploy (HTTPS required for push/PWA testing on phones)
- Workflow: one feature at a time, dev → QA on real phones → next
- UI reference: top title bar, bottom tab bar, list rows (thumbnail + title + subtitle + chevron). MVP tabs: Groups, Assistant, Settings.
- Critical Files/Modules: `src/app/layout.tsx`, `src/components/TabBar.tsx`, `public/sw.js`, `src/app/manifest.ts`

## 📋 Current Session Task Breakdown
- [x] Initialize system architecture guardrails (CLAUDE.md, active_context.md, architecture.md)
- [x] Step 0: App shell (Next 16.3.5, Node 24.19.0). Build passes. Verified at mobile size: `/` → `/groups`, tabs switch, manifest served, service worker active.
- [x] Step 1: `auth`: email one-time-code login (Gmail SMTP for the MVP). QA passed. The Confirm signup template also needs `{{ .Token }}` so new users get one email.
- [~] Step 2: `chat`: deployed to https://vietcorners.netlify.app and working. Live checks passed. Remaining: QA on a real iPhone (Home Screen) + Android with the app closed.
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

- Supabase free projects pause after ~7 days without activity, which breaks login and push until the project is restored. Real launch needs a paid plan or a keep-alive. (Verify the current policy.)
- Netlify runs Next.js 16 through an adapter. Verify the proxy redirect, API routes, and Realtime after the first deploy.
- Supabase default SMTP allows only a few emails per hour. Real users need custom SMTP (Resend) before launch.
- The tab bar still shows on `/login`. Harmless (tabs redirect back), so it's left alone to avoid coupling the shell to auth.

## ➡️ Next 3 Micro-Steps
- Diagnosed the "stuck rendering" report: no server hang or memory leak (logs + 20-run rapid-click test). Cause: no `loading.tsx` (no feedback on dynamic routes) plus dev-mode compiling. Fixed with `src/app/loading.tsx`.
- Perf idea for later: the page calls `getUser()` (a network call) even though the proxy already validated the session. Could switch to `getClaims()`.
- Chat: no private groups, no "load older messages", and the shared-device subscription edge case (see architecture 6.2).

## ➡️ Next 3 Micro-Steps
- Chat gaps: Realtime doesn't replay missed messages after a phone sleeps (ChatRoom should refetch when it becomes visible again), no rate limit on sending, no mute.

1. Push the best-effort-push + send-error fix (committed locally, needs user OK to deploy).
2. Fix the stale chat after the phone sleeps: refetch messages on `visibilitychange`.
3. Phone QA: iPhone (Share → Add to Home Screen → open → turn on notifications) + Android. Close the apps, send from another account, confirm the notification and that tapping it opens the group.
