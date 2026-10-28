# Release 0.1.0 — evidence (C001-T-072)

Release gate of CHG-001 (`.sdd/001-architect-agent-suite/20-plan/50-tasks/T-072-release-gate.md`).
Release classes and pass rules: C001-ADR-003, revision 2026-10-23
(`.sdd/001-architect-agent-suite/20-plan/20-decisions/ADR-003-eval-tiers.md`). Command forms of the
Claude Code eval runs: CHG-002 hand-off, "Command forms of the CHG-001 runs"
(`.sdd/002-multi-platform-targets/20-plan/handoff.md`).

**Status:** in progress. Unpaid preconditions and checks done, and paid batch 1 (routing suite, half)
done, on 2026-10-28. Running notional total: 25.57 USD (§4.5).

## 1. Preconditions

Checked 2026-10-28 on `799f903` (working tree: untracked `bench/results/` files only).

| Precondition | State | Evidence |
|---|---|---|
| All M-6 tasks done | met | C001-T-060 … 065 and 076 … 084: `status: done` |
| Dependencies of C001-T-072 done | met | C001-T-053, 054, 061 … 065, 070, 076 … 084 done (C001-T-071 dropped by P-01, 2026-10-10) |
| Constitution v2 approved at G0 (DOD-G-01 eval floor, Q-dodg01-amend-01) | met | `.sdd/_constitution/constitution.md`: `version: 2`, G0 v2 amendment approved 2026-10-24 ("Approve", jerome.lacube) |
| D-020 closed (C001-T-084 done; INJ-19 and INJ-21 pass at Copilot CLI 0.0.3 in C002-T-071) | met | CHG-001 D-020 closed 2026-10-28; C001-T-084 done (28caf34); C002-T-071 done (e5a6440) |
| D-021 closed (coverage step order-independent) | met | CHG-001 D-021 closed 2026-10-28 (cebd596) |
| D-014, D-015, D-017, D-018, D-019 closed | met | closed 2026-10-22 … 2026-10-25 |
| C002-T-068 … C002-T-074 done (cap rows, hidden budget, 3.00 USD rule-1 cap, early stop, INJ-21 cap, 0.0.3) | met | C002-T-068 a677f6b, T-069 a9d4666, T-070 64ac51b, T-071 e5a6440, T-072 f53b355, T-073 728211f, T-074 d6fdd13 |
| CHG-001 phases approved and not stale | met | `sdd status --json`: 00-ideation, 10-spec and 20-plan approved (10-spec and 20-plan re-approved 2026-10-28) |

## 2. `npm run check` (DOD-G-02, C001-TC-1127, C001-NFR-401, 403, 502)

| Node | Shell | Commit | Exit | Tests | Coverage | Log |
|---|---|---|---|---|---|---|
| 22.22.3 (npm 10.9.8) | Git Bash | 799f903 | 0 (2026-10-28, about 28 min) | 1,772 of 1,773 pass, 1 skipped (POSIX-only); 62 of 62 lint fixtures; all ten steps PASS | 95.60% lines (9,966 / 10,425), 83.28% branches (4,746 / 5,699); thresholds 85 / 75 | local, not committed |
| 20.20.2 (npm 10.8.2) | Git Bash | 799f903 | 0 (2026-10-28, about 9 min) | 1,772 of 1,773 pass, 1 skipped; 62 of 62 lint fixtures; nine steps PASS | SKIP with its reason (Node 20 test-runner coverage merge crash; C001-NFR-502 measured on Node 22.22.3) | local, not committed |

The PowerShell 7 runs of C001-TC-1127 (two more of the four) are still to run at the release commit.

`sdd lint 001`: 0 errors, 0 warnings, 0 info (2026-10-28). Workspace `sdd lint`: the 9 waived
LINT-DELTA-001 findings of CHG-002 only (C002-DEC-008; they end when CHG-001 is archived, C001-T-075).

## 3. Clean-profile install (C001-TC-1102, C001-NFR-602)

C001-TC-1102 is a manual, timed procedure (`tests/manual/TS-1102.md`) that P-01 runs on a **fresh
Windows 11 user profile**. Creating a Windows profile is outside what the implementer may do, so the
record of TC-1102 itself (and the ≤ 15-minute timing of C001-NFR-602) is still **open for P-01**.

**Pre-check (implementer, 2026-10-28, not the TC-1102 record):** steps 2–5 of the procedure with
Claude Code 2.1.299 (desktop-bundled), an empty `CLAUDE_CONFIG_DIR` in a scratch folder, and no
`CLAUDE*` / `ANTHROPIC*` variables inherited:

| Step | Command | Result |
|---|---|---|
| 2 | `claude plugin marketplace add C:\Sandbox\ClaudeCode\Architect` | "Successfully added marketplace: architect-local", 1.3 s |
| 3 | `claude plugin install architect@architect-local` | "Successfully installed plugin: architect@architect-local (scope: user)", 2.0 s |
| 4 | `claude plugin list` | `architect@architect-local`, version 0.0.3, enabled |
| 5 | `claude --agent architect:sdd-conductor -p hi` in a new `git init` folder | the agent resolves; the session ends at the API call (`terminal_reason: api_error`, no login in the empty profile). A wrong name (`architect:no-such-agent`) is refused with the list of the ten `architect:sdd-*` agents |

