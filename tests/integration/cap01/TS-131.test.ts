// C001-TC-131 — verifies C001-TS-131 (C001-AC-125.1, C001-REQ-125): manifest fields.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { splitFrontmatter } from "../../../src/model/frontmatter.ts";
import { makeWorkspace, runBundled } from "../cli/helpers.ts";

test("change.md carries the C001-IF-03 §2 fields and the Index and Gate log sections", () => {
  const ws = makeWorkspace({ "README.md": "x\n" });
  try {
    assert.equal(runBundled(["init"], { cwd: ws.root }).code, 0);
    const r = runBundled(["change", "new", "X", "--profile", "full", "--kind", "brownfield"], { cwd: ws.root });
    assert.equal(r.code, 0, r.stderr);
    const text = readFileSync(join(ws.root, ".sdd", "001-x", "change.md"), "utf8");
    const doc = splitFrontmatter(text);
    assert.equal(doc.error, undefined);
    const fm = doc.data as Record<string, unknown>;
    assert.equal(fm["id"], "CHG-001");
    assert.equal(fm["title"], "X");
    assert.equal(fm["profile"], "full");
    assert.equal(fm["kind"], "brownfield");
    assert.equal(fm["status"], "active");
    assert.equal(fm["phase"], "00-ideation");
    const phases = fm["phases"] as Record<string, Record<string, unknown>>;
    for (const p of ["00-ideation", "10-spec", "20-plan"]) {
      assert.equal(phases[p]?.["status"], "not-started", p);
      for (const k of ["approved_hash", "approved_at", "approved_by"]) assert.ok(k in (phases[p] ?? {}), `${p}.${k}`);
    }
    assert.deepEqual(fm["implementation"], { status: "not-started" });
    assert.ok(Array.isArray(fm["owners"]));
    assert.deepEqual(fm["defects"], []);
    assert.deepEqual(fm["waivers"], []);
    assert.equal(fm["stopped"], null);
    assert.match(text, /^## Index$/m);
    assert.match(text, /^## Gate log$/m);
    assert.match(text, /^\| Date \| Gate \| Decision \| Words of approver \| Waivers \| Usage \|$/m);
  } finally {
    ws.cleanup();
  }
});

test("--kind and --profile values are validated", () => {
  const ws = makeWorkspace({ "README.md": "x\n" });
  try {
    runBundled(["init"], { cwd: ws.root });
    assert.match(runBundled(["change", "new", "X", "--kind", "legacy"], { cwd: ws.root }).stderr, /--kind must be one of greenfield, brownfield, mixed/);
    assert.match(runBundled(["change", "new", "X", "--profile", "medium"], { cwd: ws.root }).stderr, /--profile must be one of lite, full/);
    assert.match(runBundled(["change", "new", "!!!"], { cwd: ws.root }).stderr, /title yields an empty slug/);
  } finally {
    ws.cleanup();
  }
});
