# chat

Live messages inside a group, and push notifications that reach phones even when the app has been closed
for months. Groups and membership belong to the `groups` feature; chat only reads them.

System docs: `.claude/architecture.md`. Shape and conventions: `docs/adding-a-feature.md`.

## Setup
1. Run `features/groups/schema.sql` first, then this `schema.sql` in Supabase → SQL Editor (tables, grants,
   RLS, the Realtime publication).
2. `.env.local`: `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `SUPABASE_SERVICE_ROLE_KEY`.

## Files
| Layer | File | Job |
|---|---|---|
| Data | `schema.sql` | Tables, grants, RLS policies, Realtime publication, and the DROP statements |
| Types | `types.ts` | `Message` |
| Browser API | `api.ts` | `getLatestMessages`, `sendMessage` (POST `/api/chat/messages`), `savePushSubscription`, `subscribeToNewMessages` |
| State | `hooks/useChatMessages.ts` | The whole sync strategy: first load, Realtime inserts, refetch on (re)connect and on visible, own message merged, dedupe by id |
| State | `hooks/usePushNotifications.ts` | Push status (`unsupported/blocked/off/on/error`), re-saves the subscription on every open, `enable()` |
| UI | `components/ChatRoom.tsx` | `useChatMessages` → `MessageList` + `MessageForm` |
| UI | `components/MessageList.tsx` | Bubbles (mine blue right, others gray left) + auto-scroll |
| UI | `components/MessageForm.tsx` | Draft + error; restores the text when sending fails |
| UI | `components/EnableNotificationsButton.tsx` | The push toggle |
| Server reads | `server/queries.ts` | `getChatRoom` → `{ messages, userId }` |
| Server logic | `server/sendMessage.ts` | Inserts as the **user** (RLS checks membership), then calls `notifyGroup` |
| Server logic | `server/notifyGroup.ts` | **Admin** client: other members → their subscriptions → `web-push`. Deletes rows on 404/410. |
| Routes | `src/app/api/chat/messages/route.ts` | Verify (401) → validate (400) → `sendMessage` (403 on RLS failure) → 201 |
| Shell | `src/app/groups/[groupId]/page.tsx` | The group's page: the group from `groups`, the room from here (`// CHAT` lines) |
| Shell | `src/app/groups/page.tsx` | Shows the push toggle above the group list (`// CHAT` lines) |
| Shell | `public/sw.js` (`CHAT` lines) | `push` → show notification; `notificationclick` → open `/groups/<id>` |
| Shell | `src/lib/supabase/admin.ts` | Service-role client, used only by `notifyGroup` |

**Data:** `messages(id, group_id, sender_id, sender_email, body, created_at)`,
`push_subscriptions(endpoint PK, user_id, subscription jsonb)`. `sender_id` and `sender_email` default from
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
- **Every push shows a notification**, or Safari revokes the subscription.
- **Realtime never replays.** Missed messages are covered by refetching in three cases: on `SUBSCRIBED`
  (first join and every reconnect), on `visibilitychange`, and after our own send.

## Expected behavior
- Old messages load; new ones from anyone appear without a reload.
- The sender gets no push; every other member's devices do, even with the app closed.
- `POST /api/chat/messages` while logged out → `401 {"error":"Not signed in"}` (JSON, not a redirect).
- Measured in dev (2026-09-14): opening a group 100–600 ms; sending 250–370 ms including push; heap stable.
- Opening a group from a notification: Realtime subscribes, then refetches once (~1.3 s in dev).

## Edge cases
- **iOS:** push needs a Home Screen app on iOS 16.4+ and a tap to grant permission — hence a button.
- **Fully closed installed app:** iOS still wakes the service worker; it survives reboots. It stops if the
  icon is deleted, notifications are switched off, or Safari data is cleared — those return 410 and the row
  is removed.
- **Shared device:** the push endpoint belongs to the first user who saved it; another user's upsert fails RLS.
- An unknown group id shows Next's 404 page with HTTP 200, because `loading.tsx` starts streaming first.
- Only the newest 50 messages load; there is no "load older" yet (backlog B6).
- **Known gaps:** no rate limiting on sending (B3), and every message notifies every member (B4).

## Limits (free tiers)
| Limit | Where | Our usage |
|---|---|---|
| ~200 Realtime connections | Supabase | One per open chat screen |
| ~500 MB database | Supabase | Text messages are tiny |
| ~4 KB push payload | Push services | Body + email fits |
| ~10 s function timeout | Netlify | Sending ~300 ms; big groups make fan-out slower |
| Project pauses after ~7 idle days | Supabase free | No login, chat or push while paused (B9) |

## Remove
Delete this folder, `src/app/groups/[groupId]/`, `src/app/api/chat/`, and `src/lib/supabase/admin.ts`. Remove
the `CHAT` lines in `public/sw.js` and `src/app/groups/page.tsx`, and make `GroupList` stop linking to the
group page. Run the DROP statement at the bottom of `schema.sql` and remove the push env vars. Groups,
events and prayer keep working: they depend on `groups`, not on chat.
