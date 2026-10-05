-- PRAYER feature schema. Run once in Supabase → SQL Editor, after features/groups/schema.sql.
-- Copy this file from the editor, not from terminal output (PowerShell garbles non-ASCII text).
--
-- Security in one sentence: members cannot read `prayer_requests` at all. They read `prayer_feed`, a view
-- that leaves out who wrote an anonymous request, so anonymity holds even against a direct Supabase call.

-- 1. Tables ---------------------------------------------------------------

create table public.prayer_requests (
  id uuid primary key default gen_random_uuid(),
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
  answered_at timestamptz,
  -- Set by an admin (admin feature). The author's own delete removes the row for good.
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);
create index prayer_requests_group_id_created_at on public.prayer_requests (group_id, created_at desc);

-- Admin configuration: when a group is nudged to pray. A group can have several.
-- Nothing sends these yet; the admin feature adds the page that edits them and the scheduler that acts on them.
create table public.prayer_reminders (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6), -- 0 = Sunday, as JavaScript and Postgres count
  send_at time not null, -- church local time; which timezone that is gets decided with backlog B21
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
grant update (answered_at) on public.prayer_requests to authenticated;
grant delete on public.prayer_requests to authenticated;

-- 3. Row Level Security ---------------------------------------------------

alter table public.prayer_requests enable row level security;
alter table public.prayer_reminders enable row level security;

create policy "Members ask their own group for prayer" on public.prayer_requests
  for insert to authenticated with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.group_members m
      where m.group_id = prayer_requests.group_id and m.user_id = auth.uid()
    )
  );

-- An update or delete finds its row with `where id = ...`, which needs a select policy. It covers the
-- author's own rows only, and the column grant above limits what comes back to the id.
create policy "Authors find their own requests" on public.prayer_requests
  for select to authenticated using (author_id = auth.uid());

create policy "Authors mark their own requests answered" on public.prayer_requests
  for update to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());

create policy "Authors delete their own requests" on public.prayer_requests
  for delete to authenticated using (author_id = auth.uid());

-- prayer_reminders gets RLS with no policies at all: admin code will reach it with the service role.

-- 4. What members read ----------------------------------------------------
-- RLS hides rows, not columns, so a policy alone could not keep `author_id` away from other members.
-- This view is the only way to read requests. It runs with its owner's rights (it has to: members have no
-- grant on the table), which means the `where` clause below IS the security. tests/rls.test.ts attacks it.
create view public.prayer_feed with (security_invoker = false) as
select
  r.id,
  r.group_id,
  g.name as group_name,
  r.body,
  r.is_anonymous,
  r.created_at,
  r.answered_at,
  -- Lets the app show the author their own controls without ever sending an author id.
  r.author_id = auth.uid() as is_mine,
  case when r.is_anonymous then null else r.author_email end as author_email,
  -- "Someone prayed for you" is for the person prayed for, nobody else.
  case when r.author_id = auth.uid() then r.prayer_count end as prayer_count
from public.prayer_requests r
join public.groups g on g.id = r.group_id
where r.deleted_at is null
  and exists (
    select 1 from public.group_members m
    where m.group_id = r.group_id and m.user_id = auth.uid()
  );

revoke all on public.prayer_feed from anon, authenticated;
grant select on public.prayer_feed to authenticated;

-- 5. Praying for a request ------------------------------------------------
-- Members cannot update `prayer_count` themselves (no grant), or one call could set it to a million.
-- This function adds exactly one, and only for a request the caller can see and did not write.
create function public.pray_for_request(request_id uuid) returns void
language sql security definer set search_path = '' as $$
  update public.prayer_requests r
  set prayer_count = r.prayer_count + 1
  where r.id = request_id
    and r.deleted_at is null
    and r.answered_at is null
    and r.author_id <> auth.uid()
    and exists (
      select 1 from public.group_members m
      where m.group_id = r.group_id and m.user_id = auth.uid()
    );
$$;

revoke execute on function public.pray_for_request (uuid) from public, anon;
grant execute on function public.pray_for_request (uuid) to authenticated;

-- 6. Seed data ------------------------------------------------------------
-- Requests are not seeded: each needs a signed-in author, and the SQL Editor has none. Post them in the app.
-- Reminders stand in for the admin page: Bible Study is nudged twice a week, Test Group once.
insert into public.prayer_reminders (group_id, weekday, send_at)
select id, 3, time '19:00' from public.groups where name = 'Bible Study'
union all
select id, 0, time '08:00' from public.groups where name = 'Bible Study'
union all
select id, 5, time '20:00' from public.groups where name = 'Test Group';

-- 7. Undo (removing the feature) ------------------------------------------
-- drop function if exists public.pray_for_request (uuid);
-- drop view if exists public.prayer_feed;
-- drop table if exists public.prayer_reminders, public.prayer_requests cascade;
