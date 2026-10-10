---
id: C001-T-062
title: "README and user documentation"
change: CHG-001
phase: 20-plan
artifact: plan/task
milestone: C001-M-6
status: todo
depends_on: [C001-T-060]
implements: [C001-REQ-1115]
satisfies_ac: [C001-AC-1115.1]
verified_by: [C001-TS-1116, C001-TC-1116]
components: [C001-COMP-11]
risk_refs: []
estimate: M
report: { commit: null, completed_at: null, notes: null }
---

# C001-T-062 — README and user documentation

## Intent

Write the README (Windows-first install, optional tools, quickstart, commands, agents, layout, troubleshooting, license) and timing-test it on a clean profile.

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `plugins/architect/README.md and README.md` | sections of C001-REQ-1115; macOS/Linux variants marked “prepared, untested”; ripwire install per spike S-01 (optional; Windows x64 zip, verify `.sha256`, add the folder to the user PATH, do not install the bundled hooks/skills) |

## Preconditions

- T-060
- Dependencies done: C001-T-060

## Step outline (no production code)

1. Write README from IF-10 and IF-08.
2. Dry-run on a fresh Windows user profile and time it.

## Verification

- C001-TC-1116 passes
- Clean-profile time ≤ 15 min (C001-NFR-602)
- Run `npm run check` (from M-6; before that `npm test`) and `node plugins/architect/scripts/sdd.mjs lint` (from T-028).

## Done when

- [ ] Troubleshooting covers every doctor remedy
- [ ] All test cases in `verified_by` pass at the tier required by C001-ADR-003
- [ ] Progress reported: `sdd task set C001-T-062 --status done --commit <sha>` (or frontmatter fallback before T-026)
