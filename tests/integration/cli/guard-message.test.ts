// C002-TC-505 / C002-TS-505 (C002-AC-503.1, C002-T-008): the bash guard's deny message names the new
// sdd CLI and version probe entries of C002-IF-008 §1 through the bundled CLI, in the message shape of
// C001-IF-07 §4 (one line ending in a period, as TS-1107 checks). Revision D-024 (C002-T-067): the
// summary names both ripwire forms, `ripwire read verbs or the bounded default map` (C002-IF-008 §1).
import { after, test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runBundled } from "./helpers.ts";

const repo = realpathSync.native(mkdtempSync(join(tmpdir(), "sdd-guardmsg-")));
mkdirSync(join(repo, ".sdd"));
after(() => rmSync(repo, { recursive: true, force: true }));

const guard = (tool: string, command: string) =>
  runBundled(["guard-bash"], {
    cwd: repo,
    stdin: JSON.stringify({ session_id: "s", cwd: repo, hook_event_name: "PreToolUse", agent_type: "architect:sdd-planner", tool_name: tool, tool_input: { command, description: "d" } }),
  });

test("C002-TS-505: the deny of npm install names a bare sdd command and node --version in its Allowed: summary", () => {
  const r = guard("Bash", "npm install");
  assert.equal(r.code, 2, r.stderr);
  assert.match(r.stderr, /^GUARD-BASH-001: Bash on "npm install" denied — npm … is not on the allowlist\. Allowed: .+\.\n$/);
  const summary = r.stderr.slice(r.stderr.indexOf("Allowed: ") + "Allowed: ".length);
  assert.ok(summary.startsWith("sdd … or node <path>/sdd.mjs …"), summary);
  assert.ok(summary.includes("version probes (node -v, node --version, git --version, claude --version, serena --version, ast-grep --version, uv --version)"), summary);
  assert.ok(summary.endsWith("head -n N, tail -n N, wc -l, sort, uniq only after |.\n"), summary);
  assert.ok(summary.includes(", ripwire read verbs or the bounded default map, ast-grep run --pattern, "), summary);
});

test("C002-TS-505 (revision D-024): the Allowed: summary is the CHG-002 text of C002-IF-008 §1, byte for byte", () => {
  const r = guard("Bash", "npm install");
  const summary = r.stderr.slice(r.stderr.indexOf("Allowed: ") + "Allowed: ".length).replace(/\.\n$/, "");
  assert.equal(
    summary,
    "sdd … or node <path>/sdd.mjs … (not install; serena-config and serena-launch only with --user-data or a data folder outside the repository; --cwd of a writing subcommand only with a folder inside the repository), ripwire read verbs or the bounded default map, ast-grep run --pattern, git log|show|diff|blame|ls-files|rev-parse|status|grep, version probes (node -v, node --version, git --version, claude --version, serena --version, ast-grep --version, uv --version); head -n N, tail -n N, wc -l, sort, uniq only after |",
  );
});

test("C002-TS-504 through the bundled CLI: bare sdd and node --version exit 0 with an empty standard error", () => {
  for (const [tool, command] of [["Bash", "sdd lint 002"], ["PowerShell", "sdd status"], ["Bash", "node --version"], ["PowerShell", "node --version"]] as const) {
    const r = guard(tool, command);
    assert.deepEqual([r.code, r.stderr], [0, ""], `${tool} ${command}`);
  }
});

test("C002-TS-504 through the bundled CLI: npx sdd, sddx and an extra word after node --version stay GUARD-BASH-001", () => {
  for (const command of ["npx sdd status", "sddx status", "node --version --eval 1"]) {
    const r = guard("Bash", command);
    assert.equal(r.code, 2, command);
    assert.match(r.stderr, /^GUARD-BASH-001: /, command);
  }
});
