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

// C002-TS-610 rows of C002-T-008 (C002-REQ-503), C002-T-009, C002-T-010 and C002-T-059: the shell corpus holds the new kinds of case.
const TS_610_SHELL: [kind: string, command: string, expect: "allow" | "deny"][] = [
  ["bare sdd command", "sdd lint 002", "allow"],
  ["node --version", "node --version", "allow"],
  ["redirection inside an allowlisted command", "sdd status > out.txt", "deny"],
  // C002-T-009 (C002-REQ-521): the fixture root {repo} stands for the spec's C:/repo.
  ["writing sdd subcommand with --cwd outside the repository root", "sdd change stop 001 --reason x --cwd {repo}/../other-repo", "deny"],
  ["writing sdd subcommand with --cwd inside the repository root", "sdd trace 001 --write --cwd {repo}/pkg", "allow"],
  // C002-T-010 (C002-REQ-517): {repo}/../fx-data stands for the spec's C:/fx-data, outside the root.
  ["serena-config with --user-data", "sdd serena-config --user-data", "allow"],
  ["serena-config with a folder outside the repository", "sdd serena-config {repo}/../fx-data", "allow"],
  ["serena-config with a folder inside the repository", "sdd serena-config src", "deny"],
  ["serena-launch with --user-data", "sdd serena-launch --user-data -- start-mcp-server", "allow"],
  ["serena-launch with a folder outside the repository", "sdd serena-launch {repo}/../fx-data -- start-mcp-server", "allow"],
  ["serena-launch with a folder inside the repository", "sdd serena-launch src -- start-mcp-server", "deny"],
  // C002-T-059 (C002-REQ-325).
  ["Copilot install command, bare form", "sdd install copilot", "deny"],
  ["Copilot install command, script form", "node C:/pkg/scripts/sdd.mjs install copilot --package C:/pkg", "deny"],
  ["Copilot install command with --cwd inside the repository root", "sdd install copilot --cwd {repo}/pkg", "deny"],
];
for (const [kind, command, expect] of TS_610_SHELL) {
  test(`C002-TS-610: the shell corpus holds a case of the kind "${kind}" (${command} → ${expect})`, () => {
    const cases = raw("bash-corpus.json");
    assert.ok(cases.some((c) => c["command"] === command && c["expect"] === expect && !("stdin" in c)), `${command} expecting ${expect}`);
  });
}

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
