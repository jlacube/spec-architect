// C001-TC-814 — verifies C001-TS-814 (C001-AC-812.1, C001-REQ-812): revise spec. With spec and plan approved,
// `sdd change revise 004 spec --reason "defect D-001"` (what /architect:revise runs) puts 10-spec in revision,
// 20-plan stale, and logs a revise row with the reason. Also: the impact block of `sdd gate show` for the
// phase in revision (C001-REQ-813, defect D-005) and `sdd change stop` (C001-REQ-815).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { splitFrontmatter } from "../../../src/model/frontmatter.ts";
import { runBundled } from "../cli/helpers.ts";
import { approvedChange, REQ, statuses } from "./gate-fixture.ts";

test("revise spec: 10-spec in-revision, 20-plan stale, Gate log row with the reason", () => {
  const ws = approvedChange();
  try {
    const r = runBundled(["change", "revise", "004", "10-spec", "--reason", "defect D-001"], { cwd: ws.root });
    assert.equal(r.code, 0, r.stderr);
    assert.deepEqual(statuses(ws.dir), { "00-ideation": "approved", "10-spec": "in-revision", "20-plan": "stale" });
    assert.match(readFileSync(join(ws.dir, "change.md"), "utf8"), /^phase: 10-spec$/m, "the revised phase is the current phase again");
    const log = readFileSync(join(ws.dir, "change.md"), "utf8").split("\n").filter((l) => /\*\*Revise\*\*/.test(l));
    assert.equal(log.length, 1);
    assert.match(log[0]!, /G2 \(spec\)/);
    assert.match(log[0]!, /"defect D-001"/);
  } finally {
    ws.cleanup();
  }
});

test("re-approving the revised phase and the stale later phase moves the current phase forward again", () => {
  const ws = approvedChange();
  try {
    assert.equal(runBundled(["change", "revise", "004", "10-spec", "--reason", "r"], { cwd: ws.root }).code, 0);
    const approve = (phase: string) => runBundled(["gate", "approve", "004", phase, "--note", "Approve", "--by", "p01"], { cwd: ws.root });
    let r = approve("10-spec");
    assert.equal(r.code, 0, r.stderr);
    assert.match(readFileSync(join(ws.dir, "change.md"), "utf8"), /^phase: 10-spec$/m);
    r = approve("20-plan");
    assert.equal(r.code, 0, r.stderr);
    assert.match(readFileSync(join(ws.dir, "change.md"), "utf8"), /^phase: 20-plan$/m);
  } finally {
    ws.cleanup();
  }
});

test("gate show of a phase in revision lists the changed IDs and their downstream references", () => {
  const ws = approvedChange();
  try {
    assert.equal(runBundled(["change", "revise", "004", "10-spec", "--reason", "r"], { cwd: ws.root }).code, 0);
    const p = join(ws.root, ...REQ.split("/"));
    writeFileSync(p, readFileSync(p, "utf8").replace("do one thing", "do two things"));
    const r = runBundled(["gate", "show", "004", "10-spec"], { cwd: ws.root });
    assert.equal(r.code, 0, r.stderr);
    assert.match(r.stdout, /^Impact since last approval: modified C004-REQ-012$/m);
    const downstream = /^Downstream: (.*)$/m.exec(r.stdout)?.[1] ?? "";
    assert.match(downstream, /C004-US-001/);
    assert.match(downstream, /C004-T-\d+/);
  } finally {
    ws.cleanup();
  }
});

test("an approved phase not in revision shows no impact block", () => {
  const ws = approvedChange();
  try {
    assert.doesNotMatch(runBundled(["gate", "show", "004", "10-spec"], { cwd: ws.root }).stdout, /Impact since last approval/);
  } finally {
    ws.cleanup();
  }
});

test("change stop sets status stopped with the reason and date and logs a Stop row", () => {
  const ws = approvedChange(["00-ideation"]);
  try {
    const r = runBundled(["change", "stop", "004", "--reason", "superseded by 006"], { cwd: ws.root });
    assert.equal(r.code, 0, r.stderr);
    const text = readFileSync(join(ws.dir, "change.md"), "utf8");
    const fm = splitFrontmatter(text).data ?? {};
    assert.equal(fm["status"], "stopped");
    assert.match(JSON.stringify(fm["stopped"]), /superseded by 006/);
    assert.match(JSON.stringify(fm["stopped"]), /\d{4}-\d{2}-\d{2}/);
    assert.match(text, /\*\*Stop\*\*.*"superseded by 006"/);
  } finally {
    ws.cleanup();
  }
});

test("the SDD.md status block shows a stopped change as stopped, not with its phase status", () => {
  const ws = approvedChange(["00-ideation"]);
  try {
    writeFileSync(join(ws.root, ".sdd", "SDD.md"), "# SDD workspace\n\n<!-- sdd:status:begin -->\n<!-- sdd:status:end -->\n");
    assert.equal(runBundled(["change", "stop", "004", "--reason", "superseded"], { cwd: ws.root }).code, 0);
    const row = readFileSync(join(ws.root, ".sdd", "SDD.md"), "utf8").split("\n").find((l) => /^\| 004 \|/.test(l)) ?? "";
    assert.match(row, /\| stopped \|/);
  } finally {
    ws.cleanup();
  }
});
