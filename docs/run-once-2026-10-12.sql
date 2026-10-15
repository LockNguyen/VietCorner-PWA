-- Everything still to run for slices 4 to 6 (2026-10-12), in the order it must run.
-- Paste the whole file into Supabase → SQL Editor and run it once. Safe to run again.
-- Copy it from the editor, not from terminal output (PowerShell garbles non-ASCII text).
--
-- This file is a copy made for convenience. The feature schema.sql files stay the source of truth;
-- delete this file once it has been run.

begin; -- all of it, or none of it

-- ============================================================================
-- PART 1: groups/schema.sql section 2c (before 2b: 2b reads the column made here)
-- ============================================================================

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

-- ============================================================================
-- PART 2: groups/schema.sql section 2b
-- ============================================================================

-- 2b. What the group list reads, in one trip -------------------------------
-- This section can be run again by itself: it is how the function is changed.
--
-- Every active group, each marked with where the caller stands: joined, or asked to join and waiting.
-- Before this the page made three reads. It runs with the CALLER's rights (the default), so the policies
-- above still decide what it can see; the two `auth.uid()` conditions matter for a manager, who is
-- allowed to see everyone's requests and removed groups, and must still get only their own picture here.
-- Dropped first because its columns changed (2026-10-12: `member_count`), which `create or replace` refuses.
drop function if exists public.my_groups ();
create function public.my_groups()
returns table (id uuid, name text, member_count integer, joined boolean, pending boolean)
language sql stable set search_path = '' as $$
  select
    g.id,
    g.name,
    g.member_count,
    exists (select 1 from public.group_members m where m.group_id = g.id and m.user_id = auth.uid()),
    exists (select 1 from public.group_join_requests r where r.group_id = g.id and r.user_id = auth.uid())
  from public.groups g
  where g.deleted_at is null
  order by g.name;
$$;

revoke execute on function public.my_groups () from public, anon;
grant execute on function public.my_groups () to authenticated;

-- ============================================================================
-- PART 3: group-info/schema.sql
-- ============================================================================

-- GROUP-INFO feature schema. Run in Supabase → SQL Editor, after features/groups/schema.sql (section 2c
-- included). Safe to run again. Then run the `group_info` lines of features/approval/schema.sql section 3.
--
-- Security in one sentence: every approved member reads when and where each group meets; only the people
-- in a group change that group's details.

-- 1. Table ----------------------------------------------------------------

-- What a group tells the church about itself. One row per group, made the first time a member saves.
-- Free text in whatever language the group writes: it is theirs, like a prayer request, not a label.
create table if not exists public.group_info (
  group_id uuid primary key references public.groups (id) on delete cascade,
  meets_at text check (length(meets_at) <= 100), -- "Fridays, 7:30 PM"
  location text check (length(location) <= 150),
  notes text check (length(notes) <= 500),       -- "Read Matthew 3 before next week"
  updated_at timestamptz not null default now()
);

-- 2. Grants ---------------------------------------------------------------
-- Supabase grants everything on a new table by default, so start from nothing and add back what is needed.

revoke all on public.group_info from anon, authenticated;
grant all on public.group_info to service_role;
grant select on public.group_info to authenticated;
-- The app saves with one "insert, or update if it is there" call, which needs both grants. `group_id` is in
-- the update list because that call rewrites every column it sends; the policy below keeps it where it is.
grant insert (group_id, meets_at, location, notes), update (group_id, meets_at, location, notes)
  on public.group_info to authenticated;

-- 3. Row Level Security ---------------------------------------------------

alter table public.group_info enable row level security;

-- "Approved" is added on top by the approval feature's schema.sql; a removed group's details go with it.
drop policy if exists "Members read every active group's details" on public.group_info;
create policy "Members read every active group's details" on public.group_info
  for select to authenticated
  using (exists (select 1 from public.groups g where g.id = group_info.group_id and g.deleted_at is null));

-- Only the people in a group write its details. The sub-query sees the caller's own memberships, and only
-- in active groups (the policy on `group_members`), so a removed group cannot be written to either.
drop policy if exists "A group's members write its details" on public.group_info;
create policy "A group's members write its details" on public.group_info
  for insert to authenticated
  with check (exists (
    select 1 from public.group_members m
    where m.group_id = group_info.group_id and m.user_id = auth.uid()
  ));

drop policy if exists "A group's members change its details" on public.group_info;
create policy "A group's members change its details" on public.group_info
  for update to authenticated
  using (exists (
    select 1 from public.group_members m
    where m.group_id = group_info.group_id and m.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.group_members m
    where m.group_id = group_info.group_id and m.user_id = auth.uid()
  ));

-- 4. What the Groups page reads, in one trip -------------------------------
-- Every active group with its size, its details, and whether the caller is in it (which is what shows
-- them the Edit button; the policies above are what actually let them save).
-- It runs with the CALLER's rights (the default), so it opens nothing a direct read would not.
create or replace function public.group_directory()
returns table (id uuid, name text, member_count integer, is_member boolean, meets_at text, location text, notes text)
language sql stable set search_path = '' as $$
  select
    g.id,
    g.name,
    g.member_count,
    exists (select 1 from public.group_members m where m.group_id = g.id and m.user_id = auth.uid()),
    i.meets_at,
    i.location,
    i.notes
  from public.groups g
  left join public.group_info i on i.group_id = g.id
  where g.deleted_at is null
  order by g.name;
$$;

revoke execute on function public.group_directory () from public, anon;
grant execute on function public.group_directory () to authenticated;

-- ============================================================================
-- PART 4: approval/schema.sql section 3, the line for the new table
-- ============================================================================

drop policy if exists "Approved accounts only" on public.group_info;
create policy "Approved accounts only" on public.group_info
  as restrictive for all to authenticated using ((select public.has_permission('app.use')));

-- ============================================================================
-- PART 5: auth/schema.sql
-- ============================================================================

-- AUTH feature schema. Run once in Supabase → SQL Editor. Safe to run again.
--
-- Accounts themselves are Supabase's (`auth.users`). This is the one table of our own: where a sign-in
-- waits between the browser that opened the email link and the app that asked for it (the README, "Hand-off").
--
-- Security in one sentence: no browser can read or write this table; only our server does, with the
-- service role, and a row is useless without the secret key that never left the asking device.

-- 1. Table ----------------------------------------------------------------

create table if not exists public.login_handoffs (
  -- SHA-256 of the asking device's secret key. It travels in the email link; the key itself never does,
  -- so reading this table, or the email, is not enough to collect the sign-in.
  attempt text primary key check (attempt ~ '^[0-9a-f]{64}$'),
  -- The one-time token from the email link, left here by the confirm page. It signs in whoever presents
  -- it, once, for as long as Supabase honours it (an hour); the row is deleted when it is collected.
  token_hash text not null check (length(token_hash) between 1 and 200),
  created_at timestamptz not null default now()
);

-- 2. Server-only ----------------------------------------------------------
-- RLS on, no grants, no policies: unreachable with the public key, signed in or not.

revoke all on public.login_handoffs from anon, authenticated;
grant all on public.login_handoffs to service_role;
alter table public.login_handoffs enable row level security;

commit;
