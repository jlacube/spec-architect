// C001-TC-204 — verifies C001-TS-204 (C001-AC-204.1, C001-REQ-204): command inventory.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { splitFrontmatter } from "../../../src/model/frontmatter.ts";
import { repoRoot } from "../../helpers.ts";

const DIR = join(repoRoot(), "plugins", "architect", "commands");

test("the plugin provides /architect:ideate, /architect:specify and /architect:plan", () => {
  const names = readdirSync(DIR).filter((f) => f.endsWith(".md")).map((f) => `/architect:${f.slice(0, -3)}`);
  for (const c of ["/architect:ideate", "/architect:specify", "/architect:plan"]) assert.ok(names.includes(c), c);
});

test("every command file has a description (C001-IF-10 §1 commands of M-3 present)", () => {
  const files = readdirSync(DIR).filter((f) => f.endsWith(".md"));
  for (const c of ["init", "new", "ideate", "specify", "plan", "status", "lint", "decide", "research"]) assert.ok(files.includes(`${c}.md`), c);
  for (const f of files) assert.ok(String(splitFrontmatter(readFileSync(join(DIR, f), "utf8")).data?.["description"] ?? "").length > 10, f);
});
