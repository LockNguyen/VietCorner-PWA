# i18n

English and Vietnamese for every fixed label in the app, chosen per user and remembered.

System docs: `.claude/architecture.md`. Shape and conventions: `docs/adding-a-feature.md`.

## Setup
Run `schema.sql` in Supabase → SQL Editor (creates `user_settings` with owner-only RLS).

## What is translated where
| Kind of text | Lives in | Who writes it |
|---|---|---|
| Fixed UI labels (buttons, headings, errors) | `features/<name>/strings.ts` as `{ en, vi }` | A developer, in the same change that adds the screen |
| App shell (tabs, page titles) | `src/components/strings.ts` | A developer |
| Content an admin creates (events) | `_en` / `_vi` columns on that feature's table | The translator admin, through the admin page |
| Content a member writes (messages, prayer requests) | Not translated | The member |

## Files
| Layer | File | Job |
|---|---|---|
| Data | `schema.sql` | `user_settings(user_id, language)`, owner-only RLS |
| Types | `types.ts` | `Language`, `Text` ( `{ en, vi }` ), `LANGUAGES`, `DEFAULT_LANGUAGE`, `LOCALES` (date formats), `isLanguage` |
| Pure logic | `translate.ts` | `translate(text, language)`; falls back to the other language rather than showing nothing |
| Pure logic | `clock.ts` | `clockTime("19:00", language)`: "7:00 PM" / "7:00 Tối"; every time the app shows goes through it (Sáng before 11, Trưa to 13, Chiều to 18, Tối after); `withChurchSunday(text)`: "Chủ Nhật" → "Chúa Nhật". Tested |
| Text | `strings.ts` | This feature's own labels |
| Browser API | `api.ts` | `saveLanguage` (upsert, RLS allows only your own row) |
| Server reads | `server/queries.ts` | `getLanguage(supabase)` → the user's language or `null`; `getLanguagesOf(admin, userIds)` for text the server writes to others |
| State | `components/LanguageProvider.tsx` | Holds the language for the whole app; writes the device copy and the database; deletes the Home saved for the next launch (`lib/savedHome.ts`), which is in the old language |
| State | `hooks/useLanguage.ts` | `{ language, setLanguage, t }` for client components |
| UI | `components/LanguageToggle.tsx` | One row per language, each written in its own language (Settings) |
| UI | `components/LanguageLink.tsx` | The other language as one quiet link, at the top right (sign-in, the install guide) |
| UI | `components/AdoptDeviceLanguage.tsx` | Renders nothing: copies the pre-sign-in choice into a new account once |
| Shell | `src/app/layout.tsx` | Reads the language once per page load and wraps the app in the provider (`// I18N` lines) |

## Decisions worth knowing
- **Signed out, the device's choice is adopted on load** (`LanguageProvider`). The server only knows the
  default; without this an iPhone reloading the app on return from an email would switch English to Vietnamese.
- **Fixed labels live in code, not the database.** They change only when a developer changes a screen, so a
  table would add caching, fallbacks and a deploy-free edit path nobody needs. Admin-written *content* is
  different: that is data and gets `_en` / `_vi` columns.
- **The language is read on the server** in `layout.tsx`, so the first paint is already correct: no flash of
  English before Vietnamese.
- **The choice is made on the login screen**, before an account exists. It is kept on the device, and
  `AdoptDeviceLanguage` writes it to the account on the first signed-in page load. That keeps auth and i18n
  from importing each other.
- **Errors are stored as a cause, not a sentence.** A conversation saved in Vietnamese reads in English after
  a switch, because the message is rendered from `ERRORS[cause]` at display time.
- **Vietnamese is the default** for anyone who has never chosen: the congregation is Vietnamese.

## Expected behavior
- The login screen offers Tiếng Việt / English; tapping one changes the page immediately.
- After signing in, the choice follows the account to any device.
- Settings shows the same toggle; switching re-renders every label, including old error bubbles.
- A half-translated string shows the other language rather than an empty button.
- With the database unreachable, the app still renders in the default language.

## Remove
Delete this folder and `src/components/strings.ts`, remove the `// I18N` lines in `src/app/layout.tsx`,
`src/components/AppTabs.tsx` and the pages, convert each feature's `strings.ts` values back to plain strings,
and run `drop table public.user_settings;`.

## Why `AdoptDeviceLanguage` exists, and why here
The language is chosen on the login screen, before an account exists, so nothing can be written then. On the
first signed-in page load, if the account has no language yet, the device's choice becomes the account's.
It is not done in the auth feature because that would make auth import i18n: account creation stays unaware,
and this feature picks the choice up afterwards.

## Hard-coded text review (2026-10-14)
Every screen, banner, field hint, screen-reader label, picture description and notification was searched for
words not read from a `strings.ts`. Found and fixed: chat's notification fallback "New message" (now the app's
name) and the service worker's fallback "VietCorner" (now "Viet Corners", kept equal to `APP_NAME`).
Left as they are, on purpose:
- `/ui`, the component showcase: sample content to look at components, not a screen members use.
- API routes' `error` texts ("Not signed in", "groupId is required"): for developers; no screen shows them,
  each screen says its own translated sentence instead.
- The two language names, each written in its own language (`LANGUAGE_NAMES`), and the app's name (`APP_NAME`).
- Codes and keys (`"wrongPassword"`, storage keys, `vi-VN`): never shown.
- The sign-up and reset emails: their bilingual text lives in Supabase's email templates (auth README, Setup).
