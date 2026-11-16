---
id: C002-T-080
title: "Fix for revisions D-052, D-053: VS Code checklist, record template and T-050 run sheet"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-07
status: done
depends_on: [C002-T-046, C002-T-079]
implements: [C002-REQ-614, C002-REQ-615, C002-REQ-616]
satisfies_ac: [C002-AC-614.1, C002-AC-615.1, C002-AC-616.1]
verified_by: [C002-TS-358, C002-TS-617, C002-TS-618, C002-TS-619, C002-TC-358, C002-TC-617, C002-TC-618, C002-TC-619]
components: [C002-COMP-011]
risk_refs: [C002-RISK-031, C002-RISK-041, C002-RISK-026]
estimate: M
report: { commit: a50146d, completed_at: 2026-11-11, notes: "package commit placeholder filled by C002-T-081" }
---

# C002-T-080 — Fix for revisions D-052, D-053: VS Code checklist, record template and T-050 run sheet

## Intent

The findings pass of 2026-11-11 showed that the checklist `docs/checklists/vscode-copilot.md`, its
record template and the run sheet of C002-T-050 expect behaviour that VS Code 1.145.2 does not have
(defects D-052, D-053; `../revision-D051-D053-digest.md`, "Decisions for the revision"). This task
brings the three documents to the revised C002-IF-009 §4, C002-TS-358 and C002-TS-617 … 619, so that
the clean rerun of C002-T-050 can pass on the tested build. It writes no record.

## Targets

