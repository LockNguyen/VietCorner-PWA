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
- [ ] admin slice 3: reminders (editors for event and prayer reminders) + the scheduler that sends them.

## ⏭️ Known, deferred, not forgotten (see `.claude/backlog.md`)
- B17 strings migration for chat + assistant (do it inside the i18n step).
- B18 shared UI kit (do it inside the UI/UX revamp).
- B19 post-MVP features still open: account settings, UI revamp.
- B21 done for events; prayer reminder times still need church time · B22 prayer pause is device-only.
- B24 prayer moderation on hold (pastor) · B5 groups are joinable by anyone, so not yet private.
- B1 API-only data access · B3 rate limiting · B4 notification control · B6 load older messages · B9 launch readiness.
- B13 answer-quality eval · B14 retrieval experiments (Vietnamese PDFs first) · B16 multi-hop retrieval.
- M9 (LiveKit real-time voice, B11) stays optional.
- Oracle VM still pending a credit card; the AI service runs on the PC behind Tailscale Funnel until then.
- The follow-up rewrite can narrow a question that already stood alone: measure on the eval set before tuning.

## ➡️ Next 3 Micro-Steps
1. Deploy and test what is built: push `main`, then a phone session with two accounts (chat push after the
   move, the one-minute pause, "prayed for you", an event cancellation and its undo, the Admin tab).
2. Admin slice 3: reminders, on branch `admin-reminders`. Open questions first: what a prayer reminder says,
   who gets an event reminder, and how often the scheduler runs.
3. User, with the pastor: who (if anyone) outside a group may read or hide its prayer requests (B24), and
   whether joining a group should need an invitation (B5).
