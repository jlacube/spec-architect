---
id: C001-T-012
title: "CLI front-end, output formats and error catalogue"
change: CHG-001
phase: 20-plan
artifact: plan/task
milestone: C001-M-2
status: in-progress
depends_on: [C001-T-010, C001-T-011]
implements: [C001-REQ-702, C001-REQ-703, C001-REQ-704]
satisfies_ac: [C001-AC-702.1, C001-AC-703.1, C001-AC-704.1]
verified_by: [C001-TS-702, C001-TS-703, C001-TS-704, C001-TC-702, C001-TC-703, C001-TC-704]
components: [C001-COMP-07]
risk_refs: []
estimate: M
report: { commit: null, completed_at: null, notes: null }
---

# C001-T-012 — CLI front-end, output formats and error catalogue

## Intent

Implement command dispatch, option parsing, human and JSON output, exit codes and the ERR-CLI/WARN-CLI catalogue with Fix texts, plus SDD_DEBUG traces, exactly as C001-IF-01 and errors.md specify.

## Targets

| Kind | Target | Change |
|---|---|---|
| modify | `src/cli.ts` | dispatcher for all commands of C001-IF-01 (stubs return ERR-CLI-003 until implemented) |
| add | `src/cli/output.ts` | human line format and --json single-document output |
| add | `src/cli/errors.ts` | catalogue mirroring 10-spec/50-interfaces/errors.md with Fix texts |
| add | `tests/integration/cli/*.test.ts` | exit codes, JSON purity, debug traces |

## Preconditions

- T-010, T-011
- Dependencies done: C001-T-010, C001-T-011

## Step outline (no production code)

1. Implement argument parsing without dependencies (node:util parseArgs).
2. Implement output helpers and exit-code policy (0/1/2/3).
3. Port the error catalogue with codes, messages and Fix texts.
4. Add SDD_DEBUG timing traces to stderr (C001-NFR-702).

## Verification

- C001-TC-702, C001-TC-703, C001-TC-704 pass
- `--json` output validates against lint-report.schema.json for an empty lint
- Run `npm run check` (from M-6; before that `npm test`) and `node plugins/architect/scripts/sdd.mjs lint` (from T-028).

## Done when

- [ ] Every ERR/WARN code of errors.md exists in src/cli/errors.ts
- [ ] All test cases in `verified_by` pass at the tier required by C001-ADR-003
- [ ] Progress reported: `sdd task set C001-T-012 --status done --commit <sha>` (or frontmatter fallback before T-026)
