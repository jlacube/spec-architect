// NFR benchmarks (C001-T-027): results go to bench/results/ with machine info. `npm run bench` (it
// builds first, so the sdd MCP server benchmarks of C002-T-020 run the current build/npm/sdd-mcp.mjs).
// Pass `--skip-faults` to leave out the 1,000-run fault campaign (several minutes).
import { benchFaults } from "./faults.mjs";
import { benchGenerate } from "./generate.mjs";
import { benchGuards } from "./guards.mjs";
import { benchLint } from "./lint.mjs";
import { benchLintQuick } from "./lint-quick.mjs";
import { benchMcpRefusals } from "./mcp-refusals.mjs";
import { benchMcpWrites } from "./mcp-writes.mjs";
import { benchSessionStart } from "./session-start.mjs";

const docs = [benchLint(), benchLintQuick(), benchGuards(), await benchMcpRefusals(), await benchMcpWrites(), benchSessionStart(), benchGenerate()];
if (!process.argv.includes("--skip-faults")) docs.push(await benchFaults(1000));
const failed = docs.filter((d) => d.pass === false).map((d) => d.benchmark);
if (failed.length > 0) {
  console.error(`benchmarks over threshold: ${failed.join(", ")}`);
  process.exitCode = 1;
}
