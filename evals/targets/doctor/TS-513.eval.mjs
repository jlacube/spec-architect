// C002-TC-513 — verifies C002-TS-513 (C002-AC-508.1, C002-REQ-508; C002-T-038, C002-T-014): the host row
// against the tested versions that the package's doctor remedies table records (the fixture's: OpenCode
// 1.4.2; VS Code 1.105.1 with GitHub Copilot Chat 0.32.4), with the host versions from shims that
// `sdd host-version` reads. Scenario Outline, one case per Examples row:
//   TS-513-opencode-1.4.2 / -1.5.0 / -1.4.1                    OpenCode rows (carried to C002-T-056)
//   TS-513-copilot-equal / -vscode-differs / -chat-differs     Copilot rows on Copilot CLI (carried to C002-T-045)
// The Copilot fixture's tested VS Code version is a stable build, so its doctor probes
// `sdd host-version vscode` (the `code` shim), not `vscode-insiders` (`{{host_version_arg}}`).
import { checker } from "../../harness/assert.mjs";
import { doctorCase, emptyFix, shims, tableRows } from "./doctor-cases.mjs";

const OC_TESTED = { opencode: "1.4.2" };
const CP_TESTED = { vscode: "1.105.1", "copilot-chat": "0.32.4" };

function opencode(detected, status) {
  return {
    id: `TS-513-opencode-${detected}`,
    title: `OpenCode ${detected} against tested 1.4.2 → ${status} (TS-513)`,
    ...doctorCase("opencode", "cfg-full", { prepend: [shims(`ts513-opencode-${detected}`, { opencode: detected })], targetPackage: { target: "opencode", tested_versions: OC_TESTED } }),
    assert({ transcript }) {
      const { failures, check } = checker();
      const r = tableRows(transcript).find((x) => x.tool === "OpenCode");
      check(r?.status === status, `TS-513 OpenCode ${detected}: status "${r?.status}", expected ${status}`);
      if (status === "ok") check(emptyFix(r?.fix), `TS-513 OpenCode ${detected}: Fix "${r?.fix}" is not empty`);
      else check((r?.fix ?? "").includes("1.4.2"), `TS-513 OpenCode ${detected}: Fix "${r?.fix}" does not name 1.4.2`);
      return failures;
    },
  };
}

function copilot(id, vscode, chat, status) {
  return {
    id: `TS-513-copilot-${id}`,
    title: `VS Code ${vscode} and GitHub Copilot Chat ${chat} against tested 1.105.1 and 0.32.4 → ${status} (TS-513)`,
    ...doctorCase("copilot-cli", "cfg-full", { prepend: [shims(`ts513-copilot-${id}`, { code: { vscode, chat } })], targetPackage: { target: "copilot", tested_versions: CP_TESTED } }),
    assert({ transcript }) {
      const { failures, check } = checker();
      const r = tableRows(transcript).find((x) => x.tool === "VS Code with GitHub Copilot Chat");
      check(r?.status === status, `TS-513 Copilot ${id}: status "${r?.status}", expected ${status}`);
      if (status === "ok") {
        check((r?.version ?? "").includes("1.105.1") && (r?.version ?? "").includes("0.32.4"), `TS-513 Copilot ${id}: Version "${r?.version}" lacks 1.105.1 and 0.32.4`);
        check(emptyFix(r?.fix), `TS-513 Copilot ${id}: Fix "${r?.fix}" is not empty`);
      } else check((r?.fix ?? "").includes("1.105.1") && (r?.fix ?? "").includes("0.32.4"), `TS-513 Copilot ${id}: Fix "${r?.fix}" does not name 1.105.1 and 0.32.4`);
      return failures;
    },
  };
}

export default [
  opencode("1.4.2", "ok"),
  opencode("1.5.0", "untested"),
  opencode("1.4.1", "untested"),
  copilot("equal", "1.105.1", "0.32.4", "ok"),
  copilot("vscode-differs", "1.106.0", "0.32.4", "untested"),
  copilot("chat-differs", "1.105.1", "0.33.0", "untested"),
];
