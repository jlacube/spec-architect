// C001-TC-701 — verifies C001-TS-701 (C001-AC-701.1, C001-REQ-701): lint scope.
// Each file carries the placeholder word TBD, so the files checked are the files that report
// LINT-TXT-001.
import { test } from "node:test";
import assert from "node:assert/strict";
import { makeWorkspace, REBUILD, runBundled } from "../cli/helpers.ts";
import { changeMd } from "../workspace-fixtures.ts";

const marker = (id: string, artifact: string, phase: string) =>
  `---\nid: ${id}\nartifact: ${artifact}\nchange: CHG-x\nphase: ${phase}\nstatus: draft\n---\n# ${id}\n\nThreshold: TBD\n`;

function fixture() {
  return makeWorkspace({
    ".sdd/SDD.md": "---\nsdd_version: 1\nworkspace: .sdd\ngenerator: architect-plugin@0.0.1\nid_scheme: x\n---\n# SDD\nNote: TBD\n<!-- sdd:status:begin -->\n<!-- sdd:status:end -->\n",
    ".sdd/_living/CAP-auth.md": "---\ncapability: auth\ninventory_only: true\nupdated: 2026-10-01\n---\n# Auth\nPurpose: TBD\n",
    ".sdd/_archive/001-old/change.md": changeMd({ nnn: "001", status: "archived" }),
    ".sdd/_archive/001-old/10-spec/notes.md": marker("C001-SPEC-X", "spec/x", "10-spec"),
    ".sdd/002-two/change.md": changeMd({ nnn: "002" }),
    ".sdd/002-two/10-spec/notes.md": marker("C002-SPEC-X", "spec/x", "10-spec"),
    ".sdd/003-three/change.md": changeMd({ nnn: "003", phase: "20-plan" }),
    ".sdd/003-three/10-spec/notes.md": marker("C003-SPEC-X", "spec/x", "10-spec"),
    ".sdd/003-three/20-plan/notes.md": marker("C003-PLAN-X", "plan/x", "20-plan"),
    ".sdd/registry.json": REBUILD,
  });
}

function checked(args: string[], cwd: string): string[] {
  const r = runBundled(["lint", ...args, "--json"], { cwd });
  const report = JSON.parse(r.stdout) as { findings: { code: string; path: string }[] };
  return [...new Set(report.findings.filter((f) => f.code === "LINT-TXT-001").map((f) => f.path))].sort();
}

test("lint 002 checks change 002 only", () => {
  const ws = fixture();
  try {
    assert.deepEqual(checked(["002"], ws.root), [".sdd/002-two/10-spec/notes.md"]);
  } finally {
    ws.cleanup();
  }
});

test("lint without arguments checks changes 002 and 003 plus SDD.md, registry.json and _living/", () => {
  const ws = fixture();
  try {
    assert.deepEqual(checked([], ws.root), [
      ".sdd/002-two/10-spec/notes.md",
      ".sdd/003-three/10-spec/notes.md",
      ".sdd/003-three/20-plan/notes.md",
      ".sdd/SDD.md",
      ".sdd/_living/CAP-auth.md",
    ]);
    const r = runBundled(["lint", "--json"], { cwd: ws.root });
    assert.deepEqual((JSON.parse(r.stdout) as { scope: { changes: string[] } }).scope.changes, ["CHG-002", "CHG-003"]);
  } finally {
    ws.cleanup();
  }
});

test("lint 003 --phase 20-plan checks change 003 files under 20-plan/", () => {
  const ws = fixture();
  try {
    assert.deepEqual(checked(["003", "--phase", "20-plan"], ws.root), [".sdd/003-three/20-plan/notes.md"]);
  } finally {
    ws.cleanup();
  }
});

test("cross-phase rules still see the whole change under --phase", () => {
  // A 20-plan task implementing a requirement defined in 10-spec is not dangling (TR-12).
  const ws = makeWorkspace({
    ".sdd/SDD.md": "# SDD\n",
    ".sdd/004-x/change.md": changeMd({ nnn: "004", phase: "20-plan" }),
    ".sdd/004-x/10-spec/20-capabilities/CAP-01-a/requirements.md": "---\nid: C004-CAP-01\n---\n### C004-REQ-101 — R\n- **Statement:** THE x SHALL y.\n",
    ".sdd/004-x/20-plan/50-tasks/T-001-t.md": "---\nid: C004-T-001\nimplements: [C004-REQ-101]\nverified_by: [C004-REQ-999]\n---\n# T\n",
    ".sdd/registry.json": REBUILD,
  });
  try {
    const r = runBundled(["lint", "004", "--phase", "20-plan", "--json"], { cwd: ws.root });
    const tr12 = (JSON.parse(r.stdout) as { findings: { code: string; ids?: string[] }[] }).findings.filter((f) => f.code === "TR-12");
    assert.deepEqual(tr12.map((f) => f.ids), [["C004-REQ-999"]]);
  } finally {
    ws.cleanup();
  }
});
