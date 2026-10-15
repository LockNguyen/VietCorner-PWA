# groups

The groups of the church and who has joined which. It is the **sharing unit** of the app: chat, events and
prayer requests all decide who may see a row by asking "is this user a member of that group?".

System docs: `.claude/architecture.md`. Shape and conventions: `docs/adding-a-feature.md`.

## Setup
Run `features/permissions/schema.sql` first, then this `schema.sql` in Supabase → SQL Editor, **before** chat,
events or prayer: their tables point at `groups`.

## Files
| Layer | File | Job |
|---|---|---|
| Data | `schema.sql` | `groups` (with `member_count`), `group_members`, `group_join_requests`, `approve_join_request`, `my_groups()`, `group_people()`, grants, RLS, the two seed groups, the DROPs |
| Types | `types.ts` | `Group` (`member_count`), `GroupWithMembership` (`joined`, `pending`), `Person` (name, email, `group_ids`), `JoinRequest`, `MANAGE_GROUPS` (the permission's name), `MAX_GROUP_NAME_LENGTH` |
| Browser API | `api.ts` | `requestToJoin` (POST `/api/groups/join`), `approveJoinRequest` (POST `/api/groups/approve`), `declineJoinRequest`, `createGroup`, `saveGroup` (name and size), `removeGroup`, `addMember`, `removeMember`, `getGroupPeople` |
| Server reads | `server/queries.ts` | `getGroups` (each with `joined` and `pending`), `getGroup` (one, or `null`), `getJoinRequests`, `getGroupPeople` |
| Server logic | `server/joinRequests.ts` | `requestToJoin`, `approveJoinRequest`: record the step as the **user**, then notify |
| Server logic | `server/notifyJoin.ts` | **Admin** client: tells managers someone is waiting; tells a person they are in (`// PUSH`, `// I18N`, `// PERMISSIONS`) |
| Routes | `src/app/api/groups/join/route.ts`, `approve/route.ts` | Verify (401) → validate (400) → the step (403 when refused) → 204 |
| UI | `components/GroupList.tsx`, `JoinButton.tsx` | The list of groups; asking to join one; "Waiting for approval" |
| UI | `components/JoinRequests.tsx`, `JoinRequestRow.tsx` | The admin section's list of who is waiting; one person, with Approve and Decline |
| UI | `components/NewGroupForm.tsx` | A new group's name, then Create, which opens its editor |
| UI | `components/GroupPeople.tsx` | On a group's editor: who is in it (each with Remove), and adding someone |
| UI | `components/RemoveGroupButton.tsx` | The small red line at the bottom of a group's editor (asks once) |
| UI | `components/UnassignedCard.tsx` | The last card on the Groups tab, for an admin: everyone in no group yet; refreshes itself (`useFresh`) |
| UI | `components/PersonGroups.tsx` | On a person's screen (Admin): a switch per group |
| UI | `components/GroupThumbnail.tsx` | The group's picture: choose or replace, remove |
| UI | `components/GroupDetailsForm.tsx`, `GroupMemberRow.tsx`, `AddMemberForm.tsx` | Name and size with one Save; one person with Remove; the list of people to add |
| UI | `components/UnassignedSheet.tsx` | Everyone in no group yet |
| Text | `strings.ts` | The Join button. Group names are data. |
| Shell | `src/app/groups/page.tsx`, the Groups tab in `AppTabs.tsx` | The list page |

## Decisions worth knowing
- **Other features depend on this one in SQL only.** Their policies read `group_members`; none of them
  imports this folder. A page that needs the user's groups calls `getGroups` and passes the result down.
- **Creating, renaming and removing a group needs the `groups.manage` permission**, checked by the database
  from the login token (the `permissions` README).
- **Removing a group never erases it** (decided 2026-10-06). It sets `groups.deleted_at`; the row, its
  messages, events, prayers and memberships all stay. Nobody, manager included, can run a real delete.
- **A removed group goes quiet through one rule:** a membership in a removed group is invisible
  (`group_members` select policy). Chat, events and prayer all look for the caller's membership, so their
  checks fail without any of them knowing groups can be removed. The exceptions are prayer's view and
  function, which skip row rules and so check `deleted_at` themselves.
- **There is no Reactivate button and removing asks no confirmation** (decided: fewer taps, no restore
  screen yet). Bringing a group back is clearing `deleted_at` in the dashboard; everything returns with it.
- **Joining needs a manager's approval** (decided 2026-10-06). Tapping the button creates a request, which
  opens nothing. Only someone with `groups.manage` can approve it, and approving is the only way into
  `group_members`: members have no insert grant on that table at all.
- **A request is its own table, not a "pending" membership.** `group_members` goes on meaning "is a member",
  so no policy in chat, events or prayer had to learn that joining needs approval.
- **Approving is one database function** (`approve_join_request`): the request becomes the membership in one
  step, and it answers whether there was a request, so a member calling it changes nothing.
- **Three notifications:** managers are told when someone asks (one topic, so several requests in a minute
  are one push); the person is told when approved; declining tells nobody, and they may ask again.
- **Everyone signed in still sees the list of group names.** What is private is what is inside a group.
- **People who joined before this rule stay members.**
- A removed group keeps its name, so a new group may reuse it; restoring the old one then shows two.
- Someone who was declined can ask again straight away; nothing stops repeated requests (backlog B3).
- A manager who wants to join a group asks and approves themselves.
- **Nobody can leave a group by themselves**; an admin takes them out. Members read only their own memberships; only a manager sees who is in a group.
- **A joined group links to `/groups/<id>`, which is chat's screen.** Without chat that link has no page.

## Expected behavior
- `/groups` lists the groups as rows: a joined group says "Joined" and opens with a chevron; the others carry
  the button or the waiting note. "Join" turns into "Waiting for approval"; after a manager approves,
  the row becomes a link the next time the page loads.
- Admin tab → Groups shows "Waiting to join" above the group names when anyone is waiting: their name and email as "name (email)", the
  group, Approve and Decline. Either answer takes the row off the list.
- A user sees only their own rows in `group_members` and cannot insert any (`tests/rls.test.ts`).
- Proven in a rolled-back transaction (17 checks, 2026-10-06): a pending request opens nothing, a user
  cannot approve themselves, others cannot see or decline it, approval opens the group. **Not yet
  exercised on screen, and no notification seen on a phone.**
- Remove takes the group off every list at once. For its members: the group, its chat, its events and its
  prayer requests disappear, and nobody can post to it or join it. Proven in a rolled-back transaction
  (15 checks, 2026-10-06), including that nothing is erased and that clearing the mark restores it.

## Remove
This is a foundation, not a leaf: chat, events (group events) and prayer stop working without it. Remove those
first, then delete this folder, `src/app/groups/`, the Groups tab in `AppTabs.tsx`, and run the DROP statement
at the bottom of `schema.sql`.

## How the group list loads (2026-10-09)
- **One trip.** `getGroups` calls the database function `my_groups()`: every active group with whether the
  caller has joined or is waiting. It was three reads. The Groups, Prayer and Admin pages all use it.
- **The function opens nothing.** It runs with the caller's rights; the policies decide what it can see.
  It also narrows what a manager gets to their own standing, although they may read everyone's requests.
- **The list refreshes itself** on arrival and on return to the app (`useFresh` with `api.getMyGroups`).
- Before section 2b of `schema.sql` is run, the pages that list groups fail to load.
- **"Waiting to join" on the Admin page reads itself again on every arrival** (`api.getJoinRequests`), with the
  name of anyone new. The rest of the Admin page can be up to ten minutes old when returned to.

## Switched off for now (2026-10-12)
- **Asking to join** (`SWITCHES.joining`): both routes answer 404, and the Admin tab shows no "Waiting to
  join" list and does not read it. Admins will put people into groups themselves (next slice).
- **The Groups page as it was** (`SWITCHES.oldGroupsPage`): `/groups` draws the `group-info` feature's list
  instead of `GroupList`. Switched back on, the old list returns in its place.
- The tables, their rules and the code are untouched. A direct Supabase call can still insert a join
  request; no screen shows it and it opens nothing.
- Observed 2026-10-12, signed out: `POST /api/groups/join` and `/approve` → 404.
## Admins put people into groups (2026-10-12)
- **Admin tab → Groups:** one row per group, its name over "12 members", with a chevron. The number is
  the one an admin typed; until one is typed it is the accounts in the group. Last comes "Has no group /
  Chưa vào nhóm" with how many approved people are in none: where a newly approved person starts.
- **A row opens a sheet:** name and number of members with one Save (disabled until something changes; the
  number takes digits only, and emptying it means "not said"); the people in the group who use the app,
  name over email, each with Remove; a list of everyone not in the group ("name (email)") with Add; the red
  "Remove this group"; Close. The inline name box is gone (`GroupNameEditor` deleted).
- **"Has no group" opens a list only.** A person is put into a group from that group's sheet.
- **A person can be in several groups** (decided with the user), so adding to one never removes from another.
- **The number is typed, not counted** (decided with the user: only admins change it): many who come to a
  group do not use the app. Every member can read it (`my_groups()`), for the Groups page to come.
- **Adding and removing are direct writes**, guarded by policies that ask for `groups.manage`. Nobody is
  notified. A manager may now read every membership in active groups: a delete needs to see the row it removes.
- **`group_people()` is the one read behind both lists:** every approved account with name, email and group
  ids. It runs with its owner's rights (emails live in `auth.users`), so it checks `groups.manage` itself and
  answers nothing to anyone else. Someone still waiting to be let in is not in it.
- **The section is never a kept copy.** Groups and people read themselves again on every arrival and on
  return to the app (`useFresh` with `getMyGroups` and `getGroupPeople`), so someone approved a minute ago
  is there to add. After each change the page reloads and the open sheet redraws; a removed group's sheet
  closes by itself.
- An existing database needs section 2c of `schema.sql`, then 2b again (it now returns `member_count`).
- `tests/rls.test.ts`: a member cannot add, remove or see other people's memberships, nor set the number;
  a manager can; `group_people()` is empty for a member and for a waiting account.
- **Not exercised (2026-10-12):** the SQL is not run, so neither the security tests nor the screen.
## The group's picture (2026-10-12)
- **What:** the small picture that starts a group's row on the Groups tab and on the Admin tab. Whoever holds `groups.manage` sets it,
  replaces it and removes it, from the top of the group's sheet on the Admin tab: a box that chooses a picture (saved at once, with a turning
  circle while it uploads), and "Remove the picture". Without one, the row shows the people icon.
