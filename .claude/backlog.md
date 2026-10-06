# Backlog

Deferred work. Not scheduled until moved into `active_context.md`.
Each item: **Why** → **What** → **Trade-offs** → **Done when**. Highest value first.

---

## B1. API-only data access (no browser → database connections)
**Why:** Today the browser talks to Supabase directly for some operations, and RLS is the only thing protecting that path. Routing everything through our API makes authorization live in one place (server code), makes a future database swap safe (no DB-specific security rules exposed to browsers), and enables rate limiting and audit logs.

**Current direct browser → Supabase calls** (all isolated in `api.ts` files, so components and hooks won't change):
| File | Function | Supabase service |
|---|---|---|
| `features/auth/api.ts` | `sendLoginCode`, `verifyLoginCode`, `signOut` | Auth |
| `features/chat/api.ts` | `getLatestMessages` | Database (REST) |
| `features/chat/api.ts` | `joinGroup`, `savePushSubscription` | Database (REST) |
| `features/chat/api.ts` | `subscribeToNewMessages` | Realtime (WebSocket) |

**What**
1. Add thin routes + `server/*` functions: `GET /api/chat/groups/[id]/messages`, `POST /api/chat/groups/[id]/members`, `PUT /api/chat/push-subscriptions`, `POST /api/auth/code`, `POST /api/auth/verify`, `POST /api/auth/signout` (cookies set server-side with the `@supabase/ssr` server client).
2. Change each `api.ts` function body from a Supabase call to `fetch("/api/...")`. Signatures stay the same.
3. Add `server/permissions.ts` per feature (e.g. `assertGroupMember(userId, groupId)`) and call it from every route.
4. **Decide the Realtime replacement** (the hard part; serverless can't hold WebSockets):
   - (a) Supabase Realtime **Broadcast** on private channels with a server-issued token: still a WebSocket, but no table access.
   - (b) A hosted pub/sub (Ably, Pusher): another vendor.
   - (c) Polling every few seconds: simplest, but more latency and cost.
   - (d) Server-Sent Events: doesn't fit Netlify's ~10 s function timeout.
5. `schema.sql`: revoke `anon`/`authenticated` table grants. Keep RLS as defense in depth.
6. Remove `src/lib/supabase/client.ts` usage from features. The browser no longer needs a database key for data.

**Trade-offs:** + one authorization layer, DB-swap safety, rate limiting and audit possible. − about 6 more routes, an extra network hop per call, more serverless invocations, and a Realtime redesign.

**Done when:** a search for `lib/supabase/client` in `src/features` returns only Realtime (or nothing). Anon-key REST probes return permission errors for every table. All chat QA passes on iPhone + Android.

---

## B2. Automated RLS / authorization tests — DONE 2026-09-29 (M8)
**Why:** RLS failures are silent (blocked reads return `[]`). **Built:** `tests/rls.test.ts`, run with `npm run test:rls`. Creates two throwaway users, has one join a group and post, and asserts the other can neither read nor post; also covers `group_members`, `push_subscriptions`, the server-only `document_chunks`, and that `auth.users` is unreachable. **Still to do:** add a case for every new table (prayer requests, events, account settings).

## B3. Rate limit sending messages
**Why:** a signed-in user can spam a group and trigger unlimited pushes. **What:** per-user limit in `POST /api/chat/messages` (e.g. 20/min, counted in Postgres). **Done when:** the 21st message in a minute returns 429.

## B4. Notification control (mute + grouping; a fixed one-minute pause per topic exists since 2026-10-06)
**Why:** every message pushes every member, and elderly users may disable notifications entirely. **What:** a per-group mute flag. `sw.js` uses `tag: groupId` so repeated pushes replace each other. **Done when:** a muted member gets no push, and 5 messages show as 1 notification.

## B5. Joining a group needs an admin's approval — DONE 2026-10-06
**Why:** anyone can join any group today, and joining opens its chat, events and prayer requests, so a group is not private. **What:** tapping Join creates a *pending request*; it appears on the Admin tab; only an admin approves it, and only then is the user a member. Planned shape: a separate `group_join_requests` table (so `group_members` keeps meaning "is a member" and no chat, events or prayer policy changes), members lose direct insert on `group_members`, and an `approve_join_request` function for holders of `groups.manage`. **Trade-offs:** every join waits on a person; without a notification to admins, requests sit unseen. **Done when:** a user who tapped Join sees "Pending", reads nothing of the group until approved, and the RLS tests prove a member cannot approve themselves.

## B6. Load older messages
**Why:** only the newest 50 load. **What:** a "Load older" button → `getMessagesBefore(groupId, oldestId)`.

## B7. Shared-device push subscription
**Why:** the endpoint row belongs to the first user who saved it, so a second user's upsert fails RLS. **What:** reassign ownership server-side on save.

## B8. Performance: avoid duplicate auth network calls
**Why:** pages call `getUser()` (a network round-trip) after the proxy already validated the session. **What:** use `getClaims()` in `server/queries.ts`, and/or migrate the Supabase project to asymmetric JWT signing keys so checks run locally.

## B9. Launch readiness
- Custom SMTP on the church domain (Resend/Brevo) instead of Gmail.
- Supabase paid plan or keep-alive (the free plan pauses after ~7 idle days).
- Confirm Netlify plan limits (function timeout, bandwidth).
- Real `VAPID_SUBJECT` contact owned by the church.

## B11. Real-time voice with LiveKit Agents (assistant M9)
**Why:** conversational voice (streaming, interruptions, sub-second turns) instead of push-to-talk. **What:** a Python LiveKit agent that calls `rag.answer.answer_question` as a tool, with our API minting room tokens. **Trade-offs:** + natural conversation, built-in monitoring. − a long-running agent worker, a vendor, and Vietnamese streaming STT/TTS plugin costs. **Done when:** a latency table vs. M7 push-to-talk measurements exists and the iPhone conversation works.

## B12. Better retrieval: reranker + hybrid search
**Why:** the top-k from one embedding model can miss exact terms (names, numbers). **What:** add bge-m3 sparse (keyword-like) scores and/or a cross-encoder reranker (e.g. bge-reranker-v2-m3) on the top 20. **Done when:** Recall@5 / MRR improve in `evaluation/results.md` at an acceptable latency.

## B13. Answer-quality evaluation
**Why:** retrieval metrics don't measure whether the final answer is correct and properly cited. **What:** a graded set (question → expected facts), with automatic checks for citations and "not found" behavior, run in CI. **Done when:** a score per model/prompt version is tracked.

## B14. Retrieval experiments (M3 stretch, ordered by expected payoff)
**Why:** the first bake-off gave Recall@5 0.54 at best, and most of the loss is in Vietnamese questions against an
English-only corpus. Each experiment below is measured with the same question set, so results are comparable.
Chunk vectors are cached per model in `evaluation/.cache`; changing chunk settings invalidates the cache
(~7 min per model to rebuild on CPU).

| # | Experiment | Why it should help | Cost |
|---|---|---|---|
| 1 | **Add the Vietnamese translations of the PDFs** | Removes the cross-language step entirely for covered documents; vi Recall is the weakest number we have | Ingest + relabel gold pages for the vi documents |
| 2 | **Strip repeated page headers/footers** ("T-Net International www.tnetwork.com") | Boilerplate dilutes every chunk vector | 1 function + re-embed |
| 3 | **Sentence-boundary chunking** instead of fixed word windows | Chunks stop mid-sentence today, splitting the idea the question asks about | 1 function + re-embed |
| 4 | **Chunk size sweep** (150 / 300 / 500 words) | 300 was a guess; the best size is corpus-specific | 3 configs x 7 min per model |
| 5 | **Verify gold labels from retrieved chunks** (`explain.py --review`) | Some "misses" may be mislabelled ground truth, which caps every score | Manual review of 33 questions |
| 6 | **Reranker on the top 20** (bge-reranker-v2-m3) | Cross-encoders usually add a lot of MRR; cost is a second model | See B12 |

**Done when:** `evaluation/results.md` shows the winning configuration with numbers per language, and the
choice is recorded in architecture.md Key Decisions.

## B16. Multi-hop and structure-aware retrieval
**Why:** questions that need two separate places in the book fail today ("Ông Watson với ông Garrison nói gì khác
nhau?" needs p.29 and p.63). One question vector can only point at one region of meaning, so a single similarity
search can never assemble two distant ideas. The user's instinct ("a table of contents or a mind map") is the
standard answer to this.

**What (cheapest first):**
1. **Section-aware chunks.** Carry the heading path (Part / Session / Chapter) into each chunk's text and metadata.
   Retrieval then matches on topic structure, not just wording, and answers can cite "Session 8".
2. **Parent-document retrieval.** Search small chunks, but send the LLM the surrounding section. Precision of a
   small chunk, context of a big one.
3. **Query decomposition.** Ask the LLM to split a multi-hop question into sub-questions, retrieve for each, and
   merge the evidence. Costs one extra LLM call per question.
4. **A concept index (the "mind map").** Extract entities and concepts (Watson, Garrison, Person of Peace, CPM) with
   the pages they appear on, and use it to expand retrieval to the neighbourhood of a named concept.
5. **GraphRAG-style summaries** if 1-4 are not enough: build a graph of concepts and communities. Heaviest option.

**Trade-offs:** each step adds an ingestion step or an LLM call. Measure each against `questions.jsonl`; question 25
is the canonical multi-hop failure and question 6 (six steps) the canonical "spread across pages" failure.
**Done when:** the multi-hop questions retrieve both required pages, with no regression in the rest of the set.

## B15. Per-language retrieval (only if English use grows)
**Why:** e5-base scores en 0.85 vs bge-m3's 0.73, so routing English questions to a different model would help them.
**What:** detect the question language, keep one vector set per model, route. **Trade-offs:** two models resident on a
4 GB-RAM VM, two vector columns of different dimensions, and language detection fails on the code-switched
Vietnamese-plus-English wording church members actually use. **Done when:** English questions measurably improve
without hurting Vietnamese ones.

## B10. Correct 404 status for unknown groups (low)
**Why:** `loading.tsx` streaming makes `notFound()` return HTTP 200. **What:** validate the group before streaming (e.g. a route-level check). Only matters for SEO.

## B17. Finish the `strings.ts` migration (chat + assistant) — DONE 2026-09-29 (i18n)
**Why:** i18n should swap one file per feature, not edit every component. `auth` is migrated as the worked example; `chat` (~29 strings) and `assistant` (~43) still have text inline. **What:** move their user-facing text into `features/<name>/strings.ts`, unchanged. **Trade-offs:** a large, mechanical diff; best done *as part of* the i18n step so the strings are touched once. **Done when:** no user-facing literal is left in a `components/` file of either feature.

## B18. Shared UI kit (with the UI/UX revamp)
**Why:** prayer requests, events and account settings will each need buttons, cards, fields and empty states. Inventing them per feature gives four different looks; building them now guesses at a design that hasn't been made. **What:** during the revamp, lift the repeated controls into `src/components/ui/`, keep them presentational, and let features import them. **Trade-offs:** shared UI is the one exception to feature isolation, so it must stay logic-free. **Done when:** every feature uses the same button, field and card, and none defines its own.

## B19. Post-MVP features (planned, not scheduled; events and prayer requests are built)
Each follows `docs/adding-a-feature.md` and gets its own folder, `schema.sql` with RLS, README, and a case in `tests/rls.test.ts`.
| Feature | First questions to answer |
|---|---|
| Answered prayers, looked back on ("Wrapped") | `prayer_requests.answered_at` already keeps them. Whose answered requests does a member see: their own, their group's? Do anonymous ones appear? When does it open? |
| Account settings | Which fields are editable (display name, phone, email)? Changing an email means re-verifying it in Supabase. Where do notification preferences live (B4 overlaps)? |
| UI/UX revamp | Bigger type and targets for elderly users; B18 is the vehicle. |

## B20. Extract a shared `groups` feature — DONE 2026-10-05
**Why:** `groups` and `group_members` live in `chat`, but `events` already reads them for group-scoped visibility and prayer requests will too. Today removing chat would break both. **What:** move the two tables and their queries into `src/features/groups/`, leave chat owning only messages and push, and update the three READMEs plus the RLS policies that reference them. **Trade-offs:** touches working code and policies for a structural gain, so it is worth doing once prayer requests confirm the pattern — not before. **Done when:** no feature outside `groups/` owns membership, and each feature's README lists `groups` as a dependency instead of `chat`.

## B21. Cancelled weeks are matched by calendar date, in the server's timezone — DONE 2026-10-06 (`src/lib/churchTime.ts`, used by events and by prayer reminders)
**Why:** `event_cancellations.occurrence_date` is a `date`, and the expansion computes the occurrence's date with the server's clock (UTC on Netlify). For an evening event in a timezone behind UTC, the server's date is the next day, so an admin cancelling "Sunday" could fail to line up with the row members see. Harmless while the church and the server agree, wrong as soon as they don't. **What:** either store the cancelled occurrence as a `timestamptz` (exact instant, no date arithmetic), or store the church's timezone once and do all date maths in it. **Trade-offs:** the timestamp version is simplest but needs the admin page to send the exact occurrence; the timezone version is more work but also fixes day grouping for anyone travelling. **Done when:** cancelling the 19:00 Sunday occurrence lines up for a church at UTC-7, proven by a test with a fixed clock.

**B21 grew on 2026-10-05:** the same missing "church timezone" also decides when `prayer_reminders.send_at` fires, and it is why a time rendered on the server (UTC on Netlify) can differ from the one the phone renders a moment later. Formatting every date with one explicit `timeZone` fixes all three: the server and the phone then print the same text.

## B22. The prayer pause is enforced on the device only
**Why:** decided 2026-10-05: the one-hour pause is stored locally and nothing about who prayed is kept in the database. So clearing storage, using a second device, or calling `pray_for_request` directly adds as many prayers as the caller likes, and "N people prayed for you" can be one person. **What:** if it is ever abused, a `prayer_request_prayers(request_id, user_id, prayed_at)` table with no member grant, written by the function, which refuses a second prayer inside the hour and lets the count mean distinct people. **Trade-offs:** stores who prayed for whom (private data, even if members never see it) and replaces a counter with rows. **Done when:** two calls inside an hour from the same account raise the count once, proven in `tests/rls.test.ts`.

**B21 timezone decided 2026-10-06:** `America/New_York` (Winston-Salem, NC). What remains is the code: format every date with that `timeZone`, and compute cancelled weeks in it.

## B24. Prayer moderation (on hold until the pastor decides)
**Why:** put on hold 2026-10-06. Groups are meant to be private, so nobody outside a group, admins included, should read its prayer requests; the earlier decision that admins see every group's requests is withdrawn until the user has spoken with their pastor. **What:** once decided, the small version is already designed: the `prayer_feed` view also returns rows to someone holding `prayer.moderate`, a `hide_prayer_request` function sets `deleted_at`, and the options panel shows "Remove" on requests that are not yours. No new screen. Who holds the permission is the open question: nobody, the group's own leader (needs the group-scoped roles sketched in the `permissions` README), or church-wide admins. **Trade-offs:** with no moderation, a harmful request can only be removed by its author or by a developer in the database. Moderation by a group's own leader keeps the group private but needs roles inside a group, which is not built. **Done when:** the pastor's answer is recorded in `src/features/admin/README.md` and, if moderation is wanted, the RLS tests prove that exactly the chosen people can hide a request and nobody else can read it.

**Related, and worth raising in the same conversation (B5):** groups are not private today. Any signed-in user can see every group and join any of them, and joining is what opens its chat, events and prayer requests. Privacy inside a group is only as strong as who may join it.
