---
id: C002-PLAN-STRATEGY
artifact: plan/strategy
change: CHG-002
phase: 20-plan
status: draft
---

# CHG-002 — Strategy

## 1. Approach

CHG-002 is built **from the evidence outwards**. The two spikes come first, then the shared code
that every host runs, then the packages, and the release evidence last:

1. **Spikes first.** S-07 (OpenCode, C002-T-001) and S-08 (Copilot in VS Code, C002-T-002) write the
   spike records of C002-IF-009 §3. These records set the enforcement mode of each target, the tested
   host versions, the model identifiers and the Serena context that the mapping tables
   (C002-COMP-002) hold. They also decide the Copilot defer branch of `../10-spec/10-context/scope.md`
   §1.1. No task that reads a mapping-table value starts before both records exist. S-08 is done
   (C002-T-002, signed off 2026-10-17, `sdd-mcp-server`); its facts F-1 … F-7 were taken into the spec
   by the revision for defect D-003, and this plan follows that revision (§4).
2. **Shared code that needs no host.** The bash guard and CLI deltas (C002-COMP-012, C002-COMP-018)
   change what Claude Code runs today. Each guard rule gets its corpus cases first (C002-REQ-607),
   one rule per task, because `src/hooks/guard-bash.ts` is the costliest file to break
   (`30-impact/hotspots.md` §3 item 1). This work does not depend on a spike outcome, so it runs in
   parallel with M-01.
3. **The sdd MCP server and `architect-sdd`.** These form the host-independent enforcement mechanism
   (C002-COMP-005, C002-COMP-006). The Copilot server mode needs them in every case, and the OpenCode
   target needs them as its fallback. They are tested from the packed tarball, without a host.
4. **The generator and the two target packages** (C002-COMP-001 … C002-COMP-004, C002-COMP-007).
   The generator reads the mapping tables filled from the spike records.
5. **The workflow on every host**: the question-tool variants of the conductor and the doctor's host
   rows (C002-COMP-014 … C002-COMP-016).
6. **Verification tooling**: corpus replay, the eval runners, the manual VS Code checklist and the
   release check (C002-COMP-008 … C002-COMP-011).
7. **Release evidence and release.** These runs happen on the tested host versions. P-01 publishes
   `architect-sdd` before or together with each target release (C002-ADR-004; C002-REQ-509 requires the exact
   version).

## 2. Sequencing rationale

