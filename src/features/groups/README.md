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
| Data | `schema.sql` | `groups`, `group_members`, `group_join_requests`, `approve_join_request`, grants, RLS, the two seed groups, the DROPs |
| Types | `types.ts` | `Group`, `GroupWithMembership` (`joined`, `pending`), `JoinRequest`, `MANAGE_GROUPS` (the permission's name), `MAX_GROUP_NAME_LENGTH` |
| Browser API | `api.ts` | `requestToJoin` (POST `/api/groups/join`), `approveJoinRequest` (POST `/api/groups/approve`), `declineJoinRequest`, `createGroup`, `renameGroup`, `removeGroup` |
| Server reads | `server/queries.ts` | `getGroups` (each with `joined` and `pending`), `getGroup` (one, or `null`), `getJoinRequests` |
| Server logic | `server/joinRequests.ts` | `requestToJoin`, `approveJoinRequest`: record the step as the **user**, then notify |
| Server logic | `server/notifyJoin.ts` | **Admin** client: tells managers someone is waiting; tells a person they are in (`// PUSH`, `// I18N`, `// PERMISSIONS`) |
| Routes | `src/app/api/groups/join/route.ts`, `approve/route.ts` | Verify (401) → validate (400) → the step (403 when refused) → 204 |
| UI | `components/GroupList.tsx`, `JoinButton.tsx` | The list of groups; asking to join one; "Waiting for approval" |
| UI | `components/JoinRequests.tsx` | The admin section's list of who is waiting, with Approve and Decline |
| UI | `components/GroupAdmin.tsx`, `GroupNameEditor.tsx` | The admin page's section: rename a group, remove one, add one |
| Text | `strings.ts` | The Join button. Group names are data. |
| Shell | `src/app/groups/page.tsx`, the Groups tab in `TabBar.tsx` | The list page |

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
- **Nobody can leave a group yet**, and there is no member list: members can read only their own memberships.
- **A joined group links to `/groups/<id>`, which is chat's screen.** Without chat that link has no page.

## Expected behavior
- `/groups` lists the groups. "Ask to join" turns into "Waiting for approval"; after a manager approves,
  the row becomes a link the next time the page loads.
- Admin tab → Groups shows "Waiting to join" above the group names when anyone is waiting: their email, the
  group, Approve and Decline. Either answer takes the row off the list.
- A user sees only their own rows in `group_members` and cannot insert any (`tests/rls.test.ts`).
- Proven in a rolled-back transaction (17 checks, 2026-10-06): a pending request opens nothing, a user
  cannot approve themselves, others cannot see or decline it, approval opens the group. **Not yet
  exercised on screen, and no notification seen on a phone.**
- On the Admin tab, someone with `groups.manage` sees every group's name in a box with Save, and a box to
  add a group. Save stays disabled until the name changes. **Not yet exercised on screen.**
- Remove takes the group off every list at once. For its members: the group, its chat, its events and its
  prayer requests disappear, and nobody can post to it or join it. Proven in a rolled-back transaction
  (15 checks, 2026-10-06), including that nothing is erased and that clearing the mark restores it.

## Remove
This is a foundation, not a leaf: chat, events (group events) and prayer stop working without it. Remove those
first, then delete this folder, `src/app/groups/`, the Groups tab in `TabBar.tsx`, and run the DROP statement
at the bottom of `schema.sql`.
