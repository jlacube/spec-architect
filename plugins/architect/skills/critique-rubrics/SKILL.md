---
name: critique-rubrics
description: How the critic reviews an SDD phase — the critic report format, finding fields and severities, per-artifact rubrics (ideation readiness, stories, requirements, NFRs, acceptance, domain, interfaces, architecture, DoD, index, plan), the "why no further findings" justification, focused re-reviews of revisions and the ideation verdict. Use for every critic review.
---

# Critique rubrics

You review; you never fix. Your only output file is the phase's critic report. Every finding is
backed by a verbatim quote with its location. Lint already checks syntax (IDs, EARS shapes, weak
words, coverage tables, links): run `sdd lint <NNN> --phase <phase>` first, cite its errors only
when they matter for a finding, and spend your effort on what lint cannot judge.

## Report

Path: `00-ideation/critic-report.md` (ideation), `10-spec/90-critic-report.md` (spec) or
`20-plan/90-critic-report.md` (plan); in a lite change next to the phase file with the same names.

```markdown
---
artifact: critic-report
change: CHG-<NNN>
phase: <phase>
reviewed_ids: all            # or the list of IDs reviewed in a revision (see Re-review)
---
# Critic report — CHG-<NNN> <phase>

## Summary
| blocker | major | minor |
|---|---|---|
| 0 | 2 | 3 |

## Findings
### CR-1 — <title>
- **Severity:** blocker | major | minor
- **Refs:** C004-REQ-012, C004-AC-012.1
- **Evidence:** "<verbatim quote>" — `10-spec/20-capabilities/CAP-01-billing/requirements.md:14`
- **Why it matters:** <consequence for the implementer, tester or P-01>
- **Suggested fix:** <concrete change>
- **Status:** open

## Rubric
| Rubric | Item | Result |
|---|---|---|
| requirements | R1 Singular outcome | pass |
| requirements | R2 Testable | CR-1 |
| requirements | R11 Delta and evidence | n/a: greenfield change |

## Why no further findings      (required when there are fewer than three findings)
## Verdict                       (ideation reviews only; always the last section)
```

- Finding IDs `CR-<n>` from 1 in the report; every finding has all six fields; Status `open`.
- **Severity:** blocker — the phase cannot be approved as is (a wrong or missing requirement, a
  contradiction, an open blocking question); major — a reviewer would send it back (ambiguity,
  untestable statement, missing coverage of a real case); minor — clarity, consistency, style.
- **Rubric table:** one row per item of every rubric section that applies to the phase, each
  marked `pass`, a finding ID, or `n/a: <reason>`.
- **Why no further findings:** when the review has fewer than three findings, one paragraph per
  rubric section applied, saying what you checked and why nothing else is wrong.

## Rubric — ideation readiness (G1)

| # | Item | Severity if unmet |
|---|---|---|
| I1 | Problem stated and evidenced (research note or user statement) | blocker |
| I2 | Goals measurable (each has a measure) | major |
| I3 | Non-goals and the scope boundary explicit | major |
| I4 | Every material decision has a DEC with ≥ 2 presented options | major |
| I5 | Open questions classified blocking / deferred with an owner | blocker if a blocking one is open |
| I6 | Key risks and assumptions listed | minor |
| I7 | Brownfield: baseline survey exists and is cited | blocker (brownfield) |
| I8 | Sources cited for external claims | major |
| I9 | Q&A answers logged verbatim, including embedded instructions | major |
| I10 | Profile (lite/full) confirmed by P-01 | minor |

**Verdict** (last section of an ideation report): exactly one of `go`, `needs-clarification`,
`stop`, followed by the reasons. `go` — no blocker; `needs-clarification` — blockers that P-01
can resolve by answering; `stop` — the idea is not viable as stated.

## Rubric — stories

S1 persona is a defined P-ID · S2 value / outcome stated · S3 INVEST (small, independent,
testable) · S4 every story has ≥ 1 requirement · S5 out of scope stated where a neighbour exists ·
S6 traces to the ideation.

## Rubric — requirements (12 items)

| # | Item |
|---|---|
| R1 | Singular outcome: one SHALL, one observable outcome (actions that can fail independently are split) |
| R2 | Testable: an observer can decide pass or fail from outside the system |
| R3 | Unambiguous: one reading only; terms defined in the glossary |
| R4 | Correct EARS pattern for the trigger (event, state, unwanted behaviour, option) |
| R5 | Implementation-free: no class, table or UI-widget design |
| R6 | Complete: inputs, outputs and the error case of the behaviour are specified somewhere |
| R7 | Consistent: no contradiction with another requirement, NFR, decision or the constitution |
| R8 | Feasible within the constraints and decisions recorded |
| R9 | Necessary: traces to a story and the ideation; nothing gold-plated |
| R10 | Measurable values carry units and limits |
| R11 | Delta and evidence: brownfield MODIFIED/REMOVED cite the living ID and the evidence |
| R12 | Priority set and consistent with the story |

## Rubric — NFRs

N1 ISO 25010 category · N2 metric with unit · N3 threshold set (or clarification marker with a
question) · N4 feasible method and environment · N5 covered by a DoD item.

## Rubric — acceptance

A1 every requirement has ≥ 1 AC and every AC ≥ 1 scenario · A2 scenarios observable and concrete
(values, not "valid input") · A3 one behaviour per scenario · A4 error and abuse cases present
where the requirement can fail or be misused · A5 `n/a` cells justified credibly.

## Rubric — domain, interfaces, architecture

D1 entities with attributes, relationships, owner and invariants · D2 lifecycles with > 2 states
have a diagram and a complete transition table · D3 interfaces parse and name their errors · D4
every component has an ID, responsibilities and the requirements it serves · D5 decisions with
alternatives are recorded (DEC / ADR).

## Rubric — DoD and index

O1 every REQ and NFR covered · O2 evidence types fit the statements · O3 global items referenced
· X1 the index is navigation only (no restated requirements).

## Rubric — plan

P1 every requirement covered by a task · P2 each task has targets, verification and done-checks ·
P3 the dependency graph is acyclic and milestones are coherent · P4 every scenario maps to a
planned test · P5 risks cover the hotspots touched · P6 rollout and rollback stated · P7 ADRs for
every remaining technical decision.

## Re-review of a revision

When the brief names the IDs added, modified or removed since the last approval, review those
IDs **and every ID linked to them** (their ACs and TSs, the stories that list them, the DoD
items, NFRs, components and tasks that reference them); nothing else. Write that set in the
frontmatter (`reviewed_ids: [C004-REQ-012, C004-AC-012.1, C004-TS-012, C004-US-001, …]`) and
apply the rubric rows only to it.

## Calibration (from CHG-001)

- *major* — "Several requirements bundle multiple actions under one SHALL": two actions that can
  fail independently → split (R1).
- *major* — an NFR whose method could not be run in the stated environment (N4).
- *minor* — a diagram that could not be checked for rendering (D-section, style).
- Not a finding: wording you would phrase differently when the meaning is unambiguous.
