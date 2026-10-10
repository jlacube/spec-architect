// C001-TC-125 — verifies C001-TS-125 (C001-AC-119.1, C001-REQ-119): lite to full upgrade.
// The ID set is taken from the workspace model that `sdd trace` (C001-T-023) builds on.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildChangeGraph } from "../../../src/model/graph.ts";
import { splitFrontmatter } from "../../../src/model/frontmatter.ts";
import { makeWorkspace, runBundled } from "../cli/helpers.ts";

/** A lite spec with 3 stories, 8 requirements, 11 criteria, 14 scenarios; a plan with 6 tasks. */
function liteFixture(): { spec: string; plan: string } {
  const stories = [1, 2, 3].map(
    (s) => `### C007-US-10${s} — Story ${s}\n- **As a** P-01\n- **I want** feature ${s}\n- **So that** value ${s}\n- **Value / outcome:** outcome ${s}\n- **Priority:** Must · **Size hint:** S · **Capability:** C007-CAP-01\n- **Requirements:** C007-REQ-10${s}\n- **Traces to:** Q${s}\n`,
  );
  const acCount = [2, 2, 1, 1, 1, 2, 1, 1]; // 11 criteria
  const tsPerAc = [2, 1, 2, 1, 1, 1, 1, 2, 1, 1, 1]; // scenarios per criterion: 14 in total
  const reqs: string[] = [];
  const acc: string[] = [];
  let ac = 0;
  let ts = 100;
  for (let r = 1; r <= 8; r++) {
    const id = `C007-REQ-1${String(r).padStart(2, "0")}`;
    const acIds = Array.from({ length: acCount[r - 1]! }, (_, i) => `C007-AC-1${String(r).padStart(2, "0")}.${i + 1}`);
    reqs.push(`### ${id} — Requirement ${r}\n- **Pattern:** ubiquitous\n- **Statement:** THE sdd CLI SHALL keep statement ${r} exactly — with “quotes”, \`code\` and trailing text.\n- **Rationale:** reason ${r}\n- **Stories:** C007-US-101\n- **Priority:** Must\n- **Acceptance:** ${acIds.join(", ")}\n`);
    for (const a of acIds) {
      const blocks = Array.from({ length: tsPerAc[ac++] ?? 1 }, () => {
        ts++;
        return "```gherkin\nScenario: C007-TS-" + ts + " — scenario " + ts + "\n  Given state " + ts + "\n  When action " + ts + "\n  Then result " + ts + "\n```\n";
      });
      acc.push(`#### ${a} — Criterion ${a}\n${blocks.join("\n")}`);
    }
  }
  const spec =
    "---\nid: C007-SPEC\nartifact: spec/lite\nchange: CHG-007\nphase: 10-spec\nstatus: draft\n---\n# CHG-007 — Specification (lite)\n\n" +
    "## Context\nPayments fail silently today.\n\n## Stories\n\n" + stories.join("\n") +
    "\n## Requirements\n\n" + reqs.join("\n") +
    "\n## Acceptance\n\n" + acc.join("\n") +
    "\n| REQ | happy | alternate | boundary | error | authorization | concurrency/idempotency | abuse |\n|---|---|---|---|---|---|---|---|\n| C007-REQ-101 | TS-101 | n/a | n/a | n/a | n/a | n/a | n/a |\n" +
    "\n## NFRs\nNone beyond the constitution.\n\n## Domain notes\nA payment has an id.\n\n## Interfaces\nNo new interface.\n\n## Architecture notes\nOne module.\n";
  const tasks = [1, 2, 3, 4, 5, 6].map(
    (t) => `### C007-T-00${t} — Task ${t}\n- **Status:** todo\n- **Depends on:** ${t > 1 ? `C007-T-00${t - 1}` : ""}\n- **Implements:** C007-REQ-10${t}\n- **Satisfies AC:** C007-AC-10${t}.1\n- **Verified by:** C007-TS-10${t}, C007-TC-00${t}\n- **Estimate:** S\n- **Targets:** src/module${t}.ts\n- **Verification:** npm test -- module${t}\n- **Done when:** tests for module ${t} pass\n`,
  );
  const plan =
    "---\nid: C007-PLAN\nartifact: plan/lite\nchange: CHG-007\nphase: 20-plan\nstatus: draft\n---\n# CHG-007 — Plan (lite)\n\n## Strategy\nSmallest change first.\n\n## Tasks\n\n" + tasks.join("\n") +
    "\n## Test mapping\n| TC | TS | Level | Location |\n|---|---|---|---|\n" + [1, 2, 3, 4, 5, 6].map((t) => `| C007-TC-00${t} | C007-TS-10${t} | integration | tests/m${t}.test.ts |`).join("\n") +
    "\n\n## Risks\n| ID | Risk | Likelihood | Impact | Mitigation |\n|---|---|---|---|---|\n| C007-RISK-001 | Late data | low | low | Retry |\n";
  return { spec, plan };
}

