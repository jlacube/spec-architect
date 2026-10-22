// C001-TC-1131 / C001-TS-925 (C001-AC-924.1, C001-REQ-924; D-015): `sdd archive` re-run after an
// interrupted archive finishes the remaining operations, and the result matches one uninterrupted run.
// One case per Examples row. The reference and the interrupted run use SDD_TEST_TODAY=2026-11-02; the
// interruption is SDD_TEST_FAULT=atomic-write-fail-at=<k> (rows 1, 2, 4, 5) or archive-move-fail (row 3).
// Write order of this fixture (C001-T-081, CR-11): 1 CAP-reporting.md (receives the moved entry),
// 2 CAP-billing.md, 3 CAP-payments.md, 4 _constitution/glossary.md, 5 change.md.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { runBundled } from "../cli/helpers.ts";
import { archiveWorkspace, checksum, historyRows, livingWith, requirementHeadings, type Req } from "./archive-fixture.ts";

const GLOSSARY = ["---", "id: GLOSSARY", "artifact: constitution/glossary", "updated: 2026-09-01", "---", "# Glossary", "", "## Domain terms", "| Term | Definition |", "|---|---|", "| Cart | Items chosen |", ""].join("\n");

const REQS: Req[] = [
  { cap: "billing", id: "C004-REQ-012", title: "Card payments", delta: "ADDED" },
  { cap: "billing", id: "C004-REQ-014", title: "Refund rules", delta: "MODIFIED (was C002-REQ-044)" },
  { cap: "payments", id: "C004-REQ-013", title: "Payment intents", delta: "ADDED" },
  { cap: "reporting", id: "C004-REQ-030", title: "Statement export", delta: "RENAMED (was C002-REQ-060)" },
];

function workspace() {
  return archiveWorkspace({
    reqs: REQS,
    living: {
      "CAP-billing.md": livingWith("billing", [
        ["C002-REQ-044", "Refunds"],
        ["C002-REQ-060", "Invoice export"],
      ]),
      "CAP-reporting.md": livingWith("reporting", [["C002-REQ-070", "Usage report"]]),
    },
    glossary: { terms: [["payment intent", "A request to collect money"]] },
    constitutionGlossary: GLOSSARY,
  });
}

const archive = (root: string, today: string, fault?: string) => runBundled(["archive", "004"], { cwd: root, env: { SDD_TEST_TODAY: today, SDD_TEST_FAULT: fault } });

/** Every file under `_living/`, `_constitution/glossary.md` and `_archive/004-*`, path → content. */
function snapshot(root: string): Map<string, string> {
  const sdd = join(root, ".sdd");
  const out = new Map<string, string>();
  const walk = (dir: string) => {
    if (!existsSync(dir)) return;
    for (const n of readdirSync(dir).sort()) {
      const p = join(dir, n);
      if (statSync(p).isDirectory()) walk(p);
      else out.set(relative(sdd, p).split("\\").join("/"), readFileSync(p, "utf8"));
    }
  };
  walk(join(sdd, "_living"));
  const g = join(sdd, "_constitution", "glossary.md");
  if (existsSync(g)) out.set("_constitution/glossary.md", readFileSync(g, "utf8"));
  if (existsSync(join(sdd, "_archive"))) for (const n of readdirSync(join(sdd, "_archive")).filter((x) => x.startsWith("004-"))) walk(join(sdd, "_archive", n));
  return out;
}

/** Blanks the History Date cells and the living-file `updated` values (the differences row 5 allows). */
function withoutDates(s: Map<string, string>): Map<string, string> {
  const out = new Map<string, string>();
  for (const [k, v] of s) {
    if (!k.startsWith("_living/")) {
      out.set(k, v);
      continue;
    }
    const at = v.indexOf("## History");
    const head = (at < 0 ? v : v.slice(0, at)).replace(/^updated: .*$/m, "updated: <date>");
    const hist = at < 0 ? "" : v.slice(at).replace(/^(\|[^|]*\|[^|]*\|[^|]*\|)[^|]*(\|.*)$/gm, (m, a: string, b: string) => (/^\|\s*(ID|-)/.test(m) ? m : `${a} <date> ${b}`));
    out.set(k, head + hist);
  }
  return out;
}

let cached: Map<string, string> | undefined;
/** Workspace copy "reference": one uninterrupted run on 2026-11-02. */
function reference(): Map<string, string> {
  if (cached) return cached;
  const ws = workspace();
  try {
    const r = archive(ws.root, "2026-11-02");
    assert.equal(r.code, 0, r.stderr);
    cached = snapshot(ws.root);
    return cached;
  } finally {
    ws.cleanup();
  }
}

const living = (root: string, name: string) => readFileSync(join(root, ".sdd", "_living", name), "utf8");
const changeLeft = (root: string) => readdirSync(join(root, ".sdd")).filter((n) => n.startsWith("004-"));

