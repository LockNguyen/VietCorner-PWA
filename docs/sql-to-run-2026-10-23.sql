-- Prayer translations (2026-10-23). Safe to run again. Supabase → SQL Editor, the Viet Corners project.
-- Copy from this file in the editor, not from a terminal. Run it BEFORE deploying: the app reads the new
-- columns, and until they exist the Prayer tab shows no requests. Then `npm run test:rls`.

-- prayer/schema.sql 5d
-- 5d. Translations, shown after an admin's review (2026-10-23, the user) -------
-- This section can be run again by itself. Needs features/permissions/schema.sql first.
--
-- A request is written in Vietnamese or English and read by both. The server asks the AI service (its
-- POST /translate) for the request's language and a translation into the other one, and stores both here
-- with the service role. Free models translate imperfectly, so a translation reaches readers only once
-- someone with "prayer.translations" has approved or corrected it; until then everyone reads the original.
-- Only the text is ever sent to the AI service, never who wrote it.
alter table public.prayer_requests
  add column if not exists language text check (language in ('vi', 'en')), -- the original's; null until known
  add column if not exists translation text check (length(translation) between 1 and 2000),
  -- null: not yet approved, so not shown. The default fills only the rows that exist when the column is added:
  -- requests from before this section have no translation and never will, so they count as reviewed and show as
  -- written (as they always have) instead of filling the review list. New rows start at null (next line).
  add column if not exists translation_reviewed_at timestamptz default now();
alter table public.prayer_requests alter column translation_reviewed_at drop default;

-- An edited request needs a new translation. The database clears the old one itself, in the same update, so a
-- translation approved for the old words can never be shown under the new ones; the server then writes the
-- new one, which waits for review again.
create or replace function public.prayer_request_text_changed() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.language := null;
  new.translation := null;
  new.translation_reviewed_at := null;
  return new;
end;
$$;
drop trigger if exists clear_translation_on_edit on public.prayer_requests;
create trigger clear_translation_on_edit
  before update of body on public.prayer_requests
  for each row when (old.body is distinct from new.body)
  execute function public.prayer_request_text_changed();

-- Members get no grant on the three columns (section 2), so an author cannot write a translation or approve one.
-- Reviewers work through the two functions below, which check the permission themselves (they run as their
-- owner, past RLS), so the table stays closed to members as section 4 promises.
insert into public.role_permissions (role, permission) values ('admin', 'prayer.translations')
on conflict do nothing;

-- The review list: every request in the feed whose translation is not approved yet, oldest first. A request
-- whose translation failed is listed too, with none, for the reviewer to write. Answered and deleted ones drop off.
create or replace function public.prayer_translations_to_review()
returns table (id uuid, body text, language text, translation text, created_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select r.id, r.body, r.language, r.translation, r.created_at
  from public.prayer_requests r
  where r.translation_reviewed_at is null
    and r.deleted_at is null
    and r.answered_at is null
    and (select public.has_permission('prayer.translations'))
  order by r.created_at;
$$;
revoke execute on function public.prayer_translations_to_review () from public, anon;
grant execute on function public.prayer_translations_to_review () to authenticated;

-- Approve a translation as it is, or as the reviewer corrected it: Approve and Edit both send the text they show.
-- `original` is the request's text the reviewer read. If the author edited it meanwhile, nothing changes and the
-- answer is false: a translation of the old words must not be approved for the new ones.
create or replace function public.review_prayer_translation(request_id uuid, original text, translation text)
returns boolean
language sql security definer set search_path = '' as $$
  with reviewed as (
    update public.prayer_requests r
    set translation = review_prayer_translation.translation, translation_reviewed_at = now()
    where r.id = request_id
      and r.body = original
      and r.deleted_at is null
      and (select public.has_permission('prayer.translations'))
    returning 1
  )
  select exists (select 1 from reviewed);
$$;
revoke execute on function public.review_prayer_translation (uuid, text, text) from public, anon;
grant execute on function public.review_prayer_translation (uuid, text, text) to authenticated;

-- The feed: the same view as 5c with two columns added at the end, the original's language and its translation,
-- the translation only once approved. The app shows each reader the request in their language when it can.
create or replace view public.prayer_feed with (security_invoker = false) as
select
  r.id,
  r.body,
  r.is_anonymous,
  r.created_at,
  r.author_id = auth.uid() as is_mine,
  case when r.is_anonymous then null else p.name end as author_name,
  r.prayer_count,
  case when r.is_anonymous then null else p.avatar_path end as author_avatar,
  r.language,
  case when r.translation_reviewed_at is not null then r.translation end as translation
from public.prayer_requests r
join public.profiles p on p.user_id = r.author_id
where r.deleted_at is null
  and r.answered_at is null
  and (select public.has_permission('app.use'));

