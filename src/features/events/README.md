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
| Server reads | `server/queries.ts` | `getUpcomingSchedule` (members), `getManagedEvents` (admin section) |
| Server logic | `server/changeSchedule.ts` | `cancelDate`, `restoreDate`, `cancelForGood`: each records the change as the **user**, then notifies |
| Server logic | `server/sendDueReminders.ts` | Called by the scheduler: sends each due reminder once, per language |
| Server logic | `server/audience.ts` | Who is told about an event: the group, or everyone with notifications on |
| Server logic | `server/notifyScheduleChange.ts` | **Admin** client: who could see the event → one push per language (`// PUSH`, `// I18N`) |
| Routes | `src/app/api/events/cancel/route.ts` | POST cancels, DELETE undoes. Verify (401) → validate (400) → change (403 when refused) → 204 |
| UI | `components/EventSchedule.tsx`, `EventRow.tsx`, `EventDetails.tsx` | The members' schedule: days, one line per date, the details panel |
| UI | `components/EventAdmin.tsx` | The admin section: the list, and which event the editor is open on |
| UI | `components/EventAdminRow.tsx` | One event in the list, with its "Edit event" button |
| UI | `components/EventEditor.tsx` | The panel: the form, the next dates, the red button |
| UI | `components/EventForm.tsx` | The fields, with English and Vietnamese side by side |
| UI | `components/EventReminders.tsx`, `EventReminderChoice.tsx` | Three ticks: 1 day, 2 hours, 30 minutes before; one tick |
| UI | `components/EventDates.tsx`, `EventDateRow.tsx` | The next four dates; one date, with Cancel or Undo |
| Shell | `src/app/events/page.tsx`, `AppTabs.tsx` | The Events tab |
| Shell | `src/app/admin/page.tsx` | Shows `EventAdmin` to someone with `events.manage` |

## Four tables, on purpose
| Table | Why separate |
|---|---|
| `events` | When it happens. Structure only, so the list query stays small |
| `event_texts` | One row **per language**. A member downloads their own; a missing one falls back to the other |
| `event_cancellations` | One skipped week of a recurring event. A row exists only when a week is called off |
| `event_reminders` | Admin configuration: which reminders an event has. Only `events.manage` can read or write it, so it never reaches a member's device. |

## Decisions worth knowing
- **A weekly event is stored once**, not copied per week. `occurrences.ts` expands it for the next 8 weeks,
  which keeps an endless weekly event from filling the table and the screen.
- **Two kinds of cancellation:** `events.canceled_at` calls off the whole series; a row in
  `event_cancellations` skips one week. Members see both, struck through, because "nothing on the list" and
  "it was cancelled" mean different things to someone deciding whether to come.
- **Visibility is in RLS, not in the query:** no group means church-wide, a group means its members only.
  Soft-deleted rows are excluded by the policy itself, so they are invisible even to a direct Supabase call.
- **The policy reads `group_members`, which belongs to the `groups` feature.** That is a dependency in SQL
  only: nothing here imports that folder. A removed group's events disappear with it, for managers too.
- **Every date and time is church time** (`America/New_York`), whatever the device or server.
  `src/lib/churchTime.ts` is the one file that knows the wall clock (shared with prayer), so:
  - a weekly event keeps its hour when the clocks change (a week is 167 or 169 hours twice a year);
  - a cancelled week is recorded and matched by the church's calendar date, not UTC's;
  - the server and a phone print the same words, and a member abroad still reads the hour to be at church.
- **Managing needs `events.manage`**, read from the login token (the `permissions` README). A manager sees
  every group's events, on their own Events tab too (decided 2026-10-06).
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
- **Reminders are three fixed choices** (1 day, 2 hours, 30 minutes before), ticked in the Edit panel and
  applied to every date of the event. A reminder is due from its moment for one hour and never after the
  date has started; cancelled dates, cancelled events and removed groups get none. It reaches the same
  people a cancellation would, in their language, once (the push README explains the clock and "once").
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
  row shows the time where a picture would be, the title, and beneath it the location and whether it is a
  group event.
- A cancelled date is grey, struck through and says "Cancelled" beneath, not hidden.
- Group events show a small "Group event" badge and only appear for members of that group.
- Tapping a row opens a panel with the full date, end time, location and description; tapping outside closes it.
- With no events (or before `schema.sql` is run), the page shows "No events in the next weeks."
- **Admin tab → Events** (with `events.manage`): every upcoming event in every group, soonest first, each with
  an "Edit event" button. It opens a panel: the fields (English and Vietnamese columns; Save is disabled,
  with the reason shown, until there is a title in one language and a start), then the next four dates, then
  a red "Cancel this event permanently". On a weekly event each date has Cancel, and a cancelled date has
  Undo in its place; the panel stays open and shows the change. A one-off event's date has no button.
  "New event" opens the same panel with the fields only.
- Cancelled for good: gone from the admin list at once; on members' schedules struck through for a week,
  then absent (observed 2026-10-06 against the real database: cancelled 2 days ago shows, 8 days ago does not).
- In the Edit panel, "Remind members" has three ticks; a tick saves at once and the panel stays open.
  A new event has none until it is saved and opened again.
- A ticked reminder arrives as the event's title and "Wednesday 14 October, 7:00 PM", up to 15 minutes
  after its moment. **Not yet observed: needs the deployed site and the cron job.**
- `POST /api/events/cancel` while signed out → `401 {"error":"Not signed in"}` (observed 2026-10-06).
- A cancellation sends each member who could see the event one push in their language: the title, then
  "Cancelled: Wednesday 14 October, 7:00 PM", or "Cancelled: until further notice" for a whole weekly event.
  Undo sends "Back on: Wednesday 14 October, 7:00 PM".

Verified 2026-10-06: the rules in a rolled-back transaction (16 checks) and the time and form logic in unit
tests. **Not yet exercised: the admin screen itself, and a cancellation push arriving on a phone.**

Verified against the seeds on 2026-10-05 by running `getUpcomingSchedule` as real signed-in users:
- A Bible Study member gets 20 dates, a non-member 12: the 8 missing ones are exactly the group's.
- Only the second Bible study week is cancelled; the weeks around it are not.
- The Vietnamese-only event shows its Vietnamese title to an English reader.
- The past event and the soft-deleted one never come back, and `event_reminders` answers "permission denied".

## Not built yet
Bringing back an event that was cancelled for good.

## Remove
Delete this folder, `src/app/events/`, the Events tab in `AppTabs.tsx` and `eventsTab` in
`src/components/strings.ts`, then run the DROP statements at the bottom of `schema.sql`.
