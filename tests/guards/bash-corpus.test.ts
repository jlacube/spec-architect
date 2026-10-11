// C001-REQ-1106, C001-REQ-1107 (C001-T-051): the bash guard decides every case of
// tests/guards/bash-corpus.json as expected, with the expected rule on each denial.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { decideBash } from "../../src/hooks/guard-bash.ts";
import { parseHookInput } from "../../src/hooks/input.ts";
import { repoRoot } from "../helpers.ts";

interface BashCase {
  id: string;
  category: string;
  tool: string;
  agent: unknown;
  command: unknown;
  cwd?: null;
  stdin?: string;
  expect: "allow" | "deny";
  rule?: string;
}

export function loadBashCorpus(): BashCase[] {
  return (JSON.parse(readFileSync(join(repoRoot(), "tests", "guards", "bash-corpus.json"), "utf8")) as { cases: BashCase[] }).cases;
}

export function bashHookInput(c: BashCase, repo: string): string {
  if (c.stdin !== undefined) return c.stdin;
  const sdd = join(repoRoot(), "plugins", "architect", "scripts", "sdd.mjs").split("\\").join("/");
  const fill = (s: string) => s.split("{sdd}").join(sdd).split("{repo}").join(repo);
  const doc: Record<string, unknown> = { session_id: "s", hook_event_name: "PreToolUse", tool_name: c.tool };
  if (c.cwd !== null) doc["cwd"] = repo;
  if (c.agent !== null) doc["agent_type"] = c.agent;
  doc["tool_input"] = { command: typeof c.command === "string" ? fill(c.command) : c.command, description: "corpus" };
  return JSON.stringify(doc);
}

test("the bash guard corpus is decided 100% as expected, with the expected rule", (t) => {
  const repo = realpathSync.native(mkdtempSync(join(tmpdir(), "sdd-bash-"))).split("\\").join("/");
  mkdirSync(join(repo, ".sdd"));
  try {
    const cases = loadBashCorpus();
    const wrong: string[] = [];
    const matrix = { "allow/allow": 0, "allow/deny": 0, "deny/allow": 0, "deny/deny": 0 };
    for (const c of cases) {
      const d = decideBash(parseHookInput(bashHookInput(c, repo)));
      const got = d.allow ? "allow" : "deny";
      matrix[`${c.expect}/${got}`]++;
      const rule = d.allow ? undefined : d.message.split(":")[0];
      if (got !== c.expect || rule !== c.rule) wrong.push(`${c.id} ${c.category} ${JSON.stringify(c.command)}: expected ${c.rule ?? c.expect}, got ${rule ?? got}`);
    }
    t.diagnostic(`cases ${cases.length}; expected/decided ${JSON.stringify(matrix)}`);
    assert.deepEqual(wrong, [], wrong.join("\n"));
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test("bash case IDs are unique and every denial names a rule", () => {
  const cases = loadBashCorpus();
  assert.equal(new Set(cases.map((c) => c.id)).size, cases.length);
  for (const c of cases) assert.equal(c.expect === "deny", c.rule !== undefined, c.id);
});
