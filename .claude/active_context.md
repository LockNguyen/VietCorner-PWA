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
        multi-page labels, 8 unanswerable/wrong-premise). Measured with the user's code via
        `python -m evaluation.explain --all` (bge-m3, page level, TOP_K=5):
        hit@5 0.73 (any gold page in the top 5) but Recall@5 0.54 (fraction of gold pages found,
        which is the definition in metrics.py); vi 0.49 / en 0.73. MRR unreliable until reciprocal_rank
        is fixed (it iterates a set, losing order). CORRECTION: the "0.73 baseline" quoted earlier was
        hit@5, not Recall@5 as stated.
  - [x] M3 bake-off run by the user (41 questions, page-level, TOP_K=5, Recall = fraction of gold pages):
        | model | Recall@5 | vi | en | MRR | max sim (unanswerable) | p50 ms |
        | bge-m3 | 0.54 | 0.49 | 0.73 | 0.56 | 0.61 | 127 |
        | AITeamVN/Vietnamese_Embedding | 0.52 | 0.43 | 0.83 | 0.44 | 0.46 | 114 |
        | intfloat/multilingual-e5-base | 0.44 | 0.33 | 0.85 | 0.36 | 0.81 | 49 |
        NOTE: max-sim values are NOT comparable across models (each model has its own similarity scale).
        Separation measured instead (AUC = chance an answerable question outscores an unanswerable one):
        | model | AUC | Cohen's d | answerable mean | unanswerable mean | answerable below max unanswerable |
        | bge-m3 | 0.64 | 0.50 | 0.593 | 0.566 | 20 of 33 |
        | Vietnamese_Embedding | 0.71 | 0.97 | 0.472 | 0.429 | 15 of 33 |
        | e5-base | 0.71 | 0.84 | 0.806 | 0.788 | 17 of 33 |
        => DECIDED: bge-m3 (best ranking; separation is unusable on every model, so it costs nothing to give up).
        DECIDED: stop tuning retrieval now; build M4-M5 and judge on real answers. Revisit after the Vietnamese
        PDFs arrive, or if a configuration reaches ~0.90 AUC. Both decisions recorded in architecture.md.
        Experiments queued in backlog B14.
  - [x] M4 pgvector + ingest: 533 chunks in Supabase (288 pages, indexes 0-532, 0 duplicates). Re-ingestion is
        idempotent. Database top-5 identical to the in-memory top-5 for the questions checked (parity proven).
        Latency: embed 166 ms p50, Supabase vector search 67 ms p50 (includes the network round trip).
        Tools: `pytest -m db` (tests/test_store.py, throwaway document) and `python -m evaluation.check_database`.
  - [x] M5 RAG answer + provider rotation (`rag/providers.py`).
  - [~] M6: user wrote `api/main.py` + `speech/transcribe.py` (test_api 6/6, 39 fast tests pass). Review 2026-09-21
        found: non-ASCII token -> 500 (compare str, not bytes); async /transcribe blocks the event loop; no model
        warm-up; Groq client per call with no timeout. Claude added `services/ai/Dockerfile` + `.dockerignore` +
        Space front matter. DECIDED: interim host = Hugging Face Space (no card for Oracle yet), same image later on Oracle.
  - [x] M6 provider attribution: `Generation(text, provider)` returned by the pool, `Answer.provider`, `/ask` returns
        `provider`. 40 fast tests pass; live `python -m rag.answer` prints "answered by: groq".
        Found: `.env` comments after values corrupt keys under `docker --env-file` (Groq key was broken in the container,
        so the pool disabled Groq there). User must fix `.env` lines GROQ_API_KEY and CEREBRAS_CHAT_MODEL.
  - [x] M6 review fixes applied (45 fast tests; server + Docker verified: ready in 12-16 s, embed ~120 ms,
        search ~250 ms, Groq answers in the container).
  - [x] Review items 1-2 drafted by Claude (uncommitted, 60 fast tests): 7 s request deadline + 4 s per provider on
        background threads; ProviderBusy/ProviderBroken. Live: stuck OpenRouter model cut at 4.0 s (was 110 s).
  - [x] Review items 3-13 done (65 fast tests; real-server checks: fail-fast on a bad DATABASE_URL, one clean log
        line per request, /docs off by default). OpenRouter set to nex-agi/nex-n2.5-mini:free after a 15-model test.
  - [ ] M6 deploy · [ ] M7 voice UI · [ ] M8 docs/release · [ ] M9 LiveKit (optional)
- [ ] Step 3: `i18n`: en/vi UI strings + `{en, vi}` DB content + toggle

