// C001-TC-130 — verifies C001-TS-130 (C001-AC-124.1, C001-REQ-124): unknown entries are preserved and reported.
// The `sdd status --write` half of the scenario is added by C001-T-017.
import { test } from "node:test";
import assert from "node:assert/strict";
import { cpSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { adoptBootstrap } from "../../../src/workspace/adopt.ts";
import { splitFrontmatter } from "../../../src/model/frontmatter.ts";
import { repoRoot } from "../../helpers.ts";
import { makeWorkspace, minimalChange, runBundled } from "../cli/helpers.ts";

function bootstrapCopy(): { root: string; cleanup: () => void } {
  const root = realpathSync.native(mkdtempSync(join(tmpdir(), "sdd-bootstrap-")));
  cpSync(join(repoRoot(), ".sdd"), join(root, ".sdd"), { recursive: true, filter: (src) => !src.includes(`${join(".sdd", "metrics")}`) });
  return { root, cleanup: () => rmSync(root, { recursive: true, force: true }) };
}

const gateLog = (text: string) => text.slice(text.indexOf("## Gate log"));

test("C001-TS-130: an unknown metrics folder is reported as LINT-WS-002 info and left untouched", () => {
  const ws = makeWorkspace(minimalChange());
  try {
    const metrics = join(ws.root, ".sdd", "metrics");
    mkdirSync(metrics);
    const content = '{"t":"2026-10-11T08:00:00Z","n":1}\r\n';
    writeFileSync(join(metrics, "snapshots.jsonl"), content);
    const r = runBundled(["lint", "--json"], { cwd: ws.root });
    assert.equal(r.code, 0, r.stderr);
    const report = JSON.parse(r.stdout) as { findings: { code: string; severity: string; path: string; message: string }[] };
    const ws002 = report.findings.filter((f) => f.code === "LINT-WS-002");
    assert.equal(ws002.length, 1);
    assert.equal(ws002[0]?.severity, "info");
    assert.equal(ws002[0]?.path, ".sdd/metrics/");
    assert.match(ws002[0]?.message ?? "", /metrics\//);
    assert.equal(readFileSync(join(metrics, "snapshots.jsonl"), "utf8"), content);
    assert.equal(runBundled(["init"], { cwd: ws.root }).code, 0);
    assert.equal(readFileSync(join(metrics, "snapshots.jsonl"), "utf8"), content);
  } finally {
    ws.cleanup();
  }
});

test("C001-TS-130 through the CLI: `sdd status --write` exits 0 and leaves the metrics folder untouched", () => {
  const ws = makeWorkspace(minimalChange());
  try {
    const metrics = join(ws.root, ".sdd", "metrics");
    mkdirSync(metrics);
    writeFileSync(join(metrics, "snapshots.jsonl"), "x\r\n");
    assert.equal(runBundled(["status", "--write"], { cwd: ws.root }).code, 0);
    assert.equal(runBundled(["lint"], { cwd: ws.root }).code, 0);
    assert.equal(readFileSync(join(metrics, "snapshots.jsonl"), "utf8"), "x\r\n");
  } finally {
    ws.cleanup();
  }
});
