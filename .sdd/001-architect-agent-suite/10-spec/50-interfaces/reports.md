---
id: C001-IF-11
artifact: spec/interface
kind: report formats
change: CHG-001
phase: 10-spec
status: draft
---

# C001-IF-11 — Lint report, critic report, ideation readiness checklist

## §1 Lint report (JSON)

Schema: `lint-report.schema.json`. Shape:

```json
{
  "tool": "architect-plugin@0.1.0",
  "scope": { "changes": ["CHG-004"], "phase": null, "quick": false },
  "summary": { "error": 1, "warn": 3, "info": 2 },
  "findings": [
    { "code": "LINT-EARS-002", "severity": "error", "path": ".sdd/004-x/10-spec/20-capabilities/CAP-01-a/requirements.md", "line": 42, "ids": ["C004-REQ-012"], "message": "Requirement contains 2 SHALL keywords", "fix": "Split into two requirements" }
  ],
  "coverage": { "TR-01": { "covered": 14, "total": 14 }, "TR-02": { "covered": 40, "total": 41 } }
}
```

## §2 Critic report (Markdown)

```markdown
---
artifact: critic-report
change: CHG-004
phase: 10-spec
reviewed_ids: all | [list]     # list on revisions (C001-REQ-714)
---
# Critic report — CHG-004 10-spec
## Summary
| blocker | major | minor |
## Findings
### CR-1 — <title>
- **Severity:** blocker | major | minor
- **Refs:** C004-REQ-012, C004-AC-012.1
- **Evidence:** "<verbatim quote>" — `<path>:<line>`
- **Why it matters:** …
- **Suggested fix:** …
- **Status:** open | resolved (by <change>) | waived (gate)
## Rubric
| Rubric item | Result |
## Why no further findings        (required when fewer than 3 findings, C001-REQ-712)
## Verdict                         (ideation only: go | needs-clarification | stop + reasons, C001-REQ-318)
```

## §3 Ideation readiness checklist (G1)

| # | Item | Typical severity if unmet |
|---|---|---|
| 1 | The problem is stated and evidenced (research note or user statement) | blocker |
| 2 | Goals are measurable (each has a measure) | major |
| 3 | Non-goals and the scope boundary are explicit | major |
| 4 | Every material decision has a DEC with ≥ 2 presented options | major |
| 5 | Open questions are classified blocking / deferred with an owner | blocker if a blocking one is open |
| 6 | Key risks and assumptions are listed | minor |
| 7 | Brownfield: the baseline survey exists and is cited | blocker (brownfield) |
| 8 | Sources are cited for external claims | major |
| 9 | Q&A answers are logged verbatim, including embedded instructions | major |
| 10 | The profile (lite/full) is confirmed by P-01 | minor |
