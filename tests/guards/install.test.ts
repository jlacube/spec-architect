// C002-TC-351, C002-TC-353 (C002-T-059, C002-REQ-325, C002-IF-008 §1.2): the bash guard denies the sdd
// subcommand `install` in every form with GUARD-BASH-001 and the fixed reason, through the bundled CLI
// (exit code 2), and other sdd commands keep their decision. The shell corpus holds the same cases
// (BG-420 … BG-435); this file checks what the corpus format cannot: the reason text and the
// `not install;` part of the `Allowed:` summary (a C002-REQ-325 expectation change, C002-REQ-623).
import { after, test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { decideBash } from "../../src/hooks/guard-bash.ts";
import { parseHookInput } from "../../src/hooks/input.ts";
import { runBundled } from "../integration/cli/helpers.ts";

const repo = realpathSync.native(mkdtempSync(join(tmpdir(), "sdd-install-guard-"))).split("\\").join("/");
mkdirSync(`${repo}/.git`);
mkdirSync(`${repo}/.sdd`);
after(() => rmSync(repo, { recursive: true, force: true }));

const REASON = "sdd install writes outside .sdd/; P-03 runs it in their own terminal";
const input = (tool: string, command: string, agent = "architect:sdd-spec-writer") =>
  JSON.stringify({ session_id: "s", hook_event_name: "PreToolUse", cwd: repo, agent_type: agent, tool_name: tool, tool_input: { command, description: "d" } });

const TS_351: [tool: string, command: string][] = [
  ["Bash", "sdd install copilot"],
  ["Bash", "sdd install copilot --package C:/fx/pkg-cp"],
  ["Bash", "node C:/fx/pkg-cp/scripts/sdd.mjs install copilot"],
  ["Bash", `sdd install copilot --cwd ${repo}/pkg`],
  ["Bash", "sdd install"],
  ["Bash", "sdd install opencode"],
  ["Bash", "sdd install --help"],
  ["PowerShell", "sdd install copilot"],
];

for (const [tool, command] of TS_351) {
  test(`C002-TS-351: ${tool} "${command}" exits 2 with GUARD-BASH-001 and the install reason`, () => {
    const r = runBundled(["guard-bash"], { cwd: repo, stdin: input(tool, command) });
    assert.equal(r.code, 2, r.stderr);
    assert.ok(r.stderr.startsWith(`GUARD-BASH-001: ${tool} on ${JSON.stringify(command)} denied — ${REASON}. Allowed: `), r.stderr);
    assert.match(r.stderr, /^GUARD-BASH-001: .+ denied — .+\. Allowed: .+\.\n$/);
  });
}

test("C002-TS-353: other sdd commands keep their decision", () => {
  for (const command of ["sdd lint 002", "sdd lint install", "node C:/fx/pkg-cp/scripts/sdd.mjs status", `sdd trace 002 --write --cwd ${repo}/pkg`]) {
    const r = runBundled(["guard-bash"], { cwd: repo, stdin: input("Bash", command) });
    assert.deepEqual([r.code, r.stderr], [0, ""], command);
  }
});

test("the install rule comes before the --cwd rule, and a caller that is no Architect agent is not guarded", () => {
  const d = decideBash(parseHookInput(input("Bash", `sdd install copilot --cwd ${repo}/../other-repo`)));
  assert.ok(!d.allow && d.message.includes(`denied — ${REASON}.`), JSON.stringify(d));
  assert.deepEqual(decideBash(parseHookInput(input("Bash", "sdd install copilot", "general-purpose"))), { allow: true });
});

test("the Allowed: summary of every deny opens the sdd CLI entry with not install;", () => {
  const d = decideBash(parseHookInput(input("Bash", "npm install")));
  assert.ok(!d.allow && d.message.includes("Allowed: sdd … or node <path>/sdd.mjs … (not install; serena-config and serena-launch only with"), JSON.stringify(d));
});
