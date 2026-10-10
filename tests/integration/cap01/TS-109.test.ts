// C001-TC-109 — verifies C001-TS-109 (C001-AC-106.1, C001-REQ-106): lint detects registry drift.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { makeWorkspace, runBundled } from "../cli/helpers.ts";
import { changeMd, SDD_MD } from "../workspace-fixtures.ts";

test("a registry storing phase 20-plan for a change in 10-spec is reported as LINT-REG-001", () => {
  const ws = makeWorkspace({ ".sdd/SDD.md": SDD_MD, ".sdd/001-alpha/change.md": changeMd({ nnn: "001", phase: "10-spec" }) });
  try {
    assert.equal(runBundled(["status", "--write"], { cwd: ws.root }).code, 0);
    assert.equal(runBundled(["lint"], { cwd: ws.root }).code, 0, "no drift right after a rebuild");
    const registryPath = join(ws.root, ".sdd", "registry.json");
    const reg = JSON.parse(readFileSync(registryPath, "utf8")) as { changes: { phase: string }[] };
    reg.changes[0]!.phase = "20-plan";
    writeFileSync(registryPath, JSON.stringify(reg, null, 2));
    const r = runBundled(["lint", "--json"], { cwd: ws.root });
    assert.equal(r.code, 1);
    const findings = (JSON.parse(r.stdout) as { findings: { code: string; severity: string; path: string; message: string }[] }).findings.filter((f) => f.code === "LINT-REG-001");
    assert.equal(findings.length, 1);
    assert.equal(findings[0]?.severity, "error");
    assert.equal(findings[0]?.path, ".sdd/registry.json");
    assert.equal(findings[0]?.message, "changes[0].phase: stored `20-plan`, expected `10-spec`");
  } finally {
    ws.cleanup();
  }
});
