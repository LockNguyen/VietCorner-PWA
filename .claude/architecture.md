# VietCorner PWA: Architecture

> How this system works, at the system level. Per-feature detail lives in each feature's README, so this
> file stays readable as features are added. Read top to bottom; follow the links when you need depth.

## 1. Overview
An installable web app (PWA) for a Vietnamese church community, mostly elderly users.

| Feature | Folder | README | Status |
|---|---|---|---|
| Login | `src/features/auth/` | [auth](../src/features/auth/README.md) | Email link, no passwords (2026-10-17); hand-off seen end to end on a local build, not yet with a real email or on an iPhone |
| Sign-up approval | `src/features/approval/` | [approval](../src/features/approval/README.md) | Built 2026-10-12; SQL not run, nothing seen signed in |
| Groups + membership | `src/features/groups/` | [groups](../src/features/groups/README.md) | Done. Joining and the old Groups page are **switched off**; admins put people into groups |
| Groups page | `src/features/group-info/` | [group-info](../src/features/group-info/README.md) | Built 2026-10-12 with pictures; SQL not run, nothing seen signed in |
| Group chat | `src/features/chat/` | [chat](../src/features/chat/README.md) | **Switched off** 2026-10-12 (`SWITCHES.chat`). Was live, phone QA passed |
| Push delivery | `src/features/push/` | [push](../src/features/push/README.md) | Done (moved out of chat 2026-10-05; not re-tested on a phone since the move) |
| Voice + chat assistant (RAG) | `src/features/assistant/` + `services/ai/` | [assistant](../src/features/assistant/README.md), [AI service](../services/ai/README.md) | Done through M7, phone QA passed |
| Text size | `src/features/text-size/` | [text-size](../src/features/text-size/README.md) | Built 2026-10-17: Gọn / Chữ to per phone (cookie), in Settings and sign-up; seen on a local build |
| English/Vietnamese | `src/features/i18n/` | [i18n](../src/features/i18n/README.md) | Built: per-user language, every fixed label translated |
| Event schedule | `src/features/events/` | [events](../src/features/events/README.md) | Schedule and admin section built (create, edit, translate, cancel with a push, remove); the admin screen is not exercised yet |
| Prayer requests | `src/features/prayer/` | [prayer](../src/features/prayer/README.md) | Built; permissions proven. The screen and a real notification are not exercised yet |
| Roles and permissions | `src/features/permissions/` | [permissions](../src/features/permissions/README.md) | Built; the token hook must be switched on in the dashboard |
| Admin page | `src/app/admin/` | [admin](../src/features/admin/README.md) | Tab, page, and the Events and Groups sections built; reminders to come. Prayer moderation is on hold (B24). |

**Switched off, not removed** (the pastor's review, 2026-10-12): `src/lib/switches.ts` lists them, and §4 says how off works.

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
  components/   The app shell (PageHeader, AppTabs, HomeTiles, ServiceWorkerRegister) and ui/, the component library.
  features/     One folder per removable feature. The only place feature logic lives.
  lib/supabase/ client.ts (browser), server.ts (server), admin.ts (service role, server-only).
  lib/switches.ts    What is switched off for now, one constant each. Read at the door of what it turns off.
  lib/churchTime.ts  The wall clock in Winston-Salem. Events and prayer both schedule by it.
  lib/README.md      Why the hooks below exist and how they work.
  lib/usePending.ts  Which action of a component is on its way to the server; ignores a second tap.
  lib/useWhenDrawn.ts  Starts a router change and resolves when its result is drawn. Under the next two.
  lib/useRefresh.ts  Reloads the page's server data and resolves when it is on screen.
  lib/useGoTo.ts     Moves to another screen and resolves when it is on screen.
  lib/useOnArrival.ts  Runs something on arrival at a screen and on return to the app.
  lib/useFresh.ts    A list shows what the page loaded, then re-reads itself on arrival and on return to the app.
  components/RefreshOnArrival.tsx  An admin editor (a person, a group) reloads its page on arrival: its switches must not show a kept copy.
  lib/shrinkImage.ts   A photo → a smaller JPEG in the browser, before upload.
  lib/cropImage.ts     The square a person framed → a small JPEG in the browser (their picture).
  lib/publicFileUrl.ts The address of a file in a public storage bucket.
  lib/useWhenVisible.ts  Calls back when an element scrolls into view: "load more" (prayer, group pictures).
  lib/useScrollToEnd.ts  Keeps the newest message of a conversation in view (chat, the assistant).
  lib/useBanner.tsx  The banners on screen: raise one from anywhere; each leaves when its time is up.
  lib/useSave.ts     A change from tap to result: usePending + the change + useRefresh + a banner.
  proxy.ts      Runs before each request. Belongs to auth.
public/         sw.js (push handlers, saved code files), icons, manifest output.
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
- **Five features are foundations, not leaves.** `groups` and `permissions` are depended on in SQL (a
  membership check, `has_permission`). `i18n`, `push` and `profiles` are imported directly, on lines marked
  `// I18N`, `// PUSH` and `// PROFILES`. A leaf feature never imports another leaf.
- **Removing a feature = deleting its folder plus marked lines** (`// AUTH`, `// CHAT`, `// ASSISTANT`,
  `// APPROVAL`, `// GROUP-INFO`), or the steps under **Remove** in its README.
- **Switching a feature off = one `false` in `src/lib/switches.ts`.** Its page or route answers 404 on its
  first line, its sender returns before sending, its tab is left out. Why: the code keeps compiling and
  phones download nothing of it; the database is untouched (`src/lib/README.md`).
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

**Sign-up is open; using the app is not.** An account no admin approved lacks the permission `app.use`,
and every table a member can reach carries a restrictive policy that asks for it (the `approval` README).
A new table needs its line there, or it is open to anyone with an email address.

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
| `src/app/layout.tsx` | Root HTML, the centred column, `AppTabs` (signed in only), `ServiceWorkerRegister`, iOS metadata. Shows the signed-in setup steps in place of any page, in order: name (`profiles`), notifications (`push`, once per device), waiting for an admin (`approval`). |
| `src/components/SetupProgress.tsx` | "Step 2 / 6" over a `ui/ProgressBar` on every setup screen. Holds the one ordered list of setup steps (sign in, name, email, notifications, waiting, done: the last never shown). |
| `src/app/manifest.ts` | `/manifest.webmanifest`: "Viet Corners" under the icon (`APP_NAME`), icons, `display: standalone`, `start_url: /` |
| `src/app/page.tsx` | Home: where the app opens. Three tiles into Events, Prayer and Groups (`HomeTiles`), each a photo from `public/images/home` under a dark veil |
| `src/app/loading.tsx` | Grey placeholder rows at once while a dynamic page renders, so a tap gives feedback and the screen does not jump |
| `src/components/AppTabs.tsx` | Which tabs exist (`TABS`: Home, Events, Prayer, Groups; Admin for those with a permission) and which is current. Draws them with `ui/TabBar`. |
| `src/components/PageHeader.tsx` | The top bar as this app fills it: title, a back arrow on sub-screens (`backHref`), the assistant icon and Settings, drawn as the person's own picture (2026-10-20). Draws it with `ui/TopBar`. |
| `src/components/MyPicture.tsx` | The signed-in person's picture address, put in context by `layout.tsx` (from `getMyProfile`, read once per page load) for `PageHeader` |
| `src/components/PhoneNumber.tsx`, `Place.tsx` | A number to tap (call / text / copy) and a place to tap (its address over Google Maps / Apple Maps / copy, logos in `ui/MapLogos`), both on `ui/ActionMenu` |
| `src/components/ServiceWorkerRegister.tsx` | Registers `/sw.js` |
| `public/sw.js` | Service worker. Activates immediately. The push handlers are marked `PUSH`. The `CACHE` part keeps a copy of every `/_next/static/*` file (cache `static-v1`, newest 150) and answers from it first. Only responses marked `immutable` are saved (production's hashed files; `next dev` reuses names, so it never fills the cache). If storage fails it falls back to the network. The `HOME` part saves `/` (cache `home-v1`) at every launch and shows the saved copy at the next one while the fresh page is fetched and saved; a redirect from the server (signed out) or any page load of `/login` (Sign out, an ended session) deletes it; a reload while the fresh Home is still on its way (Next.js does one after a deploy) waits for it. No other page is saved. The `PHOTOS` part (2026-10-21) keeps the groups' private pictures (cache `photos-v1`, newest 300) under their Supabase address without the `?token=` signature, so a newly signed address still finds the saved copy; only CORS answers are saved (`crossOrigin` on `ui/PhotoThumb` and `ui/Lightbox`); a page load of `/login` deletes it with Home. Activating deletes any cache but these three. |
| `src/components/RefreshSavedPage.tsx` | In the root layout with `renderedAt` (when the server made the page). On the saved Home (`isSavedCopy`) it asks for the current one at once (`router.refresh`). |
| `public/launch/*.png`, `src/lib/launchScreens.json` | iPhone launch pictures (the icon centred on white), one per screen size in the JSON list; `layout.tsx` links each as `apple-touch-startup-image` and adds Apple's `apple-mobile-web-app-capable` tag. Remade by `node scripts/make-launch-images.mjs`. `proxy.ts` skips `launch/` so they load signed out. |
| `src/lib/savedHome.ts` | `isSavedCopy(renderedAt)`: a page made over a minute ago is the saved Home (used by `RefreshSavedPage` and launch-info). `forgetSavedHome()`: deletes the saved Home. Called by the language toggle (`LanguageProvider`), so the next launch is not in the old language. |
| `src/components/ui/TabBar.tsx` (`prefetch={true}`) | Each tab's whole page (data included) is loaded as soon as the bar shows, kept 10 min (`staleTimes.static`). |

**Expected behavior:** `/` is Home (or redirects to `/login`); signing in lands on Home; the tab bar is
absent until signed in; the assistant and Settings open from the top-right icons and have a back arrow to
Home; Settings is a list (Messenger's layout: picture and name, rounded groups of rows showing each value,
each row sliding in its own `/settings/<name>` screen, a red Sign out far below that asks for a second tap);
tabs switch without a reload; `sw.js`, the manifest
and icons return 200 even when logged out; iOS installs via Share → Add to Home Screen (no prompt).
The second load after a new `sw.js` answers all code files from the `static-v1` cache (checked in Chrome,
2026-10-14: 10/10 on `/login`, cache `static-v1` only). Launch measured on an iPhone (XR/11 screen) before the cache
(2026-10-14, after a restart): page from the server 1.1 s, code files 21 s, tappable 22.5 s with 1 of 10 files
still cached; a second launch 1.3 s with 7 of 10. After (same phone, restarted, app not re-added): 10 of 10
from the saved copy, page 1.1 s, files read 6.6 s, tappable 6.85 s. The new `sw.js` arrived without a reinstall.
Not explained yet: 5.5 s between the page arriving and its files being read, with every file saved.
Launch pictures (`apple-touch-startup-image`) did not show on 2026-10-14, even after re-adding the app. Second try
2026-10-17 with Apple's own `apple-mobile-web-app-capable` tag added (Next.js writes only the newer one): not yet seen on the phone.

**Shared UI:** `src/components/ui/` is the component library of the UI revamp, built slice by slice from
`docs/design-system.md` under the `frontend` skill. Its README lists what exists; `/ui` shows every
component in every state (admins in production; anyone on a developer's machine, where it needs no
sign-in so the library can be looked at without an account). The design tokens live in
`src/app/globals.css`. Every screen is built from it; no component carries a colour or a size of its own.

**Every button that starts a request** is a `Button` driven by `usePending` (`src/lib/usePending.ts`):
- The first tap runs the action; taps while it is running are ignored. (A second tap used to send a second
  login code, create a second identical event, or show "could not save" for something that had saved.)
- The tapped button turns into a turning circle, with words where they help ("Saving…"); the other buttons
  of the same row are disabled until it finishes.
- A list gives each row its own component, so its own `usePending` and its own error line: a busy row never
  blocks the rows around it.
- After the change, the page's data is reloaded with `await refresh()` (`src/lib/useRefresh.ts`), which
  resolves when the new data is drawn. The button therefore stays busy until what it shows has changed;
  with a bare `router.refresh()` it flashed its old label first ("Cancel", then "Undo").
- **How it went is said in a banner** (`useBanner`): green for success (2 s), red for an error (8 s), at the
  bottom above the tabs; a tap puts one away; several show as a stack that a tap opens. No red text under a
  button. `useSave` (`src/lib/useSave.ts`) is the whole sequence in one call: ignore a second tap, make the
  change, reload, raise the banner. A form's own hints ("add a title") stay beside the field.
- Left as plain buttons on purpose: ones that only open or close something, and four that already cannot
  repeat (chat Send empties its box at once, the assistant's Send is disabled while answering, Pray is spent
  for the day on the first tap, the language toggle is instant and repeating it changes nothing).

## 6. Features
Each feature's README holds its files, flows, expected behavior, edge cases and removal steps.

### 6.11 approval → [README](../src/features/approval/README.md)
A new account waits until an admin lets it in. Approving gives it the role `member`, whose permission
`app.use` rides in the login token; the database refuses everything else without it, through one
restrictive policy per table. `layout.tsx` shows the waiting screen in place of every page, after the name
question; the screen renews the token on every return to the app, so nobody signs in twice. Admins are
told once per account, the person is told when approved. No tables: "waiting" is "named, and without
`app.use`". Functions: `waiting_accounts()`, `approve_account()`. Routes: `POST /api/approval/request`,
`/approve`.

### 6.1 auth → [README](../src/features/auth/README.md)
Email only, no passwords (2026-10-17). `/login` opens on sign-in (no bar): the address, "Sign in", and
"Create new account?" under it. An address with no account (`account_exists()`) gets the banner "Account not
created yet. Create new account?" and no email; otherwise our server has Supabase email a sign-in link
(`POST /api/auth/link` → `signInWithOtp`, never creating an account). "Create an account" asks name and email
and sends the same link (the name goes in as metadata, saved by the profiles trigger). An iPhone opens links in
Safari, which shares no login with the Home Screen app, so the link hands the sign-in to the device that asked:
the app keeps a secret key (one per church day) and puts only its hash in the link; our server adds a key of its
own that only the email carries. One tap ("Sign in") on the link's page marks it tapped; the app collects with
its key and gets a fresh one-time token (`generateLink`). On a phone, signing in starts only in the installed app
(the install guide covers `/login` in a browser, 2026-10-20). Every link of the same church day works, even after
newer ones were sent (2026-10-19). Sessions live in `sb-*` cookies for up to 400 days, renewed on every visit;
`src/proxy.ts` refreshes them and redirects logged-out visitors. Supabase's refresh-token reuse detection is
off (README Setup 6): a phone that missed a renewal's reply would otherwise be signed out at its next launch,
most often right after a deploy. Table: `sign_in_links` (server-only).
Routes: `POST /api/auth/link`, `/handoff`, `/claim` (none has a user to verify; the README says what guards them).

### 6.13 install → [README](../src/features/install/README.md)
`/login` in a browser tab (the website) first asks the language (i18n's `LanguageChoice`, both languages at
once), then shows how to put the app on the Home Screen, **before** any sign-in or sign-up (2026-10-20): Chrome's
own Install dialog behind one button where it offers one, otherwise steps for iPhone Safari (Share → Add to Home
Screen), Chrome on an iPhone (Share at the top right), Android (⋮ menu) or a chat app's browser (open in a real
browser first), with a big bouncing arrow at the edge pointing at the browser's first button. Only a computer may
"Continue in this browser". The installed app opens straight on sign-in. No data, no server code; `device.ts`
reads the user agent and where the button is (tested).

### 6.15 launch-info → [README](../src/features/launch-info/README.md)
An "i" on Home for whoever manages something (the same check as the Admin tile), where "+" sits on the other
tabs. It opens "For developers: this launch": whether Home came from the saved copy or the server, when the
page arrived, when the code files were read, when Home was ready to tap, when everything loaded, and how many
code files came from the saved copy versus the network. Read from the browser's own timing records
(`launchTimes.ts`, tested). No data, no server code. The black screen before the page starts is iOS and is
not counted. Seen in the preview at phone width, signed in (2026-10-17); not yet on the iPhone.

### 6.14 people → [README](../src/features/people/README.md)
The Admin tab's list of everyone, and a screen per person: a switch per role (one small role per permission,
plus "member" and "admin"), a switch per group, and removing the account. Database functions check
"users.manage" themselves (`people_list`, `set_person_role`, `remove_person`); no route.

