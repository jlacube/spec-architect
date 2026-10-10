// C001-TC-107 — verifies C001-TS-107 (C001-AC-105.1, C001-REQ-105): status block content.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { readStatusBlock } from "../../../src/workspace/sddmd.ts";
import { makeWorkspace, runBundled } from "../cli/helpers.ts";
import { changeMd, SDD_MD, taskMd } from "../workspace-fixtures.ts";

test("the status block lists the two non-archived changes with phase, status, tasks and open defects", () => {
  const files: Record<string, string> = {
    ".sdd/SDD.md": SDD_MD,
    ".sdd/_archive/001-old/change.md": changeMd({ nnn: "001", status: "archived", phase: "20-plan" }),
    ".sdd/002-beta/change.md": changeMd({ nnn: "002", title: "Beta", phase: "10-spec", phases: { "10-spec": { status: "draft" } } }),
    ".sdd/003-gamma/change.md": changeMd({
      nnn: "003",
      title: "Gamma",
      phase: "20-plan",
      phases: { "20-plan": { status: "approved", approved_hash: "sha256:" + "b".repeat(64), approved_at: "2026-10-05", approved_by: "p01" } },
      defects: [
        { id: "D-001", ref: "C003-REQ-101", summary: "wrong unit", reporter: "impl", date: "2026-10-06", status: "open" },
        { id: "D-002", ref: "C003-REQ-102", summary: "typo", reporter: "impl", date: "2026-10-06", status: "closed" },
      ],
    }),
  };
  for (let i = 1; i <= 12; i++) files[`.sdd/003-gamma/20-plan/50-tasks/T-${String(i).padStart(3, "0")}-t.md`] = taskMd("003", i, i <= 4 ? "done" : "todo", i <= 4 ? `2026-10-0${i + 5}` : null);
  const ws = makeWorkspace(files);
  try {
    const r = runBundled(["status", "--write"], { cwd: ws.root });
    assert.equal(r.code, 0, r.stderr);
    const block = readStatusBlock(readFileSync(join(ws.root, ".sdd", "SDD.md"), "utf8"))!;
    const rows = block.split("\n").slice(2);
    assert.equal(rows.length, 2, block);
    assert.equal(rows[0], "| 002 | Beta | 10-spec | draft | 0/0 | 0 | — |");
    assert.equal(rows[1], "| 003 | Gamma | 20-plan | approved | 4/12 | 1 | 2026-10-09 |");
  } finally {
    ws.cleanup();
  }
});
