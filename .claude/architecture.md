# VietCorner PWA: Architecture

> The source of truth for how this system works. Read top to bottom.

## 1. Overview
A Progressive Web App (installable website) for a church community. Three independent features:
| Feature | Folder | Status |
|---|---|---|
| Login (auth) | `src/features/auth/` | Built, QA passed (email code, reload, sign out) |
| Group chat + push | `src/features/chat/` | Deployed + working on https://vietcorners.netlify.app. Phone QA pending. |
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
| Hosting | Netlify (deploys from GitHub) | Free HTTPS (push requires it). Free tier allows commercial use. |

### Key Decisions
| Decision | Why | Trade-off |
|---|---|---|
| One Next.js codebase, no separate backend | Least to learn, deploy, and keep in sync | Can't use Python AI libraries; long-running jobs don't fit serverless. Mitigated by thin routes (see §4). |
| Supabase instead of our own auth/DB server | Login, Postgres, RLS, and vectors for free | Vendor lock-in on user IDs + auth. Free projects pause after ~7 days without activity. |
| Email one-time code instead of magic link | iOS Home Screen apps don't share cookies with Safari | Users type a code (a bit harder for elderly users) |
| Groq for AI | Free, fast Whisper + Llama | No embeddings API, so a second service is needed for RAG |
| Web Push instead of a native app | No app store, one codebase | iOS needs Add to Home Screen + iOS 16.4+ |
| Send messages through an API route, not straight to Supabase | Sending must also trigger push, which needs secrets | One extra hop per message |
| Service role (admin) client for push fan-out | RLS correctly hides other users' subscriptions | A powerful key on the server. Used in exactly one file. |
| Supabase Realtime for live chat | Serverless can't hold WebSockets; Realtime respects RLS | Another moving part; enabled per table |
| Netlify over Vercel | Free tier allows commercial use (Vercel Hobby doesn't). Git push auto-deploys. | Next.js runs through Netlify's adapter, which can lag new Next versions, so verify `proxy.ts` + route handlers after each Next upgrade. The code uses no host-specific APIs, so switching hosts is cheap. |
| Open Join (any user can join any group) | Easiest way to test with 2 phones | No private groups yet |

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
- Reads and simple writes go from the browser straight to Supabase (RLS protects them). Writes with side effects or secrets go through `src/app/api/**/route.ts`.
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
| `src/app/loading.tsx` | "Loading…" shown immediately while any page renders. Why: pages that read cookies are dynamic, and Next.js doesn't prefetch dynamic routes. Without it, a tap shows no feedback until the server responds, and users tap again. |
| `src/app/{groups,assistant,settings}/page.tsx` | One page per tab. Each page only composes feature components. |
| `src/components/TabBar.tsx` | Bottom navigation. The `TABS` array is the only list of tabs. |
| `src/components/PageHeader.tsx` | Sticky title bar. |
| `src/components/ServiceWorkerRegister.tsx` | Registers `/sw.js` in the browser. |
| `public/sw.js` | Service worker. Activates immediately. Contains chat's `push` + `notificationclick` handlers (lines marked `CHAT`). |
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
| `src/features/auth/refreshSession.ts` | Refreshes the session cookie. Logged out + not on `/login` → redirect to `/login` (except `/api/*`, which returns 401 JSON itself). Logged in + on `/login` → redirect to `/groups`. |
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
**Purpose:** Users join groups and send messages. Open chat screens update live. Other members get a push notification even if the app has been closed for months.

**Files**
| File | Job |
|---|---|
| `src/features/chat/schema.sql` | Tables, grants, RLS policies, Realtime publication, seed groups. Run once in the Supabase SQL Editor. |
| `src/features/chat/types.ts` | `Group` and `Message` row types. |
| `components/GroupList.tsx` | Server component. All groups: joined ones link to the chat, others show `JoinButton`. |
| `components/JoinButton.tsx` | Inserts into `group_members` straight to Supabase (RLS: only as yourself). |
| `components/EnableNotificationsButton.tsx` | Asks permission → `pushManager.subscribe` (VAPID public key) → upserts into `push_subscriptions`. Re-saves on every open. |
| `components/GroupChat.tsx` | Server component. Loads the group, the newest 50 messages, and the current user → `ChatRoom`. |
| `components/ChatRoom.tsx` | Client. Realtime subscription for new messages, plus a send form → `POST /api/chat/messages`. |
| `server/sendMessage.ts` | Inserts the message with the **user's** client (RLS checks membership) → `notifyGroup`. |
| `server/notifyGroup.ts` | **Admin** client: other members → their subscriptions → `web-push` each. Deletes subscriptions that return 404/410. |
| `src/app/api/chat/messages/route.ts` | Thin route: verify user (401) → validate (400) → `sendMessage` (403 on RLS failure) → 201. |
| `src/app/groups/page.tsx`, `src/app/groups/[groupId]/page.tsx` | Routes that compose the components above. |
| `src/lib/supabase/admin.ts` | Service role client (`server-only`). Currently used only by `notifyGroup`. |
| `public/sw.js` (`CHAT` lines) | `push` → show notification. `notificationclick` → open `/groups/<id>`. |

**Data** (see §7)
- `groups(id, name)`
- `group_members(group_id, user_id)`
- `messages(id, group_id, sender_id, sender_email, body, created_at)`. `sender_id` and `sender_email` default from the login token.
- `push_subscriptions(endpoint PK, user_id, subscription jsonb)`. One row per device.

**Flow: send a message**
1. `ChatRoom` → `POST /api/chat/messages { groupId, body }`.
2. Route verifies the user → `sendMessage` inserts as that user. RLS rejects non-members and faked senders.
3. Realtime broadcasts the new row → every open `ChatRoom` in that group appends it, including the sender's.
4. `notifyGroup` → push service (Apple/Google/Mozilla) → the device's service worker → `showNotification`.
5. Tap notification → `/groups/<id>`.

**How "real time" works (two delivery paths)**
| App state | Path | Technology |
|---|---|---|
| Chat screen open | Supabase Realtime | The browser keeps a **WebSocket** to Supabase. Postgres logical replication streams new `messages` rows → Realtime checks RLS per subscriber → sends the row. |
| App closed or in background | Web Push | Our server → push service (FCM for Chrome/Android, Apple's service for Safari/iOS) → OS wakes `sw.js` → notification. |

- There's no WebRTC. WebRTC is for peer-to-peer audio/video. Chat is client ↔ server, so a WebSocket is the standard tool.
- `push`, `notificationclick`, `self.registration.showNotification`, and `pushManager.subscribe` are standard **W3C web APIs** (Push API, Notifications API, Service Worker API), built into Chrome, Safari, and Firefox. We only choose what happens inside each handler.

**Flow: turn on notifications**
Tap button → permission prompt → browser creates a subscription (endpoint + keys) tied to our VAPID public key → saved in `push_subscriptions`.

**Expected behavior**
- `/groups` lists "Bible Study" and "Test Group". Join → the row becomes a link.
- Opening a group shows old messages. New messages from anyone appear without a reload.
- Your messages are blue on the right. Others' are gray on the left, with the sender's email.
- The sender gets no push. Every other member's subscribed devices do, even with the app closed.
- iPhone in Safari (not installed): the button area says to Add to Home Screen.
- `POST /api/chat/messages` while logged out → `401 {"error":"Not signed in"}` (JSON, not a redirect).
- Measured in dev (2026-09-14): opening a group takes 100–600 ms. "Loading…" shows instantly. 20 rapid taps, including double-taps, always landed on the right page with no hangs. Server: proxy ~5 ms, page 110–360 ms (Supabase queries), sending a message 250–370 ms (includes push). JS heap stayed ~16 MB (no leak).
- Dev only: the first visit to a route after a code change adds ~0.5 s+ for compiling. The Next.js "Rendering/Compiling" badge is a dev tool and doesn't exist in production.

**Edge cases**
- **iOS:** push only works in a Home Screen app on iOS 16.4+, and the permission prompt only appears after a tap. That's why this is a button, not automatic.
- **Installed iPhone app, fully closed:** iOS wakes our service worker to show the push. The app doesn't need to be open or recently used, and it survives reboots. It stops if the user deletes the Home Screen icon, turns off notifications in Settings, or clears Safari website data. Those cases return 410, so the row gets cleaned up.
- **Every push must show a notification.** Why: Safari revokes the subscription if the service worker receives pushes without displaying them. `sw.js` always calls `showNotification`.
- **Push needs HTTPS** (localhost is allowed). Test on phones through the Vercel deploy.
- **Expired subscriptions:** the push service returns 404/410 → row deleted. The device re-subscribes the next time the app is opened with permission granted.
- **Shared device:** the endpoint belongs to the first user who saved it. If a different user signs in on that device, the upsert fails RLS. Rare for this MVP.
- **Why the sender's email is checked in RLS:** without it, someone calling Supabase directly could post as someone else.
- `notifyGroup` runs before the route responds. Why: serverless functions can stop right after the response. Cost: sending feels slower in big groups.
- The message list loads only the newest 50. There's no "load older" yet.
- **Send failures:** network down or a 401/403 → error shown and the text goes back in the box. Push failure after the message is saved → logged only, and the request still returns 201. Why: reporting failure would make users resend and create duplicates.
- **Non-members can't post:** there's no membership `if` in TypeScript on purpose. The route uses the user's client, so the `"Members post as themselves"` RLS policy rejects the insert (403). The same policy blocks direct calls to Supabase with the anon key.
- **Known gap: missed messages after a disconnect.** Realtime doesn't replay. If a phone sleeps or the WebSocket drops, messages sent meanwhile don't appear until the page reloads. Their push notifications still arrive.
- **Known gap: no rate limiting** on `POST /api/chat/messages`, so a signed-in user could spam a group.
- **Known gap: every message pushes every member.** No mute and no grouping of notifications yet.

**Limits** (free tiers; verify current numbers)
| Limit | Where | Our usage |
|---|---|---|
| Realtime concurrent connections (~200 on free) | Supabase | One per open chat screen |
| Database size (~500 MB free) | Supabase | Text messages are tiny |
| Push payload ~4 KB | Push services | Body ≤ 2000 chars + email fits |
| Function timeout (~10 s default for synchronous functions) | Netlify | Send ~300 ms. Big groups make push fan-out slower. |
| Project pauses after ~7 idle days | Supabase free | Pause → no login, chat, or push |
| ~500 emails/day | Gmail SMTP | One per sign-in |

**How to remove:** delete `src/features/chat/`, `src/app/groups/`, `src/app/api/chat/`, and `src/lib/supabase/admin.ts`. Remove the `CHAT` lines in `public/sw.js`, remove the Groups tab, and change `HOME_PATH` in `refreshSession.ts`. Run the drop SQL at the bottom of `schema.sql`. Remove the push env vars.

### 6.3 i18n
Not built.

### 6.4 assistant
Not built.

## 7. Database
| Table | Owner | Notes |
|---|---|---|
| `auth.users` | Supabase (auth) | Built in. One row per account. Created on first sign-in. |
| `groups` | chat | Readable by any signed-in user. Seeded by `schema.sql`. |
| `group_members` | chat | Users see and insert only their own rows. |
| `messages` | chat | Members read. Members insert as themselves. In the Realtime publication. |
| `push_subscriptions` | chat | Users manage their own rows. The admin client reads all of them to send pushes. |

## 8. Environment Variables
| Name | Used by | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `src/lib/supabase/*`, `refreshSession.ts` | Supabase project URL. Stored in `.env.local` (gitignored). |
| `SUPABASE_SERVICE_ROLE_KEY` | `src/lib/supabase/admin.ts` | **Secret.** Bypasses RLS. Server only. |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | `EnableNotificationsButton`, `notifyGroup` | Identifies our server to push services. Public. |
| `VAPID_PRIVATE_KEY` | `notifyGroup` | **Secret.** Signs pushes. If it changes, every existing subscription stops working. |
| `VAPID_SUBJECT` | `notifyGroup` | `mailto:` contact for push services. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `src/lib/supabase/*`, `refreshSession.ts` | Public anon key. Safe in the browser because row-level security protects the data. |

## 9. Setup & Deploy
1. Install Node.js LTS (tested on 24.19.0).
2. Keep the project outside OneDrive (it lives at `C:\Projects\VietCorner PWA`), because syncing `node_modules` causes file-lock errors.
3. Supabase project: fill in `.env.local` (see §8).
   - Authentication → Emails → **SMTP Settings**: enable custom SMTP. This is required before templates can be edited. MVP option: Gmail SMTP (`smtp.gmail.com`, port 587, Gmail app password). SMTP credentials live only in the Supabase dashboard, never in this repo.
   - Authentication → Email Templates: add `{{ .Token }}` to **both** templates. **Confirm signup** is sent on a new user's first sign-in, and **Magic Link** on every later sign-in.
4. `npm install`, then `npm run dev` → http://localhost:3000. Run `npm run build` to type-check.
**Live URL:** https://vietcorners.netlify.app (GitHub: `LockNguyen/VietCorner-PWA`, branch `main`)

**Deploy (Netlify + GitHub):**
1. Push the repo to a private GitHub repo.
2. Netlify → Add new project → Import from GitHub. It detects Next.js automatically (build `npm run build`), so no `netlify.toml` is needed.
3. Netlify → Project configuration → Environment variables: add every variable in §8. Mark **only** `SUPABASE_SERVICE_ROLE_KEY` and `VAPID_PRIVATE_KEY` as "Contains secret values".
   - Never mark `NEXT_PUBLIC_*` vars as secret. Why: Next.js copies them into the built code on purpose, so Netlify's secret scanner finds them there and fails the build ("Secrets scanning found secrets in build").
   - Never disable secret scanning. It's what catches a leaked service role key.
4. Use the same VAPID keys as local. Why: subscriptions are tied to the public key, and new keys would break existing subscriptions.
5. Every push to `main` redeploys.

## 10. Change Log
- 2026-09-14: Created harness files (CLAUDE.md, active_context.md, architecture.md).
- 2026-09-14: Step 0 app shell: Next.js config, manifest, service worker, tab bar, 3 placeholder pages, icons.
- 2026-09-14: Project moved to `C:\Projects`. Dependencies installed, build verified. Git initialized. Supabase packages + `.env.local` placeholder added for Step 1.
- 2026-09-14: Step 1 auth: email one-time-code login, proxy session refresh + redirects, Settings account section. Chose a code over a magic link (iOS PWA cookie isolation).
- 2026-09-14: Docs: added Key Decisions, Security Model, thin-route rule, and Expected behavior sections.
- 2026-09-14: Auth QA passed. Documented that the Confirm signup template also needs `{{ .Token }}`.
- 2026-09-14: Step 2 chat: schema + RLS, groups/join, realtime ChatRoom, message API route, web push (subscribe, fan-out, expiry cleanup), sw.js push handlers. The proxy no longer redirects `/api/*`.
- 2026-09-14: Added root `loading.tsx` (instant feedback on dynamic navigation). Documented iOS closed-app push behavior.
- 2026-09-14: Deployed to Netlify. Verified live: `/groups` logged out → 307 `/login`, API → 401 JSON, sw.js + manifest 200. Push made best-effort (no false "send failed"). ChatRoom handles network errors. Documented real-time paths, limits, and known gaps.
