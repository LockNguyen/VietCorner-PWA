# chat

Groups, live messages, and push notifications that reach phones even when the app is closed.

Full docs: `.claude/architecture.md` → 6.2 chat.

## Setup
1. Run `schema.sql` in Supabase → SQL Editor.
2. `.env.local`: `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `SUPABASE_SERVICE_ROLE_KEY`.

## Files (standard feature shape)
| Layer | File | Job |
|---|---|---|
| Data | `schema.sql` | Tables, RLS policies (who may do what), realtime, seed groups |
| Types | `types.ts` | `Group`, `GroupWithMembership`, `Message` |
| Browser API | `api.ts` | Every browser call: messages, join, push subscription, live stream |
| State | `hooks/useChatMessages.ts` | How the message list stays in sync (the 5 sources + dedupe) |
| State | `hooks/usePushNotifications.ts` | Push status + turning notifications on |
| UI | `components/` | `ChatRoom`, `MessageList`, `MessageForm`, `GroupList`, `JoinButton`, `EnableNotificationsButton` |
| Server reads | `server/queries.ts` | `getGroups`, `getChatRoom` (used by pages) |
| Server logic | `server/sendMessage.ts`, `server/notifyGroup.ts` | Save a message as the user → push to other members |

## Remove
Delete this folder, `src/app/groups/`, `src/app/api/chat/`, and `src/lib/supabase/admin.ts`. Remove the `CHAT` lines in `public/sw.js`, remove the Groups tab in `TabBar.tsx`, and change `HOME_PATH` in `features/auth/server/refreshSession.ts`. Drop the tables (SQL at the bottom of `schema.sql`).
