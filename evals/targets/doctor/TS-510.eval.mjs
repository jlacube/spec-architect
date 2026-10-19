// C002-TC-510 — verifies C002-TS-510 (C002-AC-506.1, C002-REQ-506; C002-T-038): the minimum Claude Code
// version is checked on Claude Code only. `claude --version` comes from a shim per row. Scenario Outline:
//   TS-510-claude-code-2.0.76   Claude Code, 2.0.76  → Claude Code row `error` with the update command (cfg-old-claude; C002-T-038 step 4)
//   TS-510-claude-code-2.1.295  Claude Code, 2.1.295 → Claude Code row `ok` (cfg-claude-min; C002-T-038 step 4)
//   TS-510-opencode-2.0.76      OpenCode, 2.0.76     → no Claude Code row (carried to C002-T-056)
import { checker } from "../../harness/assert.mjs";
import { doctorCase, shims, tableRows } from "./doctor-cases.mjs";

export default [
  {
    id: "TS-510-claude-code-2.0.76",
    title: "Claude Code 2.0.76 on Claude Code: error and the update command (TS-510)",
    ...doctorCase("claude-code", "cfg-old-claude"),
    assert({ transcript }) {
      const { failures, check } = checker();
      const cc = tableRows(transcript).find((r) => r.tool === "Claude Code");
      check(cc?.status === "error", `TS-510 2.0.76: Claude Code status "${cc?.status}"`);
      check(/2\.0\.76/.test(cc?.version ?? ""), `TS-510 2.0.76: Claude Code version "${cc?.version}"`);
      check(/claude update/.test(cc?.fix ?? ""), `TS-510 2.0.76: Claude Code fix "${cc?.fix}" lacks the update command`);
      return failures;
    },
  },
  {
    id: "TS-510-claude-code-2.1.295",
    title: "Claude Code 2.1.295 on Claude Code: ok (TS-510)",
    ...doctorCase("claude-code", "cfg-claude-min"),
    assert({ transcript }) {
      const { failures, check } = checker();
      const cc = tableRows(transcript).find((r) => r.tool === "Claude Code");
      check(cc?.status === "ok", `TS-510 2.1.295: Claude Code status "${cc?.status}"`);
      check(/2\.1\.295/.test(cc?.version ?? ""), `TS-510 2.1.295: Claude Code version "${cc?.version}" (the shim was not used)`);
      return failures;
    },
  },
  {
    id: "TS-510-opencode-2.0.76",
    title: "Claude Code 2.0.76 on OpenCode: no Claude Code row (TS-510)",
    ...doctorCase("opencode", "cfg-full", { prepend: [shims("ts510-claude-2.0.76", { claude: "2.0.76" })], targetPackage: { target: "opencode" } }),
    assert({ transcript }) {
      const { failures, check } = checker();
      const rows = tableRows(transcript);
      check(rows.length > 0, "TS-510 OpenCode: no doctor table in the reply");
      check(!rows.some((r) => r.tool === "Claude Code"), "TS-510 OpenCode: the table has a Claude Code row");
      return failures;
    },
  },
];
