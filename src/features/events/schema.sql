-- EVENTS feature schema. Run once in Supabase → SQL Editor.
--
-- Four tables instead of one, so a member's phone downloads only what it shows:
--   events              when it happens (structure only)
--   event_texts         one row per language; a member fetches theirs, not both
--   event_cancellations one skipped week of a recurring event
--   event_reminders     admin configuration; members have no grant on it at all
--
-- Visibility: an event with no group is church-wide; an event with a group is for its members only.
-- That policy reads chat's `group_members` table, which is the one place these two features touch.

-- 1. Tables ---------------------------------------------------------------

create table public.events (
  id uuid primary key default gen_random_uuid(),
  -- Null = church-wide. Set = only that group's members see it.
  group_id uuid references public.groups (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz,                    -- optional: many events just have a start time
  repeats_weekly boolean not null default false,
  repeat_until date,                      -- optional: null means it keeps repeating until cancelled
  canceled_at timestamptz,                -- the whole event is off, including future weeks
  deleted_at timestamptz,                 -- soft delete: admins can undo, members never see it
  created_by uuid not null default auth.uid() references auth.users (id),
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
  created_at timestamptz not null default now()
);

-- 2. Grants ---------------------------------------------------------------
-- Members read. Nobody writes from the browser yet: admins get write access in the admin feature.
-- event_reminders has NO grant, so it never reaches a member's device.

grant select on public.events to authenticated;
grant select on public.event_texts to authenticated;
grant select on public.event_cancellations to authenticated;
revoke all on public.event_reminders from anon, authenticated;

-- 3. Row Level Security ---------------------------------------------------

alter table public.events enable row level security;
alter table public.event_texts enable row level security;
alter table public.event_cancellations enable row level security;
alter table public.event_reminders enable row level security;

-- Church-wide events, plus events of groups the member joined. Soft-deleted rows are hidden here, so a
-- member cannot read them even by querying Supabase directly.
create policy "Members read events they belong to" on public.events
  for select to authenticated using (
    deleted_at is null
    and (
      group_id is null
      or exists (
        select 1 from public.group_members m
        where m.group_id = events.group_id and m.user_id = auth.uid()
      )
    )
  );

-- Text and cancellations follow their event: if you cannot see the event, you cannot see its words.
create policy "Members read text of events they can see" on public.event_texts
  for select to authenticated using (
    exists (select 1 from public.events e where e.id = event_texts.event_id)
  );

create policy "Members read cancellations of events they can see" on public.event_cancellations
  for select to authenticated using (
    exists (select 1 from public.events e where e.id = event_cancellations.event_id)
  );

-- event_reminders gets RLS with no policies at all: admin code will reach it with the service role.

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

-- D: weekly for a group only, ending in two months, with next week's occurrence cancelled.
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
-- drop table if exists public.event_reminders, public.event_cancellations,
--   public.event_texts, public.events cascade;
