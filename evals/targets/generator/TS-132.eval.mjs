// C002-TC-132 — verifies C002-TS-132 (C002-AC-118.1, C002-REQ-118; C002-T-027): on OpenCode the archive
// confirmation of the generated `/architect-archive` command goes through the host question tool, which
// the generator names in place of AskUserQuestion (commands/archive.md line 15; the integration side is
// C002-TC-131 in tests/integration/cap01/constructs.test.ts). An OpenCode session at the tested version
// with the OpenCode target package, on fx-gate in its "ready to archive" variant (change 002 passes
// `sdd archive 002 --dry-run`); the transcript must show one `question` call asking "Apply the archive
// of CHG-002?" with the options "Apply (Recommended)" and "Cancel", and no `sdd archive 002` without
// `--dry-run` before it is answered. The scripted answer is Cancel, so the run changes nothing.
// Run by C002-T-056 through `run.mjs --host opencode` (runner of C002-T-044); the `host` field selects
// it, and `prompt`, `agent`, `fixture`, `answer` and `assert` follow the existing case API
// (evals/harness/run.mjs). The fx-gate builder is C002-T-037's (evals/harness/fixtures.mjs).
import * as fixtures from "../../harness/fixtures.mjs";
import { checker, toolCalls } from "../../harness/assert.mjs";

const QUESTION = "Apply the archive of CHG-002?";
/** Host names of the command tool: native-permissions `bash`, sdd MCP server `sdd-shell_run_command`. */
const SHELL_TOOLS = new Set(["bash", "sdd-shell_run_command"]);

const commandOf = (c) => String(c.input?.command ?? "");
/** `sdd archive 002` without `--dry-run`: the apply step. */
const applies = (c) => SHELL_TOOLS.has(c.name) && /\bsdd archive (?:CHG-)?0*2\b/.test(commandOf(c)) && !commandOf(c).includes("--dry-run");

export default [
  {
    id: "TS-132",
    title: "The archive confirmation goes through the OpenCode question tool before any apply (TS-132)",
    host: "opencode",
    agent: "sdd-conductor",
    prompt: "/architect-archive 002",
    maxTurns: 16,
    maxBudgetUsd: 0.35,
    fixture: (root) => {
      if (typeof fixtures.fxGate !== "function") throw new Error("fx-gate builder missing: evals/harness/fixtures.mjs fxGate (C002-T-037)");
      fixtures.fxGate(root, { variant: "ready-to-archive" });
    },
    answer: () => "Cancel",
    assert: ({ transcript }) => {
      const { failures, check } = checker();
      const calls = toolCalls(transcript);
      const asks = calls.filter((c) => c.name === "question" && c.agent === null);
      check(asks.length === 1, `TS-132: ${asks.length} question calls on the main thread (one expected)`);
      const at = calls.findIndex((c) => c.name === "question" && JSON.stringify(c.input ?? {}).includes(QUESTION));
      check(at >= 0, `TS-132: no question call asks "${QUESTION}"`);
      if (at < 0) return failures;
      const q = (calls[at].input?.questions ?? []).find((x) => String(x.question ?? "").includes(QUESTION));
      const labels = (q?.options ?? []).map((o) => String(o.label ?? ""));
      check(labels.length === 2 && labels[0] === "Apply (Recommended)" && labels[1] === "Cancel", `TS-132: options are ${JSON.stringify(labels)}`);
      check(!calls.slice(0, at).some(applies), "TS-132: sdd archive 002 without --dry-run ran before the question was answered");
      check(!calls.some(applies), "TS-132: sdd archive 002 ran although the answer was Cancel");
      check(calls.slice(0, at).some((c) => SHELL_TOOLS.has(c.name) && /\bsdd archive (?:CHG-)?0*2\b.*--dry-run/.test(commandOf(c))), "TS-132: no dry run before the question");
      check(!calls.some((c) => c.name === "AskUserQuestion"), "TS-132: AskUserQuestion was called on OpenCode");
      return failures;
    },
  },
];
