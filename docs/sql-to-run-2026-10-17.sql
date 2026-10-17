-- Everything to run for English group names and places (2026-10-17), in this order. Safe to run again.
-- Supabase → SQL Editor, the Viet Corners project. Copy from this file in the editor, not from a terminal.

-- 1. groups/schema.sql, section 2e
-- 2e. A group's name in English (2026-10-17) ---------------------------------
-- This section can be run again by itself. `name` is the group's Vietnamese name, as it always was;
-- `name_en` is its English one, optional. An English reader sees `name_en`, or `name` while there is none,
-- the way an event written in one language still has a title (group-info shows it).
alter table public.groups add column if not exists name_en text check (length(trim(name_en)) between 1 and 60);
grant update (name_en) on public.groups to authenticated; -- only with the manager policy in section 2

-- 2. group-info/schema.sql, section 8
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
