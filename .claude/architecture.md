# VietCorner PWA: Architecture

> How this system works, at the system level. Per-feature detail lives in each feature's README, so this
> file stays readable as features are added. Read top to bottom; follow the links when you need depth.

## 1. Overview
An installable web app (PWA) for a Vietnamese church community, mostly elderly users.

| Feature | Folder | README | Status |
|---|---|---|---|
| Login | `src/features/auth/` | [auth](../src/features/auth/README.md) | Done, QA passed |
| Groups + membership | `src/features/groups/` | [groups](../src/features/groups/README.md) | Done. The sharing unit chat, events and prayer build on |
| Group chat | `src/features/chat/` | [chat](../src/features/chat/README.md) | Done, live on Netlify, phone QA passed |
| Push delivery | `src/features/push/` | [push](../src/features/push/README.md) | Done (moved out of chat 2026-10-05; not re-tested on a phone since the move) |
| Voice + chat assistant (RAG) | `src/features/assistant/` + `services/ai/` | [assistant](../src/features/assistant/README.md), [AI service](../services/ai/README.md) | Done through M7, phone QA passed |
| English/Vietnamese | `src/features/i18n/` | [i18n](../src/features/i18n/README.md) | Built: per-user language, every fixed label translated |
| Event schedule | `src/features/events/` | [events](../src/features/events/README.md) | Schedule and admin section built (create, edit, translate, cancel with a push, remove); the admin screen is not exercised yet |
| Prayer requests | `src/features/prayer/` | [prayer](../src/features/prayer/README.md) | Built; permissions proven. The screen and a real notification are not exercised yet |
| Roles and permissions | `src/features/permissions/` | [permissions](../src/features/permissions/README.md) | Built; the token hook must be switched on in the dashboard |
| Admin page | `src/app/admin/` | [admin](../src/features/admin/README.md) | Tab, page, and the Events and Groups sections built; reminders to come. Prayer moderation is on hold (B24). |

Still planned: the admin dashboard, account settings, and a UI/UX revamp. Each follows [docs/adding-a-feature.md](../docs/adding-a-feature.md).

## 2. Tech Stack
| Layer | Choice | Why |
|---|---|---|
| UI + server | Next.js App Router, React, TypeScript | One project for pages and API routes |
| Styling | Tailwind | Styles live next to the markup |
| Auth + database | Supabase (Postgres, RLS, Realtime, pgvector) | Login, data and vector search in one free service |
| Push | Web Push + service worker (`web-push`) | Standard, free, works while the app is closed |
| AI | Python service (`services/ai`, FastAPI) in Docker: self-hosted embeddings, free chat providers, Groq Whisper | The AI ecosystem is Python, and a warm process must hold the model |
| Hosting | Netlify from GitHub; the AI service on the dev PC behind Tailscale Funnel | Free HTTPS; the AI service needs a machine we control |
| Tests | Vitest (pure web modules, RLS), pytest (`services/ai`) | Fast feedback where logic actually lives |

## 3. Map
```
Phone ──► Netlify ──────────────────────────────► Supabase (Postgres + RLS + Realtime)
           │  src/app/**          pages, routes         ▲          ▲
           │  src/features/**     the features ─────────┘          │
           │  src/lib/supabase    the only clients                 │
           │                                                       │
           └──► AI service (Tailscale Funnel → Docker on the PC) ──┘
                services/ai: embed → search → answer (pgvector, LLM providers)
```
```
src/
  app/          Routes. Thin: a page loads data and composes feature components.
  components/   App shell shared by every page (TabBar, PageHeader, ServiceWorkerRegister).
  features/     One folder per removable feature. The only place feature logic lives.
  lib/supabase/ client.ts (browser), server.ts (server), admin.ts (service role, server-only).
  lib/churchTime.ts  The wall clock in Winston-Salem. Events and prayer both schedule by it.
  proxy.ts      Runs before each request. Belongs to auth.
public/         sw.js (push handlers), icons, manifest output.
services/ai/    Python AI service: ingestion, retrieval, answering, speech. Deployed as a Docker image.
docs/           adding-a-feature.md: the recipe every feature follows.
.claude/skills/ One protocol per kind of work (add/change a feature, database, review, AI service, finish, debug).
.claude/hooks/  Enforced checks: tests before a commit, docs before a turn ends.
tests/          rls.test.ts: proves one user cannot read another's rows.
```
Which file answers which question is in [docs/adding-a-feature.md](../docs/adding-a-feature.md) §4, and every
feature README lists its own files.

