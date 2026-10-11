// C001-TC-912 / C001-TS-912 (C001-AC-911.1, C001-REQ-911): the session-start brief through
// `sdd hook session-start`, with SessionStart hook input shaped as in spike S-04.
import { test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { makeWorkspace, runBundled } from "../cli/helpers.ts";
import { changeMd, SDD_MD, taskMd } from "../workspace-fixtures.ts";

const H = "sha256:" + "a".repeat(64);
const approved = { status: "approved", approved_hash: H, approved_at: "2026-10-01", approved_by: "p01" };

function sessionStart(cwd: string) {
  return runBundled(["hook", "session-start"], { cwd, stdin: JSON.stringify({ session_id: "s", transcript_path: "t.jsonl", cwd, hook_event_name: "SessionStart", source: "startup" }) });
}

test("the brief lists 003 (20-plan approved, 7/12 tasks, 1 open defect) and 004 (10-spec draft) in at most 10 lines", () => {
  const files: Record<string, string> = {
    ".sdd/SDD.md": SDD_MD,
    ".sdd/003-gamma/change.md": changeMd({
      nnn: "003",
      phase: "20-plan",
      phases: { "00-ideation": approved, "10-spec": approved, "20-plan": approved },
      defects: [{ id: "D-001", ref: "C003-REQ-101", summary: "s", reporter: "p01", date: "2026-10-05", status: "open" }],
    }),
    ".sdd/004-delta/change.md": changeMd({ nnn: "004", phase: "10-spec", phases: { "00-ideation": approved, "10-spec": { status: "draft" } } }),
  };
  for (let i = 1; i <= 12; i++) files[`.sdd/003-gamma/20-plan/50-tasks/T-${String(i).padStart(3, "0")}-t.md`] = taskMd("003", i, i <= 7 ? "done" : "todo", i <= 7 ? "2026-10-06" : null);
  const ws = makeWorkspace(files);
  try {
    const r = sessionStart(ws.root);
    assert.equal(r.code, 0, r.stderr);
    const lines = r.stdout.trimEnd().split("\n");
    assert.ok(lines.length <= 10, r.stdout);
    assert.equal(lines[0], "SDD workspace: 2 active change(s)");
    for (const s of ["003", "20-plan", "7/12", "1 open defect", "004", "10-spec", "draft"]) assert.ok(r.stdout.includes(s), `${s} in:\n${r.stdout}`);
    // From a subfolder the workspace is found by walking up.
    assert.equal(sessionStart(join(ws.root, ".sdd", "003-gamma")).stdout, r.stdout);
  } finally {
    ws.cleanup();
  }
});

test("more changes than fit are summarised so the brief stays within 10 lines; stopped changes are not listed", () => {
  const files: Record<string, string> = { ".sdd/SDD.md": SDD_MD };
  for (let n = 1; n <= 12; n++) files[`.sdd/${String(n).padStart(3, "0")}-c/change.md`] = changeMd({ nnn: String(n).padStart(3, "0") });
  files[".sdd/013-s/change.md"] = changeMd({ nnn: "013", status: "stopped" });
  const ws = makeWorkspace(files);
  try {
    const lines = sessionStart(ws.root).stdout.trimEnd().split("\n");
    assert.equal(lines.length, 10);
    assert.equal(lines[0], "SDD workspace: 12 active change(s)");
    assert.equal(lines[9], "… 4 more: run sdd status");
    assert.ok(!lines.some((l) => l.startsWith("CHG-013")));
  } finally {
    ws.cleanup();
  }
});
