-- STAFF page: copy-paste scripts for Supabase → SQL Editor. Run ONE block at a time.
--
-- How it fits together: a PERSON is typed once (name, role, phone, photo). Putting them under a HEADING
-- needs only their name and the heading. The same person may sit under several headings.
--
-- Replace the example values (in quotes) with your own. Keep the single quotes around text.
--   To write ' inside text, type it twice: 'O''Brien'.
--   No phone or photo: write null without quotes (no number line / the default figure).
--   Positions are plain numbers, no quotes: smaller shows first.
-- People are found by their EXACT Vietnamese name; headings ignore capital letters.
-- Changes show on the next open of the Staff page. No deploy needed.
-- Copy from this file in the editor, not from terminal output: PowerShell garbles Vietnamese letters.


-- 0. SEE what is there now ----------------------------------------------------
select s.position as heading_order, s.heading_vi, pl.position as card_order,
       p.name_vi, p.name_en, p.role_vi, p.role_en, p.phone, p.photo
from public.staff_sections s
left join public.staff_placements pl on pl.section_id = s.id
left join public.staff_people p on p.id = pl.person_id
order by s.position, pl.position;

-- Everyone, including people not under any heading yet:
select name_vi, name_en, role_vi, role_en, phone, photo from public.staff_people order by name_vi;


-- 1. ADD a new person (typed once) ----------------------------------------------
insert into public.staff_people (name_vi, name_en, role_vi, role_en, phone, photo)
values ('Mục sư Anh Tuấn', 'Pastor Tuan', 'Mục sư Quản Nhiệm', 'Executive Pastor', '(336) 555-0102', null);


-- 2. PUT a person under a heading (name only) ------------------------------------
insert into public.staff_placements (person_id, section_id, position)
select p.id, s.id, 2                              -- 2 = their order under this heading
from public.staff_people p, public.staff_sections s
where p.name_vi = 'Mục sư Anh Tuấn'
  and s.heading_vi ilike 'Ban điều hành';
-- "INSERT 0 0" means the name or the heading did not match: check them with block 0.
-- "duplicate key" means they are already under that heading.


-- 3. EDIT a person (shows everywhere they appear) -----------------------------------
-- Keep only the lines you change. Every line but the last ends in a comma.
update public.staff_people set
  name_vi = 'Mục sư Khai',
  name_en = 'Pastor Khai',
  role_vi = 'Mục sư điều hành',
  role_en = 'Executive pastor',
  phone   = '(336) 555-0101'
where name_vi = 'Mục sư Khai';   -- who to change: their CURRENT Vietnamese name


-- 3b. A PHOTO you upload yourself ---------------------------------------------------
-- a) Crop it square (about 400 × 400 px), save as JPEG, PNG or WebP, under 1 MB. Name it simply: khai.jpg
-- b) Supabase → Storage → staff-photos → Upload file.
-- c) Click the file → "Get URL". It looks like
--    https://<project-ref>.supabase.co/storage/v1/object/public/staff-photos/khai.jpg
-- d) Run:
update public.staff_people
set photo = 'paste the URL here'
where name_vi = 'Mục sư Khai';
-- To replace a photo later: upload under a NEW name (khai-2.jpg) and run d) again. Same name = phones may
-- keep showing the old one for a while. Back to the default figure: set photo = null.


-- 4. CHANGE a person's order under a heading ---------------------------------------
update public.staff_placements set position = 1
where person_id = (select id from public.staff_people where name_vi = 'Mục sư Khai')
  and section_id = (select id from public.staff_sections where heading_vi ilike 'Ban điều hành');


-- 5. TAKE a person off a heading (they stay in the list of people) -------------------
delete from public.staff_placements
where person_id = (select id from public.staff_people where name_vi = 'Mục sư Anh Tuấn')
  and section_id = (select id from public.staff_sections where heading_vi ilike 'Ban điều hành');


-- 6. REMOVE a person completely (from every heading) ---------------------------------
delete from public.staff_people where name_vi = 'Mục sư Anh Tuấn';


-- 7. ADD a heading -------------------------------------------------------------------
insert into public.staff_sections (heading_vi, heading_en, position)
values ('Ban chấp sự', 'Deacons', 2);            -- Ban điều hành is 1


-- 8. RENAME or REORDER a heading -----------------------------------------------------
update public.staff_sections set
  heading_vi = 'Ban điều hành',
  heading_en = 'Leadership',
  position   = 1
where heading_vi ilike 'Ban điều hành';         -- its CURRENT Vietnamese heading


-- 9. REMOVE a heading (the people stay; only their place under it goes) ---------------
delete from public.staff_sections where heading_vi ilike 'Ban chấp sự';
