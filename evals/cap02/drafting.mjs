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

const SECTIONS = ["Document control", "Problem statement", "Q&A decision record", "Goals and non-goals", "Scope boundary", "Research index", "Options and decisions index", "Design direction", "Risks", "Assumptions", "Open questions", "Sources"];
const STORY = "- **As a** P-01 owner\n- **I want** to apply a coupon\n- **So that** the order is discounted\n- **Value / outcome:** campaigns without refunds\n- **Priority:** Must · **Size hint:** S · **Capability:** C004-CAP-01\n- **Context & notes:** none beyond the requirement\n";
const COVERAGE = "| REQ | happy | alternate | boundary | error | authorization | concurrency/idempotency | abuse |\n|---|---|---|---|---|---|---|---|\n| C004-REQ-012 | TS-012 | n/a: x | n/a: x | n/a: x | n/a: x | n/a: x | n/a: x |\n";

/** Full-profile change 004 whose spec is drafted and lint-clean (phase 10-spec draft). */
export function specDrafted(root) {
  git(root, "init", "-q");
  sdd(root, "init");
  constitution(root, "approved");
  const dir = changes(root, 4, "Coupon codes", ["--profile", "full"]);
  write(root, `${dir}/00-ideation/ideation.md`, `# Ideation — Coupon codes\n\n${SECTIONS.map((s, i) => `## ${i + 1}. ${s}\n\nSee the problem: customers cannot use promotional codes.\n`).join("\n")}`);
  edit(root, `${dir}/change.md`, (t) => t.replace(/^( {2}00-ideation: \{ status: )not-started/m, "$1in-review"));
  sdd(root, "gate", "approve", "004", "00-ideation", "--note", "Approve", "--by", "p01");
  const S = `${dir}/10-spec`;
  write(root, `${S}/10-context/stakeholders-and-personas.md`, "---\nid: C004-SPEC-CTX-04\nartifact: spec/context/personas\n---\n\n## P-01 — Owner\n\nOwns the spec.\n");
  write(root, `${S}/40-domain/glossary-delta.md`, "---\nid: C004-SPEC-GLOSSARY\nartifact: spec/glossary-delta\n---\n\n## 2. System names\n\n| Name | Component |\n|---|---|\n| checkout | — |\n");
  write(root, `${S}/20-capabilities/CAP-01-coupons/requirements.md`, "---\nid: C004-CAP-01\nartifact: spec/requirements\n---\n\n### C004-REQ-012 — Apply a coupon\n- **Pattern:** ubiquitous\n- **Statement:** THE checkout SHALL apply one valid percentage coupon to the order total before tax.\n- **Rationale:** campaigns\n- **Stories:** C004-US-001\n- **Priority:** Must\n- **Acceptance:** C004-AC-012.1\n");
  write(root, `${S}/20-capabilities/CAP-01-coupons/stories.md`, `---\nid: C004-CAP-01\nartifact: spec/stories\n---\n\n### C004-US-001 — Apply a coupon\n${STORY}- **Requirements:** C004-REQ-012\n- **Traces to:** IDEA\n`);
  write(root, `${S}/20-capabilities/CAP-01-coupons/acceptance.md`, `---\nid: C004-CAP-01\nartifact: spec/acceptance\n---\n\n#### C004-AC-012.1 — Discount applied\n\`\`\`gherkin\nScenario: C004-TS-012 — valid coupon\n  Given an order of 100 EUR and coupon "TEN" for 10 %\n  When the customer applies "TEN"\n  Then the total before tax is 90 EUR\n\`\`\`\n\n${COVERAGE}`);
  write(root, `${S}/70-dod.md`, "---\nid: C004-SPEC-DOD\nartifact: spec/dod\n---\n\n| ID | Statement | Evidence type | Covers |\n|---|---|---|---|\n| C004-DOD-001 | Tests pass | test-report | C004-REQ-012 |\n");
  edit(root, `${dir}/change.md`, (t) => t.replace(/^( {2}10-spec: \{ status: )not-started/m, "$1draft").replace(/^phase: 00-ideation$/m, "phase: 10-spec"));
  sdd(root, "trace", "004", "--write");
  sdd(root, "status", "--write");
  git(root, "add", "-A");
  git(root, "commit", "-q", "-m", "fixture");
}