| Kind | Target | Change |
|---|---|---|
| modify | `docs/checklists/vscode-copilot.md` | the step changes of the digest: **VSC-11** servers start when their first tool is used (record each server's state after `/architect:status` and after a step that uses Serena; Serena's arguments hold `--context vscode`); **VSC-12** expects `/architect:doctor`, `/architect:new`, `/architect:init` and records whether a bare `/init` resolves to VS Code's built-in; **VSC-20, VSC-29** `chat.autoReply` true, then false, recording the `askQuestions` result (the auto-reply text is no answer); **VSC-21** the reply names the toy change without a status command and the "GitHub Copilot Chat Hooks" log shows the JSON output; **VSC-22, VSC-54** when the conductor declines, the fallback starts `sdd-spec-writer` from the default agent (`runSubagent`, `agentName: sdd-spec-writer`) with the same task; **VSC-23** the record names the tool ids as VS Code shows them (`mcp_<command>[N]_<tool>`, replacing F-7's `<server>-<tool>`); **VSC-27** two parts (critics CR-154, CR-155, the conductor's decision): (a) the conductor refuses the planted delegation and `src/app.ts` is unchanged; (b) a **default-agent probe**: the default agent's `runSubagent` starts `general-purpose` with the planted edit of `src/app.ts`; where that subagent's PreToolUse input carries `agent_type`, the edit is denied with GUARD-HOOK-002 (GUARD-HOOK-001 for an unclassed edit tool) and `src/app.ts` is unchanged; where it does not (VS Code 1.145.2), the record gives `agent_type: absent`, the edit is reverted with git, and the step passes as the known limitation of D-052; the `agent_type` recheck of every run reads this probe's hook input in the hooks log; **VSC-28** the same with the plugin part disabled, and A-4 (the workspace hook file runs, seen in the hooks log); every slash command in the `/architect:<name>` form (VSC-13, VSC-14 included); the `ask_user` steps (VSC-15, VSC-18, VSC-19) name the question tool as revised by C002-T-077; **VSC-15** removes both question-tool names from the `tools` list of `.github/agents/sdd-conductor.agent.md` and of the `/architect:new` prompt file (a prompt file's `tools` override the agent's), or sends a plain request without the prompt file; **VSC-18** records that `askQuestions` alone works, the legacy `vscode/askQuestions` absent from the tools list (the architect's VS Code assumption; history note: refuted at VSC-14 of the binding run of 2026-11-11, defect D-054, and rewritten by C002-T-082); **VSC-20** carries both rows of C002-TS-317: the `chat.autoReply` row, run by the conductor, and the free-text row (critic CR-157), in which P-01 types "Keep the CSV export out of v1" in the free-text field without selecting an option and the questions log must hold it verbatim as the answer; since the conductor cannot type in VS Code, the free-text row is VSC-20's free-text half and joins P-01's end batch (with VSC-30, VSC-12 and the VSC-01 twin), as VSC-01's slash-list half does: VSC-20 passes only when both halves pass and is recorded at the position of its last half; because P-01's batch runs after VSC-29 with the phase in review, the half's Do text first gets an interview question: during or after the VSC-30 rework P-01 asks the conductor for one round (for example "ask me one question about the export scope"), then types the free text without selecting an option; the record has a field for its `askQuestions` result (`selected: []`, P-01's `freeText`) and the questions-log line; VSC-18 and VSC-19 use the same field form when an answer is free text only; **VSC-23** reads the `tool_name` of the MCP calls from the hooks log; **VSC-54** records what the specialist's `explore_subagent` can call |
| modify | same file › "Assumption steps" table A-1 … A-8 | A-5 refuted and accepted (no `agent_type` on PreToolUse on VS Code 1.145.2; P-01's decision on D-052), its record row stating the known limitation; A-6 names `askQuestions`; A-8 "when the first tool is used" |
| modify | same file › "Scope of a run" (the F-n mapping table) | F-4 (plugin-level half) refuted on 1.145.2 and replaced by the refusal and confinement checks of VSC-27 and VSC-54; F-5 refuted (the VS Code tool is `askQuestions`); F-7 replaced by the observed naming; the steps each F-n maps to |
| modify | same file › step index | the mode of each step as the revised C002-IF-009 §4 gives it: VSC-25 and VSC-26 (C002-TS-313, C002-TS-335) recorded `not-applicable` on a build whose PreToolUse input carries no `agent_type`, the hooks fallback not being offered for VS Code |
| modify | `docs/checklists/records/TEMPLATE.md` | `models_used` from the reply footer; the VSC-27 and VSC-28 fields (the conductor's refusal; the default-agent probe of VSC-27: `agent_type` `present` or `absent` from the probe's hook input in the hooks log, the deny message where present, the git revert where absent); the A-5 row "refuted, accepted"; the VSC-20 and VSC-29 fields for the `askQuestions` results with `chat.autoReply` true and false |
| modify | `docs/runsheets/T-050-vscode-checklist.md` | the method: `code chat -r -m sdd-conductor -a <pkg>\prompts\<name>.prompt.md "Follow the attached Architect <name> prompt …"` (code chat does not expand slash commands, digest fact 11); pick Claude Sonnet 5.5 in the model picker of each new window and read the reply footer; confirm tools with "Allow Tools from sdd-mcp in this Session"; read results from the chat session files of the workspace (folder named in the run sheet) and the "GitHub Copilot Chat Hooks" output log; `chat.autoReply` set and restored with the profile's settings backup; the fallbacks of VSC-22 and VSC-54; the P-01 batch (VSC-30, VSC-12, the twin half of VSC-01, and now the free-text row of VSC-20, critic CR-157) and the allowance (about 25 sessions, ask P-01 before a 51st) unchanged otherwise; a note that the run of 2026-11-11 was a non-binding findings pass and no record |
| modify | `tests/integration/cap06/checklist.test.ts` | C002-TC-617 and C002-TC-619 assertions to the revised scenarios (the sdd MCP server row of C002-TS-619 expects the refusal check and the default-agent probe, whose hook denial is expected only where its PreToolUse input carries `agent_type`); the step-index modes of VSC-25 and VSC-26; C002-TC-618's template checks |

## Preconditions

- The G2 and G3 approvals of the D-051 … D-053 revision (C002-IF-009 §4, C002-TS-358, C002-TS-617 …
  619, C002-TS-313 and C002-TS-335 as revised).
- C002-T-046 done; C002-T-079 done, so the checklist quotes the install notes it ships with.

## Step outline (no production code)

1. Update `checklist.test.ts` to the revised scenarios first.
2. Edit the checklist steps, the assumption table, the F-n table and the step index; keep step IDs:
   the release check's step check reads them (C002-IF-009 §5), and no step is added or removed.
3. Edit the record template; it validates as before.
4. Edit the run sheet; every command it gives is copied from the findings-pass notes' working form,
   with paths as placeholders.
5. `node scripts/release-check.mjs --target copilot --dry-run` reads the step index without
   ERR-REL-009 `checklist`.

## Verification

- `npm test -- cap06/checklist` and `npm test -- cap06/release-check`
- `node scripts/release-check.mjs --target copilot --dry-run` (no ERR-REL-009 `checklist` line)

## Done when

- [ ] Every change the digest lists for VSC-11, 12, 20, 21, 22, 23, 27, 28, 29 and 54, the A-1 … A-8 table and the F-n table is in the checklist, every slash command in the `/architect:<name>` form
- [ ] VSC-27 holds the conductor-refusal check and the default-agent probe with both outcomes (CR-154, CR-155); VSC-20 holds the free-text row of C002-TS-317 in P-01's batch with its record field (CR-157)
- [ ] VSC-15, VSC-18, VSC-23 and VSC-54 carry the architect's additions (prompt-file tools list, `askQuestions` alone, `tool_name` from the hooks log, `explore_subagent`) — history note (revision D-054): the "`askQuestions` alone" expectation of VSC-18 was refuted at VSC-14 of the C002-T-050 binding run of 2026-11-11; C002-T-082 rewrites VSC-15 and VSC-18 for the three names
- [ ] The record template and the run sheet carry the new fields and method
- [ ] `npm test -- cap06/checklist` green; the dry run reads the step index
- [ ] Progress reported: `sdd task set C002-T-080 --status done --commit <sha>`
