// C001-TC-105 — verifies C001-TS-105 (C001-AC-104.1, C001-REQ-104): registry rebuilt from manifests.
import { test } from "node:test";
import assert from "node:assert/strict";
import { cpSync, existsSync, mkdtempSync, readFileSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import { generateLarge } from "../../fixtures/gen-large.mjs";
import { repoRoot } from "../../helpers.ts";
import { makeWorkspace, runBundled } from "../cli/helpers.ts";
import { changeMd, SDD_MD } from "../workspace-fixtures.ts";

export const validateRegistry = new Ajv2020({ strict: false }).compile(
  JSON.parse(readFileSync(join(repoRoot(), ".sdd", "001-architect-agent-suite", "10-spec", "50-interfaces", "registry.schema.json"), "utf8")) as object,
);

test("status --write rebuilds a deleted registry.json from the change manifests", () => {
  const ws = makeWorkspace({
    ".sdd/SDD.md": SDD_MD,
    ".sdd/001-alpha/change.md": changeMd({ nnn: "001", phase: "10-spec", phases: { "00-ideation": { status: "approved", approved_hash: "sha256:" + "a".repeat(64), approved_at: "2026-10-01", approved_by: "p01" }, "10-spec": { status: "draft" } } }),
    ".sdd/002-beta/change.md": changeMd({ nnn: "002", phase: "00-ideation" }),
  });
  try {
    const registryPath = join(ws.root, ".sdd", "registry.json");
    assert.equal(existsSync(registryPath), false);
    const r = runBundled(["status", "--write"], { cwd: ws.root });
    assert.equal(r.code, 0, r.stderr);
    const reg = JSON.parse(readFileSync(registryPath, "utf8")) as { changes: { id: string; phase: string; phases: Record<string, unknown> }[] };
    assert.ok(validateRegistry(reg), JSON.stringify(validateRegistry.errors));
    assert.deepEqual(reg.changes.map((c) => [c.id, c.phase]), [["CHG-001", "10-spec"], ["CHG-002", "00-ideation"]]);
    assert.deepEqual(reg.changes[0]?.phases["00-ideation"], { status: "approved", approved_hash: "sha256:" + "a".repeat(64), approved_at: "2026-10-01", approved_by: "p01" });
  } finally {
    ws.cleanup();
  }
});

test("status --write on a copy of this repository's workspace produces a schema-valid registry", () => {
  const root = realpathSync.native(mkdtempSync(join(tmpdir(), "sdd-repo-")));
  try {
    cpSync(join(repoRoot(), ".sdd"), join(root, ".sdd"), { recursive: true });
    assert.equal(runBundled(["status", "--write"], { cwd: root }).code, 0);
    const reg = JSON.parse(readFileSync(join(root, ".sdd", "registry.json"), "utf8")) as { changes: { id: string; implementation: { tasks: { total: number } } }[] };
    assert.ok(validateRegistry(reg), JSON.stringify(validateRegistry.errors));
    assert.equal(reg.changes[0]?.id, "CHG-001");
    assert.equal(reg.changes[0]?.implementation.tasks.total, 57, "58 tasks, C001-T-071 dropped");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("on fx-large (20 changes), a deleted registry is rebuilt, schema-valid, with every change", () => {
  const root = realpathSync.native(mkdtempSync(join(tmpdir(), "sdd-fx-large-")));
  try {
    generateLarge(root);
    assert.equal(existsSync(join(root, ".sdd", "registry.json")), false);
    assert.equal(runBundled(["status", "--write"], { cwd: root }).code, 0);
    const reg = JSON.parse(readFileSync(join(root, ".sdd", "registry.json"), "utf8")) as { changes: { id: string; phase: string }[] };
    assert.ok(validateRegistry(reg), JSON.stringify(validateRegistry.errors));
    assert.equal(reg.changes.length, 20);
    assert.ok(reg.changes.every((c) => c.phase === "20-plan"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
