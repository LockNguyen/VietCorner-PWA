# approval

A new account uses nothing until an admin lets it in. Signing up stays open (anyone with an email address
can make an account); what the account can reach does not.

System docs: `.claude/architecture.md`. Shape and conventions: `docs/adding-a-feature.md`.

## Setup
1. Run section 4b of `features/permissions/schema.sql` (the permission `app.use`).
2. Run this `schema.sql`, sections 1 to 3, **after every other feature's schema**: section 3 names their tables.
3. Run section 4 **once** (it is commented out): everyone who already has an account is let in.
4. Deploy the code straight after. Between the SQL and the deploy, people already signed in see empty lists
   until their login token renews (15 minutes at most); the new code renews it at once.

## Files
| Layer | File | Job |
|---|---|---|
| Data | `schema.sql` | `accounts.manage`; `waiting_accounts()`, `approve_account()`; the door (one restrictive policy per table); the one-time "let in everyone already here"; the DROPs |
| Types | `types.ts` | `MANAGE_ACCOUNTS` (the permission's name), `WaitingAccount` |
| Browser API | `api.ts` | `askToBeLetIn` (POST `/api/approval/request`), `approveAccount` (POST `/api/approval/approve`), `getWaitingAccounts`, `renewMyToken` |
| Server reads | `server/queries.ts` | `getWaitingAccounts` |
| Server logic | `server/approveAccount.ts` | Approves as the **caller**, then tells the person |
| Server logic | `server/notifyApproval.ts` | **Admin** client: tells admins someone is waiting (once per account); tells a person they are in (`// PUSH`, `// I18N`, `// PERMISSIONS`, `// PROFILES`) |
| Routes | `src/app/api/approval/request/route.ts`, `approve/route.ts` | Verify (401) → validate (400) → the step (403 when refused) → 204 |
| State | `hooks/useWaitForApproval.ts` | On arrival and on return to the app: announce, renew the token, reload |
| UI | `components/WaitingStep.tsx` | The screen a waiting account sees, with the notification switch and "Check again" |
| UI | `components/WaitingAccounts.tsx`, `WaitingAccountRow.tsx` | The admin page's list of who is waiting; one person with Approve |
| Text | `strings.ts` | The screen, the admin section, both notifications |
| Shell | `src/app/layout.tsx`, `src/app/admin/page.tsx` (`// APPROVAL` lines) | Where the screen and the section are shown |

## Decisions worth knowing
- **"Approved" is a permission, not a new mechanism.** Approving gives the account the role `member`, whose
  permission `app.use` reaches the login token like any other. There is no table here.
- **The database is the door, not the screen.** Every table a member can reach has a restrictive policy
  "Approved accounts only" (`schema.sql` section 3), ANDed with that table's own policies. The waiting
  screen is courtesy: skip it and every read is still empty.
- **A new table must be added to section 3.** A table missing there is open to anyone who signs up.
- **`prayer_feed` and `pray_for_request` ask for `app.use` themselves**, because they skip row rules.
- **Not behind the door, on purpose:** `profiles` and `name_requests` (their name), `user_settings` (their
  language), `push_subscriptions` (their device). Each shows a person only their own rows, and a waiting
  person needs all three.
- **No second sign-in.** An approval reaches a token only when the token is next issued. The waiting screen
  asks for a new one on arrival, on every return to the app, and on "Check again", then reloads.
- **The name comes first.** The layout asks "What is your name?" before the waiting screen, so the admin
  sees a name beside the email. Someone who never answers is not listed and no admin is told.
- **Admins are told once per account** (`sendPushOnce`, key `sign-up:<user id>`), however often the waiting
  screen calls. The route takes no input: who is waiting comes from the session.
- **The person is told when approved**, if they switched notifications on while waiting. The screen offers it.
- **There is no Decline.** An account nobody approves stays on the list. Removing one is deleting the user
  in the Supabase dashboard (backlog B38).
- **Whoever holds `accounts.manage` approves.** The role `admin` has it.

## Expected behavior
- Signed out, `POST /api/approval/request` and `/approve` answer 401 (observed 2026-10-12).
- First sign-in: the name question, then "Waiting for approval" with the notification switch. No tab bar.
- Admin tab: "People waiting to be let in" at the top, name over email, with Approve; absent when nobody waits.
- After Approve: the row leaves the list; the person gets "You have been approved. Welcome!"; opening the
  app (or tapping "Check again") shows Home.
- `tests/rls.test.ts`, "approval": a waiting account reads and writes nothing of the church, keeps its own
  name and language, cannot approve itself, and reads the church after an admin approves and its token renews.
- **Not exercised (2026-10-12): any of it signed in.** The SQL is not run yet, so `npm run test:rls` was not run.

## Edge cases
- An approval takes effect on the token's next renewal: at once on the waiting screen, within 15 minutes anywhere else.
- Taking approval away is deleting the row in `user_roles` by hand; it bites within 15 minutes.
- A waiting person who never turns notifications on is not told; they find out on opening the app.
- Sign-up is still open, so the waiting list can collect strangers (backlog B38).

## Remove
Delete this folder, `src/app/api/approval/`, and the `// APPROVAL` lines in `src/app/layout.tsx` and
`src/app/admin/page.tsx`. Run the Undo block at the bottom of `schema.sql`. `app.use` and the role `member`
stay in `permissions`: without this feature a person gets the role by hand, as an admin does.
