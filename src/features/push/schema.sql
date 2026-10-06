-- PUSH feature schema. Run once in Supabase → SQL Editor.
-- Security: RLS is on. A user reaches only their own devices; the server sends with the service role.

-- 1. Devices --------------------------------------------------------------

-- One row per device. The endpoint is a URL unique to that browser + app install.
create table public.push_subscriptions (
  endpoint text primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  subscription jsonb not null,
  created_at timestamptz not null default now()
);

-- 2. Permissions ----------------------------------------------------------

grant select, insert, update, delete on public.push_subscriptions to authenticated;
grant all on public.push_subscriptions to service_role;

alter table public.push_subscriptions enable row level security;

create policy "Users manage their own push subscriptions"
  on public.push_subscriptions for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- 3. The pause between notifications -------------------------------------
-- When each user was last notified about each topic ("chat:<group id>", "prayer"). Server-only: no grants,
-- no policies. It is what lets a busy group send one notification a minute instead of one per message.
create table public.push_cooldowns (
  user_id uuid not null references auth.users (id) on delete cascade,
  topic text not null,
  notified_at timestamptz not null default now(),
  primary key (user_id, topic)
);

revoke all on public.push_cooldowns from anon, authenticated;
grant all on public.push_cooldowns to service_role;
alter table public.push_cooldowns enable row level security;

-- Answers which of `user_ids` may be notified about `topic` right now, and marks them as notified in the
-- same statement. One statement, so two messages sent at the same instant cannot both notify one person:
-- the second finds the row already updated.
create function public.claim_push_turns(user_ids uuid[], topic text, pause_seconds integer)
returns setof uuid
language sql set search_path = '' as $$
  insert into public.push_cooldowns (user_id, topic)
  select unnest(user_ids), topic
  on conflict (user_id, topic) do update set notified_at = now()
    where push_cooldowns.notified_at <= now() - make_interval(secs => pause_seconds)
  returning user_id;
$$;

revoke execute on function public.claim_push_turns (uuid[], text, integer) from public, anon, authenticated;
grant execute on function public.claim_push_turns (uuid[], text, integer) to service_role;

-- 4. Sending something exactly once -----------------------------------------
-- A reminder is worked out again every time the scheduler runs, so "was this one already sent?" has to be
-- remembered somewhere. Each send has a key ("event-reminder:<event>:<start>:<minutes>:<language>"); the
-- first run to insert the key sends, every later run finds it and does not. Server-only.
create table public.push_sent_once (
  key text primary key,
  sent_at timestamptz not null default now()
);

revoke all on public.push_sent_once from anon, authenticated;
grant all on public.push_sent_once to service_role;
alter table public.push_sent_once enable row level security;

-- True for the first caller with this key, false for everyone after: checked and recorded in one statement,
-- so two scheduler runs that overlap cannot both send.
create function public.claim_push_once(key text) returns boolean
language sql set search_path = '' as $$
  with claimed as (
    insert into public.push_sent_once (key) values (claim_push_once.key)
    on conflict do nothing
    returning 1
  )
  select exists (select 1 from claimed);
$$;

revoke execute on function public.claim_push_once (text) from public, anon, authenticated;
grant execute on function public.claim_push_once (text) to service_role;

-- 5. The clock (run by hand, once, with your own values) --------------------
-- Reminders are sent by a route on the website; something has to call it. Supabase's cron does, every 15
-- minutes. Replace <SITE> with the site's address and <CRON_SECRET> with the same value as the CRON_SECRET
-- environment variable on Netlify. Do not commit the real secret.
--
-- create extension if not exists pg_cron;
-- create extension if not exists pg_net;
-- select cron.schedule('send-reminders', '*/15 * * * *', $cron$
--   select net.http_post(
--     url := 'https://<SITE>/api/reminders/send',
--     headers := jsonb_build_object('Authorization', 'Bearer <CRON_SECRET>')
--   );
-- $cron$);
--
-- To stop it: select cron.unschedule('send-reminders');

-- 6. Undo (removing the feature) ------------------------------------------
-- select cron.unschedule('send-reminders');
-- drop function if exists public.claim_push_once (text);
-- drop function if exists public.claim_push_turns (uuid[], text, integer);
-- drop table if exists public.push_sent_once, public.push_cooldowns, public.push_subscriptions cascade;