## 4. Rules of the Codebase
The full recipe is [docs/adding-a-feature.md](../docs/adding-a-feature.md). The rules that keep it honest:

- **Features never import each other's internals.** Composition happens in `src/app/**`.
- **Four features are foundations, not leaves.** `groups` and `permissions` are depended on in SQL (a
  membership check, `has_permission`). `i18n` and `push` are imported directly, on lines marked `// I18N` and
  `// PUSH`. A leaf feature never imports another leaf.
- **Removing a feature = deleting its folder plus marked lines** (`// AUTH`, `// CHAT`, `// ASSISTANT`),
  or the steps under **Remove** in its README.
- **Layers point one way:** page → components → hooks → `api.ts` → Supabase, and page → `server/queries.ts`;
  routes → `server/<action>.ts`.
- **`@/lib/supabase/*` is imported only by `api.ts`, `server/*` and `src/app/**`** — never by a component or hook.
- **`server/*` never imports Next.js**, so a feature can move to another backend by copying that folder.
- **Reads and simple writes go straight to Supabase** (RLS protects them). Writes needing secrets or side
  effects go through a route.
- **User-facing text lives in `strings.ts`** per feature, so the i18n step swaps one file instead of every component.

### Security Model (where trust lives)
| Place | Runs on | Trusted? | Enforces |
|---|---|---|---|
| Client Components | The user's browser | **No** | Nothing. UX only. |
| `src/proxy.ts` | Server | Yes | Redirects (convenience), not a security boundary |
| Server Components, `route.ts` | Server | Yes | Each route verifies the user itself; holds secrets |
| AI service | Server (Docker) | Yes | Requires `Bearer SERVICE_TOKEN`; holds `DATABASE_URL` and AI keys |
| Supabase RLS policies | Database | Yes | **The real boundary.** The anon key is public, so only RLS stops reads. |

**How Supabase decides what a browser can reach** (three gates, in order):
1. **Exposed schema:** only `public` is served. `auth.users` is unreachable.
2. **Grants:** what a role may attempt (`anon`, `authenticated`, `service_role`). Set in each `schema.sql`.
3. **RLS policies:** which rows that role sees. RLS on with no matching policy → nothing.

Supabase grants **everything** on a new table to `anon` and `authenticated` by default. RLS still filters
rows, but a column list (`grant update (name)`) means nothing until the default is revoked first.

- A "server-only" table has no grants and no policies (`document_chunks`).
- Secrets never get a `NEXT_PUBLIC_` prefix; that prefix means "shipped to the browser".
- **Verified 2026-09-15:** anon-key requests to `groups`, `group_members`, `messages` and
  `push_subscriptions` return `[]`, and `users` is "table not found". `npm run test:rls` re-checks this
  automatically, including that one user cannot read another user's rows.
- Moving all browser reads behind our API is backlog B1.

## 5. App Shell
The empty installable app every feature plugs into.

