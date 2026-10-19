-- Staff: people apart from headings (2026-10-19). Supabase → SQL Editor, the Viet Corners project.
-- Copy from this file in the editor, not from a terminal (Vietnamese letters).
--
-- Part A is safe to run again and changes nothing the live app reads: run it now.
-- Part B removes the old table: run it only after the new version is live (the Staff page shows the cards).

-- PART A -------------------------------------------------------------------

-- 1. The new tables, their grants and rules: staff/schema.sql sections 1-3 (sections already there are skipped).
create table if not exists public.staff_people (
  id uuid primary key default gen_random_uuid(),
  name_en text not null,
  name_vi text not null unique,
  role_en text not null,
  role_vi text not null,
  phone text,
  photo text
);

create table if not exists public.staff_placements (
  person_id uuid not null references public.staff_people (id) on delete cascade,
  section_id uuid not null references public.staff_sections (id) on delete cascade,
  position int not null default 0,
  primary key (person_id, section_id)
);

revoke all on public.staff_people, public.staff_placements from anon, authenticated;
grant select on public.staff_people, public.staff_placements to authenticated;

alter table public.staff_people enable row level security;
alter table public.staff_placements enable row level security;

drop policy if exists "Members read staff people" on public.staff_people;
create policy "Members read staff people" on public.staff_people
  for select to authenticated using (true);

drop policy if exists "Members read who is under which heading" on public.staff_placements;
create policy "Members read who is under which heading" on public.staff_placements
  for select to authenticated using (true);

-- 2. The approval door: approval/schema.sql section 3.
drop policy if exists "Approved accounts only" on public.staff_people;
create policy "Approved accounts only" on public.staff_people
  as restrictive for all to authenticated using ((select public.has_permission('app.use')));

drop policy if exists "Approved accounts only" on public.staff_placements;
create policy "Approved accounts only" on public.staff_placements
  as restrictive for all to authenticated using ((select public.has_permission('app.use')));

-- 3. Copy each card across, keeping its id (so a second run copies nothing twice).
insert into public.staff_people (id, name_en, name_vi, role_en, role_vi, phone, photo)
select id, name_en, name_vi, role_en, role_vi, phone, photo from public.staff_members
on conflict do nothing;

insert into public.staff_placements (person_id, section_id, position)
select id, section_id, position from public.staff_members
on conflict do nothing;

-- Check: the same people, now under their headings.
select s.heading_vi, pl.position, p.name_vi, p.phone, p.photo
from public.staff_placements pl
join public.staff_people p on p.id = pl.person_id
join public.staff_sections s on s.id = pl.section_id
order by s.position, pl.position;


-- PART B: after the new version is live ------------------------------------
-- drop policy if exists "Approved accounts only" on public.staff_members;
-- drop table if exists public.staff_members;
