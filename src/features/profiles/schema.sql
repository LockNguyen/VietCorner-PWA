-- PROFILES foundation schema. Run once in Supabase → SQL Editor. Not safe to run twice (plain `create`).
-- Copy this file from the editor, not from terminal output (PowerShell garbles non-ASCII text).
--
-- Security in one sentence: a name is read by its owner, by people who share a group with them and by
-- group managers; it is changed only through `set_my_name`, which a group manager must approve once the
-- person is in a group; nobody but the database creates or deletes a row.

-- 1. Table ----------------------------------------------------------------

create table public.profiles (
  -- One row per account. Deleting the account deletes the row.
  user_id uuid primary key references auth.users on delete cascade,
  -- What other members see. Starts as the part of the email before the @ (section 2), so everyone has
  -- something to be called by before they have been asked.
  name text not null check (char_length(btrim(name)) between 1 and 60),
  -- When the person gave their name. Null = still the stand-in, and the app asks at their next visit.
  named_at timestamptz
);

-- 2. A row for every account ----------------------------------------------
-- Created by the database the moment an account is, so no screen ever meets a person without a name and
-- no code needs a fallback. It runs as its owner because the signing-in user has no insert grant.
-- Kept trivial on purpose: if this function fails, the sign-up fails with it.
create function public.create_profile() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (user_id, name)
  values (new.id, coalesce(nullif(left(split_part(coalesce(new.email, ''), '@', 1), 60), ''), '?'));
  return new;
end;
$$;

revoke execute on function public.create_profile () from public, anon, authenticated;

create trigger create_profile_for_new_user
  after insert on auth.users
  for each row execute function public.create_profile();

-- The accounts that already exist.
insert into public.profiles (user_id, name)
select id, coalesce(nullif(left(split_part(coalesce(email, ''), '@', 1), 60), ''), '?')
from auth.users
on conflict (user_id) do nothing;

-- 3. Grants ---------------------------------------------------------------
-- Supabase grants everything by default, so a column list means nothing until that is taken away.

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
-- No update grant: a name is changed through the functions in section 5, which hold the rule.

-- 4. Row Level Security ---------------------------------------------------
-- This section can be run again by itself: it is how the policies are changed.

alter table public.profiles enable row level security;

-- "Do I share a group with this person?" A function with its owner's rights, because RLS (correctly) shows
-- a member only their own memberships, so a plain sub-query in the policy could never see the other
-- person's. It answers yes or no about the caller, and nothing else.
create or replace function public.shares_a_group_with(other uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.group_members mine
    join public.group_members theirs on theirs.group_id = mine.group_id
    join public.groups g on g.id = mine.group_id
    where mine.user_id = auth.uid()
      and theirs.user_id = other
      and g.deleted_at is null -- a removed group connects nobody
  );
$$;

revoke execute on function public.shares_a_group_with (uuid) from public, anon;
grant execute on function public.shares_a_group_with (uuid) to authenticated;

-- Sign-up is open, so "any signed-in user" would be anyone with an email address. A name is read by its
-- owner, by people in a group with them, and by whoever answers join requests (decided 2026-10-08).
drop policy if exists "Signed-in users read every name" on public.profiles;
drop policy if exists "Names are read within a group, and by group managers" on public.profiles;
create policy "Names are read within a group, and by group managers" on public.profiles
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or (select public.has_permission('groups.manage'))
    or public.shares_a_group_with(user_id)
  );

-- 5. Changing a name ------------------------------------------------------
-- This section can be run again by itself.
--
-- The rule (decided 2026-10-08): admins gate members against impersonation. Whoever lets a person into a
-- group sees their name and email at that moment, so from then on the name must not change unseen.
-- A person in no group sets their name freely: nobody else can read it yet.

-- A name someone asked for, waiting for a group manager. One per person: asking again replaces it.
create table if not exists public.name_requests (
  user_id uuid primary key references auth.users (id) on delete cascade,
  user_email text not null, -- what the manager sees beside the name: it cannot be typed, only signed in with
  name text not null check (char_length(btrim(name)) between 1 and 60),
  requested_at timestamptz not null default now()
);

-- Written only by the two functions below. A manager declines by deleting.
revoke all on public.name_requests from anon, authenticated;
grant select, delete on public.name_requests to authenticated;

alter table public.name_requests enable row level security;

drop policy if exists "People see their own name request, managers see all" on public.name_requests;
create policy "People see their own name request, managers see all" on public.name_requests
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.has_permission('groups.manage')));

drop policy if exists "Group managers decline name requests" on public.name_requests;
create policy "Group managers decline name requests" on public.name_requests
  for delete to authenticated
  using ((select public.has_permission('groups.manage')));

-- The direct way to change a name is closed: with it, the rule above could be skipped from any browser.
drop policy if exists "Users change their own name" on public.profiles;
revoke update on public.profiles from authenticated;

-- Sets the caller's name, and answers what happened: 'saved', or 'requested' when a manager must approve.
-- "In a group" includes having asked to join one: a manager is looking at that name right now.
create or replace function public.set_my_name(new_name text) returns text
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := auth.uid();
begin
  if me is null then
    raise exception 'Not signed in';
  end if;

  if not exists (select 1 from public.group_members m where m.user_id = me)
     and not exists (select 1 from public.group_join_requests r where r.user_id = me) then
    update public.profiles set name = btrim(new_name), named_at = now() where user_id = me;
    delete from public.name_requests where user_id = me;
    return 'saved';
  end if;

  insert into public.name_requests (user_id, user_email, name)
  values (me, auth.jwt() ->> 'email', btrim(new_name))
  on conflict (user_id) do update set name = excluded.name, requested_at = now();

  -- The question has been answered, so the app stops asking it while the request waits.
  update public.profiles set named_at = coalesce(named_at, now()) where user_id = me;
  return 'requested';
end;
$$;

revoke execute on function public.set_my_name (text) from public, anon;
grant execute on function public.set_my_name (text) to authenticated;

-- Approving is the only way a requested name becomes a name: the request turns into the name in one step.
-- It answers whether there was a request to approve, so the server tells the person only when one was.
create or replace function public.approve_name_request(user_id uuid) returns boolean
language sql security definer set search_path = '' as $$
  with approved as (
    delete from public.name_requests r
    where r.user_id = approve_name_request.user_id
      and (select public.has_permission('groups.manage'))
    returning r.user_id, r.name
  ), renamed as (
    update public.profiles p
    set name = approved.name, named_at = now()
    from approved
    where p.user_id = approved.user_id
  )
  select exists (select 1 from approved);
$$;

revoke execute on function public.approve_name_request (uuid) from public, anon;
grant execute on function public.approve_name_request (uuid) to authenticated;

-- 6. Undo (removing the foundation) ---------------------------------------
-- The prayer feed reads names: recreate `prayer_feed` without them first (features/prayer/schema.sql).
-- drop trigger if exists create_profile_for_new_user on auth.users;
-- drop function if exists public.create_profile ();
-- drop function if exists public.approve_name_request (uuid);
-- drop function if exists public.set_my_name (text);
-- drop table if exists public.name_requests;
-- drop table if exists public.profiles;
-- drop function if exists public.shares_a_group_with (uuid);
