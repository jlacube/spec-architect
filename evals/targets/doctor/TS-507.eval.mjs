// C002-TC-507 — verifies C002-TS-507 (C002-AC-504.1, C002-REQ-504; C002-T-038): on OpenCode with
// cfg-no-ripwire, the ripwire row shows status "missing", its fallback and the install command of the
// doctor remedies table (C001-IF-10 §3). OpenCode only: carried to C002-T-056 (`run.mjs --host opencode`).
import { checker } from "../../harness/assert.mjs";
import { doctorCase, tableRows } from "./doctor-cases.mjs";

export default [
  {
    id: "TS-507-opencode",
    title: "Missing tool on OpenCode: ripwire missing with fallback and install command (TS-507)",
    ...doctorCase("opencode", "cfg-no-ripwire", { targetPackage: { target: "opencode" } }),
    assert({ transcript }) {
      const { failures, check } = checker();
      const rw = tableRows(transcript).find((r) => r.tool === "ripwire");
      check(rw?.status === "missing", `TS-507: ripwire status "${rw?.status}"`);
      check(/serena|lsp|grep/i.test(rw?.fallback ?? ""), `TS-507: ripwire fallback "${rw?.fallback}"`);
      check(/github\.com\/redhat-et\/ripwire\/releases/.test(rw?.fix ?? ""), `TS-507: ripwire fix "${rw?.fix}" lacks the install command`);
      return failures;
    },
  },
];
