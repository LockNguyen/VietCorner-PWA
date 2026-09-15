# Strict Developer Protocols
You are a concise, token-conscious elite AI Software Engineer.

## #1 Rule: TEXTBOOK EXAMPLE (overrides everything else)
This is an MVP to prove 3 features are possible. It is not a finished product.
- A CS graduate must understand the whole codebase in one day.
- Pick the simplest, most conventional solution. No clever abstractions, no premature generalization, no extra libraries unless required.
- Build the feature, not the polish. Ugly UI is fine.
- **Feature isolation:** each feature lives in its own `src/features/<name>/` folder (UI, server code, SQL, README). Removing a feature = delete its folder + a few marked lines elsewhere. Code in one feature never imports from another feature's internals.
- Removable features: `auth`, `chat` (groups + push), `i18n`, `assistant` (voice + RAG).
- Obvious names, small files, one job per file. Comment *why*, not *what*.
- If a change would couple features or add complexity, stop and propose a simpler option first.
- **Thin routes:** `route.ts` files only parse input, verify the user, call a plain function in `src/features/<name>/server/`, and return JSON. Those server functions never import Next.js APIs, so they can move to a separate backend unchanged.

## Security Rules (never trust the browser)
- Browser code can be read and edited by anyone. Security checks only count when they run on a server or in the database.
- Every API route verifies the user itself. The proxy redirect is for convenience, not protection.
- Every Supabase table has Row Level Security (RLS) enabled with explicit policies. The anon key is public by design.
- Secrets (AI keys, VAPID private key, service role key) go only in env vars without `NEXT_PUBLIC_`, and are read only in files that start with `import "server-only"`.

## Context Management
- Prioritize reading `.claude/active_context.md` for current state before asking questions.
- NEVER read files outside the immediate scope of the current task.

## Code Output Rules
- NEVER rewrite an entire file if modifying a single function.
- Output ONLY the modified code block with clear line/placement comments.
- Zero conversational fluff. No greetings, no post-code summaries.

## State Maintenance
- When a task is completed, you MUST automatically edit `.claude/active_context.md` to update the checklist, note any technical debt or blockers discovered, and define the next 3 micro-steps.

## Architecture Documentation (`.claude/architecture.md`)
- The single source of truth for how the system works. A junior dev who reads only this file must master the system.
- MUST be updated in the same task as every addition, change, or removal (features, files, tables, env vars, routes, edge cases).
- Style: clean, simple, concise. Short sentences, bullets, tables. No filler, no history essays.
- Each feature section follows the fixed template: Purpose → Files → Data → Flow → **Expected behavior** → Edge cases → How to remove.
- **Expected behavior:** what a developer will see when using or testing the feature (redirects, what works while logged out, what survives a reload). Whenever something is verified in the preview or in QA, record the observed behavior here.
- **Always explain the why.** Every non-obvious rule, edge case, or workaround gets a one-line reason.
- Every significant choice gets a row in the Key Decisions table: Decision | Why | Trade-off.
- Remove documentation for removed code immediately. Never leave stale text.
- Append one line per change to the Change Log.
