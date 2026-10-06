# admin

The admin page has no code of its own in this folder: `src/app/admin/page.tsx` lists one section per feature,
and who may see which section is the `permissions` feature. This file records the decisions made, so they
are not re-litigated later, and what is built so far.

**Built:** the admin-only tab and page; the Events section (create, edit, translate, cancel with the push,
remove); the Groups section (create, rename, remove).
**Next:** prayer moderation, then reminders.

## Decided
| Question | Decision |
|---|---|
| Who is an admin | Whoever holds the `admin` role. Roles are bundles of permissions carried in the login token (2026-10-06: option C, token claims; see the `permissions` README). Replaces the earlier `admins(user_id)` table. |
| What admins can do | Remove any content, create and edit any event, hide any prayer request, configure reminders, create, rename and remove groups. |
| Anonymous prayer requests | **Admins do not see the author** (2026-10-06). They see what members see, across all groups, and can hide a request without learning who wrote it. Only developers with database access can look it up. |
| Where `/admin` lives | A sixth tab, shown only to admins (2026-10-06). Hiding the tab is convenience; the database is what keeps non-admins out. |
| Deleting content | **Soft delete** (`deleted_at timestamptz`), never a hard delete, so nothing is lost. **No confirmation and no "Removed" list for now** (2026-10-06): a removal is one tap, and undoing it is a developer's job in the database until a restore screen is wanted. |
| Removing a group | **Soft, never erased** (2026-10-06): `groups.deleted_at`. The group and everything in it disappear for members and stay in the database. No Reactivate button yet; a developer clears the mark. Reminders must skip removed groups when the scheduler is built. |
| Deleting a prayer request | The **author's** delete is permanent. An **admin's** is soft: set `prayer_requests.deleted_at`, and the `prayer_feed` view hides the row. |
| Editing a member's prayer | **No.** An admin can hide a request, never rewrite it (2026-10-06). |
| Telling the author | Removing a request does **not** notify its author (2026-10-06). |
| Audit trail | **None** (2026-10-06). `deleted_at` is enough; no `deleted_by`, no log. |
| Translations | Admins write event text in both languages on one form, **English and Vietnamese fields side by side**. Stored as one `event_texts` row per language (not `_en` / `_vi` columns: that note was out of date). Fixed UI labels stay in code. |
| Event cancellation | One occurrence, or a recurring event permanently. Members get a push. |
| Who gets event pushes | A group event: that group's members. A church-wide event: everyone with notifications on. Each in their own language. Each event is its own push topic, so the one-minute pause never swallows a cancellation (2026-10-06). |
| Prayer reminders | A scheduled push to a group. Set by admins only, several per group (`prayer_reminders(group_id, weekday, send_at)` exists; nothing sends it yet). |
| Church timezone | **`America/New_York`** (Winston-Salem, NC; 2026-10-06). Reminder times and event dates are in this timezone. Closes the question in backlog B21; the code change is still to do. |
| Groups | Admins can create and rename groups (2026-10-06). |
| Page shape | `src/app/admin/page.tsx` composes admin components that each feature provides (`features/events/components/EventAdmin.tsx`, `features/prayer/components/PrayerAdmin.tsx`). `features/admin/` owns only the page shell, so deleting a feature removes its admin section with it. |
| UI | Simple and clear over dense: large targets, one action per row. |

## Build order (pause for QA after each)
1. **Foundation and events:** who may do what, the admin-only page, create / edit / translate / cancel events with the cancellation push, create / rename groups.
2. **Prayer moderation:** every group's requests, hide.
3. **Reminders:** editors for event and prayer reminders, then the scheduler that sends them (a database cron job calling a protected route).

## Still to decide
Nothing open. (An admin's own Events tab shows every group's events: decided 2026-10-06.)

## When it is built
Follow `docs/adding-a-feature.md`. Every table another feature adds must already carry `deleted_at` for soft
delete.
