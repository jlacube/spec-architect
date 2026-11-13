// C002-TC-509 — verifies C002-TS-509 (C002-AC-505.1, C002-REQ-505; C002-T-038, revised by C002-T-084 for
// defect D-057): the doctor outcome per situation; only node below 20 and, on a generated target, an
// unreachable sdd CLI fail the run. Scenario Outline, one case per Examples row:
//   TS-509-opencode-deepwiki-probe-fails  the researcher's DeepWiki probe call fails → completed with warnings (CHG-003)
//   TS-509-opencode-no-context7           the researcher is offered no Context7 tool → completed with warnings (CHG-003)
//   TS-509-opencode-bare                  ripwire, Serena, ast-grep missing          → completed with warnings (C002-T-056)
//   TS-509-opencode-node18                node 18 on PATH                            → failed: node ≥ 20 required (C002-T-056)
//   TS-509-opencode-no-sdd                no "sdd" executable on PATH                → failed, naming the sdd CLI (C002-T-056)
//   TS-509-claude-code-no-sdd             cfg-full with no "sdd" executable on PATH  → completed (C002-T-084 step 8)
//   TS-509-claude-code-deepwiki-probe-fails  the researcher's DeepWiki probe call fails → completed with warnings (C002-T-084 step 8)
//   TS-509-claude-code-node18             node 18 on PATH                            → failed: node ≥ 20 required (C002-T-084 step 8)
// The OpenCode no-sdd row uses native permission enforcement: under sdd MCP server enforcement the
// command tool runs the CLI of the server's own package, never a PATH `sdd` (C002-IF-002 §5.2), so the
// PATH has no bearing on that mode.
// Claude Code no-sdd row (revised for defect D-057): the Claude Code doctor runs the plugin's bundled CLI
// and has no sdd CLI row, so a PATH without `sdd` changes nothing; with cfg-full every other row, Context7
// and DeepWiki included (the researcher makes their probe calls), is `ok`, so the run reports
// "completed". The case checks the outcome, the eight Claude Code rows and no sdd CLI row.
// The failing probe call and the tool not offered are set up through `mcpOverrides` as in C002-TS-709 and
// C002-TS-710 (C002-IF-010 §2.1): the DeepWiki URL of the loopback stub (evals/harness/stub-mcp.mjs, a tool
// result whose `isError` is true), started in the fixture and stopped in the assert; Context7 `false`.
import { checker } from "../../harness/assert.mjs";
import { listenStub, stubUrl } from "../../harness/stub-mcp.mjs";
import { workspace } from "../../cap11/doctor.mjs";
import { doctorCase, outcomeOf, tableRows } from "./doctor-cases.mjs";

const OC = { target: "opencode" };

function row(id, host, cfg, expect, extra = {}) {
  let stub = null;
  const failure = extra.stub;
  delete extra.stub;
  return {
    id: `TS-509-${host}-${id}`,
    title: `Doctor outcome on ${host} (${id} → ${expect}) (TS-509)`,
    ...doctorCase(host, cfg, extra),
    ...(failure
      ? {
          mcpOverrides: { deepwiki: stubUrl(failure) },
          fixture(root) {
            workspace(root);
            stub = listenStub(failure);
          },
        }
      : {}),
    async assert({ transcript }) {
      await stub?.close();
      const { failures, check } = checker();
      const out = outcomeOf(transcript);
      const rows = tableRows(transcript);
      check(out === expect, `TS-509 ${host} ${id}: outcome "${out}", expected "${expect}"`);
      if (host === "claude-code" && id === "no-sdd") {
        const notOk = rows.filter((r) => r.status !== "ok");
        check(notOk.length === 0, `TS-509 ${host} ${id}: rows not ok: ${notOk.map((r) => `${r.tool}=${r.status}`).join(", ")}`);
        check(!rows.some((r) => r.tool === "sdd CLI"), `TS-509 ${host} ${id}: the table has an sdd CLI row`);
        check(rows.length === 8, `TS-509 ${host} ${id}: ${rows.length} rows, expected the 8 Claude Code rows`);
      }
      if (expect === "failed: sdd CLI not reachable") {
        const s = rows.find((r) => r.tool === "sdd CLI");
        check(s?.status === "missing", `TS-509 ${host} ${id}: sdd CLI status "${s?.status}"`);
      }
      if (expect === "failed: node ≥ 20 required") {
        const n = rows.find((r) => r.tool === "node");
        check(n?.status === "error" || n?.status === "missing", `TS-509 ${host} ${id}: node status "${n?.status}"`);
      }
      return failures;
    },
  };
}

export default [
  row("deepwiki-probe-fails", "opencode", "cfg-full", "completed with warnings", { targetPackage: OC, stub: "isError" }),
  row("no-context7", "opencode", "cfg-full", "completed with warnings", { targetPackage: OC, mcpOverrides: { context7: false } }),
  row("bare", "opencode", "cfg-bare", "completed with warnings", { targetPackage: OC }),
  row("node18", "opencode", "cfg-node18", "failed: node ≥ 20 required", { targetPackage: OC }),
  row("no-sdd", "opencode", "cfg-no-sdd", "failed: sdd CLI not reachable", { targetPackage: { target: "opencode", mode: "native-permissions" } }),
  row("no-sdd", "claude-code", "cfg-no-sdd", "completed"),
  row("deepwiki-probe-fails", "claude-code", "cfg-full", "completed with warnings", { stub: "isError" }),
  row("node18", "claude-code", "cfg-node18", "failed: node ≥ 20 required"),
];
