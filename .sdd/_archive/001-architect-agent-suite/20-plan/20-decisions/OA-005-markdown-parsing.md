---
id: C001-OA-005
artifact: plan/option-analysis
change: CHG-001
phase: 20-plan
status: approved
---

# C001-OA-005 — How the CLI parses markdown artifacts

## Problem

The parser (T-010) must extract frontmatter, headings, field bullets, tables, fenced blocks
and gherkin titles with exact line numbers from about 500 files in ≤ 5 s
(C001-NFR-101), bundled into one file (C001-NFR-501).

## Criteria

| Criterion | Weight |
|---|---|
| Line-accurate locations | 30% |
| Robustness on our artifact grammar | 25% |
| Bundle size / start-up time | 20% |
| Maintainability | 15% |
| License | 10% |

## Candidates

A. Line-oriented custom block parser + `yaml` for frontmatter
B. `remark`/`mdast` full markdown AST
C. `markdown-it` tokens
D. Regexes per rule over raw text
E. Convert artifacts to JSON sidecars

## Scores

| Candidate | Lines | Robustness | Size | Maint. | License | Weighted |
|---|---|---|---|---|---|---|
| A | 5 | 4 | 5 | 4 | 5 | 4.60 |
| B | 4 | 5 | 2 | 4 | 5 | 3.95 |
| C | 4 | 4 | 4 | 3 | 5 | 3.95 |
| D | 5 | 2 | 5 | 2 | 5 | 3.80 |
| E | 3 | 5 | 4 | 2 | 5 | 3.75 |

## Sensitivity

A stays first unless robustness is weighted above 45%. Our artifact grammar is constrained
by templates, so robustness on general markdown matters less than speed and line accuracy.

## Presented

A, B, C.

## Recommendation

A. The grammar is ours (C001-IF-03): headings, `- **Field:** value` bullets, tables, fences.
A small line parser gives exact lines and fast start-up for hooks (C001-NFR-103).

## Rejected

- D: brittle, duplicated logic in every rule.
- E: second source of truth beside markdown.
