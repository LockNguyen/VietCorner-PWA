# Adding a feature

Every feature in this app has the same shape, so a reader who knows one knows them all. Follow this file
top to bottom and the result will look like `auth`, `chat` and `assistant`.

The rule behind the shape: **removing a feature is deleting its folder plus a few marked lines.** If a step
here would break that, stop and simplify instead.

## 1. Decide what the feature owns

| Question | Answer it before writing code |
|---|---|
| What tables does it need? | New tables belong to this feature and go in its `schema.sql` |
| Who may read and write each row? | Write the RLS policies first (§3). They are the real security. |
| Does the browser need a secret, or must a write cause a side effect (push, AI, email)? | Yes → an API route. No → the browser talks to Supabase directly. |
| What does a page need before it renders? | That read goes in `server/queries.ts` |

## 2. Create the files

```
src/features/<name>/
  README.md        Purpose · Setup · Files · Decisions · Expected behavior · Remove
  schema.sql       Tables, grants, RLS policies, and the DROP statements to undo them
  types.ts         The row shapes and any type the feature's own files share
  strings.ts       User-facing text (see §6)
  api.ts           EVERY browser → backend call for this feature
  hooks/           Client state and effects; one hook per job
  components/      Markup only: props in, JSX out, events call hooks or api.ts
  server/
    queries.ts     Server-side reads, called by pages
    <action>.ts    Server logic, called by route handlers
```

Then wire it into the shell, one line each:
- `src/app/<name>/page.tsx` — load data, render components.
- `src/app/api/<name>/<action>/route.ts` — only if the feature needs a route.
- `src/components/AppTabs.tsx` — add to `TABS` if it needs a tab.
- `.claude/architecture.md` §6 — one paragraph and a link to the feature README.

Not every file is required. An assistant with no tables has no `schema.sql`; a feature whose page needs no
data has no `server/queries.ts`. **Do not create an empty file to satisfy the list.**

## 3. Write the RLS policies first

Every table in `public` must have RLS enabled. A table without it is readable by anyone holding the anon
key, which ships in the browser. Four patterns cover everything we have built so far:

```sql
-- Pattern A: rows that belong to one user (push_subscriptions, prayer requests, account settings)
alter table public.<table> enable row level security;
grant select, insert, update, delete on public.<table> to authenticated;

create policy "Owners read their own rows" on public.<table>
  for select to authenticated using (user_id = auth.uid());
create policy "Owners write their own rows" on public.<table>
  for insert to authenticated with check (user_id = auth.uid());

-- Pattern B: rows any signed-in member may read, but only members of a group may write (messages)
create policy "Members read" on public.<table>
  for select to authenticated using (
    exists (select 1 from public.group_members m
            where m.group_id = <table>.group_id and m.user_id = auth.uid()));

-- Pattern C: server-only table, e.g. document_chunks: RLS on, no grants, no policies.
-- Only the service role (never in the browser) can reach it.
alter table public.<table> enable row level security;
revoke all on public.<table> from anon, authenticated;

-- Pattern D: a COLUMN some readers must not see (who wrote an anonymous prayer request).
-- RLS filters rows, never columns. Give members no select on the table and let them read a view that
-- leaves the column out. The view runs as its owner, so ITS where clause must do the membership check.
revoke all on public.<table> from anon, authenticated;
create view public.<table>_feed with (security_invoker = false) as
  select id, body, case when is_anonymous then null else author_email end as author_email
  from public.<table> t
  where exists (select 1 from public.group_members m
                where m.group_id = t.group_id and m.user_id = auth.uid());
grant select on public.<table>_feed to authenticated;
```
**Admin actions** use a fifth shape: the policy asks for a permission, read from the login token.
```sql
create policy "Event managers edit events" on public.events
  for update to authenticated
  using ((select public.has_permission('events.manage')))
  with check ((select public.has_permission('events.manage')));
insert into public.role_permissions (role, permission) values ('admin', 'events.manage');
```
Name a permission, never a role, and keep the `(select ...)`: it makes the check run once per query.
Export the name from the feature's `types.ts`, and give the feature an admin component that
`src/app/admin/page.tsx` shows when the user has it. `features/groups` is the worked example.

`features/prayer/schema.sql` is the worked example of Pattern D, including column grants (`grant insert (a, b)`) so a
caller cannot send the columns that must come from the login token.

