// Givens of the revise and stop scenarios (C001-T-044), built with the CLI: lite change 004 whose spec
// (REQ-012 and REQ-020, each with an AC and a TS) is approved and whose plan has tasks implementing them.
import { constitution } from "../cap02/drafting.mjs";
import { edit, git, sdd, write } from "../harness/workspaces.mjs";

export const DIR = ".sdd/004-coupon-codes";

const REQ = (n, title, statement) => `### C004-REQ-0${n} — ${title}\n- **Pattern:** event-driven\n- **Statement:** ${statement}\n- **Rationale:** ideation Goals\n- **Stories:** C004-US-101\n- **Priority:** Must\n- **Acceptance:** C004-AC-0${n}.1\n`;
const AC = (n, ts, title) => `#### C004-AC-0${n}.1 — ${title}\n\`\`\`gherkin\nScenario: C004-TS-0${ts} — ${title.toLowerCase()}\n  Given an order of 100 EUR and coupon "TEN" for 10 %\n  When the customer applies "TEN"\n  Then the outcome of REQ-0${n} is observed\n\`\`\`\n`;

export const SPEC = `---
id: C004-SPEC
artifact: spec/lite
change: CHG-004
phase: 10-spec
status: draft
---
# CHG-004 — Specification (lite)

## Context

Customers use coupon codes at checkout.

## Stories

### C004-US-101 — Apply a coupon
- **As a** customer
- **I want** to apply a coupon code at checkout
- **So that** my order is discounted
- **Value / outcome:** campaigns without refunds
- **Priority:** Must · **Size hint:** S · **Capability:** coupons (the single capability of this lite change)
- **Context & notes:** none
- **Requirements:** C004-REQ-012, C004-REQ-020
- **Traces to:** IDEA

## Requirements

${REQ(12, "Apply a coupon", "WHEN a customer applies a valid coupon code at checkout, THE checkout SHALL reduce the order total before tax by the coupon's percentage.")}
${REQ(20, "Show the saving", "WHEN a coupon is applied, THE checkout SHALL show the saved amount on the order summary.")}
## Acceptance

${AC(12, 12, "Discount applied")}
${AC(20, 20, "Saving shown")}
| REQ | happy | alternate | boundary | error | authorization | concurrency/idempotency | abuse |
|---|---|---|---|---|---|---|---|
| C004-REQ-012 | TS-012 | n/a: one path | n/a: no limits | n/a: out of scope | n/a: no roles | n/a: single request | n/a: none |
| C004-REQ-020 | TS-020 | n/a: one path | n/a: no limits | n/a: out of scope | n/a: no roles | n/a: single request | n/a: none |

## NFRs

None for v1.

## Domain notes

Coupon: code, percentage.

## Interfaces

None new.

## Architecture notes

The checkout module applies coupons.
`;

const DOD = "---\nid: C004-SPEC-DOD\nartifact: spec/dod\nchange: CHG-004\nphase: 10-spec\n---\n# DoD\n\n| ID | Statement | Evidence type | Covers |\n|---|---|---|---|\n| C004-DOD-001 | Acceptance tests pass | test-report | C004-REQ-012, C004-REQ-020 |\n";

const PLAN = `---
id: C004-PLAN
artifact: plan/lite
change: CHG-004
phase: 20-plan
status: draft
---
# CHG-004 — Plan (lite)

## Strategy

One milestone.

## Tasks

### C004-T-001 — Discount at checkout
- **Status:** todo
- **Depends on:** none
- **Implements:** C004-REQ-012
- **Satisfies AC:** C004-AC-012.1
- **Verified by:** C004-TS-012
- **Estimate:** M
- **Targets:** src/checkout.ts
- **Verification:** npm test
- **Done when:** [ ] tests pass

### C004-T-002 — Saving on the summary
- **Status:** todo
- **Depends on:** C004-T-001
- **Implements:** C004-REQ-020
- **Satisfies AC:** C004-AC-020.1
- **Verified by:** C004-TS-020
- **Estimate:** S
- **Targets:** src/summary.ts
- **Verification:** npm test
- **Done when:** [ ] tests pass

## Test mapping

| TS | TC |
|---|---|
| C004-TS-012 | unit |
| C004-TS-020 | unit |

## Risks

None.
`;

/** Change 004 (lite): ideation and spec approved, plan drafted. */
export function specApproved(root) {
  git(root, "init", "-q");
  sdd(root, "init");
  constitution(root, "approved");
  for (let i = 1; i < 4; i++) sdd(root, "change", "new", `Earlier change ${i}`, "--profile", "lite");
  sdd(root, "change", "new", "Coupon codes", "--profile", "lite");
  write(root, `${DIR}/00-ideation/ideation.md`, "# Ideation — Coupon codes\n\n## Problem statement\n\nNo coupons today.\n");
  edit(root, `${DIR}/change.md`, (t) => t.replace(/^( {2}00-ideation: \{ status: )not-started/m, "$1in-review"));
  sdd(root, "gate", "approve", "004", "00-ideation", "--note", "Approve", "--by", "p01");
  write(root, `${DIR}/10-spec/spec.md`, SPEC);
  write(root, `${DIR}/10-spec/dod.md`, DOD);
  edit(root, `${DIR}/change.md`, (t) => t.replace(/^( {2}10-spec: \{ status: )not-started/m, "$1in-review").replace(/^phase: 00-ideation$/m, "phase: 10-spec"));
  sdd(root, "gate", "approve", "004", "10-spec", "--note", "Approve", "--by", "p01");
  write(root, `${DIR}/20-plan/plan.md`, PLAN);
  edit(root, `${DIR}/change.md`, (t) => t.replace(/^( {2}20-plan: \{ status: )not-started/m, "$1draft").replace(/^phase: 10-spec$/m, "phase: 20-plan"));
  sdd(root, "status", "--write");
}

/** C001-TS-815 Given: the approved spec is in revision; REQ-012 modified, TS-044 added, REQ-020 tombstoned. */
export function revised(root) {
  specApproved(root);
  sdd(root, "change", "revise", "004", "10-spec", "--reason", "defect D-001");
  edit(root, `${DIR}/10-spec/spec.md`, (t) =>
    t
      .replace("reduce the order total before tax by the coupon's percentage.", "reduce the order total before tax by the coupon's percentage, rounded half up to the cent.")
      .replace(/### C004-REQ-020[\s\S]*?(?=\n## Acceptance)/, "")
      .replace(/#### C004-AC-020\.1[\s\S]*?```\n```\n|#### C004-AC-020\.1[\s\S]*?```\n(?=\n)/, "")
      .replace("- **Requirements:** C004-REQ-012, C004-REQ-020", "- **Requirements:** C004-REQ-012")
      .replace(/\| C004-REQ-020 \|[^\n]*\n/, "")
      .replace("  Then the outcome of REQ-012 is observed\n```\n", "  Then the outcome of REQ-012 is observed\n```\n```gherkin\nScenario: C004-TS-044 — rounding\n  Given an order of 9.99 EUR and coupon \"TEN\" for 10 %\n  When the customer applies \"TEN\"\n  Then the total before tax is 8.99 EUR\n```\n"),
  );
  sdd(root, "id", "tombstone", "C004-REQ-020", "--reason", "folded into the order summary of CHG-005");
  git(root, "add", "-A");
  git(root, "commit", "-q", "-m", "revision");
}
