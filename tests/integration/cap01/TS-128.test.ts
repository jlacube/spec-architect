// C001-TC-128 — verifies C001-TS-128 (C001-AC-122.1, C001-REQ-122): no REQ in an inventory stub.
import { test } from "node:test";
import assert from "node:assert/strict";
import { makeWorkspace, REBUILD, runBundled } from "../cli/helpers.ts";

test("a REQ heading in an inventory-only living file is reported as LINT-LIV-001", () => {
  const living = "---\ncapability: auth\ninventory_only: true\nupdated: 2026-10-01\n---\n# Auth\n\n## Purpose\nLogin.\n\n### C003-REQ-004 — Lockout\n";
  const ws = makeWorkspace({ ".sdd/SDD.md": "# SDD\n", ".sdd/_living/CAP-auth.md": living, ".sdd/registry.json": REBUILD });
  try {
    const r = runBundled(["lint", "--json"], { cwd: ws.root });
    assert.equal(r.code, 1);
    const liv = (JSON.parse(r.stdout) as { findings: { code: string; path: string; line?: number; ids?: string[] }[] }).findings.filter((f) => f.code === "LINT-LIV-001");
    assert.deepEqual(liv.map((f) => [f.path, f.line, f.ids]), [[".sdd/_living/CAP-auth.md", 11, ["C003-REQ-004"]]]);
  } finally {
    ws.cleanup();
  }
});

test("a living file with inventory_only: false may contain requirements", () => {
  const living = "---\ncapability: auth\ninventory_only: false\nupdated: 2026-10-01\n---\n# Auth\n\n### C003-REQ-004 — Lockout\n";
  const ws = makeWorkspace({ ".sdd/SDD.md": "# SDD\n", ".sdd/_living/CAP-auth.md": living, ".sdd/registry.json": REBUILD });
  try {
    const r = runBundled(["lint", "--json"], { cwd: ws.root });
    assert.equal((JSON.parse(r.stdout) as { findings: { code: string }[] }).findings.some((f) => f.code === "LINT-LIV-001"), false);
  } finally {
    ws.cleanup();
  }
});
