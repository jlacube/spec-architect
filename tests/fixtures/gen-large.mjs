// fx-large (C001-T-027): a generated workspace of 20 full-profile changes, 500 artifact files and
// 2,000 IDs, lint-clean, used by the benchmarks of C001-NFR-101 … 104 and the determinism tests.
// Usage: node tests/fixtures/gen-large.mjs <target directory>  (creates <target>/.sdd/)
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const CHANGES = 20;
const CAPS = 4;
const PER_CAP = 4; // stories, requirements, criteria and scenarios per capability
const NFRS = 9;
const TASKS = 4;

const pad = (n, w = 3) => String(n).padStart(w, "0");
const fm = (fields) => `---\n${Object.entries(fields).map(([k, v]) => `${k}: ${v}`).join("\n")}\n---\n`;

function change(c) {
  const nnn = pad(c);
  const P = `C${nnn}`;
  const files = {};
  const at = (rel, text) => (files[`${nnn}-change-${nnn}/${rel}`] = text);
  const reqs = [];

  at("change.md", fm({
    id: `CHG-${nnn}`, title: `"Generated change ${nnn}"`, kind: "greenfield", profile: "full", status: "active", phase: "20-plan",
    phases: "\n  00-ideation: { status: approved }\n  10-spec: { status: approved }\n  20-plan: { status: draft }",
    implementation: "{ status: not-started }", stopped: "null", owners: "[]", defects: "[]", waivers: "[]",
  }).replace("phases: \n", "phases:\n") + `# CHG-${nnn} — Generated change\n\n## Gate log\n| Date | Gate | Decision | Words of approver | Waivers | Usage |\n|---|---|---|---|---|---|\n| 2026-10-01 | G1 (ideation) | **Approved** | "ok" | none | unavailable |\n| 2026-10-02 | G2 (spec) | **Approved** | "ok" | none | unavailable |\n`);

  const sections = ["Document control", "Problem statement", "Q&A decision record", "Goals and non-goals", "Scope boundary", "Research index",
    "Options and decisions index", "Design direction", "Risks", "Assumptions", "Open questions", "Sources"];
  at("00-ideation/ideation.md", fm({ id: `${P}-IDEA`, artifact: "ideation", change: `CHG-${nnn}`, phase: "00-ideation", status: "approved" }) +
    `# Generated change ${nnn} — ideation\n\n` + sections.map((s, i) => `## ${i + 1}. ${s}\n\nText for ${s.toLowerCase()}.\n`).join("\n"));

  const spec = (rel, id, artifact, body) => at(`10-spec/${rel}`, fm({ id, artifact, change: `CHG-${nnn}`, phase: "10-spec", status: "approved" }) + body);
  spec("10-context/stakeholders-and-personas.md", `${P}-SPEC-CTX-04`, "spec/context/personas", "# Personas\n\n## P-01 — Owner\n\nOwns the change.\n");
  spec("40-domain/glossary-delta.md", `${P}-SPEC-GLOSSARY`, "spec/glossary-delta", "# Glossary delta\n\n## 2. System names\n\n| Name | Component |\n|---|---|\n| sdd CLI | — |\n");

  for (let k = 1; k <= CAPS; k++) {
    const cap = pad(k, 2);
    const folder = `10-spec/20-capabilities/CAP-${cap}-area-${k}`;
    const stories = [], requirements = [], acceptance = [], coverage = [];
    for (let i = 1; i <= PER_CAP; i++) {
      const seq = k * 100 + i;
      const us = `${P}-US-${seq}`, req = `${P}-REQ-${seq}`, ac = `${P}-AC-${seq}.1`, ts = `${P}-TS-${seq}`;
      reqs.push({ req, ts, cap: `${P}-CAP-${cap}` });
      stories.push(`### ${us} — Story ${seq}\n- **As a** P-01 owner\n- **I want** behaviour ${seq}\n- **So that** outcome ${seq} holds\n- **Value / outcome:** measurable outcome ${seq}\n- **Priority:** Must · **Size hint:** S · **Capability:** ${P}-CAP-${cap}\n- **Requirements:** ${req}\n- **Traces to:** Q${i}\n`);
      requirements.push(`### ${req} — Requirement ${seq}\n- **Pattern:** event-driven\n- **Statement:** WHEN request ${seq} arrives, THE sdd CLI SHALL record entry ${seq}.\n- **Rationale:** traceability\n- **Stories:** ${us}\n- **Priority:** Must\n- **Acceptance:** ${ac}\n`);
      acceptance.push(`#### ${ac} — Entry ${seq} recorded\n\`\`\`gherkin\nScenario: ${ts} — entry ${seq}\n  Given a workspace\n  When request ${seq} arrives\n  Then entry ${seq} is recorded\n\`\`\`\n`);
      coverage.push(`| ${req} | TS-${seq} | n/a: one path | n/a: none | n/a: none | n/a: local tool | n/a: single writer | n/a: own files |`);
    }
    const head = (artifact) => fm({ id: `${P}-CAP-${cap}`, artifact, change: `CHG-${nnn}`, phase: "10-spec", status: "approved" });
    at(`${folder}/stories.md`, head("spec/stories") + `# Capability ${cap} — stories\n\n` + stories.join("\n"));
    at(`${folder}/requirements.md`, head("spec/requirements") + `# Capability ${cap} — requirements\n\n` + requirements.join("\n"));
    at(`${folder}/acceptance.md`, head("spec/acceptance") + `# Capability ${cap} — acceptance\n\n` + acceptance.join("\n") +
      "\n## Coverage table\n\n| REQ | happy | alternate | boundary | error | authorization | concurrency/idempotency | abuse |\n|---|---|---|---|---|---|---|---|\n" + coverage.join("\n") + "\n");
  }

  const nfrs = Array.from({ length: NFRS }, (_, i) => `${P}-NFR-${pad(101 + i)}`);
  spec("30-nfr/nfr.md", `${P}-SPEC-NFR`, "spec/nfr", "# NFRs\n\n" + nfrs.map((id, i) =>
    `### ${id} — Quality ${i + 1}\n- **Category:** Performance efficiency\n- **Statement:** WHEN command ${i + 1} runs, THE sdd CLI SHALL finish within the threshold.\n- **Metric:** wall-clock time\n- **Threshold:** ≤ ${i + 1} s at p95\n- **Method:** benchmark\n- **Environment:** REF-WIN\n- **Rationale:** responsiveness\n- **DoD:** ${P}-DOD-002\n`).join("\n"));
  spec("70-dod.md", `${P}-SPEC-DOD`, "spec/dod", "# DoD\n\n| ID | Statement | Evidence type | Covers |\n|---|---|---|---|\n" +
    `| ${P}-DOD-001 | Scenarios pass | test-report | ${Array.from({ length: CAPS }, (_, k) => `${P}-CAP-${pad(k + 1, 2)}`).join(", ")} |\n` +
    `| ${P}-DOD-002 | Benchmarks meet thresholds | benchmark-report | ${P}-NFR-101 … ${100 + NFRS} |\n`);

  const plan = (rel, id, artifact, body) => at(`20-plan/${rel}`, fm({ id, artifact, change: `CHG-${nnn}`, phase: "20-plan", status: "draft" }) + body);
  const taskIds = Array.from({ length: TASKS }, (_, t) => `${P}-T-${pad(t + 1)}`);
  plan("10-strategy.md", `${P}-PLAN-STRATEGY`, "plan/strategy", "# Strategy\n\n## 3. Milestones\n\n| ID | Name | Goal | Exit criterion | Tasks |\n|---|---|---|---|---|\n" +
    `| ${P}-M-01 | One | Ship the change | All test cases pass | ${taskIds[0]} … ${taskIds[TASKS - 1]} |\n`);
  plan("60-test-plan.md", `${P}-PLAN-TEST`, "plan/test-plan", "# Test plan\n\n| TC | Verifies | Level | Location | Test data | Environment | Task |\n|---|---|---|---|---|---|---|\n" +
    reqs.map((r, i) => `| ${r.ts.replace("-TS-", "-TC-")} | ${r.ts} | integration | \`tests/t${i}.test.ts\` | none | local | ${taskIds[i % TASKS]} |`).join("\n") + "\n");
  plan("78-observability.md", `${P}-PLAN-OBS`, "plan/observability", "# Observability\n\n| NFR | Signal | Implemented by |\n|---|---|---|\n" +
    nfrs.map((n) => `| ${n} | p95 metric | ${taskIds[0]} |`).join("\n") + "\n");
  taskIds.forEach((id, t) => {
    const mine = reqs.filter((_, i) => i % TASKS === t);
    at(`20-plan/50-tasks/T-${pad(t + 1)}-work-${t + 1}.md`, fm({
      id, title: `"Work ${t + 1}"`, change: `CHG-${nnn}`, phase: "20-plan", artifact: "plan/task", milestone: `${P}-M-01`, status: "todo",
      depends_on: t === 0 ? "[]" : `[${taskIds[t - 1]}]`, implements: `[${mine.map((r) => r.req).join(", ")}]`, satisfies_ac: `[${mine.map((r) => r.req.replace("-REQ-", "-AC-") + ".1").join(", ")}]`,
      verified_by: `[${mine.map((r) => r.ts.replace("-TS-", "-TC-")).join(", ")}]`, components: "[]", risk_refs: "[]", estimate: "M",
      report: "{ commit: null, completed_at: null, notes: null }",
    }) + `\n# ${id} — Work ${t + 1}\n\n## Intent\n\nImplement part ${t + 1}.\n\n## Targets\n\n| Kind | Target | Change |\n|---|---|---|\n| add | \`src/part${t + 1}.ts\` | new module |\n\n## Preconditions\n\nNone.\n\n## Step outline (no production code)\n\n1. Build it.\n\n## Verification\n\n- Run \`npm test\`\n\n## Done when\n\n- [ ] Test cases pass\n`);
  });
  return files;
}

/** Writes fx-large (or its first `changes` changes) under `root/.sdd/`; returns the number of artifact files. */
export function generateLarge(root, changes = CHANGES) {
  const sdd = join(root, ".sdd");
  let count = 0;
  const write = (rel, text) => {
    const p = join(sdd, ...rel.split("/"));
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, text);
  };
  write("SDD.md", "# SDD workspace (fx-large)\n\nGenerated by tests/fixtures/gen-large.mjs.\n");
  for (let c = 1; c <= changes; c++)
    for (const [rel, text] of Object.entries(change(c))) {
      write(rel, text);
      count++;
    }
  return count;
}

// Run as a script only (not when bundled into a test, where import.meta.url is the test file).
if (process.argv[1]?.endsWith("gen-large.mjs") && fileURLToPath(import.meta.url) === process.argv[1]) {
  const target = process.argv[2];
  if (!target) {
    console.error("usage: node tests/fixtures/gen-large.mjs <target directory>");
    process.exit(2);
  }
  console.log(`fx-large: ${generateLarge(target)} artifact files under ${join(target, ".sdd")}`);
}
