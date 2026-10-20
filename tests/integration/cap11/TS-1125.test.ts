// C001-TC-1125 / C001-TS-1125 (C001-AC-1106.1, C001-T-079): the ripwire forms of C001-IF-07 §3.1
// (defect D-012) through the bundled `sdd guard-bash`, with hook input as in TS-1107.test.ts. Each row
// is also a category `ripwire` case of tests/guards/bash-corpus.json with the same expectation.
import { after, test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadBashCorpus } from "../../guards/fixture.ts";
import { runBundled } from "../cli/helpers.ts";

const repo = realpathSync.native(mkdtempSync(join(tmpdir(), "sdd-ts1125-")));
mkdirSync(join(repo, ".sdd"));
after(() => rmSync(repo, { recursive: true, force: true }));

const examples: [tool: "Bash" | "PowerShell", cmd: string, code: 0 | 2][] = [
  ["Bash", "ripwire . --max-tokens=4000", 0],
  ["Bash", "ripwire --max-tokens=4000", 0],
  ["Bash", "ripwire . --max-tokens=4000 --json", 0],
  ["Bash", "ripwire . --test-gate=src/checkout/payments.ts --limit=50", 0],
  ["Bash", "ripwire . --test-gate=src/checkout/payments.ts --limit=50 | head -n 40", 0],
  ["Bash", "ripwire --test-gate src/a.ts", 0],
  ["Bash", "ripwire . --token-budget=4000", 2],
  ["Bash", "ripwire . --max-tokens=x", 2],
  ["Bash", "ripwire . --max-tokens", 2],
  ["Bash", "ripwire . --limit=50", 2],
  ["Bash", "ripwire . --json", 2],
  ["Bash", "ripwire a b --max-tokens=4000", 2],
  ["Bash", "ripwire . --max-tokens=4000 --edit=src/a.ts:1-2", 2],
  ["Bash", "ripwire . --test-gate= --limit=50", 2],
  ["Bash", "ripwire . --test-gate src/a.ts --limit=50", 2],
  ["Bash", "ripwire . --test-gate=src/a.ts --situ", 2],
  ["Bash", "ripwire . --test-gate=a --test-gate=b", 2],
  ["PowerShell", "ripwire . --max-tokens=4000", 2],
];

test("the Examples table has 18 rows", () => assert.equal(examples.length, 18));

for (const [tool, cmd, code] of examples) {
  test(`${tool}: ${cmd} exits ${code}`, () => {
    const input = { session_id: "s", cwd: repo, hook_event_name: "PreToolUse", agent_type: "architect:sdd-cartographer", tool_name: tool, tool_input: { command: cmd, description: "d" } };
    const r = runBundled(["guard-bash"], { cwd: repo, stdin: JSON.stringify(input) });
    assert.equal(r.code, code, r.stderr);
    if (code === 2) assert.match(r.stderr, /GUARD-BASH-001/);
    else assert.equal(r.stderr, "");
  });

  test(`${tool}: ${cmd} is a ripwire corpus case expecting ${code === 0 ? "allow" : "deny"}`, () => {
    const expect = code === 0 ? "allow" : "deny";
    const found = loadBashCorpus().filter((c) => c.category === "ripwire" && c.tool === tool && c.command === cmd && c.stdin === undefined);
    assert.equal(found.length, 1, `exactly one corpus case for ${tool} ${JSON.stringify(cmd)}`);
    assert.equal(found[0]!.expect, expect);
    if (expect === "deny") assert.equal(found[0]!.rule, "GUARD-BASH-001");
  });
}
