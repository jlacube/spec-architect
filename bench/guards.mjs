// C001-NFR-103: path and bash guard decision time, p95 over 50 recorded hook inputs, threshold
// 300 ms. The guards arrive with C001-T-050/T-051; until then the benchmark records "skipped".
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { p95, record, ROOT, SDD } from "./lib.mjs";

const INPUTS = [
  ["guard-path", { tool_name: "Write", agent_type: "architect:spec-writer", tool_input: { file_path: ".sdd/004-x/10-spec/scope.md" } }],
  ["guard-path", { tool_name: "Write", agent_type: "architect:spec-writer", tool_input: { file_path: "src/index.ts" } }],
  ["guard-bash", { tool_name: "Bash", agent_type: "architect:cartographer", tool_input: { command: "git log --oneline -5" } }],
  ["guard-bash", { tool_name: "Bash", agent_type: "architect:cartographer", tool_input: { command: "rm -rf src" } }],
];

export function benchGuards() {
  const run = (cmd, input) => {
    const t0 = process.hrtime.bigint();
    const r = spawnSync(process.execPath, [SDD, cmd], { cwd: ROOT, input: JSON.stringify(input), encoding: "utf8" });
    return { ms: Number(process.hrtime.bigint() - t0) / 1e6, status: r.status, stderr: r.stderr };
  };
  const probe = run(INPUTS[0][0], INPUTS[0][1]);
  if (/not implemented yet/.test(probe.stderr)) return record("guards", { nfr: "C001-NFR-103", skipped: "guard commands arrive with C001-T-050/T-051" });
  const times = Array.from({ length: 50 }, (_, i) => run(...INPUTS[i % INPUTS.length]).ms);
  const value = p95(times);
  return record("guards", { nfr: "C001-NFR-103", threshold_ms: 300, runs: 50, times_ms: times.map(Math.round), p95_ms: value, pass: value <= 300 });
}

if (fileURLToPath(import.meta.url) === process.argv[1]) benchGuards();