## ⚠️ Known Constraints & Debt
- iOS push requires iOS 16.4+, Add to Home Screen, and a user tap to grant permission.
- Embeddings: self-hosted; the model is chosen in M3 (e5-base vs bge-m3 vs Vietnamese_Embedding). `EMBEDDING_DIM` and `schema.sql` wait for that result.
- **The corpus is English-only** (T-Net course, 288 pages, 0 Vietnamese characters), so the real requirement is cross-language retrieval: Vietnamese question → English passage. M3 questions should be mostly Vietnamese about English content, and a Vietnamese-only fine-tuned model may score worse than a cross-lingual one. M5's prompt must answer in the question's language from English sources.
- Slide-style pages: 203 embedded images and 12 chunks under 20 words (min 8). Tiny chunks add retrieval noise. Options to test in M3: drop chunks under N words, or merge short pages.
- **A similarity threshold alone cannot separate answerable from unanswerable questions.** Measured on the eval set:
  best-chunk score is 0.53-0.67 for answerable questions and up to 0.61 for unanswerable ones, so the ranges overlap.
  Refusal comes from the prompt. `SIMILARITY_FLOOR` stays 0.35 as a gibberish guard (re-measured 2026-09-21 on the
  database: real 0.41-0.75, unanswerable 0.51-0.61, off-topic 0.33-0.50).
- **Decide the headline retrieval metric.** `recall_at_k` scores the *fraction* of gold pages found, so a question
  labelled with 6 gold pages can never exceed 5/6 in a top-5 run: the score then measures my labelling, not the model.
  Either report hit@k (any gold page found) alongside it, or trim gold labels to the minimal pages that answer.
- **Vietnamese/English gap is measurable:** English twins hit 1.00 Recall@5, their Vietnamese versions 0.65. Report per language.
- Vietnamese questions score lower than English ones on this English corpus (best ~0.57-0.59 vs 0.65): the cross-lingual gap is real but retrieval still finds the right pages.
- Chunks repeat page headers/footers ("T-Net International www.tnetwork.com"). Stripping repeated boilerplate is a possible M3 experiment.
- **DECIDED: chat providers are primary + fallbacks** (2026-09-22, replaced taking turns). One answer costs ~2,400
  input tokens, so Groq's 8,000 tokens/minute allows ~2.8 questions/minute; the next provider in `CHAT_PROVIDERS`
  answers while Groq rests. Failing providers rest 60 s doubling to 15 min. Gemini was overloaded on 2026-09-22
  (47-60 s, 503 "high demand"), so only `groq-2` (GROQ_CHAT_MODEL_2=openai/gpt-oss-20b) covered for Groq.
- **Mentor mode:** never implement `TODO(M#)` bodies unless the user asks (CLAUDE.md).
- Python 3.12.10 installed (user scope, `%LOCALAPPDATA%\Programs\Python\Python312`; not on PATH in old terminals). `services/ai/.venv` created, requirements installed (torch 2.14, sentence-transformers 6.0.1, pymupdf 1.28.2).
- Installed the Microsoft Visual C++ Redistributable (it was missing, so PyMuPDF/torch DLLs failed to load). `pytest` verified: 32 fast tests collected, 2 pass (provided code), 30 fail only on ★ stubs (NotImplementedError + "write SYSTEM_PROMPT"). The first run takes ~2 min (cold torch import), later runs ~8 s. A harmless Starlette/httpx deprecation warning appears in test_api.
- Oracle needs a credit card (not available yet): the service runs on a free Hugging Face Space meanwhile. A public Space sleeps after long inactivity (slow first request). Fallback for QA: PC + Cloudflare Tunnel.
- Browser SpeechRecognition is unreliable in iOS home-screen PWAs, so use MediaRecorder + server-side Whisper instead.
- Vietnamese `speechSynthesis` voices vary by device; verify during Step 4 QA.
- Netlify synchronous functions time out at ~10 s. Voice pipeline must fit.
- Supabase free projects pause after ~7 idle days (backlog B9).
- Everything else deferred is in `.claude/backlog.md`.
  - [x] M6 final review (2026-09-22): 69 fast + 3 db tests; allowlist deploy verified from 17 files; committed.
  - [ ] M6 deploy: HF Docker Spaces need a paid plan (2026-09-22). Interim: container on the PC + Tailscale Funnel.
- `evaluation/questions.jsonl` + `answers/` are local only now (gitignored): back them up; they are still in git
  history before 2026-09-22 (a history rewrite would remove them from GitHub; not done).
  - [x] M7 (chat design, branch `m7-chat-assistant`): chat UI (typed + voice), localStorage history per user,
        manual retry with a growing wait, follow-up rewriting in `services/ai/rag/condense.py` (`/ask` takes `history`).
        81 pytest + 17 vitest tests. Verified live: answers, sources, reload persistence, new chat, 503 + retry,
        and a voice question from a recorded WAV. Phone QA still open.
  - [ ] Compare the two M7 branches (`m7-voice-assistant` = push-to-talk only) and decide what ships.
  - [x] M7 phone QA passed (2026-09-29): mic permission, recording, spoken answer, persistence on a real iPhone.
  - [x] M8 cleanup: feature detail moved from architecture.md into feature READMEs (auth, chat, assistant) and
        `services/ai/README.md`; `docs/adding-a-feature.md` written (shape, RLS patterns, checklist);
        `strings.ts` convention with auth migrated; `tests/rls.test.ts` + `npm run test:rls` (9 tests);
        `useChatbotMessages` renamed `useConversation`; every page gets the user via `auth/server/queries`.
- [x] Step 3: `i18n` (branch `feature-i18n`): `user_settings` table, `{ en, vi }` strings in every feature,
      `useLanguage().t`, toggle on login + settings, Vietnamese default, device choice adopted on first
      sign-in. B17 done in the same pass (chat + assistant migrated). 20 vitest tests.
      Schema applied and verified end to end (2026-10-05). Merged into `main` (approved by the user).
