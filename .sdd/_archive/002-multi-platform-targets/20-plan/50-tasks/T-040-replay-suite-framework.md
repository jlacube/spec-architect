---
id: C002-T-040
title: "Corpus replay suite: framework, expectations, report and its own command"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-06
status: done
depends_on: [C002-T-006, C002-T-007]
implements: [C002-REQ-606, C002-REQ-625, C002-REQ-627, C002-REQ-630, C002-REQ-633]
satisfies_ac: [C002-AC-606.1, C002-AC-625.1, C002-AC-627.1, C002-AC-630.1, C002-AC-633.1]
verified_by: [C002-TS-608, C002-TS-609, C002-TS-628, C002-TS-629, C002-TS-631, C002-TS-638, C002-TS-643, C002-TS-644, C002-TS-645, C002-TS-649, C002-TS-650, C002-TC-608, C002-TC-609, C002-TC-628, C002-TC-629, C002-TC-631, C002-TC-638, C002-TC-643, C002-TC-644, C002-TC-645, C002-TC-649, C002-TC-650]
components: [C002-COMP-008]
risk_refs: []
estimate: L
report: { commit: 7ac8267, completed_at: 2026-10-18, notes: "Replay framework + stub adapter; TC-609/628/629/631/638/643/644/645/649/650 on the stub; real-mechanism rows and TC-608/609 to T-041/T-042/T-049, TC-637 to T-047; real adapters register in tests/replay/main.ts; extra files suite.ts and main.ts; replay fixture leaves out .claude/agent-memory/ (TS-638 reading)" }
---

# C002-T-040 — Corpus replay suite: framework, expectations, report and its own command

## Intent

Build the mechanism-independent part of C002-COMP-008. It loads the corpora and assigns each case
its expected decision per mechanism with the ordered rules of C002-IF-009 §2.1: applicability, then
C002-REQ-630, C002-REQ-632, C002-REQ-625, then the corpus value, each recording `expected_source`. It
replays a case that requires a host capability on a fixture built with it (C002-REQ-633) and lists
every case not replayed (C002-REQ-627). It writes a schema-valid replay report. The adapters are
C002-T-041 and C002-T-042.

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `tests/replay/run.mjs`, `tests/replay/expect.ts`, `tests/replay/report.ts`, `tests/replay/adapter.ts` | runner, expectation rules, report writer, adapter interface |
| add | `docs/releases/release-record.schema.json` | the in-repository copy of the contract (C002-ADR-002); its pair is added to the C002-T-006 equality test |
| modify | `scripts/test.mjs` | `findTests` leaves out `tests/replay/` |
| modify | `package.json` | `replay` script: runs the suite **without** the `tests/no-network.mjs` preload, so the OpenCode adapter's loopback stub can listen |
| add | `tests/unit/replay/expect.test.ts` | the rule order on synthetic cases; capability present and absent (`error`) |
| add | `tests/replay/scenarios/suite.test.ts` | the suite scenarios C002-TC-609, 628, 629, 631, 638, 643, 644, 645, 649 and 650 against the stub adapter and corpus fixtures; the mechanism rows of C002-TC-628 that need a real adapter run once C002-T-041 and C002-T-042 exist |

## Preconditions

- C002-T-006 (equality test) and C002-T-007 (corpus fields) done.

## Step outline (no production code)

1. Identify the corpora by file and SHA-256, and the replay host by platform and capabilities
   (`file-symlink` and others).
2. Compute expectations in the rule order and record the rule that produced each one.
3. Write one report per mechanism and package version under `docs/releases/<target>/<version>/`.
4. Keep `npm test` free of the replay tests; `npm run replay` is the only entry. C002-T-026, which
   adds the first file under `tests/replay/scenarios/` outside this task, depends on this task for
   that exclusion (critic CR-17).

## Verification

- `npm test -- unit/replay`
- `npm run replay -- --mechanism stub` (stub adapter used by the unit tests) and `npm run replay -- suite`

## Done when

- [ ] Every case appears once, under `cases` or `not_applicable`; reports validate against the schema
- [ ] `suite.test.ts` passes on the stub adapter; mechanism rows and C002-TC-608 listed in the task report as carried to C002-T-041, C002-T-042 and C002-T-049; C002-TC-637 (release-check refusal) carried to C002-T-047
- [ ] Progress reported: `sdd task set C002-T-040 --status done --commit <sha>`
