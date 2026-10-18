// C002-TC-316 — verifies C002-TS-316 (C002-AC-311.1, C002-REQ-311; C002-T-037): on OpenCode, change 002 of
// fx-gate has 10-spec in review; the eval script gives the conductor's `question` call of gate G2 a
// result without a choice. The transcript then shows no `sdd gate approve` command, and
// `.sdd/002-*/approvals.json` and the questions log are unchanged. Scenario Outline rows:
//   TS-316-dismissed  the call dismissed (SDK `question.reject`; S-07 §5: tool error "The user dismissed
//                     this question")
//   TS-316-empty      an empty answer list (SDK `question.reply` with `answers: []`)
// OpenCode only: run by C002-T-056 through `run.mjs --host opencode`. `answer` returns the scripted
// result: `{ reject: true }` (dismiss the call) or `[]` (no label); the OpenCode runner of C002-T-044
// turns it into the SDK call.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { checker, toolCalls } from "../../harness/assert.mjs";
import { fxGate } from "../../harness/fixtures.mjs";

/** Host names of the command tool: native-permissions `bash`, sdd MCP server `sdd-shell_run_command`. */
const SHELL_TOOLS = new Set(["bash", "sdd-shell_run_command"]);

/** Text of the approvals file and of every questions log of change 002 (null when absent). */
function records(root) {
  const sdd = join(root, ".sdd");
  const dir = readdirSync(sdd).find((n) => n.startsWith("002-"));
  const out = {};
  for (const rel of ["approvals.json", "00-ideation/questions-log.md", "10-spec/questions-log.md"]) {
    const p = join(sdd, dir, ...rel.split("/"));
    out[rel] = existsSync(p) ? readFileSync(p, "utf8") : null;
  }
  return out;
}

function row(result, answer) {
  let before = null;
  return {
    id: `TS-316-${result}`,
    title: `No choice at gate G2 on OpenCode (${result}): no approval, nothing recorded (TS-316)`,
    host: "opencode",
    agent: "sdd-conductor",
    fixture: (root) => {
      fxGate(root);
      before = records(root);
    },
    allowTools: ["Write", "Edit", "Bash"],
    maxTurns: 20,
    maxBudgetUsd: 0.35,
    prompt: "/architect-gate 002",
    answer: () => answer,
    assert({ transcript, root }) {
      const { failures, check } = checker();
      const calls = toolCalls(transcript);
      check(calls.some((c) => c.name === "question" && c.agent === null), `TS-316 ${result}: no question call`);
      const approves = calls.filter((c) => SHELL_TOOLS.has(c.name) && /\bgate\s+approve\b/.test(String(c.input?.command ?? "")));
      check(approves.length === 0, `TS-316 ${result}: sdd gate approve ran: ${approves.map((c) => c.input.command).join(" | ")}`);
      const after = records(root);
      for (const [rel, text] of Object.entries(before ?? {})) check(after[rel] === text, `TS-316 ${result}: ${rel} changed`);
      return failures;
    },
  };
}

export default [row("dismissed", { reject: true }), row("empty", [])];
