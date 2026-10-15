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
| Browser API | `api.ts` | `savePushSubscription` (POST `/api/push/subscribe`), `removePushSubscription` (delete, own row only) |
| Server logic | `server/saveSubscription.ts` | **Admin** client: stores the device under the verified user, taking it over from whoever had it |
| Routes | `src/app/api/push/subscribe/route.ts` | Verify (401) → validate (400) → `saveSubscription` → 204 |
| State | `hooks/usePushNotifications.ts` | Status (`unsupported/blocked/off/on/error`), re-saves the subscription on every open, `enable()` |
| UI | `components/NotificationSection.tsx` | The Settings block: one switch, on or off for this device, and a line when the phone stands in the way |
| UI | `components/NotificationStep.tsx` + `hooks/useNotificationStep.ts` | The setup screen "Turn on notifications": shown by the layout after the name until they are on or the person taps "No, not for now". The answer is the cookie `NOTIFICATIONS_ASKED_COOKIE` (`types.ts`, 400 days). Already on, or impossible here (unsupported) → it records that and moves on by itself |
| UI | `components/KeepSubscribed.tsx` | Draws nothing: saves the device's subscription again on every opening of the app (root layout) |
| Text | `strings.ts` | The toggle's labels |
| Server logic | `server/sendPush.ts` | `sendPush(userIds, notification)`: **admin** client → who is due (the pause) → their devices → `web-push`. Deletes rows on 404/410. |
| Server logic | `server/sendPushOnce.ts` | `sendPushOnce(key, userIds, notification)`: sends the first time a key is seen, never again |
| Routes | `src/app/api/reminders/send/route.ts` | The scheduler's door: checks `CRON_SECRET`, then asks events and prayer to send what is due |
| Server reads | `server/queries.ts` | `getSubscribedUserIds(admin)`: everyone with notifications on, for a church-wide announcement |
| Shell | `public/sw.js` (`PUSH` lines) | `push` → show the notification; `notificationclick` → open its `url`. The `CACHE` part of the same file (saving the code files for a fast launch) belongs to the app shell, not to push: keep it when removing push. |
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
- First evening live (2026-10-07): the two 5 PM prayer reminders were sent once each, on time. But 16 of 22
  scheduler calls gave up at Supabase's default 5-second wait, and one got a 502. The site was asleep
  between calls: a first request after ~11 idle minutes took 2.7 s to be refused, a second 0.5 s. Since
  then the cron call waits 25 s, due reminders are sent side by side, and the answer includes `tookMs`
  (or the error), readable for a few hours in Supabase's `net._http_response`.
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
- The site sleeps between scheduler calls, so every call pays a start-up of a few seconds. A run that the
  host cuts off (Netlify allows a function about 10 s) can lose the reminders it had not reached.
- If Supabase pauses the project (free tier, after about a week idle) the clock stops with it (backlog B9).
- `push_sent_once` grows by a few rows a week and is never cleaned. Small enough to ignore for years.

## Remove
Remove the senders first (`// PUSH` lines in chat and prayer). Then delete this folder, the `PUSH` lines in
`public/sw.js` and `src/app/groups/page.tsx`, run the DROP statement in `schema.sql`, and remove the VAPID
env vars.

## Why the subscription is saved again on every open
The server can only push to subscriptions stored in the database, and that row may be gone (deleted after a
410, or another user signed in on this device), or the browser may have replaced the subscription.
Re-saving on every open repairs this silently.

## Why a device is saved by the server, not by the browser
A phone keeps its push endpoint when someone else signs in on it (a shared phone, or one person with two
accounts). The row for that endpoint then belongs to the previous user, and RLS, correctly, stops the new
user's browser from touching it. Saving straight from the browser therefore failed with "Could not save"
on exactly those phones (found on two iPhones, 2026-10-09). The route verifies who is signed in and hands
the device over. `tests/rls.test.ts` keeps the direct takeover refused.

## Turning notifications on and off (Settings, 2026-10-09)
- The switch is in Settings → Notifications, no longer on the Groups page.
- **On:** the phone asks for permission (first time), the device is subscribed and saved.
- **Off:** the phone forgets the subscription first, so nothing can arrive from that moment; then our row
  is removed. If that removal fails, the next send finds the dead subscription and removes it.
- **Blocked in the phone's settings, or the app not on the Home Screen:** the switch is off and cannot be
  moved, and a line says what to do.
- The switch is per device: turning it off on one phone leaves the others on.
- The repair that used to run when the Groups page opened now runs once per opening of the app
  (`KeepSubscribed`), for anyone signed in.
- **Not seen on a phone or on screen (2026-10-09).**

## What is sent now (2026-10-12)
Notifications annoyed people, so only three kinds are left on:
| Notification | State | Where it is decided |
|---|---|---|
| Prayer reminder (weekly, whole church) | **on** | prayer |
| Someone signed up and waits (to admins) | **on** | approval |
| You were approved (to the person) | **on** | approval |
| Chat message | off with `SWITCHES.chat` | the chat route |
| Join request / joined | off with `SWITCHES.joining` | the groups routes |
| Event cancelled / back on | off, `eventChangePush` | `events/server/changeSchedule.ts` |
| Event reminder | off, `eventReminders` | the reminders route |
| "N people prayed for you" | off, `prayedForPush` | `prayer/server/prayFor.ts` |
| Name waiting / name approved | off, `namePush` | `profiles/server/nameRequests.ts` |

Each off line is one constant in `src/lib/switches.ts`; the action behind it still happens, it only tells nobody.
