// C002-TC-526 — verifies C002-TS-526 (C002-AC-510.1, C002-REQ-510; C002-T-038, revised in C002-T-063): a
// hooks state that cannot be read is never `ok`. The Copilot package's doctor runs with VS Code settings
// that make its `sdd host-version` probe print `hooks unknown`; the VS Code build of the tested version
// comes from the cfg-hosts shims, and APPDATA and XDG_CONFIG_HOME point to a profile folder of the row.
// Three rows per enforcement mode (revised for critic CR-45):
//   no-settings     a profile without VS Code user settings and a workspace without .vscode/settings.json
//   unparsable      a workspace .vscode/settings.json holding '{ "chat.useHooks": tru' beside user
//                   settings of the default profile holding '{ "chat.useHooks": true }'
//   non-boolean     a workspace .vscode/settings.json holding '{ "chat.useHooks": "yes" }' beside the same
//                   user settings
// Each expects the Copilot hooks row with status `error`, the Version text `cannot be read`, the Fix
// `check chat.useHooks and Workspace Trust by hand`, never `ok`, and "completed with warnings".
// Ids TS-526-copilot-<mode>-<row>; on Copilot CLI, carried to C002-T-045; the rows of the mode spike S-08
// did not select are recorded as not applicable (`@mode-*` rule of C002-CAP-03): they carry a
// `notApplicable` reason, so run.mjs reports them and starts no session (C002-T-045).
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checker } from "../../harness/assert.mjs";
import { ROOT } from "../../harness/fixtures.mjs";
import { workspace } from "../../cap11/doctor.mjs";
import { doctorCase, outcomeOf, tableRows } from "./doctor-cases.mjs";
import { s08Mode } from "../copilot-guard/guard-cases.mjs";

const S08_MODE = s08Mode();

const HOSTS_SHIMS = join(ROOT, "tests", "fixtures", "cfg-hosts", "bin");
const USER_TRUE = '{ "chat.useHooks": true }';

/** The settings of each row: the workspace file (null: none) and the user settings of the default profile (null: none). */
const SETTINGS = {
  "no-settings": { workspace: null, user: null },
  unparsable: { workspace: '{ "chat.useHooks": tru', user: USER_TRUE },
  "non-boolean": { workspace: '{ "chat.useHooks": "yes" }', user: USER_TRUE },
};

/** A profile folder of the row: `User/settings.json` of both VS Code builds under the user configuration folder. */
function profile(mode, name, user) {
  const dir = join(tmpdir(), "sdd-eval-ts526-profile", `${mode}-${name}`);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  if (user !== null)
    for (const product of ["Code", "Code - Insiders"]) {
      mkdirSync(join(dir, product, "User"), { recursive: true });
      writeFileSync(join(dir, product, "User", "settings.json"), user);
    }
  return dir;
}

function row(mode, name) {
  const s = SETTINGS[name];
  const dir = profile(mode, name, s.user);
  return {
    id: `TS-526-copilot-${mode}-${name}`,
    title: `Hooks state that cannot be read (${mode}, ${name}) is error, never ok (TS-526)`,
    ...(mode !== S08_MODE ? { notApplicable: `@mode-*: the signed-off S-08 record (docs/spikes/S-08-copilot-vscode.md) gives enforcement_mode ${S08_MODE}, not ${mode}` } : {}),
    ...doctorCase("copilot-cli", "cfg-full", {
      prepend: [HOSTS_SHIMS],
      env: { APPDATA: dir, XDG_CONFIG_HOME: dir },
      targetPackage: { target: "copilot", mode },
      fixture: (root) => {
        workspace(root);
        if (s.workspace !== null) {
          mkdirSync(join(root, ".vscode"), { recursive: true });
          writeFileSync(join(root, ".vscode", "settings.json"), s.workspace);
        }
      },
    }),
    assert({ transcript }) {
      const { failures, check } = checker();
      const r = tableRows(transcript).find((x) => x.tool === "Copilot hooks");
      check(r !== undefined, `TS-526 ${mode} ${name}: no Copilot hooks row`);
      check(r?.status === "error", `TS-526 ${mode} ${name}: Copilot hooks status "${r?.status}", expected error`);
      check(r?.status !== "ok", `TS-526 ${mode} ${name}: Copilot hooks shown as ok`);
      check(/cannot be read/i.test(r?.version ?? ""), `TS-526 ${mode} ${name}: Version "${r?.version}" lacks "cannot be read"`);
      check((r?.fix ?? "").includes("check chat.useHooks and Workspace Trust by hand"), `TS-526 ${mode} ${name}: Fix "${r?.fix}"`);
      check(outcomeOf(transcript) === "completed with warnings", `TS-526 ${mode} ${name}: outcome "${outcomeOf(transcript)}"`);
      return failures;
    },
  };
}

export default ["sdd-mcp-server", "copilot-hooks"].flatMap((mode) => Object.keys(SETTINGS).map((name) => row(mode, name)));
