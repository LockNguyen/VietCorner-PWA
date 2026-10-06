# chat

Live messages inside a group, announced to the other members by push. Groups and membership belong to the
`groups` feature and delivery to the `push` feature; chat owns the messages and decides who is told.

System docs: `.claude/architecture.md`. Shape and conventions: `docs/adding-a-feature.md`.

## Setup
1. Run `features/groups/schema.sql` and `features/push/schema.sql` first, then this `schema.sql` in
   Supabase → SQL Editor (table, grants, RLS, the Realtime publication).
2. `.env.local`: `SUPABASE_SERVICE_ROLE_KEY`, plus what `push` needs.

## Files
| Layer | File | Job |
|---|---|---|
| Data | `schema.sql` | `messages`, grants, RLS policies, Realtime publication, and the DROP statement |
| Types | `types.ts` | `Message` |
| Browser API | `api.ts` | `getLatestMessages`, `sendMessage` (POST `/api/chat/messages`), `subscribeToNewMessages` |
| State | `hooks/useChatMessages.ts` | The whole sync strategy: first load, Realtime inserts, refetch on (re)connect and on visible, own message merged, dedupe by id |
| UI | `components/ChatRoom.tsx` | `useChatMessages` → `MessageList` + `MessageForm` |
| UI | `components/MessageList.tsx` | Bubbles (mine blue right, others gray left) + auto-scroll |
| UI | `components/MessageForm.tsx` | Draft + error; restores the text when sending fails |
| Server reads | `server/queries.ts` | `getChatRoom` → `{ messages, userId }` |
| Server logic | `server/sendMessage.ts` | Inserts as the **user** (RLS checks membership), then calls `notifyGroup` |
| Server logic | `server/notifyGroup.ts` | **Admin** client: the group's other members and its name → `sendPush` (`// PUSH`) |
| Routes | `src/app/api/chat/messages/route.ts` | Verify (401) → validate (400) → `sendMessage` (403 on RLS failure) → 201 |
| Shell | `src/app/groups/[groupId]/page.tsx` | The group's page: the group from `groups`, the room from here (`// CHAT` lines) |

**Data:** `messages(id, group_id, sender_id, sender_email, body, created_at)`. `sender_id` and `sender_email` default from
the login token, so nobody can post as someone else.

## How "real time" works (two delivery paths)
| App state | Path | Technology |
|---|---|---|
| Chat screen open | Supabase Realtime | A **WebSocket** to Supabase; Postgres replication streams new rows, Realtime applies RLS per subscriber |
| App closed or backgrounded | Web Push | Our server → push service (Apple/Google/Mozilla) → the OS wakes `sw.js` → notification |

There is no WebRTC: that is for peer-to-peer media, and chat is client ↔ server.

## Decisions worth knowing
- **Sending goes through an API route**, because it must also send push, which needs secrets.
- **No membership `if` in TypeScript.** The route inserts with the user's own client, so the RLS policy
  rejects non-members. The same policy blocks direct Supabase calls with the anon key.
- **Push is best-effort.** The message is already saved, so a push failure must not report "send failed", or
  users resend and create duplicates.
- **Realtime never replays.** Missed messages are covered by refetching in three cases: on `SUBSCRIBED`
  (first join and every reconnect), on `visibilitychange`, and after our own send.

## Expected behavior
- Old messages load; new ones from anyone appear without a reload.
- The sender gets no push; every other member's devices do, even with the app closed.
- `POST /api/chat/messages` while logged out → `401 {"error":"Not signed in"}` (JSON, not a redirect).
- Measured in dev (2026-09-14): opening a group 100–600 ms; sending 250–370 ms including push; heap stable.
- Opening a group from a notification: Realtime subscribes, then refetches once (~1.3 s in dev).

## Edge cases
- Everything about delivery (iOS, closed apps, shared devices) is in the `push` README.
- An unknown group id shows Next's 404 page with HTTP 200, because `loading.tsx` starts streaming first.
- Only the newest 50 messages load; there is no "load older" yet (backlog B6).
- A member is notified about a group at most once a minute (the `push` README); nobody can mute a group yet (B4).
- **Known gap:** no rate limiting on sending (B3).

## Limits (free tiers)
| Limit | Where | Our usage |
|---|---|---|
| ~200 Realtime connections | Supabase | One per open chat screen |
| ~500 MB database | Supabase | Text messages are tiny |
| ~4 KB push payload | Push services | Body + email fits |
| ~10 s function timeout | Netlify | Sending ~300 ms; big groups make fan-out slower |
| Project pauses after ~7 idle days | Supabase free | No login, chat or push while paused (B9) |

## Remove
Delete this folder, `src/app/groups/[groupId]/` and `src/app/api/chat/`, and make `GroupList` stop linking
to the group page. Run the DROP statement at the bottom of `schema.sql`. Groups, push, events and prayer
keep working: none of them depends on chat.
