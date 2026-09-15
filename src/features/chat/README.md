# chat

Groups, live messages, and push notifications that reach phones even when the app is closed.

Full docs: `.claude/architecture.md` → 6.2 chat.

## Setup
1. Run `schema.sql` in Supabase → SQL Editor.
2. `.env.local`: `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `SUPABASE_SERVICE_ROLE_KEY`.

## Files
- `schema.sql`: tables, RLS policies, realtime, seed groups
- `components/`: `GroupList`, `JoinButton`, `GroupChat` (server loader), `ChatRoom` (live UI), `EnableNotificationsButton`
- `server/sendMessage.ts`: insert as the user → `notifyGroup`
- `server/notifyGroup.ts`: push to other members' devices, delete expired subscriptions

## Remove
Delete this folder, `src/app/groups/`, `src/app/api/chat/`, and `src/lib/supabase/admin.ts`. Remove the `CHAT` lines in `public/sw.js`, remove the Groups tab in `TabBar.tsx`, and change `HOME_PATH` in `features/auth/refreshSession.ts`. Drop the tables (SQL at the bottom of `schema.sql`).
