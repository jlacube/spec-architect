// C002-TC-515 — verifies C002-TS-515 (C002-AC-509.1, C002-REQ-509; C002-T-038): the OpenCode target
// package of version 0.3.0 and `sdd --version` reporting another version: the sdd CLI row is `ok` only on
// an exact major.minor.patch match, else `error` with the npm command for architect-sdd 0.3.0. Scenario
// Outline rows TS-515-opencode-0.3.0, -0.2.0, -0.3.1, -0.4.0, -1.3.0; OpenCode only: carried to
// C002-T-056 (`run.mjs --host opencode`). The package uses native permission enforcement: under sdd MCP
// server enforcement the command tool runs the CLI of the server's own package (C002-IF-002 §5.2), whose
// version is the package's by construction, so a PATH `sdd` shim would not be reached.
import { checker } from "../../harness/assert.mjs";
import { doctorCase, emptyFix, shims, tableRows } from "./doctor-cases.mjs";

const PACKAGE = "0.3.0";

function row(cli, status) {
  return {
    id: `TS-515-opencode-${cli}`,
    title: `sdd --version ${cli} against package ${PACKAGE} → ${status} (TS-515)`,
    ...doctorCase("opencode", "cfg-no-sdd", {
      prepend: [shims(`ts515-sdd-${cli}`, { sdd: cli })],
      targetPackage: { target: "opencode", mode: "native-permissions", version: PACKAGE },
    }),
    assert({ transcript }) {
      const { failures, check } = checker();
      const r = tableRows(transcript).find((x) => x.tool === "sdd CLI");
      check(r?.status === status, `TS-515 ${cli}: sdd CLI status "${r?.status}", expected ${status}`);
      if (status === "ok") check(emptyFix(r?.fix), `TS-515 ${cli}: Fix "${r?.fix}" is not empty`);
      else check(/npm install -g architect-sdd@0\.3\.0\b/.test(r?.fix ?? ""), `TS-515 ${cli}: Fix "${r?.fix}" lacks npm install -g architect-sdd@0.3.0`);
      return failures;
    },
  };
}

export default [row("0.3.0", "ok"), row("0.2.0", "error"), row("0.3.1", "error"), row("0.4.0", "error"), row("1.3.0", "error")];
