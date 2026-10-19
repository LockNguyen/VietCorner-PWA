-- AUTH feature schema. Run once in Supabase → SQL Editor. Safe to run again.
--
-- Accounts themselves are Supabase's (`auth.users`). This is the one table of our own: every sign-in link
-- emailed today, until one of them is tapped and the app that asked collects it (the README, "Hand-off").
--
-- Security in one sentence: no browser can read or write this table; only our server does, with the
-- service role, and a row is useless without both the key in the email and the key on the asking device.

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

-- 3. Does an account exist? ------------------------------------------------
-- This section can be run again by itself.
-- Asked by the sign-in screen only after a failed sign-in, to say "no account yet, create one" instead of
-- "wrong password" (decided with the user 2026-10-14). Anyone may ask, signed in or not: that is the point.
-- Trade-off, accepted: anyone can learn whether an address has an account (sign-up already reveals it).
-- Answers a yes or no, nothing else. Rate limiting is backlog B3.

create or replace function public.account_exists(address text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from auth.users u where lower(u.email) = lower(btrim(address)));
$$;

revoke execute on function public.account_exists (text) from public;
grant execute on function public.account_exists (text) to anon, authenticated;

-- 4. Undo (removing the feature) ------------------------------------------
-- drop function if exists public.account_exists (text);
-- drop table if exists public.sign_in_links;
