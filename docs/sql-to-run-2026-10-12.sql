-- EVERYTHING STILL TO RUN, in one file (made 2026-10-12 from the features' schema.sql files).
--
-- Where: Supabase → SQL Editor. Paste the whole file and run it once.
-- Safe to run again: every statement here is "if not exists", "drop ... if exists" or "create or replace".
-- Copy it from the editor, not from terminal output (PowerShell garbles non-ASCII text).
--
-- This is a COPY for convenience. The truth stays in each feature's schema.sql; change those, not this.
-- Not in here on purpose: section 4 of features/approval/schema.sql ("the people already here"). It was run
-- once and must not be run again: it would let in everyone who is waiting at that moment.
--
-- Afterwards: npm run test:rls (91 expected).

begin;

-- ====================================================================================================
-- 1 of 5 · auth: the table a sign-in waits in (features/auth/schema.sql, all of it)
-- ====================================================================================================

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

-- ====================================================================================================
-- 2 of 5 · groups: admins put people into groups (features/groups/schema.sql, section 2c)
-- ====================================================================================================

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

-- ====================================================================================================
-- 2 of 5 · groups: a group's picture (section 2d)
-- ====================================================================================================

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

-- ====================================================================================================
-- 2 of 5 · groups: the group list's one read, again (section 2b; it returns the two new columns)
-- ====================================================================================================

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

-- ====================================================================================================
-- 3 of 5 · events: an event's picture (features/events/schema.sql, section 3e)
-- ====================================================================================================

-- 3e. An event's picture (2026-10-12) ---------------------------------------
-- This section can be run again by itself. Run it BEFORE 3b and 3c (again): they read the column made here.
--
-- The small picture that starts an event's row. Whoever holds "events.manage" sets, replaces and removes it.
-- The file lives in Storage; the event keeps its path. A new picture is a new file with a new name, so a
-- phone that kept the old one never shows it in place of the new.

alter table public.events add column if not exists thumbnail_path text check (length(thumbnail_path) <= 200);
grant update (thumbnail_path) on public.events to authenticated; -- only with the manager policy in section 3

-- A PUBLIC bucket, on purpose: this picture is shown on every row of the schedule, and a public address
-- lets the phone keep it. It is event artwork chosen by an admin, not a private photo; anyone holding a
-- file's address can open it, and the address is not guessable (two random ids). JPEG only, 200 KB at most:
-- Storage enforces both, whatever a browser sends.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('event-thumbnails', 'event-thumbnails', true, 204800, array['image/jpeg'])
on conflict (id) do update
set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- Only event managers put files in, list them or take them out. Reading a file through its public
-- address needs no policy; that is what "public" means.
drop policy if exists "Event managers manage event pictures" on storage.objects;
create policy "Event managers manage event pictures" on storage.objects
  for all to authenticated
  using (bucket_id = 'event-thumbnails' and (select public.has_permission('events.manage')))
  with check (bucket_id = 'event-thumbnails' and (select public.has_permission('events.manage')));

-- ====================================================================================================
-- 3 of 5 · events: the schedule's one read, again (section 3b)
-- ====================================================================================================

-- 3b. What the schedule reads, in one trip --------------------------------
-- This section can be run again by itself: it is how the function is changed.
--
-- One call returns every event the caller may see, each with its words in every language it has and the
-- single weeks that were called off. Before this the page made four or five reads, one after another.
-- It runs with the CALLER's rights (the default), so the policies above still decide what comes back: this
-- function opens nothing that a direct read would not. `until` and `cancelled_since` only narrow the answer.
-- Dropped first because its columns changed (2026-10-12: `thumbnail_path`), which `create or replace` refuses.
drop function if exists public.upcoming_events (timestamptz, timestamptz);
create function public.upcoming_events(until timestamptz, cancelled_since timestamptz)
returns table (
  id uuid,
  group_id uuid,
  starts_at timestamptz,
  ends_at timestamptz,
  repeats_weekly boolean,
  repeat_until date,
  canceled_at timestamptz,
  thumbnail_path text,
  texts jsonb,
  canceled_dates date[]
)
language sql stable set search_path = '' as $$
  select
    e.id, e.group_id, e.starts_at, e.ends_at, e.repeats_weekly, e.repeat_until, e.canceled_at, e.thumbnail_path,
    coalesce(
      (select jsonb_object_agg(t.language, jsonb_build_object('title', t.title, 'description', t.description, 'location', t.location))
       from public.event_texts t where t.event_id = e.id),
      '{}'::jsonb
    ),
    coalesce((select array_agg(c.occurrence_date) from public.event_cancellations c where c.event_id = e.id), '{}')
  from public.events e
  where e.deleted_at is null -- a manager may read removed events; the schedule never shows them
    and e.starts_at <= until
    -- A weekly event that started months ago still runs today; the app works out which dates lie ahead.
    and (e.repeats_weekly or e.starts_at >= now())
    and (e.canceled_at is null or e.canceled_at >= cancelled_since);
$$;

revoke execute on function public.upcoming_events (timestamptz, timestamptz) from public, anon;
grant execute on function public.upcoming_events (timestamptz, timestamptz) to authenticated;

-- ====================================================================================================
-- 3 of 5 · events: the admin section's one read, again (section 3c)
-- ====================================================================================================

-- 3c. What the admin section reads, in one trip ----------------------------
-- This section can be run again by itself: it is how the function is changed.
--
-- Every event that can still be managed (not removed, not called off for good, with a date ahead), soonest
-- first, each with its words in every language, its called-off weeks and its reminder choices. Before this
-- the Admin page and the editor made four reads. Like `upcoming_events`, it runs with the CALLER's rights:
-- a member calling it gets only the events they may see, and no reminders at all, because the policy on
-- `event_reminders` shows them none.
drop function if exists public.managed_events (); -- its columns changed too
create function public.managed_events()
returns table (
  id uuid,
  group_id uuid,
  starts_at timestamptz,
  ends_at timestamptz,
  repeats_weekly boolean,
  repeat_until date,
  canceled_at timestamptz,
  thumbnail_path text,
  texts jsonb,
  canceled_dates date[],
  reminder_minutes int[]
)
language sql stable set search_path = '' as $$
  select
    e.id, e.group_id, e.starts_at, e.ends_at, e.repeats_weekly, e.repeat_until, e.canceled_at, e.thumbnail_path,
    coalesce(
      (select jsonb_object_agg(t.language, jsonb_build_object('title', t.title, 'description', t.description, 'location', t.location))
       from public.event_texts t where t.event_id = e.id),
      '{}'::jsonb
    ),
    coalesce((select array_agg(c.occurrence_date) from public.event_cancellations c where c.event_id = e.id), '{}'),
    coalesce((select array_agg(r.minutes_before) from public.event_reminders r where r.event_id = e.id), '{}')
  from public.events e
  where e.deleted_at is null
    and e.canceled_at is null -- called off for good = gone from here; it cannot be brought back from the app
    and (e.repeats_weekly or e.starts_at >= now())
  order by e.starts_at;
$$;

revoke execute on function public.managed_events () from public, anon;
grant execute on function public.managed_events () to authenticated;

-- ====================================================================================================
-- 4 of 5 · group-info: the Groups page, its details and its photos (features/group-info/schema.sql, all of it)
-- ====================================================================================================

-- GROUP-INFO feature schema. Run in Supabase → SQL Editor, after features/groups/schema.sql (sections 2c
-- and 2d included). Safe to run again. Then run the `group_info` lines of features/approval/schema.sql section 3.
--
-- Security in one sentence: every approved member reads every group's details and pictures; only whoever
-- holds "groups.manage" changes the details or removes a picture; a group's own people add pictures.

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

-- Only whoever manages groups writes a group's details (decided 2026-10-12: when and where a group meets
-- is the church's word, not any one member's). The earlier rule let the group's own people write; its
-- policies are dropped here by every name they have had.
drop policy if exists "A group's members write its details" on public.group_info;
drop policy if exists "A group's members and managers write its details" on public.group_info;
drop policy if exists "Group managers write a group's details" on public.group_info;
create policy "Group managers write a group's details" on public.group_info
  for insert to authenticated
  with check ((select public.has_permission('groups.manage')));

