---
id: C002-T-050
title: "P-01: run the manual VS Code checklist and record it"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-07
status: todo
depends_on: [C002-T-046, C002-T-054, C002-T-071]
implements: []
satisfies_ac: [C002-AC-327.1, C002-AC-510.1, C002-AC-614.1, C002-AC-615.1, C002-AC-616.1, C002-AC-618.1]
verified_by: [C002-TS-358, C002-TS-516, C002-TS-617, C002-TS-618, C002-TS-619, C002-TS-621, C002-TC-358, C002-TC-516, C002-TC-617, C002-TC-618, C002-TC-619, C002-TC-621, C002-TC-901]
components: [C002-COMP-011]
risk_refs: [C002-RISK-026, C002-RISK-030, C002-RISK-031, C002-RISK-032]
estimate: S
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-050 — P-01: run the manual VS Code checklist and record it

## Intent

**P-01 executes this task.** P-01 runs the checklist on the Copilot release candidate in VS Code
Insiders 1.142.0-insider with Copilot Chat 0.35.3 (Local session type; tested hosts of scope §3.1;
Q-versions-02), on a fresh install, with hooks enabled, and records the run (C002-DOD-004). This
covers C002-SC-02 (a toy change reaches G1) and the delegated edit of C002-TS-358: the Copilot
subagent guard hook denies the host built-in agent `general-purpose` an edit that a planted
instruction asked the conductor to delegate (C002-REQ-327). It settles the assumptions the spec
leaves to the checklist (assumption table of C002-T-046): workspace and plugin agents of the same
names, `user-invocable: false` subagents, no plugin before `plugin.json`, the workspace hook file,
built-in agents offered with `agent_type`, prompt-file binding and names, `ask_user` input shape,
no-choice result and setting, the MCP roots (C002-IF-002 §3) and the Serena context chosen by
C002-T-024. Under the signed-off S-08 record (`sdd-mcp-server`, `copilot_cli_loads_package: true`)
the injection cases run on Copilot CLI (C002-T-054), not here; they join this run only under the
hooks fallback with hooks enabled or when a later record shows that Copilot CLI cannot load the
package (C002-REQ-613). This task serves the Copilot release only (C002-T-055); the OpenCode release
does not wait for it.

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `docs/checklists/records/vscode-<YYYY-MM-DD>-<version>.md` | the checklist record |

## Preconditions

- C002-T-046 and C002-T-054 done; the release candidate packed at the commit of C002-T-054.
- C002-T-071 done (P-01 answer to Q-release-base-01; plan critic CR-71): the checklist runs on the
  Copilot package packed at the release-candidate commit that holds the CHG-001 fixes of C001-T-082
  and C001-T-083, which C002-T-071 records. That commit replaces the commit of C002-T-054 above.
- **Package version 0.0.2** (defect D-035; C002-T-073): `dist/architect-copilot-0.0.2.zip` and
  `dist/architect-sdd-0.0.2.tgz`, and the record `docs/checklists/records/vscode-<date>-0.0.2.md`
  with `package_version: 0.0.2`, as the runsheet `docs/runsheets/T-050-vscode-checklist.md` names
  them from C002-T-073 on.
- Hooks enabled in VS Code from the restore step of step 2 on (`chat.useHooks`, Workspace Trust for
  the toy repository, no organisation policy that disables them; the hooks-off rows of C002-TC-516
  run before the restore, C002-IF-009 §4 "Run order"): the release check refuses a record that shows hooks disabled or not
  recorded in either mode (C002-REQ-629, ERR-REL-010). The doctor's Copilot hooks row reads
  `chat.useHooks` only and shows `ok` with its caveat text (C002-IF-006 §2), so the checklist's
  hooks-state step is where P-01 reads Workspace Trust and the organisation policy.
- The Copilot subscription named in C002-T-002 has allowance for about 13 VS Code sessions per
  checklist run, about 26 with the repeat of step 3 (test plan §4.2, C002-RISK-026). These sessions
  are not billed to the prepaid API key.

## Step outline (no production code)

1. **P-01 step:** install the Copilot package from `dist/architect-copilot-<version>.zip` and
   `architect-sdd` from the local tarball on a fresh VS Code Insiders profile, following `INSTALL.md`
   only: unpack outside the toy repository, register the folder and check the picker before the
   install (no Architect entry, C002-T-046 assumption step), run `sdd install copilot --package
   <folder>` in P-01's own terminal, set the three settings, open a Local chat with `sdd-conductor`
   selected. In the fresh-install step and the toy-change steps after it, record `models_used`: the
   model ID VS Code showed for the turns of `sdd-conductor` (and of a specialist where P-01 reads
   it), or `not shown`, and whether VS Code showed it where the install notes say it does
   (C002-TS-617, C002-TS-618; C002-IF-009 §4 Models used). When VS Code shows the model in another place
   than the install notes name, or nowhere, the D-027 assumption of C002-IF-005 §5 Models is refuted:
   a spec defect (`sdd defect add --ref C002-IF-005`), not a failed step.
