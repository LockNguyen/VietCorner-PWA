# events

The church schedule: what is happening, when, and what has been cancelled. Members read it; whoever holds
the `events.manage` permission writes it, from the Admin tab.

System docs: `.claude/architecture.md`. Shape and conventions: `docs/adding-a-feature.md`.

## Setup
Run `features/permissions/schema.sql` and `features/groups/schema.sql` first, then this `schema.sql` in
Supabase → SQL Editor. Copy it from the editor, not from terminal output: PowerShell
garbles the Vietnamese seed text on the way to the clipboard. It creates four tables, their policies, and seed rows covering
every case the list has to handle (see **Seed data** below).

## Files
| Layer | File | Job |
|---|---|---|
| Data | `schema.sql` | Four tables, grants, RLS (members read, managers write), seeds, and the DROP statements |
| Types | `types.ts` | `EventRow`, `EventText`, `ChurchEvent`, `Occurrence`; for the admin section `ManagedEvent`, `EventDraft`, `MANAGE_EVENTS` |
| Pure logic | `occurrences.ts` | Expands a weekly event into dates, applies cancellations, sorts the schedule |
| Pure logic | `reminders.ts` | `dueReminders`: which reminders of an event should go out now |
| Pure logic | `formatting.ts` | Dates and times in the reader's language, always in church time |
| Pure logic | `draft.ts` | The event form's contents ⇄ database rows; why a draft cannot be saved yet |
| Text | `strings.ts` | This feature's labels and the form's `PROBLEMS`. Event titles are data, not labels. |
| Browser API | `api.ts` | `saveEvent`, `setReminder`, `cancelEvent` (POST `/api/events/cancel`), `restoreDate` (DELETE, same route) |
| Server reads | `server/queries.ts` | `getScheduledEvents` (the schedule, one call to `upcoming_events()`), `getManagedEvents` (the admin section and the editor, one call to `managed_events()`) |
| Server logic | `server/changeSchedule.ts` | `cancelDate`, `restoreDate`, `cancelForGood`: each records the change as the **user**, then notifies |
| Server logic | `server/sendDueReminders.ts` | Called by the scheduler: sends each due reminder once, per language |
| Server logic | `server/notifyScheduleChange.ts` | **Admin** client: every approved member → one push per language (`// PUSH`, `// I18N`, `// PERMISSIONS`). Switched off (`eventChangePush`) |
| Routes | `src/app/api/events/cancel/route.ts` | POST cancels, DELETE undoes. Verify (401) → validate (400) → change (403 when refused) → 204 |
| UI | `components/EventThumbnail.tsx` | The editor's picture section: the picture, choose or replace, remove |
| UI | `components/EventSchedule.tsx`, `EventRow.tsx`, `EventDetails.tsx` | The members' schedule: days, one line per date, the details sheet |
| State | `hooks/useEventChanges.ts` | Every change the editor makes: the call, then reload or go back to the list, then a banner |
| UI | `components/EventAdmin.tsx` | The admin section: "New event", then the list; each row opens the editor's screen |
| UI | `components/EventAdminRow.tsx` | One event in the list: a row that opens its editor |
| UI | `components/EventEditor.tsx` | The editor's screen: the form, the reminders, the next dates, the red button |
| UI | `components/EventForm.tsx` | The fields; each text in English and then Vietnamese |
| UI | `components/EventReminders.tsx`, `EventReminderChoice.tsx` | Three switches: 1 day, 2 hours, 30 minutes before; one switch |
| UI | `components/EventDates.tsx`, `EventDateRow.tsx` | The next four dates; one date, with Cancel or Undo |
| Shell | `src/app/events/page.tsx`, `AppTabs.tsx` | The Events tab |
| Shell | `src/app/admin/page.tsx` | Shows `EventAdmin` to someone with `events.manage` |
| Shell | `src/app/admin/events/[eventId]/page.tsx` | The editor's screen for one event, or for `new`; 404 without `events.manage` |

## Four tables, on purpose
| Table | Why separate |
|---|---|
| `events` | When it happens. Structure only, so the list query stays small |
| `event_texts` | One row **per language**. The schedule carries every language an event has; the screen shows the reader's, or the other one when theirs is missing |
| `event_cancellations` | One skipped week of a recurring event. A row exists only when a week is called off |
| `event_reminders` | Admin configuration: which reminders an event has. Only `events.manage` can read or write it, so it never reaches a member's device. |

## Decisions worth knowing
- **A weekly event is stored once**, not copied per week. `occurrences.ts` expands it for the next 8 weeks,
  which keeps an endless weekly event from filling the table and the screen.
- **Two kinds of cancellation:** `events.canceled_at` calls off the whole series; a row in
  `event_cancellations` skips one week. Members see both, struck through, because "nothing on the list" and
  "it was cancelled" mean different things to someone deciding whether to come.
- **Every event is for the whole church** (decided 2026-10-12, `schema.sql` section 3d): admins no longer
  limit an event to a group, and events once saved for one group show to everyone. `events.group_id` is
  still in the table and nothing reads or writes it.