| File | Job |
|---|---|
| `src/app/layout.tsx` | Root HTML, `TabBar`, `ServiceWorkerRegister`, iOS metadata |
| `src/app/manifest.ts` | `/manifest.webmanifest`: name, icons, `display: standalone`, `start_url: /groups` |
| `src/app/page.tsx` | `/` redirects to `/groups` |
| `src/app/loading.tsx` | Instant "Loading…" while a dynamic page renders, so a tap gives feedback |
| `src/components/TabBar.tsx` | Bottom navigation. `TABS` is the only list of tabs. |
| `src/components/PageHeader.tsx` | Sticky title bar |
| `src/components/ServiceWorkerRegister.tsx` | Registers `/sw.js` |
| `public/sw.js` | Service worker. Activates immediately. The push handlers are marked `PUSH`. |

**Expected behavior:** `/` opens `/groups` (or `/login`); tabs switch without a reload; `sw.js`, the manifest
and icons return 200 even when logged out; iOS installs via Share → Add to Home Screen (no prompt).

**Shared UI:** there is none yet on purpose. When a second feature needs the same control, it moves to
`src/components/ui/` — not before. The UI/UX revamp is when that set gets designed properly (backlog B18).

## 6. Features
Each feature's README holds its files, flows, expected behavior, edge cases and removal steps.

### 6.1 auth → [README](../src/features/auth/README.md)
Email + one-time code, because iPhone Home Screen apps don't share Safari's cookies. Sessions live in `sb-*`
cookies for up to 400 days; `src/proxy.ts` refreshes them and redirects logged-out visitors. No tables of our own.

### 6.2 chat → [README](../src/features/chat/README.md)
Messages inside a group. Live updates come from Supabase Realtime (WebSocket, RLS-aware); members with the
app closed are told by push. Sending goes through an API route because it must also notify, which needs the
service-role key. Table: `messages`.

### 6.9 permissions → [README](../src/features/permissions/README.md) · [admin](../src/features/admin/README.md)
Roles are bundles of permissions (`role_permissions`), held by users (`user_roles`). At sign-in a hook copies
the user's permissions into their login token; every admin policy asks `(select has_permission('…'))`, which
reads the token and no table; `layout.tsx` reads the same list once per page to show the Admin tab. Each
feature registers its own permission and brings its own section to `src/app/admin/page.tsx`.

### 6.8 push → [README](../src/features/push/README.md)
Web Push delivery: the device's subscription, the toggle, the service-worker handlers, and
`sendPush(userIds, notification)`. The sending feature decides who is told and what it says; this feature
only delivers, at most one notification per user per topic (`chat:<group>`, `prayer`) per minute, or always
when there is no topic. It also owns the scheduler's side: `POST /api/reminders/send` is called every 15
minutes by a Supabase cron job, and `sendPushOnce` makes each reminder go out once. Tables:
`push_subscriptions`, `push_cooldowns`, `push_sent_once` (the last two server-only).

### 6.3 i18n → [README](../src/features/i18n/README.md)
Every fixed label lives in a feature's `strings.ts` as `{ en, vi }` and is read through `useLanguage().t`.
The language is stored per user in `user_settings`, chosen on the login screen before the account exists
(kept on the device, then adopted on first sign-in), and read once per page load in `layout.tsx` so the first
paint is already right. Admin-written content (events) will be translated with `_en` / `_vi` columns instead.
Table: `user_settings`.

### 6.4 events → [README](../src/features/events/README.md)
The church schedule. Four tables so a phone downloads only what it shows: `events` (when), `event_texts`
(one row per language), `event_cancellations` (a skipped week), `event_reminders` (admin configuration, with
no grant to members at all). A weekly event is stored once and expanded for 8 weeks by `occurrences.ts`.
Visibility is RLS: no group means church-wide, a group means its members only, and soft-deleted rows are
excluded by the policy. Whoever holds `events.manage` creates, edits (English and Vietnamese side by side) and
cancels from the Admin tab: one date (undoable), or the whole event for good, which members then see struck
through for a week. Cancelling goes through a route and pushes to the members who could see the event, each
in their language, outside the one-minute pause. Every date and time is church time (`America/New_York`), computed in
one file, `churchTime.ts`. Reminders are stored but not sent yet.

