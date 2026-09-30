---
name: debug
description: Diagnose a bug, a failing test, or behavior that does not match expectations. Use when something is broken, flaky, or "not working" - before changing any code.
---

# Debug

## 1. Reproduce before touching code
- Run the failing thing yourself and capture the actual output, status code, or log line.
- If you cannot reproduce it, say so and ask for the exact steps, screen, device and time.
- A fix written before a reproduction is a guess. Two guesses in a row means stop guessing and instrument.

## 2. Instrument, then read
- Add a temporary log or a one-off script that prints the real values at the boundary (what was sent, what
  came back, what the state held). Remove it before committing.
- Check the layer boundaries in order: browser → route → server function → database or AI service. The log
  line that proves which side is wrong is worth more than reading three files.
- Trust measurements over reasoning about what the code "should" do.

## 3. Fix the cause
- Name the cause in one sentence before editing. If you cannot, keep instrumenting.
- Fix it in the layer that owns it, not where the symptom appeared.
- Add the test that fails without the fix — pure logic in Vitest or pytest, a policy in `tests/rls.test.ts`.
- If the same class of bug can exist elsewhere in the codebase, say where; fix it only if asked.

## 4. Report
State: what broke, the evidence that proves the cause, the fix, the test that now covers it, and anything
still unexplained. If the bug came from earlier work of yours, say so plainly and move on.
