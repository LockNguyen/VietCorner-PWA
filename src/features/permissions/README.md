# permissions

Who may do what beyond being a member: today "admin", later group leaders and post writers. A foundation,
like `groups`: other features depend on it in SQL (`has_permission`) and ask it once per page what to show.

System docs: `.claude/architecture.md`. Shape and conventions: `docs/adding-a-feature.md`.

## Setup
1. Run `schema.sql` in Supabase → SQL Editor, **before** any feature with admin actions.
2. Switch the hook on: Dashboard → Authentication → Hooks → **Custom Access Token** → Postgres function
   `public.custom_access_token_hook`. Sign in once straight away to prove sign-in still works.
3. Make someone an admin (bottom of `schema.sql`). It takes effect when their token refreshes: within the
   hour, or at once if they sign out and in.

## Files
| Layer | File | Job |
|---|---|---|
| Data | `schema.sql` | `role_permissions`, `user_roles` (both server-only), the token hook, `has_permission`, the DROPs |
| Server reads | `server/queries.ts` | `getMyPermissions(supabase)` → the list from the login token |
| Shell | `src/app/layout.tsx` (`// PERMISSIONS`) | Reads the list once per page load; shows the Admin tab when it is not empty |
| Shell | `src/app/admin/page.tsx` | One section per feature, each shown only with that feature's permission |

## How it works
```
sign-in / token refresh ──► custom_access_token_hook ──► token carries  permissions: ["events.manage", …]
                              (reads user_roles ⋈ role_permissions, once)
every query ──► policy: (select has_permission('events.manage')) ──► reads the token, touches no table
every page  ──► getMyPermissions() ──► reads the same token ──► which tabs and sections to show
```

## Decisions worth knowing
- **Policies name a permission, never a role.** A role is a bundle of permissions stored as rows, so adding
  "post writer" is `insert` statements, and no policy is rewritten.
- **Each feature registers its own permission** in its own `schema.sql`
  (`insert into role_permissions values ('admin', 'groups.manage')`) and exports the name from its
  `types.ts`. Removing a feature removes its permission with it.
- **Permissions travel in the login token** (chosen 2026-10-06 over a table lookup per query). A check costs
  nothing, at any size. The price:
  - A change takes effect only when the token refreshes, **up to an hour**. Taking a role away is not
    instant; for an emergency, delete the user's sessions in the dashboard.
  - Part of the setup lives in the dashboard (the hook switch), not in this repository.
  - A hook that fails stops **everyone** from signing in. It is one `select` with no way to raise, and
    switching the hook off in the dashboard is the instant undo.
- **`has_permission` is written as `(select has_permission(...))` in a policy**, so Postgres evaluates it
  once per query rather than once per row.
- **What the page reads is for showing, not for protecting.** `getMyPermissions` decides which tab and
  sections appear; the database checks the token again on every write.
- **Roles are assigned by hand** in the dashboard. A screen for it is its own feature.

## Not built yet: roles inside one group
A group leader may do something *in their group only*. That adds a nullable `group_id` to `user_roles`, a
second claim in the token (`group_permissions: { "<group id>": ["prayer.moderate"] }`) and a second function,
`has_group_permission(permission, group_id)`. Existing policies keep working unchanged, because they ask
about church-wide permissions.

## Expected behavior
- A member's token has `permissions: []`; they see no Admin tab, and `/admin` is a 404.
- Someone with the `admin` role sees the tab and every section.
- Verified 2026-10-06 in a rolled-back transaction (18 checks): the hook's output for an admin, a member and
  an unknown user; a member cannot read or grant roles or call the hook; only the right permission opens a
  feature. **Not verified: the hook being called by Supabase Auth itself** — that needs the dashboard switch.

## Remove
Switch the hook off in the dashboard **first**. Then run the DROP statements in `schema.sql` (they also drop
every policy that uses `has_permission`), delete this folder and `src/app/admin/`, and remove the
`// PERMISSIONS` lines in `layout.tsx` and `TabBar.tsx`.
