// C002-TC-639 — verifies C002-TS-639 (C002-AC-504.1, C002-REQ-504; C002-IF-006 §2; C002-T-038): on
// OpenCode with the package generated for sdd MCP server enforcement, ast-grep is found only as
// `ast-grep.cmd` (an npm install; the native ast-grep is dropped from PATH): the `sdd-shell` command tool
// does not start the shim (ERR-MCP-006), so the ast-grep row shows `error`, version "—" and its fallback,
// its Fix starts with "install a native executable of ast-grep" followed by the server-mode install
// command, and the run reports "completed with warnings". OpenCode on REF-WIN only: carried to
// C002-T-056 (`run.mjs --host opencode`).
import { checker } from "../../harness/assert.mjs";
import { doctorCase, outcomeOf, shims, tableRows } from "./doctor-cases.mjs";

export default [
  {
    id: "TS-639-opencode",
    title: "ast-grep only as a .cmd shim under sdd MCP server enforcement (TS-639)",
    ...doctorCase("opencode", "cfg-full", {
      prepend: [shims("ts639-ast-grep-cmd", { astGrepCmdOnly: true })],
      without: ["ast-grep"],
      targetPackage: { target: "opencode", mode: "sdd-mcp-server" },
    }),
    assert({ transcript }) {
      const { failures, check } = checker();
      const r = tableRows(transcript).find((x) => x.tool === "ast-grep");
      check(r?.status === "error", `TS-639: ast-grep status "${r?.status}"`);
      check(/^[`\s]*[—–-][`\s]*$/.test(r?.version ?? ""), `TS-639: ast-grep version "${r?.version}", expected "—"`);
      check(/grep/i.test(r?.fallback ?? ""), `TS-639: ast-grep fallback "${r?.fallback}"`);
      check(/^install a native executable of ast-grep/i.test(r?.fix ?? ""), `TS-639: ast-grep Fix "${r?.fix}"`);
      check(/pip install ast-grep-cli/.test(r?.fix ?? ""), `TS-639: ast-grep Fix "${r?.fix}" lacks the server-mode install command`);
      check(outcomeOf(transcript) === "completed with warnings", `TS-639: outcome "${outcomeOf(transcript)}"`);
      return failures;
    },
  },
];
