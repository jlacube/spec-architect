---
id: C001-T-010
title: "Markdown/frontmatter parser and workspace model"
change: CHG-001
phase: 20-plan
artifact: plan/task
milestone: C001-M-2
status: in-progress
depends_on: [C001-T-001]
implements: [C001-REQ-112]
satisfies_ac: [C001-AC-112.1]
verified_by: [C001-TS-117, C001-TC-117]
components: [C001-COMP-04]
risk_refs: [C001-RISK-007]
estimate: L
report: { commit: null, completed_at: null, notes: null }
---

# C001-T-010 — Markdown/frontmatter parser and workspace model

## Intent

Parse every workspace artifact into a typed graph: frontmatter, headings, ID definitions (heading, table-row, bullet and gherkin forms of C001-IF-04), field values, references and short-form resolution. All lint, trace and gate features depend on it.

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `src/model/frontmatter.ts` | YAML frontmatter split and parse (yaml package, bundled) |
| add | `src/model/blocks.ts` | heading tree, fenced blocks, tables, field bullets `- **Name:** value` |
| add | `src/model/ids.ts` | ID regexes per C001-IF-04 §1–§2; short-form resolution to the enclosing change |
| add | `src/model/graph.ts` | nodes {id,type,file,line,title,content_hash} and typed edges |
| add | `tests/unit/model/*.test.ts` | unit tests incl. this repository’s spec as a parsing fixture |

## Preconditions

- T-001
- Dependencies done: C001-T-001

## Step outline (no production code)

1. Implement block parsing with exact line numbers.
2. Implement ID extraction for every definition form used in CHG-001 (headings ###/####, table rows, **INV** bullets, gherkin Scenario titles, frontmatter id of stories.md).
3. Resolve short forms (REQ-012, AC-012.1, TS-40) to full IDs using the change folder number.
4. Build the graph and per-ID content blocks (C001-IF-13 §2 step 5 boundaries).

## Verification

- `npm test -- model` passes
- Parsing CHG-001 spec yields 80 US, 213 REQ, 235 AC, 235 TS, 27 NFR (cross-check with prototype counts)
- Run `npm run check` (from M-6; before that `npm test`) and `node plugins/architect/scripts/sdd.mjs lint` (from T-028).

## Done when

- [ ] Graph of CHG-001 matches prototype counts
- [ ] Short-form resolution tested (C001-TC-117)
- [ ] All test cases in `verified_by` pass at the tier required by C001-ADR-003
- [ ] Progress reported: `sdd task set C001-T-010 --status done --commit <sha>` (or frontmatter fallback before T-026)
