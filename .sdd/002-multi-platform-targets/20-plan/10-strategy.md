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
   §1.1. No task that reads a mapping-table value starts before both records exist.
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
| One guard rule per task, corpus cases first | `guard-bash.ts` is the only barrier on Claude Code and carries open defect D-011 | `30-impact/hotspots.md` §3 items 1 and 3 |
| Shared repository-root helper before the Serena and `--cwd` rules | The guard (C002-IF-008 §1.1) and ERR-CLI-020 (C002-REQ-516) need the same root rule. Two copies would drift | blast-radius §3.1 item 2, §5 question 2 |
| One source for the writing-command table | The CLI's `COMMANDS` rows, the guard and C002-IF-008 §1.2 would otherwise hold three lists | blast-radius §5 question 1; hotspots §3 item 4 |
| `targets/` filter in the Claude Code staging before `targets/` exists | Otherwise the first mapping table ships in the Claude Code zips | blast-radius BR-10; C002-CON-10 |
| MCP server before the generator | The server is the fallback of both targets and the mode of Copilot. Its tests need no host, so its risk retires early | C002-DEC-001; C002-ADR-001 |
| Replay suite before the final S-07 replay | The S-07 outcomes `edit_rules_match_path_corpus` and `bash_rules_match_shell_corpus` are the corpus replay of the generated rules (C002-IF-009 §3). S-07 records provisional values from a sample in M-01; C002-T-043 records the final values | C002-IF-009 §3; architecture §6.2 (OpenCode `bash` rules) |
| Replay in its own command | The OpenCode replay starts a loopback stub (C002-ADR-005), and `tests/no-network.mjs` fails any test that opens a socket | regression-set §4.3 |
| Paid evals once per milestone, not per task | API-key budget: $0.50 per run, stop and discuss at $10 spent | regression-set §1, §5 |

## 3. Milestones

| ID | Name | Goal | Exit criterion | Tasks |
|---|---|---|---|---|
| C002-M-01 | Spikes and P-01 prerequisites | The host facts that decide the enforcement modes, and the npm name, are known before any design-dependent task | `docs/spikes/S-07-opencode.md` and `docs/spikes/S-08-copilot-vscode.md` hold the frontmatter of C002-IF-009 §3 and P-01's sign-off; S-07 records whether the stub-model driver of C002-ADR-005 is feasible; every outcome that contradicts the spec is raised as a defect and triaged (§4); P-01 has confirmed the npm account and that the name `architect-sdd` is available | C002-T-001, C002-T-002, C002-T-003 |
| C002-M-02 | Shared guard and CLI deltas | Claude Code runs the new allowlist, the Serena and `--cwd` confinement and the new CLI commands with no other change in behaviour | `npm test` green, including the regression set of `30-impact/regression-set.md` §3; `npm run bench` guard p95 ≤ 300 ms; defect D-011 of CHG-001 closed; `npm run package` produces Claude Code zips without `targets/` | C002-T-004 … C002-T-015 |
| C002-M-03 | sdd MCP server and `architect-sdd` | A packed `architect-sdd` tarball provides `sdd` and `sdd-mcp`, tested without a host | Every C002-CAP-04 scenario passes against the packed tarball; the install smoke test passes in the 4 shell and Node.js combinations; the licence check covers both bundles; the MCP benchmarks meet C002-NFR-101 and C002-NFR-102 | C002-T-016 … C002-T-023 |
| C002-M-04 | Target generator and packages | One `npm run package` writes both target packages from the source plugin, and `npm run check` checks them | Every untagged and `@mode-*` scenario of C002-CAP-01, C002-CAP-02 (package layout and rules) and C002-CAP-03 (package and hooks) passes; `npm run check` green with the target structure step; determinism and generation benchmark recorded | C002-T-024 … C002-T-036 |
| C002-M-05 | Workflow on every host | Interviews, gates and the doctor behave per host through wiring variants, with the Claude Code text unchanged | Generated agents and commands carry the question-tool and doctor variants of both targets; the integration scenarios of C002-CAP-05 doctor rows pass; the README sections exist; the Claude Code doctor eval of regression-set §5 row 1 passes once | C002-T-037 … C002-T-039 |
| C002-M-06 | Verification tooling | Replay, evals, checklist and release check exist and are tested on stub hosts | The replay suite writes schema-valid reports for every mechanism in use; both eval runners pass their stub-host tests (caps); the checklist and its record template exist; the release-check tests (C002-TS-620 … C002-TS-625, C002-TS-633, C002-TS-648, C002-TS-651) pass; the S-07 record holds its final replay outcomes and mode | C002-T-040 … C002-T-047 |
| C002-M-07 | Release evidence and release | Each generated target released on evidence taken at its tested versions | The regression set passes (C002-DOD-022); replay and injection evidence recorded (C002-DOD-008, C002-DOD-009); checklist record (C002-DOD-004); timed clean-profile runs (C002-DOD-019, C002-DOD-021); `architect-sdd` published by P-01 before or with each target release; a release record per target under `docs/releases/` | C002-T-048 … C002-T-052 |

## 4. Spike outcome handling

Each spike record ends with an enforcement mode, as C002-IF-009 §3 defines it. An outcome that
contradicts the approved spec is reported as a **spec defect** (`sdd defect add --ref <ID>`) and
leads to `/architect:revise spec` with P-01. The affected tasks are revised after the new G2
approval. Contingencies the spec already fixes:

| Spike outcome | Effect on the plan |
|---|---|
| S-08 `enforcement_mode: deferred` (subagents not confined, and agent-scoped hooks do not block) | Spec revision of scope §1.1 (Q-defer-01): C002-CAP-03, C002-SC-02 and the Copilot DoD items are removed. The plan then drops C002-T-031, C002-T-032, C002-T-033, C002-T-045, C002-T-046 and C002-T-050, and removes the Copilot parts of C002-T-024, C002-T-034, C002-T-035, C002-T-039, C002-T-041, C002-T-047 and C002-T-052. OpenCode still ships |
| S-08 `copilot-hooks` (hooks block but subagents are not confined) | Copilot hooks fallback: C002-T-033 emits the agent-scoped hooks and the tool classes file; C002-T-046 adds the hooks steps; the release is flagged under the exception of C002-DEC-005 (C002-REQ-622) |
| S-08 `copilot_cli_loads_package: false` | Copilot injection cases move to the checklist (C002-REQ-613). C002-T-045 keeps the routing and server cases that Copilot CLI can run |
| S-07 `agent_tools_closed: false` | Spec revision with P-01, as for a deferred S-08 record (C002-IF-009 §3). The release check refuses the OpenCode target (ERR-REL-013) until the revision |
| S-07 stub-model driver infeasible | A new ADR supersedes C002-ADR-005 with P-01's answer to Q-replay-01: C002-T-042 evaluates OpenCode's permission module from its source at the tested tag (`questions-log.md` round 1) |
| S-07 `post_write_feedback_channel: false` | No quick-lint plugin in the OpenCode package (scope §2); C002-T-030 skips that step |
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
