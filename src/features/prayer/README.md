# prayer

Prayer requests shared inside a group: post one (with or without your name), pray for someone else's, and
be told when someone prays for yours.

System docs: `.claude/architecture.md`. Shape and conventions: `docs/adding-a-feature.md`.

## Setup
Run `features/groups/schema.sql` and `features/push/schema.sql` first if they have not been run, then this
`schema.sql` in Supabase → SQL Editor. Copy it from the editor, not from terminal output. It is **not** safe
to run twice (plain `create`).

## Files
| Layer | File | Job |
|---|---|---|
| Data | `schema.sql` | Two tables, column grants, RLS, the `prayer_feed` view, `pray_for_request`, reminder seeds, DROPs |
| Types | `types.ts` | `PrayerRequest` (a row of the view), `NewPrayerRequest`, `FEED_COLUMNS`, `PAGE_SIZE`, `MAX_BODY_LENGTH` |
| Pure logic | `reminders.ts` | `isDue`: whether a group's weekly reminder should go out now (church time) |
| Pure logic | `cooldown.ts` | `canPray`, `withoutExpired`, `COOLDOWN_MS`: the one-hour pause, worked out from timestamps |
| Device | `storage.ts` | When this device last prayed for each request, in localStorage, keyed by user id |
| Text | `strings.ts` | This feature's labels, and `prayedForYou(count)` for the notification |
| Browser API | `api.ts` | `getRequests`, `createRequest`, `editRequest`, `markAnswered`, `deleteRequest`, `prayFor` (POST `/api/prayer/pray`) |
| Server reads | `server/queries.ts` | `getLatestRequests(supabase)`: the first page |
| Server logic | `server/prayFor.ts` | Counts the prayer as the **user** (the database decides if it counts), then calls `notifyAuthor` |
| Server logic | `server/sendDueReminders.ts` | Called by the scheduler: "time to pray" to each due group's members, once, per language |
| Server logic | `server/notifyAuthor.ts` | **Admin** client: the author and the count → `sendPush`, in the author's language (`// PUSH`, `// I18N`) |
| Routes | `src/app/api/prayer/pray/route.ts` | Verify (401) → validate (400) → `prayFor` → 204 |
| State | `hooks/usePrayerFeed.ts` | The list on screen: older pages, posting, editing, answering, deleting, praying, one error flag |
| State | `hooks/usePrayerCooldown.ts` | Which requests this device may pray for now; one clock for all of them |
| State | `hooks/useExpandableText.ts` | Three lines until asked; measures whether there is more to show |
| State | `hooks/useWhenVisible.ts` | "Call this when the element scrolls into view" |
| UI | `components/PrayerBoard.tsx` | Connects the hooks to the components below |
| UI | `components/PrayerComposer.tsx` | The words, the group, "Hide my name" |
| UI | `components/PrayerCard.tsx` | One request: three lines and "more…", then Pray, or the author's X |
| UI | `components/RequestOptions.tsx` | The author's dialog: Answered, Edit, Delete, Cancel |
| UI | `components/RequestEditor.tsx` | The dialog's edit form |
| UI | `components/OlderRequestsMarker.tsx` | The end-of-list marker that loads the next page |
| UI | `components/PrayerReminderAdmin.tsx` | The admin section: each group's weekly reminders, add and remove |
| Shell | `src/app/prayer/page.tsx`, `TabBar.tsx`, `src/components/strings.ts` | The Prayer tab |

## How anonymity is guaranteed
RLS hides **rows**, not columns. If members could read `prayer_requests`, any of them could open the browser
console and select `author_id` for an "anonymous" request. So:

1. Members have **no select grant** on the table beyond `id`, and a policy that shows them only their own ids.
2. Everything is read through the **`prayer_feed` view**, which returns `null` for the email of an anonymous
   request and carries no author id at all.
3. The view's `is_mine` column answers the one question the app needs the author for ("is this mine?"), so
   the X button can be shown to the author without sending anyone an id.
4. The author cannot be forged either: `author_id` and `author_email` have no insert or update grant and
   default from the login token.

What it does **not** hide: the service role (developers, later admins) still sees the author, on purpose.
And a small group can guess from timing or wording — no software fixes that.

## Decisions worth knowing
- **The view is the security.** It runs with its owner's rights (it must: members cannot read the table), so
  its `where` clause is what stops an outsider. Supabase's linter flags "security definer view"; here that
  is the design, and `tests/rls.test.ts` attacks it from a non-member and from a fellow member.
- **Praying is a database function, not an update.** With an update grant on `prayer_count`, one call could
  set it to a million. `pray_for_request` adds exactly one, for a request the caller can see and did not
  write, and answers whether it counted.