drop policy if exists "A group's members change its details" on public.group_info;
drop policy if exists "A group's members and managers change its details" on public.group_info;
drop policy if exists "Group managers change a group's details" on public.group_info;
create policy "Group managers change a group's details" on public.group_info
  for update to authenticated
  using ((select public.has_permission('groups.manage')))
  with check ((select public.has_permission('groups.manage')));

-- 4. What the Groups page reads, in one trip -------------------------------
-- Every active group with its size, its details, and whether the caller is in it (which is what shows
-- them "Add a photo"; the policies in section 5 are what actually let them).
-- It runs with the CALLER's rights (the default), so it opens nothing a direct read would not.
-- Dropped first because its columns changed (2026-10-12: `thumbnail_path`), which `create or replace` refuses.
drop function if exists public.group_directory ();
create function public.group_directory()
returns table (id uuid, name text, member_count integer, thumbnail_path text, is_member boolean, meets_at text, location text, notes text)
language sql stable set search_path = '' as $$
  select
    g.id,
    g.name,
    g.member_count,
    g.thumbnail_path,
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

-- 5. Pictures -------------------------------------------------------------
-- A group's activity pictures. The files live in Supabase Storage; this table says which pictures a group
-- has, in what order, and what was written about each. Then run the `group_photos` lines of
-- features/approval/schema.sql section 3.
--
-- Who: every approved member looks; the people in a group, and group managers, ADD; only group managers
-- REMOVE (decided 2026-10-12). Nothing can be edited: a wrong date or caption is fixed by an admin removing
-- the picture and its owner adding it again.

