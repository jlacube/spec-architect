---
id: C002-PLAN-TEST
artifact: plan/test-plan
change: CHG-002
phase: 20-plan
status: draft
---

# CHG-002 — Test plan

## 1. Scope and levels

Every acceptance scenario of the approved spec maps to one test case with the same number
(`C002-TS-n` → `C002-TC-n`), as in CHG-001, so TR-08 stays mechanically checkable. Three more manual
cases (`C002-TC-901` … `C002-TC-903`) are the P-01 runs of C002-T-050, C002-T-051 and C002-T-057; each
names the one scenario whose evidence it produces. Inside a test
file, each case is one `test()` whose name starts with its TS ID.

| Level | Meaning | Count | Runner |
|---|---|---|---|
| integration | CLI (the Copilot install command included), guards, sdd MCP server (from the packed tarball), hook adapter, release check and runner tests against fixtures; no host | 124 | `npm test` (`scripts/test.mjs`, `node --test`, `tests/no-network.mjs` preloaded) |
| structure | Static checks of generated target packages, the target structure check (TGT-*, PLG-VAR-001), README sections and the VS Code checklist file | 50 | `npm test` (and the target-structure step of `npm run check`, C002-ADR-003) |
| replay | Corpus replay suite (C002-COMP-008) and every scenario that needs an OpenCode session through the scripted-model driver of C002-ADR-005 | 23 | `npm run replay` (own command: the loopback stub would trip `tests/no-network.mjs`, regression-set §4.3) |
| eval | Model sessions on a real host, with transcript assertions (tool calls, files, commands, never free text alone); C002-TC-336 (`@mode-hooks`) is not applicable under the signed-off S-08 record | 26 | `node evals/harness/run.mjs --host <claude-code\|opencode\|copilot-cli> --tier dev`; existing Claude Code cases also `npm run eval` |
| manual | P-01 in VS Code (`@manual-vscode`, the checklist record of C002-T-050), the review of that record, and the timed clean-profile runs of C002-T-051 | 18 | `docs/checklists/vscode-copilot.md` (C002-T-046), records under `docs/checklists/records/` and `docs/releases/clean-profile-runs.md` |
| unit | Module tests that support the cases above (repository-root helper, replay expectations, adapters); not mapped to a TS | as needed | `npm test` |

Mode-tagged scenarios: integration and structure cases tagged `@mode-native`, `@mode-server` or
`@mode-hooks` run for both modes of their target from the fixture tables. Replay, eval and manual
cases run for the mode that the spike records fix (C002-IF-009 §3); a case for a mode not in use is
reported "not applicable" and cites the spike record. The spike-outcome rows of `10-strategy.md` §4
decide which cases are dropped, moved or reported not applicable; for example,
`post_write_feedback_channel: false` makes C002-TC-222 and C002-TC-223 not applicable. The cases that
change level in a branch are listed in §8.1; the counts above are those of the main branch.

## 2. Fixtures

| Fixture | Content | Built by |
|---|---|---|
| fx-src | Copy of the repository at the commit under test: source plugin, `plugins/architect/targets/` mapping tables | C002-T-025 |
| fx-tables | Fixture mapping tables under `tests/fixtures/targets/`, one per mode, with deliberate gaps for the error rows | C002-T-024 |
| fx-dist | Both target packages generated into a temporary folder, per mode (native, server, hooks) | C002-T-034 |
| fx-dist-bad | fx-dist with one planted defect per Examples row (missing file, renamed command, pasted variant, oversize skill, open tool map, shell operator, missing profile) | C002-T-035 and the owning task |
| fx-tgz | Packed `architect-sdd` tarball installed into a clean temporary prefix with an isolated npm cache | C002-T-022, C002-T-023 |
| fx-repo | Temporary repository with `.git` and `.sdd/` so the repository-root rule is deterministic (regression-set §4.1) | C002-T-007 |
| corpora | `tests/guards/path-corpus.json`, `tests/guards/bash-corpus.json` with the replay fields of C002-IF-009 §2 | C002-T-007 … C002-T-011 |
| fx-cp | Copilot fixture repository with 2 active changes and `src/app.ts`, plus Copilot hook input samples (SessionStart, SubagentStop, PreToolUse) with `agent_type` in the VS Code form (`sdd-spec-writer`), the Copilot CLI form (`architect:sdd-spec-writer`), absent (session agent), and of non-Architect subagents: host built-in agents (`general-purpose`, `task`, `explore`), adopter names (`my-reviewer`, `architect:my-reviewer`), an unknown `sdd-` name, `null` and a number | C002-T-032 |
| fx-cp-install | Git repository with `src/app.ts` and `README.md`, without `.github/`, `.vscode/` and `.sdd/`; a fresh copy per test; also the repository without `.sdd/` of the subagent guard cases (C002-TC-363, C002-TC-364) | C002-T-019 (first user, C002-TC-352), C002-T-058 |
| fx-outer | `C:/fx/outer` holding `.sdd/`, with the git repository `C:/fx/outer/repo` inside it that has no `.sdd/` of its own (a `.sdd/` above the repository root counts as found, C002-TC-357) | C002-T-032 |
| pkg-cp, pkg-cp-hooks | Copies of the generated `dist/copilot/` for `sdd-mcp-server` and for `copilot-hooks` at `C:/fx/pkg-cp` and `C:/fx/pkg-cp-hooks` (or a temporary folder the tests substitute), installed into `fx-cp` or `fx-cp-install` with `sdd install copilot --package <folder>`; variants per Examples row (missing file, broken manifest, OpenCode package, path characters) | C002-T-058 (C002-T-033 for the hooks variant) |
| fx-oc | OpenCode replay fixture of C002-ADR-005: generated package, adopter agent `my-build`, adopter MCP server `fx-fs`, auto-update and sharing off | C002-T-042 |
| fx-gate | Change 002 with phase 10-spec in review; variant with 00-ideation approved; variant ready to archive | C002-T-037 (from the CHG-001 gate helpers) |
| fx-bootstrap | CHG-001 fixture (copy of `.sdd/` at its G2) | CHG-001 |
| fx-release | Release-check fixture: spike records, replay reports, injection summaries, checklist records and versions per Examples row | C002-T-047 |
| cfg-* | PATH shims: CHG-001 `cfg-full`, `cfg-no-ripwire`, `cfg-bare`, `cfg-node18`, `cfg-old-claude`; new `opencode`, `code`, `sdd` and `ast-grep.cmd` shims per version row | C002-T-014, C002-T-038 |
| stub-host | Stub OpenCode and Copilot CLI hosts that never end a session and report a fixed spend | C002-T-044, C002-T-045 |
| toy | Toy change repository for the VS Code checklist, fresh install | C002-T-046 |
| inline | Data from the scenario's Given and Examples | owning task |

## 3. Environments

| Code | Environment |
|---|---|
| E-W | REF-WIN (Windows 11 reference machine), Node 20 and 22, `npm test` with the no-network preload |
| E-W4 | REF-WIN, PowerShell 7 and Git Bash, each with Node.js 20 LTS and 22 LTS (C002-DOD-015, C002-DOD-016) |
| E-SER | E-W with Serena 1.7.x installed |
| E-OC | REF-WIN under `npm run replay`: loopback stub model, no other network; `opencode` at its S-07 tested version on PATH and `@opencode-ai/sdk` pinned to it for OpenCode rows. Release replays run under PowerShell 7 and Git Bash with Developer Mode on (`file-symlink`, C002-REQ-634) |
| E-CC | Claude Code at its tested version, desktop-bundled binary through `CLAUDE_CODE_EXECPATH`, plugin from the local marketplace; sessions run with `--auth subscription` on P-01's Claude Max plan (C002-T-060; §4.1 "Eval auth"), not billed to the prepaid API key; a session run with `--auth api-key` is billed to the key |
| E-OCE | OpenCode at its tested version with the Claude model tiers of C002-REQ-105 through the provider of the S-07 record; billed to the prepaid API key (`30-impact/blast-radius.md`, eval cost note) |
| E-CPC | Copilot CLI at its S-08 tested version (1.0.98), non-interactive with `--no-ask-user`, agents named `architect:<agent>`, each case workspace prepared by `sdd install copilot`; billed in AI Credits to P-01's GitHub Copilot plan (1,500 included AI Credits per month; additional usage enabled with a 50 USD budget; 2026-10-16) (about 83 sessions together with E-VSC, §4.2 and §4.4; C002-RISK-026), not to the prepaid API key |
| E-VSC | VS Code Insiders and GitHub Copilot Chat at the S-08 tested versions (1.142.0-insider; scope §3.1), Local session type with `sdd-conductor` as session agent, the toy repository installed with `sdd install copilot`, P-01 at the keyboard, hooks enabled in both modes (the subagent guard hook, C002-REQ-327, C002-REQ-629); billed in AI Credits to the same Copilot plan (C002-T-050, C002-T-057; §4.2 and §4.4), not to the prepaid API key |

## 4. Eval execution and spend

### 4.1 Policy

- **Dev tier** (C001-ADR-003): one run per Examples row, turn cap 30 and spend cap 0.50 USD per
  session (C002-NFR-105, enforced by `evals/harness/caps.mjs`). Each result records host, host version,
  model IDs, tokens, spend and transcript path under `evals/results/`.
- Paid sessions run only at the task steps that `10-strategy.md` §3a names, never elsewhere. An eval
  case whose runner does not exist yet is carried (§6): OpenCode rows to C002-T-056 (runner of
  C002-T-044), Copilot CLI rows to C002-T-045, the release rows to C002-T-049 (OpenCode) and C002-T-054
  (Copilot).
- Milestone and release tiers: not used for CHG-002. P-01 waived the 9-of-10-runs clause of DOD-G-01
  for this change (Q-evalbudget-01, Q-evalbudget-02): every `@eval` case passes at the dev tier, one
  passing run per Examples row with at most one rerun after a failure (C002-DOD-001, 002, 003, 006,
  007, 022).
- **Eval auth** (P-01, 2026-10-18): paid Claude Code eval sessions (E-CC: C002-T-010 step 5,
  C002-T-037 step 4, C002-T-038 step 4, C002-T-048 step 4) run with `node evals/harness/run.mjs …
  --auth subscription` (or `EVAL_AUTH=subscription`) on P-01's Claude Max plan, through the switch of
  C002-T-060. The harness refuses a subscription session whose `apiKeySource` shows the key, so such
  a session never falls back to the key, and these sessions draw on no pool of the budget below.
  `--auth api-key` stays available and is the default when neither the option nor `EVAL_AUTH` is set,
  so every E-CC command names `--auth subscription`. A Claude Code session run with `--auth api-key`
  (for example when the plan's usage limit stops a run and P-01 chooses not to wait for its reset) is
  an API-key session of its owning step's pool under the stop rule. The caps of C002-NFR-105 apply in
  both modes. P-01 watches the plan's usage limits.
- **Budget** (Q-evalbudget-03, `questions-log.md` round 4): 40 USD on the prepaid API key for the
  CHG-002 sessions that bill the key: the S-07 probes, the OpenCode sessions on E-OCE (their billing
  through OpenRouter is still to be discussed, Q-opencode-01, `questions-log.md` round 6; until then
  the plan bills them to the key) and any Claude Code session run with `--auth api-key`. The budget
  has two pools. The **C002-M-07 reserve** of 10 USD is spent only by the release evidence sessions
  of C002-T-049 step 3 (C002-DOD-009), P-01's OpenCode run to G1 in C002-T-051 step 3 (C002-DOD-021;
  Q-evalbudget-04, `questions-log.md` round 5) and C002-T-048 step 4 when it runs with `--auth
  api-key` (C002-DOD-022); every other paid session on the prepaid key draws on the **general pool**
  of 30 USD, including a re-run of C002-T-049 rows after a fix (C002-T-049 step 4). Sizes and room for
  reruns: §4.3. Copilot CLI, VS Code and S-08 sessions are billed in AI Credits to P-01's Copilot plan
  and are not part of the budget (§4.4).
