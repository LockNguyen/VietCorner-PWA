-- An event's contact phone number (2026-10-17). Safe to run again.
-- Supabase → SQL Editor, the Viet Corners project. Copy from this file in the editor, not from a terminal.

-- events/schema.sql, section 3g
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
