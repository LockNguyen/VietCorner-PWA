# VietCorner PWA: Architecture

> The source of truth for how this system works. Read top to bottom.

## 1. Overview
A Progressive Web App (installable website) for a church community. Three independent features:
| Feature | Folder | Status |
|---|---|---|
| Login (auth) | `src/features/auth/` | Built, QA passed (email code, reload, sign out) |
| Group chat + push | `src/features/chat/` | Not built |
| English/Vietnamese | `src/features/i18n/` | Not built |
| Voice AI assistant (RAG) | `src/features/assistant/` | Not built |

## 2. Tech Stack
| Layer | Choice | Why |
|---|---|---|
| UI + server | Next.js App Router, React, TypeScript | One project for pages and API routes |
| Styling | Tailwind | Styles live next to the markup |
| Auth + database | Supabase (Postgres, pgvector) | Login, data, and vector search in one free service |
| Push | Web Push + service worker (`web-push`) | Standard, free, works while the app is closed |
| AI | Groq (Whisper, Llama) | Free tier |
| Hosting | Vercel | Free HTTPS, which push requires |

### Key Decisions
| Decision | Why | Trade-off |
|---|---|---|
| One Next.js codebase, no separate backend | Least to learn, deploy, and keep in sync | Can't use Python AI libraries; long-running jobs don't fit serverless. Mitigated by thin routes (see §4). |
| Supabase instead of our own auth/DB server | Login, Postgres, RLS, and vectors for free | Vendor lock-in on user IDs + auth. Free projects pause after ~7 days without activity. |
| Email one-time code instead of magic link | iOS Home Screen apps don't share cookies with Safari | Users type a code (a bit harder for elderly users) |
| Groq for AI | Free, fast Whisper + Llama | No embeddings API, so a second service is needed for RAG |
| Web Push instead of a native app | No app store, one codebase | iOS needs Add to Home Screen + iOS 16.4+ |

## 3. Folder Map
```
src/
  app/          Next.js routes (thin: they only compose features)
  components/   App shell UI shared by all pages (tab bar, header)
  features/     One folder per removable feature
  lib/          Shared clients (supabase, groq), no feature logic
  proxy.ts      Runs before each request (auth only)
public/         sw.js, icons/
```

## 4. Rules of the Codebase
- Features never import each other's internals.
- `src/app` pages only wire features together.
- Each feature folder contains: `components/`, `server/`, `schema.sql`, `README.md` (only the parts it needs).
- `route.ts` files stay thin: parse → verify user → call `features/<name>/server/*` → return JSON. Server functions don't import Next.js, so moving a feature to a separate backend means copying `server/` and changing the fetch URL.

### Security Model (where trust lives)
| Place | Runs on | Trusted? | Enforces |
|---|---|---|---|
| Client Components (`"use client"`) | User's browser | **No**: anyone can read or edit it | Nothing. UX only. |
| `src/proxy.ts` | Server | Yes | Redirects only (UX). Not the security boundary. |
| Server Components, `route.ts` | Server | Yes | Each route checks the user itself. Holds secrets. |
| Supabase RLS policies | Database | Yes | **The real boundary.** The public anon key can call Supabase directly, so only RLS stops reading other users' data. |

- Editing browser code can't skip server checks or RLS. It can only break that user's own UI.
- Env vars with `NEXT_PUBLIC_` are shipped to the browser, so they're public. Secrets never get that prefix.

## 5. App Shell
**Purpose:** The empty installable app that every feature plugs into: a header, a bottom tab bar, and a service worker.

