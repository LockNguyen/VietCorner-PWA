# profiles

What a person is called. A foundation: chat, prayer and the groups admin show people by name through it.

System docs: `.claude/architecture.md`. Shape and conventions: `docs/adding-a-feature.md`.

## Setup
Run `schema.sql` in Supabase → SQL Editor, before `features/prayer/schema.sql` (the prayer feed reads names).
Copy it from the editor, not from terminal output. It is **not** safe to run twice (plain `create`), except sections 4 (who reads names) and 5 (changing a
name), which can each be run again by themselves: that is how they are changed.

## Files
| Layer | File | Job |
|---|---|---|
| Data | `schema.sql` | `profiles`, the trigger that makes a row per account, who reads names, `name_requests` with `set_my_name` and `approve_name_request`, the `avatars` bucket with `set_my_avatar` (section 6), DROPs |
| Types | `types.ts` | `Profile` (my own), `Names` (others', by user id), `NameOutcome`, `NameRequest`, `MAX_NAME_LENGTH`, `AVATAR_BUCKET`, `AVATAR_SIDE` |
| Text | `strings.ts` | The question, the field's label, the buttons |
| Browser API | `api.ts` | `saveName` (POST `/api/names/request`), `approveNameRequest` (POST `/api/names/approve`), `declineNameRequest`, `getNames`, `setAvatar`, `removeAvatar` |
| Server reads | `server/queries.ts` | `getMyProfile`, `getNames`, `getMyRequestedName` and `getMyAvatar` (Settings), `getNameRequests` (Admin) |
| Server logic | `server/nameRequests.ts` | `setMyName`, `approveNameRequest`: the database function as the **user**, then the notification |
| Server logic | `server/notifyName.ts` | **Admin** client: managers hear of a request, the person hears of an approval (`// PUSH`, `// I18N`, `// GROUPS`) |
| Routes | `src/app/api/names/request/route.ts`, `approve/route.ts` | Verify (401) → validate (400) → the server function (403 when refused) |
| State | `hooks/useAvatarChange.ts` | Choosing my picture: the chosen file, its framing, crop + save, Cancel, Remove |
| State | `hooks/useNames.ts` | The names on a screen that keeps receiving people (a chat): fetches whoever is new, once |
| UI | `components/NameStep.tsx` | The question, shown by the layout in place of every screen until answered |
| UI | `components/NameSection.tsx` | The Settings block: my name, Save, and the name I asked for while it waits |
| UI | `components/NameRequestAdmin.tsx`, `NameRequestRow.tsx` | The admin section "Names waiting for approval"; one request with Approve and Decline |
| UI | `components/AvatarSection.tsx` | The Settings block: my picture, choose a file, frame it in a circle (`ui/ImageCropper`), Use / Cancel, Remove |
| UI | `components/NameForm.tsx` | The field and its button, used by both |
| Shell | `src/app/layout.tsx`, `src/app/settings/page.tsx`, `src/app/admin/page.tsx` | Lines marked `PROFILES` |

## Decisions worth knowing
- **A name is read by its owner, by people who share a group with them, and by whoever manages groups**
  (decided 2026-10-08). Not by every signed-in user: sign-up is open, so that would be anyone with an email
  address. The check is the function `shares_a_group_with`, because a member cannot see other people's
  memberships and a plain policy sub-query would therefore never match.
- **Every account has a row from the moment it exists**, made by a database trigger and named after the part
  of the email before the @. So no screen meets a person without a name and no code needs a fallback.
  `named_at` is null until the person answers; that is what makes the app ask.
- **The question is asked by the layout, not by a route.** It replaces whatever page was requested, so there
  is no redirect to get wrong and no address that skips it. The tab bar is hidden meanwhile.
- **Names are looked up, never copied.** A message stores who sent it; the name is read from here when it is
  shown, so correcting a name corrects it everywhere, on old messages too.
- **Features ask for names by id.** The page loads them with `getNames` and passes them down; a screen that
  receives new people while open (chat) uses `useNames`. The prayer feed gets its names inside its view.
- **No form of address, no greeting, no picture yet.** Only a name. Everyone has the same default `Avatar`.
- **Names are not unique and not checked by a machine**, beyond 1 to 60 characters. Two members may share one.
- **Admins gate members against impersonation** (decided 2026-10-08). Whoever lets a person into a group
  sees "name (email)" at that moment. From then on a new name is only a request, which someone with
  `groups.manage` approves or declines in the Admin tab, seeing the requested name, the email and the name
  in use. So chat, prayer and groups never have to wonder whether a name is honest.
- **In no group, a name is saved at once**: nobody else can read it yet. "In a group" includes having asked
  to join one, because a manager is looking at that name right now. This also covers a member who was never
  asked for a name: their first answer is a request too.
- **The rule lives in the database.** There is no update grant on `profiles`; `set_my_name` decides between
  saving and requesting, and `approve_name_request` checks the permission. A browser cannot skip either.
- **"Names waiting for approval" reads itself again on every arrival** at the Admin page (`api.getNameRequests`),
  so a manager never looks at an old list.
- **One request per person; asking again replaces it.** A decline deletes it, tells nobody, and the person
  may ask again. An approval tells the person; a new request tells the managers (at most once a minute).

## Expected behavior
- The first screen after the first sign-in is "What is your name?" with one field; no tabs, no top bar.
  Continue is disabled while the field is empty. After it, the app opens where it was heading.
- Someone who signed up before this existed is asked once, at their next visit.
- Until a person answers, others see the part of their email before the @.
- Settings → Name shows the name with Save, disabled until it is changed. In no group: "Saved", and the
  name is changed. In a group: "Sent for approval", the name stays, and "Waiting for approval: <new name>"
  shows under the button until a manager answers.
- Admin tab (with `groups.manage`) → "Names waiting for approval", only when someone is waiting: each row is
  "new name (email)" over "Now: <current name>", with Approve and Decline.
- A member of a group who is asked "What is your name?" for the first time gets "Sent for approval" and
  goes on under their email's stand-in until a manager approves.
- Chat, prayer requests, the chat notification and "Waiting to join" show names, not emails.
- **Not yet seen on screen (2026-10-08): the name question, the request, the admin section.**

## Edge cases
- Before section 5 of `schema.sql` is run, saving a name fails with "Could not save".
- A declined or unanswered first request leaves the person under their stand-in; they change it in Settings.
- Before `schema.sql` is run the profile cannot be read: nobody is asked, Settings has no Name block, and
  names are blank. The prayer list is empty until its view is recreated.
- A chat message from someone new shows without a name for the moment the lookup takes. So does one from
  someone who has since left the group: their name is no longer readable.
- The email kept on each message, request and join request (`sender_email`, `author_email`, `user_email`) is
  no longer shown anywhere. It stays as a record; dropping those columns is backlog B34.

## Remove
This is a foundation: chat, prayer and the groups admin stop showing who wrote what. Delete this folder and
the lines marked `PROFILES`; show `sender_email` and `user_email` again; recreate `prayer_feed` with
`author_email`; run the DROP statements at the bottom of `schema.sql`.

## Name notifications are switched off (2026-10-12)
`SWITCHES.namePush` is `false`: a name waiting for approval and an approved name still save, and tell nobody
(`server/nameRequests.ts`). Admins find waiting names on the Admin tab.

## Name from the sign-up screen (2026-10-14)
The sign-up screen asks for the name with the email and password. It travels as the account's `name`
metadata, and `create_profile()` (schema.sql, section 2) saves it as the name at once: a new account is in
no group, where no approval is needed. Blank or longer than 60 characters, it falls back to the email's
stand-in and `NameStep` asks as before. **Needs section 2 run again** (`create or replace`, safe to repeat).

## My picture (2026-10-19, the user)
- **Setup:** `schema.sql` section 6 (column, bucket, storage policy, `set_my_avatar`), then
  `prayer/schema.sql` 5b and `people/schema.sql` 3, which read the new column.
- **Flow:** Settings → Ảnh đại diện → choose a file → the picture fills a dark box with a circle over it: drag
  to move, pinch to zoom (`react-easy-crop`) → "Dùng ảnh này" crops the circle's square on the phone to a
  400 px JPEG (`lib/cropImage.ts`), uploads it to `avatars/<my id>/<random>.jpg`, points my profile at it
  (`set_my_avatar`), erases the old file, and the page reloads showing it. "Hủy" puts the choice aside;
  "Xóa ảnh" (small red line) goes back to the default figure.
- **Where it shows:** Settings (96 px), beside my requests on the Prayer tab and in the Admin people list
  (32 px). Not on group cards (initials) or in chat (switched off).
- **Decisions:** no approval for a picture (unlike a name); a public bucket, as for event pictures (the
  architecture's Key Decisions); the storage policy keys on the folder name, so nobody writes into another's
  folder, and `set_my_avatar` refuses a path outside my own folder.
- **Edge cases:** a picture taken sideways is turned upright (`createImageBitmap` reads the camera's note,
  as the preview does). A failed upload leaves the old picture and the chooser open, with the banner. A file
  left behind by a failure in between is on no screen.
- **Seen:** the cropper on `/ui` at 375 px, reporting the kept square after a drag. **NOT seen:** Settings
  signed in, an upload, a pinch on a real phone.
