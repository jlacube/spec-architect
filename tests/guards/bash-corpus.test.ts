// C001-REQ-1106, C001-REQ-1107 (C001-T-051): the bash guard decides every case of
// tests/guards/bash-corpus.json as expected, with the expected rule on each denial.
//
// Case format (C002-T-007; read the same way by the replay suite, C002-T-040; checked by
// tests/guards/corpus-format.test.ts, field lists in ./fixture.ts):
//   id, category, tool, agent, expect   as before; `rule` names the expected rule of a denial
//   command    the command line; `{sdd}` is the bundled CLI path, `{repo}` the fixture repository
//   cwd        absent: {repo}; null: no cwd in the hook input; a string: that folder (placeholders),
//              for cases whose working folder is not the fixture root
//   env        variables set while the case is decided (placeholders; null unsets), e.g. CLAUDE_PLUGIN_DATA
//   requires   host capability; the case is skipped here when the fixture lacks it (none is probed yet)
//   dialect    bash or powershell, must match the tool (PowerShell: powershell); absent: from the tool
//   stdin      raw hook input used unchanged
//   note       free text
// The fixture repository has .sdd and .git, so {repo} is its repository root, and the folder link
// {repo}/link-out to a folder outside it.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { decideBash } from "../../src/hooks/guard-bash.ts";
import { parseHookInput } from "../../src/hooks/input.ts";
import { repoRoot } from "../helpers.ts";
import { type BashCase, loadBashCorpus, withEnv } from "./fixture.ts";

/** Resolves the `{sdd}` and `{repo}` placeholders of a shell case. */
export function bashResolver(repo: string): (s: string) => string {
  const sdd = join(repoRoot(), "plugins", "architect", "scripts", "sdd.mjs").split("\\").join("/");
  return (s: string) => s.split("{sdd}").join(sdd).split("{repo}").join(repo);
}

export function bashHookInput(c: BashCase, repo: string): string {
  if (c.stdin !== undefined) return c.stdin;
  const fill = bashResolver(repo);
  const doc: Record<string, unknown> = { session_id: "s", hook_event_name: "PreToolUse", tool_name: c.tool };
  if (c.cwd === undefined) doc["cwd"] = repo;
  else if (c.cwd !== null) doc["cwd"] = fill(c.cwd);
  if (c.agent !== null) doc["agent_type"] = c.agent;
  doc["tool_input"] = { command: typeof c.command === "string" ? fill(c.command) : c.command, description: "corpus" };
  return JSON.stringify(doc);
}

test("the bash guard corpus is decided 100% as expected, with the expected rule", (t) => {
  // {repo} is <base>/repository-root, so a case can leave the root and come back by its name (C002-TS-527).
  const base = realpathSync.native(mkdtempSync(join(tmpdir(), "sdd-bash-"))).split("\\").join("/");
  const repo = `${base}/repository-root`;
  mkdirSync(join(repo, ".sdd"), { recursive: true });
  mkdirSync(join(repo, ".git"));
  const linkType = process.platform === "win32" ? "junction" : "dir";
  // {repo}/link-out: a folder link from inside the root to a folder outside it (C002-TS-536).
  const outside = realpathSync.native(mkdtempSync(join(tmpdir(), "sdd-bash-out-")));
  symlinkSync(outside, join(repo, "link-out"), linkType);
  // {repo}-link: a folder link from outside the root to the root (C002-TS-527 "C:/repo-link").
  symlinkSync(repo, `${repo}-link`, linkType);
  const capabilities = new Set<string>();
  try {
    const cases = loadBashCorpus();
    const wrong: string[] = [];
    const matrix = { "allow/allow": 0, "allow/deny": 0, "deny/allow": 0, "deny/deny": 0 };
    let run = 0;
    for (const c of cases) {
      if (c.requires && !capabilities.has(c.requires)) continue;
      run++;
      const d = withEnv(c.env, bashResolver(repo), () => decideBash(parseHookInput(bashHookInput(c, repo))));
      const got = d.allow ? "allow" : "deny";
      matrix[`${c.expect}/${got}`]++;
      const rule = d.allow ? undefined : d.message.split(":")[0];
      if (got !== c.expect || rule !== c.rule) wrong.push(`${c.id} ${c.category} ${JSON.stringify(c.command)}: expected ${c.rule ?? c.expect}, got ${rule ?? got}`);
    }
    t.diagnostic(`cases run ${run} of ${cases.length}; expected/decided ${JSON.stringify(matrix)}`);
    assert.deepEqual(wrong, [], wrong.join("\n"));
  } finally {
    rmSync(base, { recursive: true, force: true });
    rmSync(outside, { recursive: true, force: true });
  }
});

test("bash case IDs are unique and every denial names a rule", () => {
  const cases = loadBashCorpus();
  assert.equal(new Set(cases.map((c) => c.id)).size, cases.length);
  for (const c of cases) assert.equal(c.expect === "deny", c.rule !== undefined, c.id);
});
