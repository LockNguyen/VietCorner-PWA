# events

The church schedule: what is happening, when, and what has been cancelled. Members read it; admins will
write it (admin feature, built next).

System docs: `.claude/architecture.md`. Shape and conventions: `docs/adding-a-feature.md`.

## Setup
Run `schema.sql` in Supabase → SQL Editor. It creates four tables, their policies, and seed rows covering
every case the list has to handle (see **Seed data** below).

## Files
| Layer | File | Job |
|---|---|---|
| Data | `schema.sql` | Four tables, grants, RLS, seeds, and the DROP statements |
| Types | `types.ts` | `EventRow` (when), `EventText` (what it says), `ChurchEvent`, `Occurrence` (one date) |
| Pure logic | `occurrences.ts` | Expands a weekly event into dates, applies cancellations, sorts the schedule |
| Text | `strings.ts` | This feature's labels. Event titles are data, not labels. |
| Server reads | `server/queries.ts` | `getUpcomingSchedule(supabase, language)` |
| UI | `components/EventSchedule.tsx` | Groups the dates by day, opens the details panel |
| UI | `components/EventRow.tsx` | One line: time, title, cancelled, group badge |
| UI | `components/EventDetails.tsx` | The overlay: full date, end time, location, description, repeats |
| Shell | `src/app/events/page.tsx`, `TabBar.tsx` | The Events tab (`// I18N` for the title) |

No `api.ts` and no routes: members only read, and reads go straight to Supabase under RLS. Both arrive with
the admin feature.

## Four tables, on purpose
| Table | Why separate |
|---|---|
| `events` | When it happens. Structure only, so the list query stays small |
| `event_texts` | One row **per language**. A member downloads their own; a missing one falls back to the other |
| `event_cancellations` | One skipped week of a recurring event. A row exists only when a week is called off |
| `event_reminders` | Admin configuration. **No grant to `authenticated`**, so it never reaches a member's device |

## Decisions worth knowing
- **A weekly event is stored once**, not copied per week. `occurrences.ts` expands it for the next 8 weeks,
  which keeps an endless weekly event from filling the table and the screen.
- **Two kinds of cancellation:** `events.canceled_at` calls off the whole series; a row in
  `event_cancellations` skips one week. Members see both, struck through, because "nothing on the list" and
  "it was cancelled" mean different things to someone deciding whether to come.
- **Visibility is in RLS, not in the query:** no group means church-wide, a group means its members only.
  Soft-deleted rows are excluded by the policy itself, so they are invisible even to a direct Supabase call.
- **This feature reads chat's `group_members` table.** That is the one place the two touch, and it is why
  removing chat breaks group-scoped events (see Remove). Extracting a shared `groups` feature is backlog B20.
- **Times are stored as `timestamptz`** and rendered in the device's local time, which is right for one
  congregation in one place and wrong the day a group meets abroad.

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
- The Events tab lists every upcoming date, oldest first, grouped under Today / Tomorrow / a weekday.
- A cancelled date is struck through and marked, not hidden.
- Group events show a small "Group event" badge and only appear for members of that group.
- Tapping a row opens a panel with the full date, end time, location and description; tapping outside closes it.
- With no events (or before `schema.sql` is run), the page shows "No events in the next weeks."

## Not built yet (admin feature)
Creating, editing and cancelling events; sending the push on cancellation; and acting on `event_reminders`,
which needs a scheduler — Supabase `pg_cron` calling a route, as decided.

## Remove
Delete this folder, `src/app/events/`, the Events tab in `TabBar.tsx` and `eventsTab` in
`src/components/strings.ts`, then run the DROP statements at the bottom of `schema.sql`.
