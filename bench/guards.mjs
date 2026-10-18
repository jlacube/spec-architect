// C001-NFR-103: path and bash guard decision time, p95 over 50 recorded hook inputs (spike S-04 shape),
// threshold 300 ms. A guard that is not implemented yet (the bash guard before C001-T-051) is left out
// of the run and named in the result.
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { p95, record, ROOT, SDD } from "./lib.mjs";

const at = (rel) => `${ROOT.split("\\").join("/")}/${rel}`;
const hook = (tool_name, agent_type, tool_input) => ({ session_id: "bench", cwd: ROOT, hook_event_name: "PreToolUse", agent_type, tool_name, tool_input });
const INPUTS = [
  ["guard-path", hook("Write", "architect:sdd-spec-writer", { file_path: at(".sdd/004-x/10-spec/scope.md"), content: "x" })],
  ["guard-path", hook("Write", "architect:sdd-spec-writer", { file_path: at("src/index.ts"), content: "x" })],
  ["guard-path", hook("Edit", "architect:sdd-architect", { file_path: at(".sdd/../README.md"), old_string: "a", new_string: "b" })],
  ["guard-bash", hook("Bash", "architect:sdd-cartographer", { command: "git log --oneline -5" })],
  ["guard-bash", hook("Bash", "architect:sdd-cartographer", { command: "rm -rf src" })],
  ["guard-bash", hook("Bash", "architect:sdd-planner", { command: "sdd lint 002 --json" })],
];

const run = (cmd, input) => {
  const t0 = process.hrtime.bigint();
  const r = spawnSync(process.execPath, [SDD, cmd], { cwd: ROOT, input: JSON.stringify(input), encoding: "utf8" });
  return { ms: Number(process.hrtime.bigint() - t0) / 1e6, status: r.status, stderr: r.stderr };
};

export function benchGuards() {
  const missing = [...new Set(INPUTS.map(([cmd]) => cmd))].filter((cmd) => /not implemented yet/.test(run(cmd, {}).stderr));
  const inputs = INPUTS.filter(([cmd]) => !missing.includes(cmd));
  if (inputs.length === 0) return record("guards", { nfr: "C001-NFR-103", skipped: "guard commands arrive with C001-T-050/T-051" });
  run(...inputs[0]); // warm-up
  const times = Array.from({ length: 50 }, (_, i) => run(...inputs[i % inputs.length]).ms);
  const value = p95(times);
  return record("guards", { nfr: "C001-NFR-103", threshold_ms: 300, runs: 50, guards: [...new Set(inputs.map(([cmd]) => cmd))], not_measured: missing, times_ms: times.map(Math.round), p95_ms: value, pass: value <= 300 });
}

if (fileURLToPath(import.meta.url) === process.argv[1]) benchGuards();