Finding: the installed plugin reports version **0.0.3**; the 0.1.0 version bump is part of the
final step of this task (CHANGELOG, tag).

## 4. Release evals (DOD-G-01)

Running notional total: see §4.5.

### 4.1 Routing suite (C001-TS-1117; 42 cases × 10 runs; ≥ 90% of runs pass, C001-SC-05)

**Batch 1 (2026-10-28, 13:46–15:26 UTC): 21 of 42 cases, 210 of 420 runs.** The whole suite did not
fit the usage limit of the run (5-hour window ≤ 85%), so batch 1 ran half of it (P-01's instruction
for this batch). The other 21 cases follow in batch 2.

- Claude Code 2.1.299 (desktop-bundled), `claude plugin eval`, `--auth subscription` on every run,
  main thread `opus` (case files), subagents `haiku` (suite default), `max_turns` 6,
  `timeout_seconds` 120 (case files), `-j 4`. No `--cap-exception` (the routing cases are not
  `run.mjs` case rows).
- Command forms: `node evals/delegation/suite.mjs --auth subscription --runs 10 --case "*-<agent>-*"
  -j 4 --max-cost-usd 12 --label release-routing` (architect and auditor groups), then one case per
  run: `node evals/delegation/suite.mjs --auth subscription --runs 10 --case <case> -j 4
  --max-cost-usd 4 --label release-routing`.
- Re-grade: `suite.mjs` re-grades a run that `claude plugin eval` failed only for the 120 s timeout,
  with the case's own deterministic graders on the kept trace (as at the M-6 routing milestone,
  C001-T-063). Raw verdicts stay in each record. Spot check: the 10 traces of `route-architect-01`
  call only `architect:sdd-architect` (12–15 `subagent_type` hits each, no other Architect agent).
  The session times out while the routed subagent is still working.
- An aborted start: the `*-cartographer-*` group was stopped 7 s after its start (the driver was
  stopped for the 5-hour pacing), so no result file and no runs. Its cases ran afterwards, one per
  run.

| Case | Runs | Raw pass | Timed out (re-graded) | Pass after re-grade | Notional USD | Result file |
|---|---|---|---|---|---|---|
| notroute-architect-01 | 10 | 6 | 4 | 10 | 2.32 | `evals/results/release-routing-plugin-eval-architect-2026-10-28T14-05-55-790Z.json` |
| notroute-auditor-01 | 10 | 4 | 6 | 10 | 1.81 | `evals/results/release-routing-plugin-eval-architect-2026-10-28T14-13-46-073Z.json` |
| notroute-cartographer-01 | 10 | 10 | 0 | 10 | 1.39 | `…-2026-10-28T14-16-53-666Z.json` |
| notroute-conductor-01 | 10 | 10 | 0 | 10 | 0.69 | `…-2026-10-28T15-02-42-598Z.json` |
| notroute-critic-01 | 10 | 10 | 0 | 10 | 0.63 | `…-2026-10-28T15-05-38-476Z.json` |
| notroute-options-analyst-01 | 10 | 10 | 0 | 10 | 1.48 | `…-2026-10-28T15-25-59-370Z.json` |
| route-architect-01 | 10 | 0 | 10 | 10 | 0.86 | `…-2026-10-28T14-05-55-790Z.json` |
| route-architect-02 | 10 | 1 | 9 | 10 | 1.22 | `…-2026-10-28T14-05-55-790Z.json` |
| route-architect-03 | 10 | 7 | 3 | 10 | 2.60 | `…-2026-10-28T14-05-55-790Z.json` |
| route-auditor-01 | 10 | 10 | 0 | 10 | 0.68 | `…-2026-10-28T14-13-46-073Z.json` |
| route-auditor-02 | 10 | 10 | 0 | 10 | 0.73 | `…-2026-10-28T14-13-46-073Z.json` |
| route-auditor-03 | 10 | 10 | 0 | 10 | 0.74 | `…-2026-10-28T14-13-46-073Z.json` |
| route-cartographer-01 | 10 | 10 | 0 | 10 | 2.16 | `…-2026-10-28T14-20-19-188Z.json` |
| route-cartographer-02 | 10 | 10 | 0 | 10 | 2.11 | `…-2026-10-28T14-23-33-286Z.json` |
| route-cartographer-03 | 10 | 10 | 0 | 10 | 1.63 | `…-2026-10-28T14-25-48-222Z.json` |
| route-conductor-01 | 10 | 10 | 0 | 10 | 0.54 | `…-2026-10-28T15-03-23-261Z.json` |
| route-conductor-02 | 10 | 10 | 0 | 10 | 0.52 | `…-2026-10-28T15-04-01-419Z.json` |
| route-conductor-03 | 10 | 10 | 0 | 10 | 0.50 | `…-2026-10-28T15-04-37-925Z.json` |
| route-critic-01 | 10 | 0 | 10 | 10 | 0.94 | `…-2026-10-28T15-11-44-839Z.json` |
| route-critic-02 | 10 | 1 | 9 | 10 | 1.10 | `…-2026-10-28T15-17-50-803Z.json` |
| route-critic-03 | 10 | 0 | 10 | 10 | 0.93 | `…-2026-10-28T15-23-57-037Z.json` |
| **Batch 1** | **210** | **149 (71.0%)** | **61** | **210 (100.0%)** | **25.57** | 15 files |

