// C001-T-077 — `sdd serena-config <plugin-data-dir>` (C001-REQ-1013, C001-IF-01): creates Serena's config in
// the plugin data folder, updates only the required keys of an existing one, and is idempotent.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runInProcess } from "../cli/helpers.ts";

function withDir(fn: (dir: string) => void) {
  const dir = mkdtempSync(join(tmpdir(), "sdd-serena-"));
  try {
    fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test("a missing config is created with the dashboard off, project folders inside the data folder and projects", () => {
  withDir((dir) => {
    const r = runInProcess(["serena-config", "data"], { cwd: dir });
    assert.equal(r.code, 0, r.stderr);
    assert.match(r.stdout, /^created: /);
    const text = readFileSync(join(dir, "data", "serena", "serena_config.yml"), "utf8");
    assert.match(text, /^web_dashboard: false$/m);
    assert.match(text, /^web_dashboard_open_on_launch: false$/m);
    const loc = /^project_serena_folder_location: "(.+)"$/m.exec(text)?.[1] ?? "";
    assert.ok(loc.startsWith(join(dir, "data", "serena", "projects").split("\\").join("/")), loc);
    assert.ok(loc.endsWith("/$projectFolderName/.serena"), loc);
    assert.match(text, /^projects: \[\]$/m);
  });
});

test("an existing config keeps its other keys and its projects; only the required keys change", () => {
  withDir((dir) => {
    mkdirSync(join(dir, "serena"), { recursive: true });
    const path = join(dir, "serena", "serena_config.yml");
    writeFileSync(path, "language_backend: LSP\nweb_dashboard: true\nproject_serena_folder_location: \"$projectDir/.serena\"\nprojects:\n- C:/repo\n");
    const r = runInProcess(["serena-config", dir], { cwd: dir });
    assert.match(r.stdout, /^updated: /);
    const text = readFileSync(path, "utf8");
    assert.match(text, /^language_backend: LSP$/m);
    assert.match(text, /^web_dashboard: false$/m);
    assert.doesNotMatch(text, /\$projectDir\/\.serena/);
    assert.match(text, /^projects:\n- C:\/repo$/m);
    assert.match(runInProcess(["serena-config", dir], { cwd: dir }).stdout, /^unchanged: /, "a second run changes nothing");
  });
});
