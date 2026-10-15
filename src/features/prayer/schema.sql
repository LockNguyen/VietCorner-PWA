-- PRAYER feature schema. Run once in Supabase → SQL Editor, after features/groups/schema.sql and
-- features/profiles/schema.sql (the feed shows authors by name).
-- Copy this file from the editor, not from terminal output (PowerShell garbles non-ASCII text).
--
-- Security in one sentence: members cannot read `prayer_requests` at all. They read `prayer_feed`, a view
-- that leaves out who wrote an anonymous request, so anonymity holds even against a direct Supabase call.
--
-- Every request is shared with the whole church (decided 2026-10-12): sections 3b, 4 and 5 hold that rule.
-- An existing database is brought up to date by running those three sections again, in that order.

-- 1. Tables ---------------------------------------------------------------

create table public.prayer_requests (
  id uuid primary key default gen_random_uuid(),
  -- Unused since 2026-10-12: section 3b makes it optional and new requests leave it empty.
  group_id uuid not null references public.groups (id) on delete cascade,
  -- Both come from the login token. The browser cannot send them: it has no insert grant on these
  -- columns (section 2), so nobody can post as someone else.
  author_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  author_email text not null default (auth.jwt() ->> 'email'),
  body text not null check (length(body) between 1 and 1000),
  -- The author is still stored when this is true: developers and admins can see who wrote it, members cannot.
  is_anonymous boolean not null default false,
  -- How many times someone tapped "Pray". A number only: who prayed is never stored.
  prayer_count integer not null default 0,
  -- An answered request leaves the feed but stays here, for an end-of-year look back at answered prayers.
  answered_at timestamptz,
  -- Set by an admin (admin feature). The author's own delete removes the row for good.
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);
create index prayer_requests_group_id_created_at on public.prayer_requests (group_id, created_at desc);

-- Admin configuration: when the church is nudged to pray, as often as wanted. A row that still names a
-- group is from before 2026-10-12 and is never sent (section 3b).
-- Edited on the Admin tab by whoever holds "prayer.reminders"; sent by the scheduler (the push README).
create table public.prayer_reminders (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6), -- 0 = Sunday, as JavaScript and Postgres count
  send_at time not null, -- church time (src/lib/churchTime.ts)
  created_at timestamptz not null default now(),
  unique (group_id, weekday, send_at)
);

-- 2. Permissions ----------------------------------------------------------
-- Supabase grants everything on a new table by default, so start from nothing and add back what is needed.

revoke all on public.prayer_requests, public.prayer_reminders from anon, authenticated;
grant all on public.prayer_requests, public.prayer_reminders to service_role;

-- Column grants are what make the author unforgeable and unreadable:
grant insert (group_id, body, is_anonymous) on public.prayer_requests to authenticated;
grant select (id) on public.prayer_requests to authenticated; -- only so `where id = ...` works below
grant update (body, answered_at) on public.prayer_requests to authenticated;
grant delete on public.prayer_requests to authenticated;

grant select, delete on public.prayer_reminders to authenticated; -- reminder managers only, by the policy in section 3
grant insert (group_id, weekday, send_at) on public.prayer_reminders to authenticated;

-- 3. Row Level Security ---------------------------------------------------

alter table public.prayer_requests enable row level security;
alter table public.prayer_reminders enable row level security;

-- (Who may post a request is in section 3b.)

-- An update or delete finds its row with `where id = ...`, which needs a select policy. It covers the
-- author's own rows only, and the column grant above limits what comes back to the id.
create policy "Authors find their own requests" on public.prayer_requests
  for select to authenticated using (author_id = auth.uid());

create policy "Authors edit their own requests and mark them answered" on public.prayer_requests
  for update to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());

create policy "Authors delete their own requests" on public.prayer_requests
  for delete to authenticated using (author_id = auth.uid());

-- Reminders: whoever holds "prayer.reminders" sets when the church is nudged to pray. Members never read
-- this table; the scheduler reads it with the service role.
create policy "Prayer reminder managers set reminders" on public.prayer_reminders
  for all to authenticated
  using ((select public.has_permission('prayer.reminders')))
  with check ((select public.has_permission('prayer.reminders')));

insert into public.role_permissions (role, permission) values ('admin', 'prayer.reminders');