Batch 1 result: 210 / 210 runs pass after re-grade (100%, rule ≥ 90%). No run failed for any reason
other than the 120 s timeout, and every timed-out run re-grades as a pass. One run reached 6 turns, the `max_turns` value
(`route-architect-02` #8). It ended on the 120 s timeout, not on a turn-cap error, and re-grades as a
pass. Every other run used at most 5 turns. No
`--max-cost-usd` ceiling was reached (`partial_reason` null in all 15 files). The suite verdict
waits for the other 21 cases.

Not yet run (batch 2): `notroute-planner-01`, `notroute-researcher-01`, `notroute-spec-writer-01`,
`notroute-test-designer-01`, `offtopic-01`, `offtopic-02`, `route-options-analyst-01 … 03`,
`route-planner-01 … 03`, `route-researcher-01 … 03`, `route-spec-writer-01 … 03`,
`route-test-designer-01 … 03`.

**Usage (from the `rate_limit_event` of the kept traces):**

| Point | 5-hour | Weekly | Note |
|---|---|---|---|
| before batch 1 (last trace of the day, TS-225, about 12:13 UTC) | 19% | 16% | |
| after the architect group (14:05 UTC) | 51% | 18% | |
| after the auditor group (14:13) | 62% | 19% | |
| after `route-cartographer-03` (14:25) | 78% | 20% | paused: the next case could not fit under 85% before the 15:00 reset |
| after the reset, first case (15:02) | 1% | 20% | window resets 20:00 UTC |
| end of batch 1 (15:26) | 28% | 22% | weekly resets 2026-11-03 23:00 UTC |

### 4.2 Release-high scenarios (10 runs, ≥ 9 / 10)

_not started_

### 4.3 Release-standard scenarios (3 runs, 3 / 3; 2 / 3 → 10-run check ≥ 9 / 10)

_not started_

### 4.4 Injection suite (22 cases × 10 runs; 0 runs acting on an injection, C001-NFR-205)

_not started_

### 4.5 Notional cost per part and running total

| Part | Runs | Notional USD | Running total USD |
|---|---|---|---|
| Routing suite, batch 1 (21 cases × 10) | 210 | 25.57 | 25.57 |

Stop rule: at 350 USD notional the task stops and P-01 chooses (C001-ADR-003).

### 4.6 Session-limit check (CHG-002 hand-off, CR-61)

_not started_

## 5. Deferred milestone items (`docs/milestone-log.md`)

| Item | Milestone | Closed by | State |
|---|---|---|---|
| M-3 eval test cases at milestone tier (3 runs) | C001-M-3 | the release runs of §4.2 and §4.3 (every release class runs ≥ 3 runs with ≥ the milestone pass rule, C001-ADR-003) | open |
| A toy change reaches G2 | C001-M-3 | a named change that met it (to identify), else a toy change run | open |
| P-01 decides the release eval budget from the metrics report | C001-M-3 | Q-release-tier-01 (2026-10-23, C001-ADR-003 revision 2026-10-23) | closable |
| M-4 test cases at milestone tier | C001-M-4 | the release runs of §4.2 and §4.3 | open |
| A toy change reaches G3 on cfg-full and cfg-bare | C001-M-4 | a named change that met it (to identify), else a toy change run | open |
| Injection evals at milestone tier (3 runs per case) | C001-M-5 | the injection suite of §4.4 (10 runs per case, 0 acted upon) | open |
| Re-planted INJ-19 | C001-M-5 | the injection suite of §4.4 (INJ-19 row) | open |

## 6. DoD items

| Item | Evidence | State |
|---|---|---|
| DOD-G-01 | §4 | open |
| DOD-G-02 | §2 | open |
| DOD-G-03 | §2, `sdd lint 001` | met (2026-10-28) |
| DOD-G-04 | _to collect_ | open |
| DOD-G-05 | `docs/nfr-results.md` | _to confirm at the release commit_ |
| DOD-G-06 | C001-T-075 (archive, after this task) | not in this task |
| DOD-G-07 | `sdd status --json`: CHG-001 has 0 open defects (2026-10-28) | met |
| C001-DOD-001 … 020 | _to collect_ | open |
| C001-DOD-021 | C001-T-073 and C001-T-074 (dogfood changes, todo) | open |
