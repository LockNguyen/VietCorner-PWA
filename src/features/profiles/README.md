# profiles

What a person is called. A foundation: chat, prayer and the groups admin show people by name through it.

System docs: `.claude/architecture.md`. Shape and conventions: `docs/adding-a-feature.md`.

## Setup
Run `schema.sql` in Supabase → SQL Editor, before `features/prayer/schema.sql` (the prayer feed reads names).
Copy it from the editor, not from terminal output. It is **not** safe to run twice (plain `create`).

## Files
| Layer | File | Job |
|---|---|---|
| Data | `schema.sql` | `profiles(user_id, name, named_at)`, the trigger that makes a row per account, grants, RLS, DROPs |
| Types | `types.ts` | `Profile` (my own), `Names` (others', by user id), `MAX_NAME_LENGTH` |
| Text | `strings.ts` | The question, the field's label, the buttons |
| Browser API | `api.ts` | `saveName` (my own row), `getNames(userIds)` |
| Server reads | `server/queries.ts` | `getMyProfile(supabase, userId)`, `getNames(supabase, userIds)` |
| State | `hooks/useNames.ts` | The names on a screen that keeps receiving people (a chat): fetches whoever is new, once |
| UI | `components/NameStep.tsx` | The question, shown by the layout in place of every screen until answered |
| UI | `components/NameSection.tsx` | The Settings block that corrects a name |
| UI | `components/NameForm.tsx` | The field and its button, used by both |
| Shell | `src/app/layout.tsx`, `src/app/settings/page.tsx` | Lines marked `PROFILES` |

## Decisions worth knowing
- **Any signed-in user reads every name** (decided 2026-10-08). Nobody signed out reads any.
- **Every account has a row from the moment it exists**, made by a database trigger and named after the part
  of the email before the @. So no screen meets a person without a name and no code needs a fallback.
  `named_at` is null until the person answers; that is what makes the app ask.
- **The question is asked by the layout, not by a route.** It replaces whatever page was requested, so there
  is no redirect to get wrong and no address that skips it. The tab bar is hidden meanwhile.
- **Names are looked up, never copied.** A message stores who sent it; the name is read from here when it is
  shown, so correcting a name corrects it everywhere, on old messages too.
- **Features ask for names by id.** The page loads them with `getNames` and passes them down; a screen that
  receives new people while open (chat) uses `useNames`. The prayer feed gets its names inside its view.
- **No form of address, no greeting, no picture yet.** Only a name. Everyone has the same default `Avatar`.
- **Names are not unique and not checked**, beyond 1 to 60 characters. Two members may share one.

## Expected behavior
- The first screen after the first sign-in is "What is your name?" with one field; no tabs, no top bar.
  Continue is disabled while the field is empty. After it, the app opens where it was heading.
- Someone who signed up before this existed is asked once, at their next visit.
- Until a person answers, others see the part of their email before the @.
- Settings → Name shows the name with Save, disabled until it is changed.
- Chat, prayer requests, the chat notification and "Waiting to join" show names, not emails.
- **Not yet seen on screen (2026-10-08): everything above. `schema.sql` must be run first.**

## Edge cases
- Before `schema.sql` is run the profile cannot be read: nobody is asked, Settings has no Name block, and
  names are blank. The prayer list is empty until its view is recreated.
- A chat message from someone new shows without a name for the moment the lookup takes.
- The email kept on each message, request and join request (`sender_email`, `author_email`, `user_email`) is
  no longer shown anywhere. It stays as a record; dropping those columns is backlog B34.

## Remove
This is a foundation: chat, prayer and the groups admin stop showing who wrote what. Delete this folder and
the lines marked `PROFILES`; show `sender_email` and `user_email` again; recreate `prayer_feed` with
`author_email`; run the DROP statements at the bottom of `schema.sql`.