### 6.5 groups → [README](../src/features/groups/README.md)
The church's groups and who joined which: `groups` and `group_members`, the list page and the Join button.
Everything shared "with my group" (messages, group events, prayer requests) is decided by a membership check
against these two tables inside an RLS policy, so the rule lives in one place.

### 6.6 prayer → [README](../src/features/prayer/README.md)
Requests shared inside a group, with or without the author's name. Members cannot read the table: they read
the `prayer_feed` view, which leaves out who wrote an anonymous request. Praying goes through a route: the
`pray_for_request` function adds exactly one, then the author is told by push ("N people prayed for you");
the count is shown nowhere. The one-hour pause between prayers is a timestamp on the device, not a timer.
Authors edit, delete, or mark a request answered; an answered one leaves the list but stays in the table.
Tables: `prayer_requests`, `prayer_reminders` (admin configuration, no member grant, nothing sends them yet).

### 6.7 assistant → [README](../src/features/assistant/README.md) · [AI service](../services/ai/README.md)
A chat with the church's documents: typed or spoken questions, answers with the pages they came from, read
aloud when the question was spoken. The web feature is thin; the RAG pipeline (ingest → embed → pgvector
search → grounded answer, plus Whisper and follow-up rewriting) lives in `services/ai` and is reachable only
with a bearer token. The conversation is stored on the device, keyed by user id. Table: `document_chunks`
(server-only). Measured retrieval numbers: `services/ai/evaluation/results.md`.

## 7. Database
| Table | Owner | Notes |
|---|---|---|
| `auth.users` | Supabase | Built in; one row per account, created on first sign-in |
| `role_permissions`, `user_roles` | permissions | **Server-only.** Read by Supabase Auth while it builds a token; rows added by hand. |
| `groups` | groups | Active groups readable by any signed-in user; created, renamed and removed (`deleted_at`, never erased) with `groups.manage` |
| `group_members` | groups | Users see only their own rows, and only in active groups: this is what silences a removed group everywhere. No member can insert; the way in is `approve_join_request`. |
| `group_join_requests` | groups | Someone asked to join. Users insert and see their own; `groups.manage` sees all, declines (delete) and approves (function). |
| `messages` | chat | Members read; members insert as themselves; in the Realtime publication |
| `push_subscriptions` | push | Users manage their own rows; the admin client reads all to send pushes |
| `push_sent_once` | push | One row per scheduled send already made, by key. **Server-only**; written by `claim_push_once`. |
| `push_cooldowns` | push | When each user was last notified per topic. **Server-only:** no grants, no policies; written by `claim_push_turns`. |
| `document_chunks` | assistant | **Server-only:** RLS on, no grants, no policies. `vector(1024)` + HNSW index. |
| `user_settings` | i18n | One row per user: their language. Owner-only read and write. |
| `events` | events | When an event happens. Church-wide when `group_id` is null. Members read; `events.manage` writes. Soft-deleted rows hidden from members by the policy. |
| `event_texts` | events | One row per language per event. Members read; a missing row falls back to the other language. |
| `event_cancellations` | events | One skipped week of a recurring event. |
| `event_reminders` | events | Which reminders an event has. Read and written only with `events.manage`; the scheduler reads it with the service role. |
| `prayer_requests` | prayer | Members insert (3 columns), edit the words of their own, mark their own answered, delete their own. **No read grant:** reading goes through the view. |
| `prayer_feed` (view) | prayer | What members read: their groups' unanswered requests, without the author of an anonymous one and without the count. |
| `prayer_reminders` | prayer | A weekly nudge per group, several allowed. Read and written only with `prayer.reminders`. |

Every table is covered by `tests/rls.test.ts`.