- **Visibility is in RLS, not in the query:** every approved member reads every event (the `approval`
  README has the "approved" half). Soft-deleted rows are excluded by the policy itself, so they are
  invisible even to a direct Supabase call.
- **Every date and time is church time** (`America/New_York`), whatever the device or server.
  `src/lib/churchTime.ts` is the one file that knows the wall clock (shared with prayer), so:
  - a weekly event keeps its hour when the clocks change (a week is 167 or 169 hours twice a year);
  - a cancelled week is recorded and matched by the church's calendar date, not UTC's;
  - the server and a phone print the same words, and a member abroad still reads the hour to be at church.
- **Managing needs `events.manage`**, read from the login token (the `permissions` README). A manager sees
  the same schedule as everyone else.
- **Saving an event is several requests, not one transaction** (the event, then each language's text). If a
  later one fails the event exists with older or missing text; the form stays open and saving again
  finishes it. An event with no text at all is left off the members' schedule.
- **A language without a title is not stored.** Its readers fall back to the other language.
- **Two kinds of cancelling, with different endings** (decided 2026-10-06):
  - *One date* of a weekly event. It can be undone: the Cancel button becomes Undo. Members are told both times.
  - *The whole event, for good.* This is the app's "delete": it leaves the admin list at once and cannot be
    brought back from the app. Members are told, see it struck through for **one more week**
    (`DAYS_A_CANCELLED_EVENT_STAYS`), and then it is gone. The row is kept (`canceled_at`).
  Neither asks for confirmation. There is no separate Remove button; `deleted_at` still exists for hiding
  an event from everyone at once, by hand in the dashboard.
- **Reminders are three fixed choices** (1 day, 2 hours, 30 minutes before), switched on in the editor and
  applied to every date of the event. A reminder is due from its moment for one hour and never after the
  date has started; cancelled dates and cancelled events get none. It reaches every approved member, in
  their language, once (the push README explains the clock and "once").
  **Switched off for now** (`SWITCHES.eventReminders`): nothing is sent and the editor hides the switches.
- **Every cancellation is its own notification.** They carry no push topic, so the one-minute pause does not
  apply and one never replaces another: two dates called off in a minute are two notifications.
- **Cancelling goes through a route** because it notifies. An update or delete that RLS forbids is not an
  error, it just matches no row, so the server asks for the row back and treats "nothing" as refused.
  Without that check anyone could make the server notify the whole church.

## Seed data (what each row proves)
| Row | Case |
|---|---|
| Church picnic | The normal one: both languages, end time, location |
| Prayer evening | No end time, no location — the list must not show empty fields |
| Sunday service | Weekly, never ends |
| Bible study | Weekly, group-only, ends in two months, **next week cancelled** |
| Youth outing | Cancelled permanently, still listed and struck through |
| Last week's meeting | Already past: must not appear |
| Tĩnh nguyện buổi sáng | Vietnamese only: an English reader sees the Vietnamese title, not a blank |
| Deleted by an admin | Soft-deleted: invisible to members |

## Expected behavior
- The Events tab lists every upcoming date, oldest first, grouped under Today / Tomorrow / a weekday. Each
  row starts with the time in bold, in a box of fixed width ("7:00" over "PM"), then the picture, then the
  title with the location beneath. Times, pictures and titles line up down
  the list.
- A cancelled date is grey, struck through and says "Cancelled" beneath, not hidden.
- Tapping a row opens a sheet with the full date, end time, location and description; Close, Escape or a tap
  outside puts it away.
- With no events (or before `schema.sql` is run), the page shows "No events in the next weeks."
- **Admin tab → Events** (with `events.manage`): a "New event" row, then every upcoming event,
  soonest first. A row opens that event's own screen (`/admin/events/<id>`) with a back arrow: the fields
  (title, location and description, each in English and then Vietnamese), then "Remind members", the next
  four dates, and a red "Cancel this event permanently". Save with something missing says what, in red under
  the field concerned, and from then on as the fields change. Save goes back to the Admin tab. On a weekly
  event each date has Cancel, and a cancelled date has Undo in its place; the screen stays and shows the
  change. A one-off event's date has no button. "New event" opens the same screen with the fields only.
  Back with unsaved changes loses them without asking.
  **The new screen has not been seen signed in (2026-10-08); its parts were checked in `/ui`.**
- Cancelled for good: gone from the admin list at once; on members' schedules struck through for a week,
  then absent (observed 2026-10-06 against the real database: cancelled 2 days ago shows, 8 days ago does not).
- In the editor, "Remind members" has three switches; a switch saves at once and the screen stays.
  A new event has none until it is saved and opened again.
- A switched-on reminder arrives as the event's title and "Wednesday 14 October, 7:00 PM", up to 15 minutes
  after its moment. **Not yet observed: needs the deployed site and the cron job.**
- `POST /api/events/cancel` while signed out → `401 {"error":"Not signed in"}` (observed 2026-10-06).
- **Switched off for now** (`SWITCHES.eventChangePush`): cancelling and undoing still save, and tell nobody.
  When on, a cancellation sends every approved member one push in their language: the title, then
  "Cancelled: Wednesday 14 October, 7:00 PM", or "Cancelled: until further notice" for a whole weekly event.
  Undo sends "Back on: Wednesday 14 October, 7:00 PM".

Verified 2026-10-06: the rules in a rolled-back transaction (16 checks) and the time and form logic in unit
tests. **Not yet exercised: the admin screen itself, and a cancellation push arriving on a phone.**

Verified against the seeds on 2026-10-05 by running the schedule read of that time as real signed-in users:
- A Bible Study member got 20 dates, a non-member 12 (the group's 8 were hidden then; since 2026-10-12 everyone gets all of them).
- Only the second Bible study week is cancelled; the weeks around it are not.
- The Vietnamese-only event shows its Vietnamese title to an English reader.
- The past event and the soft-deleted one never come back, and `event_reminders` answers "permission denied".

## Not built yet
Bringing back an event that was cancelled for good.

## Remove
Delete this folder, `src/app/events/`, the Events tab in `AppTabs.tsx` and `eventsTab` in
`src/components/strings.ts`, then run the DROP statements at the bottom of `schema.sql`.

## How the schedule loads (2026-10-09)
- **One trip.** The page calls the database function `upcoming_events(until, cancelled_since)` once. It
  returns each visible event with its words in every language and its called-off weeks. Before, the page
  made four or five reads in a row (measured on the live site: 447-851 ms per tap, the slowest tab).
- **The function opens nothing.** It runs with the caller's rights, so the policies in `schema.sql` decide
  what it returns, exactly as for a direct read. `tests/rls.test.ts` calls it as an outsider, a member, a
  manager and signed out, with the widest dates a caller could choose.
- **The list refreshes itself.** `EventSchedule` shows what the page loaded, then calls the same function
  from the browser (`api.getSchedule`) on arrival and when the app returns to the foreground (`useFresh`).
  This is what will let a kept copy of the page appear at once and still become current.
- **Expanding and translating happen on the phone** (`scheduleOf`, pure and tested): weekly events into
  dates, and each event into the reader's language. So switching language needs no new read.
- **Both languages are downloaded** (changed from "only the reader's"): a few dozen short texts, and it is
  what makes the two points above possible.
- Before section 3b of `schema.sql` is run, the schedule is empty.- **The admin list is one trip too** (`managed_events()`, section 3c of `schema.sql`): every event that can
  still be managed, with its words, called-off weeks and reminder choices. It was four reads. The editor
  screen uses the same read. A member calling it gets no reminders and only the events they may see.
- Before section 3c is run, the Admin tab lists no events and the editor answers 404.

## Church-wide only, and quiet (2026-10-12)
- The event form has no "For" field; the admin list and the schedule say nothing about groups.
- Both kinds of notification are switched off in `src/lib/switches.ts`: schedule changes
  (`eventChangePush`, checked in `server/changeSchedule.ts`) and reminders (`eventReminders`, checked in the
  reminders route and in `EventEditor`). Turning one back on is setting it to `true`.
- An existing database needs section 3d of `schema.sql`.
- `tests/rls.test.ts` expects an event that still carries a group to be visible to a member outside it.
- **Not exercised (2026-10-12):** the SQL is not run yet, so neither the security tests nor any signed-in screen.
## The event's picture (2026-10-12)
- **What:** the small picture that starts an event's row on the schedule. Whoever holds `events.manage` sets it,
  replaces it and removes it, from the event's editor (for an event that already exists; a new one is saved first): a box that chooses a picture (saved at once, with a turning
  circle while it uploads), and "Remove the picture". Without one, the row shows a plain grey tile.
- **Where it is kept:** the file in the public Storage bucket `event-thumbnails`, its path in
  `events.thumbnail_path`.
- **Public, on purpose** (unlike a group's activity photos, which are private): this picture is on every
  row of a list, and a public address lets the phone keep it instead of downloading it at every visit. It
  is one picture an admin chose to stand for the event. Anyone holding a file's address can open it; the
  address is two random ids, and nobody but a manager can list the bucket.
- **A new picture is a new file with a new name**, then the old file is erased: a phone that kept the old
  address can never show the old picture in place of the new one.
- **Shrunk on the phone** to 400 pixels, about 30 KB (`src/lib/shrinkImage.ts`). The bucket refuses
  anything over 200 KB or not a JPEG.
- **Order of a change:** the file, then the path on the row, then the old file. A failure in between leaves
  a file nobody sees, never a row pointing at nothing.
- An existing database needs section 3e of `schema.sql`, then 3b and 3c again (both now return `thumbnail_path`).
- `tests/rls.test.ts`, "thumbnails": a manager sets and removes; a member or a waiting account cannot
  upload, change the path or erase the file; the bucket refuses a non-JPEG and an oversized file.
- **Not exercised (2026-10-12):** the SQL is not run, so neither the security tests nor the screen.
