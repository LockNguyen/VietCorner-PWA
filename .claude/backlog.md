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

## B2. Automated RLS / authorization tests
**Why:** RLS failures are silent (blocked reads return `[]`). **What:** a script that, as anon, as a non-member, and as a member, tries select/insert on each table and asserts the expected result. **Done when:** `npm run test:rls` passes and fails if a policy is removed.

## B3. Rate limit sending messages
**Why:** a signed-in user can spam a group and trigger unlimited pushes. **What:** per-user limit in `POST /api/chat/messages` (e.g. 20/min, counted in Postgres). **Done when:** the 21st message in a minute returns 429.

## B4. Notification control (mute + grouping)
**Why:** every message pushes every member, and elderly users may disable notifications entirely. **What:** a per-group mute flag. `sw.js` uses `tag: groupId` so repeated pushes replace each other. **Done when:** a muted member gets no push, and 5 messages show as 1 notification.

## B5. Private groups / invite-only joining
**Why:** anyone can join any group (MVP choice). **What:** admin role + invites. Tighten the `group_members` insert policy.

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

## B10. Correct 404 status for unknown groups (low)
**Why:** `loading.tsx` streaming makes `notFound()` return HTTP 200. **What:** validate the group before streaming (e.g. a route-level check). Only matters for SEO.
