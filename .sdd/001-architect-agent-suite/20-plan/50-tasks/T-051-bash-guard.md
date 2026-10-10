---
id: C001-T-051
title: "Bash guard with allowlist and compound-command parsing"
change: CHG-001
phase: 20-plan
artifact: plan/task
milestone: C001-M-5
status: todo
depends_on: [C001-T-050]
implements: [C001-REQ-1106, C001-REQ-1107]
satisfies_ac: [C001-AC-1106.1, C001-AC-1107.1]
verified_by: [C001-TS-1107, C001-TS-1108, C001-TC-1107, C001-TC-1108]
components: [C001-COMP-08]
risk_refs: []
estimate: M
report: { commit: null, completed_at: null, notes: null }
---

# C001-T-051 — Bash guard with allowlist and compound-command parsing

## Intent

Implement `sdd guard-bash` with the allowlist of C001-IF-07 §3, pipe-only targets and denial of redirection, substitution and non-allowlisted chained segments, for Bash and PowerShell.

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `src/hooks/guard-bash.ts` | tokeniser (quotes aware), segment matcher |
| add | `tests/guards/bash-corpus.json` | allowed/denied commands incl. scenario tables and every ripwire bounding flag of C001-IF-14 §2 (`--token-budget`, `--max-tokens`, `--limit`, `--offset`) |

## Preconditions

- T-050
- Dependencies done: C001-T-050

## Step outline (no production code)

1. Implement a quote-aware tokeniser.
2. Implement entry matchers and pipe-only rules.
3. Run the corpus.

## Verification

- C001-TC-1107, 1108 pass
- Run `npm run check` (from M-6; before that `npm test`) and `node plugins/architect/scripts/sdd.mjs lint` (from T-028).

## Done when

- [ ] Corpus 100% correct
- [ ] All test cases in `verified_by` pass at the tier required by C001-ADR-003
- [ ] Progress reported: `sdd task set C001-T-051 --status done --commit <sha>` (or frontmatter fallback before T-026)
