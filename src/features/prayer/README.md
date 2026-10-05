# prayer

Prayer requests shared inside a group: post one (with or without your name), pray for someone else's, and
see how many times you were prayed for.

System docs: `.claude/architecture.md`. Shape and conventions: `docs/adding-a-feature.md`.

## Setup
Run `features/groups/schema.sql` first if it has not been run, then this `schema.sql` in Supabase → SQL
Editor. Copy it from the editor, not from terminal output. It is **not** safe to run twice (plain `create`).

## Files
| Layer | File | Job |
|---|---|---|
| Data | `schema.sql` | Two tables, column grants, RLS, the `prayer_feed` view, `pray_for_request`, reminder seeds, DROPs |
| Types | `types.ts` | `PrayerRequest` (a row of the view), `NewPrayerRequest`, `FEED_COLUMNS`, `PAGE_SIZE`, `MAX_BODY_LENGTH` |
| Pure logic | `cooldown.ts` | `canPray`, `withoutExpired`, `COOLDOWN_MS`: the one-hour pause, worked out from timestamps |
| Device | `storage.ts` | When this device last prayed for each request, in localStorage, keyed by user id |
| Text | `strings.ts` | This feature's labels, and `prayedForYou(count)` |
| Browser API | `api.ts` | `getRequests`, `createRequest`, `markAnswered`, `deleteRequest`, `prayFor` |
| Server reads | `server/queries.ts` | `getLatestRequests(supabase)`: the first page |
| State | `hooks/usePrayerFeed.ts` | The list on screen: older pages, posting, answering, deleting, praying, one error flag |
| State | `hooks/usePrayerCooldown.ts` | Which requests this device may pray for now; one clock for all of them |
| State | `hooks/useWhenVisible.ts` | "Call this when the element scrolls into view" |
| UI | `components/PrayerBoard.tsx` | Connects the hooks to the components below |
| UI | `components/PrayerComposer.tsx` | The words, the group, "Hide my name" |
| UI | `components/PrayerCard.tsx` | One request: three lines and "more…", Pray, or the author's count and X |
| UI | `components/RequestOptions.tsx` | The author's dialog: Answered, Delete, Cancel |
| UI | `components/OlderRequestsMarker.tsx` | The end-of-list marker that loads the next page |
| Shell | `src/app/prayer/page.tsx`, `TabBar.tsx`, `src/components/strings.ts` | The Prayer tab |

No routes: nothing needs a secret or causes a side effect, so every call goes straight to Supabase.

## How anonymity is guaranteed
RLS hides **rows**, not columns. If members could read `prayer_requests`, any of them could open the browser
console and select `author_id` for an "anonymous" request. So:

1. Members have **no select grant** on the table beyond `id`, and a policy that shows them only their own ids.
2. Everything is read through the **`prayer_feed` view**, which returns `null` for the email of an anonymous
   request and carries no author id at all.
3. The view's `is_mine` column answers the one question the app needs the author for ("is this mine?"), so
   the X button and the prayer count can be shown to the author without sending anyone an id.
4. The author cannot be forged either: `author_id` and `author_email` have no insert grant and default from
   the login token.

What it does **not** hide: the service role (developers, later admins) still sees the author, on purpose.
And a small group can guess from timing or wording — no software fixes that.

## Decisions worth knowing
- **The view is the security.** It runs with its owner's rights (it must: members cannot read the table), so
  its `where` clause is what stops an outsider. Supabase's linter flags "security definer view"; here that
  is the design, and `tests/rls.test.ts` attacks it from a non-member and from a fellow member.
- **Praying is a database function, not an update.** With an update grant on `prayer_count`, one call could
  set it to a million. `pray_for_request` adds exactly one, for a request the caller can see and did not write.
- **The count is a number of prayers, not a list of people.** Who prayed is never stored. The same person
  praying again after an hour counts again, so "3 people prayed for you" can be the same person three times.
- **The one-hour pause lives on the device only** (decided). It stops accidental double taps, not a
  determined caller: someone who clears their storage or calls the function directly can add more (backlog B22).
- **The pause is a timestamp, not a timer.** Nothing counts down, so nothing is lost when the app closes.
  One 30-second clock tick plus `visibilitychange` re-reads the time; finished entries are dropped on load.
- **The author's delete is permanent; an admin's is soft** (`deleted_at`, hidden by the view).
- **No edit.** The author's options are Answered, Delete, Cancel. Marking as answered cannot be undone.
- **The list does not update live.** It is what the server sent when the page opened, plus this member's own
  actions. Reopening the tab refreshes it.
- **Requests are not translated**: members write them, and they are shown as written.
- **Pages are cut by `created_at`**, not by offset, so a request posted while someone scrolls cannot shift
  the pages and show a row twice.

## Expected behavior
- With no group joined: "Join a group first…" and no composer.
- Posting puts the request at the top. With "Hide my name", others see "Anonymous"; the author sees
  "Anonymous (you)".
- A long request shows three lines and "more…". Whether the link appears is estimated from length
  (over 120 characters or 3 line breaks), so a medium request on a narrow phone can clip without one.
- Someone else's request has a Pray button. After a tap it reads "Prayed" and is disabled for an hour on
  that device, for that user, for that request — including after closing and reopening the app.
- The author's own request has no Pray button. Once prayed for, it shows "N people prayed for you".
  Nobody else sees the number.
- X on your own request opens Answered / Delete / Cancel. Delete asks once more. An answered request shows
  "✓ Answered" and can no longer be prayed for.
- Twenty requests load first; reaching the bottom loads twenty more until none are left.

Verified 2026-10-05 **in a rolled-back transaction, not in the app**: 27 permission checks (post, forge,
read the table, anonymity, count privacy, outsider, signed-out visitor, pray, answer, delete). The screen
itself has not been exercised yet: `schema.sql` must be applied first.

## Edge cases
- A second device, or a second browser, has its own pause: the same person can pray from each.
- The pause is not undone when a request is deleted; the entry simply expires.
- If the device's clock is moved back, a pause recorded "in the future" is treated as finished.
- A prayer that fails to reach the server cancels its pause, so the member can try again.
- Two requests created in the same microsecond could straddle a page boundary and one be skipped. Ignored.

## Not built yet (admin feature)
Sending the reminders in `prayer_reminders` (needs a scheduler and the church's timezone, backlog B21),
editing them, and removing a member's request (`deleted_at`). A push or an "unseen" marker for "someone
prayed for you" is backlog B23: today the author sees the number when they open the tab.

## Remove
Delete this folder and `src/app/prayer/`, the Prayer tab in `TabBar.tsx`, `prayerTab` in
`src/components/strings.ts`, and the "prayer requests" block in `tests/rls.test.ts`. Run the DROP statements
at the bottom of `schema.sql`.
