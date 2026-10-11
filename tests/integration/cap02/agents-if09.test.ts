// Every agent file written so far matches its row of C001-IF-09 (name, model, effort, exact tool set,
// preloaded skills) — the check PLG-TOOLS-001 of C001-T-061 will run on the whole plugin.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { splitFrontmatter } from "../../../src/model/frontmatter.ts";
import { repoRoot } from "../../helpers.ts";

const IF09 = join(repoRoot(), ".sdd", "001-architect-agent-suite", "10-spec", "50-interfaces", "agents.md");
const AGENTS = join(repoRoot(), "plugins", "architect", "agents");

/** Splits a comma list, keeping `Agent(a, b)` together. */
function list(s: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = "";
  for (const ch of s.replace(/`/g, "")) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      out.push(cur.trim());
      cur = "";
    } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out.map((x) => x.replace(/\s*,\s*/g, ", "));
}

const rows = readFileSync(IF09, "utf8").split("\n").filter((l) => /^\| A\d \|/.test(l)).map((l) => l.split("|").map((c) => c.trim()));

for (const r of rows) {
  const name = r[2]!.replace(/`/g, "");
  test(`${name} matches C001-IF-09 ${r[1]} (when written)`, (t) => {
    const file = join(AGENTS, `${name}.md`);
    if (!existsSync(file)) return t.skip("not written yet");
    const fm = splitFrontmatter(readFileSync(file, "utf8")).data ?? {};
    assert.equal(fm["name"], name);
    assert.equal(fm["model"], r[3]);
    assert.equal(fm["effort"], r[4]);
    assert.deepEqual(list(String(fm["tools"])), list(r[5]!));
    assert.deepEqual(list(String(fm["skills"])), list(r[6]!));
  });
}
