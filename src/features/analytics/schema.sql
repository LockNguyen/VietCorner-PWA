-- ANALYTICS feature schema: which screens people open, for how long, what they tap, what goes wrong and what
-- is slow. Run once in Supabase → SQL Editor, after permissions. Every section can be run again.
--
-- Security in one sentence: anyone signed in adds rows about themselves (through POST /api/analytics/record),
-- nobody changes or deletes one from the app, and only "analytics.view" (an admin) reads them.

-- 1. The permission ------------------------------------------------------------
insert into public.role_permissions (role, permission) values ('admin', 'analytics.view') on conflict do nothing;

-- 2. Table -----------------------------------------------------------------------
-- One row per thing that happened on a phone. What each column holds depends on `kind` (types.ts):
--   page   path = the screen · ms = time it was on screen · detail = from, via, wait_ms, usage, resumed
--   click  path = the screen · target = what was tapped · detail = href
--   action path = the screen · target = the action's name (a button's `data-action`: pray, music-play, …)
--   error  path = the screen · target = the message · detail = source, status
--   slow   path = the screen · target = the request's address · ms = how long it took
--   vital  path = the screen · target = LCP, INP, CLS or TTFB · ms = its value (CLS × 1000) · detail = rating
create table if not exists public.analytics_events (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  visit_id uuid not null, -- one opening of the app; a new one after 30 minutes away
  at timestamptz not null, -- by the phone's clock: rows arrive in batches, so the time they reach us says little
  kind text not null check (kind in ('page', 'click', 'action', 'error', 'slow', 'vital')), -- 'action': section 4b
  path text not null check (char_length(path) <= 200),
  target text check (char_length(target) <= 300),
  ms integer check (ms >= 0),
  detail jsonb not null default '{}'
);
create index if not exists analytics_events_at on public.analytics_events (at);
create index if not exists analytics_events_user_at on public.analytics_events (user_id, at);

-- 3. Who may do what -------------------------------------------------------------
-- Supabase grants everything by default, so a column list means nothing until that is taken away.
-- No user_id in the insert grant: it always comes from the token.
revoke all on public.analytics_events from anon, authenticated;
grant insert (visit_id, at, kind, path, target, ms, detail) on public.analytics_events to authenticated;
grant select on public.analytics_events to authenticated;

alter table public.analytics_events enable row level security;

drop policy if exists "People add rows about themselves" on public.analytics_events;
create policy "People add rows about themselves" on public.analytics_events
  for insert to authenticated with check (user_id = (select auth.uid()));

drop policy if exists "Analytics viewers read every row" on public.analytics_events;
create policy "Analytics viewers read every row" on public.analytics_events
  for select to authenticated using ((select public.has_permission('analytics.view')));

-- 4. The dashboard's reads ---------------------------------------------------------
-- Each runs as the caller (no security definer), so the select policy above applies: anyone without
-- "analytics.view" gets no rows. `since` is the start of the chosen range (a day, a week, a month).

-- Totals for the range: the dashboard's first screen.
create or replace function public.analytics_overview(since timestamptz)
returns table (people bigint, visits bigint, views bigint, total_ms bigint, errors bigint, slow bigint)
language sql stable set search_path = '' as $$
  select
    count(distinct user_id),
    count(distinct visit_id),
    count(*) filter (where kind = 'page' and not (detail ? 'resumed')),
    coalesce(sum(ms) filter (where kind = 'page'), 0),
    count(*) filter (where kind = 'error'),
    count(*) filter (where kind = 'slow')
  from public.analytics_events
  where at >= since;
$$;

-- Per screen: how often it was opened, by how many people, the time spent on it, how long it took to appear
-- (p75: three in four opened at least this fast) and how many errors happened on it.
create or replace function public.analytics_pages(since timestamptz)
returns table (path text, views bigint, people bigint, total_ms bigint, p75_wait_ms integer, errors bigint)
language sql stable set search_path = '' as $$
  select
    path,
    count(*) filter (where kind = 'page' and not (detail ? 'resumed')),
    count(distinct user_id) filter (where kind = 'page'),
    coalesce(sum(ms) filter (where kind = 'page'), 0),
    (percentile_cont(0.75) within group (order by (detail ->> 'wait_ms')::integer)
      filter (where kind = 'page' and detail ? 'wait_ms'))::integer,
    count(*) filter (where kind = 'error')
  from public.analytics_events
  where at >= since
  group by path
  having count(*) filter (where kind = 'page') > 0
  order by 2 desc;
$$;

-- Per person: visits, screens opened, time in the app, when last seen, errors they ran into.
create or replace function public.analytics_people(since timestamptz)
returns table (user_id uuid, visits bigint, views bigint, total_ms bigint, last_at timestamptz, errors bigint)
language sql stable set search_path = '' as $$
  select
    user_id,
    count(distinct visit_id),
    count(*) filter (where kind = 'page' and not (detail ? 'resumed')),
    coalesce(sum(ms) filter (where kind = 'page'), 0),
    max(at),
    count(*) filter (where kind = 'error')
  from public.analytics_events
  where at >= since
  group by user_id
  order by 5 desc;
$$;

