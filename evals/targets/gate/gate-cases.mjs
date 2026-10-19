// Shared parts of the OpenCode gate and revise cases (C002-TC-613, 634, 635; C002-T-044): fx-gate
// (evals/harness/fixtures.mjs), scripted `question` answers through the OpenCode eval runner
// (runners/opencode.mjs, `question.reply`), and readers of the conductor's `sdd` commands. The cases are
// written for the OpenCode host (`host: "opencode"`), so the transcript carries OpenCode's tool names: the
// command tool is `sdd-shell_run_command` under sdd MCP server enforcement, `bash` under native permissions.
import { toolCalls } from "../../harness/assert.mjs";

/** Host names of the command tool (both enforcement modes). */
export const SHELL_TOOLS = new Set(["bash", "sdd-shell_run_command"]);

/** The four gate choices (C001-REQ-802). */
export const CHOICES = ["Approve", "Approve with waivers", "Revise", "Stop"];

/** Whether the question is the gate question (its options include Approve and Stop). */
export const isGate = (x) => (x.options ?? []).some((o) => /^Approve\b/.test(o.label)) && (x.options ?? []).some((o) => /^Stop\b/.test(o.label));

/** Command lines the conductor ran through the command tool, with their transcript time. */
export function commands(transcript) {
  return toolCalls(transcript)
    .filter((c) => SHELL_TOOLS.has(c.name))
    .map((c) => ({ t: c.t, command: String(c.input?.command ?? "") }));
}

/** The value of option `--<name>` of a command line (double- or single-quoted), or null. */
export function optionValue(command, name) {
  const m = new RegExp(`--${name}\\s+(?:"((?:[^"\\\\]|\\\\.)*)"|'([^']*)')`).exec(command);
  return m ? (m[1] !== undefined ? m[1].replace(/\\(["\\$`])/g, "$1") : m[2]) : null;
}

/** Main-thread `question` calls that carry the gate question, in order. */
export const gateCalls = (transcript) => toolCalls(transcript).filter((c) => c.name === "question" && c.agent === null && (c.input?.questions ?? []).some(isGate));

/** The OpenCode case fields shared by the gate cases. */
export const OPENCODE = { host: "opencode", agent: "sdd-conductor", allowTools: ["Agent", "Write", "Edit", "Bash"], maxTurns: 24, maxBudgetUsd: 0.35 };