| Decision | Reason | Source |
|---|---|---|
| Spikes S-07 and S-08 before any mapping-table value | Their records set the enforcement mode, tested versions, model identifiers, Serena context and `cmd_shims`, which the generator, the doctor and the release check read | scope §1 and §1.1; C002-IF-009 §3; architecture §6.2 |
| npm account and name check with the spikes | C002-REQ-502 fixes the unscoped name `architect-sdd`. A taken name is a spec defect, and it is cheapest to find before staging exists | C002-ADR-004 (manual publication by P-01) |
| Guard and CLI deltas in parallel with the spikes | They are host-independent and change Claude Code behaviour. They must be green before any generated host uses the same cores (C002-CON-06) | `30-impact/blast-radius.md` BR-1 … BR-8 |
| One guard rule per task, corpus cases first | `guard-bash.ts` is the only barrier on Claude Code and carries open defect D-011. The `sdd install` deny (C002-T-059) is its own task after C002-T-010, and lands before the MCP command tool (C002-T-019) and the Copilot hook adapter (C002-T-032) reuse the core | `30-impact/hotspots.md` §3 items 1 and 3 |
| Install command after the package emitters | `sdd install copilot` copies the agents and `install/mcp.json` of C002-T-031 and the hook template of C002-T-033 (C002-IF-005 §3), so C002-T-058 follows both; the Copilot CLI runner, the checklist and the clean-profile run need it (C002-T-045, C002-T-046, C002-T-057) | C002-IF-007 §Install; C002-REQ-612 |
| Shared repository-root helper before the Serena and `--cwd` rules | The guard (C002-IF-008 §1.1) and ERR-CLI-020 (C002-REQ-516) need the same root rule. Two copies would drift | blast-radius §3.1 item 2, §5 question 2 |
| One source for the writing-command table | The CLI's `COMMANDS` rows, the guard and C002-IF-008 §1.2 would otherwise hold three lists | blast-radius §5 question 1; hotspots §3 item 4 |
| `targets/` filter in the Claude Code staging before `targets/` exists | Otherwise the first mapping table ships in the Claude Code zips | blast-radius BR-10; C002-CON-10 |
| MCP server before the generator | The server is the fallback of both targets and the mode of Copilot. Its tests need no host, so its risk retires early | C002-DEC-001; C002-ADR-001 |
| Replay suite before the final S-07 replay | The S-07 outcomes `edit_rules_match_path_corpus` and `bash_rules_match_shell_corpus` are the corpus replay of the generated rules (C002-IF-009 §3). S-07 records provisional values from a sample in M-01; C002-T-043 records the final values | C002-IF-009 §3; architecture §6.2 (OpenCode `bash` rules) |
| Replay in its own command | The OpenCode replay starts a loopback stub (C002-ADR-005), and `tests/no-network.mjs` fails any test that opens a socket | regression-set §4.3 |
| Waiver-aware lint loop before anything else | `frontend.test.ts` lints every change whose current phase is approved and fails on the 9 waived LINT-DELTA-001 findings once CHG-002 has an approved current phase; `npm run check` must be green for every task report. The conductor fixes it before G3; C002-T-053 verifies it | C002-DEC-008; regression-set §4.2; critic CR-10 |
| Paid evals only at named task steps, each case once per owning step | Every paid session has an owning task step (§3a). Claude Code sessions run with `--auth subscription` on P-01's Claude Max plan (C002-T-060, P-01 2026-10-18) and are outside every USD budget; the S-07 probes and the OpenCode sessions use the Claude models of the C002-REQ-105 tiers through OpenRouter and bill P-01's OpenRouter account: CHG-002 eval budget 40 USD of OpenRouter spend, at which the runs stop and P-01 is asked, in a 30 USD general pool and a ring-fenced 10 USD reserve for the C002-M-07 release evidence, each with its own stop (Q-evalbudget-03, Q-evalbudget-04, Q-opencode-01); the prepaid Anthropic API key is no longer used, except for a Claude Code session that P-01 decides to run with `--auth api-key`; before the first paid OpenCode session P-01's OpenRouter account has credit and OpenCode is configured to use it (C002-T-001 step 1); the ledger records each session's `provider` and `auth` and is checked before every OpenRouter session by the stop rule of test plan §4.1 | `questions-log.md` rounds 4, 6 and 8; test plan §4 |
| Eval auth switch first | C002-T-060 (done in commits 98e6353 and 6de8656) precedes every task with a paid Claude Code step (C002-T-010, C002-T-037, C002-T-038, C002-T-048), so none of them bills the key by default | test plan §4.1 "Eval auth" |
| Subagent guard inside the existing Copilot tasks | The Copilot subagent guard hook (C002-REQ-327 … C002-REQ-330) is the same hook command, hook template and install as the guard of the hooks fallback, so it is folded into C002-T-032 (rules, now L), C002-T-033 (entry and classes in both modes) and C002-T-058 (workspace hook file before the agents), not split into a new task that would edit the same files; its evidence joins the checklist (C002-T-046, C002-T-050) and the Copilot CLI injection run (C002-T-045, C002-T-054) | C002-IF-008 §2; C002-IF-007 §Install; critic CR-24 |
| Release evidence and release per target | The two targets are decided independently (`75-rollout.md` §1): a Copilot task that slips must not hold back the OpenCode release. C002-T-049 and C002-T-052 serve OpenCode; C002-T-054, C002-T-057 and C002-T-055 serve Copilot. Shared tooling (C002-T-041, C002-T-045, C002-T-046, C002-T-047) and the Claude Code regression run (C002-T-048) stay common | critic CR-9 |

## 3. Milestones

