-- PROFILES foundation schema. Run once in Supabase → SQL Editor. Not safe to run twice (plain `create`).
-- Copy this file from the editor, not from terminal output (PowerShell garbles non-ASCII text).
--
-- Security in one sentence: a name is read by its owner, by people who share a group with them and by
-- group managers; a user changes only their own; nobody but the database creates or deletes a row.

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
grant update (name, named_at) on public.profiles to authenticated;

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

-- `with check` as well as `using`: without it a user could move their row onto someone else's id.
drop policy if exists "Users change their own name" on public.profiles;
create policy "Users change their own name" on public.profiles
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- 5. Undo (removing the foundation) ---------------------------------------
-- The prayer feed reads names: recreate `prayer_feed` without them first (features/prayer/schema.sql).
-- drop trigger if exists create_profile_for_new_user on auth.users;
-- drop function if exists public.create_profile ();
-- drop table if exists public.profiles;
-- drop function if exists public.shares_a_group_with (uuid);
