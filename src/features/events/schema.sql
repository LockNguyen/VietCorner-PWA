-- EVENTS feature schema. Run once in Supabase → SQL Editor, after features/permissions/schema.sql and
-- features/groups/schema.sql.
--
-- Four tables instead of one, so a member's phone downloads only what it shows:
--   events              when it happens (structure only)
--   event_texts         one row per language; a member fetches theirs, not both
--   event_cancellations one skipped week of a recurring event
--   event_reminders     admin configuration; no policy lets a member read it
--
-- Visibility: every event is for the whole church (decided 2026-10-12, section 3d). `events.group_id`
-- is left from when an event could be for one group; nothing reads or writes it any more.

-- 1. Tables ---------------------------------------------------------------

create table public.events (
  id uuid primary key default gen_random_uuid(),
  -- Unused since 2026-10-12 (every event is church-wide). Kept so no old row is rewritten.
  group_id uuid references public.groups (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz,                    -- optional: many events just have a start time
  repeats_weekly boolean not null default false,
  repeat_until date,                      -- optional: null means it keeps repeating until cancelled
  canceled_at timestamptz,                -- the whole event is off for good; members see it one more week
  deleted_at timestamptz,                 -- hidden from everyone at once; set by hand, the app has no button for it
  -- Null when nobody signed in created it: the seed rows below, and anything the system adds later.
  -- `auth.uid()` is null outside a request (the SQL Editor), so a NOT NULL here makes seeding impossible.
  created_by uuid default auth.uid() references auth.users (id),
  created_at timestamptz not null default now()
);

create index events_starts_at_idx on public.events (starts_at);

create table public.event_texts (
  event_id uuid not null references public.events (id) on delete cascade,
  language text not null check (language in ('en', 'vi')),
  title text not null,                    -- the only text an event must have
  description text,
  location text,
  primary key (event_id, language)
);

create table public.event_cancellations (
  event_id uuid not null references public.events (id) on delete cascade,
  -- The date of the weekly occurrence that is off. The rest of the series still happens.
  occurrence_date date not null,
  canceled_at timestamptz not null default now(),
  primary key (event_id, occurrence_date)
);

create table public.event_reminders (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  -- How long before the event the push is sent. Admins configure it; members never read this table.
  minutes_before int not null check (minutes_before > 0),
  created_at timestamptz not null default now(),
  unique (event_id, minutes_before) -- switching a choice on twice cannot send it twice
);

-- 2. Grants ---------------------------------------------------------------
-- Members read. Writing is for whoever holds the "events.manage" permission (section 3).
-- event_reminders has NO grant, so it never reaches a member's device.

grant select on public.events to authenticated;
grant select on public.event_texts to authenticated;
grant select on public.event_cancellations to authenticated;
revoke all on public.event_reminders from anon, authenticated;
grant select, delete on public.event_reminders to authenticated; -- managers only, by the policy in section 3
grant insert (event_id, minutes_before) on public.event_reminders to authenticated;

-- Supabase grants everything on a new table by default, so take the writes away first; then give back
-- exactly what the admin page sends. `created_by` is not in the list: it comes from the login token.
revoke insert, update, delete on public.events, public.event_texts, public.event_cancellations
  from anon, authenticated;
grant insert (group_id, starts_at, ends_at, repeats_weekly, repeat_until) on public.events to authenticated;
grant update (group_id, starts_at, ends_at, repeats_weekly, repeat_until, canceled_at, deleted_at)
  on public.events to authenticated;
grant insert, update, delete on public.event_texts to authenticated;
grant insert, delete on public.event_cancellations to authenticated; -- delete = undo

-- 3. Row Level Security ---------------------------------------------------

alter table public.events enable row level security;
alter table public.event_texts enable row level security;
alter table public.event_cancellations enable row level security;
alter table public.event_reminders enable row level security;

-- Who reads an event is in section 3d: every approved member, since events became church-wide.

-- Text and cancellations follow their event: if you cannot see the event, you cannot see its words.
create policy "Members read text of events they can see" on public.event_texts
  for select to authenticated using (
    exists (select 1 from public.events e where e.id = event_texts.event_id)
  );

create policy "Members read cancellations of events they can see" on public.event_cancellations
  for select to authenticated using (
    exists (select 1 from public.events e where e.id = event_cancellations.event_id)
  );

-- Managing events needs the "events.manage" permission, read from the login token (permissions feature).
--
-- (What a manager reads is in section 3d too.)
create policy "Event managers create events" on public.events
  for insert to authenticated with check ((select public.has_permission('events.manage')));

create policy "Event managers edit, cancel and remove events" on public.events
  for update to authenticated
  using ((select public.has_permission('events.manage')))
  with check ((select public.has_permission('events.manage')));

create policy "Event managers write event text" on public.event_texts
  for all to authenticated
  using ((select public.has_permission('events.manage')))
  with check ((select public.has_permission('events.manage')));

create policy "Event managers cancel a single week, and undo it" on public.event_cancellations
  for all to authenticated
  using ((select public.has_permission('events.manage')))
  with check ((select public.has_permission('events.manage')));

insert into public.role_permissions (role, permission) values ('admin', 'events.manage');

-- Members never read reminders: this is the table's only policy. The scheduler uses the service role.
create policy "Event managers choose reminders" on public.event_reminders
  for all to authenticated
  using ((select public.has_permission('events.manage')))
  with check ((select public.has_permission('events.manage')));

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

-- 3d. Every event is church-wide (2026-10-12) -------------------------------
-- This section can be run again by itself: it is how these two policies are changed.
--
-- Admins no longer limit an event to a group, so the membership check is gone, and events once saved
-- for one group show to everyone (decided with the user). Who counts as "a member" is the approval
-- feature's rule: its schema.sql adds "approved accounts only" on top of every policy here.
-- Soft-deleted rows are still hidden, so a member cannot read them even by querying Supabase directly.
drop policy if exists "Members read events they belong to" on public.events;
drop policy if exists "Members read every event" on public.events;
create policy "Members read every event" on public.events
  for select to authenticated using (deleted_at is null);

-- A manager also reads the events they removed: Postgres checks the row an update leaves behind against
-- the select policies, so hiding removed events from them would make removing one impossible.
drop policy if exists "Event managers read every event" on public.events;
create policy "Event managers read every event" on public.events
  for select to authenticated using ((select public.has_permission('events.manage')));

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

-- 3f. An event outlives the account that made it (2026-10-14) -------------------
-- This section can be run again by itself. Without it, removing an admin's account (the people feature)
-- would be refused for as long as an event they created exists.
alter table public.events drop constraint if exists events_created_by_fkey;
alter table public.events add constraint events_created_by_fkey
  foreign key (created_by) references auth.users (id) on delete set null;

-- 3g. A contact phone number (2026-10-17) -----------------------------------
-- This section can be run again by itself. Run it after 3b, 3c and 3e: it replaces both functions.
-- Whom to call about an event, shown on its page, where a member can call, text or copy it. A number only
-- (digits, spaces and + ( ) - .), so nothing else can sit behind the call and text links. Written with
-- "events.manage", like the rest of the event.
alter table public.events add column if not exists contact_phone text
  check (length(contact_phone) <= 30 and contact_phone ~ '^[0-9 +().-]+$');
grant insert (contact_phone), update (contact_phone) on public.events to authenticated;

-- The schedule's one read (3b), now with the number.
drop function if exists public.upcoming_events (timestamptz, timestamptz);
create function public.upcoming_events(until timestamptz, cancelled_since timestamptz)
returns table (
  id uuid, group_id uuid, starts_at timestamptz, ends_at timestamptz, repeats_weekly boolean, repeat_until date,
  canceled_at timestamptz, thumbnail_path text, contact_phone text, texts jsonb, canceled_dates date[]
)
language sql stable set search_path = '' as $$
  select
    e.id, e.group_id, e.starts_at, e.ends_at, e.repeats_weekly, e.repeat_until, e.canceled_at, e.thumbnail_path,
    e.contact_phone,
    coalesce(
      (select jsonb_object_agg(t.language, jsonb_build_object('title', t.title, 'description', t.description, 'location', t.location))
       from public.event_texts t where t.event_id = e.id),
      '{}'::jsonb
    ),
    coalesce((select array_agg(c.occurrence_date) from public.event_cancellations c where c.event_id = e.id), '{}')
  from public.events e
  where e.deleted_at is null
    and e.starts_at <= until
    and (e.repeats_weekly or e.starts_at >= now())
    and (e.canceled_at is null or e.canceled_at >= cancelled_since);
$$;
revoke execute on function public.upcoming_events (timestamptz, timestamptz) from public, anon;
grant execute on function public.upcoming_events (timestamptz, timestamptz) to authenticated;

-- The editor's one read (3c), now with the number.
drop function if exists public.managed_events ();
create function public.managed_events()
returns table (
  id uuid, group_id uuid, starts_at timestamptz, ends_at timestamptz, repeats_weekly boolean, repeat_until date,
  canceled_at timestamptz, thumbnail_path text, contact_phone text, texts jsonb, canceled_dates date[],
  reminder_minutes int[]
)
language sql stable set search_path = '' as $$
  select
    e.id, e.group_id, e.starts_at, e.ends_at, e.repeats_weekly, e.repeat_until, e.canceled_at, e.thumbnail_path,
    e.contact_phone,
    coalesce(
      (select jsonb_object_agg(t.language, jsonb_build_object('title', t.title, 'description', t.description, 'location', t.location))
       from public.event_texts t where t.event_id = e.id),
      '{}'::jsonb
    ),
    coalesce((select array_agg(c.occurrence_date) from public.event_cancellations c where c.event_id = e.id), '{}'),
    coalesce((select array_agg(r.minutes_before) from public.event_reminders r where r.event_id = e.id), '{}')
  from public.events e
  where e.deleted_at is null
    and e.canceled_at is null
    and (e.repeats_weekly or e.starts_at >= now())
  order by e.starts_at;
$$;
revoke execute on function public.managed_events () from public, anon;
grant execute on function public.managed_events () to authenticated;

-- 4. Seed data ------------------------------------------------------------
-- Until the admin page exists, these rows are how the feature is exercised: one normal case and every
-- edge case the list has to handle.

-- A: church-wide, next week, fully translated, with an end time and a location.
with new_event as (
  insert into public.events (starts_at, ends_at)
  values (now() + interval '7 days', now() + interval '7 days' + interval '90 minutes')
  returning id
)
insert into public.event_texts (event_id, language, title, description, location)
select id, 'en', 'Church picnic', 'Food, games and fellowship for every family.', 'Riverside Park' from new_event
union all
select id, 'vi', 'Dã ngoại hội thánh', 'Đồ ăn, trò chơi và thông công cho cả gia đình.', 'Công viên Riverside' from new_event;

-- B: no end time, no location: the list must not show empty fields.
with new_event as (
  insert into public.events (starts_at) values (now() + interval '2 days') returning id
)
insert into public.event_texts (event_id, language, title)
select id, 'en', 'Prayer evening' from new_event
union all
select id, 'vi', 'Buổi cầu nguyện' from new_event;

-- C: weekly, church-wide, never ends.
with new_event as (
  insert into public.events (starts_at, ends_at, repeats_weekly)
  values (now() + interval '1 day', now() + interval '1 day' + interval '2 hours', true)
  returning id
)
insert into public.event_texts (event_id, language, title, location)
select id, 'en', 'Sunday service', 'Main hall' from new_event
union all
select id, 'vi', 'Lễ Chúa nhật', 'Hội trường chính' from new_event;

-- D: weekly, once for a group only (the column is unused now), ending in two months, with next week's occurrence cancelled.
with new_event as (
  insert into public.events (group_id, starts_at, repeats_weekly, repeat_until)
  select id, now() + interval '3 days', true, (now() + interval '2 months')::date
  from public.groups where name = 'Bible Study' limit 1
  returning id
), skipped as (
  insert into public.event_cancellations (event_id, occurrence_date)
  select id, (now() + interval '10 days')::date from new_event
  returning event_id
)
insert into public.event_texts (event_id, language, title, description)
select id, 'en', 'Bible study', 'Chapter 4, bring your notes.' from new_event
union all
select id, 'vi', 'Học Kinh Thánh', 'Chương 4, nhớ mang ghi chú.' from new_event;

-- E: cancelled permanently. Members still see it, struck through, so they know not to come.
with new_event as (
  insert into public.events (starts_at, canceled_at)
  values (now() + interval '5 days', now())
  returning id
)
insert into public.event_texts (event_id, language, title)
select id, 'en', 'Youth outing (cancelled)' from new_event
union all
select id, 'vi', 'Đi chơi thanh niên (đã hủy)' from new_event;

-- F: already happened. The upcoming list must not show it.
with new_event as (
  insert into public.events (starts_at) values (now() - interval '8 days') returning id
)
insert into public.event_texts (event_id, language, title)
select id, 'en', 'Last week''s meeting' from new_event
union all
select id, 'vi', 'Buổi họp tuần trước' from new_event;

-- G: Vietnamese only. An English reader must see the Vietnamese title, not a blank row.
with new_event as (
  insert into public.events (starts_at) values (now() + interval '4 days') returning id
)
insert into public.event_texts (event_id, language, title, description)
select id, 'vi', 'Tĩnh nguyện buổi sáng', 'Chưa có bản dịch tiếng Anh.' from new_event;

-- H: soft-deleted. No member may see it, in the app or through Supabase directly.
with new_event as (
  insert into public.events (starts_at, deleted_at)
  values (now() + interval '6 days', now())
  returning id
)
insert into public.event_texts (event_id, language, title)
select id, 'en', 'Deleted by an admin' from new_event;

-- Reminders for two of the events. Members have no grant on this table, so it never reaches them.
insert into public.event_reminders (event_id, minutes_before)
select e.id, 60 from public.events e
join public.event_texts t on t.event_id = e.id and t.language = 'en'
where t.title in ('Church picnic', 'Sunday service');

-- 5. Undo (removing the feature) ------------------------------------------
-- Empty the bucket in the dashboard first (Storage → event-thumbnails), then:
-- drop policy if exists "Event managers manage event pictures" on storage.objects;
-- delete from storage.buckets where id = 'event-thumbnails';
-- drop function if exists public.upcoming_events (timestamptz, timestamptz);
-- drop function if exists public.managed_events ();
-- drop table if exists public.event_reminders, public.event_cancellations,
--   public.event_texts, public.events cascade;
