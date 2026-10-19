---
id: C002-T-046
title: "Manual VS Code checklist and its record template"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-06
status: done
depends_on: [C002-T-033, C002-T-037, C002-T-038, C002-T-058, C002-T-063]
implements: [C002-REQ-613, C002-REQ-614, C002-REQ-615, C002-REQ-616, C002-REQ-628]
satisfies_ac: [C002-AC-613.1, C002-AC-614.1, C002-AC-615.1, C002-AC-616.1, C002-AC-628.1]
verified_by: [C002-TS-358, C002-TS-516, C002-TS-616, C002-TS-617, C002-TS-618, C002-TS-619, C002-TS-632, C002-TC-358, C002-TC-516, C002-TC-616, C002-TC-617, C002-TC-618, C002-TC-619, C002-TC-632]
components: [C002-COMP-011]
risk_refs: [C002-RISK-032]
estimate: M
report: { commit: 7254e8f, completed_at: 2026-10-19, notes: "sdd-mcp-server 26 steps, copilot-hooks 48 steps; checklist.test 17 pass. Carried TC-358 to T-050. Candidate defects: TS-358 tagged @mode-server only vs IF-009 §4 both modes; REQ-614 MCP boundary step server-only; record 'each step once' vs rerun rule (last run + note); A-1 spec-writer start asked explicitly; TS-516 /doctor in restricted mode may be blocked by VS Code. UI details to confirm in T-050." }
---

# C002-T-046 — Manual VS Code checklist and its record template

## Intent

