// C001-TC-714 — verifies C001-TS-714 (C001-AC-714.1, C001-REQ-714): focused re-review. The spec of change
// 004 (two capabilities' worth of requirements, each with its story, AC and TS) was approved; REQ-012 was
// then modified. The brief names the changed ID (the conductor's impact list; `sdd change revise`
// computes it in C001-T-044). The report's reviewed set holds REQ-012, its AC, TS and story, and no
// unrelated ID.
import { checker } from "../harness/assert.mjs";
import { constitution } from "../cap02/drafting.mjs";
import { edit, git, sdd, write } from "../harness/workspaces.mjs";
import { criticRun, read } from "./critic.mjs";

const DIR = ".sdd/004-coupon-codes";
const REPORT = `${DIR}/10-spec/90-critic-report.md`;

const REQ = (n, us, statement) => `### C004-REQ-0${n} — R${n}\n- **Pattern:** event-driven\n- **Statement:** ${statement}\n- **Rationale:** ideation Goals\n- **Stories:** C004-US-00${us}\n- **Priority:** Must\n- **Acceptance:** C004-AC-0${n}.1\n`;
const STORY = (n, req, what) => `### C004-US-00${n} — ${what}\n- **As a** customer\n- **I want** ${what}\n- **So that** I pay less\n- **Value / outcome:** campaigns\n- **Priority:** Must · **Size hint:** S · **Capability:** coupons\n- **Context & notes:** none\n- **Requirements:** ${req}\n- **Traces to:** IDEA\n`;
const AC = (n) => `#### C004-AC-0${n}.1 — Criterion\n\`\`\`gherkin\nScenario: C004-TS-0${n} — case\n  Given an order of 100 EUR\n  When the customer applies coupon "TEN"\n  Then the expected result of R${n} is shown\n\`\`\`\n`;

function spec(statement12) {
  return `---\nid: C004-SPEC\nartifact: spec/lite\nchange: CHG-004\nphase: 10-spec\nstatus: draft\n---\n# CHG-004 — Specification (lite)\n\n## Context\n\nCoupons at checkout.\n\n## Stories\n\n${STORY(1, "C004-REQ-012", "to apply a coupon")}\n${STORY(2, "C004-REQ-013", "to see my coupons")}\n## Requirements\n\n${REQ(12, 1, statement12)}\n${REQ(13, 2, "WHEN a customer opens the account page, THE checkout SHALL list the customer's unredeemed coupons.")}\n## Acceptance\n\n${AC(12)}\n${AC(13)}\n| REQ | happy | alternate | boundary | error | authorization | concurrency/idempotency | abuse |\n|---|---|---|---|---|---|---|---|\n| C004-REQ-012 | TS-012 | n/a: x | n/a: x | n/a: x | n/a: x | n/a: x | n/a: x |\n| C004-REQ-013 | TS-013 | n/a: x | n/a: x | n/a: x | n/a: x | n/a: x | n/a: x |\n\n## NFRs\n\nNone.\n\n## Domain notes\n\nCoupon.\n\n## Interfaces\n\nNone.\n\n## Architecture notes\n\nCheckout module.\n`;
}

function given(root) {
  git(root, "init", "-q");
  sdd(root, "init");
  constitution(root, "approved");
  for (let i = 1; i < 4; i++) sdd(root, "change", "new", `Earlier ${i}`, "--profile", "lite");
  sdd(root, "change", "new", "Coupon codes", "--profile", "lite");
  write(root, `${DIR}/00-ideation/ideation.md`, "# Ideation\n\n## Problem statement\n\nNo coupons.\n");
  write(root, `${DIR}/10-spec/spec.md`, spec("WHEN a customer applies a valid coupon code, THE checkout SHALL reduce the order total by the coupon's percentage."));
  write(root, `${DIR}/10-spec/dod.md`, "---\nid: C004-SPEC-DOD\nartifact: spec/dod\n---\n\n| ID | Statement | Evidence type | Covers |\n|---|---|---|---|\n| C004-DOD-001 | Tests pass | test-report | C004-REQ-012, C004-REQ-013 |\n");
  edit(root, `${DIR}/change.md`, (t) => t.replace(/^( {2}00-ideation: \{ status: )not-started/m, "$1in-review"));
  sdd(root, "gate", "approve", "004", "00-ideation", "--note", "Approve", "--by", "p01");
  edit(root, `${DIR}/change.md`, (t) => t.replace(/^( {2}10-spec: \{ status: )not-started/m, "$1in-review").replace(/^phase: 00-ideation$/m, "phase: 10-spec"));
  sdd(root, "gate", "approve", "004", "10-spec", "--note", "Approve", "--by", "p01");
  // Revision: REQ-012 modified after approval.
  edit(root, `${DIR}/10-spec/spec.md`, (t) => t.replace("reduce the order total by the coupon's percentage.", "reduce the order total before tax by the coupon's percentage, rounded half up to the cent."));
  edit(root, `${DIR}/change.md`, (t) => t.replace(/^( {2}10-spec: \{ status: )approved/m, "$1in-revision"));
  sdd(root, "status", "--write");
  git(root, "add", "-A");
  git(root, "commit", "-q", "-m", "revision");
}

const BRIEF = `Brief — critic: re-review a revised spec.
- Change: CHG-004 "Coupon codes" · profile lite · kind greenfield
- Phase / step: 10-spec · revision, step 7 — Critique
- Task: the spec was approved and then revised. IDs changed since the last approval (per-ID content hash): modified C004-REQ-012; none added or removed. Review the revision as the critique-rubrics skill says for re-reviews.
- Inputs: \`${DIR}/10-spec/spec.md\`, \`${DIR}/10-spec/dod.md\`.
- Outputs: \`${REPORT}\` only.
- Quality bar: critique-rubrics, ears-requirements, sdd-conventions.
- Return contract: digest (at most 15 lines) and the report path.`;

export default {
  id: "TS-714",
  title: "Focused re-review",
  ...criticRun(BRIEF, given),
  assert({ root }) {
    const { failures, check } = checker();
    const text = read(root, REPORT);
    check(text, "no critic report");
    const fm = /^---\n([\s\S]*?)\n---/.exec(text)?.[1] ?? "";
    const reviewed = (/reviewed_ids:\s*([\s\S]*?)(?=\n\w|$)/.exec(fm)?.[1] ?? "");
    for (const id of ["C004-REQ-012", "C004-AC-012.1", "C004-TS-012", "C004-US-001"]) check(reviewed.includes(id), `reviewed set lacks ${id}: ${reviewed.trim() || "(none)"}`);
    for (const id of ["C004-REQ-013", "C004-AC-013.1", "C004-TS-013", "C004-US-002"]) check(!reviewed.includes(id), `reviewed set includes unrelated ${id}`);
    return failures;
  },
};