- **Praying goes through a route** because it notifies the author, which needs the service-role and VAPID
  keys. The author gets a push, "N people prayed for you", at most once a minute. Nothing about it is
  shown on screen, and nobody can read the count — not even the author.
- **The count is a number of prayers, not a list of people.** Who prayed is never stored. The same person
  praying again after an hour counts again; the notification still says "people" (decided, for simplicity).
- **The one-hour pause lives on the device only** (decided). It stops accidental double taps, not a
  determined caller: clearing storage or calling the route directly adds more (backlog B22, only if abused).
- **The pause is a timestamp, not a timer.** Nothing counts down, so nothing is lost when the app closes.
  One 30-second clock tick plus `visibilitychange` re-reads the time; finished entries are dropped on load.
- **An answered request leaves the list but stays in the database** (`answered_at`), for an end-of-year look
  back at answered prayers. It cannot be un-answered from the app.
- **Editing changes the words only.** The group and "Hide my name" stay as posted. An edit leaves no mark.
- **The author's delete is permanent and asks no confirmation** (decided: the dialog is already the second
  tap). An admin's delete will be soft (`deleted_at`, hidden by the view).
- **"more…" appears when the text is measured to be clipped**, not guessed from its length.
- **A prayer reminder is a weekly nudge to a group**, set by whoever holds `prayer.reminders`: a weekday and a
  church-time hour, several per group. It says the group's name and "Time to pray together", in each
  member's language, and opens the Prayer tab. The wording is fixed in code, so there is nothing to translate
  per reminder. It reads no request, so it does not depend on who may see them (backlog B24).
  Due from its time for one hour; a removed group gets none.
- **The list does not update live.** It is what the server sent when the page opened, plus this member's own
  actions. Reopening the tab refreshes it.
- **Requests are not translated**: members write them, and they are shown as written.
- **Pages are cut by `created_at`**, not by offset, so a request posted while someone scrolls cannot shift
  the pages and show a row twice.

## Expected behavior
- With no group joined: "Join a group first…" and no composer.
- Posting puts the request at the top. With "Hide my name", others see "Anonymous"; the author sees
  "Anonymous (you)".
- A request longer than three lines on this screen shows "more…"; a shorter one shows no link.
- Someone else's request has a Pray button. After a tap it reads "Prayed" and is disabled for an hour on
  that device, for that user, for that request — including after closing and reopening the app. The author
  gets a notification on their devices with notifications turned on.
- Your own request has no Pray button and an X, which opens Answered / Edit / Delete / Cancel.
  Answered and Delete both take it off the list at once; Edit opens the words for changing.
- Admin tab → Prayer reminders (with `prayer.reminders`): one line per reminder (group · weekday · time)
  with Remove, and a row to add one. A group can have several reminders on one day at different times, but
  not the same day and time twice; adding one that already exists changes nothing and is not an error.
  The buttons are disabled while a change is being saved.
  **Not yet exercised on screen; no reminder has been seen arriving.**
- Twenty requests load first; reaching the bottom loads twenty more until none are left.
- `POST /api/prayer/pray` while signed out → `401 {"error":"Not signed in"}` (observed 2026-10-06).

Verified so far: permissions, by attacking the schema and the migration inside rolled-back transactions
(27 + 18 checks) and by `npm run test:rls`. **Not yet exercised: the screen itself while signed in, and a
real notification arriving on a phone.**

## Edge cases
- When a group is removed, its requests leave the feed and can no longer be prayed for; they stay stored.
- A second device, or a second browser, has its own pause: the same person can pray from each.
- If the device's clock is moved back, a pause recorded "in the future" is treated as finished.
- A prayer that fails to reach the server cancels its pause, so the member can try again.
- A prayer that does not count (own request, answered meanwhile) still pauses the button and notifies nobody.
- An author with notifications off, or who never turned them on, is not told at all.
- An author gets at most one "prayed for you" notification a minute, across all their requests (the `push`
  README). The next one carries the running total, so no prayer goes uncounted, only unannounced.
- "more…" is measured when the card appears and when its text changes, not when the phone is rotated.
- Two requests created in the same microsecond could straddle a page boundary and one be skipped. Ignored.

## Not built yet
- **Moderation:** removing someone else's request (`deleted_at` exists; on hold, backlog B24).
- **The end-of-year look back** at answered requests (backlog B19). The data is already being kept.

## Remove
Delete this folder, `src/app/prayer/` and `src/app/api/prayer/`, the Prayer tab in `TabBar.tsx`, `prayerTab`
in `src/components/strings.ts`, and the "prayer requests" block in `tests/rls.test.ts`. Run the DROP
statements at the bottom of `schema.sql`.
