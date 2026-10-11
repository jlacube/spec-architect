// C001-TC-1124 — verifies C001-TS-1124 (C001-AC-1123.1, C001-REQ-1123): Claude Code below the minimum version.
// `claude --version` reports 2.0.76 (shim, cfg-old-claude); the Claude Code row shows status error, version
// 2.0.76 and the update command, and the run completes with warnings.
import { checker } from "../harness/assert.mjs";
import { doctorRows, doctorRun, outcome } from "./doctor.mjs";

export default {
  id: "TS-1124",
  title: "Claude Code below the minimum version",
  ...doctorRun("cfg-old-claude"),
  assert({ transcript }) {
    const { failures, check } = checker();
    const cc = doctorRows(transcript).find((r) => r.tool === "Claude Code");
    check(cc?.status === "error", `Claude Code status "${cc?.status}"`);
    check(/2\.0\.76/.test(cc?.version ?? ""), `Claude Code version "${cc?.version}"`);
    check(/claude update/.test(cc?.fix ?? ""), `Claude Code fix "${cc?.fix}"`);
    check(outcome(transcript) === "completed with warnings", `outcome "${outcome(transcript)}"`);
    return failures;
  },
};