| ID | Name | Goal | Exit criterion | Tasks |
|---|---|---|---|---|
| C002-M-01 | Spikes and P-01 prerequisites (P-01, 2026-10-16: C002-T-002 runs first; OpenCode through OpenRouter settled by Q-opencode-01, `questions-log.md` round 6) | The host facts that decide the enforcement modes, and the npm name, are known before any design-dependent task | P-01's OpenRouter account has credit and OpenCode is configured to use it (C002-T-001 step 1), and P-01 has named the Copilot subscription (C002-T-002); S-07 records the OpenRouter model id of each C002-REQ-105 tier; `docs/spikes/S-07-opencode.md` and `docs/spikes/S-08-copilot-vscode.md` hold the frontmatter of C002-IF-009 §3 and P-01's sign-off; S-07 records whether the stub-model driver of C002-ADR-005 is feasible; every outcome that contradicts the spec is raised as a defect and triaged (§4); P-01 has confirmed the npm account and that the name `architect-sdd` is available; the eval auth switch passes its unit tests and the subscription smoke (C002-T-060) | C002-T-001, C002-T-002, C002-T-003, C002-T-060 |
| C002-M-02 | Shared guard and CLI deltas | Claude Code runs the new allowlist, the Serena and `--cwd` confinement and the new CLI commands with no other change in behaviour | `npm test` green, including the regression set of `30-impact/regression-set.md` §3 and the waiver-aware lint loop (C002-T-053); `npm run bench` guard p95 ≤ 300 ms; defect D-011 of CHG-001 closed; `npm run package` produces Claude Code zips without `targets/`; the 5 E-CC sessions of C002-T-010 step 5 pass; the `sdd install` deny cases pass (C002-T-059) | C002-T-004 … C002-T-015, C002-T-053, C002-T-059 |
| C002-M-03 | sdd MCP server and `architect-sdd` | A packed `architect-sdd` tarball provides `sdd` and `sdd-mcp`, tested without a host | Every C002-CAP-04 scenario passes against the packed tarball; the install smoke test passes in the 4 shell and Node.js combinations; the licence check covers both bundles; the MCP benchmarks meet C002-NFR-101 and C002-NFR-102 | C002-T-016 … C002-T-023 |
| C002-M-04 | Target generator and packages | One `npm run package` writes both target packages and their zips from the source plugin, `npm run check` checks them, and `sdd install copilot` installs the Copilot package into a repository | Every untagged and `@mode-*` scenario of C002-CAP-01, C002-CAP-02 (package layout and rules) and C002-CAP-03 (package, hooks and install command) passes; `npm run package` writes `dist/architect-opencode-<version>.zip` and `dist/architect-copilot-<version>.zip` matching their folders (Q-release-01); `npm run check` green with the target structure step; determinism and generation benchmark recorded | C002-T-024 … C002-T-036, C002-T-058 |
| C002-M-05 | Workflow on every host | Interviews, gates and the doctor behave per host through wiring variants, with the Claude Code text unchanged | Generated agents and commands carry the question-tool and doctor variants of both targets; the integration scenarios of C002-CAP-05 doctor rows pass; the README sections exist; the 10 E-CC sessions pass: the Claude Code rows of C002-TC-215, 217 and 219 (C002-T-037 step 4) and of C002-TC-506, 509, 510 and 511 plus the doctor eval of regression-set §5 row 1 (C002-T-038 step 4) | C002-T-037 … C002-T-039 |
| C002-M-06 | Verification tooling | Replay, evals, checklist and release check exist and are tested on stub hosts; the carried host evals have run | The replay suite writes schema-valid reports for every mechanism in use; both eval runners pass their stub-host tests (caps); the carried OpenCode eval rows pass on E-OCE (C002-T-056) and the carried Copilot CLI rows on E-CPC (C002-T-045 step 5); the checklist and its record template exist; the release-check tests (C002-TS-620 … C002-TS-625, C002-TS-633, C002-TS-648, C002-TS-651) pass; the S-07 record holds its final replay outcomes and mode | C002-T-040 … C002-T-047, C002-T-056 |
| C002-M-07 | Release evidence and release | Each generated target released on evidence taken at its tested versions, independently of the other target | The regression set passes at the release-candidate commit (C002-T-048, C002-DOD-022); per target: replay and injection evidence recorded (C002-DOD-008, C002-DOD-009; C002-T-049 OpenCode, C002-T-054 Copilot), timed clean-profile run (C002-DOD-019; C002-T-051 OpenCode with the toy change to G1 of C002-DOD-021, C002-T-057 Copilot), checklist record for Copilot (C002-DOD-004, C002-T-050); `architect-sdd` published by P-01 before or with the first target release; a release record and a released zip per released target (C002-T-052 OpenCode, C002-T-055 Copilot) | C002-T-048 … C002-T-052, C002-T-054, C002-T-055, C002-T-057 |

## 3a. Paid eval sessions and their owning steps

Every paid session belongs to one task step. Session counts and rates are those of test plan §4.2;
the stop rule and the C002-M-07 reserve are those of test plan §4.1 (40 USD of OpenRouter spend,
Q-evalbudget-03, Q-opencode-01). Before every paid OpenRouter session the runner checks the ledger
`evals/results/spend-chg002.json`; after every paid session, the session is added with its
`provider`, `auth` and `cost_usd`. "OpenRouter" means P-01's OpenRouter account, used by OpenCode with
the Claude models of the C002-REQ-105 tiers. "Claude subscription" means `--auth subscription` on
P-01's Claude Max plan (C002-T-060); a Claude Code session runs with `--auth api-key` only when P-01
decides it, bills the prepaid Anthropic API key and draws on no OpenRouter pool.

