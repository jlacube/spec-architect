---
id: C001-T-073
title: "Dogfood: greenfield change in its own repository through G1–G3"
change: CHG-001
phase: 20-plan
artifact: plan/task
milestone: C001-M-7
status: todo
depends_on: [C001-T-072]
implements: []
satisfies_ac: [C001-AC-805.1, C001-AC-202.1]
verified_by: [C001-TS-805, C001-TS-202, C001-TC-805, C001-TC-202]
components: [C001-COMP-01, C001-COMP-02]
risk_refs: [C001-RISK-013]
estimate: M
report: { commit: null, completed_at: null, notes: null }
---

# C001-T-073 — Dogfood: greenfield change in its own repository through G1–G3

## Intent

Use the released suite on a real greenfield change in a new, empty git repository of its own, outside the Architect repository (for example `C:\Sandbox\dogfood\<name>`), with an idea chosen by P-01, recording time, tokens per phase and critic validity. The dogfood's `.sdd/` and content stay in that repository: none of its artifacts enter the Architect repository, whose `.sdd/` holds only the suite's own changes (P-01, 2026-11-13; see `questions-log.md`, round 2026-11-13).

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `<dogfood repo>/.sdd/**` | via the suite only (`/architect:init`, then one greenfield change) |
| modify | `docs/dogfood.md` | summary entry only: dogfood repository path and commit, time to G2, tokens per phase, critic validity tally |

## Preconditions

- T-072
- Dependencies done: C001-T-072
- P-01 has chosen the greenfield idea, expected to make a medium feature (5–40 REQs, C001-NFR-106; the conductor says so when it asks P-01 for the idea); the dogfood repository is new and empty

## Step outline (no production code)

1. Create the dogfood repository; P-01 starts `claude --agent architect:sdd-conductor` in it, runs `/architect:init` (G0), creates the change with `/architect:new` and takes it through ideation, spec and plan, answering the interviews and deciding G1–G3.
2. Tally critic findings valid/invalid at each gate. At each gate, record the phase's usage in the dogfood's Gate log with `sdd gate approve … --usage "<tokens>"`: the input, cache-creation, cache-read and output tokens, each stated separately, summed from the dogfood sessions' transcripts, subagent transcripts included (`%USERPROFILE%\.claude\projects\<dogfood repository folder>\**\*.jsonl`), between the previous gate and this one; the dogfood repository holds only this change, so its transcripts hold only this change's sessions.
3. Write the summary entry in `docs/dogfood.md` of the Architect repository; copy no dogfood artifact into it. Fields: repository path and commit at G3; per gate, the date, decision, approved hash and approver (from the dogfood's Gate log); usage per phase and the total compared with C001-NFR-106 (≤ 3,000,000, target ≤ 2,000,000), that total being input + cache creation + output, cache reads stated beside it; time to G2; REQ count at G2; the critic validity tally; the dogfood lint result (exit code, LINT-GATE-001). When the REQ count falls outside 5–40, the entry marks the C001-SC-08 and C001-NFR-106 figures not applicable and the conductor raises it with P-01 before the task is set done.

## Verification

- G1–G3 approved; usage recorded in the gate log (C001-NFR-701): `node <Architect repository>/plugins/architect/scripts/sdd.mjs lint --cwd <dogfood repository>` ends with 0 errors, LINT-GATE-001 included
- Run `npm run check` (from M-6; before that `npm test`) and `node plugins/architect/scripts/sdd.mjs lint` (from T-028) in the Architect repository for the `docs/dogfood.md` edit.

## Done when

- [ ] C001-SC-01 (greenfield half), SC-03, SC-08 data recorded
- [ ] The dogfood repository is committed at G3 and stays at its recorded path at least until C001-T-075 is done
- [ ] All test cases in `verified_by` pass at the tier required by C001-ADR-003
- [ ] Progress reported: `sdd task set C001-T-073 --status done --commit <sha>` (or frontmatter fallback before T-026)