**Files**
| File | Job |
|---|---|
| `src/app/layout.tsx` | Root HTML for every page. Renders the page, `TabBar`, and `ServiceWorkerRegister`. Holds iOS home-screen metadata. |
| `src/app/manifest.ts` | Served at `/manifest.webmanifest`. Name, icons, `display: standalone`, `start_url: /groups`. |
| `src/app/page.tsx` | `/` redirects to `/groups`. |
| `src/app/{groups,assistant,settings}/page.tsx` | One placeholder page per tab. |
| `src/components/TabBar.tsx` | Bottom navigation. The `TABS` array is the only list of tabs. |
| `src/components/PageHeader.tsx` | Sticky title bar. |
| `src/components/ServiceWorkerRegister.tsx` | Registers `/sw.js` in the browser. |
| `public/sw.js` | Service worker. Currently only activates. Push handlers are added in the chat step. |
| `public/icons/icon-{192,512}.png` | Placeholder app icons (also used as the iOS icon). |
| `next.config.ts`, `postcss.config.mjs`, `tsconfig.json` | Default config. Tailwind v4 is loaded by `@import "tailwindcss"` in `globals.css`. `@/*` maps to `src/*`. Next rewrites parts of `tsconfig.json` on build (normal). |
| `.claude/launch.json` | Lets Claude's preview browser run `npm run dev` on port 3000. |

**Flow:** Browser opens `/` → redirect to `/groups` → `layout.tsx` wraps the page with the tab bar → service worker registers in the background → browser sees manifest + service worker → offers "Install" / "Add to Home Screen".

**Expected behavior**
- `/` opens `/groups` (or `/login` if logged out, see auth).
- Tapping a tab switches pages without a full reload. The active tab is blue.
- `/sw.js`, `/manifest.webmanifest`, and `/icons/*` return 200 for everyone, including logged-out users.
- DevTools → Application → Service Workers shows `sw.js` as activated.

**Edge cases**
- The service worker and install prompt only work on `localhost` or HTTPS.
- iOS has no install prompt. Users must use Share → Add to Home Screen.
- `pb-20` on `<main>` keeps content from hiding behind the fixed tab bar. `safe-area-inset-bottom` avoids the iPhone home indicator.

**How to add or remove a tab:** Edit `TABS` in `TabBar.tsx` and add or delete `src/app/<tab>/`.

## 6. Features
Each feature follows this template: **Purpose → Files → Data → Flow → Expected behavior → Edge cases → How to remove.**

### 6.1 auth
**Purpose:** Sign in with email + a one-time code. The first sign-in creates the account. Users stay signed in for months.

**Files**
| File | Job |
|---|---|
| `src/lib/supabase/client.ts` | Supabase client for browser code (shared, not auth-only). |
| `src/lib/supabase/server.ts` | Supabase client for server code. Reads the login cookie (shared). |
| `src/proxy.ts` | Next.js proxy (formerly "middleware"). Calls `refreshSession` on every non-static request. |
| `src/features/auth/refreshSession.ts` | Refreshes the session cookie. Logged out + not on `/login` → redirect to `/login`. Logged in + on `/login` → redirect to `/groups`. |
| `src/features/auth/LoginForm.tsx` | Step 1: `signInWithOtp({ email })`. Step 2: `verifyOtp({ email, token, type: "email" })`. |
| `src/features/auth/AccountSection.tsx` | Server component: "Signed in as …" + `SignOutButton`. |
| `src/features/auth/SignOutButton.tsx` | `signOut()` → `/login`. |
| `src/app/login/page.tsx` | Route that renders `LoginForm`. |
| `src/app/settings/page.tsx` | Renders `AccountSection` (lines marked `AUTH`). |

**Data:** Supabase's built-in `auth.users` table. No custom tables. The session lives in `sb-*` cookies (400-day max age, renewed on each visit).

