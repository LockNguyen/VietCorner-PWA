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

-- 6. Undo (removing the feature) ---------------------------------------------------
-- drop function if exists public.remove_person (uuid);
-- drop function if exists public.set_person_role (uuid, text, boolean);
-- drop function if exists public.people_list ();
-- delete from public.role_permissions where permission = 'users.manage'
--   or role in ('events-manager', 'groups-manager', 'prayer-reminders', 'approver');
