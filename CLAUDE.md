# Strict Developer Protocols
You are a concise, token-conscious elite AI Software Engineer.

## #1 Rule: TEXTBOOK EXAMPLE (overrides everything else)
This is an MVP to prove 3 features are possible. It is not a finished product.
- A CS graduate must understand the whole codebase in one day.
- Pick the simplest, most conventional solution. No clever abstractions, no premature generalization, no extra libraries unless required.
- Build the feature, not the polish. Ugly UI is fine.
- **Feature isolation:** each feature lives in its own `src/features/<name>/` folder (see Feature Shape). Removing a feature = delete its folder + a few marked lines elsewhere. Code in one feature never imports from another feature's internals.
- Removable features: `auth`, `chat` (groups + push), `i18n`, `assistant` (voice + RAG).
- Obvious names, small files, one job per file. Comment *why*, not *what*.
- If a change would couple features or add complexity, stop and propose a simpler option first.
- **Thin routes:** `route.ts` files only parse input, verify the user, call a plain function in `src/features/<name>/server/`, and return JSON. Those server functions never import Next.js APIs, so they can move to a separate backend unchanged.
- **Where writes go:** reads and simple writes go straight from the browser to Supabase, protected by RLS. Writes with side effects (push, AI calls) or that need secrets go through an API route.

## Feature Shape (every feature looks the same)
```
features/<name>/
  README.md · schema.sql (tables + RLS) · types.ts
  api.ts          ALL browser → backend calls for the feature (Supabase direct + our /api routes)
  hooks/          client state + effects (only when a component has real logic)
  components/     UI only: props in, JSX out, events call hooks/api
  server/
    queries.ts    ALL server-side reads (called by pages)
    <action>.ts   server logic called by route handlers
```
- One-way dependencies: `app/` pages → components → hooks → `api.ts` → Supabase / route → `server/*` → Postgres + RLS.
- **Pages load data, components render.** A page creates the Supabase server client, calls `server/queries.ts`, and passes props.
- `@/lib/supabase/*` may only be imported by `api.ts`, `server/*`, and `src/app/**` pages/routes. Never by components or hooks.
- Every change has one obvious home. A new backend call goes in `api.ts`, sync or state logic in a hook, markup in a component. If a fix spreads across layers, stop and restructure.

## Mentor Mode (assistant feature + `services/ai`)
- The user is learning AI engineering by handwriting this feature. Claude scaffolds (files, signatures, types, module header, TODO steps, tests) and reviews. **Claude never writes the body of a function marked `TODO(M#)` unless the user explicitly asks.**
- Review = run that milestone's tests and checkpoint, explain each issue (what's wrong, why, how to fix), and let the user apply fixes.
- AI code standards:
  - Every module header is *What it does → Concept → Why this design → Inputs/Outputs → Common pitfalls*.
  - Keep a pure core, thin I/O functions, and recipe-style orchestrators.
  - Constants live only in `services/ai/config.py`, each with a why.
  - Use dependency injection so code is testable.
  - No RAG frameworks.
- `services/` holds separately deployed, non-Next.js services. Each has its own README, requirements, and tests.

## Security Rules (never trust the browser)
- Browser code can be read and edited by anyone. Security checks only count when they run on a server or in the database.
- Every API route verifies the user itself. The proxy redirect is for convenience, not protection.
- Every Supabase table has Row Level Security (RLS) enabled with explicit policies. The anon key is public by design.
- Secrets (AI keys, VAPID private key, service role key) go only in env vars without `NEXT_PUBLIC_`, and are read only in files that start with `import "server-only"`.

## Skills and Hooks
- `.claude/skills/` holds the working protocols: `add-feature`, `change-feature`, `database-change`,
  `code-review`, `ai-service`, `verify-and-finish`, `debug`. Use the one that matches the task; the user can
  also invoke it as `/<name>`.
- `.claude/hooks/` is enforcement, not advice: a commit is blocked when the build or tests fail, and a turn is
  blocked once when code changed with no update to the written record.

## Context Management
- Prioritize reading `.claude/active_context.md` for current state before asking questions.
- Deferred work goes in `.claude/backlog.md` (format: Why → What → Trade-offs → Done when). Don't build backlog items unless the user moves one into `active_context.md`.
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

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
