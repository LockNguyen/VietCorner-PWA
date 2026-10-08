---
name: add-feature
description: Build a NEW feature in src/features/<name>/ (prayer requests, event schedule, account settings, i18n, ...). Use when asked to add a feature, a new screen, or a capability the app does not have yet.
---

# Add a feature

`docs/adding-a-feature.md` is the recipe. This skill is the order of work and the rules that get skipped.

## 1. Ask before building
Ask the user any of these that the request does not answer, in one round, then build:
- Who may read each row, and who may write it?
- Does it need a table, or does it reuse an existing one?
- Does it notify anyone (push reuses chat's fan-out), or is it in-app only?
- Is the content bilingual (stored `{en, vi}`) or English-only?
- Who can create, edit and delete — the author, a leader, anyone?

If the user has already decided something, do not re-open it.

## 2. Order of work
1. `schema.sql` + RLS policies → use the **database-change** skill.
2. `types.ts` → `server/queries.ts` and `server/<action>.ts` → `api.ts` → `hooks/` → `components/` → `strings.ts`.
   Components follow the **frontend** skill.
3. `src/app/<name>/page.tsx`, any `src/app/api/<name>/<action>/route.ts`, the `TABS` line in `TabBar.tsx`.
4. `README.md` from the template of an existing feature (Purpose · Setup · Files · Decisions · Expected behavior · Edge cases · Remove).
5. Tests: Vitest for pure logic, a case in `tests/rls.test.ts` for every new table.
6. Finish with the **verify-and-finish** skill.

## 3. Rules that fail the work if broken
- No imports between features. Composition happens in `src/app/**`.
- `@/lib/supabase/*` only in `api.ts`, `server/*`, `src/app/**`. Never in a component or hook.
- `server/*` imports nothing from Next.js and takes the Supabase client as an argument.
- `route.ts`: parse → verify user → call one `server/*` function → return JSON. Nothing else.
- Every user-facing string in `strings.ts`.
- Removable by deleting the folder plus lines marked `// <FEATURE>` elsewhere.
- One job per file. A file over ~150 lines is a sign the job is not one job.

## 4. Do not
- Create empty files to match the shape. Skip what the feature does not need.
- Generalize a component for a future caller. Duplicate until a second caller exists (`src/components/ui/` is for the UI revamp, backlog B18).
- Add a dependency without saying why in the same message.
