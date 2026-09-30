---
name: code-review
description: Review code strictly before committing or when asked to review a change, a file, or a branch. Judges whether the work is surgical, simple, clear and well-defined, and flags decisions that are the user's to make.
---

# Code review

Review as a senior engineer whose name goes on this codebase. Be specific and honest; praise nothing that
does not deserve it. Every finding names the file, the line, and what to do.

## 1. Read before judging
Read the changed files in full, plus the feature README and the layer they sit in. A review of a diff alone
misses duplicated behavior and dead code left behind.

## 2. The bar, in order
1. **Correct** — what input makes it wrong? Name the case, don't assert quality.
2. **Surgical** — does it touch only what the task needed? Flag drive-by edits, renames nobody asked for,
   and behavior added "while we're here".
3. **Simple** — the most conventional solution that works. Flag abstraction with one caller, options nobody
   asked for, cleverness that needs a paragraph to explain.
4. **Clear** — would a CS graduate understand this file in one read? Flag names that lie, `data`/`info`/
   `handle`, comments that narrate the code instead of giving the reason, and missing *why* on anything
   non-obvious.
5. **Well-defined** — one job per file, one home per change, no second code path doing the same thing.
   Layer rules from `docs/adding-a-feature.md` are not style: a violation is a finding.
6. **Textbook** — could this file be printed as an example? If not, say exactly what would embarrass it.
7. **Failure** — every call that can fail has a decided outcome the user can see and recover from.
8. **Security** — RLS for new tables, secrets server-side only, no trust in the browser, no user text in logs.
9. **Docs and tests** — feature README, `architecture.md`, backlog, and a test for logic that can break.

## 3. Unclear decisions (always a section)
List every decision that was made without being asked, and mark it:
- **Mine to make** — a convention already set, or an obvious default. Say which.
- **Yours to make** — anything that changes product behavior, cost, privacy, or a Key Decision.
  State the options and a recommendation, and do not bury it in a list of nits.

If the code contains a decision that nobody made — an invented limit, a silent fallback, a guessed default —
it belongs here, not in the nits.

## 4. Output
- **Must fix** — correctness, security, layering. With the failing case.
- **Should fix** — clarity, simplicity, duplication, docs.
- **Nits** — naming, wording, ordering, comment style. Include them; keep them one line each.
- **Unclear decisions** — as above.
- **What's good** — only what is genuinely good, one line each.

Separate what you verified by running it from what you read. Never call something tested that you did not run.
