-- Everything to run for the 'admin on the tabs' work (2026-10-14), in this order. Safe to run again.
-- 1. events/schema.sql, section 3f
-- 3f. An event outlives the account that made it (2026-10-14) -------------------
-- This section can be run again by itself. Without it, removing an admin's account (the people feature)
-- would be refused for as long as an event they created exists.
alter table public.events drop constraint if exists events_created_by_fkey;
alter table public.events add constraint events_created_by_fkey
  foreign key (created_by) references auth.users (id) on delete set null;

-- 2. group-info/schema.sql, section 7
-- 7. Cards: a meeting day and time, and members' initials (2026-10-14) -------
-- This section can be run again by itself. Run it after sections 1-5.

-- When a group meets, as a weekday and a time (church time) instead of free text, so the app can write it
-- the same way in both languages ("Tuesdays @ 7:30 PM"). `meets_at` stays for what was typed before.
alter table public.group_info add column if not exists meets_weekday smallint check (meets_weekday between 0 and 6); -- 0 = Sunday
alter table public.group_info add column if not exists meets_time time;
grant insert (meets_weekday, meets_time), update (meets_weekday, meets_time) on public.group_info to authenticated;

-- The initials of a group's members, for the circles on its card. Initials only: a member may not read who
-- is in another group (group_members shows each person their own rows), so this hands out the least that
-- draws the circles. It runs as its owner to see the memberships, and answers only an approved member.
create or replace function public.group_member_initials(group_id uuid) returns text[]
language sql stable security definer set search_path = '' as $$
  select coalesce(array_agg(
           upper(left(btrim(p.name), 1)
                 || case when btrim(p.name) like '% %' then left(regexp_replace(btrim(p.name), '^.*\s', ''), 1) else '' end)
           order by m.joined_at), '{}')
  from public.group_members m
  join public.profiles p on p.user_id = m.user_id
  where m.group_id = group_member_initials.group_id and (select public.has_permission('app.use'));
$$;
revoke execute on function public.group_member_initials (uuid) from public, anon;
grant execute on function public.group_member_initials (uuid) to authenticated;

-- The Groups page's one read, now with the two new columns and the initials.
drop function if exists public.group_directory ();
create function public.group_directory()
returns table (
  id uuid, name text, member_count integer, thumbnail_path text, is_member boolean,
  meets_at text, meets_weekday smallint, meets_time time, location text, notes text, member_initials text[]
)
language sql stable set search_path = '' as $$
  select
    g.id,
    g.name,
    g.member_count,
    g.thumbnail_path,
    exists (select 1 from public.group_members m where m.group_id = g.id and m.user_id = auth.uid()),
    i.meets_at,
    i.meets_weekday,
    i.meets_time,
    i.location,
    i.notes,
    public.group_member_initials(g.id)
  from public.groups g
  left join public.group_info i on i.group_id = g.id
  where g.deleted_at is null
  order by g.name;
$$;
revoke execute on function public.group_directory () from public, anon;
grant execute on function public.group_directory () to authenticated;

-- 3. people/schema.sql (all but the undo)
-- PEOPLE feature schema: the Admin tab's list of everyone, what each may do, and removing an account.
-- Run once in Supabase → SQL Editor, after permissions, profiles and groups. Every section can be run again.
--
-- Security in one sentence: every function here answers only someone with "users.manage" (an admin), and
-- the two that change something also refuse to change the caller's own admin rights or account.

-- 1. The permission ------------------------------------------------------------
insert into public.role_permissions (role, permission) values ('admin', 'users.manage') on conflict do nothing;

-- 2. One role per permission (2026-10-14) ----------------------------------------
-- So an admin can hand out one thing at a time ("may manage events") instead of all or nothing. Each also
-- carries "app.use": someone trusted with a task is someone let into the app.
insert into public.role_permissions (role, permission) values
  ('events-manager', 'events.manage'), ('events-manager', 'app.use'),
  ('groups-manager', 'groups.manage'), ('groups-manager', 'app.use'),
  ('prayer-reminders', 'prayer.reminders'), ('prayer-reminders', 'app.use'),
  ('approver', 'accounts.manage'), ('approver', 'app.use')
