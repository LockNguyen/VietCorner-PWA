-- AUTH feature schema. Run once in Supabase → SQL Editor. Safe to run again.
--
-- Accounts themselves are Supabase's (`auth.users`). This is the one table of our own: where a sign-in
-- waits between the browser that opened the email link and the app that asked for it (the README, "Hand-off").
--
-- Security in one sentence: no browser can read or write this table; only our server does, with the
-- service role, and a row is useless without the secret key that never left the asking device.

-- 1. Table ----------------------------------------------------------------

create table if not exists public.login_handoffs (
  -- SHA-256 of the asking device's secret key. It travels in the email link; the key itself never does,
  -- so reading this table, or the email, is not enough to collect the sign-in.
  attempt text primary key check (attempt ~ '^[0-9a-f]{64}$'),
  -- The one-time token from the email link, left here by the confirm page. It signs in whoever presents
  -- it, once, for as long as Supabase honours it (an hour); the row is deleted when it is collected.
  token_hash text not null check (length(token_hash) between 1 and 200),
  created_at timestamptz not null default now()
);

-- 2. Server-only ----------------------------------------------------------
-- RLS on, no grants, no policies: unreachable with the public key, signed in or not.

revoke all on public.login_handoffs from anon, authenticated;
grant all on public.login_handoffs to service_role;
alter table public.login_handoffs enable row level security;

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
-- drop table if exists public.login_handoffs;
