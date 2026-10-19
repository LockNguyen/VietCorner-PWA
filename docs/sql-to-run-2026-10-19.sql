-- Launch-day feedback (2026-10-19). Safe to run again, top to bottom, in one go.
-- Supabase → SQL Editor, the Viet Corners project. Copy from this file in the editor, not from a terminal.
-- Order matters: the picture column (profiles) before the view and the function that read it.

-- auth/schema.sql, sections 1-2: every sign-in link of the day works (replaces login_handoffs)
-- 1. Table ----------------------------------------------------------------
-- Replaced `login_handoffs` on 2026-10-19 so that an older email's link still works the same day (the
-- user: members ask twice, and the mail app hides one of the two). Running this file drops the old table;
-- a sign-in waiting at that moment is asked for again.

create table if not exists public.sign_in_links (
  -- SHA-256 of the key our server put in this one email, and nowhere else. A tap on the link presents the
  -- key: the proof that whoever tapped can read that mailbox.
  key_hash text primary key check (key_hash ~ '^[0-9a-f]{64}$'),
  -- SHA-256 of the asking device's secret key. Every link a device asks for in one church day carries the
  -- same one, so whichever is tapped, that device collects it. The key itself never leaves the device.
  attempt text not null check (attempt ~ '^[0-9a-f]{64}$'),
  -- Whom the link signs in. Read only by our server, when the device collects.
  email text not null check (char_length(email) between 3 and 320),
  -- The end of the church day the email was sent on: "a link from today" (the user, 2026-10-19).
  expires_at timestamptz not null,
  -- When the link's button was tapped. Null until then: opening the link alone changes nothing.
  approved_at timestamptz
);

create index if not exists sign_in_links_attempt on public.sign_in_links (attempt);

drop table if exists public.login_handoffs;

-- 2. Server-only ----------------------------------------------------------
-- RLS on, no grants, no policies: unreachable with the public key, signed in or not.

revoke all on public.sign_in_links from anon, authenticated;
grant all on public.sign_in_links to service_role;
alter table public.sign_in_links enable row level security;

-- profiles/schema.sql, section 6: a picture of yourself
-- 6. A picture of yourself (2026-10-19) -----------------------------------
-- This section can be run again by itself. Run it before the sections that show the picture:
-- features/prayer/schema.sql 5b and features/people/schema.sql 3.
-- The file lives in Storage, in a folder named after its owner's id; the profile keeps its path. A new
-- picture is a new file with a new name, so a phone that kept the old one never shows it in place of the new.
alter table public.profiles add column if not exists avatar_path text check (char_length(avatar_path) <= 200);

-- A PUBLIC bucket, as the events' pictures are: a face beside a name on every prayer request, and a public
-- address lets the phone keep it instead of asking for a signed one per person on every screen. Anyone holding
-- a file's address can open it; the address is not guessable (two random ids). JPEG only, 200 KB at most:
-- Storage enforces both, whatever a browser sends.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 204800, array['image/jpeg'])
on conflict (id) do update
set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- Each person puts files in, lists and takes out only their own folder. Reading through the public address
-- needs no policy.
drop policy if exists "People manage their own picture" on storage.objects;
create policy "People manage their own picture" on storage.objects
  for all to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Points my profile at a file in my own folder, or at none (null). A function, as for the name (section 5):
-- the table has no update grant. Nobody needs to approve a picture (the user, 2026-10-19).
create or replace function public.set_my_avatar(path text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if path is not null and split_part(path, '/', 1) <> auth.uid()::text then
    raise exception 'Not your picture';
  end if;
  update public.profiles set avatar_path = path where user_id = auth.uid();
end;
$$;

revoke execute on function public.set_my_avatar (text) from public, anon;
grant execute on function public.set_my_avatar (text) to authenticated;

-- prayer/schema.sql, section 5b: the author's picture in the feed
-- 5b. The author sees how many prayed (2026-10-14), and their picture (2026-10-19) ----
-- This section can be run again by itself. The same view as section 4 with columns added at the end
-- (`create or replace view` allows that): the count, for the request's author only. Everyone else gets null,
-- so nobody can compare requests by how many prayed for them. Then the author's picture, null when the
-- request is anonymous, exactly as the name. Needs features/profiles/schema.sql section 6 first.
create or replace view public.prayer_feed with (security_invoker = false) as
select
  r.id,
  r.body,
  r.is_anonymous,
  r.created_at,
  r.author_id = auth.uid() as is_mine,
  case when r.is_anonymous then null else p.name end as author_name,
  case when r.author_id = auth.uid() then r.prayer_count end as prayer_count,
  case when r.is_anonymous then null else p.avatar_path end as author_avatar
from public.prayer_requests r
join public.profiles p on p.user_id = r.author_id
where r.deleted_at is null
  and r.answered_at is null
  and (select public.has_permission('app.use'));

-- people/schema.sql, section 3: the picture in the Admin people list
-- 3. Everyone, in one trip --------------------------------------------------------
-- Each account with its name, email, roles and active groups. It runs as its owner (it reads auth.users
-- and every membership), so it checks the caller itself.
drop function if exists public.people_list ();
create function public.people_list()
returns table (user_id uuid, name text, email text, signed_up_at timestamptz, roles text[], group_ids uuid[], avatar_path text)
language sql stable security definer set search_path = '' as $$
  select
    u.id,
    coalesce(p.name, split_part(u.email, '@', 1)),
    u.email,
    u.created_at,
    coalesce((select array_agg(r.role order by r.role) from public.user_roles r where r.user_id = u.id), '{}'),
    coalesce((select array_agg(m.group_id)
              from public.group_members m
              join public.groups g on g.id = m.group_id and g.deleted_at is null
              where m.user_id = u.id), '{}'),
    p.avatar_path -- their picture (2026-10-19; needs features/profiles/schema.sql section 6 first)
  from auth.users u
  left join public.profiles p on p.user_id = u.id
  where (select public.has_permission('users.manage'))
  order by lower(coalesce(p.name, u.email));
$$;
revoke execute on function public.people_list () from public, anon;
grant execute on function public.people_list () to authenticated;