const statements = (g: ReturnType<typeof buildChangeGraph>) =>
  new Map(g.nodes.filter((n) => n.type === "REQ").map((n) => [n.id, n.fields.find((f) => f.name === "Statement")?.value]));
const scenarioTexts = (g: ReturnType<typeof buildChangeGraph>, dir: string) =>
  new Map(g.nodes.filter((n) => n.type === "TS").map((n) => [n.id, readFileSync(join(dir, n.file), "utf8").split("\n").slice(n.line - 1, n.line + 3).join("\n")]));

test("upgrading lite change 007 to full keeps every ID and every statement, scenario and task text", () => {
  const ws = makeWorkspace({ "README.md": "x\n" });
  try {
    assert.equal(runBundled(["init"], { cwd: ws.root }).code, 0);
    assert.equal(runBundled(["change", "new", "Placeholder", "--profile", "lite"], { cwd: ws.root }).code, 0);
    // Renumber to 007 by creating it directly from the lite scaffold.
    for (let i = 2; i <= 6; i++) runBundled(["change", "new", `Filler ${i}`], { cwd: ws.root });
    assert.equal(runBundled(["change", "new", "Card payments", "--profile", "lite"], { cwd: ws.root }).code, 0);
    const dir = join(ws.root, ".sdd", "007-card-payments");
    const { spec, plan } = liteFixture();
    writeFileSync(join(dir, "10-spec", "spec.md"), spec);
    writeFileSync(join(dir, "20-plan", "plan.md"), plan);
    const before = buildChangeGraph(dir);
    const count = (t: string) => before.nodes.filter((n) => n.type === t).length;
    assert.deepEqual([count("US"), count("REQ"), count("AC"), count("TS"), count("T")], [3, 8, 11, 14, 6]);
    const scenariosBefore = scenarioTexts(before, dir);

    const r = runBundled(["change", "profile", "007", "full"], { cwd: ws.root });
    assert.equal(r.code, 0, r.stderr);
    for (const f of ["10-spec/spec.md", "20-plan/plan.md", "10-spec/dod.md"]) assert.equal(existsSync(join(dir, f)), false, f);
    for (const f of [
      "10-spec/10-context/problem-and-goals.md",
      "10-spec/20-capabilities/CAP-01-card-payments/stories.md",
      "10-spec/20-capabilities/CAP-01-card-payments/requirements.md",
      "10-spec/20-capabilities/CAP-01-card-payments/acceptance.md",
      "10-spec/70-dod.md",
      "20-plan/10-strategy.md",
      "20-plan/50-tasks/T-001-task-1.md",
      "20-plan/60-test-plan.md",
      "20-plan/70-risks.md",
      "20-plan/handoff.md",
    ])
      assert.ok(existsSync(join(dir, f)), f);
    assert.equal(splitFrontmatter(readFileSync(join(dir, "change.md"), "utf8")).data?.["profile"], "full");

    const after = buildChangeGraph(dir);
    // "IDs found by trace": defined or referenced. The capability is referenced by the lite stories
    // and becomes defined by the full layout's stories.md.
    const found = (g: typeof before) => [...new Set([...g.byId.keys(), ...g.edges.filter((e) => e.context === "text").map((e) => e.to)])].sort();
    assert.deepEqual(found(after), found(before));
    assert.ok(after.byId.has("C007-CAP-01"));
    assert.deepEqual([...after.byId.values()].filter((v) => v.length > 1), []);
    assert.deepEqual(statements(after), statements(before));
    assert.deepEqual(scenarioTexts(after, dir), scenariosBefore);
    // Task frontmatter carries the lite task fields (C001-IF-03 §3) and the body keeps the task text.
    const task = readFileSync(join(dir, "20-plan", "50-tasks", "T-002-task-2.md"), "utf8");
    const fm = splitFrontmatter(task).data as Record<string, unknown>;
    assert.equal(fm["id"], "C007-T-002");
    assert.deepEqual(fm["depends_on"], ["C007-T-001"]);
    assert.deepEqual(fm["implements"], ["C007-REQ-102"]);
    assert.deepEqual(fm["satisfies_ac"], ["C007-AC-102.1"]);
    assert.deepEqual(fm["verified_by"], ["C007-TS-102", "C007-TC-002"]);
    assert.equal(fm["status"], "todo");
    assert.ok(task.includes("- **Targets:** src/module2.ts\n- **Verification:** npm test -- module2\n- **Done when:** tests for module 2 pass"));
  } finally {
    ws.cleanup();
  }
});
