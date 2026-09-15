-- CHAT feature schema. Run once in Supabase → SQL Editor.
-- Security: every table has RLS. Browsers can only see and write what the policies below allow.

-- 1. Tables ---------------------------------------------------------------

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table public.group_members (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table public.messages (
  id bigint generated always as identity primary key,
  group_id uuid not null references public.groups (id) on delete cascade,
  -- Defaults come from the caller's login token, so the browser never has to send them.
  sender_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  sender_email text not null default (auth.jwt() ->> 'email'),
  body text not null check (length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index messages_group_id_created_at on public.messages (group_id, created_at);

-- One row per device. The endpoint is a URL unique to that browser + app install.
create table public.push_subscriptions (
  endpoint text primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  subscription jsonb not null,
  created_at timestamptz not null default now()
);

-- 2. Permissions ----------------------------------------------------------
-- Grants say which operations are possible at all; RLS policies then filter rows.

grant select on public.groups to authenticated;
grant select, insert on public.group_members to authenticated;
grant select, insert on public.messages to authenticated;
grant select, insert, update, delete on public.push_subscriptions to authenticated;
grant all on public.groups, public.group_members, public.messages, public.push_subscriptions to service_role;

alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.messages enable row level security;
alter table public.push_subscriptions enable row level security;

create policy "Signed-in users can see all groups"
  on public.groups for select to authenticated
  using (true);

create policy "Users see their own memberships"
  on public.group_members for select to authenticated
  using (user_id = auth.uid());

create policy "Users can join a group as themselves"
  on public.group_members for insert to authenticated
  with check (user_id = auth.uid());

create policy "Members read their group's messages"
  on public.messages for select to authenticated
  using (exists (
    select 1 from public.group_members m
    where m.group_id = messages.group_id and m.user_id = auth.uid()
  ));

create policy "Members post as themselves"
  on public.messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and sender_email = auth.jwt() ->> 'email' -- stops faking another sender's name
    and exists (
      select 1 from public.group_members m
      where m.group_id = messages.group_id and m.user_id = auth.uid()
    )
  );

create policy "Users manage their own push subscriptions"
  on public.push_subscriptions for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- 3. Realtime: broadcast new messages to open chat screens (RLS still applies) --

alter publication supabase_realtime add table public.messages;

-- 4. Seed data --------------------------------------------------------------

insert into public.groups (name) values ('Test Group'), ('Bible Study');

-- To remove the feature, run:
-- drop table if exists public.messages, public.group_members, public.push_subscriptions, public.groups cascade;
