-- PUSH feature schema. Run once in Supabase → SQL Editor.
-- Security: RLS is on. A user reaches only their own devices; the server sends with the service role.

-- 1. Table ----------------------------------------------------------------

-- One row per device. The endpoint is a URL unique to that browser + app install.
create table public.push_subscriptions (
  endpoint text primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  subscription jsonb not null,
  created_at timestamptz not null default now()
);

-- 2. Permissions ----------------------------------------------------------

grant select, insert, update, delete on public.push_subscriptions to authenticated;
grant all on public.push_subscriptions to service_role;

alter table public.push_subscriptions enable row level security;

create policy "Users manage their own push subscriptions"
  on public.push_subscriptions for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- 3. Undo (removing the feature) ------------------------------------------
-- drop table if exists public.push_subscriptions cascade;
