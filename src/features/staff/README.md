# staff

Who the church's staff are and how to reach them: one page, opened from a tile on Home (not a tab: it is
rarely needed). Each person is their role as a heading, then a card with their photo, name and phone number.

System docs: `.claude/architecture.md`. Shape and conventions: `docs/adding-a-feature.md`.

## Setup
Nothing to run. To fill in a person: their line in `directory.ts` (name in both languages, phone as people
write it), and their photo, a square JPEG of about 400 pixels, in `public/images/staff/`.
**Waiting on the user (2026-10-19):** Pastor Khai's number, photo, and the Vietnamese spelling of his name and
title ("Mục sư điều hành", "Mục sư Khai" are placeholders).

## Files
| Layer | File | Job |
|---|---|---|
| Types | `types.ts` | `StaffMember`: role, name, phone, photo |
| Data | `directory.ts` | `STAFF`, the list, in page order |
| Text | `strings.ts` | The page's title, also the Home tile's |
| UI | `components/StaffDirectory.tsx` | Per person: the role (`ui/SectionHeading` `large`), then `ui/PersonCard` with `ui/Avatar` `large` and `PhoneNumber` |
| Shell | `src/app/staff/page.tsx`, `src/components/HomeTiles.tsx` | The page; the tile (line marked `STAFF`) |

## Decisions worth knowing
- **A list in code, not a table** (the user, 2026-10-19): a few people who change a few times a decade. A line
  of code needs no rules, no editor screen and no tests of who may write it. The cost: a deploy to change it.
- **The tile sits above Admin** and has no photo yet (its icon on grey, like Admin's).
- **The number** is the shared `PhoneNumber`: a tap shows Call, Text and Copy (as on an event's page).

## Expected behavior
- Home: a "Ban mục vụ" / "Staff" tile after Groups, before Admin. It slides in `/staff` with a back arrow.
- `/staff`: "Mục sư điều hành" big and bold, then a card: a large round photo (the default figure until one is
  set), "Mục sư Khai" in bold, and the number in blue; a tap on it shows Gọi / Nhắn tin / Sao chép.
- A person with no number yet shows no number line.
- Seen on `/ui` at 375 px: the heading, the card with and without a photo, the three choices after a tap.
  **NOT seen** on `/staff` signed in.

## Remove
Delete this folder, `src/app/staff/`, the `STAFF` lines in `src/components/HomeTiles.tsx`, and
`public/images/staff/` once it exists.
