# staff

Who the church's staff are and how to reach them: one page, opened from a tile on Home (not a tab: it is
rarely needed). Each person is a contact card: photo, name in bold, role in grey, phone number (2026-10-19, the user).

System docs: `.claude/architecture.md`. Shape and conventions: `docs/adding-a-feature.md`.

## Setup
1. Supabase → SQL Editor: run `schema.sql` (seeds "Ban điều hành" with Pastor Khai), then the two staff lines of
   `features/approval/schema.sql` section 3. Safe to re-run.
2. To change people or headings: `edit-staff.sql`, one block at a time, placeholders filled in. No deploy.
   A photo: upload it in Storage → `staff-photos` (public bucket, made by `schema.sql`), copy its URL, run
   `edit-staff.sql` block 3b. A path under `public/` also works but needs a deploy.
**Waiting on the user (2026-10-19):** Pastor Khai's number, photo, and the Vietnamese spelling of his name and title.

## Files
| Layer | File | Job |
|---|---|---|
| Data | `schema.sql` | `staff_sections` (headings), `staff_people` (typed once), `staff_placements` (who is under which heading), read-only RLS, the photo bucket, the seed |
| Data | `edit-staff.sql` | The user's copy-paste scripts: see, edit, add, move, remove |
| Types | `types.ts` | `StaffSection` (heading + cards), `StaffMember`: role, name, phone, photo |
| Reads | `reads.ts` | `getStaffSections(supabase)`: every heading with its cards, in order, one trip; used by both sides below |
| Server | `server/queries.ts` | `getStaffSections` for the page (from `reads.ts`) |
| Browser API | `api.ts` | `getStaffSections()`: the same read again, for the list to refresh itself on arrival (`useFresh`, 2026-10-22) |
| Text | `strings.ts` | The page's title, also the Home tile's |
| UI | `components/StaffDirectory.tsx` | Per heading: `ui/SectionHeading` `large`; per person: `ui/PersonCard` with `ui/Avatar` `large` and `PhoneNumber` |
| Shell | `src/app/staff/page.tsx`, `src/components/HomeTiles.tsx` | The page (loads the rows); the tile (line marked `STAFF`) |

## Decisions worth knowing
- **Rows in Supabase, edited by SQL** (the user, 2026-10-19, replacing "a list in code" from earlier that day):
  changes without a deploy. Nobody writes from the app, so there are no write rules to get wrong and no editor
  screen. The cost: changes need the SQL Editor.
- **Photos in a public bucket** (`staff-photos`, 1 MB, JPEG/PNG/WebP): a staff photo is website material,
  and a public address needs no signing code. Uploads only from the dashboard: no write policies.
- **People apart from headings** (the user, 2026-10-19): a person is typed once, then placed under a heading by
  name alone; the same person can sit under several headings, and one edit shows everywhere. The cost: adding
  someone new is two scripts (person, then placement). People are found by their exact `name_vi` (unique).
- **Order is a `position` number**, on headings and on placements, smaller first.
- **The tile sits above Admin**, with a phone-book photo (`public/images/home/staff.webp`, the user, 2026-10-19).
- **The number** is the shared `PhoneNumber`: a tap shows Call, Text and Copy (as on an event's page).

## Expected behavior
- Home: a "Danh bạ" / "Staff" tile (the page title too) after Groups, before Admin. It slides in `/staff` with a back arrow.
- `/staff`: "Ban điều hành" big and bold, then a card: a large round photo (the default figure until one is
  set), "Mục sư Khai" in bold, "Mục sư điều hành" in grey, and the number in blue; a tap on it shows Gọi / Nhắn tin / Sao chép.
- A person with no number shows no number line. Before `schema.sql` has run, the page is empty (no error).
- An edit in the SQL Editor shows on the next open of `/staff`.
- **NOT seen** on `/staff` with the tables in place (SQL not run yet).

## Remove
Delete this folder, `src/app/staff/`, the `STAFF` lines in `src/components/HomeTiles.tsx`, and
`public/images/staff/` once it exists; empty Storage → `staff-photos`; run the Undo lines at the bottom of `schema.sql`.