## 8. Environment Variables
| Name | Used by | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `lib/supabase/*` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `lib/supabase/*` | Public key; safe because RLS protects the data |
| `SUPABASE_SERVICE_ROLE_KEY` | `lib/supabase/admin.ts` | **Secret.** Bypasses RLS. Server only. |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | push | Identifies our server to push services |
| `VAPID_PRIVATE_KEY` | `push/server/sendPush.ts` | **Secret.** Changing it breaks every existing subscription. |
| `VAPID_SUBJECT` | `push/server/sendPush.ts` | `mailto:` contact for push services |
| `CRON_SECRET` | `app/api/reminders/send/route.ts` | **Secret.** What the Supabase cron job sends to prove it is the scheduler. Unset = the route refuses everyone. |
| `AI_SERVICE_URL` | `assistant/server/aiService.ts` | Where the AI service listens (no trailing slash). Server only. |
| `AI_SERVICE_TOKEN` | `assistant/server/aiService.ts` | **Secret.** The service's `SERVICE_TOKEN`. |

The AI service has its own settings in `services/ai/.env` (see `.env.example` there).

## 9. Setup & Deploy
**Local:** Node LTS (tested on 24.19.0), the project outside OneDrive, `.env.local` filled in (§8),
`npm install`, `npm run dev`. `npm run build` type-checks. `npm test`, `npm run test:rls`.

**Web app (Netlify + GitHub):** import the repo; Next.js is detected, so no `netlify.toml`. Add every
variable in §8; mark **only** `SUPABASE_SERVICE_ROLE_KEY`, `VAPID_PRIVATE_KEY`, `CRON_SECRET` and `AI_SERVICE_TOKEN` as
"Contains secret values" — never a `NEXT_PUBLIC_*` one, because Next copies those into the build on purpose
and the scanner would fail the build. Keep the same VAPID keys as local, or existing subscriptions break.
Every push to `main` redeploys. Live: https://vietcorners.netlify.app

**AI service (Docker + Tailscale Funnel, until the Oracle VM exists):**
1. `docker build -t vietcorner-ai services/ai`, then
   `docker run -d --restart unless-stopped -p 8000:8000 --env-file services/ai/.env --name vc-ai vietcorner-ai`
   (leave `SHOW_API_DOCS` unset: the URL is public).
2. `winget install Tailscale.Tailscale`, sign in (free Personal plan), then `tailscale funnel --bg 8000`.
3. `tailscale funnel status` gives `https://<pc>.<tailnet>.ts.net`. Put that in Netlify as `AI_SERVICE_URL`.
4. The PC must stay awake and Docker Desktop must start at login. `tailscale funnel --https=443 off` stops sharing.
- Hugging Face Spaces would need a paid plan since 2026; `services/ai/deploy/push_to_space.py` is kept for later.

