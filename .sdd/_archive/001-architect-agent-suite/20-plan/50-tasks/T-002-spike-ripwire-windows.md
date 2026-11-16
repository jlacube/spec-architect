---
id: C001-T-002
title: "Spike S-01: ripwire on Windows"
change: CHG-001
phase: 20-plan
artifact: plan/task
milestone: C001-M-1
status: done
depends_on: [C001-T-001]
implements: []
satisfies_ac: [C001-AC-1001.1, C001-AC-1003.1]
verified_by: [C001-TS-1001, C001-TS-1004, C001-TC-1001, C001-TC-1004]
components: [C001-COMP-02]
risk_refs: [C001-RISK-003]
estimate: S
report: { commit: 423117e, completed_at: 2026-10-10, notes: "Verdict works-with-caveats (docs/spikes/S-01-ripwire.md). ripwire 0.6.5 Windows x64 runs; all six verbs correct on bolt.diy (TS) and crawl4ai (Python), callers exact 10/10. Spec defect D-S01-1 opened against C001-REQ-1003 (budget flags: graph/list verbs need --limit, map/pack-signatures need --max-tokens). C001-TC-1001/1004 are cartographer evals owned by C001-T-041 and not runnable yet; TC-1004 will fail as specified until D-S01-1 is resolved." }
---

# C001-T-002 — Spike S-01: ripwire on Windows

## Intent

Confirm that redhat-et/ripwire 0.6.x (Windows x64 preview) answers the verbs the cartographer needs (C001-IF-14) on two real repositories, and record the outcome before the cartographer is built.

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `docs/spikes/S-01-ripwire.md` | method, versions, results table per verb, verdict works / works-with-caveats / fallback-only |

## Preconditions

- Two local repositories available (one TypeScript, one Python)
- Dependencies done: C001-T-001

## Step outline (no production code)

1. Install the Windows release; run `ripwire --doctor`.
2. Run --for, --callers, --impact, --test-gate, --hotspots, --pack-signatures with --token-budget on both repositories.
3. Record correctness against manual inspection for 5 symbols, run times and header disclosures.
4. If a verb is unusable, open a spec defect (`sdd defect add` once available, otherwise note in the report) against C001-REQ-1001.

## Verification

- Report contains a verdict and one row per verb per repository
- Run `npm run check` (from M-6; before that `npm test`) and `node plugins/architect/scripts/sdd.mjs lint` (from T-028).

## Done when

- [ ] Verdict recorded and toolchain recommendation for README noted
- [ ] All test cases in `verified_by` pass at the tier required by C001-ADR-003
- [ ] Progress reported: `sdd task set C001-T-002 --status done --commit <sha>` (or frontmatter fallback before T-026)