| Group | Milestone row of test plan §4.2 | Billed to | Owning task and step |
|---|---|---|---|
| P-01 check before any paid OpenCode session: OpenRouter credit, OpenCode configured for it | — | OpenRouter | C002-T-001 step 1 (P-01) |
| S-07 probes | spikes | OpenRouter, general pool | C002-T-001 step 2 (probe spend limit) and steps 3 … 7 |
| S-08 probes | spikes | Copilot subscription | C002-T-002 steps 2 … 6 |
| The 3 cases of regression-set §5 row 1 and the 2 rows of C002-TC-537 | guard and CLI deltas | Claude subscription | C002-T-010 step 5 |
| Claude Code rows of C002-TC-215, 217, 219 | workflow on every host (part) | Claude subscription | C002-T-037 step 4 |
| Claude Code rows of C002-TC-506, 509, 510, 511 and the doctor eval of regression-set §5 row 1 | workflow on every host (rest) | Claude subscription | C002-T-038 step 4 |
| OpenCode runner smoke | verification tooling (part) | OpenRouter, general pool | C002-T-044 step 6 |
| Carried OpenCode rows: C002-TC-113, 132, the OpenCode rows of 215, 217, 219, 221, 316, 506, 507, 509 … 515, 639, and C002-TC-613 with the C001-CAP-02 interview and gate cases, 634, 635 | verification tooling (rest) | OpenRouter, general pool | C002-T-056 steps 2 and 3 (step 4 only under the infeasible-driver branch) |
| Copilot CLI runner smoke and carried Copilot CLI rows (Copilot rows of C002-TC-513, C002-TC-526) | verification tooling, Copilot column | Copilot subscription | C002-T-045 steps 4 and 5 |
| OpenCode release evidence: C002-TC-612 routing and at least 20 injection cases | release evidence, reserve | OpenRouter, reserve | C002-T-049 step 3 |
| Claude Code regression run | release evidence | Claude subscription | C002-T-048 step 4 |
| P-01's OpenCode toy change to G1 (C002-TC-902, C002-DOD-021) | release evidence, reserve | OpenRouter, reserve (Q-evalbudget-04) | C002-T-051 step 3 (P-01) |
| Re-runs of C002-T-049 step 3 rows after a fix moved the release-candidate commit | release evidence, re-runs | OpenRouter, general pool | C002-T-049 step 4 |
| Copilot release evidence: C002-TC-615 and C002-TC-359 | release evidence, Copilot column | Copilot subscription | C002-T-054 step 3 |
| VS Code checklist runs, including the Copilot toy change to G1 and the delegated edit of C002-TC-358 | release evidence, Copilot column | Copilot subscription | C002-T-050 steps 2 and 3 (P-01) |
| Copilot clean-profile run to the first question | release evidence, Copilot column | Copilot subscription | C002-T-057 step 2 (P-01) |

The OpenRouter reserve for the release evidence is spent only by C002-T-049 step 3 and C002-T-051
step 3. Every other OpenRouter session, including a re-run of C002-T-049 after a fix, draws on the
general pool. Each pool stops on its own limit (test plan §4.1), so a session of one pool never spends
the other pool's room; at a stop, P-01 is asked and decides.

## 4. Spike outcome handling

Each spike record ends with an enforcement mode, as C002-IF-009 §3 defines it. An outcome that
contradicts the approved spec is reported as a **spec defect** (`sdd defect add --ref <ID>`) and
leads to `/architect:revise spec` with P-01. The affected tasks are revised after the new G2
approval. Contingencies the spec already fixes:

