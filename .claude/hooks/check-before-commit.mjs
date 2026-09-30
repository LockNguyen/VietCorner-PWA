// Blocks `git commit` when the build or the tests fail.
//
// Why a hook and not an instruction: instructions are advice, hooks run whether or not anyone remembers.
// Exit 2 is what Claude Code treats as "blocked"; stderr is handed back so the failure can be fixed.
//
// Cost: a few seconds per commit. Only what the commit actually touches is checked.

import { execSync, spawnSync } from "node:child_process";

const input = JSON.parse(await new Response(process.stdin).text());
const command = input.tool_input?.command ?? "";

// Only guard real commits. `git commit --help`, `git log`, and every other command pass straight through.
if (!/\bgit\s+commit\b/.test(command) || /--(help|dry-run)\b/.test(command)) process.exit(0);

const staged = execSync("git diff --cached --name-only", { encoding: "utf8" }).split("\n").filter(Boolean);
if (staged.length === 0) process.exit(0); // nothing staged: let git report that itself

const checks = [];
if (staged.some((file) => file.startsWith("src/") || file.startsWith("tests/") || file === "package.json")) {
  checks.push({ name: "npm run build", command: "npm", args: ["run", "build"] });
  checks.push({ name: "npm test", command: "npm", args: ["test"] });
}
if (staged.some((file) => file.startsWith("services/ai/") && file.endsWith(".py"))) {
  checks.push({ name: "pytest (services/ai)", command: "services/ai/.venv/Scripts/python", args: ["-m", "pytest", "-q"], cwd: "services/ai" });
}

for (const check of checks) {
  const result = spawnSync(check.command, check.args, { cwd: check.cwd, encoding: "utf8", shell: true });
  if (result.status !== 0) {
    const output = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim().split("\n").slice(-25).join("\n");
    console.error(`Commit blocked: ${check.name} failed.\n\n${output}\n\nFix it, or ask the user before committing anyway.`);
    process.exit(2);
  }
}

process.exit(0);
