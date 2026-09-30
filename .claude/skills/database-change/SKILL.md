---
name: database-change
description: Create or change a Supabase table, column, grant, or RLS policy (any edit to a features/*/schema.sql). Use whenever data is stored, read, or permissions on rows change.
---

# Database change

RLS is the only thing between one member and another member's data: the anon key ships in the browser.
A missing policy is silent — the owner sees their data, everyone else sees nothing, or everyone sees everything.

## 1. Write the policies with the table, in the feature's `schema.sql`
Pick the pattern (full SQL in `docs/adding-a-feature.md` §3):
- **Owner rows** (prayer requests, settings, push subscriptions): `using (user_id = auth.uid())` for reads,
  `with check (user_id = auth.uid())` for writes.
- **Group rows** (messages): membership `exists (...)` in both.
- **Server-only** (`document_chunks`): RLS on, `revoke all from anon, authenticated`, no policies.

## 2. Required, every time
- `alter table ... enable row level security;` — a `public` table without it is world-readable.
- `grant` only the operations the browser actually performs.
- Identity columns default from the token: `user_id uuid not null default auth.uid()`. Never trust a body field.
- `with check` on every insert/update policy. Without it a user can write rows they cannot read.
- DROP statements at the bottom of the same `schema.sql`, so removal is copy-paste.
- A case in `tests/rls.test.ts` per new table: the owner can read/write, another signed-in user cannot.
- `npm run test:rls` passes before the work is called done.
- The table listed in `.claude/architecture.md` §7.

## 3. Ask the user
- Who may read, and who may write? Say the answer back in one sentence before writing SQL.
- Is a row ever visible to the whole church, or only to a group?
- Can it be deleted, and by whom — author, leader, nobody?
- Does the content need `{en, vi}` columns (bilingual) or one language?

## 4. Applying it
The user runs the SQL in the Supabase SQL Editor. Give them the exact block to paste, say which project and
whether it is safe to re-run. Never assume a migration ran: verify with `npm run test:rls` or a query.
