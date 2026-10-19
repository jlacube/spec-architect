// C002-TC-514 — verifies C002-TS-514 (C002-AC-508.1, C002-REQ-508, C002-REQ-505; C002-T-038, C002-T-014):
// OpenCode reports 1.5.0 while the tested version is 1.4.2 (fixture); `untested` is a warning, so the run
// reports "completed with warnings". OpenCode only: carried to C002-T-056 (`run.mjs --host opencode`).
import { checker } from "../../harness/assert.mjs";
import { doctorCase, outcomeOf, shims, tableRows } from "./doctor-cases.mjs";

export default [
  {
    id: "TS-514-opencode",
    title: "Untested OpenCode version is a warning (TS-514)",
    ...doctorCase("opencode", "cfg-full", { prepend: [shims("ts514-opencode-1.5.0", { opencode: "1.5.0" })], targetPackage: { target: "opencode", tested_versions: { opencode: "1.4.2" } } }),
    assert({ transcript }) {
      const { failures, check } = checker();
      const r = tableRows(transcript).find((x) => x.tool === "OpenCode");
      check(r?.status === "untested", `TS-514: OpenCode status "${r?.status}"`);
      check(outcomeOf(transcript) === "completed with warnings", `TS-514: outcome "${outcomeOf(transcript)}"`);
      return failures;
    },
  },
];
