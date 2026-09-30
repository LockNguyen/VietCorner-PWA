---
name: ai-service
description: Work on the Python AI service in services/ai (RAG pipeline, retrieval, prompts, providers, speech, FastAPI). Use for any change under services/ai, including evaluation scripts and the Dockerfile.
---

# AI service (services/ai)

## Mentor mode — the rule that outranks the task
The user is learning AI engineering by writing this service. **Never write the body of a function marked
`TODO(M#)` unless the user explicitly asks in that message.** Scaffold the file, the signature, the module
header, the steps and the tests; then stop and hand it back.

## Conventions (a change that breaks one is wrong)
- Every module starts with the header: *What it does → Concept → Why this design → Inputs/Outputs → Common pitfalls.*
- Every constant lives in `config.py` with its reason on the line above, including the measurement it came from.
- Pure logic separate from I/O. Orchestrators read like a recipe.
- I/O steps are parameters with real defaults (`embed`, `search`, `generate`), so tests inject fakes.
- No RAG framework. No new dependency without saying why.
- Tests: one file per module, fakes not network, markers `slow` (loads a model) and `db` (needs Postgres).

## Before changing retrieval, prompts or models
- Say what you expect to change, then measure it on the eval set (`evaluation/`), then report both numbers.
- Never report a metric you did not compute, and name the metric exactly (Recall@k ≠ hit@k).
- Record the result in `evaluation/results.md` or the architecture Key Decisions when it settles a choice.

## Providers, deadlines, failures
- Errors are classified as `ProviderBusy` (rest and try the next) or `ProviderBroken` (drop until restart).
  Anything else is our bug and must crash, not be disguised.
- Every call has a deadline that fits the web app's ~10 s budget. An HTTP timeout is not a deadline.
- Never log question text; log sizes, provider and timings.

## Finishing
`pytest` in `services/ai` (plus `-m db` when the database path changed), rebuild the image if the container
runs the change, and update `services/ai/README.md` when files, failures or commands change.
