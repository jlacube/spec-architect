// C002-TC-509 — verifies C002-TS-509 (C002-AC-505.1, C002-REQ-505; C002-T-038): the doctor outcome per
// situation; only node below 20 and, on a generated target, an unreachable sdd CLI fail the run.
// Scenario Outline, one case per Examples row:
//   TS-509-opencode-deepwiki-down  DeepWiki unreachable              → completed with warnings   (C002-T-056)
//   TS-509-opencode-bare           ripwire, Serena, ast-grep missing → completed with warnings   (C002-T-056)
//   TS-509-opencode-node18         node 18 on PATH                   → failed: node ≥ 20 required (C002-T-056)
//   TS-509-opencode-no-sdd         no "sdd" executable on PATH       → failed, naming the sdd CLI (C002-T-056)
//   TS-509-claude-code-no-sdd      no "sdd" executable on PATH       → completed                  (C002-T-038 step 4)
//   TS-509-claude-code-node18      node 18 on PATH                   → failed: node ≥ 20 required (C002-T-038 step 4)
// The OpenCode no-sdd row uses native permission enforcement: under sdd MCP server enforcement the
// command tool runs the CLI of the server's own package, never a PATH `sdd` (C002-IF-002 §5.2), so the
// PATH has no bearing on that mode.
// Claude Code no-sdd row: the Claude Code doctor runs the plugin's bundled CLI and has no sdd CLI row, so
// a PATH without `sdd` changes nothing; the case checks that, and that the outcome is the one REQ-505
// gives for the table as reported: `completed` when every row is `ok`, else `completed with warnings`
// (on E-CC the Context7 and DeepWiki rows depend on their tools loading in the probing agent; such
// rows are logged, not failed).
import { checker } from "../../harness/assert.mjs";
import { doctorCase, outcomeOf, tableRows } from "./doctor-cases.mjs";

const OC = { target: "opencode" };

function row(id, host, cfg, expect, extra = {}) {
  return {
    id: `TS-509-${host}-${id}`,
    title: `Doctor outcome on ${host} (${id} → ${expect}) (TS-509)`,
    ...doctorCase(host, cfg, extra),
    assert({ transcript }) {
      const { failures, check } = checker();
      const out = outcomeOf(transcript);
      const rows = tableRows(transcript);
      if (expect === "completed (sdd not used)") {
        const notOk = rows.filter((r) => r.status !== "ok");
        const want = notOk.length === 0 ? "completed" : "completed with warnings";
        console.log(`TS-509 ${host} ${id}: rows not ok: ${notOk.map((r) => `${r.tool}=${r.status}`).join(", ") || "none"}`);
        check(out === want, `TS-509 ${host} ${id}: outcome "${out}", expected "${want}" for the rows reported`);
        check(!rows.some((r) => r.tool === "sdd CLI"), `TS-509 ${host} ${id}: the table has an sdd CLI row`);
        check(rows.length === 8, `TS-509 ${host} ${id}: ${rows.length} rows, expected the 8 Claude Code rows`);
      } else {
        check(out === expect, `TS-509 ${host} ${id}: outcome "${out}", expected "${expect}"`);
        if (expect === "failed: sdd CLI not reachable") {
          const s = rows.find((r) => r.tool === "sdd CLI");
          check(s?.status === "missing", `TS-509 ${host} ${id}: sdd CLI status "${s?.status}"`);
        }
        if (expect === "failed: node ≥ 20 required") {
          const n = rows.find((r) => r.tool === "node");
          check(n?.status === "error" || n?.status === "missing", `TS-509 ${host} ${id}: node status "${n?.status}"`);
        }
      }
      return failures;
    },
  };
}

export default [
  row("deepwiki-down", "opencode", "cfg-no-ripwire", "completed with warnings", { targetPackage: OC, mcpOverrides: { deepwiki: "https://deepwiki-unreachable.invalid/mcp" } }),
  row("bare", "opencode", "cfg-bare", "completed with warnings", { targetPackage: OC }),
  row("node18", "opencode", "cfg-node18", "failed: node ≥ 20 required", { targetPackage: OC }),
  row("no-sdd", "opencode", "cfg-no-sdd", "failed: sdd CLI not reachable", { targetPackage: { target: "opencode", mode: "native-permissions" } }),
  row("no-sdd", "claude-code", "cfg-no-sdd", "completed (sdd not used)"),
  row("node18", "claude-code", "cfg-node18", "failed: node ≥ 20 required"),
];
