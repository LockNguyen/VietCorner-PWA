# admin

The admin page has no code of its own in this folder: `src/app/admin/page.tsx` lists one section per feature,
and who may see which section is the `permissions` feature. This file records the decisions made, so they
are not re-litigated later, and what is built so far.

**Built:** the admin-only tab and page; the Events section (create, edit, translate, cancel a date
with undo, cancel for good, each with a push); the Groups section (answer requests to join, create, rename, remove).
the Prayer reminders section (weekly, per group); event reminders in the Edit event panel; the scheduler.
**Next:** nothing planned. Prayer moderation is on hold (backlog B24).

## Decided
| Question | Decision |
|---|---|
| Who is an admin | Whoever holds the `admin` role. Roles are bundles of permissions carried in the login token (2026-10-06: option C, token claims; see the `permissions` README). Replaces the earlier `admins(user_id)` table. |
| What admins can do | Create, edit and cancel any event, configure reminders, create, rename and remove groups. Not prayer requests (see below). |
| Prayer requests | **Admins have no access for now** (2026-10-06, replaces the earlier "admins see every group's requests"). Groups are meant to be private; whether anyone outside a group may read or hide its requests waits on the pastor (backlog B24). Only a request's author, or a developer in the database, can remove one. |
| Where `/admin` lives | A sixth tab, shown only to admins (2026-10-06). Hiding the tab is convenience; the database is what keeps non-admins out. |
| Deleting content | **Soft delete** (`deleted_at timestamptz`), never a hard delete, so nothing is lost. **No confirmation and no "Removed" list for now** (2026-10-06): a removal is one tap, and undoing it is a developer's job in the database until a restore screen is wanted. |
| Removing a group | **Soft, never erased** (2026-10-06): `groups.deleted_at`. The group and everything in it disappear for members and stay in the database. No Reactivate button yet; a developer clears the mark. Reminders must skip removed groups when the scheduler is built. |
| Deleting a prayer request | The **author's** delete is permanent. `prayer_requests.deleted_at` exists for a soft removal and the `prayer_feed` view honours it, but no screen sets it (B24). |
| Audit trail | **None** (2026-10-06). `deleted_at` is enough; no `deleted_by`, no log. |
| Translations | Admins write event text in both languages on one form, **English and Vietnamese fields side by side**. Stored as one `event_texts` row per language (not `_en` / `_vi` columns: that note was out of date). Fixed UI labels stay in code. |
| Event cancellation | One date of a weekly event (with Undo), or the whole event for good, which is the app's delete: it leaves the admin list at once, members see it struck through for one more week, and it cannot be brought back from the app (2026-10-06). Everything happens in the "Edit event" panel. Members get a push each time, including for Undo. |
| Who gets event pushes | A group event: that group's members. A church-wide event: everyone with notifications on. Each in their own language. Every cancellation is its own notification, outside the one-minute pause (2026-10-06). |
| Reminders | **Events:** three fixed choices per event (1 day, 2 hours, 30 minutes before), under `events.manage`. **Prayer:** a weekly nudge per group with fixed wording, several per group, under `prayer.reminders`. Both are sent by one clock that runs every 15 minutes, so a reminder arrives up to 15 minutes late (2026-10-06). |
| Church timezone | **`America/New_York`** (Winston-Salem, NC; 2026-10-06). Reminder times and event dates are in this timezone. Closes the question in backlog B21; the code change is still to do. |
| Groups | Admins can create and rename groups (2026-10-06). |
| Joining a group | **Needs an admin's approval** (2026-10-06, built). "Ask to join" creates a request shown in the Groups section; Approve lets the person in and tells them, Decline removes the request silently. Admins get a push when someone asks. |
| Page shape | `src/app/admin/page.tsx` composes admin components that each feature provides (`features/events/components/EventAdmin.tsx`, `features/prayer/components/PrayerAdmin.tsx`). `features/admin/` owns only the page shell, so deleting a feature removes its admin section with it. |
| UI | Simple and clear over dense: large targets, one action per row. |

## Build order (pause for QA after each)
1. **Foundation and events:** who may do what, the admin-only page, create / edit / translate / cancel events with the cancellation push, create / rename groups.
2. ~~Prayer moderation~~ — on hold, backlog B24.
3. **Reminders:** built. Editors for event and prayer reminders, and the scheduler (a database cron job calling a protected route).

## Still to decide
Nothing open. (An admin's own Events tab shows every group's events: decided 2026-10-06.)

## When it is built
Follow `docs/adding-a-feature.md`. Every table another feature adds must already carry `deleted_at` for soft
delete.
