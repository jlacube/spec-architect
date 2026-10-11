// C001-TC-705 — verifies C001-TS-705 (C001-AC-705.1, C001-REQ-705): quick single-file lint on
// fx-large (500 artifact files, C001-T-027). The p95 measurement of C001-NFR-102 is bench/lint-quick.mjs.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { generateLarge } from "../../fixtures/gen-large.mjs";
import { runBundled } from "../cli/helpers.ts";

test("lint --quick --file on fx-large reports only findings of that file, within 800 ms", () => {
  const root = realpathSync.native(mkdtempSync(join(tmpdir(), "sdd-ts705-")));
  try {
    assert.equal(generateLarge(root), 500);
    // Placeholders in the target and in another file: only the target's may be reported.
    const rel = ".sdd/010-change-010/10-spec/20-capabilities/CAP-02-area-2/requirements.md";
    const target = join(root, ...rel.split("/"));
    writeFileSync(target, readFileSync(target, "utf8") + "\nThreshold: TBD\n");
    const other = join(root, ".sdd", "011-change-011", "10-spec", "30-nfr", "nfr.md");
    writeFileSync(other, readFileSync(other, "utf8") + "\nTBD\n");
    const times: number[] = [];
    let last = { code: 0, stdout: "", stderr: "" };
    for (let i = 0; i < 5; i++) {
      const t0 = performance.now();
      last = runBundled(["lint", "--quick", "--file", target, "--json"], { cwd: root });
      times.push(performance.now() - t0);
    }
    const report = JSON.parse(last.stdout) as { scope: { quick: boolean; file: string }; findings: { code: string; path: string }[] };
    assert.equal(report.scope.quick, true);
    assert.equal(report.scope.file, rel);
    assert.deepEqual(report.findings.map((f) => [f.code, f.path]), [["LINT-TXT-001", rel]]);
    times.sort((a, b) => a - b);
    assert.ok(times[times.length - 1]! <= 800, `quick lint took ${times.map((t) => t.toFixed(0)).join(", ")} ms`);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
