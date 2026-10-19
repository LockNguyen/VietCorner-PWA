-- STAFF feature schema. Run once in Supabase → SQL Editor, then the staff line in
-- features/approval/schema.sql section 3. Safe to re-run: every statement checks first.
--
-- Three tables: headings ("Ban điều hành"), people, and who sits under which heading (a card each).
-- Members only read. Nobody writes from the app: the user edits these rows in the SQL Editor
-- (edit-staff.sql has the scripts), which runs as the owner and skips the rules below. No deploy needed.

-- 1. Tables ---------------------------------------------------------------
-- A person is typed once (staff_people); placing them under a heading is one short row (staff_placements),
-- found by name. why: the same person can sit under two headings, and a phone change is made in one place.

create table if not exists public.staff_sections (
  id uuid primary key default gen_random_uuid(),
  heading_en text not null,
  heading_vi text not null,
  position int not null default 0 -- smaller comes first on the page
);

create table if not exists public.staff_people (
  id uuid primary key default gen_random_uuid(),
  name_en text not null,     -- how members call them: "Pastor Khai"
  name_vi text not null unique, -- unique: the scripts find a person by this name
  role_en text not null,     -- grey line under the name: "Executive pastor"
  role_vi text not null,
  phone text,                -- as people write it: "(336) 555-0101"; null = no number line
  photo text                 -- a URL (Storage → staff-photos), or a path under public/; null = default figure
);

create table if not exists public.staff_placements (
  person_id uuid not null references public.staff_people (id) on delete cascade,
  section_id uuid not null references public.staff_sections (id) on delete cascade,
  position int not null default 0, -- order inside the heading, smaller first
  primary key (person_id, section_id) -- once per heading
);

-- 2. Grants ---------------------------------------------------------------
-- Read only. Supabase grants everything on a new table by default, so take it all away first.

revoke all on public.staff_sections, public.staff_people, public.staff_placements from anon, authenticated;
grant select on public.staff_sections, public.staff_people, public.staff_placements to authenticated;

-- 3. Row Level Security ---------------------------------------------------
-- Every signed-in account may read; the approval feature adds "and approved" on top (its section 3).

alter table public.staff_sections enable row level security;
alter table public.staff_people enable row level security;
alter table public.staff_placements enable row level security;

drop policy if exists "Members read staff headings" on public.staff_sections;
create policy "Members read staff headings" on public.staff_sections
  for select to authenticated using (true);

drop policy if exists "Members read staff people" on public.staff_people;
create policy "Members read staff people" on public.staff_people
  for select to authenticated using (true);

drop policy if exists "Members read who is under which heading" on public.staff_placements;
create policy "Members read who is under which heading" on public.staff_placements
  for select to authenticated using (true);

-- 3b. Photos: the bucket "staff-photos" -----------------------------------
-- PUBLIC, on purpose: a staff photo is the kind a church puts on its website, and a public address needs no
-- signing code in the page. Anyone with a file's address can open it. The user uploads in the dashboard
-- (Storage → staff-photos), which runs as the owner, so there are no write policies: no member can upload.
-- why 1 MB and these types: a 400 px square is far smaller; this stops a phone's 5 MB original by mistake.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('staff-photos', 'staff-photos', true, 1048576, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- 4. Seed: what directory.ts held before the move (2026-10-19) ---------------
-- Only when the tables are empty, so a re-run does not add Pastor Khai twice.

do $$
declare
  leadership uuid;
  khai uuid;
begin
  if not exists (select 1 from public.staff_sections) then
    insert into public.staff_sections (heading_en, heading_vi, position)
    values ('Leadership', 'Ban điều hành', 1)
    returning id into leadership;

    insert into public.staff_people (name_en, name_vi, role_en, role_vi)
    values ('Pastor Khai', 'Mục sư Khai', 'Executive pastor', 'Mục sư điều hành')
    returning id into khai;

    insert into public.staff_placements (person_id, section_id, position) values (khai, leadership, 1);
  end if;
end $$;

-- 5. Undo (removing the feature) ------------------------------------------
-- Empty the bucket in the dashboard first (Storage → staff-photos): a bucket with files cannot be deleted.
-- delete from storage.buckets where id = 'staff-photos';
-- drop policy if exists "Approved accounts only" on public.staff_placements;
-- drop policy if exists "Approved accounts only" on public.staff_people;
-- drop policy if exists "Approved accounts only" on public.staff_sections;
-- drop table if exists public.staff_placements;
-- drop table if exists public.staff_people;
-- drop table if exists public.staff_sections;
