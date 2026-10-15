# prayer

Prayer requests shared with the whole church: post one (with or without your name), pray for someone else's, and
be told when someone prays for yours.

System docs: `.claude/architecture.md`. Shape and conventions: `docs/adding-a-feature.md`.

## Setup
Run `features/groups/schema.sql`, `features/profiles/schema.sql` and `features/push/schema.sql` first if they
have not been run, then this
`schema.sql` in Supabase → SQL Editor. Copy it from the editor, not from terminal output. It is **not** safe
to run twice (plain `create`), except section 4, the view, which is how the view is changed.

## Files
| Layer | File | Job |
|---|---|---|
| Data | `schema.sql` | Two tables, column grants, RLS, the `prayer_feed` view, `pray_for_request`, reminder seeds, DROPs |
| Types | `types.ts` | `PrayerRequest` (a row of the view), `NewPrayerRequest`, `FEED_COLUMNS`, `PAGE_SIZE`, `MAX_BODY_LENGTH` |
| Pure logic | `reminders.ts` | `isDue`: whether a weekly reminder should go out now (church time) |
| Pure logic | `feed.ts` | `withNewest`: the list on screen after its newest page is read again |
| Pure logic | `cooldown.ts` | `canPray`, `withoutExpired`, `COOLDOWN_MS`: the one-hour pause, worked out from timestamps |
| Device | `storage.ts` | When this device last prayed for each request, in localStorage, keyed by user id |
| Text | `strings.ts` | This feature's labels, and `prayedForYou(count)` for the notification |
| Browser API | `api.ts` | `getRequests`, `createRequest`, `editRequest`, `markAnswered`, `deleteRequest`, `prayFor` (POST `/api/prayer/pray`) |
| Server reads | `server/queries.ts` | `getLatestRequests(supabase)`: the first page |
| Server logic | `server/prayFor.ts` | Counts the prayer as the **user** (the database decides if it counts), then calls `notifyAuthor` |
| Server logic | `server/sendDueReminders.ts` | Called by the scheduler: "time to pray" to every approved member, once, per language |
| Server logic | `server/notifyAuthor.ts` | **Admin** client: the author and the count → `sendPush`, in the author's language (`// PUSH`, `// I18N`) |
| Routes | `src/app/api/prayer/pray/route.ts` | Verify (401) → validate (400) → `prayFor` → 204 |
| State | `hooks/usePrayerFeed.ts` | The list on screen: older pages, posting, editing, answering, deleting, praying, one error flag |
| State | `hooks/usePrayerCooldown.ts` | Which requests this device may pray for now; one clock for all of them |
| State | `src/lib/useWhenVisible.ts` | "Call this when the element scrolls into view" (shared with the group photos) |
| UI | `components/PrayerBoard.tsx` | Connects the hooks to the components below |
| UI | `components/PrayerComposer.tsx` | The sheet for a new request: the words and "Hide my name" |
| Pure logic | `grouping.ts` | `byWeekThenPerson`: the feed → weeks (Sunday, church time) → people → their requests |
| UI | `components/PrayerWeek.tsx` | One week: its label, then each person's requests as a run of bubbles under their name |
| UI | `components/PrayerBubble.tsx` | One request: someone else's has the round Pray chip beside it; my own has a small grey pencil that opens its options |
| UI | `components/RequestOptions.tsx` | The author's sheet: Answered, Edit, Delete, Cancel, two by two |
| UI | `components/RequestEditor.tsx` | The sheet's edit form |
| UI | `components/OlderRequestsMarker.tsx` | The end-of-list marker that loads the next page |
| UI | `components/PrayerReminderAdmin.tsx`, `PrayerReminderRow.tsx` | The admin section: the church's weekly reminders and the row to add one; one reminder, with Remove |
| Shell | `src/app/prayer/page.tsx`, `AppTabs.tsx`, `src/components/strings.ts` | The Prayer tab |

## How anonymity is guaranteed
RLS hides **rows**, not columns. If members could read `prayer_requests`, any of them could open the browser
console and select `author_id` for an "anonymous" request. So:

1. Members have **no select grant** on the table beyond `id`, and a policy that shows them only their own ids.
2. Everything is read through the **`prayer_feed` view**, which returns `null` for the name of an anonymous
   request and carries no author id at all. A named request shows the author's current name (`profiles`).
3. The view's `is_mine` column answers the one question the app needs the author for ("is this mine?"), so
   the author's options can be offered to the author without sending anyone an id.
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
- **A request is shown whole.** No "more…", no date and no group between requests: only the Pray chip, which sits on the same line as the bubble it belongs to (decided 2026-10-08, after three layouts that were unclear).
- **A prayer reminder is a weekly nudge to the whole church**, set by whoever holds `prayer.reminders`: a
  weekday and a church-time hour, as many as wanted. It says "Prayer" and "Time to pray together", in each
  member's language, and opens the Prayer tab. The wording is fixed in code, so there is nothing to translate
  per reminder. It reads no request. Due from its time for one hour. It goes to approved members only: an
  account still waiting to be let in may have notifications on and is not told.
  Reminders saved for one group before 2026-10-12 stay in the table, unlisted and unsent.
