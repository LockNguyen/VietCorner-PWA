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
| Data | `schema.sql` | `groups`, `group_members`, grants, RLS, the two seed groups, and the DROP statement |
| Types | `types.ts` | `Group`, `GroupWithMembership`, `MANAGE_GROUPS` (the permission's name), `MAX_GROUP_NAME_LENGTH` |
| Browser API | `api.ts` | `joinGroup`, `createGroup`, `renameGroup`, `removeGroup` |
| Server reads | `server/queries.ts` | `getGroups` (each with a `joined` flag), `getGroup` (one, or `null`) |
| UI | `components/GroupList.tsx`, `JoinButton.tsx` | The list of groups; joining one |
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
- **Anyone signed in can see every group and join any of them.** Invite-only groups are backlog B5.
- A removed group keeps its name, so a new group may reuse it; restoring the old one then shows two.
- **Nobody can leave a group yet**, and there is no member list: members can read only their own memberships.
- **A joined group links to `/groups/<id>`, which is chat's screen.** Without chat that link has no page.

## Expected behavior
- `/groups` lists the seeded groups; tapping Join turns the row into a link.
- A user sees only their own rows in `group_members`, and cannot insert a row for someone else
  (`tests/rls.test.ts`).
- On the Admin tab, someone with `groups.manage` sees every group's name in a box with Save, and a box to
  add a group. Save stays disabled until the name changes. **Not yet exercised on screen.**
- Remove takes the group off every list at once. For its members: the group, its chat, its events and its
  prayer requests disappear, and nobody can post to it or join it. Proven in a rolled-back transaction
  (15 checks, 2026-10-06), including that nothing is erased and that clearing the mark restores it.

## Remove
This is a foundation, not a leaf: chat, events (group events) and prayer stop working without it. Remove those
first, then delete this folder, `src/app/groups/`, the Groups tab in `TabBar.tsx`, and run the DROP statement
at the bottom of `schema.sql`.