**S-08 outcome (recorded).** C002-T-002 is done. The record `docs/spikes/S-08-copilot-vscode.md`,
signed off by P-01 on 2026-10-17, gives `enforcement_mode: sdd-mcp-server`
(`subagent_tool_list_confined: true`, `copilot_cli_loads_package: true`, `terminal_dialect:
powershell`, `cmd_shims: []`) on the tested hosts of scope §3.1: VS Code Insiders 1.142.0-insider in
the Local session type, and Copilot CLI 1.0.98. Its facts F-1 … F-7 (§5) contradicted the approved
spec; defect D-003 revised it (workspace agents and `.vscode/mcp.json` written by `sdd install
copilot`, the Copilot guard hook keyed by `agent_type`, `ask_user`, `<server>-<tool>` and
`<plugin>:<agent>` names, no root token in hook commands). The plan follows that revision:
C002-T-058 and C002-T-059 are added; C002-T-024, C002-T-027, C002-T-031 … C002-T-033, C002-T-035,
C002-T-045 … C002-T-047, C002-T-050 and C002-T-054 … C002-T-057 are revised. After the critic's D-003
review the spec added the Copilot subagent guard hook in both modes (C002-REQ-327 … C002-REQ-330,
Q-safety-06), its workspace hook file and the `install/plugin.json` gating; the plan folds them into
C002-T-031 … C002-T-033, C002-T-035, C002-T-038, C002-T-045 … C002-T-047, C002-T-050, C002-T-054 and
C002-T-058 (§2). The three S-08 branches below are therefore **not taken**. Each would come back only with a later spike record for a new
tested version (C002-REQ-621), through a spec revision and a plan revision, not by this table alone:

| Spike outcome | Effect on the plan |
|---|---|
| S-08 `enforcement_mode: deferred` (subagents not confined, and Copilot guard hooks do not block) | Not taken (record: `sdd-mcp-server`). For a later record: spec revision of scope §1.1 (Q-defer-01); the plan would drop the Copilot tasks (C002-T-031 … C002-T-033, C002-T-045, C002-T-046, C002-T-050, C002-T-054, C002-T-055, C002-T-057, C002-T-058) and the Copilot parts of the shared ones, as `75-rollout.md` §5 lists; OpenCode still ships through C002-T-049, C002-T-051 and C002-T-052 |
| S-08 `copilot-hooks` (subagents not confined, guard hooks block) | Not taken. The fallback stays generated and tested in both modes (`@mode-hooks` integration and structure cases of C002-T-031 … C002-T-033, C002-T-035), so its code exists; its replay, eval and manual cases (C002-TC-313, 335, 336, the `copilot-hooks` replay) are reported not applicable with the record cited |
| S-08 `copilot_cli_loads_package: false` | Not taken (record: `true`, S-08 §2). The Copilot injection, routing, server guard and non-interactive cases of C002-TC-615 and the Copilot CLI rows of C002-TC-513 and C002-TC-526 run on the Copilot CLI eval runner (C002-T-045, C002-T-054) |

**Open assumptions the spec leaves to the plan** (marked `ASSUMPTION: S-08` in the spec), each with
the task that settles it; a refuted assumption is a spec defect:

| Assumption | Where in the spec | Settled by |
|---|---|---|
| Workspace and plugin agents of the same names coexist: the workspace `sdd-conductor` starts the workspace specialists and the prompt files bind to it (else agents move to `install/agents/`) | C002-IF-005 §3 | fresh-install steps of the checklist, C002-T-046 and C002-T-050 |
| A workspace agent with `user-invocable: false` is still started as a subagent | C002-IF-005 §3 | same steps, C002-T-050 |
| `ask_user`: its `tools` grant name, input shape and result without a choice; whether it needs `chat.askQuestions.enabled` | C002-IF-001 §6.1, C002-REQ-304, C002-REQ-311 | interview and gate steps, C002-T-050 (C002-TC-317, 318, 319) |
| Prompt file names and slash commands (no collision with a VS Code built-in) | C002-REQ-317 | C002-TC-329 in C002-T-050 |
| Copilot CLI per-session MCP option (`--additional-mcp-config`, else `mcp-config.json` of the Copilot home; no servers file when CLI starts `.vscode/mcp.json`) | C002-IF-010 §1 | C002-T-045 step 1 |
| `copilot-chat` 0.35.3 is the Copilot Chat of the tested Insiders build | C002-IF-009 §3 | settled: P-01 confirmed it (Q-versions-02, `questions-log.md` round 7); C002-T-024 step 3 writes it |
| Serena `--context` for Copilot VS Code (not in the record) | C002-IF-001 §6.2, C002-REQ-301 | settled by P-01's answer to Q-serena-ctx-01 (`questions-log.md` round 7): C002-T-024 step 4 takes it from Serena's context list at the tested Serena version and records it; the checklist confirms Serena starts (C002-T-050) |
| VS Code offers its workspace folders as MCP roots, first folder first, so a write lands in the open repository's `.sdd/` | C002-IF-002 §3 | roots step of the checklist, which names the expected `.sdd/` path (C002-T-046, C002-T-050; critic CR-26) |
| VS Code adds no agent, prompt file or skill from a registered package folder without `plugin.json` (else agents and prompts move under `install/`) | C002-IF-005 §3 | fresh-install step before the install, C002-T-046 and C002-T-050 |
| VS Code and Copilot CLI load `.github/hooks/architect-guard.json` with the input of plugin-level hooks, `agent_type` included | C002-IF-005 §3 | VS Code: delegated-edit step with the plugin part disabled (C002-T-046, C002-T-050); Copilot CLI: C002-T-045 step 1 |
| The host offers its built-in agents to the workspace conductor, and their tool calls carry `agent_type` (else Q-safety-06 returns to P-01) | C002-IF-005 §3, C002-REQ-327 | delegated-edit step, C002-TC-358 (C002-T-050); Copilot CLI injection case C002-TC-359 (C002-T-054) |

