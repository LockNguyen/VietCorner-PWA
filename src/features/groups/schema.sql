-- GROUPS feature schema. Run once in Supabase → SQL Editor, after features/permissions/schema.sql and
-- before any feature that shares by group (chat, events, prayer).
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

-- 3. Seed data ------------------------------------------------------------

insert into public.groups (name) values ('Test Group'), ('Bible Study');

-- 4. Undo (removing the feature) ------------------------------------------
-- Everything that shares by group goes with it: `cascade` drops the columns and policies that point here.
-- drop function if exists public.approve_join_request (uuid, uuid);
-- drop table if exists public.group_join_requests, public.group_members, public.groups cascade;
