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
-- 1 MB (the app shrinks a picture to just under 1 MB before sending it).
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

-- 8. English name and place (2026-10-17) ---------------------------------------
-- This section can be run again by itself. Run it after section 7, and after section 2e of
-- features/groups/schema.sql (it reads `groups.name_en`).
-- `location` is where the group meets in Vietnamese; `location_en` in English, optional. Each reader sees
-- their language, or the other one while it is missing. Written by "groups.manage", as `location` is.
alter table public.group_info add column if not exists location_en text check (length(location_en) <= 150);
grant insert (location_en), update (location_en) on public.group_info to authenticated;

-- The Groups page's one read, now with both English columns.
drop function if exists public.group_directory ();
create function public.group_directory()
returns table (
  id uuid, name text, name_en text, member_count integer, thumbnail_path text, is_member boolean,
  meets_at text, meets_weekday smallint, meets_time time, location text, location_en text, notes text,
  member_initials text[]
)
language sql stable set search_path = '' as $$
  select
    g.id,
    g.name,
    g.name_en,
    g.member_count,
    g.thumbnail_path,
    exists (select 1 from public.group_members m where m.group_id = g.id and m.user_id = auth.uid()),
    i.meets_at,
    i.meets_weekday,
    i.meets_time,
    i.location,
    i.location_en,
    i.notes,
    public.group_member_initials(g.id)
  from public.groups g
  left join public.group_info i on i.group_id = g.id
  where g.deleted_at is null
  order by g.name;
$$;
revoke execute on function public.group_directory () from public, anon;
grant execute on function public.group_directory () to authenticated;

-- 9. A contact phone number (2026-10-17) ---------------------------------------
-- This section can be run again by itself. Run it after section 8.
-- Whom to call about a group: a phone number as typed ("(336) 555-0101"), shown to approved members, who
-- can call, text or copy it. Written by "groups.manage", as the other details are. A number only (digits,
-- spaces and + ( ) - .), so nothing else can be planted behind the call and text links.
alter table public.group_info add column if not exists contact_phone text
  check (length(contact_phone) <= 30 and contact_phone ~ '^[0-9 +().-]+$');
grant insert (contact_phone), update (contact_phone) on public.group_info to authenticated;

-- The Groups page's one read, now with the phone number.
drop function if exists public.group_directory ();
create function public.group_directory()
returns table (
  id uuid, name text, name_en text, member_count integer, thumbnail_path text, is_member boolean,
  meets_at text, meets_weekday smallint, meets_time time, location text, location_en text, notes text,
  contact_phone text, member_initials text[]
)
language sql stable set search_path = '' as $$
  select
    g.id,
    g.name,
    g.name_en,
    g.member_count,
    g.thumbnail_path,
    exists (select 1 from public.group_members m where m.group_id = g.id and m.user_id = auth.uid()),
    i.meets_at,
    i.meets_weekday,
    i.meets_time,
    i.location,
    i.location_en,
    i.notes,
    i.contact_phone,
    public.group_member_initials(g.id)
  from public.groups g
  left join public.group_info i on i.group_id = g.id
  where g.deleted_at is null
  order by g.name;
$$;
revoke execute on function public.group_directory () from public, anon;
grant execute on function public.group_directory () to authenticated;

-- 10. Members' pictures on the cards (2026-10-22, the user) ---------------------
-- This section can be run again by itself. Run it after section 9, and after features/profiles/schema.sql
-- section 6 (it reads `profiles.avatar_path`).
-- Each member's circle shows their own picture when they chose one, else their initials. So the card now tells
-- every approved member WHO is in a group, by face: section 7 handed out initials only, on purpose. Given up at
-- the user's request (the architecture's Key Decisions); still no names, and still approved members only.
-- One list of people, each with both, so a picture can never land on someone else's circle.
create or replace function public.group_member_faces(group_id uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'initials', upper(left(btrim(p.name), 1)
                 || case when btrim(p.name) like '% %' then left(regexp_replace(btrim(p.name), '^.*\s', ''), 1) else '' end),
           'avatar', p.avatar_path)
           order by m.joined_at), '[]'::jsonb)
  from public.group_members m
  join public.profiles p on p.user_id = m.user_id
  where m.group_id = group_member_faces.group_id and (select public.has_permission('app.use'));
$$;
revoke execute on function public.group_member_faces (uuid) from public, anon;
grant execute on function public.group_member_faces (uuid) to authenticated;

-- The Groups page's one read, with `members` (initials and picture) in place of `member_initials`.
drop function if exists public.group_directory ();
create function public.group_directory()
returns table (
  id uuid, name text, name_en text, member_count integer, thumbnail_path text, is_member boolean,
  meets_at text, meets_weekday smallint, meets_time time, location text, location_en text, notes text,
  contact_phone text, members jsonb
)
language sql stable set search_path = '' as $$
  select
    g.id,
    g.name,
    g.name_en,
    g.member_count,
    g.thumbnail_path,
    exists (select 1 from public.group_members m where m.group_id = g.id and m.user_id = auth.uid()),
    i.meets_at,
    i.meets_weekday,
    i.meets_time,
    i.location,
    i.location_en,
    i.notes,
    i.contact_phone,
    public.group_member_faces(g.id)
  from public.groups g
  left join public.group_info i on i.group_id = g.id
  where g.deleted_at is null
  order by g.name;
$$;
revoke execute on function public.group_directory () from public, anon;
grant execute on function public.group_directory () to authenticated;

-- Nothing calls it any more: the faces replace it.
drop function if exists public.group_member_initials (uuid);

-- 6. Undo (removing the feature) ------------------------------------------
-- Empty the bucket in the dashboard first (Storage → group-photos): a bucket with files cannot be deleted.
-- drop policy if exists "Approved members look at group pictures" on storage.objects;
-- drop policy if exists "A group's members and managers upload its pictures" on storage.objects;
-- drop policy if exists "Group managers erase group pictures" on storage.objects;
-- delete from storage.buckets where id = 'group-photos';
-- drop table if exists public.group_photos;
-- drop function if exists public.group_directory ();
-- drop function if exists public.group_member_faces (uuid);
-- drop table if exists public.group_info;
-- drop function if exists public.may_add_group_photo (uuid);
