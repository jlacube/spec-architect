---
name: architecture-decisions
description: How the architect records technical decisions of an SDD change as ADRs in MADR form — when an ADR is needed, the options analysis behind it, the sections, links to constraints and components, and statuses. Use in the plan phase (or the spec phase) when a technical decision is not settled by an existing DEC or ADR.
---

# Architecture decisions (ADR)

## When

Write an ADR when a technical decision is needed and no DEC (ideation) or ADR settles it: a
library or service choice, a data or consistency strategy, a deployment or integration pattern,
anything a later implementer would otherwise decide alone. A decision that P-01 must take goes
through the conductor as a question first; the ADR records the outcome.

## How

1. **Options analysis first** (options-analysis skill): `20-plan/20-decisions/OA-<seq>-<slug>.md`
   with four or five candidates, weighted criteria and the recommendation.
2. **ADR** `20-plan/20-decisions/ADR-<seq>-<slug>.md` from the plugin template (`sdd id next ADR
   --change <NNN>`), in MADR form:

```markdown
---
id: C004-ADR-003
artifact: plan/adr
change: CHG-004
phase: 20-plan
status: proposed | accepted | superseded
---
# C004-ADR-003 — Job deduplication

## Context and problem
<forces, the requirements and NFRs at stake (IDs), what goes wrong without a decision>

## Considered options
<the presented candidates of OA-<seq> with one line each; link the OA file>

## Decision outcome
<chosen option and why, in two to four sentences; the near-tie argument when there is one>

## Consequences
<good and bad consequences; affected constraints (CON IDs) and components (COMP IDs); follow-up
tasks or risks>
```

- The ADR links its OA file and at least one CON or COMP ID.
- A new constraint that follows from the decision goes into `60-architecture/constraints.md`
  with the ADR as its source (in a revision of the spec when the spec is already approved —
  report it instead of editing an approved phase).
- Status `proposed` until P-01 accepts the decision (or the plan is approved at G3);
  `superseded by ADR-<n>` when replaced. Never rewrite an accepted ADR: supersede it.