### 6.2 chat → [README](../src/features/chat/README.md)
**Switched off (2026-10-12):** its page and its route answer 404. What follows is how it works when on.
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
`push_subscriptions`, `push_cooldowns`, `push_sent_once` (the last two server-only). Since 2026-10-12 only
three kinds are sent: prayer reminders, "someone signed up" and "you were approved" (the push README lists
what is off and where). `NotificationStep` is a setup screen: asked once per device after the name, until
notifications are on or the person taps "not now"; the answer is a device cookie the layout reads.

### 6.10 profiles → [README](../src/features/profiles/README.md)
What a person is called. `profiles` holds one row per account, made by a database trigger and named after
the email until the person answers "What is your name?", which `layout.tsx` shows in place of every screen
after the first sign-in. A name is read by its owner, by people in a group with them and by group managers;
a person in no group sets their own; once in a group a new name is a request (`name_requests`) that someone
with `groups.manage` approves in the Admin tab, so nobody can take another's name unseen.
Routes: `POST /api/names/request`, `POST /api/names/approve` (each notifies).
Names are looked up by user id, never copied onto a message: pages call `getNames`, chat keeps up with new
senders through `useNames`, and the prayer feed joins them in its view. Tables: `profiles`, `name_requests`.
A picture (2026-10-19): chosen in Settings, framed in a circle (`ui/ImageCropper`, drag and pinch), cropped to a
400 px JPEG on the phone (`lib/cropImage.ts`), saved to the public bucket `avatars` in the owner's folder and
pointed at by `profiles.avatar_path` through `set_my_avatar`. Shown beside prayer requests (`prayer_feed.author_avatar`,
null when anonymous) and in the Admin people list (`people_list().avatar_path`).

### 6.3 i18n → [README](../src/features/i18n/README.md)
Every fixed label lives in a feature's `strings.ts` as `{ en, vi }` and is read through `useLanguage().t`.
The language is stored per user in `user_settings`, chosen on the website's first screen before the account
exists (kept on the device in localStorage and the `language` cookie, which iOS copies from Safari into the
installed app; adopted on first sign-in), and read once per page load in `layout.tsx` (the account's, else the
cookie) so the first paint is already right. The language link wears a globe. Admin-written content (events) will be translated with `_en` / `_vi` columns instead.
Table: `user_settings`.

### 6.4 events → [README](../src/features/events/README.md)
The church schedule, read in one trip through the function `upcoming_events()` and kept fresh by the list
itself (`useFresh`). Four tables, one job each: `events` (when), `event_texts`
(one row per language), `event_cancellations` (a skipped week), `event_reminders` (admin configuration, with
no grant to members at all). A weekly event is stored once and expanded for 8 weeks by `occurrences.ts`.
Visibility is RLS: every event is church-wide (no group since 2026-10-12), read by every approved member,
and soft-deleted rows are excluded by the policy. Whoever holds `events.manage` creates, edits (each text in English, then Vietnamese) and
cancels from the Edit list on the Events tab, where each event opens its own screen (`/events/<id>/edit`, or `/events/new`): one date (undoable), or the whole event for good, which members then see struck
through for a week. Cancelling goes through a route; its push to the church, and the reminders before an event, are
switched off for now (`eventChangePush`, `eventReminders`). Every date and time is church time (`America/New_York`), computed in
one file, `churchTime.ts`. The schedule shows each event as a card (`ui/PhotoCard`, 2026-10-19): its own
picture, or the church's (`public/images/home/events.png`), darkened, with the title, "weekday · time", the
place in white, and "Liên lạc:" with the number in blue: tapping the number opens its call / text / copy menu
(`ui/ActionMenu`) instead of the event. An event may have an address (`events.address`, one for both languages,
2026-10-20): then the place is blue too, and a tap opens a wider menu with the full address, Google Maps, Apple
Maps and Copy (`components/Place`); the address itself is not on the card. A day's events at one place (same
location, address and contact) share one card (`cardsOf`, 2026-10-20): the place as title, a line per event
with its time, the address in blue, the contact.
**The weekly card (2026-10-21, the user):** the tab's first card, never under a date. The church picture with at
least 160 px showing above the words (`PhotoCard` `pt-40`), the title from `weekly_card` (one row, `title` /
`title_en`, address, number; schema.sql 3h), then each weekday Sunday first, a line per weekly event and per group
meeting in time order, indented: "Thờ Phượng · 10:30a" (`weekly.ts` `byWeekday`, `formatShortTime`). The page
(`src/app/events/page.tsx`) turns `group_directory()` rows with a weekday and time into `WeeklyMeeting`s
(name / name_en), so events imports nothing of group-info. Only one-time events stay under date headings. The
whole tab writes times "9:15a". **Editing:** the + is now a pencil to `/events/manage` (`EventManageList`): +
New event, the weekly card's row (→ `/events/weekly/edit`, `EventWeeklyForm`, `useWeeklyCardSave`), then "Hằng
tuần" and "Một lần" rows, each → `/events/<id>/edit`; every editor leads back to the list. Cards are no longer links.

### 6.5 groups → [README](../src/features/groups/README.md)
The church's groups and who is in which: `groups` and `group_members`. Since 2026-10-12 only chat shares
"with my group" (a membership check inside an RLS policy); events and prayer are church-wide. Asking to
join and the old list page are switched off (`joining`, `oldGroupsPage`). Whoever holds `groups.manage`
puts people into groups from the Admin tab (a sheet per group: name, a typed number of members, add and
remove people), reading everyone approved through `group_people()`. The Groups tab's last card, "Has no group",
is the church admin's only (`users.manage`), not a group manager's (2026-10-20).

