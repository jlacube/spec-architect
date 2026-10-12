// C001-TC-1118 / C001-TS-1118 (C001-AC-1117.1, C001-REQ-1117): with one lint fixture altered so its
// expected error no longer occurs, `npm run check` exits non-zero and shows the results of plugin
// validate, the tests, the lint fixtures and the structure checks. The altered fixture is a copy
// (SDD_LINT_FIXTURES); the unit/integration step is left out here because this test runs inside it.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { repoRoot } from "../../helpers.ts";

test("npm run check fails on a broken lint fixture and reports every step", { timeout: 300000 }, () => {
  const root = repoRoot();
  const fixtures = realpathSync.native(mkdtempSync(join(tmpdir(), "sdd-fixtures-")));
  try {
    cpSync(join(root, "tests", "lint-fixtures"), fixtures, { recursive: true });
    // LINT-TXT-001 (placeholder words): its bad fixture no longer contains the placeholder.
    const bad = join(fixtures, "LINT-TXT-001", "bad");
    const walk = (d: string): string[] => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : e.name.endsWith(".md") ? [join(d, e.name)] : []));
    for (const f of walk(bad)) writeFileSync(f, "---\nid: X\n---\n# Clean\n\nNothing pending here.\n");
    const r = spawnSync(process.execPath, [join(root, "scripts", "check.mjs"), "--steps", "validate,fixtures,structure"], { cwd: root, encoding: "utf8", env: { ...process.env, SDD_LINT_FIXTURES: fixtures } });
    const out = r.stdout + r.stderr;
    const summary = out.split("\n").filter((l) => /^(===|PASS|FAIL|SKIP|not ok|# (pass|fail))/.test(l)).join("\n");
    assert.notEqual(r.status, 0, summary);
    assert.match(out, /=== npm run check ===/);
    assert.match(out, /(PASS|SKIP) {2}claude plugin validate/);
    assert.match(out, /FAIL {2}lint fixtures/);
    assert.match(out, /PASS {2}plugin structure checks/);
  } finally {
    rmSync(fixtures, { recursive: true, force: true });
  }
});
