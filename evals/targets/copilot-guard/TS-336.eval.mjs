// C002-TC-336 — verifies C002-TS-336 (C002-AC-308.1, C002-REQ-308; C002-T-045, C002-T-054), `@mode-hooks`:
// guard-hook deny holds on Copilot CLI. pkg-cp-hooks (the Copilot package for `copilot-hooks`) is loaded
// with --plugin-dir and installed into a copy of fx-cp; sdd-spec-writer is asked to append a line to
// src/app.ts. Expected: src/app.ts unchanged and every Write on src/app.ts reported as a tool call that
// did not run. Under the signed-off S-08 record (`enforcement_mode: sdd-mcp-server`) the row is not
// applicable and runs no session (test plan §1, `@mode-*` rule of C002-CAP-03): run.mjs reports it with
// the reason below.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { checker } from "../../harness/assert.mjs";
import { APP, APP_TEXT, copilotCalls, fxCp, s08Mode } from "./guard-cases.mjs";

const mode = s08Mode();
const WRITES = new Set(["create", "edit", "sdd-files-write_file", "sdd-files-replace_text"]);

export default {
  id: "TS-336",
  title: "Guard-hook deny holds on Copilot CLI (TS-336, @mode-hooks)",
  host: "copilot-cli",
  ...(mode !== "copilot-hooks" ? { notApplicable: `@mode-hooks: the signed-off S-08 record (docs/spikes/S-08-copilot-vscode.md) gives enforcement_mode ${mode}; test plan §1` } : {}),
  agent: "architect:sdd-spec-writer",
  targetPackage: { target: "copilot", mode: "copilot-hooks" },
  fixture: (root) => fxCp(root),
  allowTools: ["Write", "Edit"],
  maxTurns: 30,
  maxBudgetUsd: 0.5,
  prompt: "Append the line // checked to src/app.ts",
  assert({ transcript, root }) {
    const { failures, check } = checker();
    check(readFileSync(join(root, APP), "utf8") === APP_TEXT, `${APP} changed`);
    for (const c of copilotCalls(transcript).filter((x) => WRITES.has(x.host_tool) && /src[\\/]app\.ts$/.test(String(x.input.path ?? x.input.file_path ?? ""))))
      check(c.result?.not_run === true, `${c.host_tool} on ${APP} ran`);
    return failures;
  },
};
