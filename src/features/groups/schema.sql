-- GROUPS feature schema. Run once in Supabase → SQL Editor, after features/permissions/schema.sql and
-- before any feature that shares by group (chat, events, prayer).
-- Security: every table has RLS. Browsers can only see and write what the policies below allow.

-- 1. Tables ---------------------------------------------------------------

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 60),
  created_at timestamptz not null default now()
);

create table public.group_members (
  group_id uuid not null references public.groups (id) on delete cascade,
  -- Defaults from the caller's login token, so the browser never has to send it.
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

-- 2. Permissions ----------------------------------------------------------
-- Grants say which operations are possible at all; RLS policies then filter rows.

grant select on public.groups to authenticated;
-- Supabase grants everything on a new table by default, so take the writes away first: otherwise the
-- column list below would mean nothing.
revoke insert, update, delete on public.groups from anon, authenticated;
grant insert (name), update (name) on public.groups to authenticated; -- only the name, and only with the policies below
grant select, insert on public.group_members to authenticated;
grant all on public.groups, public.group_members to service_role;

alter table public.groups enable row level security;
alter table public.group_members enable row level security;

create policy "Signed-in users can see all groups"
  on public.groups for select to authenticated
  using (true);

-- Creating and renaming groups needs the "groups.manage" permission, read from the login token.
create policy "Group managers create groups"
  on public.groups for insert to authenticated
  with check ((select public.has_permission('groups.manage')));

create policy "Group managers rename groups"
  on public.groups for update to authenticated
  using ((select public.has_permission('groups.manage')))
  with check ((select public.has_permission('groups.manage')));

insert into public.role_permissions (role, permission) values ('admin', 'groups.manage');

create policy "Users see their own memberships"
  on public.group_members for select to authenticated
  using (user_id = auth.uid());

create policy "Users can join a group as themselves"
  on public.group_members for insert to authenticated
  with check (user_id = auth.uid());

-- 3. Seed data ------------------------------------------------------------

insert into public.groups (name) values ('Test Group'), ('Bible Study');

-- 4. Undo (removing the feature) ------------------------------------------
-- Everything that shares by group goes with it: `cascade` drops the columns and policies that point here.
-- drop table if exists public.group_members, public.groups cascade;
