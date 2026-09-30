# admin (not built yet)

The admin dashboard is built **last**, after events and prayer requests exist, so it has something to manage.
This file records the decisions already made, so they are not re-litigated later.

## Decided
| Question | Decision (2026-09-29) |
|---|---|
| Who is an admin | An `admins(user_id)` table. Rows are added by hand in the Supabase dashboard. RLS policies check membership with `exists (select 1 from admins where user_id = auth.uid())`. |
| What admins can do | Remove any content, edit any event, delete any prayer request, and configure reminders. |
| Deleting content | **Soft delete** (`deleted_at timestamptz`), never a hard delete. Accidental removal must be reversible, and the dashboard can show what was removed. |
| Translations | Admins translate **content they create** (events) through the dashboard, via `_en` / `_vi` columns. Fixed UI labels stay in code (see the i18n README). |
| Prayer reminders | Configured by admins only, **per group** — different groups may have different reminders. Members cannot set them. |
| Event cancellation | Admins can cancel a single occurrence or a recurring event permanently. Members get a push notification (reuses chat's fan-out). |
| Page shape | `src/app/admin/page.tsx` composes admin components that each feature provides (`features/events/components/EventAdmin.tsx`, `features/prayer/components/PrayerAdmin.tsx`). `features/admin/` owns only the "is this user an admin" check and the page shell, so deleting a feature removes its admin section with it. |
| UI | Simple and clear over dense: large targets, one action per row, a confirmation before anything destructive. |

## Still to decide before building
- Does the tab bar show an Admin tab to admins only, or is `/admin` an unlisted URL?
- Does removing content notify its author?
- Can an admin edit a member's prayer request text, or only hide it?
- Is there an audit trail (who removed what, when), or is `deleted_at` enough?

## When it is built
Follow `docs/adding-a-feature.md`, and note that **every table another feature adds must already carry
`deleted_at`** for soft delete, plus an RLS policy letting admins see and update rows they do not own.
