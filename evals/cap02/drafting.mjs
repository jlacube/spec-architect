// Shared Givens for the phase-procedure scenarios of C001-T-032 (C001-TS-133, 213…218): workspaces
// at the start of ideation or specification, built with the real CLI. Specialists that are not
// written yet run as stand-ins (harness/overlay.mjs); `.eval/handbacks/<agent>.md` scripts a
// stand-in's hand-back.
import { cpSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "../harness/fixtures.mjs";
import { edit, git, sdd, write } from "../harness/workspaces.mjs";

export function constitution(root, status) {
  write(root, ".sdd/_constitution/constitution.md", `---\nid: CONSTITUTION\nartifact: constitution\nstatus: ${status}\n---\n# Constitution\n\n## Quality bar\n\nEvery requirement is testable.\n`);
}

/** Changes 001…nnn so the last one has the wanted number; returns its folder (".sdd/<nnn>-<slug>"). */
function changes(root, nnn, title, args) {
  for (let i = 1; i < nnn; i++) sdd(root, "change", "new", `Earlier change ${i}`, "--profile", "lite");
  sdd(root, "change", "new", title, ...args);
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `.sdd/${String(nnn).padStart(3, "0")}-${slug}`;
}

/** Brownfield ideation start on a copy of fx-brownfield-ts (constitution approved). */
export function brownfieldIdeation(root) {
  cpSync(join(ROOT, "tests", "fixtures", "fx-brownfield-ts"), root, { recursive: true });
  git(root, "init", "-q");
  sdd(root, "init");
  constitution(root, "approved");
  changes(root, 1, "Coupon codes at checkout", ["--kind", "brownfield"]);
  sdd(root, "status", "--write");
  git(root, "add", "-A");
  git(root, "commit", "-q", "-m", "fixture");
}

export const IDEA = "Customers should be able to enter a coupon code at checkout that gives a percentage discount; finance wants a report of discounts per month.";

const LITE_IDEATION = `# Ideation — Coupon codes

## Problem statement

Customers cannot use promotional codes, so marketing campaigns need manual refunds.

## Goals and non-goals

- Goal: a customer applies one percentage coupon at checkout.
- Non-goal: gift cards.

## Scope boundary

In scope: one coupon per order, percentage discounts. Out of scope: stacking.

## Design direction

A coupon service validates codes; checkout applies the discount before tax.

## Open questions

None.
`;

/**
 * Spec start of change `nnn` (lite unless `profile` says otherwise): ideation written and approved
 * through the CLI, so 10-spec may start. `kind` sets greenfield or brownfield.
 */
export function specStart({ nnn = 1, profile = "lite", kind = "greenfield", brownfield = false } = {}) {
  return (root) => {
    if (brownfield) cpSync(join(ROOT, "tests", "fixtures", "fx-brownfield-ts"), root, { recursive: true });
    git(root, "init", "-q");
    sdd(root, "init");
    constitution(root, "approved");
    const dir = changes(root, nnn, "Coupon codes", ["--profile", profile, "--kind", kind]);
    write(root, `${dir}/00-ideation/ideation.md`, LITE_IDEATION);
    edit(root, `${dir}/change.md`, (t) => t.replace(/^( {2}00-ideation: \{ status: )not-started/m, "$1in-review"));
    sdd(root, "gate", "approve", String(nnn).padStart(3, "0"), "00-ideation", "--note", "Approve", "--by", "p01");
    sdd(root, "status", "--write");
    git(root, "add", "-A");
    git(root, "commit", "-q", "-m", "fixture");
  };
}

const LITE_SPEC = `---
id: C001-SPEC
artifact: spec/lite
change: CHG-001
phase: 10-spec
status: draft
---
# CHG-001 — Specification (lite)

## Context

Customers cannot use promotional codes at checkout (ideation, Problem statement). Persona: C001-P-01 customer.

## Stories

### C001-US-101 — Apply a coupon
- **As a** customer
- **I want** to enter a coupon code at checkout
- **So that** my order is discounted
- **Value / outcome:** campaigns without manual refunds
- **Priority:** Must · **Size hint:** S · **Capability:** coupons (the single capability of this lite change)
- **Context & notes:** one percentage coupon per order (ideation, Scope boundary)
- **Requirements:** C001-REQ-101
- **Traces to:** IDEA

## Requirements

### C001-REQ-101 — Apply a percentage coupon
- **Pattern:** event-driven
- **Statement:** WHEN a customer applies a valid coupon code at checkout, THE checkout SHALL reduce the order total before tax by the coupon's percentage.
- **Rationale:** ideation Goals
- **Stories:** C001-US-101
- **Priority:** Must
- **Acceptance:** C001-AC-101.1

## Acceptance

#### C001-AC-101.1 — Discount applied
\`\`\`gherkin
Scenario: C001-TS-101 — valid coupon
  Given an order of 100 EUR and coupon "TEN" for 10 %
  When the customer applies "TEN"
  Then the total before tax is 90 EUR
\`\`\`

| REQ | happy | alternate | boundary | error | authorization | concurrency/idempotency | abuse |
|---|---|---|---|---|---|---|---|
| C001-REQ-101 | TS-101 | n/a: one path | n/a: no limits in v1 | n/a: invalid codes are out of scope for v1 | n/a: no roles | n/a: single request | n/a: no abuse vector in v1 |

## NFRs

None for v1 beyond the constitution defaults.

## Domain notes

Coupon: code, percentage (1–100). Applied once per order.

## Interfaces

None new; the checkout form gains a coupon field.

## Architecture notes

The checkout module applies the discount before tax; no new component.
`;

const LITE_DOD = `---
id: C001-SPEC-DOD
artifact: spec/dod
change: CHG-001
phase: 10-spec
---
# CHG-001 — Definition of done

| ID | Statement | Evidence type | Covers |
|---|---|---|---|
| C001-DOD-001 | Acceptance tests pass | test-report | C001-REQ-101 |
`;

/** Lite change 001 at 10-spec draft whose spec is complete and lint-clean (ideation approved). */
export function liteSpecDrafted(root) {
  specStart()(root);
  write(root, ".sdd/001-coupon-codes/10-spec/spec.md", LITE_SPEC);
  write(root, ".sdd/001-coupon-codes/10-spec/dod.md", LITE_DOD);
  edit(root, ".sdd/001-coupon-codes/change.md", (t) => t.replace(/^( {2}10-spec: \{ status: )not-started/m, "$1draft").replace(/^phase: 00-ideation$/m, "phase: 10-spec"));
  sdd(root, "trace", "001", "--write");
  sdd(root, "status", "--write");
  git(root, "add", "-A");
  git(root, "commit", "-q", "-m", "draft");
}