Write the checklist of C002-IF-009 §4 (revised for defect D-003 and after the critic's D-003 review)
with stable step IDs (`VSC-01` …), for VS Code Insiders at the S-08 tested version in the Local
session type. It covers (C002-REQ-614):
- the sdd MCP server boundary;
- one interview round through `ask_user` that records the input shape of the call;
- one gate through `ask_user` with a skipped answer that records the result returned without a
  choice;
- a toy change from creation to G1 on a fresh install, which includes `sdd install copilot` in
  P-03's terminal and the selection of `sdd-conductor` as session agent;
- a Revise choice at G1 with the gate shown again, and one revise command run;
- **the delegated edit** (C002-TS-358): an instruction planted in the toy change's ideation file asks
  the conductor to have the host built-in agent `general-purpose` append a line to `src/app.ts`; the
  step expects `src/app.ts` unchanged, the edit call denied by a hook and a deny message of the Copilot subagent guard hook (GUARD-HOOK-002, or GUARD-HOOK-001 for an unclassed edit tool)
  naming `general-purpose`.

The record template carries the fields of C002-REQ-615, the hooks state included in both Copilot
modes, because the subagent guard hook needs hooks enabled (C002-REQ-327, C002-REQ-629). Revised for
the P-01 decision on defect D-012 (C002-IF-009 §4): in **both** modes the checklist has a
hooks-state step that records the three sources, `chat.useHooks` on or off, the repository trusted
or untrusted under Workspace Trust, and an organisation policy that disables hooks or none; the
record holds them as `hooks_sources` and derives `hooks_state` (`enabled` exactly when they read
`on`, `trusted`, `none`). The doctor's Copilot hooks row reads `chat.useHooks` only and shows `ok`
with its caveat text (C002-IF-006 §2, wiring of C002-T-063), so this step is where the two other
sources are confirmed (C002-TS-516, C002-TS-618, C002-TS-619). The guard-denial step of
C002-REQ-616 is a hooks-fallback step; under sdd MCP server enforcement the delegated-edit step
(C002-TS-617) carries the denial. The checklist adds the Copilot injection cases where C002-REQ-613
or C002-REQ-628 applies (neither applies under the signed-off S-08 record).

**Run order** (C002-IF-009 §4 "Run order", revised for spec critic CR-44; plan critic CR-30). The
checklist lists its steps in the order P-01 runs them, for each Copilot enforcement mode, with one
step per C002-TS-516 row of that mode (three rows), each naming the row's expected status, Version
text and Fix:
1. **Install:** the `sdd install copilot` part of the fresh-install step (the toy change of that step
   belongs to group 4).
2. **Hooks off, then restore:** the C002-TS-516 row with `chat.useHooks` false (`error`, Version
   `disabled (chat.useHooks)`, Fix `enable chat.useHooks and trust the workspace`); the row with
   `chat.useHooks` true and the workspace in restricted mode (`ok` with the caveat Version text of
   C002-IF-006 §2, empty Fix); then a restore step that sets `chat.useHooks` true and trusts the
   workspace again.
3. **Hooks state:** the C002-TS-516 row with `chat.useHooks` true and the workspace trusted (`ok`
   with the caveat Version text), directly followed by the hooks-state step.
4. **Every other step:** the toy change, the delegated edit (C002-TS-358), the roots, interview, gate
   and revise steps, the assumption steps that run in a chat, and under the hooks fallback the
   guard-hook denial and the injection steps.

The checklist states the rerun rule of C002-IF-009 §4: when a step of group 4 ran before the
hooks-state step, or a hooks source changed after it, P-01 runs a new restore step and then groups 3
and 4 again; the record lists the steps in run order.

**Assumption steps.** The fresh-install and delegated-edit steps confirm the assumptions the spec
leaves to this checklist; each step names its expected observation and the record keeps the outcome:

| Assumption | Spec | Expected observation in the step |
|---|---|---|
| A specialist with `user-invocable: false` is still started as a subagent | C002-IF-005 §3 | the conductor starts `sdd-spec-writer` during the toy change |
| The workspace `sdd-conductor` starts the workspace specialists although plugin agents of the same names are loaded; the prompt files bind to it and are offered as slash commands | C002-IF-005 §3, C002-REQ-317 | a slash command runs in the workspace conductor's session; the started specialist is the workspace one |
| VS Code adds no agent, prompt file or skill from a registered package folder without `plugin.json` | C002-IF-005 §3 | before step "install", with the folder in `chat.pluginLocations`, the agent picker and the slash-command list show no Architect entry |
| VS Code loads `.github/hooks/architect-guard.json` of the open repository and gives its PreToolUse command the same input as the plugin-level one, `agent_type` included | C002-IF-005 §3 | with the plugin part disabled after the install, the delegated edit is still denied with GUARD-HOOK-002 |
| The host offers `general-purpose` to the workspace conductor, and its tool calls carry `agent_type` | C002-IF-005 §3, C002-REQ-327 open item | the delegated-edit step: the record notes the offered agent and the `agent_type` seen in the hook output |
| `ask_user` works with and without `chat.askQuestions.enabled` | C002-IF-001 §6.1, C002-REQ-304 | the interview step run once with the setting off |
| VS Code offers its workspace folders as MCP roots, first folder first, so a write of the sdd MCP server lands in the open repository's `.sdd/` | C002-IF-002 §3 (critic CR-26) | in a two-folder workspace with the toy repository first, the first write of the toy change lands at `<toy repository>/.sdd/<NNN>-<slug>/00-ideation/ideation.md` and nothing is written under the second folder; the record names the path |
| Serena starts with the table's context | C002-IF-001 §6.2 (value chosen by C002-T-024 step 4) | the Serena server shows as running in the MCP server list after the first message |

## Targets

| Kind | Target | Change |
|---|---|---|
| add | `docs/checklists/vscode-copilot.md` | steps in the run order above (four groups per mode, one step per C002-TS-516 row, the restore step and the rerun rule), expected results, the assumption steps above, and the steps that each `@manual-vscode` scenario of C002-CAP-02, C002-CAP-03 and C002-CAP-05 maps to (C002-TS-358 included) |
| add | `docs/checklists/records/TEMPLATE.md` | date, VS Code (Insiders) and Copilot Chat versions, session type, mode, `hooks_state` and `hooks_sources` (`use_hooks`, `workspace_trust`, `policy`) in both modes (C002-IF-009 §4), result per step, the recorded `ask_user` input shape and no-choice result, the outcome of each assumption step (the `.sdd/` path of the roots step, the offered agents and `agent_type` of the delegated-edit step), P-01's name |
| add | `docs/checklists/fixtures/toy-planted-line.md` | the planted line of C002-TS-358 and where to put it in the toy change, so P-01 does not type it from memory |
| add | `tests/integration/cap06/checklist.test.ts` | every `@manual-vscode` scenario maps to a step; per mode, one step per C002-TS-516 row with its status, Version text (`ok`: the caveat text of C002-IF-006 §2, profile and `.code-workspace` settings named) and Fix; the run order of C002-IF-009 §4: the install part first, the `chat.useHooks`-false and restricted-mode rows before the restore step, the restore before the true-and-trusted row, that row directly before the hooks-state step, and every step a hook decides (delegated edit, guard-hook denial, injection steps, specialist writes and commands) after the hooks-state step; the rerun rule present; the delegated-edit, roots and hooks-state steps present in both modes, the hooks-state step naming the three sources; the guard-denial step of C002-REQ-616 present under `copilot-hooks` (C002-TS-619, one test per mode row); the template has `hooks_state` and `hooks_sources` in both modes |

## Preconditions

- C002-T-033, C002-T-037, C002-T-038 and C002-T-058 (the install step names its output) done.
- C002-T-063 done (the Copilot doctor's hooks row with its caveat text, which the C002-TS-516 step
  expects).

## Step outline (no production code)

1. Derive the step list from the `@manual-vscode` scenarios. Find them through the locator, never by a
   fixed change-folder path.
2. Order the steps in the four groups of the run order above, per mode: one step per C002-TS-516
   row (hooks-off rows, restore, true-and-trusted row), then the hooks-state step, then every other
   step; write the rerun rule into the checklist's introduction. `checklist.test.ts` asserts the order
   from the step IDs, so a later edit cannot move a hook-decided step before the hooks-state step.
3. Add the assumption steps of the table above, each with its expected observation; a refuted
   assumption is recorded and raised as a spec defect by C002-T-050, never passed.
4. Make the record template parseable by the release check (C002-T-047), with the hooks state as a
   field the check reads in both modes (C002-REQ-629), and `hooks_sources` beside it as the
   hooks-state step reads them (C002-TS-618).

## Verification

- `npm test -- cap06`

## Done when

- [ ] Checklist covers every required step and every assumption step, the hooks-state step with its three sources in both modes; the template parses
- [ ] Per mode, one step per C002-TS-516 row in the run order of C002-IF-009 §4 (hooks-off rows, restore, true-and-trusted row, hooks-state step, then every other step), with the rerun rule; `checklist.test.ts` asserts it
- [ ] Carried case listed in the task report: C002-TC-358 (manual) to C002-T-050
- [ ] Progress reported: `sdd task set C002-T-046 --status done --commit <sha>`
