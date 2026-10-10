// C001-TC-705 — verifies C001-TS-705 (C001-AC-705.1, C001-REQ-705): quick single-file lint.
// The 500-file workspace is generated here; fx-large (C001-T-027) is the benchmark fixture and the
// NFR p95 measurement is C001-T-065.
import { test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { makeWorkspace, runBundled } from "../cli/helpers.ts";
import { changeMd } from "../workspace-fixtures.ts";

test("lint --quick --file reports only findings of that file, within 800 ms", () => {
  const files: Record<string, string> = { ".sdd/SDD.md": "# SDD\nTBD\n", ".sdd/registry.json": "{}\n" };
  for (let c = 1; c <= 5; c++) {
    const nnn = String(c).padStart(3, "0");
    files[`.sdd/${nnn}-c/change.md`] = changeMd({ nnn });
    for (let f = 1; f <= 100; f++) {
      const cap = String(f).padStart(2, "0");
      files[`.sdd/${nnn}-c/10-spec/20-capabilities/CAP-${cap}-x/requirements.md`] =
        `---\nid: C${nnn}-CAP-${cap}\n---\n### C${nnn}-REQ-${f}01 — R\n- **Statement:** THE x SHALL y.\n- **Stories:** C${nnn}-US-999\n\nValue: TBD\n`;
    }
  }
  const ws = makeWorkspace(files);
  try {
    const target = join(ws.root, ".sdd", "003-c", "10-spec", "20-capabilities", "CAP-42-x", "requirements.md");
    const times: number[] = [];
    let last = { code: 0, stdout: "", stderr: "" };
    for (let i = 0; i < 5; i++) {
      const t0 = performance.now();
      last = runBundled(["lint", "--quick", "--file", target, "--json"], { cwd: ws.root });
      times.push(performance.now() - t0);
    }
    const report = JSON.parse(last.stdout) as { scope: { quick: boolean; file: string }; findings: { code: string; path: string }[] };
    assert.equal(report.scope.quick, true);
    assert.equal(report.scope.file, ".sdd/003-c/10-spec/20-capabilities/CAP-42-x/requirements.md");
    assert.ok(report.findings.length > 0);
    for (const f of report.findings) assert.equal(f.path, report.scope.file);
    assert.ok(report.findings.some((f) => f.code === "LINT-TXT-001"));
    times.sort((a, b) => a - b);
    assert.ok(times[times.length - 1]! <= 800, `quick lint took ${times.map((t) => t.toFixed(0)).join(", ")} ms`);
  } finally {
    ws.cleanup();
  }
});
