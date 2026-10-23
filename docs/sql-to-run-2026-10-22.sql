-- Feedback round 4 (2026-10-22). Safe to run again. Supabase → SQL Editor, the Viet Corners project.
-- Copy from this file in the editor, not from a terminal. Run it BEFORE deploying, then `npm run test:rls`.
-- The sign-in change (a used link works all day) needs no SQL: it is in the server code.

-- prayer/schema.sql 5c
-- 5c. Everyone sees how many prayed (2026-10-22, the user) --------------------
-- This section can be run again by itself. The same view as 5b, with the count for every reader instead of the
-- author only: members asked to see how many prayed for each other's requests too. This undoes 5b's "nobody can
-- compare requests" on purpose (the architecture's Key Decisions). Still a number only, never who prayed.
create or replace view public.prayer_feed with (security_invoker = false) as
select
  r.id,
  r.body,
  r.is_anonymous,
  r.created_at,
  r.author_id = auth.uid() as is_mine,
  case when r.is_anonymous then null else p.name end as author_name,
  r.prayer_count,
  case when r.is_anonymous then null else p.avatar_path end as author_avatar
from public.prayer_requests r
join public.profiles p on p.user_id = r.author_id
where r.deleted_at is null
  and r.answered_at is null
  and (select public.has_permission('app.use'));


-- group-info/schema.sql 10 (needs profiles/schema.sql 6, already run 2026-10-19)
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

-- analytics/schema.sql 4b — run BEFORE the new code is used: until then the database refuses the new `action`
-- events, and with them the rest of the batch they are sent in.
-- 4b. Named actions: praying, the worship music (2026-10-22, the user) ----------------------
-- This section can be run again by itself. A button marked with `data-action` (Prayer's Pray; the music's play,
-- pause, back and next) is recorded as an `action` with that name in `target` (hooks/useTapTracking.ts), so how
-- often people pray and play the music can be counted whatever the button's words say: those change with the
-- count ("Pray, 3 people prayed"), the state (Play or Pause) and the language.
alter table public.analytics_events drop constraint if exists analytics_events_kind_check;
alter table public.analytics_events add constraint analytics_events_kind_check
  check (kind in ('page', 'click', 'action', 'error', 'slow', 'vital'));

-- How often each action was used in the period, and by how many people.
create or replace function public.analytics_actions(since timestamptz)
returns table (action text, times bigint, people bigint)
language sql stable set search_path = '' as $$
  select target, count(*), count(distinct user_id)
  from public.analytics_events
  where at >= since and kind = 'action'
  group by 1
  order by 2 desc;
$$;
revoke execute on function public.analytics_actions (timestamptz) from public, anon;
grant execute on function public.analytics_actions (timestamptz) to authenticated;

