-- GROUPS feature schema. Run once in Supabase → SQL Editor, after features/permissions/schema.sql and
-- before any feature that shares by group (chat). On a new database, run section 2c before 2b, and after
-- features/profiles/schema.sql: `group_people()` reads names.
-- Security: every table has RLS. Browsers can only see and write what the policies below allow.

-- 1. Tables ---------------------------------------------------------------

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 60),
  -- Set when a manager removes the group. The row stays, and so do its messages, events and prayers:
  -- a group is too much to lose to one tap. Clearing this (in the dashboard) brings all of it back.
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.group_members (
  group_id uuid not null references public.groups (id) on delete cascade,
  -- Defaults from the caller's login token, so the browser never has to send it.
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

-- Someone asked to join a group and is waiting for a manager. A request is NOT a membership: it opens
-- nothing. Keeping it in its own table is what lets `group_members` go on meaning "is a member", so no
-- policy in chat, events or prayer has to know that joining needs approval.
create table public.group_join_requests (
  group_id uuid not null references public.groups (id) on delete cascade,
  -- Both come from the caller's login token; the browser sends only the group.
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  user_email text not null default (auth.jwt() ->> 'email'), -- what the manager sees
  requested_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

-- 2. Permissions ----------------------------------------------------------
-- Grants say which operations are possible at all; RLS policies then filter rows.

grant select on public.groups to authenticated;
-- Supabase grants everything on a new table by default, so take the writes away first: otherwise the
-- column list below would mean nothing.
revoke insert, update, delete on public.groups from anon, authenticated;
grant insert (name), update (name, deleted_at) on public.groups to authenticated; -- only with the policies below
grant select on public.group_members to authenticated; -- no insert: the way in is approve_join_request
grant all on public.groups, public.group_members to service_role;

alter table public.groups enable row level security;
alter table public.group_members enable row level security;

-- Managers must be able to see a removed group too: Postgres checks the row an update leaves behind
-- against this policy, so without the second half, removing a group would be refused.
create policy "Signed-in users see active groups, managers see all"
  on public.groups for select to authenticated
  using (deleted_at is null or (select public.has_permission('groups.manage')));

-- Creating, renaming and removing groups needs the "groups.manage" permission, read from the login token.
create policy "Group managers create groups"
  on public.groups for insert to authenticated
  with check ((select public.has_permission('groups.manage')));

create policy "Group managers rename and remove groups"
  on public.groups for update to authenticated
  using ((select public.has_permission('groups.manage')))
  with check ((select public.has_permission('groups.manage')));

insert into public.role_permissions (role, permission) values ('admin', 'groups.manage');

-- THE rule that makes a removed group go quiet everywhere. Chat, events and prayer all decide who may see
-- a row by looking for the caller's membership; a membership in a removed group is invisible, so every one
-- of those checks fails without those features knowing that groups can be removed.
create policy "Users see their own memberships in active groups"
  on public.group_members for select to authenticated
  using (
    user_id = auth.uid()
    and exists (select 1 from public.groups g where g.id = group_members.group_id and g.deleted_at is null)
  );

-- Joining: a member asks, a manager decides. Nobody adds themselves to `group_members` any more.
revoke all on public.group_join_requests from anon, authenticated;
grant all on public.group_join_requests to service_role;
grant select, delete on public.group_join_requests to authenticated;
grant insert (group_id) on public.group_join_requests to authenticated;
alter table public.group_join_requests enable row level security;

create policy "Users see their own requests, managers see all"
  on public.group_join_requests for select to authenticated
  using (user_id = auth.uid() or (select public.has_permission('groups.manage')));

create policy "Users ask to join an active group as themselves"
  on public.group_join_requests for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.groups g where g.id = group_join_requests.group_id and g.deleted_at is null)
  );

-- Declining is deleting the request. The person may ask again.
create policy "Group managers decline requests"
  on public.group_join_requests for delete to authenticated
  using ((select public.has_permission('groups.manage')));

-- Approving is the only way into `group_members`: the request becomes a membership, in one step, so there
-- is never a moment with both or neither. It answers whether there was a request to approve, so the server
-- notifies the new member only when one was.
create function public.approve_join_request(group_id uuid, user_id uuid) returns boolean
language sql security definer set search_path = '' as $$
  with approved as (
    delete from public.group_join_requests r
    where r.group_id = approve_join_request.group_id
      and r.user_id = approve_join_request.user_id
      and (select public.has_permission('groups.manage'))
    returning r.group_id, r.user_id
  ), joined as (
    insert into public.group_members (group_id, user_id)
    select approved.group_id, approved.user_id from approved
    on conflict do nothing
  )
  select exists (select 1 from approved);
$$;

revoke execute on function public.approve_join_request (uuid, uuid) from public, anon;
grant execute on function public.approve_join_request (uuid, uuid) to authenticated;

-- 2b. What the group list reads, in one trip -------------------------------
-- This section can be run again by itself: it is how the function is changed.
--
-- Every active group, each marked with where the caller stands: joined, or asked to join and waiting.
-- Before this the page made three reads. It runs with the CALLER's rights (the default), so the policies
-- above still decide what it can see; the two `auth.uid()` conditions matter for a manager, who is
-- allowed to see everyone's requests and removed groups, and must still get only their own picture here.
-- Dropped first because its columns changed (2026-10-12: `member_count`, `thumbnail_path`), which
-- `create or replace` refuses.
drop function if exists public.my_groups ();
create function public.my_groups()
returns table (id uuid, name text, member_count integer, thumbnail_path text, joined boolean, pending boolean)
language sql stable set search_path = '' as $$
  select
    g.id,
    g.name,
    g.member_count,
    g.thumbnail_path,
    exists (select 1 from public.group_members m where m.group_id = g.id and m.user_id = auth.uid()),
    exists (select 1 from public.group_join_requests r where r.group_id = g.id and r.user_id = auth.uid())
  from public.groups g
  where g.deleted_at is null
  order by g.name;
