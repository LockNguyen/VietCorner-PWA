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
| Browser API | `api.ts` | `joinGroup`, `createGroup`, `renameGroup` |
| Server reads | `server/queries.ts` | `getGroups` (each with a `joined` flag), `getGroup` (one, or `null`) |
| UI | `components/GroupList.tsx`, `JoinButton.tsx` | The list of groups; joining one |
| UI | `components/GroupAdmin.tsx`, `GroupNameEditor.tsx` | The admin page's section: rename a group, add one |
| Text | `strings.ts` | The Join button. Group names are data. |
| Shell | `src/app/groups/page.tsx`, the Groups tab in `TabBar.tsx` | The list page |

## Decisions worth knowing
- **Other features depend on this one in SQL only.** Their policies read `group_members`; none of them
  imports this folder. A page that needs the user's groups calls `getGroups` and passes the result down.
- **Creating and renaming a group needs the `groups.manage` permission**, checked by the database from the
  login token (the `permissions` README). Members can write the name column only, and only through those
  policies. Nobody can delete a group from the app: its chat, events and prayers would go with it.
- **Anyone signed in can see every group and join any of them.** Invite-only groups are backlog B5.
- **Nobody can leave a group yet**, and there is no member list: members can read only their own memberships.
- **A joined group links to `/groups/<id>`, which is chat's screen.** Without chat that link has no page.

## Expected behavior
- `/groups` lists the seeded groups; tapping Join turns the row into a link.
- A user sees only their own rows in `group_members`, and cannot insert a row for someone else
  (`tests/rls.test.ts`).
- On the Admin tab, someone with `groups.manage` sees every group's name in a box with Save, and a box to
  add a group. Save stays disabled until the name changes. **Not yet exercised on screen.**

## Remove
This is a foundation, not a leaf: chat, events (group events) and prayer stop working without it. Remove those
first, then delete this folder, `src/app/groups/`, the Groups tab in `TabBar.tsx`, and run the DROP statement
at the bottom of `schema.sql`.