- **Where it is kept:** the file in the public Storage bucket `group-thumbnails`, its path in
  `groups.thumbnail_path`.
- **Public, on purpose** (unlike a group's activity photos, which are private): this picture is on every
  row of a list, and a public address lets the phone keep it instead of downloading it at every visit. It
  is one picture an admin chose to stand for the group. Anyone holding a file's address can open it; the
  address is two random ids, and nobody but a manager can list the bucket.
- **A new picture is a new file with a new name**, then the old file is erased: a phone that kept the old
  address can never show the old picture in place of the new one.
- **Shrunk on the phone** to 400 pixels, about 30 KB (`src/lib/shrinkImage.ts`). The bucket refuses
  anything over 200 KB or not a JPEG.
- **Order of a change:** the file, then the path on the row, then the old file. A failure in between leaves
  a file nobody sees, never a row pointing at nothing.
- An existing database needs section 2d of `schema.sql`, then 2b again, then section 4 of `features/group-info/schema.sql` again (both now return `thumbnail_path`).
- `tests/rls.test.ts`, "thumbnails": a manager sets and removes; a member or a waiting account cannot
  upload, change the path or erase the file; the bucket refuses a non-JPEG and an oversized file.
- **Not exercised (2026-10-12):** the SQL is not run, so neither the security tests nor the screen.

## Managed on the Groups tab (2026-10-14)
The Admin tab's Groups section is gone (`GroupAdmin`, `GroupSheet` removed). An admin now works on the
Groups tab: a + (`/groups/manage/new`: a name, then Create opens the editor), and a tap on a group's card
opens its editor (`src/app/groups/manage/[groupId]/page.tsx`), which composes this feature's picture, name
and size, people and remove with group-info's when/where/notes and pictures. "Chưa vào nhóm" (in no group)
is the last card. A person's groups can also be switched on their screen in the Admin tab (`PersonGroups`).
`createGroup` now returns the new id. NOT seen signed in.