function assertSameAsReference(root: string) {
  assert.deepEqual([...snapshot(root).entries()], [...reference().entries()]);
  assert.deepEqual(changeLeft(root), [], ".sdd/004-* does not exist");
}

test("reference run writes CAP-reporting.md before CAP-billing.md and covers every delta", () => {
  const ref = reference();
  assert.ok(ref.has("_archive/004-x/change.md"));
  assert.match(ref.get("_archive/004-x/change.md")!, /^status: archived$/m);
  assert.deepEqual(requirementHeadings(ref.get("_living/CAP-billing.md")!), ["### C004-REQ-014 — Refund rules", "### C004-REQ-012 — Card payments"]);
  assert.deepEqual(requirementHeadings(ref.get("_living/CAP-reporting.md")!), ["### C002-REQ-070 — Usage report", "### C002-REQ-060 — Statement export"]);
});

test("row 1: interrupted after the first living-file write, re-run the same day", () => {
  const ws = workspace();
  try {
    const before = snapshot(ws.root);
    const first = archive(ws.root, "2026-11-02", "atomic-write-fail-at=2");
    assert.notEqual(first.code, 0, "the first run is interrupted");
    const after = snapshot(ws.root);
    assert.deepEqual([...after.keys()].filter((k) => after.get(k) !== before.get(k)), ["_living/CAP-reporting.md"], "only the first living file is written");
    const r = archive(ws.root, "2026-11-02");
    assert.equal(r.code, 0, r.stderr);
    assertSameAsReference(ws.root);
  } finally {
    ws.cleanup();
  }
});

test("row 2: interrupted after the living files and the glossary, before change.md", () => {
  const ws = workspace();
  try {
    const first = archive(ws.root, "2026-11-02", "atomic-write-fail-at=5");
    assert.notEqual(first.code, 0);
    assert.match(readFileSync(join(ws.root, ".sdd", "004-x", "change.md"), "utf8"), /^status: active$/m);
    assert.match(readFileSync(join(ws.root, ".sdd", "_constitution", "glossary.md"), "utf8"), /payment intent/);
    const r = archive(ws.root, "2026-11-02");
    assert.equal(r.code, 0, r.stderr);
    assertSameAsReference(ws.root);
    const g = snapshot(ws.root).get("_constitution/glossary.md")!;
    assert.equal(g.split("\n").filter((l) => /^\|\s*payment intent\s*\|/.test(l)).length, 1, "payment intent appears once");
  } finally {
    ws.cleanup();
  }
});

test("row 3: interrupted after change.md says archived, before the folder move", () => {
  const ws = workspace();
  try {
    const first = archive(ws.root, "2026-11-02", "archive-move-fail");
    assert.notEqual(first.code, 0);
    assert.match(readFileSync(join(ws.root, ".sdd", "004-x", "change.md"), "utf8"), /^status: archived$/m);
    const dry = runBundled(["archive", "004", "--dry-run"], { cwd: ws.root, env: { SDD_TEST_TODAY: "2026-11-02" } });
    assert.equal(dry.code, 0, dry.stderr);
    assert.doesNotMatch(dry.stdout, /_living|glossary|set-status/, "the dry run lists only the operations that remain");
    const r = archive(ws.root, "2026-11-02");
    assert.equal(r.code, 0, r.stderr);
    assert.ok(!r.stderr.includes("ERR-CLI-014"), r.stderr);
    assertSameAsReference(ws.root);
  } finally {
    ws.cleanup();
  }
});

test("row 4: interrupted between the rename's target and source writes", () => {
  const ws = workspace();
  try {
    const first = archive(ws.root, "2026-11-02", "atomic-write-fail-at=2");
    assert.notEqual(first.code, 0);
    // The moved entry is in its target before it leaves its source: the ID is in both files.
    assert.ok(requirementHeadings(living(ws.root, "CAP-reporting.md")).includes("### C002-REQ-060 — Statement export"));
    assert.ok(requirementHeadings(living(ws.root, "CAP-billing.md")).includes("### C002-REQ-060 — Invoice export"));
    const r = archive(ws.root, "2026-11-02");
    assert.equal(r.code, 0, r.stderr);
    const files = readdirSync(join(ws.root, ".sdd", "_living"));
    const holders = files.filter((n) => requirementHeadings(living(ws.root, n)).some((h) => h.startsWith("### C002-REQ-060 ")));
    assert.deepEqual(holders, ["CAP-reporting.md"]);
    assert.ok(requirementHeadings(living(ws.root, "CAP-reporting.md")).includes("### C002-REQ-060 — Statement export"));
    const moves = historyRows(living(ws.root, "CAP-reporting.md")).filter((c) => c[0] === "C002-REQ-060" && /^moved from/.test(c[1]!));
    assert.equal(moves.length, 1, "the History row of the move appears once");
    const ref = reference();
    const now = snapshot(ws.root);
    assert.deepEqual([...now.entries()].filter(([k]) => k.startsWith("_living/")), [...ref.entries()].filter(([k]) => k.startsWith("_living/")));
  } finally {
    ws.cleanup();
  }
});