$$;

revoke execute on function public.my_groups () from public, anon;
grant execute on function public.my_groups () to authenticated;

-- 2c. Admins put people into groups (2026-10-12) ----------------------------
-- This section can be run again by itself. Run it BEFORE running 2b again: 2b reads the column made here.
--
-- Asking to join is switched off (src/lib/switches.ts). Whoever holds "groups.manage" adds and removes
-- people instead, and types how many people the group has: many who come do not use the app, so a count
-- of accounts would be wrong.

-- How many people the group has, as an admin typed it. Null = never typed.
alter table public.groups add column if not exists member_count integer check (member_count >= 0);
grant update (member_count) on public.groups to authenticated; -- only with the manager policy in section 2

-- Adding is an insert, removing is a delete. `user_id` is in the list because here it is someone else.
grant insert (group_id, user_id), delete on public.group_members to authenticated;

-- A manager sees who is in every active group. Needed to remove someone: Postgres applies the read rule
-- to the row a delete is looking for. Members still see only their own (section 2).
drop policy if exists "Group managers see every membership in active groups" on public.group_members;
create policy "Group managers see every membership in active groups"
  on public.group_members for select to authenticated
  using (
    (select public.has_permission('groups.manage'))
    and exists (select 1 from public.groups g where g.id = group_members.group_id and g.deleted_at is null)
  );

drop policy if exists "Group managers add people to groups" on public.group_members;
create policy "Group managers add people to groups"
  on public.group_members for insert to authenticated
  with check ((select public.has_permission('groups.manage')));

drop policy if exists "Group managers remove people from groups" on public.group_members;
create policy "Group managers remove people from groups"
  on public.group_members for delete to authenticated
  using ((select public.has_permission('groups.manage')));

-- Everyone who may use the app, each with their name, the email they signed in with and the active groups
-- they are in: what the admin's list of people to add is made of, and who is in no group yet.
-- It runs with its owner's rights, because it reads what no browser may (emails in `auth.users`, the roles
-- table), so it checks the caller's permission itself: that check IS the security. Empty for a member.
create or replace function public.group_people()
returns table (user_id uuid, name text, email text, group_ids uuid[])
language sql stable security definer set search_path = '' as $$
  select
    u.id,
    p.name,
    u.email::text,
    coalesce(
      (select array_agg(m.group_id)
       from public.group_members m
       join public.groups g on g.id = m.group_id
       where m.user_id = u.id and g.deleted_at is null),
      '{}'
    )
  from auth.users u
  join public.profiles p on p.user_id = u.id
  where (select public.has_permission('groups.manage'))
    -- Approved accounts only: someone still waiting to be let in is not offered.
    and exists (
      select 1
      from public.user_roles ur
      join public.role_permissions rp on rp.role = ur.role
      where ur.user_id = u.id and rp.permission = 'app.use'
    )
  order by p.name;
$$;

revoke execute on function public.group_people () from public, anon;
grant execute on function public.group_people () to authenticated;

-- 2d. A group's picture (2026-10-12) ----------------------------------------
-- This section can be run again by itself. Run it BEFORE running 2b again: 2b reads the column made here.
--
-- The small picture that starts a group's row. Whoever holds "groups.manage" sets, replaces and removes
-- it. The file lives in Storage; the group keeps its path, and a new picture is a new file with a new name.

alter table public.groups add column if not exists thumbnail_path text check (length(thumbnail_path) <= 200);
grant update (thumbnail_path) on public.groups to authenticated; -- only with the manager policy in section 2

-- A PUBLIC bucket, on purpose: this picture is on every row of the Groups tab, and a public address lets
-- the phone keep it. It is one picture an admin chose to stand for the group; a group's activity photos
-- are private (features/group-info). Anyone holding a file's address can open it; the address is not
-- guessable (two random ids). JPEG only, 200 KB at most: Storage enforces both.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('group-thumbnails', 'group-thumbnails', true, 204800, array['image/jpeg'])
on conflict (id) do update
set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Group managers manage group pictures" on storage.objects;
create policy "Group managers manage group pictures" on storage.objects
  for all to authenticated
  using (bucket_id = 'group-thumbnails' and (select public.has_permission('groups.manage')))
  with check (bucket_id = 'group-thumbnails' and (select public.has_permission('groups.manage')));

-- 3. Seed data ------------------------------------------------------------

insert into public.groups (name) values ('Test Group'), ('Bible Study');

-- 4. Undo (removing the feature) ------------------------------------------
-- drop function if exists public.my_groups ();
-- drop function if exists public.group_people ();
-- Empty the bucket in the dashboard first (Storage → group-thumbnails), then:
-- drop policy if exists "Group managers manage group pictures" on storage.objects;
-- delete from storage.buckets where id = 'group-thumbnails';
-- Everything that shares by group goes with it: `cascade` drops the columns and policies that point here.
-- drop function if exists public.approve_join_request (uuid, uuid);
-- drop table if exists public.group_join_requests, public.group_members, public.groups cascade;
