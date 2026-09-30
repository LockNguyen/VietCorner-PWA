// Stops the turn from ending quietly when code changed but the written record did not.
//
// Docs drift is this project's oldest recurring failure: the code moves, architecture.md does not, and the
// next session works from a description that is no longer true. This hook makes that impossible to miss.
//
// It blocks once (exit 2, stderr goes back to Claude). `stop_hook_active` prevents a loop: on the second
// pass it lets the turn end, so a deliberate "not now" is still possible.

import { execSync } from "node:child_process";

const input = JSON.parse(await new Response(process.stdin).text());
if (input.stop_hook_active) process.exit(0); // already warned once this turn

const changed = execSync("git status --porcelain", { encoding: "utf8" })
  .split("\n")
  .map((line) => line.slice(3).trim())
  .filter(Boolean);

const codeChanged = changed.some(
  (file) => file.startsWith("src/") || (file.startsWith("services/ai/") && file.endsWith(".py")),
);
// Only the written record counts. Editing .claude/settings.json or a hook is not documenting a change.
const RECORD = [".claude/architecture.md", ".claude/active_context.md", ".claude/backlog.md"];
const docsChanged = changed.some(
  (file) => RECORD.includes(file) || file.endsWith("README.md") || file.startsWith("docs/"),
);

if (codeChanged && !docsChanged) {
  const files = changed.filter((file) => file.startsWith("src/") || file.startsWith("services/ai/")).slice(0, 8);
  console.error(
    `Code changed with no update to the written record:\n  ${files.join("\n  ")}\n\n` +
      "Update what applies (feature README, .claude/architecture.md, active_context.md, backlog.md), " +
      "or say why none of them needs it.",
  );
  process.exit(2);
}

process.exit(0);