### 6.12 group-info → [README](../src/features/group-info/README.md)
The Groups tab: a card per group. A member opens a sheet with its number of members, when and where it meets,
notes and pictures; an admin opens its editor, where `GroupInfoForm` saves name, size, when, where and notes
with one Save (it writes the groups feature's `groups` row too). One read for the list, `group_directory()`.
Everyone approved reads; whoever holds `groups.manage` changes the details and removes pictures; a group's own people add
pictures (`may_add_group_photo()`, one rule for a picture's row and its file). Pictures live in a private Storage bucket,
shrunk on the phone before upload, shown through addresses signed for an hour, six at a time.
Depends on `groups` in SQL only. Tables: `group_info`, `group_photos`. Bucket: `group-photos`.

### 6.6 prayer → [README](../src/features/prayer/README.md)
Requests shared with the whole church (since 2026-10-12), under the author's name (no "Hide my name" since
2026-10-20; older anonymous ones stay anonymous). Members cannot read the table: they read
the `prayer_feed` view, which leaves out who wrote an anonymous request. Praying goes through a route: the
`pray_for_request` function adds exactly one, then the author would be told by push ("N people prayed for you", switched off:
`prayedForPush`); the count is shown nowhere. "Pray" works once per request per day, reset at the phone's
midnight (2026-10-20): a timestamp on the device, not a timer.
Authors edit, delete, or mark a request answered; an answered one leaves the list but stays in the table.
Writing and editing a request are screens of their own (`/prayer/new`, `/prayer/<id>/edit`; 2026-10-19: the
iPhone keyboard pushed a sheet with a text field off the top). Above the list, held under the top bar, a
toolbar: the admin's bell, play/pause for worship music (`public/audio/worship/`, listed in `WORSHIP_SONGS`;
every song once per round in a random order, `playlist.ts`; stopped on leaving the tab), and the +. The toolbar is `fixed` with a spacer, not `sticky` (2026-10-19: sticky scrolled away with the
list on the user's iPhone). After 2 seconds on the tab a short bubble left of play, white space on its left, swaying
towards it, says "Tôi muốn cầu nguyện bây giờ" / "Let's pray" until the music is first played.
Tables: `prayer_requests`, `prayer_reminders` (admin configuration, no member grant; a weekly nudge to every approved member).

### 6.15 staff → [README](../src/features/staff/README.md)
Who the church's staff are: a page (`/staff`) opened from a tile on Home, not a tab. Big bold headings
("Ban điều hành"), each with a contact card per person: photo, name in bold, role in grey under it, then the
number (tap: a menu to call, text or copy, `components/PhoneNumber` on `ui/ActionMenu`).
Tables `staff_sections`, `staff_people` (typed once), `staff_placements` (person under heading), read by the page (`server/queries.ts`). Members only read; the user
edits rows in the SQL Editor with `edit-staff.sql` (why: no deploy, no editor screen to build).
Photos: public bucket `staff-photos`, uploaded in the dashboard, its URL pasted into `photo`. Empty page
until `staff/schema.sql` has run.

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
| `role_permissions`, `user_roles` | permissions | **Server-only.** Read by Supabase Auth while it builds a token. An admin's role is added by hand; `member` (the permission `app.use`) by `approve_account`. |
| `groups` | groups | Active groups readable by any approved member, with `member_count` (typed by an admin), `thumbnail_path` (its picture) and `name_en` (its English name; `name` is Vietnamese); created, renamed, sized, pictured and removed (`deleted_at`, never erased) with `groups.manage` |
| `group_members` | groups | Users see only their own rows, and only in active groups: this is what silences a removed group everywhere. No member can insert or delete; `groups.manage` adds, removes and sees everyone's. |
| `group_join_requests` | groups | Someone asked to join. Users insert and see their own; `groups.manage` sees all, declines (delete) and approves (function). |
| `group_info` | group-info | One row per group: when and where it meets (`location` Vietnamese, `location_en` English; not shown while `groupLocation` is off), notes, `contact_phone` (a number only), as free text. Every approved member reads; only `groups.manage` inserts and updates. |
| `staff_sections` | staff | A heading on the staff page, `_en`/`_vi`, `position`. Approved members read; nobody writes from the app (SQL Editor only). |
| `staff_people` | staff | One person, typed once: name (`name_vi` unique: scripts find people by it) and role `_en`/`_vi`, phone, photo URL. Same rules as `staff_sections`. |
| `staff_placements` | staff | A person under a heading (a card), with its `position`; once per heading. Same rules. |
| `group_photos` | group-info | One row per picture of a group: optional date and caption, who added it. Every approved member reads; that group's members and `groups.manage` insert; only `groups.manage` deletes; nobody updates. |
| `storage.objects`, buckets `event-thumbnails`, `group-thumbnails` | events, groups | The picture that starts a row. **Public** to read by address; JPEG only, 200 KB at most; written, listed and erased only with `events.manage` / `groups.manage`. |
| `storage.objects`, bucket `group-photos` | group-info | The pictures' files, private: JPEG only, 1 MB at most. Read (to sign an address) by approved members; uploaded and erased under the same rules as the rows (the group is read from the file's folder name). |
| `messages` | chat | Members read; members insert as themselves; in the Realtime publication |
| `sign_in_links` | auth | Every sign-in link emailed today: the hash of the key only that email carries, the asking device's attempt, the address, the end of the church day, and when it was tapped. **Server-only:** no grants, no policies. A device's rows are deleted when it collects; past days' rows by the next link sent. Replaced `login_handoffs` (2026-10-19). |
| `push_subscriptions` | push | Users manage their own rows; the admin client reads all to send pushes |
| `push_sent_once` | push | One row per scheduled send already made, by key. **Server-only**; written by `claim_push_once`. |
| `push_cooldowns` | push | When each user was last notified per topic. **Server-only:** no grants, no policies; written by `claim_push_turns`. |
| `document_chunks` | assistant | **Server-only:** RLS on, no grants, no policies. `vector(1024)` + HNSW index. |
| `profiles` | profiles | One row per account: the name others see, and `avatar_path` (their picture, or null). Made by a trigger on `auth.users`. Read by the owner, by people sharing a group (`shares_a_group_with`) and with `groups.manage`; no direct write: `set_my_name`, `approve_name_request` and `set_my_avatar` change it; nobody inserts or deletes. |
| `storage.objects`, bucket `staff-photos` | staff | Staff photos. **Public** to read by address; JPEG/PNG/WebP, 1 MB at most; no write policies: only the dashboard uploads. |
| `storage.objects`, bucket `avatars` | profiles | People's pictures. **Public** to read by address; JPEG only, 200 KB at most; each person writes, lists and erases only the folder named after their own id. |
| `name_requests` | profiles | A name someone in a group asked for. The owner reads their own; `groups.manage` reads all, declines (delete) and approves (function). Written only by `set_my_name`. |
| `user_settings` | i18n | One row per user: their language. Owner-only read and write. |
| `events` | events | When an event happens, and its picture's path (`thumbnail_path`). Always church-wide; `group_id` is unused. Members read; `events.manage` writes. Soft-deleted rows hidden from members by the policy. |
| `event_texts` | events | One row per language per event. Members read; a missing row falls back to the other language. |
| `event_cancellations` | events | One skipped week of a recurring event. |
| `weekly_card` | events | One row (`id` true, checked): the Events tab's first card, its title in both languages, the address and the number. Members read; `events.manage` updates; no insert or delete grant. |
| `event_reminders` | events | Which reminders an event has. Read and written only with `events.manage`; the scheduler reads it with the service role. |
| `prayer_requests` | prayer | Members insert (2 columns; `group_id` is unused), edit the words of their own, mark their own answered, delete their own. **No read grant:** reading goes through the view. |
| `prayer_feed` (view) | prayer | What approved members read: every unanswered request, with the author's name and picture (`profiles`), without either for an anonymous one, and the count for the author only. |
| `prayer_reminders` | prayer | A weekly nudge to the whole church, several allowed (rows that still name a group are never sent). Read and written only with `prayer.reminders`. |

Every table a member can reach also carries the restrictive policy "Approved accounts only"
(`features/approval/schema.sql` section 3), except the four a waiting person needs: `profiles`,
`name_requests`, `user_settings`, `push_subscriptions`.

Every table is covered by `tests/rls.test.ts`.

## 8. Environment Variables
| Name | Used by | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `lib/supabase/*` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `lib/supabase/*` | Public key; safe because RLS protects the data |
| `SUPABASE_SERVICE_ROLE_KEY` | `lib/supabase/admin.ts` | **Secret.** Bypasses RLS. Server only. Sign-in needs it too (the hand-off). |
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

**How an update reaches installed phones (nothing for members to do):**
- A deploy is a push to `main`. That is the whole workflow; nobody reinstalls.
- Only Home is saved on the phone, and it is refreshed from the server the moment the app opens; every
  other screen comes from the server. The fresh page names the new code files, which are downloaded and saved.
- The first launch after a deploy shows the old saved Home, then Next.js notices the new deploy and reloads
  once: the reload waits for the new Home (`sw.js`). So a member sees the new version within seconds.
- `sw.js` is checked on every launch (Netlify sends it with `must-revalidate`). A changed one takes over at
  once (`skipWaiting` + `clients.claim`), so a fix to it reaches every phone on its next launch.
- An app left open across a deploy keeps its old code until it loads a page again; its old files stay saved,
  so it does not break when Netlify stops serving them.