Rules of thumb:
- **`with check` guards writes, `using` guards reads.** An insert policy without `with check` lets a user
  write rows they could never read.
- Default identifying columns from the token, never from the request body:
  `user_id uuid not null default auth.uid()`. Otherwise a caller can post as someone else.
- Put the `drop table` statements at the bottom of the same `schema.sql`, so removing the feature is copy-paste.
- Add the feature's tables to `tests/rls.test.ts` (`npm run test:rls`). It proves one user cannot read
  another's rows, which is the mistake nobody notices until it matters.

## 4. Keep the layers pointing one way

```
app/**/page.tsx ──► components ──► hooks ──► api.ts ──► Supabase (RLS)
      │                                        └──────► app/api/**/route.ts ──► server/<action>.ts ──► Supabase
      └──► server/queries.ts ──► Supabase (RLS)
```

- `@/lib/supabase/*` may be imported only by `api.ts`, `server/*` and `src/app/**`. Never by a component or
  a hook. Check with a search; expect zero hits.
- `server/*` receives the Supabase client as an argument and imports nothing from Next.js, so the feature
  could move to another backend by copying that folder.
- A `route.ts` only parses input, verifies the user, calls one `server/*` function and returns JSON.
- A feature never imports another feature's internals. Sharing happens in `src/app/**` (a page may compose
  two features) or in `src/lib`.

## 5. Handle failure on purpose

Decide, per call, what the user sees when it fails. The assistant's `errors.ts` is the pattern to copy when a
feature has more than one failure mode: a table of cause → message + whether a retry could help. Key it by
**cause**, not HTTP status — "the phone is offline" and "the request timed out" have no status.

### A button that starts a request
Never a plain `<button>`: a request takes a moment, and a button that looks the same during it gets tapped
again. Use the shared pair, the same way everywhere. New code uses `Button` (`@/components/ui/Button`, with
`variant` for its look); `ActionButton` below is the same idea on screens not yet restyled.

```tsx
const { pending, run } = usePending<"save" | "remove">();   // @/lib/usePending

<ActionButton pending={pending === "save"} pendingLabel={t(STRINGS.saving)}   // @/components/ui/ActionButton
              disabled={pending !== null || nothingToSave}>Save</ActionButton>
<ActionButton pending={pending === "remove"} disabled={pending !== null}
              onClick={() => run("remove", remove)}>Remove</ActionButton>
```

`pending === "<this action>"` shows the circle on the tapped button; `pending !== null` disables its
siblings. Leave `pendingLabel` out for the circle alone. In a list, make each row its own component so it
has its own `usePending` and its own error line. Buttons that only open or close something stay plain.

When the change must show up in data the page loaded on the server, end the work with
`await refresh()` from `useRefresh` (`@/lib/useRefresh`), not `router.refresh()`: it resolves when the new
data is drawn, so the button stays busy until what it shows has changed.

## 6. Put user-facing text in `strings.ts`

```ts
// features/<name>/strings.ts
import type { Text } from "@/features/i18n/types"; // I18N

export const STRINGS = {
  sendButton: { en: "Send", vi: "Gửi" } satisfies Text,
  emptyState: { en: "Nothing here yet.", vi: "Chưa có gì ở đây." } satisfies Text,
};
```

Components read them with `const { t } = useLanguage()` and `t(STRINGS.sendButton)`, never inline text.
A sentence with a number in it is a function returning a `Text` (`prayedForYou(count)` in `prayer`).

## 7. Tests

| What | How |
|---|---|
| Pure logic (formatting, retry maths, storage, error tables) | Vitest, `<module>.test.ts` next to the file, `npm test` |
| RLS policies | Add the table to `tests/rls.test.ts`, `npm run test:rls` |
| Hooks and components | Not tested; verified by running the app (see the feature README's Expected behavior) |
| Python AI service | pytest in `services/ai` |

## 8. Before you call it done

- [ ] `npm run build` passes (it type-checks).
- [ ] `npm test` and, if you added a table, `npm run test:rls` pass.
- [ ] The feature README is filled in, including **Expected behavior** (what a tester should see) and **Remove**.
- [ ] `.claude/architecture.md`: one paragraph in §6, any new env var in §8, a Key Decision row for anything
      non-obvious, and a line in the change log.
- [ ] `.claude/active_context.md`: checklist updated, next steps rewritten.
- [ ] Anything deliberately left undone is in `.claude/backlog.md`, so it is not quietly forgotten.