### Key Decisions
| Decision | Why | Trade-off |
|---|---|---|
| One Next.js codebase, no separate backend | Least to learn, deploy and keep in sync | No Python libraries, no long jobs; mitigated by thin routes |
| Supabase instead of our own auth/DB | Login, Postgres, RLS and vectors for free | Vendor lock-in on user ids; free projects pause after ~7 idle days |
| Email one-time code, not a magic link | iOS Home Screen apps don't share Safari's cookies | Users type a code |
| Permissions ride in the login token, and policies name a permission, not a role | A check reads the token: no lookup per query, at any size. New roles are rows, not policy rewrites. | A role change waits for the token to refresh (up to an hour); the hook is switched on in the dashboard, and a broken hook blocks every sign-in |
| Authorization in RLS, not TypeScript `if`s | Browsers query Supabase directly, so the database is the only check that covers every path | Blocked reads look empty rather than failing; needs the RLS tests |
| Web Push instead of a native app | No app store, one codebase | iOS needs Add to Home Screen and iOS 16.4+ |
| Send messages through a route, not straight to Supabase | Sending must also push, which needs secrets | One extra hop per message |
| Service-role client for push | RLS correctly hides other users' subscriptions and memberships | A powerful key on the server, used only in `server/` files that send a notification |
| One notification per user, per topic, per minute, decided in the database; no topic = an announcement that always arrives | Every message buzzing every member gets notifications switched off; one SQL statement makes the check race-free. A cancelled event must never be the one swallowed. | Messages inside the minute are silent and nothing follows up (no scheduler) |
| Reminders are sent by one 15-minute tick that asks "what is due?", each send claimed once by key | Nothing to keep in step when events change, dates are cancelled or the clocks move; overlapping or late runs cannot double-send | A reminder arrives up to 15 minutes late; a send that fails after its claim is lost; the job and its secret are set up by hand in Supabase |
| Cancelling an event for good is the app's delete, and it lingers a week for members | One red button instead of Cancel and Remove; people who missed the push still see it struck through | It cannot be undone from the app; the week is a filter in the schedule query, not a stored state |
| Push delivery is its own feature, imported by its senders | Chat and prayer both notify; one place knows VAPID and cleans up dead subscriptions | A second foundation that leaf features import (`// PUSH`) |
| Netlify over Vercel | Free tier allows commercial use; git push deploys | Next runs through Netlify's adapter, so verify routes after a Next upgrade |
| Layered feature shape (`api.ts` / `hooks` / `components` / `server`) | Every change has one predictable home | More, smaller files; some queries exist on both sides |
| Feature detail lives in feature READMEs, not here | This file stayed readable while features doubled | Two places to update: this summary and the README |
| Separate Python AI service | Models need a warm process and ~2 GB RAM; Python is the AI ecosystem | A second deployable and one more network hop |
| The AI service ships as a Docker image, hosted on the dev PC behind Tailscale Funnel | Oracle needs a credit card; Hugging Face Docker Spaces became paid. The image, not the host, is what moves. | Only up while the PC is awake — fine for QA, not for the church |
| The AI service is synchronous (plain `def` + thread pool) | Throughput is capped by free LLM tiers and CPU embedding, never by threads | Each waiting request holds a thread; shared state must return results, not store them |
| LLM calls get a real deadline on a background thread | An HTTP timeout resets on every byte; a stuck provider ran 110 s | An abandoned call keeps its thread until the provider replies |
| Chat providers are config, asked in order of preference | Free tiers cap tokens per minute; the fastest answers until it throttles | Fallback quotas idle while the primary is healthy |
| Follow-up questions are rewritten server-side before retrieval | A search index has no memory; one worked example in the prompt made a small model resolve "nhóm khác" | One extra LLM call per turn; it can narrow a question that already stood alone |
| The assistant's conversation lives in localStorage, keyed by user id | Nothing server-side to leak, survives closing the app, keeps shared phones separate | Stays on the device after sign-out until "New chat"; no sync between devices |
| Every event date and time is church time, computed in one file with `Intl` and no date library | The server runs on UTC and phones run anywhere; one wall clock makes them agree, keeps a weekly event at its hour across the clock change, and matches a cancelled week to the right day | Someone abroad sees the church's hour, not their own; `churchTime.ts` has to be right, so it is the most tested file in the feature |
| A weekly event is stored once and expanded in code, not copied per week | One row stays the truth; cancelling one week is a row in `event_cancellations`, and an endless weekly event never fills the table | The schedule only reaches 8 weeks ahead, and "what happens on 3 March" needs the expansion to run |
| Prayer requests are read through a view, never the table | RLS hides rows, not columns: a policy alone would let any member select the author of an "anonymous" request | A fourth pattern to know; the view runs with its owner's rights, so its `where` clause is the security and needs its own tests |
| Prayers are a counter raised by a function; the pause between them is local | Who prayed is never stored, and nobody can write the number directly | "N people" can be one person several times; the pause does not stop a direct caller (B22) |
| The author learns of a prayer by push only; the count is on no screen | A notification reaches someone who is not looking at the app, and a number on a card invites comparing requests | At most one a minute; an author without notifications is never told |
| Answered requests leave the feed but are never deleted | The list stays about what still needs prayer; the history feeds an end-of-year look back | Marking as answered cannot be undone from the app |
| A cooldown is a stored timestamp, not a running timer | Correct after the app was closed for hours; nothing to resume or leak | The button returns up to 30 s late (one shared clock tick) |
| A request to join is its own table, and approval is the only way into `group_members` | A group's chat, events and prayers are private only if joining is; a separate table keeps "is a member" meaning one thing, so no other feature changed | Every join waits on a person; managers are told by push so requests do not sit unseen |
| A removed group is silenced by hiding its memberships, not by editing every feature | Chat, events and prayer already ask "is the caller a member?"; one policy answers no for a removed group | Code that skips row rules (prayer's view and function, anything using the service role) must check `groups.deleted_at` itself |
| `groups` is its own feature, and others depend on it only in SQL | Chat, events and prayer all share by group; one owner for membership means one truth and chat stays removable | `groups` cannot be removed while any of the three exists |
| **Fixed UI labels are translated in code; admin-written content is translated in the database** | Labels change only when a developer changes a screen, so a table would add caching, fallbacks and a deploy-free path nobody needs. Event titles are data an admin writes, so they get `_en`/`_vi` columns. | Two mechanisms to understand. A label fix needs a deploy. |
| **The language is read on the server, then held in a client provider** | The first paint is already in the right language, and the toggle switches every label without a page fetch | `PageHeader` had to become a Client Component; a Server Component keeps the language it rendered with |
| bge-m3 as the embedding model (measured, 41 questions) | Best at Vietnamese question → English page (vi Recall@5 0.49, MRR 0.56) | Weakest answerable/unanswerable separation, which no model does well enough to use |
| Refusal comes from the prompt, not `SIMILARITY_FLOOR` | No model separates answerable from unanswerable (AUC 0.64–0.71) | The floor stays 0.35 as a gibberish guard; answer-quality tests matter more (B13) |
| Load bge-m3's official `.bin` weights, not a converted `.safetensors` | The conversion is an unmerged bot PR; measured identical vectors and no faster load | Relies on torch ≥ 2.6, which the image has |
| No RAG framework | Every stage is visible, testable code | We hand-write what frameworks provide |

## 10. Change Log
- 2026-09-14: Harness files; app shell; auth (email code, proxy redirects); chat (schema + RLS, Realtime, push, service worker); first Netlify deploy.
- 2026-09-15: Fixed chat going silent when opened from a notification (Realtime joined before the auth token). Restructured auth + chat into the standard feature shape. Added `.claude/backlog.md`. Scaffolded `services/ai` (M0).
- 2026-09-21: M6: AI service containerized; provider reliability (busy vs broken, real deadlines, preference order); input limits; 503s; DB pool; startup warm-up and fail-fast; private per-request logging; `SHOW_API_DOCS`.
- 2026-09-22: M7: assistant chat UI (typed + spoken), per-user localStorage history, manual retry with a growing wait, server-side follow-up rewriting (`rag/condense.py`). Vitest added. AI service hosted on the PC behind Tailscale Funnel after Hugging Face made Docker Spaces paid.
- 2026-09-29: M7 phone QA passed. M8 cleanup: per-feature detail moved into feature READMEs (this file is system-level again), `docs/adding-a-feature.md` recipe with RLS patterns, `strings.ts` convention (auth migrated), automated RLS tests (`npm run test:rls`), `useChatbotMessages` renamed `useConversation`, pages get the user one way.
- 2026-09-29: Added `.claude/skills/` (seven protocols) and `.claude/hooks/` (commit blocked on failing build or tests; turn blocked once when code changed without the written record). Skills are checklists; the hooks are what enforce.
- 2026-10-05: events (members' schedule): four tables, weekly expansion with per-week cancellations, group or church-wide visibility in RLS, reminders invisible to members, seeds covering every edge case. Admin editing and the cancellation push wait for the admin feature.
- 2026-10-05: events QA: the seed script failed because `created_by` defaulted to `auth.uid()`, which is null in the SQL Editor; `created_by` is now nullable with the reason recorded. i18n verified end to end against the real database (toggle → row written → server render in the stored language). Review fixes: `formatting.ts` for dates and times, `SerializedOccurrence` moved to `types.ts`, Escape and dialog semantics on the details panel. Timezone limitation recorded as B21.
- 2026-10-05: events schedule verified against the seeds as a member and a non-member (results in the events README). Seed text reached the database corrupted because it was copied from PowerShell output; the file is correct, and the database-change skill now says to copy from the editor.
- 2026-10-05: B20: `groups` and `group_members` moved out of chat into `src/features/groups/` (tables, list page, Join button). No database change. Chat keeps messages and push; events and prayer depend on groups, not on chat.
- 2026-10-05: prayer requests: `prayer_requests` + `prayer_feed` view (anonymity by column, not by UI), `pray_for_request`, `prayer_reminders`, the Prayer tab with paging on scroll and a local one-hour pause. `LOCALES` moved into i18n so events and prayer format dates the same way. Permissions proven by a 27-check dry run; the schema is not applied and the screen not exercised yet.
- 2026-10-05: push delivery moved out of chat into `src/features/push/` (`sendPush`, the subscription table, the toggle, the `sw.js` handlers). No database change. Chat's `notifyGroup` now only decides who is told. Not re-tested on a real phone since the move.
- 2026-10-06: prayer, second pass: authors can edit; answered requests leave the feed (kept in the table); the prayer count left the screen and became a push to the author through `POST /api/prayer/pray`; delete no longer asks; "more…" is measured instead of estimated. Needs the migration block (grant, view, function).
- 2026-10-06: notification pause: `push_cooldowns` + `claim_push_turns`, `topic` on every notification (also its tray `tag`). One notification per user per topic per minute. Run the SQL before deploying, or no notification is sent.
- 2026-10-06: permissions: `role_permissions` + `user_roles`, a token hook that writes `permissions` into the login token, `has_permission`, the admin-only tab and page, and the first section (groups: create, rename). Needs the SQL and the dashboard hook switch.
- 2026-10-06: groups can be removed by a manager: soft (`deleted_at`), never erased, and silenced everywhere through the membership policy. Prayer's view and function check it themselves.
- 2026-10-06: events admin section: `events.manage`, create / edit with English and Vietnamese side by side / cancel one week or the whole event with a push per language (`POST /api/events/cancel`) / remove. All event dates and times moved to church time (`churchTime.ts`, closes B21 for events). An admin's own schedule shows every group's events.
- 2026-10-06: events admin reworked to one "Edit event" panel: fields, next four dates with Cancel / Undo, and "Cancel this event permanently" (replaces Remove; members see it one more week). Cancellation and undo notifications carry no topic, so each arrives outside the one-minute pause.
- 2026-10-06: prayer moderation put on hold (backlog B24): groups are meant to be private, so admins get no access to prayer requests until the pastor decides. No code changed.
- 2026-10-06: joining a group needs approval (B5): `group_join_requests`, `approve_join_request`, members lose insert on `group_members`, "Waiting to join" in the Groups admin section, pushes to managers (on a request) and to the person (on approval).
- 2026-10-06: reminders: event reminders (three choices, in the Edit panel) and weekly prayer reminders per group (Admin tab, `prayer.reminders`); `POST /api/reminders/send` behind `CRON_SECRET`, called every 15 minutes by a Supabase cron job; `push_sent_once` + `sendPushOnce`. `churchTime.ts` moved to `src/lib` (prayer uses it too).
- 2026-10-07: prayer reminders: adding one that already exists is no longer reported as a failure (a second tap sent the same reminder twice and got 409), and the section's buttons are disabled while saving. The same gap in other admin forms is backlog B25.
