// C002-TC-526 — verifies C002-TS-526 (C002-AC-510.1, C002-REQ-510; C002-T-038): a hooks state that
// cannot be read is never `ok`. The Copilot package's doctor runs in a user profile without the VS Code
// settings that `sdd host-version` reads (APPDATA and XDG_CONFIG_HOME point to an empty folder; the
// workspace has no `.vscode/settings.json`), so it prints `hooks unknown`; the VS Code build of the
// tested version comes from the cfg-hosts shims. The Copilot hooks row shows `error`, not `ok`, and the
// run reports "completed with warnings". Scenario Outline, one row per enforcement mode:
//   TS-526-copilot-sdd-mcp-server, TS-526-copilot-copilot-hooks — on Copilot CLI, carried to C002-T-045;
// the row of the mode spike S-08 did not select is recorded as not applicable (`@mode-*` rule of
// C002-CAP-03).
import { mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checker } from "../../harness/assert.mjs";
import { ROOT } from "../../harness/fixtures.mjs";
import { doctorCase, outcomeOf, tableRows } from "./doctor-cases.mjs";

const PROFILE = join(tmpdir(), "sdd-eval-ts526-profile");
mkdirSync(PROFILE, { recursive: true });
const HOSTS_SHIMS = join(ROOT, "tests", "fixtures", "cfg-hosts", "bin");

function row(mode) {
  return {
    id: `TS-526-copilot-${mode}`,
    title: `Hooks state that cannot be read (${mode}) is error, never ok (TS-526)`,
    ...doctorCase("copilot-cli", "cfg-full", {
      prepend: [HOSTS_SHIMS],
      env: { APPDATA: PROFILE, XDG_CONFIG_HOME: PROFILE },
      targetPackage: { target: "copilot", mode },
    }),
    assert({ transcript }) {
      const { failures, check } = checker();
      const r = tableRows(transcript).find((x) => x.tool === "Copilot hooks");
      check(r !== undefined, `TS-526 ${mode}: no Copilot hooks row`);
      check(r?.status === "error", `TS-526 ${mode}: Copilot hooks status "${r?.status}", expected error`);
      check(r?.status !== "ok", `TS-526 ${mode}: Copilot hooks shown as ok`);
      check(outcomeOf(transcript) === "completed with warnings", `TS-526 ${mode}: outcome "${outcomeOf(transcript)}"`);
      return failures;
    },
  };
}

export default [row("sdd-mcp-server"), row("copilot-hooks")];
