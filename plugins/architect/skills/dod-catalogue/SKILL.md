---
name: dod-catalogue
description: Writing the feature definition of done (70-dod.md / dod.md) of an SDD change — item IDs, checkable statements, evidence types, coverage of requirements and NFRs, and references to the constitution's global DoD items. Use when writing or reviewing a DoD.
---

# Definition of done

The DoD lists what must be true, with evidence, before the change counts as done. It covers
every requirement and NFR, directly or through a global rule.

## Item table

```markdown
| ID | Statement | Evidence type | Covers |
|---|---|---|---|
| C004-DOD-001 | Every acceptance scenario of CAP-01 passes in CI | test-report | C004-REQ-101, C004-REQ-102 |
| C004-DOD-002 | p95 latency of apply-coupon ≤ 300 ms in the load test | benchmark-report | C004-NFR-101 |
| C004-DOD-003 | The README documents the coupon settings | review-record | global |
```

- **ID:** `C<NNN>-DOD-<seq>` (`sdd id next DOD --change <NNN>`).
- **Statement:** checkable by someone who did not write it; no weak words.
- **Evidence type** (exactly these words): `test-report`, `coverage-report`,
  `benchmark-report`, `command-output`, `screenshot`, `link`, `review-record`,
  `metric-snapshot` (LINT-DOD-001).
- **Covers:** the REQ and NFR IDs it proves, or `global` for an item that applies to the whole
  change.
- Every REQ and NFR is covered by at least one item (TR-05). One test-report item per
  capability's scenarios is usually enough; each NFR gets the evidence type of its method.

## Global items

Below the table, a section `## Inherited global items` lists the constitution's `DOD-G-<nn>`
items that apply to this change, by ID, with one line each on how they apply. Do not copy their
text (link, don't summarise).
