-- Feedback round 3 (2026-10-21). Safe to run again, top to bottom, in one go.
-- Supabase → SQL Editor, the Viet Corners project. Copy from this file in the editor, not from a terminal.
-- Run it BEFORE deploying: until the weekly card exists the Events tab shows only one-time events.
-- Then `npm run test:rls`.

-- groups/schema.sql 2f
-- 2f. A sharper group picture (2026-10-21) -----------------------------------
-- This section can be run again by itself. The picture fills a card the phone's width, so it is now saved
-- at 1600 pixels (types.ts PICTURE_SIDE) instead of 400: up to 500 KB instead of 200 KB. Pictures chosen
-- before stay soft until a manager chooses them again.
update storage.buckets set file_size_limit = 512000 where id = 'group-thumbnails';

-- events/schema.sql 3h
-- 3h. The weekly card (2026-10-21) --------------------------------------------
-- This section can be run again by itself. The first card of the Events tab: the church's name, address and
-- number over the church picture, then every weekly event and group meeting by weekday (the user, 2026-10-21).
-- One row, which the `id` check enforces: there is one church. Its name in both languages (`title` is
-- Vietnamese, `title_en` English, optional, like a group's `name` / `name_en`); the address and number once.
-- Every approved member reads it (approval/schema.sql adds "approved"); only "events.manage" changes it.
create table if not exists public.weekly_card (
  id boolean primary key default true check (id),
  title text not null check (length(trim(title)) between 1 and 100),
  title_en text check (length(trim(title_en)) between 1 and 100),
  address text check (length(address) <= 200),
  contact_phone text check (length(contact_phone) <= 30 and contact_phone ~ '^[0-9 +().-]+$')
);

revoke all on public.weekly_card from anon, authenticated;
grant select, update (title, title_en, address, contact_phone) on public.weekly_card to authenticated;
alter table public.weekly_card enable row level security;

drop policy if exists "Members read the weekly card" on public.weekly_card;
create policy "Members read the weekly card" on public.weekly_card
  for select to authenticated using (true);

drop policy if exists "Event managers edit the weekly card" on public.weekly_card;
create policy "Event managers edit the weekly card" on public.weekly_card
  for update to authenticated
  using ((select public.has_permission('events.manage')))
  with check ((select public.has_permission('events.manage')));

-- The one row, as the church is listed (src/lib/church.ts). Run again, it changes nothing an admin typed.
insert into public.weekly_card (title, title_en, address, contact_phone)
values ('Hội Thánh Việt Nam Winston-Salem', 'Vietnamese Church of Winston-Salem',
        '134 S Peace Haven Rd (SeChrist Building), Winston-Salem, NC 27104', '(336) 997-8012')
on conflict (id) do nothing;

-- approval/schema.sql section 3: the weekly card is for approved accounts only
drop policy if exists "Approved accounts only" on public.weekly_card;
create policy "Approved accounts only" on public.weekly_card
  as restrictive for all to authenticated using ((select public.has_permission('app.use')));
