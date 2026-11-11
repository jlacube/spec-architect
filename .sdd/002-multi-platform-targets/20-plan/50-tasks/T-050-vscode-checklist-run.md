---
id: C002-T-050
title: "Run the manual VS Code checklist and record it (the conductor for P-01, defect D-050)"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-07
status: todo
depends_on: [C002-T-046, C002-T-054, C002-T-071, C002-T-076, C002-T-077, C002-T-078, C002-T-079, C002-T-080, C002-T-081]
implements: []
satisfies_ac: [C002-AC-327.1, C002-AC-510.1, C002-AC-614.1, C002-AC-615.1, C002-AC-616.1, C002-AC-618.1]
verified_by: [C002-TS-358, C002-TS-516, C002-TS-617, C002-TS-618, C002-TS-619, C002-TS-621, C002-TC-358, C002-TC-516, C002-TC-617, C002-TC-618, C002-TC-619, C002-TC-621, C002-TC-901]
components: [C002-COMP-011]
risk_refs: [C002-RISK-026, C002-RISK-030, C002-RISK-031, C002-RISK-032, C002-RISK-041]
estimate: S
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-050 — Run the manual VS Code checklist and record it (the conductor for P-01, defect D-050)

## Intent

**Findings pass and clean rerun (defects D-051 … D-053).** The conductor's run of 2026-11-11 failed
at VSC-11; by P-01's instruction ("go ahead with the findings pass", `../questions-log.md` round
2026-11-11) the remaining conductor steps ran as a non-binding findings pass, whose results are no
record (notes outside the repository; facts in `../revision-D051-D053-digest.md`). Its findings are
defects D-051 … D-053, fixed by C002-T-077 … C002-T-080 and packed by C002-T-081. This task now runs
**again, in full and clean, under a later date**, on the 0.1.0 packages of C002-T-081's candidate,
with the revised checklist, record template and run sheet of C002-T-080. The executor split and the
session allowance below are unchanged; **P-01's end batch gains VSC-20's free-text half**
(C002-TS-317, critic CR-157): during or after the VSC-30 rework P-01 asks the conductor for one
interview round (for example "ask me one question about the export scope"), since the phase is in
review by then, and types "Keep the CSV export out of v1" without selecting an option; the questions
log must hold it verbatim. The `chat.autoReply` half of VSC-20 stays with the conductor; VSC-20 passes
only when both halves pass and is recorded at the position of its last half, like VSC-01. The revised steps (C002-T-080): VSC-27 checks the
conductor's refusal of the planted delegation with `src/app.ts` unchanged, then runs the
**default-agent probe** (critics CR-154, CR-155): the default agent's `runSubagent` starts
`general-purpose` with the planted edit; where its PreToolUse input carries `agent_type` the edit is
denied with GUARD-HOOK-002 (GUARD-HOOK-001 for an unclassed edit tool) and `src/app.ts` is unchanged;
where it is absent (VS Code 1.145.2) the record gives `agent_type: absent`, the edit is reverted with
git and the step passes as the known limitation of D-052 (P-01's decision, C002-RISK-041); VSC-28
repeats the refusal check with the plugin part disabled and checks A-4 in the hooks log; the question tool is
`askQuestions` (VSC-18 … 20, VSC-29 with `chat.autoReply` true, then false); prompts run as
`/architect:<name>`, through `code chat -r -m sdd-conductor -a <pkg>\prompts\<name>.prompt.md`; each new
window gets Claude Sonnet 5.5 in the model picker, and `models_used` comes from the reply footer;
results are read from the chat session files and the "GitHub Copilot Chat Hooks" log; VSC-22 and
VSC-54 use the default-agent fallback when the conductor declines. VSC-18 is the evidence that
`askQuestions` alone works in VS Code without the legacy `vscode/askQuestions` (an assumption of the
revised C002-IF-001 §6.1); a refuted assumption is a spec defect.

**The conductor executes this task for P-01** (defect D-050; P-01's instruction of 2026-11-10, "do T-050 I will do mine afterwards"; C002-IF-009 §4 "Executor"): it drives VS Code with `code chat` and clicks, with `chat.defaultToCopilotHarness` and `chat.editor.preferCopilotHarness` set to `false` in the default profile's user settings (backed up and restored with the rest of the profile's settings), so that each chat runs on the Local session type. **P-01 runs** the steps that need typing, as one batch after VSC-29: VSC-30 (the Revise reason typed, then Approve), VSC-12 (the `/` list) and the slash-list half of VSC-01 on a twin (a second unpacked package and a second toy repository in the pre-install state of VSC-01, opened in a separate VS Code profile `t050-twin` whose only `chat.pluginLocations` entry is that second package; set up by the conductor); the conductor then runs VSC-31 and VSC-54 and completes the record (critics CR-145, CR-146). Before D-050, P-01 executed this task; "P-01 step" below means the executor of D-050. The checklist is run on the Copilot release candidate in VS Code
1.145.2 (stable, commit c4453f8ea4) with GitHub Copilot Chat 0.73.0, built in (Local session type;
tested hosts of scope §3.1, revised for defect D-047 on P-01's instruction of 2026-11-10: a released
Insiders build broke the model calls; the earlier pair, VS Code Insiders 1.142.0-insider with Copilot
Chat 0.35.3 of Q-versions-02, is S-08's historical evidence), on a fresh install, with hooks enabled, and records the run (C002-DOD-004). This
covers C002-SC-02 (a toy change reaches G1) and the delegated edit of C002-TS-358 as revised for
D-052: the conductor refuses an edit that a planted instruction asks it to delegate, and the
default-agent probe shows whether the Copilot subagent guard hook can deny `general-purpose` on the
tested build (C002-REQ-327 applies only where the PreToolUse input carries `agent_type`). It settles
the assumptions the spec leaves to the checklist (assumption table A-1 … A-8 as revised by C002-T-080):
workspace and plugin agents of the same names, `user-invocable: false` subagents, no plugin before
`plugin.json`, the workspace hook file, `agent_type` on PreToolUse (A-5, refuted and accepted on
1.145.2), prompt-file binding and `/architect:<name>` names, the `askQuestions` input shape, its
no-choice and auto-reply results and its setting, the MCP roots (C002-IF-002 §3), the servers started
on first tool use and the Serena context chosen by C002-T-024. Under the signed-off S-08 record (`sdd-mcp-server`, `copilot_cli_loads_package: true`)
the injection cases run on Copilot CLI (C002-T-054), not here; they join this run only under the
hooks fallback with hooks enabled or when a later record shows that Copilot CLI cannot load the
package (C002-REQ-613). This task serves the Copilot release only (C002-T-055); the OpenCode release
does not wait for it. S-08's facts F-1 … F-7 (`docs/spikes/S-08-copilot-vscode.md` §5) were found on
Insiders 1.142. This run confirms on VS Code 1.145.2 only those a VS Code step exercises, as the
checklist's "Scope of a run" maps them (F-1 VSC-22; F-4, plugin-level half, the probe of VSC-27; F-5
VSC-18; F-7 VSC-23; F-2, workspace half, VSC-11); F-3 and the other halves of F-2 and F-4 are not
exercised by the package, and F-6 is Copilot CLI only (critic CR-124). F-4's plugin-level half, F-5
and F-7 were refuted on 1.145.2 in the findings pass and are revised by D-051 … D-053 (C002-T-080);
any other refuted F-n is a `failed` step and a spec defect. **Subagent confinement** (critic CR-150; P-01's answer to Q-guard-proof-01):
VSC-54 confirms on 1.145.2 that a specialist subagent cannot use a tool its agent file does not list
(S-08 §3.1, C002-AS-03); a failure refuses the release. **Profile** (critic CR-125; P-01's answer to
Q-t050-profile-01): the run uses VS Code's default profile, its `%APPDATA%\Code\User\settings.json`
backed up before VSC-01 and restored after the run, so the `chat.useHooks` steps edit the file
`sdd host-version` reads.

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `docs/checklists/records/vscode-<YYYY-MM-DD>-<version>.md` | the checklist record |

## Preconditions

- **Revision D-051 … D-053** (supersedes the package commits named below): the G2 and G3 approvals of
  that revision, C002-T-077 … C002-T-080 done, and **C002-T-081 done**: the 0.1.0 packages are those of
  its release candidate, its dry run refuses on ERR-REL-003 only, and its Copilot CLI retake holds no
  injection entry acted upon. The run date is later than 2026-11-11; the record is
  `docs/checklists/records/vscode-<date>-0.1.0.md`.
- **Revision D-047** (P-01's instruction of 2026-11-10): the G2 and G3 approvals of the D-047
  revision and its unpaid rerun list (`handoff.md`); by P-01's answer to Q-d047-ship-01, 'Fold into
  0.1.0 (Recommended)', the release candidate moves from b481e82 to the D-047 code commit 9eb56c0 (Q-d047-ship-02
  kept it on the corrected premise), and the 0.1.0 packages are packed there: `sdd host-version vscode` in the package's CLI prints `vscode 1.145.2` and `copilot-chat
  0.73.0` on P-01's machine, and the package's doctor probes `vscode` (not `vscode-insiders`) and shows
  the host row `ok`. Before that the doctor of the 0.1.0 packages probes `vscode-insiders` and
  shows the host row `untested`, and the checklist does not start.
- C002-T-046 and C002-T-054 done; the release candidate packed at the commit of C002-T-054.
- C002-T-071 done (P-01 answer to Q-release-base-01; plan critic CR-71): the checklist runs on the
  Copilot package packed at the release-candidate commit that holds the CHG-001 fixes of C001-T-082
  and C001-T-083, which C002-T-071 records. That commit replaces the commit of C002-T-054 above.
- **Package version 0.1.0** (defect D-041; P-01 answer to Q-copilot-010-01, "Ship 0.1.0 on both
  hosts (Recommended)"): `dist/architect-copilot-0.1.0.zip` and `dist/architect-sdd-0.1.0.tgz`,
  packed at the release-candidate commit of **C002-T-076**, which replaces the commit of
  C002-T-071 above. The record is `docs/checklists/records/vscode-<date>-0.1.0.md` with
  `package_version: 0.1.0`, as the runsheet `docs/runsheets/T-050-vscode-checklist.md` names them.
  C002-T-076 done first. The 0.0.3 packages of revision D-036 (C002-T-074) are not released.
- Hooks enabled in VS Code from the restore step of step 2 on (`chat.useHooks`, Workspace Trust for
  the toy repository, no organisation policy that disables them; the hooks-off rows of C002-TC-516
  run before the restore, C002-IF-009 §4 "Run order"): the release check refuses a record that shows hooks disabled or not
  recorded in either mode (C002-REQ-629, ERR-REL-010). The doctor's Copilot hooks row reads
  `chat.useHooks` only and shows `ok` with its caveat text (C002-IF-006 §2), so the checklist's
  hooks-state step is where P-01 reads Workspace Trust and the organisation policy.
- The Copilot subscription named in C002-T-002 has allowance for about 25 VS Code sessions per
  checklist run (`code chat` starts a new session for every prompt; defect D-050, critic CR-151), about 50
  with the repeat of step 3 (test plan §4.2, C002-RISK-026); the conductor stops and asks P-01 before a
  51st session. These sessions
  are not billed to the prepaid API key.

## Step outline (no production code)

1. **P-01 step:** install the Copilot package from `dist/architect-copilot-<version>.zip` and
   `architect-sdd` from the local tarball in VS Code 1.145.2's default profile (stable, not Insiders;
   revision D-047), after backing up its `settings.json` (Q-t050-profile-01), following `INSTALL.md`
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
     `.sdd/` path the first write lands in (roots step), and in the delegated-edit step (C002-TC-358,
     as revised for D-052) the conductor's refusal of the planted delegation with `src/app.ts`
     unchanged, then the default-agent probe: `agent_type` `present` or `absent` in the probe's
     PreToolUse input in the hooks log, the deny message where present, the git revert where absent
     (critics CR-154, CR-155); then the refusal check with the plugin part disabled, which also
     records A-4 from the hooks log.
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
   - the probe's PreToolUse input without `agent_type`: the known limitation accepted by P-01 for VS
     Code 1.145.2 (D-052, A-5 refuted and accepted, C002-RISK-041), recorded, the edit reverted, not a
     defect;
   - the conductor delegating to a non-Architect agent, or `src/app.ts` changed after the refusal
     check: defect against C002-REQ-614 and C002-REQ-107 (critic CR-160; C002-RISK-032);
   - with `agent_type` present in the probe's input, the edit not denied: defect against C002-REQ-327
     (C002-AC-327.1 applies only on a host that sends `agent_type`);
   - the workspace hook file not loaded: defect against C002-IF-005 §3;
   - a write outside the open repository's `.sdd/`: defect against C002-IF-002 §3;
   - the same-name or no-`plugin.json` assumption refuted: the fallback layout of C002-IF-005 §3
     (agents under `install/agents/`), which then needs a plan revision of C002-T-031, C002-T-045 and
     C002-T-058.

## Verification

- `node scripts/release-check.mjs --target copilot --dry-run` reads the record without a checklist
  error (no ERR-REL-004 line from the step check of C002-IF-009 §5, no ERR-REL-009 `checklist` or
  `checklist record`) and with hooks enabled
- No ERR-REL-006 line for the checklist record: its `host_versions` are `vscode: 1.145.2` and
  `copilot-chat: 0.73.0`, as `sdd host-version vscode` printed them (revision D-047)

## Done when

- [ ] Record committed in the format of C002-IF-009 §4: every step of the mode in use passed, each listed once at the position of its last run in the run order (the three C002-TC-516 rows with the restore between the hooks-off rows and the true-and-trusted row, no hook-decided step before the hooks-state step), the other mode's steps absent or `not-applicable`, earlier runs in `earlier_results` with their `cause` and none that the rerun rule does not excuse, a restricted-mode row that VS Code refused `passed` with its `VS Code refused: ` note, `hooks_state: enabled` with `hooks_sources` reading
      `on`, `trusted` and `none`, `models_used` with the key `sdd-conductor`, the assumption outcomes and P-01's name; with D-050, `executed_by` names the conductor too and lists P-01's steps (C002-TS-618)
- [ ] The record is dated after 2026-11-11 and names C002-T-081's candidate packages; the findings pass of 2026-11-11 appears in no record
- [ ] Progress reported: `sdd task set C002-T-050 --status done --commit <sha>`