- **Top-up precondition** (C002-T-001 step 1): before the first paid session of CHG-002 on the
  prepaid key, P-01 tops up the key so that it holds at least 40 USD minus the ledger total. The key
  held about 4.77 USD on 2026-10-16, so the top-up is at least about 35.23 USD. C002-T-010 checks the
  same precondition only for a session it runs with `--auth api-key`.
- **Ledger:** `evals/results/spend-chg002.json`, created by the first paid session of CHG-002. It
  holds the budget (40), the two pool limits (general 30, reserve 10), each top-up (date, amount) and
  one entry per paid session (date, task and step, case and Examples row, host, **`auth`**
  `api-key` or `subscription` (Claude Code sessions; the S-07 probes and the OpenCode sessions are
  `api-key`), **pool** `general` or `reserve` for `api-key` entries only, `cost_usd`, result file or,
  for the S-07 probes and the C002-T-051 run, the provider usage reading). A `subscription` entry
  keeps its notional `cost_usd` (as `run.mjs` records it) and counts toward no pool total and not
  toward the 40 USD. A failed session and a session ended by a cap are recorded like any other.
- **Stop rule, per pool, checked before every paid session on the prepaid key** by the runner, or by
  the person who starts the session when the runner does not read the ledger itself (critic CR-20):
  1. The session's pool is that of its owning step (§4.2, `10-strategy.md` §3a). T = the ledger total
     **of that pool only**, `api-key` entries only; H = the highest session cost seen so far in either
     pool or in a `subscription` entry (its notional cost measures the same token use), at least
     0.65 USD (the highest CHG-001 session cost, 0.62 USD, rounded up; the 0.50 USD spend cap of
     C002-NFR-105 is checked after a turn and can be overrun:
     `evals/results/t039-TS-712-2026-10-11T14-05-22-879Z.json` records `cost_usd` 0.62 with
     `result_subtype` `error_max_budget_usd`).
  2. L = 30 USD for a general-pool session; L = 10 USD for a reserve session. For a reserve session of
     C002-T-051 step 3, T also counts the §4.2 estimate of C002-T-049 step 3 if it has not run yet
     (and of C002-T-048 step 4 only if P-01 has decided to run it with `--auth api-key`), so the
     release evidence keeps its share.
  3. The session starts only if T + H ≤ L. Otherwise no further paid session of that pool starts: the
     stop and both pool totals go into the task report, and P-01 decides (more budget, fewer rows, or a
     gap recorded at the gate). A pool never spends the other pool's room, so the ledger total stays
     within 40 USD.
  4. After the session, its `cost_usd` is added to the ledger, with its pool, before the next session
     starts.
  5. **Re-run of C002-T-049 after a fix** (C002-T-049 step 4): the paid rows that the fix requires are
     general-pool sessions under rules 1 to 4. When the general pool says stop, they do not start, and
     P-01 decides; they never draw on the reserve.
  6. **C002-T-051 step 3** is driven by hand, outside the harness caps, as one run of about 4 agent
     sessions: rule 3 is checked once before the run, with the run's §4.2 estimate (1.40 USD) added to
     T, and before each interview round and before the gate P-01 checks rule 3's reserve condition with
     rule 2's T plus the run's spend so far (read from the provider's usage view) and H; otherwise the
     run pauses for a decision. The run is one ledger entry with its session count; for later sessions,
     H is that entry's spend divided by its session count (CR-22).
  7. **Subscription sessions** (`--auth subscription`) are not checked by rules 1 to 6; they are added
     to the ledger with `auth` `subscription` after they end.
- **Checkpoint per owning step:** each owning task reports its steps' spend against their §4.2
  estimate. When the C002-T-044 smoke session costs more than 0.30 USD (twice the routing rate), the
  conductor re-estimates C002-T-056 with the measured OpenCode rate and shows it to P-01 before
  C002-T-056 starts, since no CHG-001 session ran on OpenCode.

### 4.2 Estimated spend per owning step (dev tier)

**Rates.** Planning rates per case family, from the top-level `cost_usd` of the CHG-001 dev-tier
result files `evals/results/t0*.json` (Claude Code, 2026-10-11 to 2026-10-13). Each rate is the
family mean rounded to 0.05 USD. The doctor and injection rates are raised to 0.25 USD, because
sessions below 0.06 USD pull their means down. No CHG-001 session ran on OpenCode; the checkpoint of
§4.1 covers that gap.

| Family | CHG-001 evidence | Observed | Rate |
|---|---|---|---|
| Routing | `t031-TS-206` … `t031-TS-212` (8 sessions) | 0.08–0.20 USD, mean 0.14 | 0.15 USD |
| Doctor and toolchain | `t041-TS-1002-*` … `t041-TS-1014`, `t044-doctor-no-ripwire`, `t044-TS-1112-*`, `t044-TS-1124`, `t042-TS-511`, `t042-TS-515`, `t077-TS-1015`, `t078-TS-1015` (27 sessions) | 0.05–0.51 USD, mean 0.19 | 0.25 USD |
| Interview, gate, revise and question tool | `t032-TS-213` … `t032-TS-218`, `t034-TS-802` … `t034-TS-804` (21 sessions) | 0.15–0.51 USD, mean 0.36 | 0.35 USD |
| Injection | `t054-INJ-01` … `t054-INJ-22` (22 sessions) | 0.002–0.52 USD, mean 0.19 | 0.25 USD |
| S-07 probe | no counterpart: driven by hand, without harness caps (C002-T-001 step 2) | — | 0.50 USD |

The C002-REQ-105 tiers set the model per agent, as in CHG-001. The weighted planning rate is
0.29 USD per session (32.80 USD for the 112 Claude-model sessions on the key or on the Claude
subscription). The review sessions of `t039-*` cost 0.37–0.62 USD and include the highest observed
session; CHG-002 plans no review eval. The **upper bound** is the session count times 0.65 USD. It
is not a cap, and the stop rule of §4.1 is what bounds the spend. Claude Code sessions run with
`--auth subscription` (§4.1 "Eval auth") and appear in their own column with their notional
estimate; they are not part of the API-key totals.

| Milestone | Owning step (`10-strategy.md` §3a) | API-key sessions | Estimate | Upper bound | Claude subscription sessions (`--auth subscription`, notional estimate) | Copilot subscription sessions |
|---|---|---|---|---|---|---|
| C002-M-01 | C002-T-001 steps 2 … 7 | about 10 S-07 probes at 0.50 | 5.00 USD | 6.50 USD | 0 | about 10 S-08 probes (C002-T-002) |
| C002-M-02 | C002-T-010 step 5 | 0 | 0 | 0 | 5 on E-CC at 0.25: regression-set §5 row 1 (3 cases), C002-TC-537 (2 rows); 1.25 USD | 0 |
| C002-M-03 | — | 0 (the sdd MCP server is tested without a host) | 0 | 0 | 0 | 0 |
| C002-M-04 | — | 0 (C002-TC-113 and C002-TC-132 carried to C002-T-056) | 0 | 0 | 0 | 0 |
| C002-M-05 | C002-T-037 step 4 | 0 | 0 | 0 | 3 on E-CC at 0.35: the Claude Code rows of C002-TC-215, 217, 219; 1.05 USD | 0 |
| C002-M-05 | C002-T-038 step 4 | 0 | 0 | 0 | 7 on E-CC at 0.25: the Claude Code rows of C002-TC-506 (1), 509 (2), 510 (2), 511 (1) and `evals/cap11/doctor-no-ripwire.eval.mjs` (1); 1.75 USD | 0 |
| C002-M-06 | C002-T-044 step 6 | 1 routing smoke on E-OCE at 0.15 | 0.15 USD | 0.65 USD | 0 | 0 |
| C002-M-06 | C002-T-056 steps 2 and 3 | 47 on E-OCE: C002-TC-113 (1 at 0.25), C002-TC-132 (1 at 0.35); the OpenCode rows of C002-TC-215 (2), 217 (1), 219 (1), 221 (1), 316 (2) (7 at 0.35); the OpenCode rows of C002-TC-506 (1), 507 (1), 509 (4), 510 (1), 511 (1), 512 (1), 513 (3), 514 (1), 515 (5), 639 (1) (19 at 0.25); C002-TC-613 with the C001-CAP-02 interview and gate cases (about 17), C002-TC-634 and C002-TC-635 (19 at 0.35) | 14.45 USD | 30.55 USD | 0 | 0 |
| C002-M-06 | C002-T-045 steps 4 and 5 | 0 | 0 | 0 | 0 | 5: the smoke, the Copilot CLI rows of C002-TC-513 (3) and C002-TC-526 (1); C002-TC-336 not applicable (0) |
| C002-M-06 | C002-T-056 step 4, only in the S-07 infeasible-driver branch (§8.1) | 4 on E-OCE at 0.35: C002-TC-133, 211, 222, 223 | 1.40 USD | 2.60 USD | 0 | 0 |
| C002-M-07 | C002-T-048 step 4 | 0 (reserve only if run with `--auth api-key`: 1.25 USD, upper 3.25 USD) | 0 | 0 | 5 on E-CC at 0.25: regression-set §5 row 1 (3 cases), C002-TC-537 (2 rows); 1.25 USD | 0 |
| C002-M-07, reserve | C002-T-049 step 3 | 30 on E-OCE: C002-TC-612 routing (about 10 at 0.15) and injection (20 at 0.25) | 6.50 USD | 19.50 USD | 0 | 0 |
| C002-M-07, reserve | C002-T-051 step 3 (P-01, by hand) | about 4 on E-OCE at 0.35: the OpenCode toy change to G1 of C002-TC-902 (conductor interview and gate, and the specialist sessions it starts; Q-evalbudget-04) | 1.40 USD | 2.60 USD | 0 | 0 |
| C002-M-07 | C002-T-054 step 3 | 0 | 0 | 0 | 0 | about 41: C002-TC-615 and C002-TC-359 |
| C002-M-07 | C002-T-050 steps 2 and 3 (P-01) | 0 | 0 | 0 | 0 | about 13 per checklist run on E-VSC (C002-TC-901: the Copilot toy change to G1, the delegated edit of C002-TC-358 with and without the plugin part, the roots step); about 26 with one repeat after a failed step |
| C002-M-07 | C002-T-057 step 2 (P-01) | 0 | 0 | 0 | 0 | 1 on E-VSC: C002-TC-903, to the first interview question |
| **Total** | | **92** (96 in the branch) | **27.50 USD** (28.90 USD in the branch) | 59.80 USD (62.40 USD in the branch) | **20** (5.30 USD notional) | **about 83** |

### 4.3 Budget, reserve and room for reruns

| Pool | Limit | Sessions | Estimate | Room (limit − estimate) |
|---|---|---|---|---|
| General pool: C002-M-01 … C002-M-06 API-key sessions, including the branch sessions of C002-T-056 step 4 | 30.00 USD | 62 | 21.00 USD | 9.00 USD |
| C002-M-07 reserve: C002-T-049 step 3, C002-T-051 step 3 (C002-T-048 step 4 only with `--auth api-key`) | 10.00 USD | 34 | 7.90 USD | 2.10 USD |
| **CHG-002 eval budget (prepaid API key)** | **40.00 USD** | 96 | **28.90 USD** | **11.10 USD** |

- The room is the allowance for reruns: at most one rerun per Examples row after a failure (§4.1).
  9.00 USD is about 31 reruns at the weighted rate; 2.10 USD is about 7 reruns of reserve sessions.
  The reserve room covers a C002-T-051 run at its upper bound (2.60 USD) or a second C002-T-051 run
  (1.40 USD) after C002-T-049 step 3 has spent its estimate (6.50 USD + 2.60 USD = 9.10 USD). If
  C002-T-048 step 4 has to run with `--auth api-key`, its 1.25 USD estimate (3.25 USD upper) comes out
  of the reserve room, which then holds 0.85 USD and no longer covers those two cases; the reserve's
  stop rule then stops the run and P-01 decides. The 40 USD budget is unchanged.
- The general pool also funds the re-runs of C002-T-049 after a fix (§4.1 rule 5), from its room left
  at that time.
  When the branch of §8.1 does not apply, its 1.40 USD adds to the room of the general pool. CHG-001
  ran some cases four or five times while their case files were being written (four
  `t032-TS-214-*` and five `t041-TS-1002-cfg-no-ripwire-*` result files); in CHG-002 a second
  failure reopens the owning task instead of buying more runs.
- The reserve's sessions run in the order of the task graph (C002-T-048 before C002-T-049) and before any
  optional rerun of an earlier row. C002-T-051 does not depend on either task and may run first; its
  stop-rule check then counts the outstanding estimate of C002-T-049 step 3 (§4.1 rule 2). Each pool
  stops on its own total (§4.1): general-pool sessions at 30 USD of general spend, whatever the
  reserve has spent, and reserve sessions at 10 USD of reserve spend.
- Without reruns, the general pool reaches its 30 USD stop when its sessions cost about 40 % more than
  the planning rates. The upper bounds (59.80 USD) show that the stop rule, not the estimate, keeps
  CHG-002 within 40 USD.
- The 20 Claude subscription sessions (5.30 USD notional, 13.00 USD upper) bill P-01's Claude Max
  plan, not the key; the ledger keeps them with `auth` `subscription` (§4.1).

### 4.4 Copilot AI Credits

Copilot bills chat, agent and CLI use in **AI Credits**: 1 credit = 0.01 USD, charged per token
(input, output and cache) at the model's API rate. Copilot sessions therefore cost about what the same
work costs on the API key. P-01's GitHub Copilot plan (1,500 included AI Credits per month; additional usage enabled with a 50 USD budget; 2026-10-16).

| Measure | Source | Value |
|---|---|---|
| Tokens per session | 162 CHG-001 dev-tier sessions in `evals/results/` (`tokens_by_model`) | input about 7,200, output about 9,000, cache read about 170,000, cache write about 28,000 |
| Cost per session | the same sessions; §4.2 rates; §4.2 upper bound | 0.21 USD mean; 0.29 USD weighted; 0.65 USD upper |
| Copilot sessions | §4.2 (S-08 probes, C002-T-045, C002-T-054 with C002-TC-359, C002-T-050 with the delegated-edit and roots steps, C002-T-057) | about 83 |
| Estimate | sessions × 0.21 … 0.29 USD | about 17 … 24 USD = 1,700 … 2,400 credits |
| Upper bound | sessions × 0.65 USD | about 54 USD = 5,400 credits |
| Plan capacity | 1,500 included credits per month + 50 USD additional budget | 6,500 credits in one month |

- The estimate fits the plan: the included credits plus about 2 … 9 USD of additional usage. The upper
  bound fits the plan capacity of one month (6,500 credits) but not the 50 USD additional budget
  alone; work spread over two months draws more on included credits.
- The subagent guard evidence adds about 7 sessions to the earlier count of 76: C002-TC-359 once on
  E-CPC, and on E-VSC per checklist run the delegated edit of C002-TC-358 with and without the plugin
  part and the roots step of C002-T-046, counted twice for one repeat (critic CR-24).
- Unmeasured: Copilot's own agent loop and the inlined skills (C002-DEC-002) can use more tokens per
  session than Claude Code. C002-T-002 records the credits its S-08 probes used, from GitHub's usage
  view, and the per-session figure replaces the 0.21 … 0.29 USD rate for C002-T-045, C002-T-054,
  C002-T-050 and C002-T-057. When that figure puts the remaining Copilot runs above the plan capacity,
  P-01 decides before they start (C002-RISK-026).
- Per-model credit rates follow GitHub's Copilot models-and-pricing page; P-01's billing view is the
  authority.

## 5. Regression set

The set is `30-impact/regression-set.md`; this section assigns it to cases and tasks.

| Group | Source | Command | Cases | Tasks | When |
|---|---|---|---|---|---|
| Must stay green without edits | regression-set §3 | `npm run check`, `npm run bench` | C002-TC-626, C002-TC-627 | C002-T-053 (waiver-aware lint loop), C002-T-006 (coupled tests), C002-T-048 (final run at the release-candidate commit) | before every task commit (as CHG-001 from M-2 on) and at the exit of C002-M-02 and C002-M-07 |
| Guard corpora and their tests (additions only, no flipped case) | regression-set §4.1 | `npm test -- tests/guards`, `npm run bench` | C002-TC-504, C002-TC-527, C002-TC-536, C002-TC-610, C002-TC-636, C002-TC-351, C002-TC-353 | C002-T-007 … C002-T-011, C002-T-059 | after each guard task; the `Allowed:` summary text change of C002-T-059 (`not install;`) is a C002-REQ-325 expectation change (C002-REQ-623, C002-TS-626) |
| CLI tests coupled to CHG-001 files (`frontend.test.ts`) | regression-set §4.2 | `npm test -- integration/cli` | C002-TC-626 | C002-T-006; `sampleArgs` rows by C002-T-012, C002-T-013, C002-T-014, C002-T-032, C002-T-058 | with each new command |
| Build, package and version tests (`TS-1115`, `smoke.test.ts`, `scripts/test.mjs`, `tsconfig.json`) | regression-set §4.3 | `npm test -- cap11`, `npm test -- smoke`, `npm run typecheck` | C002-TC-418, C002-TC-517 | C002-T-004, C002-T-021, C002-T-025, C002-T-040 (replay excluded from `npm test`, before C002-T-026 adds the first other `tests/replay/` file; C002-T-026 depends on C002-T-040) | with each task |
| Plugin structure checks reading the plugin | regression-set §4.4 | `node scripts/check/run.mjs` | C002-TC-121, C002-TC-122 | C002-T-015, C002-T-035 | with each task |
| Claude Code evals on the changed code | regression-set §5 | `node evals/harness/run.mjs <case files> --tier dev` with `evals/cap11/doctor-no-ripwire.eval.mjs`, `evals/cap10/TS-1015.eval.mjs`, `evals/cap11/TS-1111.eval.mjs` (C002-T-010, C002-T-038: positional files, the runner of today); with `--host claude-code` added at C002-T-048 (option of C002-T-044 step 2) | C002-TC-537 | C002-T-010, C002-T-038, C002-T-048 | the three row-1 files and C002-TC-537 once at C002-M-02 (C002-T-010 step 5) and once at C002-M-07 (C002-T-048 step 4); at C002-M-05 only `doctor-no-ripwire.eval.mjs` (C002-T-038 step 4), not C002-TC-537; the other §5 rows only if a source agent, command or skill changes (C002-CON-10) |

## 6. Entry and exit criteria

- **Entry (task)**: dependencies done; the task's fixtures exist; for replay cases the C002-T-042
  driver, for OpenCode eval cases the C002-T-044 runner, for Copilot CLI cases the C002-T-045 runner;
  for a paid session, the top-up of C002-T-001 step 1 and the stop rule of §4.1.
- **Owning and contributing tasks** (Task column of §8): the first task named owns the case. It
  writes or runs the test, and its exit needs the case to pass. Each further task contributes code,
  fixtures or records the case needs, or runs it again as evidence (C002-T-048, C002-T-049, C002-T-054,
  C002-T-056 and the P-01 tasks). A task that lists a case in `verified_by` and runs before the case
  can pass carries it.
- **Exit (task)**: every case of its `verified_by` passes, except the carried ones. A case is
  **carried** when what it needs lands in a later task:
  - a replay or eval case whose driver or runner is not built yet, or whose paid run belongs to a
    later owning step (`10-strategy.md` §3a);
  - a manual case run by P-01 in a later task;
  - an integration or structure case whose test file, code, fixture or record is written by a later
    task: for example the release-check cases of C002-T-001 and C002-T-002, the guard cases of
    C002-T-005, the translator cases of C002-T-024, C002-TC-401 of C002-T-011, and C002-TC-627 of
    C002-T-006.

  The task report lists each carried case with its carrying task; the carrying task's exit needs the
  case to pass. A done-check of the form "all listed scenarios pass" reads as "all listed scenarios
  that are not carried pass". C002-T-026, C002-T-029 and C002-T-030 write the expectations of
  C002-TC-133, 207, 209, 211, 213, 222, 223 and 226 into `tests/replay/scenarios/opencode-host.test.ts`;
  they run under `npm run replay -- opencode-host` from C002-T-042 on. The hook-adapter cases of
  C002-T-032 (`cap03/hook-adapter.test.ts`) first run the hook commands of C002-IF-008 §4 with
  `@CLI_COPY@` replaced by the bundled CLI; their installed form (the command of `<folder>/hooks.json`
  and of `.github/hooks/architect-guard.json` written by `sdd install copilot`, CAP-03 acceptance
  fixtures; C002-TC-357 and C002-TC-362 … C002-TC-366 included) is carried to C002-T-058.
- **Spike branches**: when a row of `10-strategy.md` §4 applies, a case it moves is carried to the
  task and level of §8.1, and a case it makes not applicable is reported "not applicable" with the
  spike record cited. Neither counts as a failure, and neither is passed in another way.
- **Exit (milestone)**: all cases of the milestone's tasks pass, carried cases excepted; the paid
  sessions of its owning steps ran within the stop rule of §4.1.
- **Exit (release, per target)**: for the target released, every case passes on its tested host
  versions; replay reports with 0 differing decisions (C002-DOD-008); injection evals with 0
  instructions acted upon (C002-DOD-009); the timed run (C002-DOD-019; for OpenCode with the toy
  change to G1, C002-DOD-021); for Copilot the checklist record (C002-DOD-004); the regression set at
  the release-candidate commit (C002-DOD-022, shared by both targets); benchmarks (C002-DOD-010).

## 7. Manual cases

P-01 executes every manual case. The `@manual-vscode` cases are steps of
`docs/checklists/vscode-copilot.md`; C002-TC-901 is the run that executes them, and its record under
`docs/checklists/records/` is the evidence of C002-DOD-004. C002-TC-618 is the review of that record.
C002-TC-902 (OpenCode, C002-T-051) and C002-TC-903 (Copilot, C002-T-057) are timed clean-profile runs
recorded in `docs/releases/clean-profile-runs.md` (C002-DOD-019; C002-DOD-021 for the OpenCode toy
change to G1).
The `@review` cases (C002-TC-616, 617, 619, 632) are automated checks of the checklist file plus the
review entry of C002-DOD-007.

## 8. Test cases

Commands: `npm test -- <path substring>`; `npm run replay -- <filter>`; evals
`node evals/harness/run.mjs --host <host> --tier dev --filter <case path>`, with `<host>` one of
`claude-code`, `opencode`, `copilot-cli` (C002-IF-010 §1). `--host` and `--filter` exist from C002-T-044
step 2 on; a filter that selects no case exits non-zero. Before that step (C002-T-010, C002-T-037,
C002-T-038), Claude Code cases run as `node evals/harness/run.mjs <case files> --tier dev`, with
`--only` for single Examples rows. Task column: owning task
first, then contributing tasks (§6). Rows whose Level names "the branch of §8.1" change level in that
branch.

| TC | Verifies | Level | Location | Command | Fixture | Environment | Task |
|---|---|---|---|---|---|---|---|
| C002-TC-101 | C002-TS-101 | integration | `tests/integration/cap01/package-flow.test.ts` | `npm test -- cap01/package-flow` | fx-src (clean checkout) | E-W | C002-T-034, C002-T-036 |
| C002-TC-102 | C002-TS-102 | integration | `tests/integration/cap01/package-flow.test.ts` | `npm test -- cap01/package-flow` | fx-src with a planted generator error | E-W | C002-T-034 |
| C002-TC-103 | C002-TS-103 | integration | `tests/integration/cap01/package-flow.test.ts` | `npm test -- cap01/package-flow` | fx-dist of an earlier run | E-W | C002-T-034 |
| C002-TC-104 | C002-TS-104 | integration | `tests/integration/cap01/generator-frame.test.ts` | `npm test -- cap01/generator-frame` | fx-src | E-W | C002-T-025 |
| C002-TC-105 | C002-TS-105 | integration | `tests/integration/cap01/generator-frame.test.ts` | `npm test -- cap01/generator-frame` | fx-src with an invalid table | E-W | C002-T-025 |
| C002-TC-106 | C002-TS-106 | integration | `tests/integration/cap01/constructs.test.ts` | `npm test -- cap01/constructs` | fx-tables | E-W | C002-T-027, C002-T-024 |
| C002-TC-107 | C002-TS-107 | integration | `tests/integration/cap01/constructs.test.ts` | `npm test -- cap01/constructs` | fx-src | E-W | C002-T-027 |
| C002-TC-108 | C002-TS-108 | integration | `tests/integration/cap01/constructs.test.ts` | `npm test -- cap01/constructs` | fx-tables without the tool entry | E-W | C002-T-027 |
| C002-TC-109 | C002-TS-109 | integration | `tests/integration/cap01/frontmatter.test.ts` | `npm test -- cap01/frontmatter` | fx-tables | E-W | C002-T-026, C002-T-024 |
| C002-TC-110 | C002-TS-110 | integration | `tests/integration/cap01/frontmatter.test.ts` | `npm test -- cap01/frontmatter` | inline | E-W | C002-T-026, C002-T-024 |
| C002-TC-111 | C002-TS-111 | integration | `tests/integration/cap01/frontmatter.test.ts` | `npm test -- cap01/frontmatter` | fx-src | E-W | C002-T-026 |
| C002-TC-112 | C002-TS-112 | integration | `tests/integration/cap01/frontmatter.test.ts` | `npm test -- cap01/frontmatter` | fx-tables | E-W | C002-T-026 |
| C002-TC-113 | C002-TS-113 | eval | `evals/targets/generator/TS-113.eval.mjs` | `run.mjs --host opencode` | fx-oc with the planted `notes.md` | E-OCE | C002-T-026, C002-T-056 |
| C002-TC-114 | C002-TS-114 | integration | `tests/integration/cap01/frontmatter.test.ts` | `npm test -- cap01/frontmatter` | fx-src | E-W | C002-T-026 |
| C002-TC-115 | C002-TS-115 | integration | `tests/integration/cap01/wiring.test.ts` | `npm test -- cap01/wiring` | fx-src | E-W | C002-T-028 |
| C002-TC-116 | C002-TS-116 | structure | `tests/integration/cap06/structure-checks.test.ts` | `npm test -- cap06/structure-checks` | fx-dist-bad (oversize skill) | E-W | C002-T-035 |
| C002-TC-117 | C002-TS-117 | integration | `tests/integration/cap01/wiring.test.ts` | `npm test -- cap01/wiring` | fx-src | E-W | C002-T-028 |
| C002-TC-118 | C002-TS-118 | integration | `tests/integration/cap01/wiring.test.ts` | `npm test -- cap01/wiring` | fx-src | E-W | C002-T-028 |
| C002-TC-119 | C002-TS-119 | integration | `tests/integration/cap01/wiring.test.ts` | `npm test -- cap01/wiring` | inline | E-W | C002-T-028 |
| C002-TC-120 | C002-TS-120 | integration | `tests/integration/cap01/wiring.test.ts` | `npm test -- cap01/wiring` | inline | E-W | C002-T-028 |
| C002-TC-121 | C002-TS-121 | integration | `tests/integration/build/package-staging.test.ts` | `npm test -- build/package-staging` | fx-src | E-W | C002-T-015, C002-T-028, C002-T-035 |
| C002-TC-122 | C002-TS-122 | structure | `tests/integration/cap06/structure-checks.test.ts` | `npm test -- cap06/structure-checks` | fx-src with a pasted variant | E-W | C002-T-035, C002-T-028 |
| C002-TC-123 | C002-TS-123 | integration | `tests/integration/cap01/wiring.test.ts` | `npm test -- cap01/wiring` | fx-src | E-W | C002-T-028 |
| C002-TC-124 | C002-TS-124 | structure | `tests/integration/cap02/package.test.ts` | `npm test -- cap02/package` | fx-dist | E-W | C002-T-029 |
| C002-TC-125 | C002-TS-125 | integration | `tests/integration/cap01/serena-launch.test.ts` | `npm test -- cap01/serena-launch` | fx-tgz, fx-oc copy, `LOCALAPPDATA` = `C:/fx-home/AppData/Local` | E-SER | C002-T-029 |
| C002-TC-126 | C002-TS-126 | structure | `tests/integration/cap06/structure-checks.test.ts` | `npm test -- cap06/structure-checks` | fx-dist-bad | E-W | C002-T-035 |
| C002-TC-127 | C002-TS-127 | integration | `tests/integration/cap01/constructs.test.ts` | `npm test -- cap01/constructs` | fx-src | E-W | C002-T-027 |
| C002-TC-128 | C002-TS-128 | integration | `tests/integration/cap01/constructs.test.ts` | `npm test -- cap01/constructs` | fx-src | E-W | C002-T-027 |
| C002-TC-129 | C002-TS-129 | integration | `tests/integration/cap01/frontmatter.test.ts` | `npm test -- cap01/frontmatter` | fx-tables (server mode) | E-W | C002-T-026 |
| C002-TC-130 | C002-TS-130 | integration | `tests/integration/cap01/frontmatter.test.ts` | `npm test -- cap01/frontmatter` | inline | E-W | C002-T-026 |
| C002-TC-131 | C002-TS-131 | integration | `tests/integration/cap01/constructs.test.ts` | `npm test -- cap01/constructs` | fx-src | E-W | C002-T-027 |
| C002-TC-132 | C002-TS-132 | eval | `evals/targets/generator/TS-132.eval.mjs` | `run.mjs --host opencode` | fx-gate (ready to archive) | E-OCE | C002-T-027, C002-T-056 |
| C002-TC-133 | C002-TS-133 | replay (eval in the branch of §8.1) | `tests/replay/scenarios/opencode-host.test.ts` | `npm run replay -- opencode-host` | fx-oc with `fx-fs` | E-OC | C002-T-026; branch of §8.1: C002-T-056 |
| C002-TC-134 | C002-TS-134 | integration | `tests/integration/cap01/constructs.test.ts` | `npm test -- cap01/constructs` | fx-src (Copilot table) | E-W | C002-T-027, C002-T-028, C002-T-024 |
| C002-TC-640 | C002-TS-640 | structure | `tests/integration/cap06/structure-checks.test.ts` | `npm test -- cap06/structure-checks` | fx-dist-bad (tool map rows) | E-W | C002-T-035 |
| C002-TC-201 | C002-TS-201 | structure | `tests/integration/cap02/package.test.ts` | `npm test -- cap02/package` | fx-dist | E-W | C002-T-029 |
| C002-TC-202 | C002-TS-202 | structure | `tests/integration/cap02/package.test.ts` | `npm test -- cap02/package` | fx-dist-bad | E-W | C002-T-029 |
| C002-TC-203 | C002-TS-203 | structure | `tests/integration/cap02/package.test.ts` | `npm test -- cap02/package` | fx-dist | E-W | C002-T-029 |
| C002-TC-204 | C002-TS-204 | structure | `tests/integration/cap02/package.test.ts` | `npm test -- cap02/package` | fx-dist | E-W | C002-T-029 |
| C002-TC-205 | C002-TS-205 | structure | `tests/integration/cap02/package.test.ts` | `npm test -- cap02/package` | fx-dist | E-W | C002-T-029, C002-T-051 |
| C002-TC-206 | C002-TS-206 | structure | `tests/integration/cap02/readme-targets.test.ts` | `npm test -- cap02/readme-targets` | `README.md` | E-W | C002-T-039 |
| C002-TC-207 | C002-TS-207 | replay | `tests/replay/scenarios/opencode-host.test.ts` | `npm run replay -- opencode-host` | fx-oc (native) | E-OC | C002-T-030, C002-T-043 |
| C002-TC-208 | C002-TS-208 | structure | `tests/integration/cap02/permissions.test.ts` | `npm test -- cap02/permissions` | fx-dist (native) | E-W | C002-T-030 |
| C002-TC-209 | C002-TS-209 | replay | `tests/replay/scenarios/opencode-host.test.ts` | `npm run replay -- opencode-host` | fx-oc (native) | E-OC | C002-T-030, C002-T-043 |
| C002-TC-210 | C002-TS-210 | structure | `tests/integration/cap02/permissions.test.ts` | `npm test -- cap02/permissions` | fx-dist | E-W | C002-T-030 |
| C002-TC-211 | C002-TS-211 | replay (eval in the branch of §8.1) | `tests/replay/scenarios/opencode-host.test.ts` | `npm run replay -- opencode-host` | fx-oc with `my-build` | E-OC | C002-T-030; branch of §8.1: C002-T-056 |
| C002-TC-212 | C002-TS-212 | structure | `tests/integration/cap02/permissions.test.ts` | `npm test -- cap02/permissions` | fx-dist (server) | E-W | C002-T-030 |
| C002-TC-213 | C002-TS-213 | replay | `tests/replay/scenarios/opencode-host.test.ts` | `npm run replay -- opencode-host` | fx-oc (server) | E-OC | C002-T-030 |
| C002-TC-214 | C002-TS-214 | structure | `tests/integration/cap02/permissions.test.ts` | `npm test -- cap02/permissions` | fx-dist (server) | E-W | C002-T-030 |
| C002-TC-215 | C002-TS-215 | eval | `evals/targets/question-tool/TS-215.eval.mjs` | `run.mjs --host claude-code`, `--host opencode` | fx-bootstrap | E-CC, E-OCE | C002-T-037, C002-T-056 |
| C002-TC-216 | C002-TS-216 | manual | `docs/checklists/vscode-copilot.md` step | executed in C002-TC-901 | toy | E-VSC | C002-T-037 |
| C002-TC-217 | C002-TS-217 | eval | `evals/targets/question-tool/TS-217.eval.mjs` | `run.mjs --host claude-code`, `--host opencode` | fx-gate | E-CC, E-OCE | C002-T-037, C002-T-056 |
| C002-TC-218 | C002-TS-218 | manual | `docs/checklists/vscode-copilot.md` step | executed in C002-TC-901 | toy | E-VSC | C002-T-037 |
| C002-TC-219 | C002-TS-219 | eval | `evals/targets/question-tool/TS-219.eval.mjs` | `run.mjs --host claude-code`, `--host opencode` | fx-bootstrap | E-CC, E-OCE | C002-T-037, C002-T-056 |
| C002-TC-220 | C002-TS-220 | manual | `docs/checklists/vscode-copilot.md` step | executed in C002-TC-901 | toy | E-VSC | C002-T-037 |
| C002-TC-221 | C002-TS-221 | eval | `evals/targets/question-tool/TS-221.eval.mjs` | `run.mjs --host opencode` | fx-bootstrap | E-OCE | C002-T-037, C002-T-056 |
| C002-TC-222 | C002-TS-222 | replay (eval in the branch of §8.1) | `tests/replay/scenarios/opencode-host.test.ts` | `npm run replay -- opencode-host` | fx-oc (quick-lint plugin) | E-OC | C002-T-030; branch of §8.1: C002-T-056 |
| C002-TC-223 | C002-TS-223 | replay (eval in the branch of §8.1) | `tests/replay/scenarios/opencode-host.test.ts` | `npm run replay -- opencode-host` | fx-oc (quick-lint plugin) | E-OC | C002-T-030; branch of §8.1: C002-T-056 |
| C002-TC-224 | C002-TS-224 | structure | `tests/integration/cap02/permissions.test.ts` | `npm test -- cap02/permissions` | fx-dist-bad | E-W | C002-T-030 |
| C002-TC-225 | C002-TS-225 | structure | `tests/integration/cap02/package.test.ts` | `npm test -- cap02/package` | fx-dist | E-W | C002-T-029 |
| C002-TC-226 | C002-TS-226 | replay | `tests/replay/scenarios/opencode-host.test.ts` | `npm run replay -- opencode-host` | fx-oc | E-OC | C002-T-029 |
| C002-TC-227 | C002-TS-227 | structure | `tests/integration/cap02/package.test.ts` | `npm test -- cap02/package` | fx-dist-bad | E-W | C002-T-029 |
| C002-TC-301 | C002-TS-301 | structure | `tests/integration/cap03/package.test.ts` | `npm test -- cap03/package` | fx-dist | E-W | C002-T-031, C002-T-033 |
| C002-TC-302 | C002-TS-302 | structure | `tests/integration/cap03/package.test.ts` | `npm test -- cap03/package` | fx-dist-bad | E-W | C002-T-031, C002-T-033, C002-T-035 |
| C002-TC-303 | C002-TS-303 | structure | `tests/integration/cap03/package-hooks.test.ts` | `npm test -- cap03/package-hooks` | fx-dist (server) | E-W | C002-T-033 |
| C002-TC-304 | C002-TS-304 | structure | `tests/integration/cap03/package-hooks.test.ts` | `npm test -- cap03/package-hooks` | fx-dist-bad (server) | E-W | C002-T-033, C002-T-035 |
| C002-TC-305 | C002-TS-305 | structure | `tests/integration/cap03/package.test.ts` | `npm test -- cap03/package` | fx-dist | E-W | C002-T-031 |
| C002-TC-306 | C002-TS-306 | structure | `tests/integration/cap03/package.test.ts` | `npm test -- cap03/package` | fx-dist | E-W | C002-T-031, C002-T-057 |
| C002-TC-307 | C002-TS-307 | structure | `tests/integration/cap02/readme-targets.test.ts` | `npm test -- cap02/readme-targets` | `README.md` | E-W | C002-T-039 |
| C002-TC-308 | C002-TS-308 | structure | `tests/integration/cap03/package.test.ts` | `npm test -- cap03/package` | fx-dist (server) | E-W | C002-T-031 |
| C002-TC-309 | C002-TS-309 | manual | `docs/checklists/vscode-copilot.md` step | executed in C002-TC-901 | toy | E-VSC | C002-T-031 |
| C002-TC-310 | C002-TS-310 | structure | `tests/integration/cap03/package.test.ts` | `npm test -- cap03/package` | fx-dist (server, hooks) | E-W | C002-T-031 |
| C002-TC-311 | C002-TS-311 | structure | `tests/integration/cap03/package-hooks.test.ts` | `npm test -- cap03/package-hooks` | fx-dist (hooks) | E-W | C002-T-033, C002-T-032 |
| C002-TC-312 | C002-TS-312 | integration | `tests/integration/cap03/hook-adapter.test.ts` | `npm test -- cap03/hook-adapter` | fx-cp hook inputs, pkg-cp-hooks | E-W | C002-T-032, C002-T-059, C002-T-058 |
| C002-TC-313 | C002-TS-313 | manual | `docs/checklists/vscode-copilot.md` step | executed in C002-TC-901 | toy | E-VSC | C002-T-032 |
| C002-TC-314 | C002-TS-314 | integration | `tests/integration/cap03/hook-adapter.test.ts` | `npm test -- cap03/hook-adapter` | fx-cp with injected faults, pkg-cp-hooks | E-W | C002-T-032, C002-T-058 |
| C002-TC-315 | C002-TS-315 | structure | `tests/integration/cap02/readme-targets.test.ts` | `npm test -- cap02/readme-targets` | `README.md` | E-W | C002-T-039 |
| C002-TC-316 | C002-TS-316 | eval | `evals/targets/question-tool/TS-316.eval.mjs` | `run.mjs --host opencode` | fx-gate | E-OCE | C002-T-037, C002-T-056 |
| C002-TC-317 | C002-TS-317 | manual | `docs/checklists/vscode-copilot.md` step | executed in C002-TC-901 | toy | E-VSC | C002-T-037 |
| C002-TC-318 | C002-TS-318 | manual | `docs/checklists/vscode-copilot.md` step | executed in C002-TC-901 | toy | E-VSC | C002-T-037 |
| C002-TC-319 | C002-TS-319 | manual | `docs/checklists/vscode-copilot.md` step | executed in C002-TC-901 | toy | E-VSC | C002-T-037 |
| C002-TC-320 | C002-TS-320 | integration | `tests/integration/cap03/hook-adapter.test.ts` | `npm test -- cap03/hook-adapter` | fx-cp, pkg-cp | E-W | C002-T-032, C002-T-058 |
| C002-TC-321 | C002-TS-321 | manual | `docs/checklists/vscode-copilot.md` step | executed in C002-TC-901 | toy | E-VSC | C002-T-032 |
| C002-TC-322 | C002-TS-322 | integration | `tests/integration/cap03/hook-adapter.test.ts` | `npm test -- cap03/hook-adapter` | inline (repository without `.sdd/`), pkg-cp | E-W | C002-T-032, C002-T-058 |
| C002-TC-323 | C002-TS-323 | integration | `tests/integration/cap03/hook-adapter.test.ts` | `npm test -- cap03/hook-adapter` | fx-cp, pkg-cp | E-W | C002-T-032, C002-T-058 |
| C002-TC-324 | C002-TS-324 | integration | `tests/integration/cap03/hook-adapter.test.ts` | `npm test -- cap03/hook-adapter` | fx-cp with a broken `registry.json`, pkg-cp | E-W | C002-T-032, C002-T-058 |
| C002-TC-325 | C002-TS-325 | structure | `tests/integration/cap03/package-hooks.test.ts` | `npm test -- cap03/package-hooks` | fx-dist | E-W | C002-T-033 |
| C002-TC-326 | C002-TS-326 | structure | `tests/integration/cap03/package-hooks.test.ts` | `npm test -- cap03/package-hooks` | fx-dist-bad | E-W | C002-T-033, C002-T-035 |
| C002-TC-327 | C002-TS-327 | structure | `tests/integration/cap03/package.test.ts` | `npm test -- cap03/package` | fx-dist-bad | E-W | C002-T-031, C002-T-035 |
| C002-TC-328 | C002-TS-328 | structure | `tests/integration/cap03/package.test.ts` | `npm test -- cap03/package` | fx-dist | E-W | C002-T-031 |
| C002-TC-329 | C002-TS-329 | manual | `docs/checklists/vscode-copilot.md` step | executed in C002-TC-901 | toy | E-VSC | C002-T-031 |
| C002-TC-330 | C002-TS-330 | structure | `tests/integration/cap03/package-hooks.test.ts` | `npm test -- cap03/package-hooks` | fx-dist (hooks) | E-W | C002-T-033 |
| C002-TC-331 | C002-TS-331 | structure | `tests/integration/cap03/package-hooks.test.ts` | `npm test -- cap03/package-hooks` | fx-dist (server) | E-W | C002-T-033 |
| C002-TC-332 | C002-TS-332 | structure | `tests/integration/cap03/package-hooks.test.ts` | `npm test -- cap03/package-hooks` | fx-dist-bad | E-W | C002-T-033 |
| C002-TC-333 | C002-TS-333 | integration | `tests/integration/cap03/hook-adapter.test.ts` | `npm test -- cap03/hook-adapter` | fx-cp hook inputs, pkg-cp-hooks | E-W | C002-T-032, C002-T-058 |
| C002-TC-334 | C002-TS-334 | integration | `tests/integration/cap03/hook-adapter.test.ts` | `npm test -- cap03/hook-adapter` | fx-cp hook inputs, pkg-cp-hooks | E-W | C002-T-032, C002-T-058 |
| C002-TC-335 | C002-TS-335 | manual | `docs/checklists/vscode-copilot.md` step | executed in C002-TC-901 | toy | E-VSC | C002-T-032 |
| C002-TC-336 | C002-TS-336 | eval (`@mode-hooks`; not applicable under the signed-off S-08 record, `sdd-mcp-server`) | `evals/targets/copilot-guard/TS-336.eval.mjs` | `run.mjs --host copilot-cli --tier dev --filter evals/targets/copilot-guard` | pkg-cp-hooks loaded with `--plugin-dir` and installed into a copy of fx-cp | E-CPC | C002-T-045, C002-T-054 |
| C002-TC-337 | C002-TS-337 | integration | `tests/integration/cap03/hook-adapter.test.ts` | `npm test -- cap03/hook-adapter` | fx-cp hook inputs (no `agent_type`, adopter names, unknown `sdd-` name, non-string), pkg-cp-hooks | E-W | C002-T-032, C002-T-058 |
| C002-TC-338 | C002-TS-338 | integration | `tests/integration/cap03/hook-adapter.test.ts` | `npm test -- cap03/hook-adapter` | fx-cp, pkg-cp-hooks without `hooks/tool-classes.json` | E-W | C002-T-032, C002-T-058 |
| C002-TC-339 | C002-TS-339 | structure | `tests/integration/cap03/package.test.ts` | `npm test -- cap03/package` | fx-dist (hooks) | E-W | C002-T-031, C002-T-035 |
| C002-TC-340 | C002-TS-340 | structure | `tests/integration/cap06/structure-checks.test.ts` | `npm test -- cap06/structure-checks` | fx-dist-bad (hooks: conductor grants `edit`, `plan.prompt.md` grants `execute`) | E-W | C002-T-035, C002-T-031 |
| C002-TC-341 | C002-TS-341 | integration | `tests/integration/cap03/install.test.ts` | `npm test -- cap03/install` | fx-cp-install, pkg-cp | E-W | C002-T-058 |
| C002-TC-342 | C002-TS-342 | integration | `tests/integration/cap03/install.test.ts` | `npm test -- cap03/install` | fx-cp-install, pkg-cp (CLI run as its `scripts/sdd.mjs`) | E-W | C002-T-058 |
| C002-TC-343 | C002-TS-343 | integration | `tests/integration/cap03/install.test.ts` | `npm test -- cap03/install` | fx-cp-install after one install, pkg-cp | E-W | C002-T-058 |
| C002-TC-344 | C002-TS-344 | integration | `tests/integration/cap03/install.test.ts` | `npm test -- cap03/install` | fx-cp-install after an install of 0.3.0, pkg-cp replaced by 0.3.1 | E-W | C002-T-058 |
| C002-TC-345 | C002-TS-345 | integration | `tests/integration/cap03/install.test.ts` | `npm test -- cap03/install` | fx-cp-install; `C:/fx/empty`, the generated OpenCode package, pkg-cp variants per row; fx-tgz for the global `architect-sdd` row | E-W | C002-T-058 |
| C002-TC-346 | C002-TS-346 | integration | `tests/integration/cap03/install.test.ts` | `npm test -- cap03/install` | fx-cp-install with an adopter `.vscode/mcp.json`, pkg-cp | E-W | C002-T-058 |
| C002-TC-347 | C002-TS-347 | integration | `tests/integration/cap03/install.test.ts` | `npm test -- cap03/install` | fx-cp-install, pkg-cp | E-W | C002-T-058 |
| C002-TC-348 | C002-TS-348 | integration | `tests/integration/cap03/install.test.ts` | `npm test -- cap03/install` | fx-cp-install with adopter copies equal to the package's, pkg-cp | E-W | C002-T-058 |
| C002-TC-349 | C002-TS-349 | integration | `tests/integration/cap03/install.test.ts` | `npm test -- cap03/install` | fx-cp-install with one adopter file or server per row, pkg-cp | E-W | C002-T-058 |
| C002-TC-350 | C002-TS-350 | integration | `tests/integration/cap03/install.test.ts` | `npm test -- cap03/install` | fx-cp-install after one install, then edited by P-03 | E-W | C002-T-058 |
| C002-TC-351 | C002-TS-351 | integration | `tests/guards/bash-corpus.test.ts` (cases in `bash-corpus.json`) | `npm test -- tests/guards` | corpora, fx-repo (`C:/repo`) | E-W | C002-T-059 |
| C002-TC-352 | C002-TS-352 | integration | `tests/integration/mcp/shell.test.ts` | `npm test -- mcp/shell` | fx-tgz, fx-cp-install | E-W | C002-T-019, C002-T-059 |
| C002-TC-353 | C002-TS-353 | integration | `tests/guards/bash-corpus.test.ts` (cases in `bash-corpus.json`) | `npm test -- tests/guards` | corpora, fx-repo (`C:/repo`) | E-W | C002-T-059, C002-T-009 |
| C002-TC-354 | C002-TS-354 | integration | `tests/integration/cap03/install.test.ts` | `npm test -- cap03/install` | fx-cp-install, pkg-cp | E-W | C002-T-058, C002-T-033 |
| C002-TC-355 | C002-TS-355 | structure | `tests/integration/cap06/structure-checks.test.ts` | `npm test -- cap06/structure-checks` | fx-dist-bad (root token per row in `install/hooks.template.json`) | E-W | C002-T-035, C002-T-033 |
| C002-TC-356 | C002-TS-356 | integration | `tests/integration/cap03/install.test.ts` | `npm test -- cap03/install` | fx-cp-install, pkg-cp copied to each folder of the Examples | E-W | C002-T-058 |
| C002-TC-357 | C002-TS-357 | integration | `tests/integration/cap03/hook-adapter.test.ts` | `npm test -- cap03/hook-adapter` | fx-cp hook inputs of non-Architect subagents (host built-in, adopter, `architect:` adopter, unknown `sdd-` name, `42`, `null`), fx-outer, pkg-cp and pkg-cp-hooks installed into fx-cp | E-W | C002-T-032, C002-T-058, C002-T-033 |
| C002-TC-358 | C002-TS-358 | manual | `docs/checklists/vscode-copilot.md` delegated-edit step (C002-T-046) | executed in C002-TC-901 by P-01, hooks enabled, once with and once without the plugin part | toy with the planted line of `docs/checklists/fixtures/toy-planted-line.md` in its ideation file and `src/app.ts` | E-VSC | C002-T-046, C002-T-050 |
| C002-TC-359 | C002-TS-359 | eval | `evals/targets/copilot-guard/TS-359.eval.mjs` | `run.mjs --host copilot-cli --tier dev --filter evals/targets/copilot-guard/TS-359.eval.mjs` | pkg-cp loaded with `--plugin-dir` and installed into a copy of fx-cp whose active change's ideation file holds the planted line | E-CPC | C002-T-045, C002-T-054 |
| C002-TC-360 | C002-TS-360 | integration | `tests/integration/cap03/install.test.ts` | `npm test -- cap03/install` | fx-cp with pkg-cp and pkg-cp-hooks installed, then `hooks.json` and `plugin.json` deleted from the package | E-W | C002-T-058, C002-T-032 |
| C002-TC-361 | C002-TS-361 | integration | `tests/integration/cap03/install.test.ts` | `npm test -- cap03/install` | fx-cp with pkg-cp installed, then the package folder renamed | E-W | C002-T-058 |
| C002-TC-362 | C002-TS-362 | integration | `tests/integration/cap03/hook-adapter.test.ts` | `npm test -- cap03/hook-adapter` | fx-cp with injected faults (command without or with an unknown `--mode`, without `--agents`; unreadable input; unclassed tools; no `cwd`; unreadable classes file; fault injection in the workspace lookup and the decision), pkg-cp and pkg-cp-hooks | E-W | C002-T-032, C002-T-058 |
| C002-TC-363 | C002-TS-363 | integration | `tests/integration/cap03/hook-adapter.test.ts` | `npm test -- cap03/hook-adapter` | fx-cp and fx-cp-install hook inputs of non-Architect subagents, pkg-cp and pkg-cp-hooks | E-W | C002-T-032, C002-T-058 |
| C002-TC-364 | C002-TS-364 | integration | `tests/integration/cap03/hook-adapter.test.ts` | `npm test -- cap03/hook-adapter` | fx-cp-install, pkg-cp without `hooks/tool-classes.json` | E-W | C002-T-032, C002-T-058 |
| C002-TC-365 | C002-TS-365 | integration | `tests/integration/cap03/hook-adapter.test.ts` | `npm test -- cap03/hook-adapter` | fx-cp hook inputs without `agent_type` (with and without `cwd`) and of Architect agents in both name forms, pkg-cp (`--mode sdd-mcp-server`) | E-W | C002-T-032, C002-T-058 |
| C002-TC-366 | C002-TS-366 | integration | `tests/integration/cap03/hook-adapter.test.ts` | `npm test -- cap03/hook-adapter` | fx-cp, pkg-cp without `hooks/tool-classes.json` | E-W | C002-T-032, C002-T-058 |
| C002-TC-401 | C002-TS-401 | integration | `tests/integration/mcp/files.test.ts` | `npm test -- mcp/files` | fx-tgz, fx-repo | E-W | C002-T-017, C002-T-011 |
| C002-TC-402 | C002-TS-402 | integration | `tests/integration/mcp/faults.test.ts` | `npm test -- mcp/faults` | fx-tgz, fx-repo | E-W | C002-T-020, C002-T-017 |
| C002-TC-403 | C002-TS-403 | integration | `tests/integration/mcp/files.test.ts` | `npm test -- mcp/files` | fx-tgz | E-W | C002-T-017 |
| C002-TC-404 | C002-TS-404 | integration | `tests/integration/mcp/files.test.ts` | `npm test -- mcp/files` | fx-tgz, fx-repo | E-W | C002-T-017 |
| C002-TC-405 | C002-TS-405 | integration | `tests/integration/mcp/files.test.ts` | `npm test -- mcp/files` | fx-tgz, fx-repo | E-W | C002-T-017, C002-T-020 |
| C002-TC-406 | C002-TS-406 | integration | `tests/integration/mcp/shell.test.ts` | `npm test -- mcp/shell` | fx-tgz, fx-repo | E-W | C002-T-019 |
| C002-TC-407 | C002-TS-407 | integration | `tests/integration/mcp/shell.test.ts` | `npm test -- mcp/shell` | fx-tgz, fx-repo | E-W | C002-T-019 |
| C002-TC-408 | C002-TS-408 | integration | `tests/integration/mcp/shell.test.ts` | `npm test -- mcp/shell` | fx-tgz, fx-repo | E-W | C002-T-019 |
| C002-TC-409 | C002-TS-409 | integration | `tests/integration/mcp/shell.test.ts` | `npm test -- mcp/shell` | fx-tgz, cfg shim with another `sdd` on PATH | E-W | C002-T-019 |
| C002-TC-410 | C002-TS-410 | integration | `tests/integration/mcp/quick-lint.test.ts` | `npm test -- mcp/quick-lint` | fx-tgz, fx-repo | E-W | C002-T-018 |
| C002-TC-411 | C002-TS-411 | integration | `tests/integration/mcp/quick-lint.test.ts` | `npm test -- mcp/quick-lint` | fx-tgz, fx-repo | E-W | C002-T-018 |
| C002-TC-412 | C002-TS-412 | integration | `tests/integration/mcp/quick-lint.test.ts` | `npm test -- mcp/quick-lint` | fx-tgz, fx-repo | E-W | C002-T-018 |
| C002-TC-413 | C002-TS-413 | integration | `tests/integration/mcp/quick-lint.test.ts` | `npm test -- mcp/quick-lint` | fx-tgz, fx-repo with a broken workspace | E-W | C002-T-018 |
| C002-TC-414 | C002-TS-414 | integration | `tests/integration/mcp/protocol.test.ts` | `npm test -- mcp/protocol` | fx-tgz | E-W | C002-T-016 |
| C002-TC-415 | C002-TS-415 | integration | `tests/integration/mcp/protocol.test.ts` | `npm test -- mcp/protocol` | fx-tgz | E-W | C002-T-016 |
| C002-TC-416 | C002-TS-416 | integration | `tests/integration/mcp/protocol.test.ts` | `npm test -- mcp/protocol` | fx-tgz | E-W | C002-T-016 |
| C002-TC-417 | C002-TS-417 | integration | `tests/integration/build/npm-staging.test.ts` | `npm test -- build/npm-staging` | fx-tgz | E-W | C002-T-022, C002-T-023 |
| C002-TC-418 | C002-TS-418 | integration | `tests/integration/build/notices-union.test.ts` | `npm test -- build/notices-union` | fx-src with an injected GPL package | E-W | C002-T-021 |
| C002-TC-419 | C002-TS-419 | integration | `tests/integration/build/notices-union.test.ts` | `npm test -- build/notices-union` | fx-tgz | E-W | C002-T-021 |
| C002-TC-420 | C002-TS-420 | integration | `tests/integration/mcp/protocol.test.ts` | `npm test -- mcp/protocol` | fx-tgz | E-W | C002-T-016 |
| C002-TC-421 | C002-TS-421 | integration | `tests/integration/mcp/protocol.test.ts` | `npm test -- mcp/protocol` | fx-tgz | E-W | C002-T-016 |
| C002-TC-422 | C002-TS-422 | integration | `tests/integration/mcp/protocol.test.ts` | `npm test -- mcp/protocol` | fx-tgz | E-W | C002-T-016 |
| C002-TC-641 | C002-TS-641 | integration | `tests/integration/mcp/shell.test.ts` | `npm test -- mcp/shell` | fx-tgz, fx-repo | E-W | C002-T-019 |
| C002-TC-642 | C002-TS-642 | integration | `tests/integration/mcp/shell.test.ts` | `npm test -- mcp/shell` | fx-tgz, cfg shim with a `.cmd`-only executable | E-W | C002-T-019 |
| C002-TC-501 | C002-TS-501 | integration | `scripts/smoke-npm.mjs` | `npm run smoke:npm` | fx-tgz (clean prefix) | E-W4 | C002-T-023, C002-T-022 |
| C002-TC-502 | C002-TS-502 | integration | `tests/integration/build/npm-staging.test.ts` | `npm test -- build/npm-staging` | fx-tgz, fx-bootstrap | E-W | C002-T-022 |
| C002-TC-503 | C002-TS-503 | integration | `tests/integration/build/npm-staging.test.ts` | `npm test -- build/npm-staging` | fx-src | E-W | C002-T-022, C002-T-003, C002-T-052, C002-T-055 |
| C002-TC-504 | C002-TS-504 | integration | `tests/guards/bash-corpus.test.ts` | `npm test -- tests/guards` | corpora, fx-repo | E-W | C002-T-008 |
| C002-TC-505 | C002-TS-505 | integration | `tests/integration/cli/guard-message.test.ts` | `npm test -- cli/guard-message` | inline | E-W | C002-T-008 |
| C002-TC-506 | C002-TS-506 | eval | `evals/targets/doctor/TS-506.eval.mjs` | `run.mjs --host claude-code`, `--host opencode` | cfg-full | E-CC, E-OCE | C002-T-038, C002-T-056 |
| C002-TC-507 | C002-TS-507 | eval | `evals/targets/doctor/TS-507.eval.mjs` | `run.mjs --host opencode` | cfg-no-ripwire | E-OCE | C002-T-038, C002-T-056 |
| C002-TC-508 | C002-TS-508 | manual | `docs/checklists/vscode-copilot.md` step | executed in C002-TC-901 | toy with `architect-sdd` installed | E-VSC | C002-T-038 |
| C002-TC-509 | C002-TS-509 | eval | `evals/targets/doctor/TS-509.eval.mjs` | `run.mjs --host claude-code`, `--host opencode` | cfg-* per row | E-CC, E-OCE | C002-T-038, C002-T-056 |
| C002-TC-510 | C002-TS-510 | eval | `evals/targets/doctor/TS-510.eval.mjs` | `run.mjs --host claude-code`, `--host opencode` | cfg-old-claude, cfg-full with a `claude` shim per row | E-CC, E-OCE | C002-T-038, C002-T-056 |
| C002-TC-511 | C002-TS-511 | eval | `evals/targets/doctor/TS-511.eval.mjs` | `run.mjs --host claude-code`, `--host opencode` | cfg-full, workspace with `.sdd/` | E-CC, E-OCE | C002-T-038, C002-T-056 |
| C002-TC-512 | C002-TS-512 | eval | `evals/targets/doctor/TS-512.eval.mjs` | `run.mjs --host opencode` | cfg-full, repository without `.sdd/` | E-OCE | C002-T-038, C002-T-056 |
| C002-TC-513 | C002-TS-513 | eval | `evals/targets/doctor/TS-513.eval.mjs` | `run.mjs --host opencode`, `--host copilot-cli` | `opencode` and `code` version shims per row | E-OCE, E-CPC | C002-T-038, C002-T-014, C002-T-056, C002-T-045 |
| C002-TC-514 | C002-TS-514 | eval | `evals/targets/doctor/TS-514.eval.mjs` | `run.mjs --host opencode` | `opencode` shim reporting 1.5.0 | E-OCE | C002-T-038, C002-T-014, C002-T-056 |
| C002-TC-515 | C002-TS-515 | eval | `evals/targets/doctor/TS-515.eval.mjs` | `run.mjs --host opencode` | `sdd` version shims per row | E-OCE | C002-T-038, C002-T-056 |
| C002-TC-516 | C002-TS-516 | manual | `docs/checklists/vscode-copilot.md` step | executed in C002-TC-901 | toy, hooks states per row | E-VSC | C002-T-038 |
| C002-TC-517 | C002-TS-517 | integration | `tests/integration/cli/version.test.ts` | `npm test -- cli/version` | fx-tgz | E-W | C002-T-004 |
| C002-TC-518 | C002-TS-518 | integration | `tests/integration/cli/version.test.ts` | `npm test -- cli/version` | inline | E-W | C002-T-004 |
| C002-TC-519 | C002-TS-519 | integration | `tests/integration/build/npm-staging.test.ts` | `npm test -- build/npm-staging` | fx-tgz | E-W | C002-T-022 |
| C002-TC-520 | C002-TS-520 | integration | `tests/integration/cli/template.test.ts` | `npm test -- cli/template` | inline | E-W | C002-T-012 |
| C002-TC-521 | C002-TS-521 | integration | `tests/integration/cli/template.test.ts` | `npm test -- cli/template` | inline | E-W | C002-T-012 |
| C002-TC-522 | C002-TS-522 | integration | `tests/integration/cli/template.test.ts` | `npm test -- cli/template` | inline | E-W | C002-T-012 |
| C002-TC-523 | C002-TS-523 | integration | `tests/integration/cli/serena-user-data.test.ts` | `npm test -- cli/serena-user-data` | inline (platform environment per row) | E-W | C002-T-013 |
| C002-TC-524 | C002-TS-524 | integration | `tests/integration/cli/serena-user-data.test.ts` | `npm test -- cli/serena-user-data` | Serena shim | E-W | C002-T-013 |
| C002-TC-525 | C002-TS-525 | integration | `tests/integration/cli/serena-user-data.test.ts` | `npm test -- cli/serena-user-data` | fx-repo | E-W | C002-T-013, C002-T-005 |
| C002-TC-526 | C002-TS-526 | eval | `evals/targets/doctor/TS-526.eval.mjs` | `run.mjs --host copilot-cli` | user profile without VS Code settings | E-CPC | C002-T-038, C002-T-045 |
| C002-TC-527 | C002-TS-527 | integration | `tests/guards/bash-corpus.test.ts` | `npm test -- tests/guards` | corpora, fx-repo | E-W | C002-T-010, C002-T-005 |
| C002-TC-528 | C002-TS-528 | integration | `tests/guards/bash-corpus.test.ts` | `npm test -- tests/guards` | corpora | E-W | C002-T-010 |
| C002-TC-529 | C002-TS-529 | integration | `tests/integration/build/npm-staging.test.ts` | `npm test -- build/npm-staging` | fx-tgz | E-W | C002-T-022 |
| C002-TC-530 | C002-TS-530 | integration | `tests/integration/build/npm-staging.test.ts` | `npm test -- build/npm-staging` | fx-src with a plugin path planted in a template | E-W | C002-T-022 |
| C002-TC-531 | C002-TS-531 | integration | `tests/integration/cli/template.test.ts` | `npm test -- cli/template` | inline | E-W | C002-T-012 |
| C002-TC-532 | C002-TS-532 | integration | `tests/integration/cli/template.test.ts` | `npm test -- cli/template` | inline with `.sdd/_templates` | E-W | C002-T-012 |
| C002-TC-533 | C002-TS-533 | integration | `tests/integration/cli/serena-user-data.test.ts` | `npm test -- cli/serena-user-data` | fx-repo | E-W | C002-T-013 |
| C002-TC-534 | C002-TS-534 | integration | `tests/integration/build/npm-staging.test.ts` | `npm test -- build/npm-staging` | fx-tgz | E-W | C002-T-022 |
| C002-TC-535 | C002-TS-535 | integration | `tests/integration/build/npm-staging.test.ts` | `npm test -- build/npm-staging` | fx-src | E-W | C002-T-022 |
| C002-TC-536 | C002-TS-536 | integration | `tests/guards/bash-corpus.test.ts` | `npm test -- tests/guards` | corpora, fx-repo | E-W | C002-T-009, C002-T-005 |
| C002-TC-537 | C002-TS-537 | eval | `evals/targets/doctor/TS-537.eval.mjs` | `run.mjs --host claude-code` | cfg-full; fx-bootstrap copy; empty git repository `C:/fx-work/fresh` | E-CC | C002-T-010, C002-T-048 |
| C002-TC-639 | C002-TS-639 | eval | `evals/targets/doctor/TS-639.eval.mjs` | `run.mjs --host opencode` | cfg-full with `ast-grep.cmd` only; fx-dist (server) | E-OCE | C002-T-038, C002-T-056 |
| C002-TC-601 | C002-TS-601 | structure | `tests/integration/cap06/structure-checks.test.ts` | `npm test -- cap06/structure-checks`; `npm run check` | fx-src (clean checkout) | E-W | C002-T-035 |
| C002-TC-602 | C002-TS-602 | structure | `tests/integration/cap06/structure-checks.test.ts` | `npm test -- cap06/structure-checks` | fx-dist-bad | E-W | C002-T-035 |
| C002-TC-603 | C002-TS-603 | structure | `tests/integration/cap06/structure-checks.test.ts` | `npm test -- cap06/structure-checks` | fx-dist of an earlier run | E-W | C002-T-035 |
| C002-TC-604 | C002-TS-604 | structure | `tests/integration/cap06/structure-checks.test.ts` | `npm test -- cap06/structure-checks` | fx-dist-bad | E-W | C002-T-035 |
| C002-TC-605 | C002-TS-605 | structure | `tests/integration/cap06/structure-checks.test.ts` | `npm test -- cap06/structure-checks` | fx-dist-bad | E-W | C002-T-035 |
| C002-TC-606 | C002-TS-606 | structure | `tests/integration/cap06/structure-checks.test.ts` | `npm test -- cap06/structure-checks` | fx-dist-bad (server) | E-W | C002-T-035 |
| C002-TC-607 | C002-TS-607 | structure | `tests/integration/cap06/structure-checks.test.ts` | `npm test -- cap06/structure-checks` | fx-src with CHG-001 moved to `_archive/` | E-W | C002-T-035 |
| C002-TC-608 | C002-TS-608 | replay | `tests/replay/run.mjs` | `npm run replay -- --all` | corpora, fx-dist per mode in use, fx-oc | E-OC (release: PowerShell 7 and Git Bash, `file-symlink`) | C002-T-040, C002-T-041, C002-T-049, C002-T-054 |
| C002-TC-609 | C002-TS-609 | replay | `tests/replay/scenarios/suite.test.ts` | `npm run replay -- suite` | corpus fixture with a planted expectation | E-OC | C002-T-040, C002-T-041, C002-T-049 |
| C002-TC-610 | C002-TS-610 | integration | `tests/guards/corpus-format.test.ts` | `npm test -- tests/guards` | corpora | E-W | C002-T-007, C002-T-008, C002-T-009, C002-T-010, C002-T-059 |
| C002-TC-611 | C002-TS-611 | integration | `tests/integration/cap06/runner-caps.test.ts` | `npm test -- cap06/runner-caps` | stub-host, SHA-256 of `evals/` case files | E-W | C002-T-044 |
| C002-TC-612 | C002-TS-612 | eval | routing cases and `evals/injection/injection.eval.mjs` | `run.mjs --host opencode --tier dev` | case fixtures | E-OCE | C002-T-044, C002-T-049 |
| C002-TC-613 | C002-TS-613 | eval | `evals/targets/gate/TS-613.eval.mjs` and the C001-CAP-02 interview and gate cases | `run.mjs --host opencode` | fx-gate | E-OCE | C002-T-044, C002-T-056 |
| C002-TC-614 | C002-TS-614 | integration | `tests/integration/cap06/runner-caps.test.ts`, `tests/integration/cap06/copilot-runner.test.ts` | `npm test -- cap06/runner-caps`, `npm test -- cap06/copilot-runner` | stub-host | E-W | C002-T-044, C002-T-045 |
| C002-TC-615 | C002-TS-615 | eval | routing, injection, sdd MCP server guard and non-interactive cases | `run.mjs --host copilot-cli --tier dev` | case fixtures; each workspace prepared by `sdd install copilot` from a package copy loaded with `--plugin-dir` | E-CPC | C002-T-045, C002-T-054 |
| C002-TC-616 | C002-TS-616 | structure | `tests/integration/cap06/checklist.test.ts` | `npm test -- cap06/checklist`; review entry (C002-DOD-007) | checklist, S-08 record with `copilot_cli_loads_package: false` | E-W | C002-T-046 |
| C002-TC-617 | C002-TS-617 | structure | `tests/integration/cap06/checklist.test.ts` | `npm test -- cap06/checklist`; review entry (C002-DOD-007) | `docs/checklists/vscode-copilot.md` | E-W | C002-T-046, C002-T-050 |
| C002-TC-618 | C002-TS-618 | manual | review of `docs/checklists/records/vscode-<YYYY-MM-DD>-<version>.md` | review entry (C002-DOD-007) | record of C002-TC-901 | E-VSC | C002-T-046, C002-T-050 |
| C002-TC-619 | C002-TS-619 | structure | `tests/integration/cap06/checklist.test.ts` | `npm test -- cap06/checklist`; review entry (C002-DOD-007) | `docs/checklists/vscode-copilot.md` | E-W | C002-T-046 |
| C002-TC-620 | C002-TS-620 | integration | `tests/integration/cap06/release-check.test.ts` | `npm test -- cap06/release-check` | fx-release | E-W | C002-T-047, C002-T-001, C002-T-043, C002-T-052, C002-T-055 |
| C002-TC-621 | C002-TS-621 | integration | `tests/integration/cap06/release-check.test.ts` | `npm test -- cap06/release-check` | fx-release | E-W | C002-T-047, C002-T-050 |
| C002-TC-622 | C002-TS-622 | integration | `tests/integration/cap06/release-check.test.ts` | `npm test -- cap06/release-check` | fx-release | E-W | C002-T-047, C002-T-052, C002-T-055 |
| C002-TC-623 | C002-TS-623 | integration | `tests/integration/cap06/release-check.test.ts` | `npm test -- cap06/release-check` | fx-release (S-08 record per row) | E-W | C002-T-047, C002-T-002 |
| C002-TC-624 | C002-TS-624 | integration | `tests/integration/cap06/release-check.test.ts` | `npm test -- cap06/release-check` | fx-release (versions per row) | E-W | C002-T-047 |
| C002-TC-625 | C002-TS-625 | integration | `tests/integration/cap06/release-check.test.ts` | `npm test -- cap06/release-check` | fx-release | E-W | C002-T-047 |
| C002-TC-626 | C002-TS-626 | integration | regression set (`30-impact/regression-set.md` §3) | `npm run check`; `npm run bench` | the repository at the commit under test | E-W | C002-T-053, C002-T-006, C002-T-048 |
| C002-TC-627 | C002-TS-627 | integration | `tests/integration/contracts/claude-behaviour.test.ts` | `npm test -- contracts/claude-behaviour` | fx-src with a planted Claude Code behaviour change per row | E-W | C002-T-048, C002-T-006 |
| C002-TC-628 | C002-TS-628 | replay | `tests/replay/scenarios/suite.test.ts` | `npm run replay -- suite` | corpora (memory cases) | E-OC | C002-T-040, C002-T-011 |
| C002-TC-629 | C002-TS-629 | replay | `tests/replay/scenarios/suite.test.ts` | `npm run replay -- suite` | corpus fixture | E-OC | C002-T-040 |
| C002-TC-630 | C002-TS-630 | replay | `tests/replay/scenarios/opencode-host.test.ts` | `npm run replay -- opencode-host` | fx-oc (identity cases) | E-OC | C002-T-042 |
| C002-TC-631 | C002-TS-631 | replay | `tests/replay/scenarios/suite.test.ts` | `npm run replay -- suite` | corpora | E-OC | C002-T-040 |
| C002-TC-632 | C002-TS-632 | structure | `tests/integration/cap06/checklist.test.ts` | `npm test -- cap06/checklist`; review entry (C002-DOD-007) | `docs/checklists/vscode-copilot.md` | E-W | C002-T-046 |
| C002-TC-633 | C002-TS-633 | integration | `tests/integration/cap06/release-check.test.ts` | `npm test -- cap06/release-check` | fx-release (checklist records per row) | E-W | C002-T-047 |
| C002-TC-634 | C002-TS-634 | eval | `evals/targets/gate/TS-634.eval.mjs` | `run.mjs --host opencode` | fx-gate | E-OCE | C002-T-044, C002-T-056 |
| C002-TC-635 | C002-TS-635 | eval | `evals/targets/gate/TS-635.eval.mjs` | `run.mjs --host opencode` | fx-gate (00-ideation approved) | E-OCE | C002-T-044, C002-T-056 |
| C002-TC-636 | C002-TS-636 | integration | `tests/guards/writing-commands.test.ts` | `npm test -- tests/guards` | corpora | E-W | C002-T-009, C002-T-059, C002-T-058 |
| C002-TC-637 | C002-TS-637 | integration | `tests/integration/cap06/release-check.test.ts` | `npm test -- cap06/release-check` | fx-release with incomplete replay reports | E-W | C002-T-047 |
| C002-TC-638 | C002-TS-638 | replay | `tests/replay/scenarios/suite.test.ts` | `npm run replay -- suite` | corpora (memory cases) | E-OC | C002-T-040 |
| C002-TC-643 | C002-TS-643 | replay | `tests/replay/scenarios/suite.test.ts` | `npm run replay -- suite` | corpora (absent-field cases) | E-OC | C002-T-040 |
| C002-TC-644 | C002-TS-644 | replay | `tests/replay/scenarios/suite.test.ts` | `npm run replay -- suite` | corpora (cases with own `cwd`) | E-OC | C002-T-040 |
| C002-TC-645 | C002-TS-645 | replay | `tests/replay/scenarios/suite.test.ts` | `npm run replay -- suite` | corpus fixture | E-OC | C002-T-040 |
| C002-TC-646 | C002-TS-646 | replay | `tests/replay/scenarios/opencode-host.test.ts` | `npm run replay -- opencode-host` | fx-oc | E-OC | C002-T-042 |
| C002-TC-647 | C002-TS-647 | replay | `tests/replay/scenarios/opencode-host.test.ts` | `npm run replay -- opencode-host` | fx-oc | E-OC | C002-T-042 |
| C002-TC-648 | C002-TS-648 | integration | `tests/integration/cap06/release-check.test.ts` | `npm test -- cap06/release-check` | fx-release (S-07 record per row) | E-W | C002-T-047, C002-T-001 |
| C002-TC-649 | C002-TS-649 | replay | `tests/replay/scenarios/suite.test.ts` | `npm run replay -- suite` | corpora (PG-163) | E-OC with `file-symlink` (Developer Mode on) | C002-T-040, C002-T-007 |
| C002-TC-650 | C002-TS-650 | replay | `tests/replay/scenarios/suite.test.ts` | `npm run replay -- suite` | corpora (PG-163), capability probe stubbed to absent | E-OC | C002-T-040 |
| C002-TC-651 | C002-TS-651 | integration | `tests/integration/cap06/release-check.test.ts` | `npm test -- cap06/release-check` | fx-release (host capabilities per row) | E-W | C002-T-047 |
| C002-TC-652 | C002-TS-652 | replay | `tests/replay/scenarios/opencode-host.test.ts` | `npm run replay -- opencode-host` | fx-oc (identity cases) | E-OC | C002-T-042 |
| C002-TC-901 | C002-TS-618 | manual | `docs/checklists/vscode-copilot.md`, record under `docs/checklists/records/` | P-01 runs every checklist step, including C002-TC-216, 218, 220, 309, 313, 317, 318, 319, 321, 329, 335, 358, 508 and 516 and the assumption steps of C002-T-046 (the MCP roots step of C002-IF-002 §3 included) (C002-TC-313 and 335 not applicable under `sdd-mcp-server`) | toy (fresh install through `sdd install copilot`) | E-VSC | C002-T-050 |
| C002-TC-902 | C002-TS-205 | manual | `docs/releases/clean-profile-runs.md` | P-01 timed run on a clean Windows profile, OpenCode toy change to G1 | fresh Windows user profile, `dist/architect-opencode-<version>.zip` and its `INSTALL.md` | REF-WIN, OpenCode tested version | C002-T-051 |
| C002-TC-903 | C002-TS-306 | manual | `docs/releases/clean-profile-runs.md` | P-01 timed run on a clean Windows profile to the first interview question | fresh Windows user profile, `dist/architect-copilot-<version>.zip` and its `INSTALL.md` | E-VSC | C002-T-057 |

### 8.1 Cases re-levelled in the S-07 infeasible-driver branch

When the S-07 record shows that the stub-model driver of C002-ADR-005 is infeasible
(`10-strategy.md` §4), the fallback adapter evaluates OpenCode's permission rules without a session.
The four replay cases below need an agent to issue a call in a running session. They become eval
cases on the real provider, run by C002-T-056 step 4 within the general pool (§4.2, 4 sessions). Their
Given, When and Then are unchanged. The assertions read the transcript, the tool list and the files,
never the model's free text alone. C002-T-030 or C002-T-026 lists them as carried to C002-T-056, and
C002-T-056 writes their case files from the expectations already in `opencode-host.test.ts`.

| TC | Level in the branch | Location | Command | Fixture | Environment | Task | Condition |
|---|---|---|---|---|---|---|---|
| C002-TC-133 | eval | `evals/targets/opencode-host/TS-133.eval.mjs` | `run.mjs --host opencode --filter evals/targets/opencode-host` | fx-oc with `fx-fs`; the prompt asks `sdd-spec-writer` to use a `fx-fs` tool | E-OCE | C002-T-056 | always in the branch; passes when the session's tool list for `sdd-spec-writer` has no `fx-fs` tool and the transcript shows no `fx-fs` call |
| C002-TC-211 | eval | `evals/targets/opencode-host/TS-211.eval.mjs` | as above | fx-oc with `my-build`; the prompt asks `my-build` to edit `src/app.ts` | E-OCE | C002-T-056 | always in the branch |
| C002-TC-222 | eval | `evals/targets/opencode-host/TS-222.eval.mjs` | as above | fx-oc (quick-lint plugin); the prompt asks `sdd-spec-writer` to write the two-SHALL requirement | E-OCE | C002-T-056 | only with `post_write_feedback_channel: true`; else not applicable (`10-strategy.md` §4) |
| C002-TC-223 | eval | `evals/targets/opencode-host/TS-223.eval.mjs` | as above | fx-oc (quick-lint plugin); the prompt asks for a clean requirements file | E-OCE | C002-T-056 | as C002-TC-222 |

If a real-model session cannot make the agent issue the scenario's call (the transcript shows no such
call in the run and its one rerun), the case does not pass. The implementer raises the spec defect
that `10-strategy.md` §4 names for it instead of asserting something else.
