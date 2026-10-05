# groups

The groups of the church and who has joined which. It is the **sharing unit** of the app: chat, events and
prayer requests all decide who may see a row by asking "is this user a member of that group?".

System docs: `.claude/architecture.md`. Shape and conventions: `docs/adding-a-feature.md`.

## Setup
Run `schema.sql` in Supabase → SQL Editor **before** chat, events or prayer: their tables point at `groups`.

## Files
| Layer | File | Job |
|---|---|---|
| Data | `schema.sql` | `groups`, `group_members`, grants, RLS, the two seed groups, and the DROP statement |
| Types | `types.ts` | `Group`, `GroupWithMembership` |
| Browser API | `api.ts` | `joinGroup` |
| Server reads | `server/queries.ts` | `getGroups` (each with a `joined` flag), `getGroup` (one, or `null`) |
| UI | `components/GroupList.tsx`, `JoinButton.tsx` | The list of groups; joining one |
| Text | `strings.ts` | The Join button. Group names are data. |
| Shell | `src/app/groups/page.tsx`, the Groups tab in `TabBar.tsx` | The list page |

## Decisions worth knowing
- **Other features depend on this one in SQL only.** Their policies read `group_members`; none of them
  imports this folder. A page that needs the user's groups calls `getGroups` and passes the result down.
- **Anyone signed in can see every group and join any of them.** Invite-only groups are backlog B5.
- **Nobody can leave a group yet**, and there is no member list: members can read only their own memberships.
- **A joined group links to `/groups/<id>`, which is chat's screen.** Without chat that link has no page.

## Expected behavior
- `/groups` lists the seeded groups; tapping Join turns the row into a link.
- A user sees only their own rows in `group_members`, and cannot insert a row for someone else
  (`tests/rls.test.ts`).

## Remove
This is a foundation, not a leaf: chat, events (group events) and prayer stop working without it. Remove those
first, then delete this folder, `src/app/groups/`, the Groups tab in `TabBar.tsx`, and run the DROP statement
at the bottom of `schema.sql`.