- **The list does not update live, but it refreshes itself** on arrival and when the app returns to the
  foreground (decided 2026-10-09). It reads the newest twenty again: new requests appear on top, and older
  ones the reader had scrolled to stay, so nobody loses their place (`feed.ts`, `withNewest`). A request
  answered or deleted further down than the newest twenty stays until the tab is opened afresh.
- **Requests are not translated**: members write them, and they are shown as written.
- **Pages are cut by `created_at`**, not by offset, so a request posted while someone scrolls cannot shift
  the pages and show a row twice.

## Expected behavior
- Posting puts the request at the top, under the author's name. With "Hide my name", others see
  "Anonymous"; the author sees "Anonymous (you)".
- The list is divided by week ("This week", "Last week", "2 weeks ago", "3 weeks ago", then "Week of
  <date>"; a week starts on Sunday, church time). Within a week each person's requests sit together under
  their name: my own named requests first, then people in the order of their newest request; anonymous
  requests share one group (my anonymous ones stay there, or their place would give them away). Every
  request is at the left, mine included; my own named group says "(you)".
  (This layout has not been looked at on any screen yet, 2026-10-08.)
- A request shows in full, as a grey bubble. No date and no group name on the list: the week label is the time.
- Someone else's request has a Pray button. After a tap it reads "Prayed" and is disabled for an hour on
  that device, for that user, for that request — including after closing and reopening the app. The author
  gets a notification on their devices with notifications turned on.
- Someone else's request has a round purple Pray chip beside it, a small gap to its right and level with its middle; after a tap it is a green tick that takes no taps, for an hour. Your own has a small round grey pencil button in the same place (32 across, two thirds of the Pray chip), which opens Answered / Edit / Delete / Cancel as a two-by-two grid.
  Answered and Delete both take it off the list at once; Edit opens the words for changing.
- Admin tab → Prayer reminders (with `prayer.reminders`): one line per reminder (weekday · time)
  with Remove, and a row to add one, which starts on today's weekday (church time). There can be several reminders on one day at different times, but
  not the same day and time twice; trying to raises the banner "There already is a reminder at that
  day and time."
  The buttons are disabled while a change is being saved.
  **Not yet exercised on screen; no reminder has been seen arriving.**
- Twenty requests load first; reaching the bottom loads twenty more until none are left.
- `POST /api/prayer/pray` while signed out → `401 {"error":"Not signed in"}` (observed 2026-10-06).

Verified so far: permissions, by attacking the schema and the migration inside rolled-back transactions
(27 + 18 checks) and by `npm run test:rls`. **Not yet exercised: the screen itself while signed in, and a
real notification arriving on a phone.**

## Edge cases
- A second device, or a second browser, has its own pause: the same person can pray from each.
- If the device's clock is moved back, a pause recorded "in the future" is treated as finished.
- A prayer that fails to reach the server cancels its pause, so the member can try again.
- A prayer that does not count (own request, answered meanwhile) still pauses the button and notifies nobody.
- An author with notifications off, or who never turned them on, is not told at all.
- An author gets at most one "prayed for you" notification a minute, across all their requests (the `push`
  README). The next one carries the running total, so no prayer goes uncounted, only unannounced.
- Two members with the same name share a group within a week: the feed carries no author id to tell them apart.
- A request is written in a sheet opened by the round plus at the top right; sharing closes it, a failure leaves the words in place.
- Two requests created in the same microsecond could straddle a page boundary and one be skipped. Ignored.

## Not built yet
- **Moderation:** removing someone else's request (`deleted_at` exists; on hold, backlog B24).
- **The end-of-year look back** at answered requests (backlog B19). The data is already being kept.

## Remove
Delete this folder, `src/app/prayer/` and `src/app/api/prayer/`, the Prayer tab in `AppTabs.tsx`, `prayerTab`
in `src/components/strings.ts`, and the "prayer requests" block in `tests/rls.test.ts`. Run the DROP
statements at the bottom of `schema.sql`.

## Shared with the whole church (2026-10-12)
- **Every request is read by every approved member.** The composer has no group to choose; the Prayer tab
  works for someone in no group.
- **Requests once shared with one group now show to everyone** (decided with the user: the data so far is
  from testing). `prayer_requests.group_id` is still in the table; new requests leave it empty and the
  browser has no grant to send one.
- **"Approved" is checked inside the view and inside `pray_for_request`** (`has_permission('app.use')`),
  because both skip row rules. Without that line anyone who signed up could read every request.
- **"N people prayed for you" is switched off** (`SWITCHES.prayedForPush`, checked in `server/prayFor.ts`):
  a prayer is still counted, and nobody is told. The reminders above are the one prayer notification left on.
- An existing database needs sections 3b, 4 and 5 of `schema.sql`, in that order.
- **Not exercised (2026-10-12):** the SQL is not run yet, so neither the security tests nor any signed-in screen.
