---
name: verify-and-finish
description: Finish a task properly - verify it works with evidence, update the docs and backlog, then commit. Use before saying a change is done, and whenever asked to commit or wrap up.
---

# Verify and finish

## 1. Verify by running it
| Changed | Run |
|---|---|
| Anything in `src/` | `npm run build` (it type-checks) |
| Pure web logic | `npm test` |
| A table, grant or policy | `npm run test:rls` |
| `services/ai` | `pytest` in `services/ai` |
| A page, route or UI | Open it: preview server, real request, real click |

Rules:
- Report the numbers you saw, not what you expect.
- Say explicitly what you did **not** verify (real phone, real microphone, another browser).
- If a test or check fails, say so with the output. Never describe failing work as done.
- Never claim something is tested that you did not run.

## 2. Update the written record
- Feature `README.md` — files, expected behavior, edge cases, removal steps.
- `.claude/architecture.md` — the feature paragraph, §7 tables, §8 env vars, a Key Decisions row for anything
  non-obvious, and one line in the change log.
- `.claude/active_context.md` — checklist, what was measured, the next 3 micro-steps.
- `.claude/backlog.md` — anything deliberately left undone, in the Why → What → Trade-offs → Done when format.
  Deferred work that is not written down is lost work.

## 3. Commit
- Branch off `main` for anything larger than a one-line fix; never commit straight to `main` unless asked.
- Message: what changed and **why**, the evidence (tests run, what was measured), and what stays open.
- Commit only files this task touched. Leave unrelated working-tree changes alone.
- Never `git push` unless the user asked.

## 4. Report back
State in this order: what works (with evidence), what is not verified, what you decided that the user may
want to change, and what is next.
