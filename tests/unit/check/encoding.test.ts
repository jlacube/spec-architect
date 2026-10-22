// C001-TC-1129 (C001-NFR-404; C001-T-080, finding F-5): the encoding scanner of `npm run check`
// (scripts/check/encoding.mjs) flags a UTF-8 BOM, a CR byte and invalid UTF-8, and passes a clean LF file;
// a violation in a CLI-written workspace makes the step exit non-zero.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { scanDir, violations } from "../../../scripts/check/encoding.mjs";
import { repoRoot } from "../../helpers.ts";

test("violations: BOM, CRLF and invalid UTF-8 are flagged; a clean LF file passes", () => {
  assert.deepEqual(violations(Buffer.from("# Clean\n\nÉtat — ok ✓\n", "utf8")), []);
  assert.deepEqual(violations(Buffer.from([0xef, 0xbb, 0xbf, ...Buffer.from("# BOM\n")])), ["BOM"]);
  assert.deepEqual(violations(Buffer.from("# CRLF\r\nline\r\n")), ["CR"]);
  assert.deepEqual(violations(Buffer.from("# lone CR\rx\n")), ["CR"]);
  assert.deepEqual(violations(Buffer.from([0x23, 0x20, 0xc3, 0x28, 0x0a])), ["not UTF-8"]);
  assert.deepEqual(violations(Buffer.from([0xef, 0xbb, 0xbf, 0x61, 0x0d, 0x0a, 0xff])), ["BOM", "CR", "not UTF-8"]);
  assert.deepEqual(violations(Buffer.alloc(0)), []);
});

test("scanDir: counts every file below the folder and lists the violating ones with their reasons", () => {
  const dir = realpathSync.native(mkdtempSync(join(tmpdir(), "sdd-encoding-")));
  try {
    mkdirSync(join(dir, ".sdd", "001-x"), { recursive: true });
    writeFileSync(join(dir, ".sdd", "SDD.md"), "# SDD\n");
    writeFileSync(join(dir, ".sdd", "001-x", "bom.md"), Buffer.from([0xef, 0xbb, 0xbf, ...Buffer.from("# x\n")]));
    writeFileSync(join(dir, ".sdd", "001-x", "crlf.md"), "a\r\nb\r\n");
    writeFileSync(join(dir, ".sdd", "001-x", "latin1.md"), Buffer.from([0x63, 0x61, 0x66, 0xe9, 0x0a]));
    writeFileSync(join(dir, ".sdd", "001-x", "clean.json"), '{ "a": 1 }\n');
    const scan = scanDir(join(dir, ".sdd"), dir);
    assert.equal(scan.files, 5);
    assert.deepEqual(scan.bad, [
      { path: ".sdd/001-x/bom.md", why: ["BOM"] },
      { path: ".sdd/001-x/crlf.md", why: ["CR"] },
      { path: ".sdd/001-x/latin1.md", why: ["not UTF-8"] },
    ]);
    assert.deepEqual(scanDir(join(dir, "missing")), { files: 0, bad: [] });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("the encoding step passes on the CLI-written workspaces and fails with a seeded CRLF file", { timeout: 120000 }, () => {
  const script = join(repoRoot(), "scripts", "check", "encoding.mjs");
  const clean = spawnSync(process.execPath, [script], { cwd: repoRoot(), encoding: "utf8", env: { ...process.env, SDD_TEST_ENCODING_SEED: "" } });
  assert.equal(clean.status, 0, clean.stdout + clean.stderr);
  assert.match(clean.stdout, /fx-large after status --write, trace --write: 0 of \d+ file\(s\)/);
  assert.match(clean.stdout, /fx-empty after init, change new: 0 of \d+ file\(s\)/);
  assert.match(clean.stdout, /scope \(b\)[^\n]*\n(?:[^\n]*\n)*? {2}\.sdd\/: \d+ of \d+ file\(s\)/);
  const seeded = spawnSync(process.execPath, [script], { cwd: repoRoot(), encoding: "utf8", env: { ...process.env, SDD_TEST_ENCODING_SEED: "1" } });
  assert.equal(seeded.status, 1, seeded.stdout + seeded.stderr);
  assert.match(seeded.stdout, /^ {2}\.sdd\/seeded-crlf\.md: CR$/m);
  assert.match(seeded.stdout, /FAIL — 1 violation\(s\) in files written by the CLI/);
});