**Flow**
1. User opens any page → proxy finds no session → `/login`.
2. User enters email → Supabase emails a code (the account is created if it's new).
3. User types the code → `verifyOtp` sets the session cookies → `/groups`.
4. Every later request → proxy validates the token with `getClaims()` and refreshes it if expired → new cookies.

**Expected behavior**
- Logged out: any page (`/groups`, `/settings`, …) redirects to `/login`.
- Logged out: `sw.js`, the manifest, and icons still load, so the app can be installed before signing in.
- Logged in: visiting `/login` redirects to `/groups`.
- A new email gets an account automatically. There is no separate sign-up page. New and returning users both get exactly one email containing a code.
- Reloading or closing the app keeps you signed in.
- Settings shows "Signed in as <email>". Sign out → `/login`.
- The tab bar also shows on `/login`. Tapping a tab just redirects back to `/login`. Left as is so the shell doesn't need to know about auth.

**Edge cases**
- **The proxy redirect is UX, not security.** Routes and RLS must check the user (see §4 Security Model).
- **Why a code, not a magic link:** on iPhone, email links open in Safari, whose cookies are separate from the Home Screen app, so the app would stay logged out.
- Both the **Confirm signup** and **Magic Link** templates must include `{{ .Token }}`. Why: Supabase uses Confirm signup for a brand-new email and Magic Link for existing users. `verifyOtp({ type: "email" })` accepts codes from either. If Confirm signup has only a link, new users get a link instead of a code. Template edits require custom SMTP (see §9).
- QA with a fresh account: use a Gmail `+` alias (`name+test1@gmail.com`) or delete the user in Supabase → Authentication → Users.
- The code expires after 1 hour by default (Supabase → Auth settings).
- Supabase's built-in email sender is rate-limited to a few emails per hour. Real users need custom SMTP (e.g. Resend).
- A user who doesn't open the app for more than 400 days has to sign in again. Push notifications still arrive, because they don't need the cookie.
- The proxy skips `sw.js`, `manifest.webmanifest`, `icons/`, and `_next/static`, so install works while logged out.
- `server.ts` ignores cookie writes from Server Components on purpose. The proxy does the writing.

**How to remove:** delete `src/features/auth/`, `src/proxy.ts`, `src/app/login/`, and the `AUTH` lines in `src/app/settings/page.tsx`. Features that need a user id (chat) will no longer work without a replacement.

### 6.2 chat
Not built.

### 6.3 i18n
Not built.

### 6.4 assistant
Not built.

## 7. Database
| Table | Owner | Notes |
|---|---|---|
| `auth.users` | Supabase (auth) | Built in. One row per account. Created on first sign-in. |

## 8. Environment Variables
| Name | Used by | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `src/lib/supabase/*`, `refreshSession.ts` | Supabase project URL. Stored in `.env.local` (gitignored). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `src/lib/supabase/*`, `refreshSession.ts` | Public anon key. Safe in the browser because row-level security protects the data. |

## 9. Setup & Deploy
1. Install Node.js LTS (tested on 24.19.0).
2. Keep the project outside OneDrive (it lives at `C:\Projects\VietCorner PWA`), because syncing `node_modules` causes file-lock errors.
3. Supabase project: fill in `.env.local` (see §8).
   - Authentication → Emails → **SMTP Settings**: enable custom SMTP. This is required before templates can be edited. MVP option: Gmail SMTP (`smtp.gmail.com`, port 587, Gmail app password). SMTP credentials live only in the Supabase dashboard, never in this repo.
   - Authentication → Email Templates: add `{{ .Token }}` to **both** templates. **Confirm signup** is sent on a new user's first sign-in, and **Magic Link** on every later sign-in.
4. `npm install`, then `npm run dev` → http://localhost:3000. Run `npm run build` to type-check.
Deploy: not set up yet.

## 10. Change Log
- 2026-09-14: Created harness files (CLAUDE.md, active_context.md, architecture.md).
- 2026-09-14: Step 0 app shell: Next.js config, manifest, service worker, tab bar, 3 placeholder pages, icons.
- 2026-09-14: Project moved to `C:\Projects`. Dependencies installed, build verified. Git initialized. Supabase packages + `.env.local` placeholder added for Step 1.
- 2026-09-14: Step 1 auth: email one-time-code login, proxy session refresh + redirects, Settings account section. Chose a code over a magic link (iOS PWA cookie isolation).
- 2026-09-14: Docs: added Key Decisions, Security Model, thin-route rule, and Expected behavior sections.
- 2026-09-14: Auth QA passed. Documented that the Confirm signup template also needs `{{ .Token }}`.
