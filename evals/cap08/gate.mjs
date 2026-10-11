// Shared Given for the gate scenarios of C001-T-034 (C001-TS-802 … 804): lite change 004 whose spec is
// drafted, lint-clean and reviewed by the critic (no open finding), ready for gate G2. Specialists not written yet run as stand-ins.
import { architectWithStubs } from "../harness/overlay.mjs";
import { toolCalls } from "../harness/assert.mjs";
import { liteSpecDraftedAt } from "../cap02/drafting.mjs";
import { git, write } from "../harness/workspaces.mjs";

// The critic has already reviewed the draft: no finding open (C001-IF-11 §2).
const CRITIC = `---
artifact: critic-report
change: CHG-004
phase: 10-spec
reviewed_ids: all
---
# Critic report — CHG-004 10-spec

## Summary

| blocker | major | minor |
|---|---|---|
| 0 | 0 | 0 |

## Findings

None.

## Rubric

| Rubric item | Result |
|---|---|
| Every requirement testable | pass |

## Why no further findings

One requirement with one criterion and a complete coverage table; scope matches the approved ideation.
`;

function readyForG2(root) {
  liteSpecDraftedAt(4)(root);
  write(root, ".sdd/004-coupon-codes/10-spec/90-critic-report.md", CRITIC);
  git(root, "add", "-A");
  git(root, "commit", "-q", "-m", "critic");
}

export const gateG2 = {
  agent: "architect:sdd-conductor",
  plugins: [architectWithStubs],
  fixture: readyForG2,
  allowTools: ["Agent", "Write", "Edit", "Bash"],
  maxTurns: 24,
  prompt: "/architect:gate 004",
};

/** Whether the question is the gate question (its options include Approve and Stop). */
export const isGate = (q) => (q.options ?? []).some((o) => /^Approve\b/.test(o.label)) && (q.options ?? []).some((o) => /^Stop\b/.test(o.label));

/** Bash commands that run `sdd gate approve`. */
export const approvals = (transcript) => toolCalls(transcript, "Bash").map((c) => String(c.input?.command ?? "")).filter((c) => /\bgate\s+approve\b/.test(c));

/** Answer policy: `gate` answers the gate question, other questions get their first option. */
export const answering = (gate) => (q) => (isGate(q) ? gate : q.options[0].label);
