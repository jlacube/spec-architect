---
name: options-analysis
description: Method for analysing a material decision — problem statement, weighted criteria, four or five candidates scored 1–5, weighted totals, sensitivity, near-tie disclosure, the two or three presented options with a recommendation, and rejected candidates with reasons. Use before presenting any decision that changes scope, architecture, an interface, an NFR threshold or a dependency.
---

# Options analysis

A decision is **material** when it changes scope, architecture, an interface, an NFR threshold
or a dependency. Every material decision gets an analysis before P-01 sees options; a minor
choice (wording, ordering, a reversible default) does not need one.

## Procedure

1. **Problem.** One paragraph: what must be decided, why now, the constraints that bind (cite
   IDs: REQ, NFR, CON, DEC) and what is out of scope for this decision.
2. **Criteria.** Three to six criteria drawn from the constraints and quality goals, each with a
   weight in percent. Weights sum to **100 %**. Name each criterion so that a higher score is
   always better (e.g. "Low operating cost", not "Cost").
3. **Candidates.** **Four or five** genuinely different candidates, including the obvious
   default and at least one simpler option (often "do less" or "defer"). Variants of one idea
   count as one candidate. If fewer than four real candidates exist, say why and list what you
   searched.
4. **Scores.** Score every candidate on every criterion from **1** (poor) to **5** (excellent),
   with a short justification per score or per row, citing evidence (research note, code
   evidence, documentation) where it exists.
5. **Weighted totals.** For each candidate, total = Σ (score × weight), with weights as fractions
   (30 % → 0.30). Compute with two decimals and check the arithmetic: the lint recomputes each
   total and reports a difference above 0.01 (`LINT-OA-001`).
6. **Sensitivity.** State which weight change (or score change) would flip the ranking of the
   top two, and whether that change is plausible.
7. **Presented.** Pick the **best two or three** candidates to present. The recommendation is
   presented first.
8. **Recommendation.** Name it with a one-sentence rationale. **Near-tie disclosure:** when the
   recommended candidate's total is lower than, or within **0.10** of, another presented
   candidate's total, state the qualitative tie-breaker that justifies the recommendation
   (reversibility, risk, team familiarity, alignment with a stated principle).
9. **Rejected.** Every candidate not presented, each with a one-line reason.

## Output

Write `00-ideation/options/OA-<seq>-<slug>.md` (allocate the number with
`sdd id next OA --change <NNN>`; in a lite change, a section `### OA-<seq> — <title>` of the phase
file) with these headings, in order:

```markdown
# OA-003 — Persistence technology

## Problem
## Criteria          | Criterion | Weight |   (weights sum to 100 %)
## Candidates        one bullet per candidate: name — one-line description
## Scores            | Candidate | <criterion 1> | … | Weighted |
## Sensitivity
## Presented         2–3 candidates, recommendation first
## Recommendation    incl. the tie-breaker when a near tie applies
## Rejected          - <candidate> — <reason>
```

## Turning the analysis into a question

The question for P-01 (C001-IF-05 shape, interview-protocol skill) takes:

- `material: true`, `candidates_considered`: the number of candidates (4 or 5);
- `options`: the presented candidates in the presented order, the recommendation first with
  ` (Recommended)` appended to its label, each `rationale` one sentence (score and main
  trade-off);
- `rejected`: every non-presented candidate with its reason;
- `source_refs`: the `OA-…` ID and the evidence it cites.

## Pitfalls

- Do not tune weights after scoring to favour a candidate; if the weights were wrong, say so
  and re-score openly in the Sensitivity section.
- Do not present a candidate that violates a Must requirement or a constraint; reject it with
  that reason.
- Keep facts in their own artifacts: cite research notes by ID instead of repeating them.
