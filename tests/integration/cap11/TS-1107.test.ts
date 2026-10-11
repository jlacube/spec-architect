// C001-TC-1107 / C001-TS-1107 (C001-AC-1106.1): bash guard allowlist decisions through `sdd guard-bash`,
// with hook input shaped as in spike S-04. The full corpus is tests/guards/bash-corpus.json.
import { after, test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runBundled } from "../cli/helpers.ts";

const repo = realpathSync.native(mkdtempSync(join(tmpdir(), "sdd-ts1107-")));
mkdirSync(join(repo, ".sdd"));
after(() => rmSync(repo, { recursive: true, force: true }));

const examples: [string, number][] = [
  ["node C:/p/scripts/sdd.mjs lint --json", 0],
  ['ripwire . --for="payment method" --token-budget=4000', 0],
  ["ripwire . --callers=createIntent --limit=50", 0],
  ["git log --oneline -20", 0],
  ["ast-grep run --pattern 'app.get($A, $B)'", 0],
  ["git commit -m x", 2],
  ["npm install", 2],
  ["rm -rf src", 2],
  ["ast-grep run --pattern 'x' --rewrite 'y' -U", 2],
];

for (const [cmd, code] of examples) {
  test(`${cmd} exits ${code}`, () => {
    const input = { session_id: "s", cwd: repo, hook_event_name: "PreToolUse", agent_type: "architect:sdd-cartographer", tool_name: "Bash", tool_input: { command: cmd, description: "d" } };
    const r = runBundled(["guard-bash"], { cwd: repo, stdin: JSON.stringify(input) });
    assert.equal(r.code, code, r.stderr);
    if (code === 2) assert.match(r.stderr, /^GUARD-BASH-001: Bash on .+ denied — .+\. Allowed: .+\.\n$/);
    else assert.equal(r.stderr, "");
  });
}
