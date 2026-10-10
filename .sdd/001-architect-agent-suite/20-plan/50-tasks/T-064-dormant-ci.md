---
id: C001-T-064
title: "Dormant cross-platform CI workflows"
change: CHG-001
phase: 20-plan
artifact: plan/task
milestone: C001-M-6
status: todo
depends_on: [C001-T-061]
implements: [C001-REQ-1119]
satisfies_ac: [C001-AC-1119.1]
verified_by: [C001-TS-1120, C001-TC-1120]
components: [C001-COMP-12]
risk_refs: []
estimate: S
report: { commit: null, completed_at: null, notes: null }
---

# C001-T-064 — Dormant cross-platform CI workflows

## Intent

Author GitHub Actions workflows for windows/macos/ubuntu running npm run check, triggered only by workflow_dispatch (not run remotely, Spec-Q4).

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `.github/workflows/check.yml` | matrix of 3 OSes; on: workflow_dispatch only |

## Preconditions

- T-061
- Dependencies done: C001-T-061

## Step outline (no production code)

1. Write workflow.
2. Validate YAML locally (actionlint if available).

## Verification

- C001-TC-1120 passes
- Run `npm run check` (from M-6; before that `npm test`) and `node plugins/architect/scripts/sdd.mjs lint` (from T-028).

## Done when

- [ ] No push/pull_request triggers present
- [ ] All test cases in `verified_by` pass at the tier required by C001-ADR-003
- [ ] Progress reported: `sdd task set C001-T-064 --status done --commit <sha>` (or frontmatter fallback before T-026)
