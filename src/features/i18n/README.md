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
| Types | `types.ts` | `Language`, `Text` ( `{ en, vi }` ), `DEFAULT_LANGUAGE`, `LOCALES` (date formats), `isLanguage` |
| Pure logic | `translate.ts` | `translate(text, language)`; falls back to the other language rather than showing nothing |
| Text | `strings.ts` | This feature's own labels |
| Browser API | `api.ts` | `saveLanguage` (upsert, RLS allows only your own row) |
| Server reads | `server/queries.ts` | `getLanguage(supabase)` → the user's language or `null` |
| State | `components/LanguageProvider.tsx` | Holds the language for the whole app; writes the device copy and the database |
| State | `hooks/useLanguage.ts` | `{ language, setLanguage, t }` for client components |
| UI | `components/LanguageToggle.tsx` | Two big buttons, each written in its own language |
| UI | `components/AdoptDeviceLanguage.tsx` | Renders nothing: copies the pre-sign-in choice into a new account once |
| Shell | `src/app/layout.tsx` | Reads the language once per page load and wraps the app in the provider (`// I18N` lines) |

## Decisions worth knowing
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
`src/components/TabBar.tsx` and the pages, convert each feature's `strings.ts` values back to plain strings,
and run `drop table public.user_settings;`.
