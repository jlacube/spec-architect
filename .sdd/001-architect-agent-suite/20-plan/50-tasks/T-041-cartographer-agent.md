---
id: C001-T-041
title: "Cartographer agent and code-discovery skill"
change: CHG-001
phase: 20-plan
artifact: plan/task
milestone: C001-M-4
status: todo
depends_on: [C001-T-002, C001-T-003, C001-T-030, C001-T-029]
implements: [C001-REQ-1001, C001-REQ-1002, C001-REQ-1003, C001-REQ-1004, C001-REQ-1009, C001-REQ-1010, C001-REQ-1011, C001-REQ-1012, C001-REQ-115, C001-REQ-121, C001-REQ-314, C001-REQ-610, C001-REQ-611]
satisfies_ac: [C001-AC-1001.1, C001-AC-1001.2, C001-AC-1002.1, C001-AC-1003.1, C001-AC-1004.1, C001-AC-1009.1, C001-AC-1010.1, C001-AC-1011.1, C001-AC-1012.1, C001-AC-115.1, C001-AC-121.1, C001-AC-314.1, C001-AC-610.1, C001-AC-611.1]
verified_by: [C001-TS-1001, C001-TS-1002, C001-TS-1003, C001-TS-1004, C001-TS-1005, C001-TS-1010, C001-TS-1011, C001-TS-1012, C001-TS-1013, C001-TS-121, C001-TS-127, C001-TS-315, C001-TS-612, C001-TS-613, C001-TC-1001, C001-TC-1002, C001-TC-1003, C001-TC-1004, C001-TC-1005, C001-TC-1010, C001-TC-1011, C001-TC-1012, C001-TC-1013, C001-TC-121, C001-TC-127, C001-TC-315, C001-TC-612, C001-TC-613]
components: [C001-COMP-02, C001-COMP-10]
risk_refs: [C001-RISK-003, C001-RISK-004]
estimate: L
report: { commit: null, completed_at: null, notes: null }
---

# C001-T-041 — Cartographer agent and code-discovery skill

## Intent

Author sdd-cartographer with the layer ladder, budgets, disclosures, evidence format, toolchain record, capability inventory, baseline survey and impact files.

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `plugins/architect/agents/sdd-cartographer.md` | IF-09 A2; Bash allowlist reminder |
| add | `plugins/architect/skills/code-discovery/SKILL.md` | verb table, ladder, evidence format IF-03 §11, budgets |
| add | `tests/fixtures/cfg-*/` | machine configurations cfg-full, cfg-no-ripwire, cfg-bare (PATH shims) |

## Preconditions

- S-01, S-02 verdicts
- Dependencies done: C001-T-002, C001-T-003, C001-T-030, C001-T-029

## Step outline (no production code)

1. Write agent and skill from spike results.
2. Run evals on the three configurations.

## Verification

- C001-TC-1001…1013, 121, 127, 315, 612, 613 pass (dev tier)
- Run `npm run check` (from M-6; before that `npm test`) and `node plugins/architect/scripts/sdd.mjs lint` (from T-028).

## Done when

- [ ] Evidence files lint clean (LINT-EVD-001)
- [ ] All test cases in `verified_by` pass at the tier required by C001-ADR-003
- [ ] Progress reported: `sdd task set C001-T-041 --status done --commit <sha>` (or frontmatter fallback before T-026)
