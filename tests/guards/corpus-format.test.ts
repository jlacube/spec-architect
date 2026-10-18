// C002-TC-610 (C002-T-007): the guard corpora keep one case format, shared by the corpus tests and the
// replay suite (C002-IF-009 §2): every case has a unique ID, a known category and only known fields;
// the optional cwd, env, requires and dialect fields are well formed. The field lists live in
// ./fixture.ts. The C002-TS-610 rows of new cases are added by C002-T-008, -009, -010 and -059.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { repoRoot } from "../helpers.ts";
import { BASH_CATEGORIES, BASH_FIELDS, PATH_CATEGORIES, PATH_FIELDS, formatProblems } from "./fixture.ts";

const raw = (name: string) =>
  (JSON.parse(readFileSync(join(repoRoot(), "tests", "guards", name), "utf8")) as { cases: Record<string, unknown>[] }).cases;

test("path corpus cases have unique IDs, known categories and only known fields", () => {
  const cases = raw("path-corpus.json");
  assert.ok(cases.length >= 256, `at least the 256 existing path cases (${cases.length})`);
  assert.deepEqual(formatProblems(cases, PATH_FIELDS, PATH_CATEGORIES), []);
});

test("shell corpus cases have unique IDs, known categories and only known fields", () => {
  const cases = raw("bash-corpus.json");
  assert.ok(cases.length >= 277, `at least the 277 existing shell cases (${cases.length})`);
  assert.deepEqual(formatProblems(cases, BASH_FIELDS, BASH_CATEGORIES), []);
});

test("the format check rejects an unknown field, an unknown category and a duplicate ID", () => {
  const base = { id: "BG-900", category: "sdd", tool: "Bash", agent: "architect:sdd-auditor", command: "sdd lint", expect: "allow" };
  assert.deepEqual(formatProblems([base], BASH_FIELDS, BASH_CATEGORIES), []);
  assert.deepEqual(formatProblems([{ ...base, workdir: "{repo}/src" }], BASH_FIELDS, BASH_CATEGORIES), ["BG-900: unknown field workdir"]);
  assert.deepEqual(formatProblems([{ ...base, path: "x" }], BASH_FIELDS, BASH_CATEGORIES), ["BG-900: unknown field path"]);
  assert.deepEqual(formatProblems([{ ...base, category: "serena?" }], BASH_FIELDS, BASH_CATEGORIES), ['BG-900: unknown category "serena?"']);
  assert.deepEqual(formatProblems([base, base], BASH_FIELDS, BASH_CATEGORIES), ["BG-900: duplicate id"]);
});

test("the optional cwd, env, requires and dialect fields are accepted when well formed and rejected otherwise", () => {
  const base = { id: "BG-901", category: "sdd", tool: "Bash", agent: "architect:sdd-auditor", command: "sdd lint", expect: "allow" };
  const ok = { ...base, cwd: "{repo}/pkg", env: { CLAUDE_PLUGIN_DATA: "{repo}/../data", OTHER: null }, requires: "file-symlink", dialect: "bash" };
  assert.deepEqual(formatProblems([ok], BASH_FIELDS, BASH_CATEGORIES), []);
  assert.deepEqual(formatProblems([{ ...base, cwd: null }], BASH_FIELDS, BASH_CATEGORIES), []);
  assert.deepEqual(formatProblems([{ ...base, tool: "PowerShell", dialect: "powershell" }], BASH_FIELDS, BASH_CATEGORIES), []);
  assert.deepEqual(formatProblems([{ ...base, cwd: 3 }], BASH_FIELDS, BASH_CATEGORIES), ["BG-901: cwd is neither a string nor null"]);
  assert.deepEqual(formatProblems([{ ...base, env: { A: 1 } }], BASH_FIELDS, BASH_CATEGORIES), ["BG-901: env is not an object of strings or null"]);
  assert.deepEqual(formatProblems([{ ...base, requires: "serena" }], BASH_FIELDS, BASH_CATEGORIES), ['BG-901: unknown host capability "serena"']);
  assert.deepEqual(formatProblems([{ ...base, dialect: "cmd" }], BASH_FIELDS, BASH_CATEGORIES), ['BG-901: unknown dialect "cmd"']);
  assert.deepEqual(formatProblems([{ ...base, dialect: "powershell" }], BASH_FIELDS, BASH_CATEGORIES), ['BG-901: dialect powershell does not match tool "Bash"']);
  const path = { id: "PG-901", category: "cwd", tool: "Write", agent: "architect:sdd-spec-writer", path: ".sdd/a.md", cwd: "{repo}/src", env: { CLAUDE_PLUGIN_DATA: "{outside}" }, expect: "deny" };
  assert.deepEqual(formatProblems([path], PATH_FIELDS, PATH_CATEGORIES), []);
  assert.deepEqual(formatProblems([{ ...path, command: "x" }], PATH_FIELDS, PATH_CATEGORIES), ["PG-901: unknown field command"]);
});
