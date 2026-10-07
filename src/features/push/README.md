# push

Notifications that reach a phone while the app is closed. This feature knows **how** to deliver one; the
feature that sends it (chat, prayer) decides **who** gets it and **what** it says.

System docs: `.claude/architecture.md`. Shape and conventions: `docs/adding-a-feature.md`.

## Setup
1. Run `schema.sql` in Supabase → SQL Editor.
2. `.env.local`: `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `SUPABASE_SERVICE_ROLE_KEY`.
3. For reminders: set `CRON_SECRET` (any long random string) on Netlify, then run section 5 of `schema.sql`
   by hand with the site's address and that same secret. That starts the 15-minute clock.

## Files
| Layer | File | Job |
|---|---|---|
| Data | `schema.sql` | `push_subscriptions` (one row per device, owner-only RLS); `push_cooldowns` + `claim_push_turns` and `push_sent_once` + `claim_push_once` (server-only); the cron job; the DROPs |
| Types | `types.ts` | `PushNotification`: `{ title, body, url, topic? }`, the fields `sw.js` reads |
| Browser API | `api.ts` | `savePushSubscription` (upsert by endpoint: one row per device) |
| State | `hooks/usePushNotifications.ts` | Status (`unsupported/blocked/off/on/error`), re-saves the subscription on every open, `enable()` |
| UI | `components/EnableNotificationsButton.tsx` | The toggle, shown on the Groups page |
| Text | `strings.ts` | The toggle's labels |
| Server logic | `server/sendPush.ts` | `sendPush(userIds, notification)`: **admin** client → who is due (the pause) → their devices → `web-push`. Deletes rows on 404/410. |
| Server logic | `server/sendPushOnce.ts` | `sendPushOnce(key, userIds, notification)`: sends the first time a key is seen, never again |
| Routes | `src/app/api/reminders/send/route.ts` | The scheduler's door: checks `CRON_SECRET`, then asks events and prayer to send what is due |
| Server reads | `server/queries.ts` | `getSubscribedUserIds(admin)`: everyone with notifications on, for a church-wide announcement |
| Shell | `public/sw.js` (`PUSH` lines) | `push` → show the notification; `notificationclick` → open its `url` |
| Shell | `src/app/groups/page.tsx` (`// PUSH` lines) | Where the toggle is shown |

## Decisions worth knowing
- **Other features import `sendPush` directly**, marked `// PUSH`, the way they import i18n. It is a
  foundation: a sender cannot work without it, and passing it in from every route would only hide that.
- **One notification per user, per topic, per minute.** A topic is what the notification is about:
  `chat:<group id>` or `prayer`. So a busy group buzzes once a minute, a second group still gets through,
  and so does a prayer; several prayers in a minute are one notification. The minute is `PAUSE_SECONDS` in
  `sendPush.ts`, the same for everyone.
- **A notification without a topic is an announcement:** always delivered, never replaced. Event
  cancellations use this (decided 2026-10-06), so each one arrives however close together they are.
- **The pause is decided in the database, in one statement** (`claim_push_turns`): it returns who is due and
  marks them notified together, so two messages sent at the same instant cannot both notify one person.
- **Nothing is sent when the pause ends.** There is no scheduler, so messages that arrive during the minute
  are silent; the member finds them on opening the group.
- **The topic is also the notification's `tag`**, so a newer notification about the same thing replaces the
  older one in the tray. This is a web notification, not a native one: there is no `aps` payload or `sound`
  key to set from here, only what `showNotification` offers, and phones differ in how they honour it.
- **Reminders are sent by a clock outside the app.** A cron job in Supabase calls
  `POST /api/reminders/send` every 15 minutes; the route asks each feature what is due and sends it.
  - *Why a fixed tick and not one cron job per reminder:* exact jobs would have to be created, moved and
    deleted every time an admin edits an event, cancels a date or the clocks change (cron runs on UTC). One
    tick that asks "what is due?" has nothing to keep in step. It costs about 2,900 small requests a month.
  - *Why 15 minutes:* the shortest reminder is 30 minutes before, so it arrives 15 to 30 minutes ahead.
  - The route has no user to verify, so the caller sends a shared secret (`CRON_SECRET`). Unset means closed.
- **Each scheduled send has a key and is claimed before sending** (`sendPushOnce`), so overlapping or
  repeated runs send once, and a run after an outage catches up within the hour each feature allows.
  A send that fails after its claim is not retried: a missed reminder beats a doubled one.
- **Sending is best-effort.** Callers catch its errors: the message or prayer is already saved, and a failed
  push must not look like a failed action, or the user repeats it.
- **Every push shows a notification**, or Safari revokes the subscription.
- **The service-role key is needed** because RLS correctly hides other users' subscriptions.

## Expected behavior
- The Groups page shows the toggle; after a tap and the permission prompt it reads "Notifications are on".
- A device that unsubscribed returns 404/410 on the next send, and its row is removed.
- `POST /api/reminders/send` without the secret, or with a wrong one → `401 {"error":"Not allowed"}`
  (observed 2026-10-06, and on the live site 2026-10-07).
- The cron job `send-reminders` runs every 15 minutes; its first run on 2026-10-07 got
  `200 {"sent":{"events":0,"prayer":0}}` from the live site, so the secret matches on both sides.
  **Not yet observed: a reminder arriving on a phone.**
- Two messages in one group within a minute: one notification. A message in another group, or a prayer, in
  that same minute: its own notification. **Proven in the database (8-check dry run, 2026-10-06); not yet
  observed on a phone**, including whether the tag replaces the older notification on iOS.

## Edge cases
- **iOS:** push needs a Home Screen app on iOS 16.4+ and a tap to grant permission — hence a button.
- **Fully closed installed app:** iOS still wakes the service worker; it survives reboots. It stops if the
  icon is deleted, notifications are switched off, or Safari data is cleared — those return 410 and the row
  is removed.
- **Shared device:** the push endpoint belongs to the first user who saved it; another user's upsert fails
  RLS (backlog B7).
- The pause starts when a notification is *due*, even if the user has no device or the send fails.
- **Deploy order:** run the SQL before deploying this code. Without `claim_push_turns`, `sendPush` fails and
  no notification is sent at all (messages and prayers still save).
- A user cannot mute a group or change the minute yet (backlog B4).
- If Supabase pauses the project (free tier, after about a week idle) the clock stops with it (backlog B9).
- `push_sent_once` grows by a few rows a week and is never cleaned. Small enough to ignore for years.

## Remove
Remove the senders first (`// PUSH` lines in chat and prayer). Then delete this folder, the `PUSH` lines in
`public/sw.js` and `src/app/groups/page.tsx`, run the DROP statement in `schema.sql`, and remove the VAPID
env vars.