**S-07 outcomes** (C002-T-001 not run yet):

| Spike outcome | Effect on the plan |
|---|---|
| S-07 `agent_tools_closed: false` | Spec revision with P-01, as for a deferred S-08 record (C002-IF-009 §3). The release check refuses the OpenCode target (ERR-REL-013) until the revision |
| S-07 stub-model driver infeasible (also when the loopback replay of C002-ADR-005 needs the OpenRouter provider, an OpenRouter key or any network access, C002-T-001 step 5) | A new ADR supersedes C002-ADR-005 with P-01's answer to Q-replay-01 (`questions-log.md` round 1). (1) C002-T-042 builds the fallback replay adapter, which evaluates OpenCode's permission module from its source at the tested tag; the permission-decision scenarios (C002-TC-207, 209, 213, 630, 646, 647, 652) and the corpus replay run through it. (2) C002-T-042 still delivers the session driver `evals/harness/opencode/driver.mjs` against the real provider, which C002-T-044 builds on in either branch (C002-T-001 step 5 records that this works); C002-TC-226 reads the command list through the server API with that driver and needs no model call. (3) The scenarios in which an agent must issue a call in a running session — C002-TC-133 (adopter MCP tool), C002-TC-211 (edit applied for `my-build`), C002-TC-222 and C002-TC-223 (post-write feedback) — move to the OpenCode eval runner as real-model eval cases on E-OCE (OpenRouter), run by C002-T-056 within the OpenRouter general pool (about 4 more sessions; the test-designer re-levels them). If a real-model session cannot make the agent issue the scenario's call reliably, the implementer raises a spec defect against the scenario's requirement (C002-REQ-113 for C002-TS-133, C002-REQ-210 for C002-TS-211, C002-REQ-215 for C002-TS-222 and C002-TS-223) instead of passing it another way |
| S-07 `question_answerable_by_script: false` | The OpenCode rows of every scripted-answer case cannot run as specified (C002-REQ-610). C002-T-001 step 6 raises a spec defect against C002-REQ-610 that lists them: the OpenCode rows of C002-TC-215, 217, 219, and C002-TC-221, 316, 613, 634, 635. Until the revision, C002-T-037 still writes their case files, C002-T-056 skips them and reports them not applicable with the S-07 record cited, and the release check reads the revision's outcome. The Claude Code rows of C002-TC-215, 217 and 219 are unaffected (the Claude Code harness answers through the SDK) |
| S-07 `post_write_feedback_channel: false` | No quick-lint plugin in the OpenCode package (scope §2); C002-T-030 skips that step; C002-TC-222 and C002-TC-223 are not applicable (test plan §1) |
| Final S-07 replay (C002-T-043) finds a guard rule that a permission glob cannot follow | The OpenCode table selects `sdd-mcp-server` (architecture §6.2; Q-safety-03) |

## 5. Ways of working for implementers

- Read `handoff.md` first, then the task file, then the REQ, AC and TS IDs it lists, and the ADRs of
  `20-decisions/`.
- Write tests first: the scenarios in `verified_by` become test cases (`60-test-plan.md`) before the
  implementation.
- Leave the Claude Code text of agents, commands and `SKILL.md` files unchanged (C002-CON-10). Any
  edit there re-opens the Claude Code evals of regression-set §5.
- Run `npm test -- tests/guards` and `npm run bench` after each guard task. Run `npm run check`
  before reporting any task done.
- Report with `sdd task set <T-ID> --status … --commit <sha>`. Raise a spec defect instead of
  working around a requirement.
- Commit per task. Never push.