test("row 5: interrupted after the first living-file write, re-run on a later date", () => {
  const ws = workspace();
  try {
    const first = archive(ws.root, "2026-11-02", "atomic-write-fail-at=2");
    assert.notEqual(first.code, 0);
    const r = archive(ws.root, "2026-11-05");
    assert.equal(r.code, 0, r.stderr);
    const now = snapshot(ws.root);
    const all = [...now.entries()].filter(([k]) => k.startsWith("_living/")).map(([, v]) => v);
    for (const id of ["C004-REQ-012", "C004-REQ-013", "C004-REQ-014", "C002-REQ-060"])
      assert.equal(all.flatMap(requirementHeadings).filter((h) => h.startsWith(`### ${id} `)).length, 1, `${id} is a heading exactly once`);
    for (const text of all) {
      const keys = historyRows(text).map((c) => `${c[0]}|${c[1]}|${c[2]}`);
      assert.equal(new Set(keys).size, keys.length, "each (ID, Event, Change) History row appears once");
    }
    assert.deepEqual([...withoutDates(now).entries()], [...withoutDates(reference()).entries()]);
    assert.deepEqual(changeLeft(ws.root), []);
  } finally {
    ws.cleanup();
  }
});

test("row 6: a stopped change is refused with ERR-CLI-014 and nothing changes", () => {
  const ws = workspace();
  try {
    const md = join(ws.root, ".sdd", "004-x", "change.md");
    writeFileSync(md, readFileSync(md, "utf8").replace(/^status: active$/m, "status: stopped"));
    const before = checksum(ws.root);
    const r = archive(ws.root, "2026-11-02");
    assert.equal(r.code, 2);
    assert.ok(r.stderr.includes("ERR-CLI-014"), r.stderr);
    assert.ok(r.stderr.includes("Change `004` is `stopped`"), r.stderr);
    assert.equal(checksum(ws.root), before);
  } finally {
    ws.cleanup();
  }
});

// Beyond the Examples rows: the duplicate rule and the opposite-direction moves of C001-T-081 Step 4 (CR-11).
test("an ID in two living files that is not this change's move-in is refused with ERR-CLI-009", () => {
  const ws = workspace();
  try {
    const p = join(ws.root, ".sdd", "_living", "CAP-reporting.md");
    writeFileSync(p, livingWith("reporting", [["C002-REQ-070", "Usage report"], ["C002-REQ-044", "Refunds"]]));
    const before = checksum(ws.root);
    const r = archive(ws.root, "2026-11-02");
    assert.equal(r.code, 2);
    for (const s of ["ERR-CLI-009", "C002-REQ-044", ".sdd/_living/CAP-billing.md", ".sdd/_living/CAP-reporting.md"]) assert.ok(r.stderr.includes(s), r.stderr);
    assert.equal(checksum(ws.root), before);
  } finally {
    ws.cleanup();
  }
});

test("two moves between the same files in opposite directions: any interrupted write resumes to the reference", () => {
  const swap = () =>
    archiveWorkspace({
      reqs: [
        { cap: "billing", id: "C004-REQ-031", title: "Usage statement", delta: "RENAMED (was C002-REQ-070)" },
        { cap: "reporting", id: "C004-REQ-030", title: "Statement export", delta: "RENAMED (was C002-REQ-060)" },
      ],
      living: { "CAP-billing.md": livingWith("billing", [["C002-REQ-060", "Invoice export"]]), "CAP-reporting.md": livingWith("reporting", [["C002-REQ-070", "Usage report"]]) },
    });
  const ref = swap();
  let expected: Map<string, string>;
  try {
    assert.equal(archive(ref.root, "2026-11-02").code, 0);
    expected = snapshot(ref.root);
  } finally {
    ref.cleanup();
  }
  for (let k = 1; k <= 4; k++) {
    const ws = swap();
    try {
      assert.notEqual(archive(ws.root, "2026-11-02", `atomic-write-fail-at=${k}`).code, 0, `write ${k}`);
      for (const id of ["C002-REQ-060", "C002-REQ-070"])
        assert.ok(readdirSync(join(ws.root, ".sdd", "_living")).some((n) => requirementHeadings(living(ws.root, n)).some((h) => h.startsWith(`### ${id} `))), `write ${k}: ${id} is in a living file`);
      const r = archive(ws.root, "2026-11-05");
      assert.equal(r.code, 0, `write ${k}: ${r.stderr}`);
      assert.deepEqual([...withoutDates(snapshot(ws.root)).entries()], [...withoutDates(expected).entries()], `write ${k}`);
    } finally {
      ws.cleanup();
    }
  }
});