on conflict do nothing;

-- 3. Everyone, in one trip --------------------------------------------------------
-- Each account with its name, email, roles and active groups. It runs as its owner (it reads auth.users
-- and every membership), so it checks the caller itself.
drop function if exists public.people_list ();
create function public.people_list()
returns table (user_id uuid, name text, email text, signed_up_at timestamptz, roles text[], group_ids uuid[])
language sql stable security definer set search_path = '' as $$
  select
    u.id,
    coalesce(p.name, split_part(u.email, '@', 1)),
    u.email,
    u.created_at,
    coalesce((select array_agg(r.role order by r.role) from public.user_roles r where r.user_id = u.id), '{}'),
    coalesce((select array_agg(m.group_id)
              from public.group_members m
              join public.groups g on g.id = m.group_id and g.deleted_at is null
              where m.user_id = u.id), '{}')
  from auth.users u
  left join public.profiles p on p.user_id = u.id
  where (select public.has_permission('users.manage'))
  order by lower(coalesce(p.name, u.email));
$$;
revoke execute on function public.people_list () from public, anon;
grant execute on function public.people_list () to authenticated;

-- 4. Giving and taking a role ----------------------------------------------------
-- Only the roles the app offers (people/types.ts). An admin cannot take "admin" from themselves: the church
-- must never end up with nobody able to open this screen. It takes effect at the person's next token
-- refresh (within the hour), like every permission.
create or replace function public.set_person_role(user_id uuid, role text, given boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not (select public.has_permission('users.manage')) then
    raise exception 'Not allowed';
  end if;
  if role not in ('admin', 'member', 'events-manager', 'groups-manager', 'prayer-reminders', 'approver') then
    raise exception 'Unknown role';
  end if;
  if not given and role = 'admin' and user_id = auth.uid() then
    raise exception 'You cannot take admin from yourself';
  end if;

  if given then
    insert into public.user_roles (user_id, role) values (set_person_role.user_id, set_person_role.role)
    on conflict do nothing;
  else
    delete from public.user_roles r where r.user_id = set_person_role.user_id and r.role = set_person_role.role;
  end if;
end;
$$;
revoke execute on function public.set_person_role (uuid, text, boolean) from public, anon;
grant execute on function public.set_person_role (uuid, text, boolean) to authenticated;

-- 5. Removing an account -----------------------------------------------------------
-- Deletes the account; everything that belongs to it goes with it (each table's "on delete cascade"), and
-- what it made for others stays without a maker (events, group pictures: "on delete set null"). Cannot be
-- undone. Nobody removes their own account here.
create or replace function public.remove_person(user_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not (select public.has_permission('users.manage')) then
    raise exception 'Not allowed';
  end if;
  if user_id = auth.uid() then
    raise exception 'You cannot remove yourself';
  end if;
  delete from auth.users u where u.id = remove_person.user_id;
end;
$$;
revoke execute on function public.remove_person (uuid) from public, anon;
grant execute on function public.remove_person (uuid) to authenticated;
-- 4. prayer/schema.sql, section 5b
-- 5b. The author sees how many prayed (2026-10-14) ------------------------------
-- This section can be run again by itself. The same view as section 4 with one column added at the end
-- (`create or replace view` allows that): the count, for the request's author only. Everyone else gets null,
-- so nobody can compare requests by how many prayed for them.
create or replace view public.prayer_feed with (security_invoker = false) as
select
  r.id,
  r.body,
  r.is_anonymous,
  r.created_at,
  r.author_id = auth.uid() as is_mine,
  case when r.is_anonymous then null else p.name end as author_name,
  case when r.author_id = auth.uid() then r.prayer_count end as prayer_count
from public.prayer_requests r
join public.profiles p on p.user_id = r.author_id
where r.deleted_at is null
  and r.answered_at is null
  and (select public.has_permission('app.use'));

