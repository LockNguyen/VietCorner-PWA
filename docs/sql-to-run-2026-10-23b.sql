-- Prayer translations, second change (2026-10-23). Safe to run again. Supabase → SQL Editor, the Viet Corners project.
-- Copy from this file in the editor, not from a terminal. Run it BEFORE deploying: the app now sends the request's
-- language with every approval, and the old function does not take it (Approve would say "Could not save").
-- Then `npm run test:rls`. (docs/sql-to-run-2026-10-23.sql already holds this too, for a database that has not run it.)

-- prayer/schema.sql 5d, the review function
-- Approve a translation as it is, or as the reviewer corrected it: Approve and Edit both send the text they show,
-- and the language the request is written in, which the edit screen lets the reviewer set: when the AI service could
-- not translate a request its language is unknown, and a translation with no language is shown to nobody (found
-- 2026-10-23). `original` is the request's text the reviewer read. If the author edited it meanwhile, nothing
-- changes and the answer is false: a translation of the old words must not be approved for the new ones.
drop function if exists public.review_prayer_translation (uuid, text, text); -- the first version, without the language
create or replace function public.review_prayer_translation(request_id uuid, original text, translation text, language text)
returns boolean
language sql security definer set search_path = '' as $$
  with reviewed as (
    update public.prayer_requests r
    set translation = review_prayer_translation.translation,
        language = review_prayer_translation.language,
        translation_reviewed_at = now()
    where r.id = request_id
      and r.body = original
      and r.deleted_at is null
      and (select public.has_permission('prayer.translations'))
    returning 1
  )
  select exists (select 1 from reviewed);
$$;
revoke execute on function public.review_prayer_translation (uuid, text, text, text) from public, anon;
grant execute on function public.review_prayer_translation (uuid, text, text, text) to authenticated;