create table if not exists public.group_photos (
  -- Made by the browser, because the two files are named after it before this row exists.
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  taken_on date,                                  -- optional: the day of the activity
  caption text check (length(caption) <= 200),    -- optional
  -- From the login token, never from the browser. Kept so an admin can see who added a picture; shown on
  -- no screen. Emptied, not cascaded, when the account goes: the group's pictures outlive a member.
  uploaded_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists group_photos_group_id_created_at on public.group_photos (group_id, created_at desc);

revoke all on public.group_photos from anon, authenticated;
grant all on public.group_photos to service_role;
grant select, delete on public.group_photos to authenticated;
grant insert (id, group_id, taken_on, caption) on public.group_photos to authenticated;

alter table public.group_photos enable row level security;

-- Who may add a picture to a group: the people in it, and whoever manages groups. One function, so the
-- row's rule and the file's rule cannot drift apart. It runs with the CALLER's rights: the membership it
-- looks for is the caller's own, and only in active groups (the policy on `group_members`), so nobody adds
-- to a removed group.
create or replace function public.may_add_group_photo(group_id uuid) returns boolean
language sql stable set search_path = '' as $$
  select (select public.has_permission('groups.manage'))
    or exists (
      select 1 from public.group_members m
      where m.group_id = may_add_group_photo.group_id and m.user_id = auth.uid()
    );
$$;

revoke execute on function public.may_add_group_photo (uuid) from public, anon;
grant execute on function public.may_add_group_photo (uuid) to authenticated;

drop policy if exists "Members see every active group's pictures" on public.group_photos;
create policy "Members see every active group's pictures" on public.group_photos
  for select to authenticated
  using (exists (select 1 from public.groups g where g.id = group_photos.group_id and g.deleted_at is null));

drop policy if exists "A group's members and managers add pictures" on public.group_photos;
create policy "A group's members and managers add pictures" on public.group_photos
  for insert to authenticated
  with check (uploaded_by = auth.uid() and public.may_add_group_photo(group_id));

drop policy if exists "A group's members and managers remove pictures" on public.group_photos;
drop policy if exists "Group managers remove pictures" on public.group_photos;
create policy "Group managers remove pictures" on public.group_photos
  for delete to authenticated
  using ((select public.has_permission('groups.manage')));

-- The files. A PRIVATE bucket: these are pictures of church members, children among them, so a file is
-- reached only through an address signed for a signed-in, approved member, and that address stops working
-- after an hour. The two limits are enforced by Storage itself, whatever a browser sends: JPEG only, and
-- 1 MB (the app shrinks a picture to about 300 KB before sending it).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('group-photos', 'group-photos', false, 1048576, array['image/jpeg'])
on conflict (id) do update
set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- Storage keeps files as rows of `storage.objects`, guarded by policies like any table. A file's name is
-- "<group id>/<photo id>.jpg", so its first folder says which group it belongs to.
-- These three cannot live in the approval feature's list, so each asks for "app.use" itself.
drop policy if exists "Approved members look at group pictures" on storage.objects;
create policy "Approved members look at group pictures" on storage.objects
  for select to authenticated
  using (bucket_id = 'group-photos' and (select public.has_permission('app.use')));

drop policy if exists "A group's members and managers upload its pictures" on storage.objects;
create policy "A group's members and managers upload its pictures" on storage.objects
  for insert to authenticated
  with check (
    -- A CASE, not an AND: Postgres may test the halves of an AND in any order, and the cast below fails on
    -- a file name that does not start with a group's id. That must never be tried on another bucket's files.
    case when bucket_id = 'group-photos'
      then (select public.has_permission('app.use'))
        and public.may_add_group_photo(((storage.foldername(name))[1])::uuid)
      else false
    end
  );

drop policy if exists "A group's members and managers erase its pictures" on storage.objects;
drop policy if exists "Group managers erase group pictures" on storage.objects;
create policy "Group managers erase group pictures" on storage.objects
  for delete to authenticated
  using (bucket_id = 'group-photos' and (select public.has_permission('groups.manage')));

-- The function the earlier rules shared. Dropped last: by now no policy uses it.
drop function if exists public.may_write_group_info (uuid);

-- ====================================================================================================
-- 5 of 5 · approval: the door for the two new tables (features/approval/schema.sql, section 3, two of its lines)
-- ====================================================================================================

drop policy if exists "Approved accounts only" on public.group_info;
create policy "Approved accounts only" on public.group_info
  as restrictive for all to authenticated using ((select public.has_permission('app.use')));

drop policy if exists "Approved accounts only" on public.group_photos;
create policy "Approved accounts only" on public.group_photos
  as restrictive for all to authenticated using ((select public.has_permission('app.use')));

commit;