-- 3b. Shared with the whole church (2026-10-12) ----------------------------
-- This section can be run again by itself.
--
-- A request no longer belongs to a group, and neither does a reminder. Requests once shared with one
-- group now show to everyone (decided with the user); reminders once set for one group are kept, unsent.
-- Who counts as "a member" is the approval feature's rule: its schema.sql adds "approved accounts only"
-- on top of the policies here, and sections 4 and 5 ask it themselves because they skip row rules.
alter table public.prayer_requests alter column group_id drop not null;
alter table public.prayer_reminders alter column group_id drop not null;

-- The browser may no longer send a group at all. Revoking on the table also clears the old column list.
revoke insert on public.prayer_requests, public.prayer_reminders from authenticated;
grant insert (body, is_anonymous) on public.prayer_requests to authenticated;
grant insert (weekday, send_at) on public.prayer_reminders to authenticated;

drop policy if exists "Members ask their own group for prayer" on public.prayer_requests;
drop policy if exists "Members ask the church for prayer" on public.prayer_requests;
create policy "Members ask the church for prayer" on public.prayer_requests
  for insert to authenticated with check (author_id = auth.uid());

-- The table's own unique rule compares groups, and two empty groups never count as equal: without this,
-- the same day and time could be added twice and the church would be reminded twice.
create unique index if not exists prayer_reminders_church_wide
  on public.prayer_reminders (weekday, send_at) where group_id is null;

-- 4. What members read ----------------------------------------------------
-- RLS hides rows, not columns, so a policy alone could not keep `author_id` away from other members.
-- This view is the only way to read requests. It runs with its owner's rights (it has to: members have no
-- grant on the table), which means the `where` clause below IS the security. tests/rls.test.ts attacks it.
-- This section can be run again by itself: it is how the view is changed (dropped, then made anew).
drop view if exists public.prayer_feed;
create view public.prayer_feed with (security_invoker = false) as
select
  r.id,
  r.body,
  r.is_anonymous,
  r.created_at,
  -- Lets the app show the author their own controls without ever sending an author id.
  r.author_id = auth.uid() as is_mine,
  -- The name as it is today (`profiles`), so a corrected name shows on older requests too.
  case when r.is_anonymous then null else p.name end as author_name
  -- `prayer_count` is deliberately absent: the author hears it in a notification, nobody reads it here.
from public.prayer_requests r
join public.profiles p on p.user_id = r.author_id
where r.deleted_at is null
  and r.answered_at is null
  -- The whole church reads every request, and "the church" is the approved accounts. Without this line
  -- anyone who signed up with an email address, approved or not, could read them all.
  and (select public.has_permission('app.use'));

revoke all on public.prayer_feed from anon, authenticated;
grant select on public.prayer_feed to authenticated;

-- 5. Praying for a request ------------------------------------------------
-- This section can be run again by itself: it is how the function is changed.
--
-- Members cannot update `prayer_count` themselves (no grant), or one call could set it to a million.
-- This function adds exactly one, and only for a request the caller can see and did not write.
-- It answers whether a prayer was counted, so the server notifies the author only when one was.
create or replace function public.pray_for_request(request_id uuid) returns boolean
language sql security definer set search_path = '' as $$
  with counted as (
    update public.prayer_requests r
    set prayer_count = r.prayer_count + 1
    where r.id = request_id
      and r.deleted_at is null
      and r.answered_at is null
      and r.author_id <> auth.uid()
      and (select public.has_permission('app.use')) -- an approved account, as in the view
    returning 1
  )
  select exists (select 1 from counted);
$$;

revoke execute on function public.pray_for_request (uuid) from public, anon;
grant execute on function public.pray_for_request (uuid) to authenticated;

-- 6. Seed data ------------------------------------------------------------
-- Requests are not seeded: each needs a signed-in author, and the SQL Editor has none. Post them in the app.
-- Reminders, so the Admin tab has something to show: Wednesday evening and Sunday morning, church time.
insert into public.prayer_reminders (weekday, send_at) values (3, time '19:00'), (0, time '08:00');

-- 7. Undo (removing the feature) ------------------------------------------
-- drop function if exists public.pray_for_request (uuid);
-- drop index if exists public.prayer_reminders_church_wide;
-- drop view if exists public.prayer_feed;
-- drop table if exists public.prayer_reminders, public.prayer_requests cascade;
