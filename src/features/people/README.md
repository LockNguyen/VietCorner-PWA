# people

The Admin tab's list of everyone with an account, and one screen per person: their email, what they may do
(a switch per role), which groups they are in, and removing them. Built 2026-10-14 on the user's word.

System docs: `.claude/architecture.md`.

## Setup
Run `schema.sql` in Supabase → SQL Editor (safe to run again). It needs permissions, profiles and groups.
Also run section 3f of `features/events/schema.sql`, or removing someone who created an event is refused.

## Files
| Layer | File | Job |
|---|---|---|
| Data | `schema.sql` | `users.manage` for admins; one role per permission; `people_list()`, `set_person_role()`, `remove_person()` |
| Types | `types.ts` | `PersonSummary`, `MANAGE_USERS`, `ROLES` (the roles offered, with their words) |
| Text | `strings.ts` | Every other word of this feature |
| Browser API | `api.ts` | `getPeople`, `setRole`, `removePerson`: database functions, no route |
| Server reads | `server/queries.ts` | `getPeople(supabase)` |
| UI | `components/PeopleList.tsx` | Everyone, one row each: name, "Admin / Member / Waiting · 2 groups"; refreshes on arrival |
| UI | `components/PersonRoles.tsx` | A switch per role, each saving at once |
| UI | `components/RemovePersonButton.tsx` | The small red line that removes the person (asks once) |
| Shell | `src/app/admin/page.tsx` (`// PEOPLE`), `src/app/admin/people/[userId]/page.tsx` | The list; one person's screen (it also shows the groups feature's `PersonGroups`) |

## Decisions worth knowing
- **One role per permission** ("events-manager", "groups-manager", "prayer-reminders", "approver"), next to
  "member" (may use the app) and "admin" (everything). Rights stay roles, as everywhere else in the app;
  these small ones let an admin hand out one task at a time.
- **No route, no service key:** each change is a database function that checks "users.manage" itself, as
  `approve_account` does. A changed role reaches the person at their next token refresh (within 15 minutes).
- **Nobody locks the church out:** an admin cannot switch off their own "admin" or remove themselves (the
  switch is disabled and the line hidden; the database refuses it too).
- **Removing deletes the account** and everything only theirs (cascades); events they made stay (3f). It
  cannot be undone.

## Expected behavior
- Admin tab: waiting lists on top, then "People": one row per account. A row opens the person's screen.
- Security cases in `tests/rls.test.ts`: a member gets an empty list and cannot give a role or remove anyone.
- **NOT seen (2026-10-14):** any of it signed in; the SQL is not run yet.

## Remove
Delete this folder, `src/app/admin/people/`, and the `PEOPLE` lines in `src/app/admin/page.tsx` and
`src/app/groups/page.tsx` (there, "Has no group" then shows to nobody: give it another permission). Run the Undo
block at the bottom of `schema.sql`.

## Pictures in the list (2026-10-19)
`people_list()` also returns `avatar_path` (section 3, run again after `profiles/schema.sql` section 6); each
row shows the person's picture, or the default figure.