-- From one screen, through what was tapped, to the screen it opened.
create or replace function public.analytics_paths(since timestamptz)
returns table (from_path text, via text, to_path text, times bigint)
language sql stable set search_path = '' as $$
  select detail ->> 'from', detail ->> 'via', path, count(*)
  from public.analytics_events
  where at >= since and kind = 'page' and detail ? 'from'
  group by 1, 2, 3
  order by 4 desc
  limit 100;
$$;

-- Errors, alike ones together: where they happened, how often, to how many people.
create or replace function public.analytics_errors(since timestamptz)
returns table (message text, path text, source text, times bigint, people bigint, last_at timestamptz)
language sql stable set search_path = '' as $$
  select target, path, detail ->> 'source', count(*), count(distinct user_id), max(at)
  from public.analytics_events
  where at >= since and kind = 'error'
  group by 1, 2, 3
  order by 4 desc
  limit 50;
$$;

-- Requests that took longer than SLOW_REQUEST_MS (types.ts), by address.
create or replace function public.analytics_slow(since timestamptz)
returns table (request text, times bigint, p75_ms integer, max_ms integer)
language sql stable set search_path = '' as $$
  select target, count(*), (percentile_cont(0.75) within group (order by ms))::integer, max(ms)
  from public.analytics_events
  where at >= since and kind = 'slow'
  group by 1
  order by 2 desc
  limit 50;
$$;

-- The same thing tapped three times within two seconds: it did not answer fast enough, or did not look done.
create or replace function public.analytics_repeated_taps(since timestamptz)
returns table (path text, target text, times bigint, visits bigint)
language sql stable set search_path = '' as $$
  with taps as (
    select visit_id, path, target, at,
      lag(at, 2) over (partition by visit_id, path, target order by at) as two_taps_before
    from public.analytics_events
    where at >= since and kind = 'click'
  )
  select path, target, count(*), count(distinct visit_id)
  from taps
  where at - two_taps_before <= interval '2 seconds'
  group by 1, 2
  order by 3 desc
  limit 50;
$$;

-- Google's page experience measures per screen: p75 value, and how many readings were rated poor.
create or replace function public.analytics_vitals(since timestamptz)
returns table (path text, name text, p75 integer, readings bigint, poor bigint)
language sql stable set search_path = '' as $$
  select path, target, (percentile_cont(0.75) within group (order by ms))::integer, count(*),
    count(*) filter (where detail ->> 'rating' = 'poor')
  from public.analytics_events
  where at >= since and kind = 'vital'
  group by 1, 2
  order by 5 desc, 4 desc;
$$;

-- What each person's visits asked of each service (`usage` on page rows: requests, waiting ms, bytes).
-- Bytes are 0 where the browser is not allowed to report them (another site that does not permit it).
create or replace function public.analytics_usage(since timestamptz)
returns table (user_id uuid, service text, visits bigint, requests bigint, total_ms bigint, bytes bigint)
language sql stable set search_path = '' as $$
  with visits as (
    select user_id, count(distinct visit_id) as visits
    from public.analytics_events
    where at >= since
    group by user_id
  )
  select e.user_id, u.key, v.visits,
    sum((u.value ->> 'requests')::bigint), sum((u.value ->> 'ms')::bigint), sum((u.value ->> 'bytes')::bigint)
  from public.analytics_events e
  cross join lateral jsonb_each(e.detail -> 'usage') u
  join visits v on v.user_id = e.user_id
  where e.at >= since and e.kind = 'page'
  group by e.user_id, u.key, v.visits
  order by 4 desc;
$$;

revoke execute on function public.analytics_overview (timestamptz), public.analytics_pages (timestamptz),
  public.analytics_people (timestamptz), public.analytics_paths (timestamptz), public.analytics_errors (timestamptz),
  public.analytics_slow (timestamptz), public.analytics_repeated_taps (timestamptz),
  public.analytics_vitals (timestamptz), public.analytics_usage (timestamptz) from public, anon;
grant execute on function public.analytics_overview (timestamptz), public.analytics_pages (timestamptz),
  public.analytics_people (timestamptz), public.analytics_paths (timestamptz), public.analytics_errors (timestamptz),
  public.analytics_slow (timestamptz), public.analytics_repeated_taps (timestamptz),
  public.analytics_vitals (timestamptz), public.analytics_usage (timestamptz) to authenticated;

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

-- 5. Kept 90 days (the user, 2026-10-22) ----------------------------------------------
-- Keeps the table small and limits what is stored about people. Runs nightly at 04:00 UTC; scheduling it
-- again under the same name replaces the job.
create extension if not exists pg_cron;
select cron.schedule('analytics-cleanup', '0 4 * * *', $cron$
  delete from public.analytics_events where at < now() - interval '90 days'
$cron$);

-- 6. Undo (removing the feature) ------------------------------------------------------
-- select cron.unschedule('analytics-cleanup');
-- drop function if exists public.analytics_overview (timestamptz), public.analytics_pages (timestamptz),
--   public.analytics_people (timestamptz), public.analytics_paths (timestamptz), public.analytics_errors (timestamptz),
--   public.analytics_slow (timestamptz), public.analytics_repeated_taps (timestamptz),
--   public.analytics_vitals (timestamptz), public.analytics_usage (timestamptz), public.analytics_actions (timestamptz);
-- drop table if exists public.analytics_events;
-- delete from public.role_permissions where permission = 'analytics.view';
