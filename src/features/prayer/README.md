# prayer

Prayer requests shared with the whole church: post one (with or without your name), pray for someone else's, and
be told when someone prays for yours. Each request is translated between Vietnamese and English, and shown
translated once an admin has checked it.

System docs: `.claude/architecture.md`. Shape and conventions: `docs/adding-a-feature.md`.

## Setup
Run `features/groups/schema.sql`, `features/profiles/schema.sql` and `features/push/schema.sql` first if they
have not been run, then this
`schema.sql` in Supabase → SQL Editor. Copy it from the editor, not from terminal output. It is **not** safe
to run twice (plain `create`), except section 4, the view, which is how the view is changed.

**Worship music:** put the MP3s the church has the rights to in `public/audio/worship/` and add each file's
name to `WORSHIP_SONGS` in `types.ts` (spaces are fine). `songs.test.ts` fails while the list and the folder
disagree, so a commit cannot ship a song list that points at a missing file (2026-10-22: the five new songs
replaced `worship.mp3`, still listed, and Play said "The music could not play"). The first Play on a phone shuffles the songs' positions once (0 … n-1,
each once) and keeps that order and the place in it in localStorage, which stays when the app is swiped away.
Play starts the song after the one heard last; a song that ends, or Next, goes to the next; Back to the one
before; after the last comes the first again (`playlist.ts`, 2026-10-22). Adding or removing a song makes a new
order. A song downloads only when it starts: more songs make the deploy bigger, never the app slower. A
missing file makes Play say "The music could not play." Leaving the tab releases the player (its song unloaded), not only pauses it: a page still holding the
phone's audio is the likely reason the iPhone keyboard's dictation key went grey on the next screen (2026-10-23).

