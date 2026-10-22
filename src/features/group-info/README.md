# group-info

The Groups tab: every group of the church, and a sheet about each one: how many people, when and where it
meets, notes, and its pictures. Admins keep the details; a group's own people add its pictures.

System docs: `.claude/architecture.md`. Shape and conventions: `docs/adding-a-feature.md`.

## Setup
1. Run `features/groups/schema.sql` first (section 2c included: `groups.member_count`).
2. Run this `schema.sql`, all of it (safe to run again). Section 5 also makes the private storage bucket
   `group-photos` and its three rules.
3. Run the `group_info` and `group_photos` lines of `features/approval/schema.sql` section 3
   ("Approved accounts only").

## Files
| Layer | File | Job |
|---|---|---|
| Data | `schema.sql` | `group_info`, `group_photos`, `may_add_group_photo()`, `group_directory()`, the bucket and its rules, grants, RLS, the DROPs |
| Types | `types.ts` | `DirectoryGroup`, `DetailField`, `Photo`, `NewPhoto`, `photoPaths`, and every limit and size, each with its why |
| Browser API | `api.ts` | `getGroupDirectory`, `saveGroupDetail` (one detail), `saveMemberCount`, `getPhotos` (a page, signed), `addPhoto`, `removePhoto` |
| Server reads | `server/queries.ts` | `getGroupDirectory` |
| State | `hooks/useGroupPhotos.ts` | A group's pictures: the first page, more at the end, add, remove |
| UI | `components/GroupDirectory.tsx` | The cards; a tap opens the group's page |
| UI | `components/GroupPage.tsx` | A group's page (`/groups/<id>/about`), shaped like an event's: big picture, when / contact with icons, notes, pictures; admins get a round pencil held under the top bar (`ui/Toolbar`) |
| UI | `components/GroupDetail.tsx` | One labelled line, with a pencil for a group manager |
| UI | `components/GroupDetailForm.tsx` | One line as a box, with Save and Cancel |
| UI | `components/GroupPhotos.tsx` | The strip, the large view, a + square first in the strip that opens "Add a photo" (the group's people, managers) and "Remove this photo" (managers) |
| UI | `components/PhotoStripEnd.tsx` | The marker after the last picture: scrolled into view, it loads more |
| UI | `components/AddPhotoForm.tsx` | The picture, an optional date, an optional line of words |
| Text | `strings.ts` | Labels. What a group writes is data |
| Shell | `src/app/groups/page.tsx` (`// GROUP-INFO` lines) | Draws this list, or the old one when `oldGroupsPage` is on |
| Shared UI | `src/components/ui/PhotoStrip.tsx`, `PhotoThumb.tsx`, `PhotoAddTile.tsx`, `Lightbox.tsx` | Built for this feature; shown on `/ui` |

## Decisions worth knowing
- **It replaces the old Groups page, which is switched off, not deleted** (`SWITCHES.oldGroupsPage`). The
  old list (rows that ask to join or open a chat) belongs to `groups` and is still there.
- **`groups` is depended on in SQL only**, the way events and prayer once did: `group_directory()` joins
  `groups`, `group_members` and `group_info`. Nothing here imports that folder.
- **One read for the page** (`group_directory()`): name, size, details and "am I in it" per group. It runs
  with the caller's rights, so it opens nothing a direct read would not.
- **Everyone approved reads every group's details**; that is the point of the page. Who is in a group is
  not shown to members at all.
- **Who may do what** (decided with the user, 2026-10-12, replacing "the group's people edit"):

  | | Everyone approved | In the group | `groups.manage` |
  |---|---|---|---|
  | Read details and pictures | yes | yes | yes |
  | Change when / where / notes, and the number of members | | | yes |
  | Add a picture | | yes | yes |
  | Remove a picture | | | yes |

  Why: when and where a group meets is the church's word, so an admin keeps it; pictures come from the
  people who were there; removing is the one thing that cannot be undone, so it is an admin's.
  The database holds every line of this table (`schema.sql` sections 3 and 5); the pencils and buttons
  only follow it. `may_add_group_photo()` is the "add" rule, shared by a picture's row and its file.
- **Someone who added the wrong picture cannot take it back**; they ask an admin.
- **A pencil per line** (decided with the user): each line turns into its own box with Save and Cancel, and
  a save sends that one detail. A group manager sees every line, empty ones as "Not said yet".
- **When, where and notes are free text in one language**, as the group wrote them: "Fridays, 7:30 PM" is
  not a schedule the app computes with. Events are for that.
- **One row per group, made on the first save** (`upsert`). That call rewrites every column it sends (the
  group's id and one detail), so the update grant lists `group_id` too; the policy keeps a row with its group.
- **No history and no "edited by"**: any member of the group may overwrite another's words.

## Pictures
- **Where:** a private Supabase Storage bucket, `group-photos`. A picture is two files,
  `<group id>/<photo id>.jpg` (longest side 1600) and `…-small.jpg` (400), and one row of `group_photos`
  (optional date, optional caption, who added it).
- **Private, and why:** these are pictures of church members, children among them. A file is served only
  through an address signed for an approved, signed-in member, good for an hour.
  A signed address is new each time, so the browser's own cache missed on every visit (the user, 2026-10-21:
  the strip redrew on every return). **Since 2026-10-21 the service worker keeps each file under its path
  without the signature** (`public/sw.js`, PHOTOS; cache `photos-v1`, newest 300 files; the `<img>`s ask with
  `crossOrigin` so the answer can be kept): a picture opened once comes from the phone after that.
  - Never stale: a file is never replaced, only added or removed under a new photo id, so a path is one picture.
    A removed picture's copy is never asked for again and is trimmed in time.
  - No wider access: the page asks for a file only after the database has signed it for this person; the list
    of pictures (rows) and the signature are still checked at every visit.
  - Signing out (any page load of `/login`) deletes the saved pictures, like the saved Home.
- **Shrunk on the phone before sending** (`src/lib/shrinkImage.ts`, shared with the row pictures): a camera photo is 3 to 8 MB; what is stored is
  just under 1 MB (2560 pixels, the best quality that fits: `shrinkUnder`; it was 300 KB until 2026-10-17,
  which the user found ugly) plus 30 KB. Supabase's own resizing is a paid feature. The bucket itself refuses anything
  over 1 MB or not a JPEG, so a caller that skips the shrinking is refused, not trusted.
- **Six at a time**, newest first, loaded when the sheet opens, not with the page. Scrolling the strip to
  its end loads the next six (`PhotoStripEnd`, `useWhenVisible`).
- **Files first, then the row.** A row without files would draw as a grey square; files without a row are
  only unseen. Removing is the other way round: the row, then the files.
- **No editing.** A wrong date or caption is fixed by removing the picture and adding it again.
- **Removing is for good** and asks nothing, like every removal in this app. Only a group manager removes.
- **Not moderated before showing.** A group's own people and admins add; an admin removes what should not be there.

## Expected behavior
- (Before 2026-10-14.) Groups tab: every active group by name, each row its picture (set by an admin; the
  people icon until then), the name, and beneath it "Your group" (if I am
  in it), "12 members" (if an admin typed a number) and when it meets (if said). A chevron at the right.
- Tapping a row opens a sheet titled with the group's name: Members, When, Where, Notes, each a small label
  over the words. A reader sees only the lines that were said ("No details yet." when none were).
- An admin (`groups.manage`) sees Members, When, Where and Notes, each with a pencil. A pencil turns that line into a box with Save and Cancel. Save raises "Saved" and shows the new
  words; Cancel changes nothing.
- Under the lines, "Photos": a strip of square pictures, three and the edge of a fourth, fading out at the
  right; it scrolls sideways, and at its end a turning circle appears while six more arrive.
- Tapping a picture darkens the screen and shows it whole, with its date and words beneath, an X, and
  arrows to the pictures either side (no arrow at the first and the last). Escape or the X closes it.
- Someone in the group, and an admin, also see a square with a + first in the strip (even with no pictures yet); it opens "Add a photo" below the strip (a form: the picture, a date, a few words;
  "Sending…" while it uploads, then "Photo added" and the picture first in the strip). Only an admin
  sees "Remove this photo" in the large view.
- Someone who cannot add, looking at a group with no pictures, sees no Photos section at all.
- The list refreshes itself on arrival and on return to the app.
- **Observed 2026-10-12 on `/ui` at phone width:** the strip (three pictures of 93, the fourth's edge, the
  fade, sideways scroll), the large view (picture whole, caption, Remove, X; no left arrow on the first
  picture, both arrows on the second; Escape closes).
- `tests/rls.test.ts`, "group_info" and "group_photos": who may write and who may not, for details, rows
  and files; the bucket refusing a non-JPEG and an oversized file; a waiting or signed-out visitor getting
  neither rows nor a signed address.
- **Not exercised (2026-10-12):** the SQL is not run, so neither the security tests nor anything signed in:
  the sheet, the pencils, a real upload from a phone (including an iPhone's HEIC photo), a real removal.

## Edge cases
- Before `schema.sql` is run the tab shows "There are no groups yet."
- A removed group leaves the list, and its details can no longer be read or written; they stay stored.
- Someone taken out of a group loses "Add a photo" the next time the list refreshes; an upload in between is refused.
- A sheet left open for more than an hour shows broken pictures: their addresses ran out. Reopening it fixes it.
- An upload cut off between the two files or before the row leaves files nobody sees; they only take up room.
- A removed group's pictures leave with it (the rows are unreadable); the files stay in the bucket.
- Free storage is 1 GB: about 1,000 pictures at these sizes (3,000 before 2026-10-17). Nothing counts them or stops at a limit (B40).
- Two members saving at once: the later save wins, whole.

## Remove
Delete this folder and the `// GROUP-INFO` lines in `src/app/groups/page.tsx` (the Groups tab then needs
`oldGroupsPage` on, or its entries removed from `AppTabs.tsx` and `HomeTiles.tsx`). Run the DROP at the
bottom of `schema.sql` (empty the bucket in the dashboard first). The three picture components in
`src/components/ui/` and their demo on `/ui` can stay or go with it. The group editor
(`src/app/groups/manage/[groupId]/page.tsx`) then has no field for a group's name and size: give the groups
feature a small form for them (`saveGroup` in its git history, before 2026-10-17).

## Cards, and when a group meets (2026-10-14)
- **Cards** (`GroupDirectory`): a card per group (`ui/Card`): its picture, a pulsing green dot (always on),
  the name, "Tuesdays @ 7:30 PM · Hall", and a circle per person (`ui/MemberCircles`): initials of those who
  have the app (`group_member_initials()`), empty circles up to the typed number, "+N" past eight.
- **Members** tap a card for a read-only sheet (`GroupInfoSheet`): when, where, notes, members, pictures;
  a group's own people may add pictures. The pencils are gone (`GroupDetail`, `GroupDetailForm` removed).
- **Admins** tap a card for the group's editor (see the groups README); this feature brings `GroupInfoForm`
  (name, number of members, a weekday picker and a time, where, notes, one Save) and `GroupPhotos` to it.
- **When:** `group_info.meets_weekday` (0 = Sunday) and `meets_time`, written by `meeting.ts` as "Tuesdays @
  7:30 PM" / "Thứ Ba @ 7:30 Tối" (tested; "19:30" until 2026-10-17). The old free-text `meets_at` is shown until a day and time are saved.
- **Why initials only:** a member may not read who is in another group (group_members shows each person their
  own rows), so the database hands out the least that draws the circles, and only to approved members.
- **SQL:** section 7 of `schema.sql` (safe to run again). Until it is run the Groups tab is empty.
- Seen in `/ui` at phone width: a card with the dot, three initials, four empty circles and "+5". NOT seen: the
  Groups tab signed in, the editor, a real picture.

## Saving a picture (2026-10-14)
The large view has a download button (`savePhoto.ts`): on an iPhone it opens the share sheet, whose "Save
Image" puts the picture in Photos (a web page cannot write there itself); on a computer it downloads the file.
NOT tried on a phone.

## One Save on the group editor (2026-10-17)
- **Found by the user:** a changed name did not stay. The editor had two forms: name and size with a grey Save
  (groups' `GroupDetailsForm`), and when / where / notes with the blue Save (this feature). Reproduced: the
  blue Save stored where and notes, and the typed name was lost on reload.
- **Now:** `GroupInfoForm` holds all six fields and `saveGroupInfo` writes both tables, the group's name and
  size first (the groups feature's table and policy; this feature wrote `member_count` before 2026-10-14 too),
  then `group_info`. Not one transaction: if the second write fails, the banner says so and Save writes both
  again. Save is off while the name is empty (the database refuses an empty name).
- **Seen** on a local production build as a throwaway admin: name, 12 members and a place changed, one tap on
  Save, all three still there after a reload and in the database. Not seen on an iPhone.

## English name and place (2026-10-17)
- The user asked for a group's name and place in English too, like an event. `groups.name` and
  `group_info.location` stay the Vietnamese; `groups.name_en` (groups `schema.sql` 2e) and
  `group_info.location_en` (section 8) hold the English, both optional and written only with `groups.manage`.
- **Editor:** the name and the place are one grey box each, Vietnamese on top, English under it
  (`ui/BilingualInput`, as in the event editor). They do not stop the typing at 60 / 150 characters as the
  single boxes did; the database refuses a longer one and the banner says it could not save.
- **Cards and the sheet** show the reader's language, and the other one while it is missing
  (`bilingual.ts` + `t()`), so an English reader of a group with no English name sees the Vietnamese.
- **Elsewhere** (the Admin people screens, the editor's own title, notifications) the Vietnamese name shows.
- **SQL:** `docs/sql-to-run-2026-10-17.sql` (2e, then 8; safe to run again). Run it before this code goes
  live: until then Save fails, because it writes the new columns.

## Swipe in the large view (2026-10-17)
A swipe left shows the next picture, a swipe right the one before (`ui/Lightbox`, `ui/hooks/useSwipe`). The
arrows stay. At the last picture of the strip's loaded page a swipe left does nothing (more load from the strip).

## Cards, the sheet and a contact number (2026-10-17, the user)
- **Card:** the picture, the name, when the group meets, and the member circles. Nothing else.
- **Sheet** (a member taps a card): When, Contact, Notes, then the pictures. The number of members left the
  sheet (the circles on the card say it).
- **Contact** (`group_info.contact_phone`, section 9): a phone number as typed. Tapping it shows Call, Text and
  Copy (`src/components/PhoneNumber.tsx`, shared with events since 2026-10-17): the first two open the phone's own apps (`tel:` / `sms:`, digits from `src/lib/phone.ts`, tested),
  Copy puts the number on the clipboard. The database takes digits, spaces and + ( ) - . only, so nothing else
  can sit behind those links.
- **Where** stays in the database and in `GroupInfoDraft` (a saved place is kept on every Save), but is shown
  nowhere while `SWITCHES.groupLocation` is false: not on the card, the sheet or the editor.
- **SQL:** `docs/sql-to-run-2026-10-17b.sql`. Until it is run the editor's Save fails (it writes `contact_phone`).

## A group's page instead of its sheet (2026-10-17, the user)
- A tap on a card opens the group's own page for everyone, sliding in from the right, shaped exactly like an
  event's page: the big picture (a people icon without one), then lines with icons (`ui/IconLine`): the clock
  (when it meets), the map pin (where, only while `SWITCHES.groupLocation` is on) and the phone (`PhoneNumber`),
  then the notes and the group's pictures. An admin finds a round blue pencil held under the top bar (like prayer's +), which opens the editor.
- The address is `/groups/<id>/about` (`src/app/groups/[groupId]/about/page.tsx`), because `/groups/<id>` is
  the group's chat (switched off). It reads `group_directory()` like the Groups tab.
- `GroupInfoSheet` is gone (the user: no more group pop-ups).
- Seen on a local production build: "Thứ Ba @ 7:30 Tối", the number, the notes. Not seen: a real picture.
