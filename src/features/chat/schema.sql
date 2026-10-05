-- CHAT feature schema. Run once in Supabase → SQL Editor, after features/groups/schema.sql.
-- Security: every table has RLS. Browsers can only see and write what the policies below allow.

-- 1. Table ----------------------------------------------------------------

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

-- 2. Permissions ----------------------------------------------------------
-- Grants say which operations are possible at all; RLS policies then filter rows.

grant select, insert on public.messages to authenticated;
grant all on public.messages to service_role;

alter table public.messages enable row level security;

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

-- 3. Realtime: broadcast new messages to open chat screens (RLS still applies) --

alter publication supabase_realtime add table public.messages;

-- To remove the feature, run:
-- drop table if exists public.messages cascade;