## Files
| Layer | File | Job |
|---|---|---|
| Data | `schema.sql` | Two tables, column grants, RLS, the `prayer_feed` view, `pray_for_request`, reminder seeds, DROPs |
| Types | `types.ts` | `PrayerRequest` (a row of the view), `NewPrayerRequest`, `PrayerTranslation`, `REVIEW_TRANSLATIONS`, `FEED_COLUMNS`, `PAGE_SIZE`, `MAX_BODY_LENGTH`, `MAX_TRANSLATION_LENGTH` |
| Pure logic | `shownText.ts` | The words a reader sees: the approved translation of someone else's request in the other language, else as written (tested) |
| Pure logic | `reminders.ts` | `isDue`: whether a weekly reminder should go out now (church time) |
| Pure logic | `feed.ts` | `withNewest`: the list on screen after its newest page is read again |
| Pure logic | `cooldown.ts` | `canPray`, `withoutExpired`: once per request per day (the phone's midnight), worked out from timestamps |
| Device | `storage.ts` | When this device last prayed for each request, in localStorage, keyed by user id |
| Text | `strings.ts` | This feature's labels, and `prayedForYou(count)` for the notification |
| Reads | `reads.ts` | `getPrayerReminders`, and the reviewers' `getTranslationsToReview` (oldest first), `getPastTranslations` (newest first), `getTranslation` (one, for the editor), all from `prayer_translations`; each shared by its page and its refresh on arrival |
| Browser API | `api.ts` | `getPrayerReminders`, `getTranslationsToReview` (refreshes, `useFresh`), `getRequests`, `createRequest` (POST `/api/prayer/post`), `editRequest` (POST `/api/prayer/edit`), `markAnswered`, `deleteRequest`, `prayFor` (POST `/api/prayer/pray`), `reviewTranslation` (the `review_prayer_translation` function), `retryTranslation` (POST `/api/prayer/retranslate`), `getPastTranslations` |
| Server reads | `server/queries.ts` | `getLatestRequests(supabase)`: the first page; `getMyRequest`: one of mine, for its edit screen; the reviewers' three reads (re-exported) |
| Server logic | `server/postRequest.ts`, `server/editRequest.ts` | Post, or change the words of my own, as the **user** (RLS decides); answer the id / whether it changed |
| Server logic | `server/translateRequest.ts` | **Admin** client: the request's text only → the AI service's `/translate` (`src/lib/aiService.ts`) → `language`, `translation`, written only onto the same words and only while unreviewed; answers whether it wrote. A failure leaves the translation as it was, logged without the text |
| Server logic | `server/translateForReview.ts` | After a post or an edit: `translateRequest`, then `notifyReviewers` |
| Server logic | `server/retranslateRequest.ts` | A reviewer's Retry, as the **user**: `reopen_prayer_translation` (the database checks the permission), then `translateRequest` |
| Server logic | `server/notifyReviewers.ts` | Everyone with `prayer.translations`: "a translation is waiting", per language, one topic |
| Server logic | `server/prayFor.ts` | Counts the prayer as the **user** (the database decides if it counts), then calls `notifyAuthor` |
| Server logic | `server/sendDueReminders.ts` | Called by the scheduler: "time to pray" to every approved member, once, per language |
| Server logic | `server/notifyAuthor.ts` | **Admin** client: the author and the count → `sendPush`, in the author's language (`// PUSH`, `// I18N`) |
| Routes | `src/app/api/prayer/pray/route.ts` | Verify (401) → validate (400) → `prayFor` → 204 |
| Routes | `src/app/api/prayer/post/route.ts`, `edit/route.ts` | Verify (401) → validate (400; an id with `src/lib/ids.ts`) → `postRequest` / `editRequest` → 204, then `after()`: `translateForReview` |
| Routes | `src/app/api/prayer/retranslate/route.ts` | Verify (401) → validate (400) → `retranslateRequest` → 204, 403 (not a reviewer), 503 (no answer from the AI service). Waits for the translation: the reviewer is reading |
| State | `hooks/usePrayerFeed.ts` | The list on screen: older pages, answering, deleting, praying |
| State | `hooks/useRequestWriting.ts` | Saving a new or edited request from its own screen, then back to the list |
| State | `hooks/useTranslationEditing.ts` | The translation's edit screen: Submit approves the corrected words and goes back to Admin; Cancel goes back |
| State | `hooks/useWorshipMusic.ts` | The worship songs: play, pause, `next`, `previous`, the next song on `ended`, stopped on leaving; `state` off / loading / playing from the audio's own events (`playing` = sound coming out); tells the board only of a real failure (`error`, or the phone refusing), never of a start cut short by a newer song (skipping fast) |
| Logic | `playlist.ts` | `shuffledOrder`, `stepped` (wraps both ways), `keptOrNew` (the phone's order while it fits the songs) (tested) |
| Device | `storage.ts` | When this device last prayed for each request; the songs' order and place (`loadPlaylist`, `savePlaylist`) |
| State | `hooks/useShowAfter.ts` | True once the screen has been open a while: the music bubble after 2 s |
| State | `hooks/usePrayerCooldown.ts` | Which requests this device may pray for now; one clock for all of them |
| State | `src/lib/useWhenVisible.ts` | "Call this when the element scrolls into view" (shared with the group photos) |
| UI | `components/PrayerBoard.tsx` | Connects the hooks to the components below |
| UI | `components/PrayerToolbar.tsx` | Held under the top bar: the admin's bell, play/pause music with its bubble, the + |
| UI | `components/PrayerComposer.tsx` | The new-request screen: the words at the top, "Hide my name", Share |
| Pure logic | `grouping.ts` | `byWeekThenPerson`: the feed → weeks (Sunday, church time) → people → their requests |
| UI | `components/PrayerWeek.tsx` | One week: its label, then each person's requests as a run of bubbles under their name |
| UI | `components/PrayerBubble.tsx` | One request: someone else's has the round Pray chip beside it; my own has a small grey pencil that opens its options |
| UI | `components/RequestOptions.tsx` | The author's sheet: Answered, Edit (opens the edit screen), Delete |
| UI | `components/RequestEditor.tsx` | The edit screen's form: the words, Save |
| UI | `components/OlderRequestsMarker.tsx` | The end-of-list marker that loads the next page |
| UI | `components/TranslationReviews.tsx`, `TranslationReviewRow.tsx` | The Admin tab's "Translations": a row to the past ones, then each waiting request (`ListRow`: VI/EN in a `CountPill`, the translation under it, Approve, the pencil, the circular arrow) |
| UI | `components/PastTranslations.tsx` | `/admin/translations`: every approved translation, newest first, each with the pencil and Retry |
| UI | `components/TranslationEditor.tsx` | The translation's edit screen: the request, the translation to correct, Submit, Cancel |
| UI | `components/PrayerReminderAdmin.tsx`, `PrayerReminderRow.tsx` | The admin section: the church's weekly reminders and the row to add one; one reminder, with Remove |
| Shell | `src/app/prayer/page.tsx`, `AppTabs.tsx`, `src/components/strings.ts` | The Prayer tab |
| Shell | `src/app/prayer/new/page.tsx`, `src/app/prayer/[requestId]/edit/page.tsx` | Writing and editing a request, each its own screen |
| Shell | `src/app/admin/page.tsx` (`// PRAYER` lines), `src/app/admin/translations/page.tsx`, `[requestId]/page.tsx` | The review list on the Admin tab; the past translations; one translation's edit screen, which goes back to the list it was opened from |

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
  praying again the next day counts again; the notification still says "people" (decided, for simplicity).
- **Once a day per request, on the device only** (the user, 2026-10-20, replacing a one-hour pause): members
  use the green tick to keep track of what they prayed for today; it resets at the phone's midnight. It stops
  repeat taps, not a determined caller: clearing storage or calling the route directly adds more (backlog B22, only if abused).
- **The pause is a timestamp, not a timer.** Nothing counts down, so nothing is lost when the app closes.
  One 30-second clock tick plus `visibilitychange` re-reads the time; finished entries are dropped on load.
- **An answered request leaves the list but stays in the database** (`answered_at`), for an end-of-year look
  back at answered prayers. It cannot be un-answered from the app.
- **Editing changes the words only.** The group and "Hide my name" stay as posted. An edit leaves no mark.
- **Writing and editing are screens, not sheets** (2026-10-19). On an iPhone, a focused field in a sheet held
  at the bottom was lifted twice, once by vaul (by the keyboard's height) and once by iOS (scrolling the page
  to show the field), and went off the top of the screen (a member's screenshot). A field at the top of a plain
  page is one the keyboard never covers, on any iOS version. Saving slides back to the list, which reads
  itself again on arrival.
- **No "(you)" after my own name** (2026-10-19): elderly members read "(bạn)" as a mistake in their name. My
  requests still come first in each week.
- **The worship music plays only on the Prayer tab** and stops on leaving it: it is for praying over the list.
  It starts only on a tap (phones refuse sound otherwise). The bubble left of Play appears after 2 seconds on the
  tab, sways gently, never takes a tap, and goes once the music has played on that visit.
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
- **Requests are translated, and a translation is shown only after review** (2026-10-23): see Translations below.
- **Pages are cut by `created_at`**, not by offset, so a request posted while someone scrolls cannot shift
  the pages and show a row twice.

## Expected behavior
- The + opens "Lời xin cầu nguyện mới" as its own screen, the box at the top; Share slides back to the list
  with the request at the top, under the author's name. There is no "Hide my name" since 2026-10-20 (the
  user); requests posted anonymously before then still show "Anonymous".
- Above the list, held under the blue bar while scrolling: (the bell, for admins) Play, and the round +. Play
  starts the phone's next worship song and becomes Pause, and Back and Next grow out of it on either side
  inside a light grey pill as tall as the + (one group); Pause turns it back into Play and folds the pill away
  (0.3 s both ways; measured on `/ui`: 144 × 48 open, 48 and no grey shut, 2026-10-22); when a song ends the
  next one starts. After 2 seconds on the tab,
  a blue bubble left of Play says "Tôi muốn / cầu nguyện bây giờ" ("I want to / pray now", 2026-10-22) and sways sideways until the
  music is played.
- The list is divided by week ("This week", "Last week", "2 weeks ago", "3 weeks ago", then "Week of
  <date>"; a week starts on Sunday, church time). Within a week each person's requests sit together under
  their name: my own named requests first, then people in the order of their newest request; anonymous
  requests share one group (my anonymous ones stay there, or their place would give them away). Every
  request is at the left, mine included, under my name alone. Beside each name, the person's picture, or the
  default figure (always for anonymous requests).
  (This layout has not been looked at on any screen yet, 2026-10-08.)
- A request shows in full, as a grey bubble. No date and no group name on the list: the week label is the time.
- Someone else's request has a Pray button. After a tap it reads "Prayed" and is disabled until the phone's
  midnight on that device, for that user, for that request — including after closing and reopening the app. The author
  gets a notification on their devices with notifications turned on.
- Someone else's request has a round purple Pray chip beside it, a small gap to its right and level with its middle; after a tap it is a green tick that takes no taps, until midnight. Your own has a small round grey pencil button in the same place (32 across, two thirds of the Pray chip), which opens Answered / Edit / Delete / Cancel as a two-by-two grid.
  Answered and Delete both take it off the list at once; Edit slides in the edit screen, Save slides back.
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
- A request is written on its own screen opened by the round plus at the top right; sharing goes back to the list, a failure leaves the words in place.
- The edit screen for a request that is not mine, or no longer listed, answers 404.
- Before `profiles/schema.sql` section 6 and this file's 5b are run, the view has no `author_avatar` and the
  Prayer tab is empty (as with 5b before): run them together.
- The phone pauses the music by itself (a call, another app's sound): the button turns back to Play.
- **Not seen (2026-10-19):** any of this signed in, the music on an iPhone with the screen locked, the
  keyboard on the new screens on an iPhone. The toolbar and bubble were seen on `/ui` at 375 px.
- Two requests created in the same microsecond could straddle a page boundary and one be skipped. Ignored.

## Translations (2026-10-23, the user)
- **Posting and editing go through routes** (`/api/prayer/post`, `/api/prayer/edit`), because they set off an AI
  call. The route saves, answers 204, and only then (`after()`) sends **the text alone, never the author**, to the
  AI service, which answers its language (`vi`/`en`) and a translation into the other one. The server stores
  both with the service role and pushes "a translation is waiting" to everyone with `prayer.translations`.
- **Nothing reaches members unreviewed** (the user: free models are not reliable translators). The view sends a
  translation only once `translation_reviewed_at` is set; until then every reader sees the original.
- **The admin's lists** (Admin tab → "Translations"): first a row, "Past translations", to every approved one
  (newest first), then the waiting ones (oldest first). Each request shows its VI or EN badge, the translation under
  it, and: Approve (waiting ones: shows it as it is), the pencil (a screen to correct it: Submit approves the
  corrected words, Cancel leaves it as it was; both go back to the list it came from), and the circular arrow
  (Retry: asks the AI service again and waits for it). Answered and deleted requests drop off. A request the AI
  could not translate is listed with "No translation yet" and no Approve, for the admin to write it or retry.
- **Retry puts the translation back on the waiting list** (`reopen_prayer_translation`), keeping its words until
  the new ones arrive: if the AI service fails again ("Could not translate"), the old translation is still there to
  approve or correct. Readers see the original meanwhile, as for any translation waiting for review.
- **Past translations stay open to correction** (the user, 2026-10-23: members may say one reads badly): the
  pencil corrects one in place, Retry sends it back for review.
- **Only the server and reviewers write a translation.** Members have no grant on the three columns; reviewers
  use `review_prayer_translation`, which checks the permission. It also takes the words the reviewer read, so a
  translation of words the author changed meanwhile is never approved (it answers false: "Could not save").
- **An edit starts over:** the database clears the translation in the same update (a trigger), so an approved
  translation never shows under new words; the new words are translated and wait for review again.
- **Who sees what:** someone else's request in the other language, approved → the translation; everything else
  (my own, my language, not approved, language unknown) → as written (`shownText.ts`).
- **Requests from before** count as reviewed with no translation, so they show as written and never fill the list.
  The 20 there were on 2026-10-23 were translated by Claude in one SQL script, which approves them all once run;
  it is kept out of the repository because it quotes the requests (the user has it).
- **A translation is only ever written onto unreviewed words.** An edit that sends the same words clears nothing
  (the trigger fires on a change), so without that rule its translation would have replaced an approved one
  unseen (found in review, 2026-10-23).
- **Edge cases:** the AI service off, busy or unreadable → no translation, still listed for the admin (logged
  without the text); a translation the database refuses (over 2000 characters) is logged the same way. A translation still on its way when the author edits is dropped: it only lands on the words
  it was made from. The `after()` work shares the route's time limit on Netlify (~10 s); cut off there, it is the
  same as a failure.
- **Expected behavior:** `docs/sql-to-run-2026-10-23.sql` has to be run first; until it is, the Prayer tab shows
  no requests (the feed asks for the new columns). Seen 2026-10-23: with the first version of 5d run, posting from
  the app saved the request and answered at once; the AI service was not reachable from the server, so it waited
  with no translation, as designed. The AI service's `/translate` was tried with the real providers: a two-line
  Vietnamese request, an English one and an unaccented Vietnamese one were each recognised and translated in
  0.2–1.6 s (line breaks kept), and a 1000-character English one in 2.7 s. **Not seen:** the Admin tab's lists and
  Retry as an admin (the test account is not one), a push to a reviewer, `after()` on Netlify.

## Not built yet
- **Moderation:** removing someone else's request (`deleted_at` exists; on hold, backlog B24).
- **The end-of-year look back** at answered requests (backlog B19). The data is already being kept.

## Remove
Delete this folder, `src/app/prayer/`, `src/app/api/prayer/`, `src/app/admin/translations/` and the `// PRAYER` lines in
`src/app/admin/page.tsx`, `public/audio/`, the Prayer tab in `AppTabs.tsx`, `prayerTab`
in `src/components/strings.ts`, and the "prayer requests" block in `tests/rls.test.ts`. Run the DROP
statements at the bottom of `schema.sql`. The AI service's `translation/` package and `/translate` can stay or go.

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

## The bell (2026-10-14)
For someone with `prayer.reminders`, a bell sits left of the + on the Prayer tab and opens the weekly reminders
on their own screen (`src/app/prayer/reminders/page.tsx`, `PrayerReminderAdmin`); the Admin tab's section is
gone. The two sheets are calmer: the new request's words are inside the box; a request's options are one blue
"answered", a quiet "edit" and a small red "delete" that asks once (`OptionButtons`). NOT seen signed in.

## How many prayed, and a thank-you (2026-10-14)
- **My own requests** show "3 🙏" (`ui/CountPill`) between the bubble and the pencil. The count comes from
  `prayer_feed.prayer_count`. This reverses the 2026-10-06 decision that kept the count off the screen; the
  notification to the author stays.
- **Everyone's requests show it too (2026-10-22, the user):** the Pray button is a pill, "3 🙏", then "4 ✓" once
  prayed (`ui/Chip` `wide`; seen on `/ui`). Section 5c of `schema.sql` gives the count to every reader (5b gave
  it to the author only, so nobody could compare requests: given up on purpose). After a prayer the count goes
  up on screen at once (`usePrayerFeed.pray`). **Run 5c before the deploy** (`docs/sql-to-run-2026-10-22.sql`):
  until then the view gives others' requests no count, and their button would read "null".
- **Praying** plays a short reward on the chip that was tapped (`ui/Celebrate`): the tick pops in, a purple
  ring spreads and fades, "+1" floats up and fades; a light buzz on phones that allow it (`navigator.vibrate`,
  Android only). No confetti (the user's word). Only the tap that just happened celebrates, not a reload.
- **Before section 5b is run, the Prayer tab is empty** (the feed asks for a column the view does not have yet).
- Seen in `/ui` at phone width: the pill 32 px tall, the pencil's grey, level with it; the reward's three parts
  playing after a tap. NOT seen on the Prayer tab signed in.
