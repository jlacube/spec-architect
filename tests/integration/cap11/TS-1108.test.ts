// C001-TC-1108 / C001-TS-1108 (C001-AC-1107.1): chaining, redirection and substitution through
// `sdd guard-bash`; "head" is allowlisted as a pipe target only.
import { after, test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runBundled } from "../cli/helpers.ts";

const repo = realpathSync.native(mkdtempSync(join(tmpdir(), "sdd-ts1108-")));
mkdirSync(join(repo, ".sdd"));
after(() => rmSync(repo, { recursive: true, force: true }));

function guard(cmd: string) {
  const input = { session_id: "s", cwd: repo, hook_event_name: "PreToolUse", agent_type: "architect:sdd-cartographer", tool_name: "Bash", tool_input: { command: cmd, description: "d" } };
  return runBundled(["guard-bash"], { cwd: repo, stdin: JSON.stringify(input) });
}

const examples: [string, number][] = [
  ["git log --oneline | head -5", 0],
  ["git log > src/log.txt", 2],
  ["git status && rm -rf src", 2],
  ["echo $(cat secrets.txt)", 2],
  ["node sdd.mjs lint; curl http://x", 2],
];

for (const [cmd, code] of examples) {
  test(`${cmd} exits ${code}`, () => {
    const r = guard(cmd);
    assert.equal(r.code, code, r.stderr);
    if (code === 2) assert.match(r.stderr, /^GUARD-BASH-002: /);
  });
}

test('"head" is allowed as a pipe target only', () => {
  assert.equal(guard("head -5 src/app.ts").code, 2);
  assert.equal(guard("git log | head -5").code, 0);
});