2. **P-01 step:** run the checklist steps of the mode in use in the run order of C002-IF-009 §4
   (C002-T-046 "Run order"), step 1's install being group 1, and record each result in run order:
   - group 2: the C002-TC-516 row with `chat.useHooks` false, then the row with the workspace in
     restricted mode, each with the doctor's Copilot hooks row as shown (status, Version text, Fix);
     when VS Code itself refuses the chat or the doctor prompt in restricted mode and no tool call of
     the package runs, that row is `passed` with `note: "VS Code refused: <text as VS Code showed
     it>"` (Q-checklist-restricted-01; C002-IF-009 §4 Run order); then the restore step
     (`chat.useHooks` true, workspace trusted);
   - group 3: the C002-TC-516 row with `chat.useHooks` true and the workspace trusted (`ok`, Version
     `chat.useHooks on; profile and .code-workspace settings, Workspace Trust and organisation policy
     not read, confirmed by the manual VS Code checklist`), then the hooks-state step with its three
     sources (`hooks_sources`: `use_hooks` as the Settings editor shows it for the active profile and
     workspace, `workspace_trust`, `policy`, and `hooks_state` derived from them, C002-IF-009 §4;
     C002-TS-618, C002-TS-619);
   - group 4: every other step, with the versions and the outcome of each assumption step: the
     `.sdd/` path the first write lands in (roots step), and in the delegated-edit step (C002-TC-358)
     whether the host offered `general-purpose` to the workspace conductor, the `agent_type` in the
     hook output, that `src/app.ts` is unchanged and the subagent guard hook's deny message
     (GUARD-HOOK-002, or GUARD-HOOK-001 for an unclassed edit tool); then the same step with the
     plugin part disabled.
   If a group-4 step ran before the hooks-state step, if `chat.useHooks`, Workspace Trust or an
   organisation policy changed after it, or if the hooks-state step read a source off and P-01 put
   it right, run a new restore step and then groups 3 and 4 again (the rerun rule). The record lists
   each step once, at the position of its last run with that run's result, and keeps every earlier
   run in the step's `earlier_results` with its `result` and the `cause` of the run that followed
   (`hooks-source-changed`, `ran-before-hooks-state` or `repeated`; C002-IF-009 §4 Earlier runs,
   Q-checklist-rerun-01); the restore step lists one earlier run per rerun.
3. A failed step reopens the owning task. An earlier `failed` run stays binding unless the rerun rule
   repeated the step, so after the fix the checklist runs again in full and is recorded under a later
   date (C002-REQ-618); repeating only the failed step (cause `repeated`) does not make the record
   releasable. A refuted assumption is a spec defect (`sdd defect add`), not a fix in place. In
   particular:
   - a built-in agent's calls without `agent_type`, or `general-purpose` not denied: defect against
     C002-REQ-327 (Q-safety-06 returns to P-01; C002-RISK-032);
   - the workspace hook file not loaded: defect against C002-IF-005 §3;
   - a write outside the open repository's `.sdd/`: defect against C002-IF-002 §3;
   - the same-name or no-`plugin.json` assumption refuted: the fallback layout of C002-IF-005 §3
     (agents under `install/agents/`), which then needs a plan revision of C002-T-031, C002-T-045 and
     C002-T-058.

## Verification

- `node scripts/release-check.mjs --target copilot --dry-run` reads the record without a checklist
  error (no ERR-REL-004 line from the step check of C002-IF-009 §5, no ERR-REL-009 `checklist` or
  `checklist record`) and with hooks enabled

## Done when

- [ ] Record committed in the format of C002-IF-009 §4: every step of the mode in use passed, each listed once at the position of its last run in the run order (the three C002-TC-516 rows with the restore between the hooks-off rows and the true-and-trusted row, no hook-decided step before the hooks-state step), the other mode's steps absent or `not-applicable`, earlier runs in `earlier_results` with their `cause` and none that the rerun rule does not excuse, a restricted-mode row that VS Code refused `passed` with its `VS Code refused: ` note, `hooks_state: enabled` with `hooks_sources` reading
      `on`, `trusted` and `none`, `models_used` with the key `sdd-conductor`, the assumption outcomes and P-01's name
- [ ] Progress reported: `sdd task set C002-T-050 --status done --commit <sha>`
