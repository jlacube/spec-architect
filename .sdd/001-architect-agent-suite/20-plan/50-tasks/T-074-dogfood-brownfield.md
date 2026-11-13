---
id: C001-T-074
title: "Dogfood: brownfield change CHG-002 and Superpowers execution in the greenfield dogfood repository"
change: CHG-001
phase: 20-plan
artifact: plan/task
milestone: C001-M-7
status: todo
depends_on: [C001-T-072, C001-T-073]
implements: []
satisfies_ac: [C001-AC-617.2, C001-AC-314.1, C001-AC-410.1]
verified_by: [C001-TS-621, C001-TS-315, C001-TS-412, C001-TC-621, C001-TC-315, C001-TC-412]
components: [C001-COMP-01, C001-COMP-02]
risk_refs: [C001-RISK-003, C001-RISK-013]
estimate: L
report: { commit: null, completed_at: null, notes: null }
---

# C001-T-074 — Dogfood: brownfield change CHG-002 and Superpowers execution in the greenfield dogfood repository

## Intent

CHG-002 (multi-platform targets), taken through G1–G3 in the Architect repository, is the brownfield dogfood of C001-SC-01 and C001-SC-07 (P-01, 2026-10-13, "CHG-002 = T-074 dogfood (Recommended)"; kept on 2026-11-13, "Keep CHG-002 (Recommended)"). CHG-002 has no milestone left to execute, so the Superpowers execution of C001-SC-04 runs on one milestone of the C001-T-073 dogfood plan, in that dogfood's own repository: its code and plan stay there (P-01, 2026-11-13; see `questions-log.md`, round 2026-11-13).

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `<T-073 dogfood repository>/**` | code of one plan milestone, written by Superpowers executing-plans |
| modify | `docs/dogfood.md` | summary entry only: CHG-002 brownfield figures and the Superpowers run notes; no dogfood artifact copied |

## Preconditions

- T-072; T-073 done (its dogfood plan approved at G3)
- Dependencies done: C001-T-072, C001-T-073

## Step outline (no production code)

1. Brownfield half: from CHG-002's Gate log and `node plugins/architect/scripts/sdd.mjs lint 002` in the Architect repository, take the per-gate date, decision, approved hash and approver, the REQ count, the TR-09 result with its MODIFIED/REMOVED count (C001-SC-07) and the machine configuration of each phase where a toolchain record states it, "not recorded" otherwise (C001-NFR-304). CHG-002's Gate log Usage cells read "unavailable", so its tokens per phase and total against C001-NFR-106 (≤ 3,000,000, target ≤ 2,000,000) are an upper-bound estimate (P-01, Q-t074-usage-01), taken on 2026-11-13 before the transcripts expire and recorded in `docs/dogfood.md` ("CHG-002 token estimate, taken for C001-T-074"): input, cache-creation, cache-read and output tokens per phase, subagent transcripts included (kept in `C:\Sandbox\runs\chg002-usage-transcripts`), labelled as an estimate because CHG-001 work ran in the same session. CHG-002 had 121 REQs at its first G3, so C001-NFR-106 does not apply to it; the summary entry cites the estimate for C001-SC-06 and states that RISK-013's trigger, defined against C001-NFR-106, does not apply to it either.
2. Execute one milestone of the T-073 dogfood plan with Superpowers in the dogfood repository (`tests/manual/TS-621.md`); count missing-info questions (C001-TC-621).
3. Write the summary entry in `docs/dogfood.md` of the Architect repository with the figures of steps 1 and 2 and the dogfood repository's commit after the milestone; copy no dogfood artifact into it.

## Verification

- C001-TC-621 passes; no TR-09 finding on CHG-002 (`sdd lint 002`; its exit code reflects waived LINT-DELTA-001 errors)
- Run `npm run check` (from M-6; before that `npm test`) and `node plugins/architect/scripts/sdd.mjs lint` (from T-028) in the Architect repository; `node <Architect repository>/plugins/architect/scripts/sdd.mjs lint --cwd <dogfood repository>` after the milestone.

## Done when

- [ ] C001-SC-01 (brownfield half), SC-04, SC-07 data recorded
- [ ] The dogfood repository is committed after the Superpowers milestone and stays at its recorded path at least until C001-T-075 is done
- [ ] All test cases in `verified_by` pass at the tier required by C001-ADR-003
- [ ] Progress reported: `sdd task set C001-T-074 --status done --commit <sha>` (or frontmatter fallback before T-026)
