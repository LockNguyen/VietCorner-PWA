-- A group's contact phone number (2026-10-17). Safe to run again. Run after docs/sql-to-run-2026-10-17.sql.
-- Supabase → SQL Editor, the Viet Corners project. Copy from this file in the editor, not from a terminal.

-- group-info/schema.sql, section 9
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
