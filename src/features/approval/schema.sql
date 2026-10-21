-- APPROVAL feature schema. Run in Supabase → SQL Editor AFTER every other feature's schema.sql: section 3
-- names their tables. Sections 1 to 3 can be run again; section 4 is run ONCE.
--
-- Security in one sentence: an account that no admin has approved can sign in, give its name and switch
-- notifications on, and reads or writes nothing else, even with a direct Supabase call.
--
-- How: approving gives the account the role "member", whose permission "app.use" reaches the login token
-- like any other (features/permissions/schema.sql). There is no table of its own: "waiting" means "has a
-- name and no role that grants app.use".

-- 1. The permission to approve ---------------------------------------------

insert into public.role_permissions (role, permission) values ('admin', 'accounts.manage')
on conflict do nothing;

-- 2. Who is waiting, and letting them in -----------------------------------
-- Both run with their owner's rights, because they touch what no browser may: emails in `auth.users` and
-- the roles table. Each therefore checks the caller's permission itself; that check IS the security.

-- Everyone waiting, longest wait first, with the email they signed in with: a name is whatever its owner
-- typed, the email is what the admin can recognise. Empty for anyone without "accounts.manage".
create or replace function public.waiting_accounts()
returns table (user_id uuid, name text, email text)
language sql stable security definer set search_path = '' as $$
  select u.id, p.name, u.email::text
  from auth.users u
  join public.profiles p on p.user_id = u.id
  where (select public.has_permission('accounts.manage'))
    and p.named_at is not null -- still at "what is your name?": not asking yet
    and not exists (
      select 1
      from public.user_roles ur
      join public.role_permissions rp on rp.role = ur.role
      where ur.user_id = u.id and rp.permission = 'app.use'
    )
  order by u.created_at;
$$;

revoke execute on function public.waiting_accounts () from public, anon;
grant execute on function public.waiting_accounts () to authenticated;

-- Lets one account in. Answers whether this call was the one that did it, so the server tells the person
-- once: a second tap, an account already in, or a caller without the permission all answer false.
create or replace function public.approve_account(user_id uuid) returns boolean
language sql security definer set search_path = '' as $$
  with approved as (
    insert into public.user_roles (user_id, role)
    select u.id, 'member'
    from auth.users u
    where u.id = approve_account.user_id
      and (select public.has_permission('accounts.manage'))
    on conflict do nothing
    returning 1
  )
  select exists (select 1 from approved);
$$;

revoke execute on function public.approve_account (uuid) from public, anon;
grant execute on function public.approve_account (uuid) to authenticated;

-- 3. The door: approved accounts only --------------------------------------
-- One RESTRICTIVE policy per table. A restrictive policy is ANDed with the table's other policies, so
-- each feature's own rules stay as they are and this adds "and the account is approved" to all of them,
-- for reading and for writing.
--
-- ADD A LINE HERE FOR EVERY NEW TABLE a member can reach. A table missing from this list is open to anyone
-- who signs up with an email address.
--
-- Left out on purpose, because a waiting person needs them and each shows only their own rows:
--   profiles, name_requests (their name) · user_settings (their language) · push_subscriptions (their
--   device, so "you are in" can reach them).
-- `sign_in_links` (auth) needs no line: no browser has any grant on it.
-- The picture files in Storage are not a table of ours: their policies ask for "app.use" themselves
-- (features/group-info/schema.sql section 5).
-- `prayer_feed` and `pray_for_request` skip row rules, so they ask for "app.use" themselves
-- (features/prayer/schema.sql).

drop policy if exists "Approved accounts only" on public.groups;
create policy "Approved accounts only" on public.groups
  as restrictive for all to authenticated using ((select public.has_permission('app.use')));

drop policy if exists "Approved accounts only" on public.group_members;
create policy "Approved accounts only" on public.group_members
  as restrictive for all to authenticated using ((select public.has_permission('app.use')));

drop policy if exists "Approved accounts only" on public.group_join_requests;
create policy "Approved accounts only" on public.group_join_requests
  as restrictive for all to authenticated using ((select public.has_permission('app.use')));

drop policy if exists "Approved accounts only" on public.messages;
create policy "Approved accounts only" on public.messages
  as restrictive for all to authenticated using ((select public.has_permission('app.use')));

drop policy if exists "Approved accounts only" on public.events;
create policy "Approved accounts only" on public.events
  as restrictive for all to authenticated using ((select public.has_permission('app.use')));

drop policy if exists "Approved accounts only" on public.event_texts;
create policy "Approved accounts only" on public.event_texts
  as restrictive for all to authenticated using ((select public.has_permission('app.use')));

drop policy if exists "Approved accounts only" on public.event_cancellations;
create policy "Approved accounts only" on public.event_cancellations
  as restrictive for all to authenticated using ((select public.has_permission('app.use')));

drop policy if exists "Approved accounts only" on public.event_reminders;
create policy "Approved accounts only" on public.event_reminders
  as restrictive for all to authenticated using ((select public.has_permission('app.use')));

drop policy if exists "Approved accounts only" on public.weekly_card;
create policy "Approved accounts only" on public.weekly_card
  as restrictive for all to authenticated using ((select public.has_permission('app.use')));

drop policy if exists "Approved accounts only" on public.prayer_requests;
create policy "Approved accounts only" on public.prayer_requests
  as restrictive for all to authenticated using ((select public.has_permission('app.use')));

drop policy if exists "Approved accounts only" on public.prayer_reminders;
create policy "Approved accounts only" on public.prayer_reminders
  as restrictive for all to authenticated using ((select public.has_permission('app.use')));

drop policy if exists "Approved accounts only" on public.group_info;
create policy "Approved accounts only" on public.group_info
  as restrictive for all to authenticated using ((select public.has_permission('app.use')));

drop policy if exists "Approved accounts only" on public.group_photos;
create policy "Approved accounts only" on public.group_photos
  as restrictive for all to authenticated using ((select public.has_permission('app.use')));

drop policy if exists "Approved accounts only" on public.staff_sections;
create policy "Approved accounts only" on public.staff_sections
  as restrictive for all to authenticated using ((select public.has_permission('app.use')));

drop policy if exists "Approved accounts only" on public.staff_people;
create policy "Approved accounts only" on public.staff_people
  as restrictive for all to authenticated using ((select public.has_permission('app.use')));

drop policy if exists "Approved accounts only" on public.staff_placements;
create policy "Approved accounts only" on public.staff_placements
  as restrictive for all to authenticated using ((select public.has_permission('app.use')));

-- 4. The people already here (run ONCE, when this feature is first installed) -
-- Everyone who had an account before approval existed is let in. Running this again later would let in
-- everyone who is waiting at that moment.
--
-- insert into public.user_roles (user_id, role)
-- select id, 'member' from auth.users
-- on conflict do nothing;

-- 5. Undo (removing the feature) ------------------------------------------
-- Run the `drop policy` lines of section 3, then:
-- drop function if exists public.approve_account (uuid);
-- drop function if exists public.waiting_accounts ();
-- delete from public.role_permissions where permission = 'accounts.manage';
-- "app.use" and the role "member" stay (permissions): the prayer feed asks for them. Without this feature
-- an account gets the role by hand, the way an admin does.