- [x] events (branch `feature-events`): members' schedule, four tables, weekly expansion, cancellations,
      group vs church-wide RLS, reminders invisible to members, seeds for every edge case. 28 vitest tests.
      Schema applied; `npm run test:rls` 18/18. Schedule verified against the seeds as a member and a non-member
      (README, Expected behavior). **Open: the Vietnamese seed text is stored corrupted** (pasted through
      PowerShell); repaired by the user (verified 2026-10-05). Not merged into `main` yet.
- [x] B20 (branch `feature-prayer`, off `feature-events`): `groups` + `group_members` moved from chat into
      `src/features/groups/`. No database change. test:rls 18/18.
- [x] prayer requests (branch `feature-prayer`): two tables, `prayer_feed` view for anonymity, `pray_for_request`,
      Prayer tab (composer, 3-line cards, load on scroll, author's Answered/Delete), local one-hour pause.
      40 vitest tests. Permissions proven by a 27-check dry run in a rolled-back transaction.
      Schema applied by the user; test:rls 29/29 (2026-10-05).
- [x] push delivery extracted from chat into `src/features/push/` (`sendPush`). No database change.
      Not re-tested on a real phone since the move.
- [x] prayer, second pass (2026-10-06): Edit is back; answered requests leave the feed but stay in the table;
      the count left the screen and became a push to the author (`/api/prayer/pray`); delete asks nothing;
      "more…" is measured. Migration dry-run: 18/18 checks.
      Migration applied, test:rls 31/31. Merged into `main` with events on the user's go (2026-10-06, not pushed).
      Still not exercised: the Prayer screen while signed in.
- [x] notification pause (branch `push-cooldown`, off `main`): one notification per user per topic per minute,
      `push_cooldowns` + `claim_push_turns`, topic doubles as the tray tag. Dry run 8/8.
      SQL applied, test:rls 33/33. Merged into `main` (2026-10-06, 11 commits ahead of GitHub, not pushed).
      Open: phone check (two messages in a minute = one buzz; does the tag replace on iOS?).
- [x] admin slice 1a (branch `admin-foundation`): permissions in the login token (hook + `has_permission`),
      admin-only tab and page, Groups section (create, rename, remove = soft delete that silences the
      group everywhere). Dry run of the whole setup 15/15, build clean.
      Setup applied and the hook switched on by the user; test:rls 38/38 (2026-10-06).
- [x] events in church time (`churchTime.ts`): closes B21 for events, incl. weekly events across the clock change.
- [x] admin slice 1b: events section (create, edit en/vi side by side, cancel a week or the whole event with a
      push per language, remove). 59 unit tests, 16-check dry run of the rules, build clean.
      Events SQL applied by the user. Reworked after review (2026-10-06): one "Edit event" panel, Undo per
      cancelled date, cancel-for-good replaces Remove and lingers a week for members, cancellations outside
      the one-minute pause. **Pending: the small undo SQL block; test:rls expects 39. QA pause before slice 2.**
      Not exercised: the admin screens, any push on a real phone.
- [x] admin slice 1 merged into `main` on the user's go (2026-10-06, 17 commits ahead of GitHub, not pushed).
- [ ] admin slice 2 (prayer moderation): ON HOLD, backlog B24, waits on the pastor.
- [x] join approval (branch `join-approval`): ask → pending → a manager approves or declines; three pushes.
      Dry run 17/17, build clean. **Pending: the join SQL block; test:rls expects 40.** Not exercised on screen.
- [x] admin slice 3: reminders (branch `join-approval`): event reminders (3 choices), weekly prayer reminders per
      group, `/api/reminders/send` behind `CRON_SECRET`, send-once ledger. 69 unit tests, 15-check dry run.
      SQL applied (test:rls 41/41). Merged and **pushed to GitHub 2026-10-07** (`7aec5b8`); Netlify deployed it.
      `CRON_SECRET` set and the cron job running: first run answered 200 with nothing due.
      No reminder has been seen arriving on a phone yet.

## ⏭️ Known, deferred, not forgotten (see `.claude/backlog.md`)
- B17 strings migration for chat + assistant (do it inside the i18n step).
- B18 shared UI kit (do it inside the UI/UX revamp).
- B19 post-MVP features still open: account settings, UI revamp.
- B22 prayer pause is device-only.
- B24 prayer moderation on hold (pastor).
- Noted by the user 2026-10-07: B26 tracked migrations · B27 too many network calls · B28 slow cold start on iPhone ·
  B29 page caching (needs an approved plan) · B30 error banner (after the revamp) · B31 tap feedback (revamp).
- B1 API-only data access · B3 rate limiting · B4 notification control · B6 load older messages · B9 launch readiness.
- B13 answer-quality eval · B14 retrieval experiments (Vietnamese PDFs first) · B16 multi-hop retrieval.
- M9 (LiveKit real-time voice, B11) stays optional.
- Oracle VM still pending a credit card; the AI service runs on the PC behind Tailscale Funnel until then.
- The follow-up rewrite can narrow a question that already stood alone: measure on the eval set before tuning.
- [x] `double-tap` merged into `main` (confirmed by the user 2026-10-08). `main` is 7 commits ahead of GitHub; nothing is pushed, by instruction.
- [ ] **UI/UX revamp** (design: `docs/design-system.md`; rules: the `frontend` skill; a review pause after each slice)
  - [x] 0 Foundations (branch `ui-0-foundations`): tokens, `Text`, `Button`, `Spinner`, `/ui`. Seen at phone width.
  - [x] 1 Frame (branch `ui-1-frame`): `TopBar`, `TabBar`, `IconLink`, `PhotoTile`; Home with three tiles; the
        assistant and Settings at the top right; opens on Home; "Góc Việt" and a placeholder icon. Seen in
        `/ui` and on the sign-in screen at phone width. NOT seen: any signed-in screen, an installed iPhone app.
  - [x] 2 Lists (branch `ui-2-lists`): `ListRow`, `Thumbnail`, `SectionHeading`, `EmptyState`, `SkeletonRow` →
        Groups, the event schedule, Settings, the notification toggle, loading. Seen in `/ui` and on the sign-in
        screen. NOT seen: the three signed-in screens themselves. `Avatar` moves to slice 5 (first used there).
        After review: the join button reads "Join"; event times sit in a bold fixed-width box before a plain picture (`RowLabel`).
  - [x] 3 Banners (branch `ui-3-banners`): `Banner`, `useBanner`, `BannerHost`, `useSave`; every inline error line
        and `failed` state replaced; successes announced. Timing, tap-away and the stack tried in `/ui`.
        NOT seen: a real save or failure on a signed-in screen.
  - [x] 4 Forms and the sheet (branch `ui-4-forms`): `Field`, `TextInput`, `TextArea`, `Select`, `Switch`, `Sheet`,
        `LogoMark`; sign-in; the three admin sections; the event editor as its own screen
        (`/admin/events/[eventId]`); event details and prayer options as sheets; `ActionButton` deleted.
        Seen: sign-in, and every component and admin row in `/ui`. NOT seen: any signed-in screen, so the
        admin page, the editor's screen (save, back to the list, cancel for good) and both sheets in place.
        Debt: a join request shows the full email beside two buttons and wraps to three lines (names in
        slice 5 shorten it); date and time fields not seen on an iPhone.
  - [x] 5 Names (branch `ui-5-names`): foundation `profiles` (table + trigger + RLS, `getNames`, `useNames`,
        `NameStep` shown by the layout, `NameSection` in Settings), `ui/Avatar`; chat, its notification, prayer
        (`prayer_feed.author_name`) and join requests show names. RLS cases written (5 new, 1 changed).
        **WAITS ON THE USER: run `features/profiles/schema.sql`, then section 4 of `features/prayer/schema.sql`.**
        NOT run: `npm run test:rls` (needs that SQL). NOT seen: any of it on screen. `Avatar` has no screen
        yet (slice 6). Debt: backlog B34 (email copies still stored).
  - [ ] 5 Names: the name step after first sign-in; names and default avatars everywhere (any signed-in member can see a name)
  - [x] 6 Conversations (branch `ui-6-conversations`): `Bubble`, `BubbleRun`, `TimeLine`, `Composer`, `IconButton`,
        `useScrollToEnd`; chat as runs (`chat/runs.ts`), prayer by week then person (`prayer/grouping.ts`), the
        assistant on the same bubbles. 15 new unit tests (85). Seen: the components and compositions in `/ui`.
        NOT seen: the three screens themselves; the fixed composer over a phone keyboard; the assistant's
        bottom area (`pb-48` is a measured guess at its height).
        Prayer list layout redone after the user's review (it was cramped and confusing): see the prayer README.
  - [ ] **UI-wide review before the merge.** Code and security passes done; all 16 findings fixed on the
        user's word (the comment trim left the assistant's hooks alone: mentor-mode code). SQL for the names
        policy is run; `npm run test:rls` 49/49, `npm test` 90/90, build clean on Next.js 16.4.0.
        Prayer screen redone on the user's direction: round purple Pray chip on the bubble's edge, green
        tick once given; a round plus opens the new-request sheet.
        On-screen pass, partly done in the user's Chrome (a member's account, tab in the background, so page
        content and measurements only, no screenshots): Home, Events (server output), Prayer (chips, both
        sheets), Groups, a chat, Settings, the assistant's empty state; /admin answers 404 to a member.
        NOT seen: anything as a picture; the admin screens; the name question; a real save.
        Found: Settings shows "Name" twice (heading and field label).
  - [x] **Admins approve names** (branch `names-approval`, on top of `ui-6-conversations`): in no group a name
        saves at once; in a group (or with a join request waiting) it becomes a request that `groups.manage`
        approves or declines. Database functions hold the rule; two routes notify. 8 new security cases.
        Section 5 of the schema is run; `npm run test:rls` 56/56. NOT seen on any screen.
  - [x] **Merged and pushed (2026-10-08, on the user's word):** `main` fast-forwarded to `17e82b5` (the whole UI
        revamp, the review fixes, admin-approved names) and pushed to GitHub; Netlify builds from it.
        NOT checked: that the Netlify build passed, or anything on the live site.
  - [x] **iPhone fixes after the first production look** (branch `iphone-fixes`, 2026-10-09): message field under
        the tab bar (utility name collision), the shrunken page and sideways scroll (overflow clipped, date
        fields), notifications on a re-used phone (server-side save), reminder switches (insert-or-nothing).
        `npm run test:rls` 57/57, `npm test` 91/91. Reminder error reproduced and its fix proven against
        the database. NOT verified: anything on an iPhone. The element that was a few points too wide on
        every page was not identified; the page now clips it. NOT pushed.
  - [ ] **Tab switching is slow (B27, B29): measured and tested 2026-10-09, nothing built.**
        Baseline, live site, signed in as a member, desktop Chrome on broadband, warm, 3 runs per tab, one
        request per tap: Home 182-215 ms, Groups 225-298, Prayer 282-383, Events 447-851. First byte
        133-214 ms on every tab (Netlify + the local login check); the rest is database reads. Not measured:
        a phone on LTE, the Admin tab, a cold start. Headers: `private, no-store`; Netlify reports a miss.
        Experiment (throwaway branch, production build, `staleTimes.dynamic = 300`): a kept tab re-opens with
        0 requests; `router.refresh()` on one tab WIPES every kept tab (the next taps fetched again). So
        "keep long + refresh on arrival" cannot work as two pieces.
        Decided by the user: one database view/function per page; no network login check for reads (keep it
        for writes); stale-while-revalidate, not a fixed stale window; pull-to-refresh is backlog B35.
  - [ ] **Faster tabs** (branch `fast-tabs`, on top of `iphone-fixes`; held, not pushed).
        Done: Events (`upcoming_events()`), Groups (`my_groups()`), Prayer (refreshes its newest twenty, keeps
        older ones); each list refreshes itself (`useFresh`, `useOnArrival`); reads use the token locally.
        Both SQL sections are run. `npm run test:rls` 59/59, `npm test` 101/101.
        MEASURED, local production build, same database, 8 taps per tab, median, `main` -> this branch:
        Events 479 -> 132 ms, Groups 128 -> 97 ms, Prayer 142 -> 124 ms. One background refresh per arrival
        (Events 118 ms, Groups 163 ms, Prayer 273 ms), after the screen is already showing.
        NOT measured: the live site (not deployed), a phone, Admin. NOT seen as a picture.
        Step 4: pages kept ten minutes (`staleTimes`), sign-out a full page load. OBSERVED on a local
        production build in the user's Chrome: first visit to Events/Groups/Prayer = 1 page request each;
        every return = 0 page requests and 1 refresh call, content on screen. NOT exercised: sign-out with
        two accounts on one phone (it would end the user's session). Known cost: Settings, and Admin's
        events, reminders and group names, can be up to ten minutes old when returned to. Admin's two waiting
        lists refresh on every arrival (NOT seen: the Chrome account is not an admin). Placeholders kept a
        day (`staleTimes.static`; NOT verified: prefetching does not run in a background tab). B37 added.
        Step 5, Admin: independent reads run together; `managed_events()` replaces four reads for the admin
        list and the editor. 101 unit tests. **WAITS ON THE USER: section 3c of `features/events/schema.sql`.**
        Until then the Admin tab lists no events on this branch and one security case fails (60 expected).
        NOT measured (needs an admin account in the browser), NOT seen.
        Fixed after the user saw it: an answered join request flashing on every return to Admin (lists now
        start from what they last showed, not from the kept page). NOT seen fixed: Chrome was not connected.
        Chat still starts from its kept copy, so recent messages appear a moment after returning to a chat.
        Notifications moved to Settings as an on/off switch (asked 2026-10-09); `npm run test:rls` 61/61.
        NOT seen on screen or on a phone. Note: nothing on the Groups page now invites people to turn them on.
        Still to do: the chat page's reads. Backlog B36, B37 added.

- [ ] **The pastor's review (2026-10-12)** (branch `church-wide`, on top of `fast-tabs`; nothing committed or pushed).
      Decided with the user: the email link signs the app in by hand-off (the link confirms, the app that
      asked picks it up); a person may be in several groups; a group's member count is typed by an admin;
      prayer requests and events once saved for one group show to everyone.
  - [x] 1 Switches (`src/lib/switches.ts`): chat, joining, the old Groups page, and every notification but
        prayer reminders are off. Observed signed out: the three off routes answer 404.
  - [x] 2 Church-wide: events and prayer lose the group (code + SQL written); prayer reminders go to all
        approved members.
  - [x] 3 Sign-up approval: new feature `approval` (permission `app.use`, the door on ten tables, waiting
        screen, admin section, two notifications).
        `npm run build` clean, `npm test` 101/101. `tests/rls.test.ts` rewritten to 67 cases, **NOT run**.
        SQL run by the user; `npm run test:rls` 67/67 (run by the user, 2026-10-12). NOT seen: any signed-in screen.
        The preview now starts on a free port (`autoPort`): port 3000 on this PC is another project.
  - [x] 4 Email link with hand-off to the installed app (the typed code is gone). `npm test` 104/104, build
        clean; one security case added (68 expected). Seen on the user's dev server (port 3001), signed out:
        `/login`, `/login/confirm` asking and refusing, the two routes answering 400 to bad input.
        **WAITS ON THE USER: `auth/schema.sql`, the redirect URLs, both email templates** (auth README, Setup).
        NOT exercised: a real email, the hand-off end to end, an iPhone, Android's same-browser path.
  - [x] 5 Admin groups: rows (name, typed member count, chevron) → a sheet (name, number, people with
        Remove, a list to add from by name and email, remove the group); "Chưa vào nhóm" last.
        `npm run build` clean, `npm test` 104/104; 72 security cases written.
        **WAITS ON THE USER: `groups/schema.sql` section 2c, then 2b again.**
        NOT seen: the section or the sheets (no admin is signed in where Claude can look).
  - [x] 5b The admin Groups section reads itself again on every arrival (asked by the user).
  - [x] 6 New Groups page: new feature `group-info`. A row per group; a sheet with the number of members,
        When / Where / Notes; Edit for someone in the group. The Groups tab and Home tile are back.
        `npm run build` clean, `npm test` 104/104; 76 security cases written.
        **WAITS ON THE USER: the SQL in the next steps.** NOT seen: the page or the sheet.
  - [x] 6b Group details: a pencil per line; admins change any group's details and its number of members
        (asked by the user after seeing the plan for one Edit button).
  - [x] 7 Group photos (built with the user away, on Claude's recommendations; they review on return):
        private bucket, shrunk on the phone, six at a time, a strip that fades at the right, a full-screen
        view with arrows, add (picture + optional date and words) and remove for the group's people and admins.
        `npm run build` clean, `npm test` 104/104; 85 security cases written.
        Seen on `/ui` at phone width: the strip and the large view. NOT seen: anything signed in; a real upload.
        **WAITS ON THE USER: the SQL in the next steps.** Rough edges written down as B40.
  - [x] 8 Row pictures: admins set, replace and remove an event's picture (the event editor) and a
        group's picture (the group's sheet on the Admin tab); the schedule and the Groups tab draw them.
        Public buckets, a new file name per picture. "Group admins" was read as whoever holds
        `groups.manage` (there is no per-group admin role). `npm run build` clean, `npm test` 104/104;
        91 security cases written. NOT seen signed in; no real upload tried.
  - [x] 9 Group rules, final (the user's word): only admins (`groups.manage`) edit when / where / notes and
        remove pictures; a group's own people add pictures. Read as: "group admins" = `groups.manage`,
        "any member" = anyone in that group. 91 security cases written, NOT run.
  Known and written down: no Decline for a sign-up (B38); off features still accept direct writes (B39).

- [x] **Elderly-friendly setup (2026-10-14, branch `church-wide`, nothing committed).** Decided with the user:
      passwords replace sign-in links (links only to confirm an account and reset a password); the install
      guide for every browser visit, only a computer may skip; name after the email confirmation; email
      confirmation kept. Built: `install` feature, `/login` = guide → language → have an account? → sign in /
      create / forgot → check your email; `/settings/password`; `push/NotificationStep` (device cookie) between
      name and waiting; "Step n / 7" on every setup screen. `npm test` 113/113, build clean.
      Seen in the preview (phone width, signed out): the Android guide, language, account question, sign-in
      form, a wrong-password banner, forgot (email kept), the waiting screen surviving a reload in English.
      **WAITS ON THE USER: Supabase → Providers → Email (confirm on, min length 6), the "Confirm signup" and
      "Reset Password" templates (auth README, Setup 4-6).** NOT exercised: a real email, the hand-off end to
      end, "Save password?" on a real iPhone/Android, the notification step, the name/waiting steps' new bar,
      the iPhone install steps (iOS 26 Safari menus quoted from memory).
      Debt: on setup screens (no blue top bar) the white iPhone clock sits on white (`black-translucent`).
      First iPhone test (2026-10-14, production build on Tailscale Funnel, port 8443): the sign-up email
      pointed at `localhost:3000` (Supabase's Site URL fallback: the Funnel address was not in Redirect URLs).
      Decided with the user: sign-up link needs no tap (Safari shows "Email confirmed, go back to the app";
      the app signs in with the password it holds, every 15 s and on return); reset keeps one tap. Built,
      `npm test` 113/113, build clean, `/login/confirmed` seen in both states. **WAITS ON THE USER: Redirect
      URL `…ts.net:8443/login/**`, and the new "Confirm signup" template (`{{ .ConfirmationURL }}`).**
      Second iPhone test (2026-10-14): (1) wrong password → "Forgot password?" offered to save it. Tried:
      submit only once accepted; the third test then showed no offer after a correct new password either
      (Safari ignores a submit from code). Undone on the user's word: one tap, and the wrong-password offer
      is accepted (Key Decisions). (2) the reset link opened the web app instead of its page: the proxy sent a signed-in Safari Home;
      `/login/confirm` and `/login/confirmed` are now exempt. Build clean, 113/113. NOT seen on the iPhone.

  - [x] Tab bar too high on a cold start of the installed iPhone app (user's screenshot, 2026-10-14): iOS lays out a
        short page as if the see-through status bar took space; `html` min-height now 100% + top inset.
        NOT verified on an iPhone (needs a deploy); the earlier iPhone fix was a different cause (a too-wide element).

- [x] **Signed-out redesign (2026-10-14, on the user's walk-through).** Sign-in first (one screen, no bar,
      Vietnamese with "English" top right); "no account yet → Create an account" from `account_exists()`;
      sign-up = name + email + password ("Step 2 / 6", Next off until filled) → email (3) → notifications (4,
      new members only) → waiting (5); "done" (6) never shown. Seen in the preview (production build, text
      only: the window was hidden). Build clean, `npm test` 113/113. **WAITS ON THE USER: `auth/schema.sql`
      section 3 and `profiles/schema.sql` section 2, then `npm run test:rls`** (one case added).
      Next round (same day): no "Save password?" after a correct sign-in → sign-in and new password now
      move to Home inside the page (Safari offered on form removal, not after a reload). Reset page says
      "reset", language top right on every signed-out screen (`SignedOutFrame`). Sign-in screen calmed
      (messaging-app pattern, `ui/PasswordInput` with an eye). Measured in the preview at 375 px; screenshots
      failed (window hidden). NOT seen on the iPhone: the save offer, autofill.
      Still no save offer → sign-in and new password are now real form posts (routes, 303 back or Home).
      Seen in the preview: wrong password → `/login?problem=wrongPassword`, reason shown, email kept.
      Sign-up redone in the same calm shape (measured at 375 px). NOT seen on the iPhone.
      Note: an unknown email still said "wrong password" in the preview: `account_exists` is not in the
      database yet (auth/schema.sql section 3).
      iPhone report after that (2026-10-14): no save offer in six sign-ins; sign-up link page spun, then
      Next's "couldn't load"; name asked again; notifications skipped. Evidence (database, read-only):
      `account_exists` missing and `create_profile` not replaced (name "Loc win" was sent at sign-up, profile
      named 2.5 min later from NameStep) = today's SQL not run; the link DID confirm (9 s after sign-up).
      Notifications skipped: this phone answered the question in an earlier test (device cookie).
      Temporary instrumentation (`src/app/global-error.tsx`, `src/app/api/debug-log/`) was used, then removed. Waiting on the user: the SQL, one more sign-up (error text), and the
      save-offer checks (AutoFill setting, Passwords app, the same sign-in in Safari).
      Save-offer A/B test (2026-10-14): nothing was ever committed, so no commit to go back to. The old
      sign-in (page code signs in, banner, "Forgot password?" swaps screens) was rebuilt in a throwaway copy
      (scratchpad `old-signin`, webpack build), served on port 3006 and Funnel port 10000. **TEMPORARY: remove
      the `old-signin` entry in `.claude/launch.json` and run `tailscale funnel --https=10000 off` after.**
      RESULT: in the installed app neither version offers to save or fills in; in Safari it offers; signing in
      in Safari then installing opens the app signed in. Built "Safari first" (install guide after sign-in,
      sign-up link signs in where it opens) and banner errors with links. Test copy, its launch entry and
      port 10000 removed; 8443 serves the current app again. Seen: sign-in at 375 px with the "no account"
      banner (picture), its link opens sign-up. NOT seen on the iPhone: the whole Safari-first path.
      The temporary error catcher was removed before the commit (2026-10-14).
      Hard-coded text review (the user's translation pass is next): two fixed, the rest listed in the i18n README.
      iPhone: stuck on the install guide in Safari (signed in, no way out) → "Sign out" under the guide. NOT seen.
      iPhone: `/login/confirmed` showed only the logo and "English" (no styling). Reproduced over the Funnel: the
      page asked for 3 files (its CSS, 2 scripts) that answered 404. Cause: the server on 3005 was serving one
      build while the files on disk were from a later one (server started 1:29:12, build written 1:29:52).
      Not a code bug. Fixed by one clean build, then a restart; all files of /login, /login/confirmed and
      /login/confirm now load (0 missing). RULE for the test server: never build while it runs; build, then
      start, then fetch every file a page asks for over the Funnel before handing over.

- [x] **Merged and pushed to production (2026-10-14, on the user's word "I approve of everything").** One commit
      `f04e1be` on `church-wide` (the pastor's review + the sign-in and setup work; the commit hook ran the build
      and the tests), `main` fast-forwarded through `iphone-fixes`, `fast-tabs`, `church-wide`, pushed; Netlify
      deploys from it. Before the push, a read-only check found every table, function, bucket and column the
      code uses in the database. NOT run: `npm run test:rls` against today's SQL.

- [x] **Sheets and admin on the tabs** (branch `sheets-and-admin`, off `main` at `7ad2229`; built 2026-10-14, committed `de75e01`).
      Built all four steps. Checked in `/ui` at phone width (the user's dev server on port 3000): the card with
      the dot, initials, empty circles and "+5"; the bilingual box; the red line; the sheet capped at 487 of 812 px
      (60%), opening again after each close (a bug found and fixed: vaul never reported the X's slide-out), a
      simulated swipe down closing it, gone ~0.55 s after closing. `npm test` 116/116, build clean.
      SQL `docs/sql-to-run-2026-10-14.sql` is run: `npm run test:rls` 94/94 (2026-10-15). Section 3f (events
      outlive their maker) is not covered by a test.
      Then (same day): Admin tile on Home; "3 🙏" on my own requests; pray reward; picture viewer redone. Seen in
      `/ui` at phone width (measured to the pixel: X flush with the picture's right edge, arrows with its edges).
      Slow launch: measured server 3.3 s cold / 0.4 s warm; 30 s on the phone not explained by the server. Until section 7 is run the Groups tab is empty.
      NOT seen signed in: any admin screen (Events +, event editor, group cards for real, group editor, prayer bell,
      reminders screen, Admin people list, person screen). Hidden preview windows only hydrate after a screenshot.
      Decided with the user 2026-10-14: swipe-to-close with the `vaul` library; big editors (event, group with
      members, a user) are their own screens, sheets only for short things; Admin keeps the waiting lists on top,
      then a list of users (details, permissions, groups, remove); the group card's green dot is always on.
      Defaults stated: members with the app show initials, the rest empty circles up to the typed count, "+N"
      after 8. Order: (1) Sheet: smooth exit (internal open state + vaul `onAnimationEnd`, a context close for
      actions inside a sheet), swipe, max 60% height with fixed title and X; (2) the clean design on every sheet
      and editor, bilingual box (VI top, divider, EN bottom, placeholders); (3) Groups tab (cards, editing,
      members, unassigned last, +, picture, weekday+time picker: DB change), Events tab (+, tap to edit),
      Prayer tab (bell for reminders); (4) Admin = user list. Netlify badge: injected by Netlify
      (`/.netlify/scripts/hud?variant=public`), a dashboard setting, not our code.

- [x] **B28 slow iPhone launch** (2026-10-14, committed with the review fixes 2026-10-15). Before, on the iPhone after a restart: tappable
      22.54 s, 1/10 code files cached (21 s downloading them). Built: `public/sw.js` `CACHE` part (cache-first
      `/_next/static/*` marked `immutable`, `static-v1`, newest 150, other caches deleted on activate, falls back to
      the network on a storage error). After: 10/10 from the saved copy, tappable 6.85 s, no reinstall needed.
      iOS launch pictures tried and removed (never showed, even re-added). Timing box removed. Funnel 8443
      proxies port **3000**; the production build runs there (`prod` in `.claude/launch.json` moved from 3005).

- [x] **Review before the production push (2026-10-15).** Every branch was already in local `main`; nothing
      to merge (the `agent-a0-a1` worktree holds uncommitted `services/ai` work, not deployed by Netlify, left
      alone). Strict review of `de75e01` + B28: 3 must-fix (stale security test, admin editors showing a kept
      copy, a silent failure saving a picture) and 7 cleanups, all fixed on the user's word. `npm test` 116/116,
      `npm run test:rls` 94/94, build clean. Committed `744998f` on `sheets-and-admin`, `main` fast-forwarded and **pushed on the user's word
      (2026-10-15)**; Netlify deploys from it.
      NOT seen signed in: any admin screen (the preview browser is signed out). Backlog B41 added.

- [x] **Group name did not save (2026-10-17, found by the user).** Cause: two forms and two Saves on the group
      editor; the blue one saved only when / where / notes. Fixed on the user's word (option A): one form, one
      Save (`GroupInfoForm`), `GroupDetailsForm` deleted. Seen on a local production build with a throwaway admin
      (deleted after). No other screen has two forms. Committed, NOT pushed.

- [x] **Group pictures up to 1 MB (2026-10-17, the user: 300 KB looked ugly).** `shrinkUnder` at 2560 px, best
      quality under 1,000,000 bytes; bucket limit unchanged (no SQL). NOT tried with a real phone photo.
      Committed, NOT pushed.

## ➡️ Next 3 Micro-Steps
1. Pushed 2026-10-15 (`744998f`). On the iPhone: open the app twice (the new `sw.js` installs on the first).
2. User: on the live site as an admin, from an iPhone: Events + and an editor, a group's editor (people,
   picture), Prayer bell, Admin → a person (a role switch, a group switch, back and in again).
3. User: Supabase → URL Configuration: Site URL `https://vietcorners.netlify.app`, Redirect URLs include
   `https://vietcorners.netlify.app/login/**`; then one sign-up and one password reset from an iPhone.

Older, still open: 1. User: Redirect URL `https://desktop-2bln504.tail714ada.ts.net:8443/login/**` (and check the Site URL is
   the Netlify address), the new "Confirm signup" template (auth README, Setup 3 and 5).
2. User + Claude: one fresh account end to end on an iPhone (install → language → create → email → name →
   notifications → waiting) and one password reset; check "Save password?" appears on both phones.

Earlier, still open: SQL, in order (each safe to run again): `groups/schema.sql` 2c, 2d, then 2b · `events/schema.sql` 3e,
   then 3b and 3c · `group-info/schema.sql` (all) · the `group_info` and `group_photos` lines of
   `approval/schema.sql` section 3 · `auth/schema.sql`. Then `npm run test:rls` (91 expected).
   All of it is in one file: `docs/sql-to-run-2026-10-12.sql` (safe to run again if an earlier copy was run).
   Still open from slice 4: the redirect URLs, both email templates, one real sign-in on an iPhone.
Also open: review signed in: Admin → Groups (picture, people), an event's editor (picture), the Groups tab
   (pencils, photos from a phone), the schedule (pictures).
