# push

Notifications that reach a phone while the app is closed. This feature knows **how** to deliver one; the
feature that sends it (chat, prayer) decides **who** gets it and **what** it says.

System docs: `.claude/architecture.md`. Shape and conventions: `docs/adding-a-feature.md`.

## Setup
1. Run `schema.sql` in Supabase → SQL Editor.
2. `.env.local`: `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `SUPABASE_SERVICE_ROLE_KEY`.

## Files
| Layer | File | Job |
|---|---|---|
| Data | `schema.sql` | `push_subscriptions(endpoint PK, user_id, subscription jsonb)`, owner-only RLS, the DROP statement |
| Types | `types.ts` | `PushNotification`: `{ title, body, url }`, the fields `sw.js` reads |
| Browser API | `api.ts` | `savePushSubscription` (upsert by endpoint: one row per device) |
| State | `hooks/usePushNotifications.ts` | Status (`unsupported/blocked/off/on/error`), re-saves the subscription on every open, `enable()` |
| UI | `components/EnableNotificationsButton.tsx` | The toggle, shown on the Groups page |
| Text | `strings.ts` | The toggle's labels |
| Server logic | `server/sendPush.ts` | `sendPush(userIds, notification)`: **admin** client → those users' devices → `web-push`. Deletes rows on 404/410. |
| Shell | `public/sw.js` (`PUSH` lines) | `push` → show the notification; `notificationclick` → open its `url` |
| Shell | `src/app/groups/page.tsx` (`// PUSH` lines) | Where the toggle is shown |

## Decisions worth knowing
- **Other features import `sendPush` directly**, marked `// PUSH`, the way they import i18n. It is a
  foundation: a sender cannot work without it, and passing it in from every route would only hide that.
- **Sending is best-effort.** Callers catch its errors: the message or prayer is already saved, and a failed
  push must not look like a failed action, or the user repeats it.
- **Every push shows a notification**, or Safari revokes the subscription.
- **The service-role key is needed** because RLS correctly hides other users' subscriptions.

## Expected behavior
- The Groups page shows the toggle; after a tap and the permission prompt it reads "Notifications are on".
- A device that unsubscribed returns 404/410 on the next send, and its row is removed.

## Edge cases
- **iOS:** push needs a Home Screen app on iOS 16.4+ and a tap to grant permission — hence a button.
- **Fully closed installed app:** iOS still wakes the service worker; it survives reboots. It stops if the
  icon is deleted, notifications are switched off, or Safari data is cleared — those return 410 and the row
  is removed.
- **Shared device:** the push endpoint belongs to the first user who saved it; another user's upsert fails
  RLS (backlog B7).
- A notification cannot be muted or grouped yet (backlog B4).

## Remove
Remove the senders first (`// PUSH` lines in chat and prayer). Then delete this folder, the `PUSH` lines in
`public/sw.js` and `src/app/groups/page.tsx`, run the DROP statement in `schema.sql`, and remove the VAPID
env vars.
