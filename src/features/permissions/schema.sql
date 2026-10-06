-- PERMISSIONS feature schema. Run once in Supabase → SQL Editor, before any feature that has admin actions.
-- Then switch the hook on: Dashboard → Authentication → Hooks → Custom Access Token → Postgres function
-- `public.custom_access_token_hook`. Until that is done, nobody has any permission.
--
-- The idea in three lines:
--   1. A role is a named bundle of permissions ("admin" → "events.manage", "groups.manage", ...).
--   2. When a user signs in, their permissions are written into their login token, once.
--   3. Every policy asks `has_permission('...')`, which only reads that token: no table lookup per query.
-- Policies name a PERMISSION, never a role, so a new role is new rows here and no policy changes.

-- 1. Tables ---------------------------------------------------------------

-- What each role may do. Every feature adds its own rows in its own schema.sql.
create table public.role_permissions (
  role text not null,
  permission text not null, -- "<feature>.<action>", e.g. "events.manage"
  primary key (role, permission)
);

-- Who holds which role. Rows are added by hand in the Supabase dashboard (see the bottom of this file).
create table public.user_roles (
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null,
  primary key (user_id, role)
);

-- 2. Permissions on these tables -----------------------------------------
-- Nobody reads or writes them from a browser: a member who could insert a row would make themselves admin.
-- Only Supabase Auth reads them, while it builds a login token.

revoke all on public.role_permissions, public.user_roles from anon, authenticated;
grant all on public.role_permissions, public.user_roles to service_role;
grant select on public.role_permissions, public.user_roles to supabase_auth_admin;

alter table public.role_permissions enable row level security;
alter table public.user_roles enable row level security;

create policy "Auth reads role permissions to build a token" on public.role_permissions
  for select to supabase_auth_admin using (true);
create policy "Auth reads user roles to build a token" on public.user_roles
  for select to supabase_auth_admin using (true);

-- 3. Into the token -------------------------------------------------------
-- Supabase Auth calls this each time it issues or refreshes a token and uses what it returns.
-- It adds one claim, `permissions`, a list such as ["events.manage", "groups.manage"].
-- It must never fail: a hook that raises an error stops EVERYONE from signing in.
create function public.custom_access_token_hook(event jsonb) returns jsonb
language sql stable set search_path = '' as $$
  select jsonb_set(
    event,
    '{claims,permissions}',
    coalesce(
      (
        select jsonb_agg(distinct rp.permission)
        from public.user_roles ur
        join public.role_permissions rp on rp.role = ur.role
        where ur.user_id = (event ->> 'user_id')::uuid
      ),
      '[]'::jsonb
    )
  );
$$;

grant usage on schema public to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook (jsonb) from public, anon, authenticated;
grant execute on function public.custom_access_token_hook (jsonb) to supabase_auth_admin;

-- 4. Out of the token -----------------------------------------------------
-- The one question every admin policy asks. It reads the caller's token and touches no table.
-- Write it in a policy as `(select public.has_permission('events.manage'))`: the sub-select makes Postgres
-- work the answer out once per query instead of once per row.
create function public.has_permission(permission text) returns boolean
language sql stable set search_path = '' as $$
  select coalesce((auth.jwt() -> 'permissions') ? permission, false);
$$;

revoke execute on function public.has_permission (text) from public, anon;
grant execute on function public.has_permission (text) to authenticated;

-- 5. Making someone an admin (by hand, with their email) --------------------
-- insert into public.user_roles (user_id, role)
-- select id, 'admin' from auth.users where email = 'someone@example.com';
-- It takes effect the next time their token is refreshed: within the hour, or at once if they sign out and in.

-- 6. Undo (removing the feature) ------------------------------------------
-- First switch the hook off in the dashboard, or nobody can sign in. Then:
-- drop function if exists public.has_permission (text) cascade; -- cascade drops the policies that use it
-- drop function if exists public.custom_access_token_hook (jsonb);
-- drop table if exists public.user_roles, public.role_permissions;
