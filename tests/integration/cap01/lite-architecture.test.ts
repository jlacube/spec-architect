// C001-D-029 — lite changes keep their architecture in `10-spec/spec.md` (C001-IF-06 §3), and the lint
// applies the same rules there (C001-REQ-118): LINT-ARCH-001 (C001-REQ-509), LINT-ARCH-004
// (C001-REQ-508) and LINT-CON-001 (C001-REQ-514) read the lite spec.md; the lite plan template defines the
// TC its task references, so a freshly scaffolded lite plan has no TR-12.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { makeWorkspace, runBundled, runInProcess } from "../cli/helpers.ts";

interface Finding {
  code: string;
  path: string;
  ids?: string[];
  message: string;
}

const FOLDER = join(".sdd", "001-small-fix");

/** Lints (in process) a new lite change scaffolded by the bundled CLI after `edit` has changed it. */
function lintLite(edit: (dir: string) => void): Finding[] {
  const ws = makeWorkspace({ "README.md": "x\n" });
  try {
    assert.equal(runBundled(["init"], { cwd: ws.root }).code, 0);
    assert.equal(runBundled(["change", "new", "Small fix", "--profile", "lite"], { cwd: ws.root }).code, 0);
    edit(join(ws.root, FOLDER));
    const r = runInProcess(["lint", "001", "--json"], { cwd: ws.root });
    if (r.code !== 0 && r.code !== 1) throw new Error(r.stderr);
    return (JSON.parse(r.stdout) as { findings: Finding[] }).findings;
  } finally {
    ws.cleanup();
  }
}

const withCode = (findings: Finding[], code: string) => findings.filter((f) => f.code === code);

interface LiteArch {
  /** Component IDs drawn in the component flowchart (Mermaid form, `_` for `-`). */
  diagram?: string[];
  /** Flows listed in Runtime flows, and those that have a sequence diagram. */
  flows?: string[];
  sequences?: string[];
  /** Source field of the constraint; null leaves the field out. */
  source?: string | null;
}

/** A lite spec.md with one catalogue component, C001-COMP-001, in its Architecture notes. */
function liteSpec(o: LiteArch = {}): string {
  const diagram = o.diagram ?? ["C001_COMP_001"];
  const flows = o.flows ?? ["F1"];
  const sequences = o.sequences ?? flows;
  const source = o.source === undefined ? "C001-DEC-001" : o.source;
  return [
    "---", 'id: "C001-SPEC"', "artifact: spec/lite", 'change: "CHG-001"', "phase: 10-spec", "status: draft", "---",
    "# CHG-001 — Specification (lite)", "",
    "## Architecture notes", "",
    "### Component catalogue", "",
    "### C001-COMP-001 — Invoice module",
    "- **Name:** Invoice module", "- **Responsibility:** issues invoices", "- **Owned data:** none", "- **Interfaces:** none",
    "- **Depends on:** none", "- **Realizes:** C001-REQ-101", "- **Status:** new", "",
    "### Runtime flows",
    "| Flow | Steps | Realizes |", "|---|---|---|",
    ...flows.map((f) => `| ${f} | A caller calls it. | C001-REQ-101 |`), "",
    "### Constraints", "",
    "#### C001-CON-01 — Built-ins only",
    "- **Statement:** the module uses Node.js built-ins only.",
    ...(source === null ? [] : [`- **Source:**${source === "" ? "" : " " + source}`]),
    "- **Affected components:** C001-COMP-001", "",
    "### Diagrams", "",
    "#### Component view", "```mermaid", "flowchart LR", '  Caller["Caller"]', ...diagram.map((d) => `  Caller --> ${d}["${d}"]`), "```", "",
    ...sequences.flatMap((f) => [`#### ${f} — A flow`, "```mermaid", "sequenceDiagram", "  participant C001_COMP_001", "  Caller->>C001_COMP_001: call", "```", ""]),
  ].join("\n");
}

const writeSpec = (o: LiteArch) => (dir: string) => writeFileSync(join(dir, "10-spec", "spec.md"), liteSpec(o));

test("lite: a component drawn in the spec.md component diagram raises no LINT-ARCH-001", () => {
  const findings = lintLite(writeSpec({}));
  assert.deepEqual(withCode(findings, "LINT-ARCH-001"), [], JSON.stringify(findings));
});

test("lite: a catalogue component missing from the spec.md diagram still raises LINT-ARCH-001", () => {
  const hits = withCode(lintLite(writeSpec({ diagram: [] })), "LINT-ARCH-001");
  assert.deepEqual(hits.map((h) => [h.path, h.ids, h.message]), [
    [".sdd/001-small-fix/10-spec/spec.md", ["C001-COMP-001"], "C001-COMP-001 is in the catalogue but in no component diagram"],
  ]);
});

test("lite: a diagram component absent from the catalogue raises LINT-ARCH-001", () => {
  const hits = withCode(lintLite(writeSpec({ diagram: ["C001_COMP_001", "C001_COMP_009"] })), "LINT-ARCH-001");
  assert.deepEqual(hits.map((h) => h.ids), [["C001-COMP-009"]]);
});

test("lite: LINT-ARCH-004 reads the Runtime flows and sequence diagrams of spec.md", () => {
  assert.deepEqual(withCode(lintLite(writeSpec({ flows: ["F1", "F2"] })), "LINT-ARCH-004"), []);
  const hits = withCode(lintLite(writeSpec({ flows: ["F1", "F2"], sequences: ["F1"] })), "LINT-ARCH-004");
  assert.deepEqual(hits.map((h) => [h.path, h.message]), [[".sdd/001-small-fix/10-spec/spec.md", "Runtime flow F2 has no sequence diagram"]]);
});

test("lite: a heading-form constraint without a Source raises LINT-CON-001", () => {
  assert.deepEqual(withCode(lintLite(writeSpec({})), "LINT-CON-001"), []);
  for (const source of [null, "", "—", "n/a"]) {
    const hits = withCode(lintLite(writeSpec({ source })), "LINT-CON-001");
    assert.deepEqual(hits.map((h) => h.ids), [["C001-CON-01"]], JSON.stringify(source));
  }
});

const PLAN = ".sdd/001-small-fix/20-plan/plan.md";
const planTr12 = (findings: Finding[]) => withCode(findings, "TR-12").filter((f) => f.path === PLAN);

test("a fresh lite plan from the template has no TR-12, before and after the plan phase starts", () => {
  assert.deepEqual(planTr12(lintLite(() => {})), []);
  const started = lintLite((dir) => {
    const manifest = join(dir, "change.md");
    writeFileSync(manifest, readFileSync(manifest, "utf8").replace(/20-plan: \{ status: not-started/, "20-plan: { status: in-progress"));
  });
  assert.deepEqual(planTr12(started), []);
  // The template's TC row defines the TC its task lists under Verified by; only its Location is left to fill.
  assert.deepEqual(withCode(started, "LINT-TC-001").map((f) => f.message), ["Test case field missing: C001-TC-001 has no location"]);
});