- Rename `STATIC_CACHE` in `sw.js` only when the caching itself changes: phones then empty the old saved copy.
- Emergency (a broken `sw.js`): deploy a `sw.js` whose `fetch` listener is removed and with `STATIC_CACHE`
  renamed. Phones go back to plain downloads on their next launch.

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
| Phone menu drawn in a portal, with the number drawn again on top | A card (`overflow-hidden`) or a sheet would cut it off or cover it | Pinned to where the number was, so a scroll closes it |
| Supabase refresh-token reuse detection off | A renewal whose reply a phone misses left it a used token, and the next launch ended the session | A copied old token still gets in; B45 is the fix that keeps detection on |
| One Next.js codebase, no separate backend | Least to learn, deploy and keep in sync | No Python libraries, no long jobs; mitigated by thin routes |
| Supabase instead of our own auth/DB | Login, Postgres, RLS and vectors for free | Vendor lock-in on user ids; free projects pause after ~7 idle days |
| Sign-in by email link only, no passwords; sign-up sends the same link (2026-10-17, the user; replaces password sign-in of 2026-10-14) | Someone signed out types only their address: nothing to remember or reset; one flow for signing in and signing up | A trip to the mailbox each time someone is signed out (rare: sessions last until sign-out); the email sender must be reliable |
| Install first, sign in inside the app (2026-10-20, the user; replaces "Safari first" of 2026-10-14) | iOS copies only regular Safari's cookies into an app added to the Home Screen: someone who signed up in Chrome on an iPhone (or a Private tab) installed an app that was signed out (first report, iOS < 26). The hand-off signs the installed app in from any browser | On a phone's browser `/login` is only the language page and the install guide; an iPhone user always taps "Sign in?" on the email's page; a computer may still "Continue in this browser" |
| Searchable through `/login`, with vietcorners.org as canonical, both domains still serving (2026-10-20) | Signed out, `/login` is the only page anyone can read; installed apps live on the address they were added from, so a redirect between domains would sign them out | Google may show `vietcorners.org/login`; the Netlify address stays live |
| One "Pray" per request per day, reset at the phone's midnight (2026-10-20, the user; replaces a one-hour pause) | Members use the green tick to track what they prayed for today | Still kept on the device only: another phone, or cleared storage, can pray again |
| Admin tools on their own tabs; the Admin tab = waiting lists + everyone (2026-10-14) | Each thing is managed where it lives; a person's rights and groups in one place | Events with no coming date can no longer be reached to edit |
| Sheets on `vaul`, at most 60% tall, closing by sliding away (swipe down too) | Feels like the phone's own sheets; the X never leaves a thumb's reach | One more library; the slide-out is timed by us (500 ms), since vaul reports it only for closes it starts |
| Big editors are screens, sheets only for short things | A long editor in 60% of the screen scrolls forever | More screens and routes |
| A text field never goes in a sheet; writing gets its own screen (2026-10-19, the prayer request) | iOS scrolls the page up to show a focused field while vaul lifts the bottom sheet by the keyboard's height: the sheet went off the top (picture from a member). A field at the top of a plain page is never covered | One more screen and a slide per request written |
| Every sign-in link of the same church day works (2026-10-19, the user) | Members ask twice, Gmail folds the emails together and hides one; a tapped older link left the app waiting forever. One device key per day, and our own key per email, so a newer email no longer cancels an older one | A link lives until midnight at church instead of an hour; the server sends the email (a route) and makes the token at collection (`generateLink`, service role) |
| Pictures of people in a public bucket (`avatars`, 2026-10-19) | A face beside each request: a public address the phone keeps, no signing per person per screen | Anyone holding a file's address can open it (it is two random ids); group photos stay private |
| Cropping on `react-easy-crop` (2026-10-19) | Dragging and pinching a picture by hand, on every phone, is easy to get subtly wrong | One more library (no dependencies but one tiny one) |
| Staff are rows in Supabase, edited in the SQL Editor (2026-10-19, the user; replaces "a list in code" from the same day) | The user changes people and headings without a deploy | Three tables (people apart from headings, so a person is typed once), RLS and a test; no editor screen, so changes need SQL (`edit-staff.sql`) |
| Worship music is files the church supplies in `public/audio/worship/`, named in `WORSHIP_SONGS` | Only tracks the church has the rights to may be played; a file downloads only when it plays, so the app is no slower | A new song needs a deploy; the repository grows by each file |
| Songs play in shuffled rounds, not plain random (`playlist.ts`) | Plain random repeats a song back to back; a round plays each once and keeps the last two songs away | The order is less surprising |
| The author sees how many prayed ("3 🙏", `prayer_feed.prayer_count` for the author only) (2026-10-14) | The user wants people to see the prayers their request received | Reverses the 2026-10-06 choice; still nobody else sees a count |
| Group cards show members' initials, not names (`group_member_initials`) | The circles need someone's presence, not who they are; a member may not read another group's members | Two people with the same initials look alike |
| One role per permission, toggled per person | An admin hands out one task at a time; rights stay roles | Four more roles to understand |
| Screens slide with React's `<ViewTransition>` and the browser's View Transitions, tagged forward or back (2026-10-17, the user) | The documented way in this Next.js, no library; one wrapper in the root layout, a tag on each link that moves | A browser without the feature (iOS before 18) just changes screens; the screen does not follow the finger during a swipe back (no API for that), it slides once the finger lets go; a screen not kept in memory slides in as its grey placeholder |
| Text size per phone, in a cookie (2026-10-17) | The server draws the first screen in the right size; it belongs to the eyes holding that phone | Two people on one phone share it; a member on two phones chooses twice |
| Sign-in errors in a banner with a link ("Create new account?") | The app's one way of saying what went wrong (the user's word) | The banner gained an optional link; such banners stay 15 s |
| Sign-in screen in the messaging-app pattern: words inside the fields, one button, new account set apart | Elderly members felt they had to read every line of the first version | Field words disappear while typing (the field's purpose stays clear from its content) |
| Sign-in is the first screen; setup steps only for new members (2026-10-14) | Someone signed out must not click through three screens to get back in | Language is a link, not a question; returning members are not asked for notifications |
| Progress bar out of 6 whose last step, "done", is never shown | The waiting screen must read as not finished | A step that does not exist |
| `account_exists()` callable signed out | "No account yet, create one" instead of a puzzling "wrong password" | Anyone can learn whether an address has an account |
| The email link's page asks for one tap before handing the sign-in over (2026-10-17, the user) | A mail scanner that opens links by itself must not sign in a stranger who typed someone else's address | One more tap; a person tricked into tapping still lets the stranger in (the page warns) |
| "This email already has an account" on sign-up | A wait for an email Supabase never sends would leave a member stuck | Reveals that an address has an account |
| Notification question remembered by a device cookie, read by the layout | The server decides which step to show, so no flash of Home before the question | Asked again on a new phone or after 400 days without granting; a device that already had them on sees the step for a moment |
| Install guide on every phone visit in a browser; only computers may skip | On iPhone, notifications need the Home Screen app | An admin on a phone must install too |
| "Off" is a constant in `src/lib/switches.ts`, read at the door of what it turns off | Chat, joining and most notifications had to stop without being lost; off code keeps compiling, phones download none of it, and on again is one word | The off code stays in the server build; the database still accepts a direct write to an off feature's table (a chat message nobody sees) |
| Approval is a permission (`app.use`) enforced by one restrictive policy per table | Sign-up is open, so the screen cannot be the door; a restrictive policy adds "and approved" to every existing rule without rewriting any | A new table must be added to the list by hand; an approval or its removal reaches a token at its next renewal |
| The Groups page is a new feature (`group-info`) beside the old list, not a change to it | The old page (join, open the chat) had to stay ready to switch back on; a group's own words are a separate thing from who is in it | Two lists of groups in the code; the page file chooses by a switch |
| Row pictures (events, groups) are in public buckets; a new picture is a new file name | They are on every row of a list: a public address is kept by the phone, and a new name per version means a kept copy can never show the old picture (backlog B32) | Anyone holding an address can open the file; so these are artwork an admin chose, never a private photo |
| Each feature has its own thumbnail bucket and its own small copy of "store, record, erase the old one" | Removing events or groups removes its pictures with it; nothing shared to untangle | About twenty lines written twice (`events/api.ts`, `groups/api.ts`); the shrinking and the address are shared in `src/lib` |
| Group pictures are in a private bucket, shown through addresses signed for an hour | They are pictures of church members, children among them; a public bucket serves a file to anyone holding its address, for ever | A signed address is new on every visit, so pictures are downloaded again each time instead of being kept by the phone |
| A picture is shrunk in the browser before upload, and the bucket refuses what is too big or not a JPEG | A camera photo is 3 to 8 MB and Supabase's resizing is paid; the server-side limit is what makes the browser's work untrusted | Two files per picture; the canvas drops a photo's hidden data (location, camera), which here is a gain |
| Admins keep a group's details and remove its pictures; the group's own people only add pictures | When and where a group meets is the church's word; pictures come from those who were there; removal cannot be undone | Someone who uploads the wrong picture needs an admin to take it down; admins must keep every group's details current |
| One SQL function says who may add a group picture (`may_add_group_photo`) | A picture's row and its file must follow one rule: the group's people, or a group manager | A function call per added picture |
| A group's details are free text, written by an admin | "Fridays, 7:30 PM" and "read Matthew 3" are what a group would write on a board; nothing computes with them | Not translated, not validated |
| A group's number of members is typed by an admin, not counted | Many who come to a group do not use the app, so a count of accounts would be wrong | It goes stale unless someone updates it; until typed, the admin row shows the accounts instead |
| The admin's list of people comes from one function with its owner's rights (`group_people()`) | Emails live in `auth.users` and "approved" in the roles table, neither reachable from a browser; one trip gives the list to add from and who is in no group | A fourth function that skips row rules: its permission check is the security and has its own test |
| Events and prayer are church-wide; old group-only rows show to everyone | The pastor's review: one church, one schedule, one prayer list. The data so far is from testing | `group_id` columns stay, unused; going back to per-group sharing is SQL and code, not a switch |
| An email link that hands the sign-in to the device that asked (replaces the typed code, 2026-10-12) | One tap is simpler than copying a code, and an iPhone opens links in Safari, not in the installed app. The asking device keeps a secret and only its hash travels, so nobody else can collect | One more table and two routes that verify no user; tapping the link AND the button on an email you did not ask for signs a stranger in as you |
| The link's page hands over only on a tap, never on load | Mail services open links to scan them; a page that acted on load would let a scanner confirm a stranger's request | One more tap on iPhone |
| Permissions ride in the login token, and policies name a permission, not a role | A check reads the token: no lookup per query, at any size. New roles are rows, not policy rewrites. | A role change waits for the token to refresh (up to 15 minutes, the access token's life since 2026-10-19); the hook is switched on in the dashboard, and a broken hook blocks every sign-in |
| Authorization in RLS, not TypeScript `if`s | Browsers query Supabase directly, so the database is the only check that covers every path | Blocked reads look empty rather than failing; needs the RLS tests |
| Web Push instead of a native app | No app store, one codebase | iOS needs Add to Home Screen and iOS 16.4+ |
| Send messages through a route, not straight to Supabase | Sending must also push, which needs secrets | One extra hop per message |
| Service-role client for push | RLS correctly hides other users' subscriptions and memberships | A powerful key on the server, used only in `server/` files that send a notification |
| One notification per user, per topic, per minute, decided in the database; no topic = an announcement that always arrives | Every message buzzing every member gets notifications switched off; one SQL statement makes the check race-free. A cancelled event must never be the one swallowed. | Messages inside the minute are silent and nothing follows up (no scheduler) |
| Results are announced in one reusable banner, never as text beside the button | One place decides how success and failure look and how long they stay; a feature passes a kind and a message | A banner can be missed in a way inline text cannot; errors therefore stay 8 s and wait for a tap if stacked |
| A device's push subscription is saved through a route with the service role | The endpoint outlives a sign-out; only the server may move it to the next user of that phone | Anyone who knew an endpoint (a long random address) could claim it; one more route |
| A visited page is kept in the phone's memory for ten minutes (`staleTimes`, an experimental Next.js setting) | Going back to a tab shows it at once, with no request; the lists refresh themselves behind it | Settings does not refresh itself and can be up to ten minutes old when returned to (the Admin lists use `useFresh`; the person and group editors reload on arrival, `RefreshOnArrival`, which also empties the other kept tabs); the setting may change in a future Next.js; sign-out must be a full page load so the next person on that phone starts empty |
| A page's data comes from one database function, called by the page and again by the list itself (`useFresh`) | One trip instead of several; a kept copy of a page can show at once and still become current; `router.refresh()` cannot do this because it discards every kept page | SQL per page; the list holds a copy of the page's data; one extra small read just after a first visit |
| Pages read who is signed in from the login token, checked locally; only routes that write ask Supabase | Most of the app is reading, and the round trip bought nothing the database's own check does not | A session ended elsewhere keeps reading for up to 15 minutes |
| Names are readable within a shared group and by group managers, not by every signed-in user | Decided while "signed in" was anyone with an email; approval (2026-10-12) removes that reason, and the rule is kept until the new Groups page needs otherwise | A former member's old messages lose their name; one function call per row read |
| Once in a group, a name changes only with a group manager's approval | The manager saw name and email when letting the person in; a later change unseen would undo that check | A wait for an honest correction; one more thing for managers to answer |
| A join request shows the email beside the name | A name is whatever its owner typed; the email is what the account signed in with | An admin sees addresses |
| Words every feature says alike (Save, Saved, Could not save) live once, in `i18n/common.ts` | "Saved" cannot be worded five ways | Removing a feature no longer removes all of its words |
| Names are looked up from one `profiles` table, not copied onto each message as emails were | A corrected name is corrected everywhere, old messages included; one place to protect | One more read per screen that shows people; chat fetches the name of a sender it has not met |
| A trigger gives every account a profile, named after its email until asked | No screen meets a nameless person, so no fallback code anywhere | A failing trigger would block sign-up, so it is one insert; the stand-in shows part of an email to other members |
| The name question is drawn by the layout in place of the page | No redirect, and no address that skips it | One more read on every page load |
| The prayer list groups people by name, because its view carries no author id | The id is what would unmask an anonymous request, so it stays out of the feed altogether | Two members with one name share a group in a week (they look the same on screen anyway) |
| Group pictures are kept by the service worker under their path, not their signed address (2026-10-21) | Each visit signs new addresses, so the browser's cache never matched and every picture downloaded again; a file is never replaced, so a path never goes stale | A signed-out phone keeps nothing (deleted at `/login`); a member removed from a group keeps the copies of pictures already seen until trimmed |
| The weekly card is one row of its own table, and its lines are computed (2026-10-21) | Its words must be editable by an admin; the lines are the weekly events and group meetings themselves, so nothing is typed twice | A group meeting's line can only be changed in the group's editor |
| Group meetings reach the weekly card through the page, as `WeeklyMeeting` (2026-10-21) | Features never import each other; the page may read both | Removing group-info: delete the `// GROUP-INFO` lines in `src/app/events/page.tsx` |
| No page per event (2026-10-19, the user; it replaced the 2026-10-17 `/events/[eventId]` page) | The card already shows when, where and whom to call; one less screen for elderly members | Members no longer see the description or end time; an admin's tap opens the editor |
| The event editor is a route (`/events/[eventId]/edit`, new at `/events/new`; it was `/admin/events/[eventId]`), not an overlay | The phone's back button works, the page loads the event, and the admin list keeps no "which one is open" state | A second page; an unsaved form is lost on Back with no warning (decided earlier: no confirmations) |
| One shared busy button (`Button`, first `ActionButton`) and one helper (`usePending`) for every request, one instance per row | A double tap sent things twice in a dozen places; one pattern means one place to get it right and every screen behaves the same | The first shared control before the UI revamp; lists need a small component per row |
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
| **The service worker saves only `/_next/static/*`, cache-first, by hand (no Workbox)** | Measured: after a restart iOS had dropped 9 of 10 code files and refetching them was 21 of 22.5 s. Their names change with their content, so a saved copy is never stale | Pages still wait on the server (about 1 s, 3–5 s when Netlify is cold); old files are only trimmed past 150, not per deploy |
| **The service worker also saves Home and shows it at launch, then replaces it with the fresh page (2026-10-17)** | After a few hours away the server's answer took ~10 s (network waking, sign-in renewed, database read), all of it on a blank screen | For about a second the saved Home can be out of date (Admin tile, a setup step); the server checks every action anyway. One saved copy per phone: sign-out and an ended session delete it, and the language toggle does too |
| **Tabs are loaded whole in the background (`prefetch={true}`), kept 10 minutes** | A tap on a tab shows its content at once instead of the grey placeholder | About 15 extra server requests per launch (each tab, Settings); a tab tapped after 10 minutes is asked for again |

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
- 2026-10-07: prayer reminders: adding one that already exists now says so ("That group already has a reminder at that day and time") instead of a generic failure, and the section's buttons are disabled while saving, so a second tap can no longer send the same reminder twice. The same gap in other admin forms is backlog B25.
- 2026-10-07: scheduler reliability: the cron call waits 25 s instead of 5 (the site takes seconds to wake), due reminders are sent side by side, and `/api/reminders/send` answers with `tookMs` or the error. The prayer reminder form starts on today's weekday.
- 2026-10-07: double taps: `ActionButton` + `usePending` on every button that starts a request (login, sign out, join, notifications, prayer, and the events, groups and reminders admin sections). Lists got a component per row. Closes backlog B25.
- 2026-10-07: busy buttons stay busy until the reloaded data is drawn (`useRefresh`), so a button no longer flashes its old label between saving and the list updating.
- 2026-10-08: added the `frontend` skill ahead of the UI/UX revamp: the one shape of a shared UI component, what a feature component may and may not do, and the comment rule. It points at `docs/design-system.md` and `src/components/ui/README.md`, which are written once the design decisions are made.
- 2026-10-08: `docs/design-questions.md`: every design decision for the UI revamp, with the reference app's patterns written down and the questions it answers filled in. Nothing is implemented from it yet.
- 2026-10-08: design decisions closed. `docs/design-system.md` holds the tokens (one accent `#1976D2`, system font, 17 base), the frame, the component list and the cross-component rules; `docs/design-questions.md` keeps the reasons. Still nothing implemented.
- 2026-10-08: UI revamp, slice 0: design tokens in `globals.css` (colours, text sizes on a scalable root, px spacing, radii), `Text`, `Button` (with the pending state), `Spinner`, the `/ui` showcase and the component README. No existing screen restyled; `ActionButton` stays until its screens move.
- 2026-10-08: `Spinner` aligns to the middle of the text beside it (it sat 1.5 to 3 px high), in a busy button's label and inline.
- 2026-10-08: UI revamp, slice 1, the frame: blue `TopBar` with the assistant and Settings icons and a back arrow on sub-screens; `TabBar` with drawn icons (Home, Events, Prayer, Groups, Admin); a Home screen with three tiles, where the app now opens; no tab bar before sign-in; the app is named "Góc Việt" with a placeholder icon. Adds `lucide-react`. Screens inside the frame are still the old look.
- 2026-10-08: UI revamp, slice 2, lists: `ListRow`, `Thumbnail`, `SectionHeading`, `EmptyState`, `SkeletonRow`. Groups, the event schedule, Settings (account, language) and the notification toggle use them; loading shows placeholder rows. The event details panel and every form keep the old look until slice 4.
- 2026-10-08: event rows: the time moved out of the picture into `RowLabel`, a bold fixed-width box before it; the picture is a plain grey tile. The join button reads "Join" / "Tham gia".
- 2026-10-08: UI revamp, slice 3, banners: `Banner`, `useBanner` (+ `BannerProvider`, `BannerHost`), `useSave`. Every result of a tap is now a banner: sign-in errors, chat send failures, the notification toggle, groups and join requests, prayer (share, edit, answered, delete, reminders), events (save, cancel, undo, reminders). Inline error lines and their `failed` states are gone. Closes backlog B30.
- 2026-10-08: UI revamp, slice 4, forms and the sheet: `Field`, `TextInput`, `TextArea`, `Select`, `Switch`, `Sheet` (adds `@radix-ui/react-dialog`), `LogoMark`. Sign-in in its new layout with its own error wording; the three admin sections as rows and labelled fields; the event editor moved from an overlay to its own screen (`/admin/events/[eventId]`, `hooks/useEventChanges.ts`); a form says what is wrong beside the field once Save was tried; event details and the prayer options are sheets. `ActionButton` deleted.
- 2026-10-08: UI revamp, slice 5, names: new foundation `profiles` (table, trigger, RLS; `getNames`, `useNames`, `NameStep`, `NameSection`) and `ui/Avatar`. The layout asks "What is your name?" once after sign-in. Chat, the chat notification, prayer requests (`prayer_feed.author_name`) and join requests show names instead of emails. Needs `features/profiles/schema.sql` and section 4 of `features/prayer/schema.sql` to be run.
- 2026-10-08: UI revamp, slice 6, conversations: `Bubble`, `BubbleRun`, `TimeLine`, `Composer`, `IconButton`, `useScrollToEnd`. Chat is runs of bubbles with names, avatars and a time after an hour of silence (`chat/runs.ts`); the prayer list is grouped by church week and then by person (`prayer/grouping.ts`), every request at the left; the assistant uses the same bubbles, with icons in place of emoji on the microphone. No old styling is left in any component.
- 2026-10-08: prayer list layout fixed after the user's review: a person's avatar and name head their requests; day, then Pray, each on its own line under the bubble; the group's name only for a member of several groups; dates in church time.
- 2026-10-08: `npm audit fix`: Next.js 16.3.5 → 16.4.0 (one critical advisory) and two transitive packages; 0 advisories left.
- 2026-10-08: review before the merge, first fixes: a join request shows "name (email)"; saving an event stays busy until the list is drawn (`useGoTo`, `useWhenDrawn`); a missing name no longer prints "undefined" in the chat notification.
- 2026-10-08: names are read only within a shared group and by group managers (`shares_a_group_with`; needs section 4 of `features/profiles/schema.sql`). Sign-in failures are told apart: no connection, too many tries, a bad address, a wrong or expired code (`auth/errors.ts`). Shared words moved to `i18n/common.ts`.
- 2026-10-08: prayer list, third layout (the user chose bubbles as in Messenger): Pray is a chip on the bubble's corner (`ui/Chip`), my own bubble opens its options when tapped, requests show whole; no date, group or X on the list. `useExpandableText` deleted.
- 2026-10-08: review, should-fix items: `Composer` leaves its own room under the messages (no screen hard-codes its height); the layout's three reads run together; the tick of a chosen row is `ListRow`'s; unused variants and strings removed (`Avatar` size, `IconLink` tone, two i18n words); the browser's name lookup is in `profiles/api.ts`, not borrowed from `server/`; comments over two lines moved to the READMEs (new `src/lib/README.md`); `CLAUDE.md` lists all five foundations. The Pray chip hangs under the bubble's text instead of over its last line.
- 2026-10-08: prayer screen, on the user's direction: Pray is a round purple chip overlapping the bubble's right edge and becomes a green tick once given (tokens `pray`, `pray-soft`, `success-soft`); a new request is written in a sheet opened by a round plus at the top right, so the list starts at the top of the screen.
- 2026-10-08: prayer list: my own named requests come first in every week; the Pray chip sits 8 to the right of its bubble, level with its middle, instead of overlapping it.
- 2026-10-08: prayer list: my own request has a pencil button beside it (the bubble itself is no longer a button); its options sheet is a two-by-two grid.
- 2026-10-08: prayer list: the pencil beside my own request is a small round grey chip (32 across), not a rectangular button.
- 2026-10-08: admins approve names: `name_requests`, `set_my_name`, `approve_name_request` (no direct write on `profiles` any more); `POST /api/names/request` and `/approve` with a push to managers and to the approved person; Settings shows the waiting name; Admin tab → "Names waiting for approval". Settings no longer shows "Name" twice. Needs section 5 of `features/profiles/schema.sql`.
- 2026-10-09: found on two installed iPhones after the first production deploy of the revamp, and fixed:
  (1) the chat's message field sat under the tab bar: its utility was named `bottom-tabs`, a class Tailwind already generates from `--spacing-tabs`, so the phone's bottom inset was lost (renamed `bottom-over-tabs`);
  (2) a strip at the right and under the tab bar, and sideways scrolling: something wider than the screen made the iPhone shrink the page; the page now clips sideways overflow, date and time fields no longer size themselves, and pulling down no longer drags the top bar;
  (3) "Turn on notifications" failed on a phone another account had used: the device is now saved by `POST /api/push/subscribe`;
  (4) event reminder switches always failed: the save was an insert-or-update and managers have no update grant; it is now insert-or-nothing.
  Failures behind a "Could not save" banner are also written to the console.
- 2026-10-09: faster tabs, step 1 (Events): the schedule is one call to `upcoming_events()` instead of four or five reads; `EventSchedule` refreshes itself through `useFresh`; weekly dates and language are worked out on the phone (`scheduleOf`). Pages and the layout read the signed-in user from the token (`getCurrentUser` uses `getClaims`), with no trip to Supabase. Needs section 3b of `features/events/schema.sql`. Pages are not kept yet: that is switched on once Groups and Prayer refresh themselves too.
- 2026-10-09: faster tabs, step 2 (Groups): the group list is one call to `my_groups()` instead of three reads, and `GroupList` refreshes itself. Needs section 2b of `features/groups/schema.sql`. Measured for Events on a local production build against the same database, 8 taps each: 479 ms before, 132 ms after (median).
- 2026-10-09: faster tabs, step 3 (Prayer): the list reads its newest twenty again on arrival and on return to the app, keeping older requests already loaded (`prayer/feed.ts`, `useOnArrival`). Its page was already two parallel reads once Groups became one call; no new SQL.
- 2026-10-09: faster tabs, step 4: visited pages are kept for ten minutes (`next.config.ts`), and sign-out is a full page load that empties them. Observed on a local production build: a first visit to Events, Groups and Prayer makes one page request each; going back to any of them makes none, and one refresh call from the list.
- 2026-10-09: Admin's two waiting lists (join requests, name requests) read themselves again on every arrival (`useFresh`), so a kept copy of the Admin page never shows an old list of who is waiting. The placeholder screens fetched ahead for each tab are kept a day instead of five minutes (`staleTimes.static`). Backlog B37: a session ended elsewhere can still write directly until its token expires.
- 2026-10-09: Admin page: its independent reads (groups, managed events, prayer reminders, join requests, name requests) run together instead of one after another; the admin events list and the event editor read through one function, `managed_events()`, instead of four reads. Needs section 3c of `features/events/schema.sql`.
- 2026-10-09: fixed: an answered join request flashed up on every return to the Admin page. A kept page is frozen with the data it was loaded with, and each return started from it. Lists now start from what they last showed (`useFresh`'s `lastShown`; the prayer feed likewise).
- 2026-10-09: notifications moved from the Groups page to Settings as an on/off switch (`NotificationSection`); off unsubscribes the device and removes its row. The on-open repair of a device's subscription moved to the root layout (`KeepSubscribed`).
- 2026-10-12: the pastor's review, slice 1, switches: `src/lib/switches.ts`. Off: chat (page and route), asking to join a group (routes, the admin list), the old Groups page (tab and Home tile with it), and every notification except prayer reminders: event changes, event reminders (and their switches in the editor), "prayed for you", name requests. Observed signed out: the three off routes answer 404.
- 2026-10-12: slice 2, church-wide: events and prayer requests are no longer limited to a group (form field, composer choice, group badge and "join a group first" removed; `audience.ts` deleted); prayer reminders go to the whole church. Needs `events/schema.sql` 3d and `prayer/schema.sql` 3b, 4, 5.
- 2026-10-12: slice 3, sign-up approval: new feature `approval`. `app.use` (permissions 4b), `waiting_accounts()`, `approve_account()`, "Approved accounts only" on ten tables, the waiting screen in the layout, "People waiting to be let in" on the Admin page, two notifications. The Admin tab now asks `managesSomething`, because every member holds a permission. Needs `approval/schema.sql`. 67 security cases written, NOT run (the SQL comes first).
- 2026-10-12: slice 4, sign-in by email link: the typed code is gone. `auth/handoff.ts` (secret key and its hash), `storage.ts`, `useLoginLink`, `useConfirmLink`, `ConfirmLink`, `/login/confirm`, `POST /api/auth/handoff` and `/claim`, the server-only table `login_handoffs`. Needs `auth/schema.sql`, the redirect URLs and both email templates changed in Supabase. Observed: the three screens and the routes' refusals; NOT a real email or the hand-off end to end.
- 2026-10-12: slice 5, admins put people into groups: `groups.member_count` (typed), manager policies on `group_members` (see all, add, remove), `group_people()`, `my_groups()` returns `member_count`. The Admin tab's Groups section is rows that open a sheet (`GroupSheet`, `GroupDetailsForm`, `GroupMemberRow`, `AddMemberForm`), with "Has no group" last (`UnassignedSheet`); `GroupNameEditor` deleted. Needs `groups/schema.sql` 2c, then 2b. 72 security cases written, the 4 new ones NOT run.
- 2026-10-12: the admin Groups section reads its groups and people again on every arrival (`useFresh`), so a kept copy of the Admin page never shows old memberships.
- 2026-10-12: slice 6, the new Groups page: new feature `group-info` (`group_info`, `group_directory()`, `GroupDirectory`, `GroupInfoSheet`, `GroupDetail`, `GroupDetailsForm`). `/groups` draws it while `oldGroupsPage` is off; the Groups tab and Home tile are back. Needs `group-info/schema.sql` and its door line in `approval/schema.sql`. 76 security cases written, the new ones NOT run.
- 2026-10-12: group details: a pencil per line instead of one Edit (`GroupDetail`, `GroupDetailForm`; a save sends one detail); whoever holds `groups.manage` may change any group's details and, from the Groups tab too, its number of members (`may_write_group_info()`). The page reads the permission to draw the pencils.
- 2026-10-12: slice 7, group pictures: `group_photos`, the private bucket `group-photos` with three storage rules, `shrink.ts`, `useGroupPhotos`, `GroupPhotos`, `PhotoStripEnd`, `AddPhotoForm`; shared `PhotoStrip`, `PhotoThumb`, `Lightbox` (on `/ui`); `useWhenVisible` moved from prayer to `src/lib`. Needs `group-info/schema.sql` and the two new door lines in `approval/schema.sql`. Seen on `/ui`: the strip and the large view. 85 security cases written, the new ones NOT run. Closes the picture part of B32 for groups.
- 2026-10-12: row pictures: `events.thumbnail_path` and `groups.thumbnail_path`, public buckets `event-thumbnails` and `group-thumbnails` (managers only write), `EventThumbnail` in the event editor, `GroupThumbnail` in the admin's group sheet; the schedule, the Groups tab and the admin's group rows draw them (`ui/Thumbnail` takes `src`). `shrink.ts` moved to `src/lib/shrinkImage.ts`; new `src/lib/publicFileUrl.ts`. `upcoming_events`, `managed_events`, `my_groups`, `group_directory` return the path. Needs `events/schema.sql` 3e + 3b + 3c, `groups/schema.sql` 2d + 2b, `group-info/schema.sql` 4. 91 security cases written, the new ones NOT run.
- 2026-10-12: group rules changed on the user's word: only `groups.manage` edits a group's when / where / notes and removes a picture; the group's own people (and managers) add pictures. `may_write_group_info()` replaced by `may_add_group_photo()`; the details' policies ask for the permission directly. Needs `group-info/schema.sql` run again (it drops the earlier policies by name). Security cases rewritten for the new rules (91), NOT run.
- 2026-10-14: elderly-friendly setup. New feature `install` (guide + Chrome's install button, `device.ts` tested). `/login` = `InstallGate` → `auth/Welcome`: language (`i18n/LanguageStep`) → have an account? → password sign-in / sign-up / forgot → check your email. Passwords replace sign-in links (`signIn`, `signUp`, `sendPasswordReset`, `verifyEmailLink`, `setPassword`; `useLoginLink`/`LoginForm` removed, `useEmailLink` added; the hand-off now carries a purpose). `/settings/password` + "Change password" in Settings. `push/NotificationStep` in the layout between name and waiting (device cookie). `ui/ProgressBar`, `components/SetupProgress` on every setup screen. Signed out, the device's language is adopted on load. Needs the two email templates and Providers → Email settings (auth README, Setup 4-6).
- 2026-10-14: after the first iPhone test, sign-up links need no tap: "Confirm signup" uses Supabase's `{{ .ConfirmationURL }}` and lands on `/login/confirmed` (`EmailConfirmed`, `useLinkWorked`); the app tries the password every 15 s and on return. Resets keep the hand-off and its tap (`signInWithResetLink`; `verifyEmailLink` and `PAGE_AFTER` removed). Redirect URLs become `/login/**`. The email had pointed at `localhost:3000` because the Funnel address was not in Supabase's Redirect URLs.
- 2026-10-14: second iPhone test fixes. A wrong password then "Forgot password?" offered to save the wrong password: password forms now submit only after the server accepts (`auth/hooks/useSubmitWhenAccepted.ts`, button `type="button"`, Enter mapped). A reset link "did nothing": the proxy sent a signed-in Safari from `/login/confirm` to Home; the two email-link pages are now exempt (`LINK_PAGES` in `refreshSession.ts`).
- 2026-10-14: the tab bar sat a status bar's height (48 points) too high on every cold start of the installed iPhone app, until a long page was scrolled. iOS lays out a page shorter than the screen as if the see-through status bar took its own space; `html` now has a minimum height of 100% plus the top inset (`globals.css`). Found from the user's screenshot (the bar 49 points above where 56 + 34 points put it); NOT yet seen fixed on an iPhone.
- 2026-10-14: the accept-then-submit forms gave no "Save password?" on the iPhone after a reset (a submit from code, after the tap, is ignored by Safari). Undone on the user's word: one tap submits again (`useSubmitWhenAccepted` deleted); a wrong password is offered for saving too, recorded as a Key Decision.
- 2026-10-14: Home's three tiles show the user's photos (`public/images/home`: a calendar, hands raised at sunrise, a group of young people) under a dark veil that keeps the white title readable; `ui/PhotoTile` takes `src`. The proxy skips `/images/`, so a picture does not wait on a login check. Seen on `/ui` at phone width.
- 2026-10-14: `next.config.ts` allows the PC's Tailscale address (`*.tail714ada.ts.net`) as a dev origin. Opened on a phone through the tunnel, `next dev` had refused its CSS and JavaScript to that address, so `/login/confirm` arrived unstyled and its button did nothing. Development only.
- 2026-10-14: signed-out redesign after the user's walk-through: sign-in first (no bar, English link at the top right, error with "Create an account" or beside "Forgot password?"); `SignUpForm` (name, email, password; Next off until filled; "Step 2 / 6"); the language step and the account question are gone (`LanguageStep`, `AccountQuestion`, `EmailPasswordForm` deleted; `SignInForm`, `useSignIn` added). Steps: sign in, name, email, notifications, waiting, done. Notifications asked only of members not yet let in. New SQL: `auth/schema.sql` section 3 (`account_exists`), `profiles/schema.sql` section 2 (`create_profile` reads the sign-up name). One security case added.
- 2026-10-14: no "Save password?" after a correct sign-in on the iPhone: sign-in and the new-password form now move to Home inside the page (`enterTheApp` in `auth/hooks/useSignIn.ts`). Reset page says "Reset your password?" / "Yes, reset my password". `auth/components/SignedOutFrame.tsx` shared by sign-in, sign-up, check-email, `/login/confirm` and `/login/confirmed` (language top right everywhere). Sign-in screen calmed: words inside the fields, `ui/PasswordInput` with an eye, "Forgot password?" small, "Create new account" set apart.
- 2026-10-14: still no "Save password?" after moving on inside the page. Sign-in and the new password are now real form posts: `POST /api/auth/sign-in`, `/api/auth/new-password` (`auth/server/signIn.ts`), 303 to Home or back with `?problem=`; `useTypedEmail` keeps the email across a failed try; `useSignIn` and `enterTheApp` deleted, `accountExists`/`setPassword` left `api.ts`. Sign-up redone in the sign-in screen's calm shape.
- 2026-10-14: the logo is the user's "VC" over the Earth: `public/icons/icon-192.png` and `icon-512.png` are made from `public/icons/logo-source.webp` (1254 square), so the Home Screen icon, the install icon and `LogoMark` (sign-in, waiting and name screens) all change together. An iPhone keeps the old Home Screen icon until the app is removed and added again.
- 2026-10-14: the app is called "Viet Corners" in every language (the user's word; it was "Góc Việt"): one constant, `src/lib/appName.ts`, read by the manifest, the page title, the iPhone Home Screen title, the approval notification and every sentence that names the app (auth, install). An installed iPhone keeps its old label until the app is added to the Home Screen again.
- 2026-10-14: logo replaced by the user's second version (the letters straight over the Earth, without the glass square); both icons remade from the new `public/icons/logo-source.webp`.
- 2026-10-14: Safari first. Proven on the iPhone: the installed app never offers to save or fills in a password (old and new sign-in alike); Safari does, and its sign-in is copied into the app when installed. `/login` is no longer behind the install guide; `InstallGate` wraps signed-in pages in the root layout (setup step "install", 4 of 7, before notifications). Sign-up links sign in where they open (`useConfirmedLink`, `signInWithConfirmLink`). Sign-in and new-password errors are banners with a link (`ui/Banner` `actionLabel`, `useBanner` `action`, `useProblemBanner`); inline errors removed. The old-version test copy and port 10000 are gone; the temporary error catcher (`global-error.tsx`, `api/debug-log`) was removed before the commit.
- 2026-10-14: hard-coded text review before the translation pass: only two found (chat notification fallback "New message" → `APP_NAME`; `public/sw.js` fallback "VietCorner" → "Viet Corners"). What was left on purpose is listed in the i18n README.
- 2026-10-14: the install guide (shown signed in, in a phone's browser) ends with "Sign out": it replaced every page, so a wrong account in Safari was a dead end. `InstallGate`/`InstallGuide` take a `footer`; `SignOutButton` takes `variant`.
- 2026-10-14: every sheet closes with an X at its top right (`ui/Sheet`, `closeLabel` = `COMMON.close`); the Close and Cancel buttons that only closed a sheet are gone (event details, a group's sheet on both tabs, "Has no group", the new prayer request, a request's options, which are now Answered and Edit side by side over Delete). Sheets rise on the iPhone's own curve (400 ms, `cubic-bezier(0.32, 0.72, 0, 1)`) over a veil that fades in. Seen on `/ui` at phone width: the X at the top right, the animation, the X closing it. Closing still has no animation: a sheet disappears when its screen stops drawing it.
- 2026-10-14: admin on the tabs. Sheets on `vaul` (slide away, swipe down, max 60%; `useClosingSheet` times the slide-out because vaul does not report it for the X: found when a sheet would not open twice). `ui/BilingualInput`, `Card`, `LiveDot`, `MemberCircles`, `Button` `dangerText`, `lib/useConfirmTap`. Events: + and tap-to-edit on the tab, editor at `/events/[eventId]`. Groups: cards, admin editor at `/groups/manage/[groupId]`, weekday + time (`group_info.meets_weekday/meets_time`, `meeting.ts`), initials. Prayer: bell → `/prayer/reminders`. Admin: waiting lists + new feature `people`. SQL: group-info section 7, people `schema.sql`, events 3f. Removed: `EventAdmin(Row)`, `GroupAdmin`, `GroupSheet`, `GroupDetail(Form)`.
- 2026-10-14: Admin tile on Home for managers; "3 🙏" beside my own requests (`ui/CountPill`, prayer SQL 5b); a reward when praying (`ui/Celebrate`, pop/ring/float keyframes); picture viewer: tap the dark to close, white X and download above the picture, arrows under it at its edges (`Lightbox`, `IconButton` `onDark`, `group-info/savePhoto.ts`). Launch measured: server 3.3 s cold / 0.4 s warm, ~900 KB of scripts on every launch (nothing cached by the service worker).
- 2026-10-14: fast launch (B28). Measured on an iPhone with a temporary on-screen timer: after a restart the code files took 21 of 22.5 s (iOS had dropped 9 of 10 from its cache; they were 260 KB compressed, not 900 KB as noted earlier). `sw.js` now keeps them (`CACHE`, `static-v1`); only files marked `immutable` are saved and a storage error falls back to the network. After: 10/10 saved, tappable 6.85 s (was 22.54 s), the new `sw.js` arrived without a reinstall. iPhone launch pictures tried and removed: none showed, even after re-adding the app. The Funnel test address serves port 3000.
- 2026-10-15: review before the production push. Fixed: the person and group editors reload on arrival (`components/RefreshOnArrival.tsx`; a kept copy showed old switches, and a second tap undid a change); the "Chưa vào nhóm" card refreshes itself (`useFresh`); saving a picture says when it failed (banner); the security test now expects the prayer count for the author only (5b). Removed: unused strings, `MAX_MEMBER_COUNT_DIGITS` in group-info, the old sheet's `rise`/`fade` keyframes. `npm test` 116/116, `npm run test:rls` 94/94, build clean.
- 2026-10-17: fixed, found by the user: a group's new name did not stay. The group editor had two forms and two Saves; the blue one saved only when / where / notes. Now one form (`group-info/GroupInfoForm`: name, size, when, where, notes) and one Save; `saveGroupInfo` writes `groups` (name, member_count) then `group_info`. Removed `groups/GroupDetailsForm`, `saveGroup`, `memberCountField`. No other screen has two forms. Seen on a local production build as a throwaway admin.
- 2026-10-17: saved Home at launch (B29, Home only). `sw.js` `HOME` part (`home-v1`), `RefreshSavedPage` in the root layout, `lib/savedHome.ts` (language toggle), tab bar `prefetch={true}`, `staleTimes.static` 1 day → 10 min. Checked in the preview, signed in: the saved Home on screen in 3 ms, the fresh request at 78 ms; all tabs loaded behind it; Prayer opened in 46 ms with no request; a page load of `/login` deleted the saved Home. Not yet measured on the iPhone.
- 2026-10-17: group pictures are kept at up to 1 MB instead of about 300 KB (the user: it looked ugly). `lib/shrinkImage.ts` `shrinkUnder` tries quality 0.92 → 0.65 at 2560 pixels and keeps the first under `FULL_MAX_BYTES` (1,000,000), inside the bucket's unchanged 1 MB limit, so no SQL. Cost: the free gigabyte holds about 1,000 pictures, not 3,000, and each opens more slowly on a weak connection. Thumbnails (30 KB) unchanged.
- 2026-10-17: launch pictures back for a second try, with Apple's `apple-mobile-web-app-capable` tag (`metadata.other`) next to Next's `mobile-web-app-capable`: `public/launch` (13 PNGs, 1.4 MB), `src/lib/launchScreens.json`, `scripts/make-launch-images.mjs`, `proxy.ts` skips `launch/`. Served over the Funnel; not yet seen on the phone. If they still do not show, remove them again.
- 2026-10-17: the Events tab's rows look like the Admin tab's people rows: the picture (calendar icon without one), the title, and "time · place" under it; `ui/RowLabel` deleted. Times are "7:00 PM" / "7:00 Tối" and Sunday is "Chúa Nhật" (the user's words), from `i18n/clock.ts`, in events (rows, details, editor dates, notifications), group meeting days and prayer reminder days. Group cards still write the time as 19:30 in Vietnamese.
- 2026-10-17: `ui/Card`: the picture area is always 16:9 (the picture is absolute, `object-cover`, centred), because a tall picture stretched its box. Card heights still follow their text (subtitle, member circles): the user's choice. Seen on the Groups tab with portrait and landscape pictures: every picture area 255 × 454 at that width.
- 2026-10-17: every time on screen now goes through `i18n/clock.ts` `clockTime("HH:MM", language)`: group cards and sheets ("Thứ Ba @ 7:30 Tối"), the prayer reminders list, chat's time lines (chat is off), alongside events. The time fields themselves (`<input type="time">`) stay in the phone's own picker. 122 tests.
- 2026-10-17: cancelled dates are hidden on the Events tab (the user: cluttered), behind a new switch `SWITCHES.canceledEvents` (false), filtered in `EventSchedule`. The editor still lists them with Undo; a weekly event cancelled for good disappears from the tab at once instead of lingering struck through for a week.
- 2026-10-17: a group's name and place in English too (the user: like events). `groups.name_en` (groups 2e) and `group_info.location_en` (group-info 8), returned by `group_directory()`; the editor shows each as one bilingual box (Vietnamese over English), cards and the sheet show the reader's language, the other while one is missing (`group-info/bilingual.ts`). SQL: `docs/sql-to-run-2026-10-17.sql`, needed BEFORE this code goes live (Save writes the new columns). Admin screens (people, person's groups, editor title) still show the Vietnamese name.
- 2026-10-17: the Groups page is "Nhóm nhỏ" in Vietnamese (was "Nhóm", which members read as a worship service): `SHELL_STRINGS.groupsTab` (tab, Home tile, page title) and the groups feature's `adminHeading` (a person's groups on the Admin tab).
- 2026-10-17: a group's pictures swipe in the large view (the user): `ui/Lightbox` + `ui/hooks/useSwipe` (left = next, right = before; at least 50 px and more sideways than vertical). The arrows stay for anyone who taps.
- 2026-10-17: new feature `launch-info` (B42): the admins' "i" on Home with this launch's times and where its code files came from. `isSavedCopy` moved into `lib/savedHome.ts`, shared with `RefreshSavedPage`. Seen in the preview at phone width; `npm test` 126/126.
- 2026-10-17: the picture swipe now drags (the user: a native iOS feel): `ui/hooks/useSwipe` returns an `offset` that follows the thumb; let go past 60 px or in a quick flick and the picture slides off (250 ms) while the next slides in from the other side, otherwise it springs back; at the first or last picture it moves a third as far (rubber band). `Lightbox` applies it as a transform; `touch-pan-y` leaves vertical moves to the browser.
- 2026-10-17: group cards show only when the group meets and its members; the member's sheet shows when, a contact number (tap: Call / Text / Copy, `ContactLine`, `phone.ts`), notes and pictures. `group_info.contact_phone` (group-info 9, digits and + ( ) - . only, so nothing but a number reaches the `tel:`/`sms:` links). Where a group meets is kept but hidden everywhere by `SWITCHES.groupLocation` (false). SQL: `docs/sql-to-run-2026-10-17b.sql`, needed before this code goes live.
- 2026-10-17: `ui/Button` variant `inline` (no side padding) for the group sheet's phone number, which sat 16 px right of its label; the side padding moved from `BASE` into each variant so two padding classes never meet on one button.
- 2026-10-17: Events tab is "Lịch sinh hoạt"; each event shows once, at its next date (`occurrences.ts` `nextOfEach`, tested). A tap opens the event's own page for everyone (`/events/[eventId]`, `EventPage`, slides in: `--animate-slide-in`): a big picture, then time, place and contact with icons (`ui/IconLine`), the description, and Edit for admins (editor now `/events/[eventId]/edit`, new at `/events/new`; `EventDetails` sheet deleted). `events.contact_phone` (events 3g; `upcoming_events`/`managed_events` return it). The tap-to-call number is shared: `src/components/PhoneNumber.tsx` + `src/lib/phone.ts` (was group-info's `ContactLine`/`phone.ts`), strings in `COMMON`. SQL: `docs/sql-to-run-2026-10-17c.sql`, needed before this code goes live.
- 2026-10-17: sign-in by email link, no passwords (the user). `/login`: email, "Sign in", "Create new account?" under it (the separate button is gone); an unknown address gets the "Account not created yet. Create new account?" banner. Sign-up: name + email, the same link. The link's page asks one tap, then the app collects the sign-in through the existing hand-off (`useEmailLink`: `accountExists`, `sendSignInLink` = `signInWithOtp`, `signInWithLink` = `verifyOtp` type `email`). Deleted: the password routes (`/api/auth/sign-in`, `/new-password`), `/login/confirmed`, `/settings/password`, `server/signIn.ts`, `PasswordField`, `ForgotPasswordForm`, `NewPasswordForm`, `EmailConfirmed`, `useConfirmedLink`, `useProblemBanner`, `useTypedEmail`, `passwordManager.ts`, `ui/PasswordInput`. Seen on a local production build: the screens, the banner, and the hand-off signing the waiting app in. Needs the "Magic Link" and "Confirm signup" templates changed in Supabase (auth README, Setup 5).
- 2026-10-17: screens slide like an iPhone's (the user): forward, the new screen comes in from the right; back (the arrow, or a swipe from the left edge in the installed app), it leaves to the right and uncovers the one under it. React's `<ViewTransition>` in the root layout (`components/PageSlide.tsx`), transition types `GO_FORWARD`/`GO_BACK` (`lib/slide.ts`) on Home's tiles, list rows (`ui/ListRow`), the top bar's icons and back arrow, and the `router.push` calls that open an editor; CSS in `globals.css`. Tab-bar taps and refreshes do not move. Every main tab (Events, Prayer, Groups, Admin) has a back arrow to Home. `lib/useSwipeBack.ts`. The event page's own slide-in keyframe is gone. `ui/ListRow`'s button is `type="button"` (it submitted the sign-up form). Seen on a local build: forward from a Home tile and from an event row, back to the list and to Home.
- 2026-10-17: text size (the user): new feature `text-size`, Gọn / Chữ to in Settings and on sign-up, kept per phone in a cookie the root layout reads into `<html data-text-size>`; Chữ to sets `--text-scale: 1.2` (17 → 20.4 px). With big text or the Admin tab, the tab bar says "Lịch" (`SHELL_STRINGS.eventsTabShort`, `AppTabs` `bigText`). Seen on a local build.
- 2026-10-17: slides and signed-out screens polished (the user). The sliding screen is white and a screen tall (it was see-through: both screens showed); the tab bar is its own layer that stays on top and still (`slide-anchor-tab-bar`); the screen underneath no longer drifts, only the top one moves; tab-bar taps slide too (a tab to the right goes forward, one to the left back). The tab bar's room (`pb-24`) moved from `<main>` into `PageSlide`, so a short screen does not scroll. Signed-out screens: centred (`SignedOutFrame` fills the screen), a back arrow left of "English" on sign-up, "I already have an account" removed, more space before "Create new account?", shorter words on "check your email" and the link's page. Setup steps no longer count signing in: sign-up is "Step 1 / 6".
- 2026-10-17: sign-up steps slide (the user): text size first ("Step 1 / 7", `Welcome`'s `firstStep` from the login page), then name and email, then "check your email"; each slides in from the right through `lib/slide.ts` `slide()` (a state change in a transition carrying the direction), each has a back arrow to the one before ("I already have an account", "Start again" and the spam line are gone). Check-your-email: heading and address in bold, one line.
- 2026-10-17: the tab bar's direction (the user): Home slides the screen away (back); every other tab slides in (forward), wherever it sits.
- 2026-10-17: the small text choice reads "Chữ nhỏ" / "Small text" (was "Gọn" / "Compact"; the user).
- 2026-10-17: the setup bar counts only the steps this phone will show (the user: it jumped from 2 to 5): `components/setupSteps.ts` `stepsFor` (tested) leaves out install in the installed app and notifications answered before on this phone or impossible in this browser; `SetupProgress` works it out after the first draw.
- 2026-10-17: a group's card opens its own page (`/groups/<id>/about`, `group-info/GroupPage`), shaped like an event's: big picture, when / where / contact with icons, notes, pictures, Edit for admins; `GroupInfoSheet` deleted. Sign-up's first step is titled "Chọn cỡ chữ" in bold (`TextSizeChoice asStep`).
- 2026-10-17: the phone number sits level with its icon (`ui/Button` `inline` keeps its 48 px tap area with `-my-3` instead of pushing the line down; measured within 2 px); notes (group) and description (event) are icon lines too (`NotebookText`).
- 2026-10-17: the tab bar slides only to and from Home (the user): from Home a tab slides in, to Home it slides away, an inner screen (an event's page) to its own tab slides away, and between two tabs nothing moves (`AppTabs` `direction`).
- 2026-10-17: the install guide in the clean look (the user): full screen (no tab bar, no sign-out), logo and bold heading, steps as the button to look for in a grey circle (`ui/RoundIcon`, `InstallStep`), no numbers; iOS 26 Safari gets a first "•••" step (`device.ts` `hasGlassToolbar`, tested). `SignOutButton` lost its `variant`. Trade-off: the 2026-10-14 way out for a wrong account in Safari is gone.
- 2026-10-19: launch-day feedback (the user). Events are cards (`ui/PhotoCard`: the event's picture or the church's, darkened, white title / "weekday · time" / place / contact; `EventRow` → `EventCard`, `formatWeekday`). Staff page (`features/staff`, `/staff`, a Home tile above Admin; `ui/PersonCard`, `ui/Avatar` `large` + `src`). Prayer: no "(bạn)" after my own name; a sticky toolbar (`ui/Toolbar`, utility `top-under-bar`) with the bell, play/pause worship music (`useWorshipMusic`) and +; after 4 s a swaying bubble under play (`ui/NudgeBubble`, `useShowAfter`); writing and editing a request moved from sheets to `/prayer/new` and `/prayer/<id>/edit` (`useRequestWriting`; `post`/`edit` left `usePrayerFeed`) because the iPhone keyboard pushed the sheet off the screen. Settings headings big and bold with an icon (`ui/SectionHeading` `variant="large"`, `icon`). My picture in Settings: choose, frame, crop, save (`profiles` `AvatarSection`, `useAvatarChange`, `setAvatar`/`removeAvatar`, `ui/ImageCropper` on `react-easy-crop`, `lib/cropImage.ts`), shown on prayer requests and in the people list. Sign-in: every link of the same church day works (`sign_in_links` replaces `login_handoffs`; `POST /api/auth/link`; `storage.todaysClaimKey`; `handoff.ts` `newSecret`/`hashOf`; `churchTime.endOfChurchDay`). `npm test` 130/130, build clean; new components seen on `/ui` at 375 px. NOT run: any of the SQL, the sign-in end to end, an iPhone. Needs SQL: `auth/schema.sql` 1-2, `profiles/schema.sql` 6, then `prayer/schema.sql` 5b and `people/schema.sql` 3.
- 2026-10-19: prayer toolbar `fixed` under the top bar with a spacer (`--spacing-toolbar` 64 px), because `sticky` scrolled away on the user's iPhone; the nudge bubble moved from under play to its left, fills the row, tail pointing right, sways right (the user). Seen on `/ui` at 375 px in Chrome; NOT yet on the iPhone.
- 2026-10-19: the nudge bubble shows after 2 s (was 4) and is as wide as its words, always 2 lines (a "\n" in `prayNow`) with white space on its left (the user).
- 2026-10-19: every phone number opens an iOS 26 style menu under it (`ui/ActionMenu`: screen darkened except the number and the menu; Call green, Nhắn tin blue, Sao chép yellow `--color-caution`; a tap outside closes it), replacing the three buttons. Event cards are taller (`min-h-52`) with the number as a blue, tappable last line (`PhotoCard` `extra`; its link is now a layer under the words). Seen on `/ui` at 375 px in Chrome; NOT on an iPhone.
- 2026-10-19: staff page as contact cards (role moved from a heading into `PersonCard` `subtitle`); `PhoneNumber` keeps its own width in a column (`self-start`); on dark event cards the number is a lighter blue (`--color-action-on-dark`, `Button` `inlineOnDark`, `PhoneNumber` `onDark`). The group page's number already opens the same menu; group cards show no number (the user). Seen on `/ui` at 375 px; NOT on an iPhone.
- 2026-10-19: the event's own page is gone (`/events/[eventId]/page.tsx`, `EventPage`, string `time` removed): a member's card is not a button (`PhotoCard` `href` optional), an admin's tap opens `/events/<id>/edit` (its back arrow leads to `/events`). Seen as a member in the pane; the admin tap NOT seen (that account lacks `events.manage`).
- 2026-10-19: Vietnamese wording pass (the user): approval, assistant ("Nghe đọc" for read aloud), sign-in problems, events ("Liên hệ", "Hình ảnh"), groups, install ("Nhấn" not "Bấm"), prayer ("ý cầu nguyện" not "lời xin"), push. Strings only; English unchanged. Typechecked; NOT seen in the preview.
- 2026-10-19: "Gỡ"/"Gỡ bỏ" → "Xóa" everywhere (groups, prayer reminders, "Đã xóa", `/ui` demo) (the user).
- 2026-10-19: Settings in Messenger's layout (the user): my picture (camera → `/settings/photo`) and name at the top; rounded groups (`ui/ListGroup`) of rows with a coloured icon (`ui/RoundIcon` tones), the value in grey (`ListRow` `value`) and a chevron: Tên, Email (read only), Thông báo | Cỡ chữ, Ngôn ngữ; each opens its own screen (`/settings/name`, `notifications`, `text-size`, `language`). No Account section: Sign out is a red button far below, tapped twice. `AccountSection` removed; `NotificationSwitch` split from `NotificationSection` (kept for the waiting screen). Seen in the pane at 375 px; NOT on an iPhone.
- 2026-10-19: a group's page (the user): adding a picture is a + square first in the photo strip (`ui/PhotoAddTile`), shown to the group's people even before any picture; admins' "Edit group" is a round filled pencil held under the top bar (`ui/Toolbar` + `IconButton`, like prayer's +). Typechecked; NOT seen signed in (the preview needs an emailed code), NOT on an iPhone.
- 2026-10-19: Supabase refresh-token reuse detection switched off (members signed out after a missed renewal); auth README Setup 6 and Decisions; backlog B45 (server-held tokens).
- 2026-10-19: auth Edge cases: deploys sign nobody out but made a missed renewal likelier; members already signed out sign in once more; how to check detection is off. Section 6.1 names the setting.
- 2026-10-19: Supabase access token expiry set to 15 minutes (the user), so permission changes arrive within 15 minutes instead of an hour; auth README Setup 6 and every "within the hour" in approval, people, permissions and `auth/server/queries.ts`.
- 2026-10-19: staff moved from `directory.ts` to Supabase (`staff_sections`, `staff_members`, `staff/schema.sql`, `server/queries.ts`, page loads them); headings back above the cards, Pastor Khai under "Ban điều hành"; `edit-staff.sql` (placeholder scripts); approval door lines; 2 RLS cases. Typechecked; SQL and RLS tests NOT run.
- 2026-10-19: staff photos: public bucket `staff-photos` (1 MB, JPEG/PNG/WebP, dashboard uploads only) in `staff/schema.sql` 3b; `edit-staff.sql` block 1b. SQL NOT run.
- 2026-10-19: Home: Staff tile and page renamed "Danh bạ" in Vietnamese; Staff and Admin tiles get photos (`public/images/home/staff.webp`, `admin.webp`). Seen on Home in the dev preview: both photos load, "Danh bạ" shows.
- 2026-10-19: staff people apart from headings (the user): `staff_members` → `staff_people` + `staff_placements`; `edit-staff.sql` rewritten (add a person once, place by name, headings match ignoring case); approval door lines and RLS cases follow. SQL NOT run.
- 2026-10-20: launch feedback round 2 (the user). Install first: on a phone's browser `/login` is the language page (`i18n/LanguageChoice`, new `language` cookie read by `layout.tsx`) then the install guide, before sign-in, because iOS copies only regular Safari's cookies into an installed app (root cause of a signed-out install, iOS < 26). Install guide: Chrome-on-iPhone steps (`iphoneChrome`), a bouncing arrow at the browser's first button (`firstButtonAt`, `ShareArrow`). Globe on the language link. Prayer: no "Hide my name"; Pray once per request per day (`cooldown.ts`). Events: `address` column (schema 3g, re-run), editor field, tap the place for address + Google/Apple Maps + Copy (`components/Place`, `ui/MapLogos`, `ActionMenu` `heading`/`wide`). Groups: "Has no group" for `users.manage` only. Top bar: Settings is my picture (`MyPicture`). Seen in the pane: language page then guide (Android and computer), cookie set, server paints the chosen language, Continue in browser then sign-in. Tests 138/138. NOT seen: iPhone steps and arrow on a real iPhone, anything signed in (avatar, groups, address menu, prayer). SQL 3g NOT run.
- 2026-10-20: Events, one picture for Sunday morning (the user): `cardsOf` merges a day's events at the same place into one card; `EventCard` takes `occurrences`. Tests: 3 new cases. NOT seen signed in.
- 2026-10-20: event editor follows the card (the user): field order = card order, a hint per field (`ui/Field` `hint`), description box removed (shown nowhere), end time on the card, weekly "first date" hint. Seen signed in in the pane.
- 2026-10-20: stale editor fix: `/events/<id>/edit` gets `RefreshOnArrival`, and `EventForm` and `GroupInfoForm` are keyed by their stored values (a kept page's form showed old values and Save wrote them back). Rule: an editor that copies props into state is keyed by them. Seen in the pane for events; the group editor NOT exercised.
- 2026-10-20: event cards taller (`ui/PhotoCard` min-h-80), a gap under the title, a shared card in two blocks (when / where and contact). Seen in the pane.
- 2026-10-20: bottom tab bar uses `prayerTabShort` ("Cảm tạ") so the label fits; page title and Home tile keep `prayerTab`.
- 2026-10-20: search (the user: "Hội Thánh Việt Nam ở Winston-Salem" → vietcorners.org): `src/lib/church.ts` (the church's facts, once); `/login` gets a title and description with those words, `canonical` vietcorners.org, and schema.org `Church` JSON-LD; `src/app/robots.ts`, `sitemap.ts` (both skipped by the proxy); `components/ChurchIntro` on the language page (InstallGate `languageIntro`). Checked with curl signed out: robots, sitemap, title, description, canonical, JSON-LD. NOT seen: the intro on screen (the pane is signed in). Off-site steps (Search Console, Google Business Profile) are the user's; do NOT make netlify.app redirect to vietcorners.org: installed apps live on their origin and would lose their sign-in.

- 2026-10-20: Sign out is a red outline button (new `ui/Button` variant `dangerOutline`), not solid red, which read as an error banner.
- 2026-10-20: the church's own map pin (36.082306, -80.351056; the street address points to the building next door): `CHURCH.pin` in `src/lib/church.ts`, used by `components/Place` (through `src/lib/mapLinks.ts` since the review below), and as `geo` in the `/login` JSON-LD. Copy still copies the address. Typechecked, 143 tests; the menu NOT tapped in the pane (the user was signing in there). The user's off-site steps: Google Business Profile and Apple Business Connect, pin moved onto the building.
- 2026-10-20: code review fixes (the user: "fix all", recommendations accepted). JSON-LD `<` escape really escapes now (`"\\u003c"`; before it replaced `<` with `<`). "Address copied" for an address (`COMMON.addressCopied`; `copied` → `numberCopied`). `getMyAvatar` deleted: `getMyProfile` returns `avatarPath`, one read per page instead of two. `EventRow.address` required and in `EVENT_COLUMNS`. `// PEOPLE` marker on the Groups page. Service times in `CHURCH.serviceTimes`. `ActionMenu` loses `wide` (wide with a heading; no heading when the name is the address). Map links move to `src/lib/mapLinks.ts` (tested): the church's address opens its Google Business Profile (`CHURCH.googleCid`) and its Apple pin; matched at the start of the address, so "1134 …" is not it. Brand first (the user): the language page shows "Viet Corners" and the searched words under the logo, the title is "Viet Corners · …"; `CHURCH.name` = the listing's name "Hội Thánh Báp-Tít Việt Nam - Winston-Salem"; JSON-LD `sameAs` the listing. Seen: address menu on the Sunday card (no repeated heading; Google button → the listing's cid URL), `/login` title, description, JSON-LD by curl. Typecheck, 143 tests. NOT seen: the language page's new lines (the pane is signed in).
- 2026-10-20: language page (the user): "Viet Corners" under the logo (`Text` tile, in `LanguageChoice` itself), the searched-words subtitle removed, a wider gap before "Chọn ngôn ngữ" (`mt-6`). `components/ChurchIntro.tsx` deleted with the `intro` / `languageIntro` props that carried it: the searched words stay in the page title, description and JSON-LD only. Typechecked; NOT seen (the pane is signed in, and the page shows only signed out).
- 2026-10-21: feedback round 3 (the user). Group pictures 1600 px under 400 KB (`groups` `PICTURE_SIDE`, `shrinkUnder`; bucket 500 KB, schema.sql 2f; old pictures stay soft until chosen again). The music bubble says "Tôi muốn / cầu nguyện bây giờ" / "Let's pray". Worship songs: `public/audio/worship/`, `WORSHIP_SONGS`, shuffled rounds (`prayer/playlist.ts`, tested), the next song on `ended`. Events: the weekly card first (`weekly_card` table, events schema.sql 3h; `EventWeeklyCard`, `weekly.ts`, group meetings from the page), one-time events below under their dates, short times ("9:15a"); the pencil opens the Edit list (`/events/manage`), the weekly card's editor (`/events/weekly/edit`). SQL: `docs/sql-to-run-2026-10-21.sql`. `npm test` 152/152, build clean. NOT seen: any of it signed in (the pane has no session), the SQL not run, `test:rls` not run.
- 2026-10-21: group pictures stay on the phone: `public/sw.js` PHOTOS (cache `photos-v1`, key = the Supabase address without `?token=`, newest 300, deleted at `/login`), `crossOrigin="anonymous"` on `ui/PhotoThumb` and `ui/Lightbox` so the answer is readable (Supabase storage sends `Access-Control-Allow-Origin: *`, checked with curl). NOT seen signed in.
- 2026-10-22: the weekly card less crowded (the user): `PhotoCard` loses `pt-40`, padding 20 → 16 px, `text-balance` on the title (event cards too); `EventWeeklyCard` days `gap-3`, lines `gap-0.5`, `ps-6 -indent-3` (a long line continues under its name), the time `whitespace-nowrap` with its separator. Seen at 375 px, compact and big text, with the card's classes (not signed in).
