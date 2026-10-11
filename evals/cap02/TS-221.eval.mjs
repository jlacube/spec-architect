// C001-TC-221 — verifies C001-TS-221 (C001-AC-219.1, C001-REQ-219): visible phase plan, with the task
// tools enabled (CLAUDE_CODE_ENABLE_TODO_TOOLS=1). Needs the
// phase-spec skill (C001-T-032) for the procedure steps the todo list must contain; run it once that
// skill exists. The scripted answers follow the recommended options; specialists are allowed so the
// conductor can make progress and mark steps completed.
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { checker, toolCalls } from "../harness/assert.mjs";
import { ROOT } from "../harness/fixtures.mjs";
import { edit, git, sdd } from "../harness/workspaces.mjs";

const SKILL = join(ROOT, "plugins", "architect", "skills", "phase-spec", "SKILL.md");

/** Step titles of the phase-spec procedure: the numbered `## Step n — <title>` headings. */
function steps() {
  if (!existsSync(SKILL)) return [];
  return [...readFileSync(SKILL, "utf8").matchAll(/^#{2,3}\s+Step\s+\d+\s*[—–-]\s*(.+)$/gm)].map((m) => m[1].trim());
}

export default {
  id: "TS-221",
  title: "Visible phase plan",
  agent: "architect:sdd-conductor",
  fixture: (root) => {
    git(root, "init", "-q");
    sdd(root, "init");
    sdd(root, "change", "new", "Card payments", "--profile", "lite");
    // Ideation approved (lite), so the spec phase may start.
    edit(root, ".sdd/001-card-payments/change.md", (t) => t.replace(/^( {2}00-ideation: \{ status: )not-started/m, "$1approved").replace(/^phase: 00-ideation$/m, "phase: 10-spec"));
    sdd(root, "status", "--write");
  },
  env: { CLAUDE_CODE_ENABLE_TODO_TOOLS: "1" },
  allowTools: ["Agent", "Write", "Edit", "Bash"],
  maxTurns: 40,
  maxBudgetUsd: 0.5,
  prompt: "Start the spec phase of CHG-001.",
  assert({ transcript }) {
    const { failures, check } = checker();
    const expected = steps();
    check(expected.length > 0, "phase-spec skill has no numbered steps (C001-T-032 not done yet)");
    const created = toolCalls(transcript, "TaskCreate").map((c) => String(c.input?.subject ?? c.input?.title ?? c.input?.description ?? ""));
    const covered = expected.filter((s) => created.some((c) => c.toLowerCase().includes(s.toLowerCase().slice(0, 20))));
    check(covered.length >= Math.ceil(expected.length * 0.8), `TaskCreate subjects cover ${covered.length}/${expected.length} phase-spec steps`);
    check(toolCalls(transcript, "TaskUpdate").some((c) => c.input?.status === "completed"), "no TaskUpdate marks a step completed");
    return failures;
  },
};
