-- I18N feature schema. Run once in Supabase → SQL Editor.
-- Security: one row per user, readable and writable only by that user.

-- 1. Table ----------------------------------------------------------------

create table public.user_settings (
  -- One row per account. Deleting the account deletes the row.
  user_id uuid primary key references auth.users on delete cascade default auth.uid(),
  -- The two languages the app ships. A check constraint, not a lookup table: adding a third language means
  -- adding translations in code anyway, so a migration is the honest place for that change.
  language text not null check (language in ('en', 'vi')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Grants ---------------------------------------------------------------
-- The browser reads and writes its own row directly (a simple write, no side effects).

grant select, insert, update on public.user_settings to authenticated;

-- 3. Row Level Security ---------------------------------------------------

alter table public.user_settings enable row level security;

-- `using` guards reads, `with check` guards writes. Without the check, a user could write a row for
-- someone else's id and change the language of an account they do not own.
create policy "Users read their own settings" on public.user_settings
  for select to authenticated using (user_id = auth.uid());

create policy "Users create their own settings" on public.user_settings
  for insert to authenticated with check (user_id = auth.uid());

create policy "Users update their own settings" on public.user_settings
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 4. Undo (removing the feature) ------------------------------------------
-- drop table public.user_settings;
