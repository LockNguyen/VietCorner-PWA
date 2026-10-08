---
name: change-feature
description: Change an EXISTING feature in src/features/ — fix behavior, add a field, adjust UI or flow. Use when modifying something the app already does, rather than adding a new feature.
---

# Change a feature

The change must be surgical: it touches the one file that owns the behavior, and leaves the rest alone.

## 1. Find the one home first
| The change is about | It belongs in |
|---|---|
| What the browser may ask the backend | `api.ts` |
| What a page reads on the server | `server/queries.ts` |
| A write with side effects or secrets | `server/<action>.ts` + its route |
| State, sync, retries, permissions flow | `hooks/*` |
| Markup, layout, wording | `components/*`, text in `strings.ts` (use the **frontend** skill) |
| Who is allowed | `schema.sql` (use the **database-change** skill) |

If the change needs edits in three or more layers, stop and say so before writing code: either the request
spans features, or the current split is wrong.

## 2. Rules
- Read the file and its feature README before editing. Match the surrounding style, comment density and naming.
- Keep the existing public shape (function names, props, return types) unless the task is to change it.
- Change behavior in one place. Do not add a second code path that does the same thing differently.
- Delete what the change makes dead: unused props, state, imports, comments, README lines.
- New user-facing text goes in `strings.ts`, never inline.
- Comment *why*, only where a reader would ask. Do not narrate what the code does.

## 3. Ask, don't guess
Ask the user when:
- The request has two reasonable readings and they lead to different files.
- The fix would change a decision recorded in `.claude/architecture.md` Key Decisions.
- The change would couple two features, or move data access out of its layer.

## 4. Finish
- Update the feature README if behavior, files, or the removal steps changed.
- Run the **verify-and-finish** skill. A change with no way to observe it is not done.
