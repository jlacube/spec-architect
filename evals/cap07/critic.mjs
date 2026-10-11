// Shared setup of the critic and auditor scenarios (C001-T-039): lite changes built with the CLI, the
// critic or auditor dispatched as a subagent through the eval relay.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { constitution, liteSpecDrafted, specStart } from "../cap02/drafting.mjs";
import { architectWithStubs, dispatchPrompt } from "../harness/overlay.mjs";
import { edit, git, sdd, write } from "../harness/workspaces.mjs";

export const CHANGE = ".sdd/001-coupon-codes";
export const SPEC_REPORT = `${CHANGE}/10-spec/90-critic-report.md`;

export function read(root, rel) {
  try {
    return readFileSync(join(root, ...rel.split("/")), "utf8");
  } catch {
    return "";
  }
}

export const criticRun = (brief, fixture) => ({
  agent: "architect:eval-dispatcher",
  plugins: [architectWithStubs],
  fixture,
  allowTools: ["Agent", "Write", "Edit", "Bash"],
  maxTurns: 30,
  prompt: dispatchPrompt("sdd-critic", brief),
});

export const specBrief = (extra = "") => `Brief — critic: review the spec phase.
- Change: CHG-001 "Coupon codes" · profile lite · kind greenfield
- Phase / step: 10-spec · step 7 — Critique
- Task: review the specification against the rubrics. ${extra}
- Inputs: \`${CHANGE}/10-spec/spec.md\`, \`${CHANGE}/10-spec/dod.md\`, \`${CHANGE}/00-ideation/ideation.md\`.
- Outputs: \`${SPEC_REPORT}\` only.
- Quality bar: critique-rubrics, ears-requirements, sdd-conventions.
- Return contract: digest (at most 15 lines) and the report path.`;

/** Findings of a critic report: `{ id, body }` per `### CR-n` section. */
export function findings(text) {
  return [...String(text).matchAll(/^### (CR-\d+)[^\n]*\n([\s\S]*?)(?=^### |^## |(?![\s\S]))/gm)].map((m) => ({ id: m[1], body: m[2] }));
}

export function section(text, name) {
  const m = new RegExp(`^## ${name}\\s*\\n([\\s\\S]*?)(?=^## |(?![\\s\\S]))`, "m").exec(text);
  return m ? m[1] : "";
}

/** The clean lite spec of the drafting fixtures (lint-clean, one requirement). */
export const cleanSpec = liteSpecDrafted;

// Seeded defects, one per requirement (the IDs are what a finding must reference):
export const SEEDED = {
  "C001-REQ-102": "two independent outcomes under one SHALL (store and email)",
  "C001-REQ-104": "contradicts C001-REQ-103 (2 hours vs 24 hours)",
  "C001-REQ-105": "ambiguous: 'relevant' coupons undefined",
  "C001-REQ-106": "implementation detail: database table and SQL",
  "C001-REQ-107": "untestable: no limit or unit for 'many'",
};

const REQ = (n, title, statement) => `### C001-REQ-10${n} — ${title}\n- **Pattern:** ${/^WHEN/.test(statement) ? "event-driven" : /^IF/.test(statement) ? "unwanted-behaviour" : "ubiquitous"}\n- **Statement:** ${statement}\n- **Rationale:** ideation Goals\n- **Stories:** C001-US-101\n- **Priority:** Must\n- **Acceptance:** C001-AC-10${n}.1\n`;
const AC = (n) => `#### C001-AC-10${n}.1 — Criterion ${n}\n\`\`\`gherkin\nScenario: C001-TS-10${n} — case ${n}\n  Given a customer with an order of 100 EUR\n  When the customer applies coupon "TEN"\n  Then the result of requirement ${n} is observed\n\`\`\`\n`;
const STATEMENTS = [
  ["Apply a coupon", "WHEN a customer applies a valid coupon code at checkout, THE checkout SHALL reduce the order total before tax by the coupon's percentage."],
  ["Record redemption", "WHEN a coupon is redeemed, THE checkout SHALL store the redemption and send the customer a confirmation e-mail."],
  ["Late cancellation", "WHEN a customer cancels an order 2 hours or more before delivery, THE checkout SHALL restore the coupon to the customer."],
  ["Cancellation window", "IF a customer cancels an order less than 24 hours before delivery, THEN THE checkout SHALL keep the coupon redeemed."],
  ["Coupon list", "WHEN a customer opens the coupon list, THE checkout SHALL show the relevant coupons first."],
  ["Persist coupons", "WHEN a coupon is created, THE checkout SHALL insert a row into the PostgreSQL coupons table with an INSERT statement."],
  ["Many coupons", "THE checkout SHALL accept many coupons per campaign."],
];

export function seededSpec(root) {
  specStart()(root);
  const reqs = STATEMENTS.map(([t, s], i) => REQ(i + 1, t, s)).join("\n");
  const acs = STATEMENTS.map((_, i) => AC(i + 1)).join("\n");
  const cov = `| REQ | happy | alternate | boundary | error | authorization | concurrency/idempotency | abuse |\n|---|---|---|---|---|---|---|---|\n${STATEMENTS.map((_, i) => `| C001-REQ-10${i + 1} | TS-10${i + 1} | n/a: x | n/a: x | n/a: x | n/a: x | n/a: x | n/a: x |`).join("\n")}\n`;
  write(root, `${CHANGE}/10-spec/spec.md`, `---\nid: C001-SPEC\nartifact: spec/lite\nchange: CHG-001\nphase: 10-spec\nstatus: draft\n---\n# CHG-001 — Specification (lite)\n\n## Context\n\nCustomers use coupon codes at checkout.\n\n## Stories\n\n### C001-US-101 — Use coupons\n- **As a** customer\n- **I want** to use coupons\n- **So that** I pay less\n- **Value / outcome:** campaigns without refunds\n- **Priority:** Must · **Size hint:** M · **Capability:** coupons\n- **Context & notes:** none\n- **Requirements:** ${STATEMENTS.map((_, i) => `C001-REQ-10${i + 1}`).join(", ")}\n- **Traces to:** IDEA\n\n## Requirements\n\n${reqs}\n## Acceptance\n\n${acs}\n${cov}\n## NFRs\n\nNone.\n\n## Domain notes\n\nCoupon: code, percentage.\n\n## Interfaces\n\nNone new.\n\n## Architecture notes\n\nThe checkout module applies coupons.\n`);
  write(root, `${CHANGE}/10-spec/dod.md`, `---\nid: C001-SPEC-DOD\nartifact: spec/dod\nchange: CHG-001\nphase: 10-spec\n---\n# DoD\n\n| ID | Statement | Evidence type | Covers |\n|---|---|---|---|\n| C001-DOD-001 | Acceptance tests pass | test-report | ${STATEMENTS.map((_, i) => `C001-REQ-10${i + 1}`).join(", ")} |\n`);
  edit(root, `${CHANGE}/change.md`, (t) => t.replace(/^( {2}10-spec: \{ status: )not-started/m, "$1draft").replace(/^phase: 00-ideation$/m, "phase: 10-spec"));
  sdd(root, "status", "--write");
  git(root, "add", "-A");
  git(root, "commit", "-q", "-m", "seeded");
}

export { constitution };
