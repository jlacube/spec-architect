---
id: C002-T-083
title: "VSC-15 in the prompt-file form only, the conductor copy in the T-050 run sheet, and the fresh run folder t050e (C002-T-050 run of 2026-11-12)"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-07
status: todo
depends_on: [C002-T-082]
implements: [C002-REQ-312, C002-REQ-614, C002-REQ-615]
satisfies_ac: [C002-AC-312.1, C002-AC-614.1, C002-AC-615.1]
verified_by: [C002-TS-319, C002-TS-617, C002-TS-618, C002-TC-319, C002-TC-617, C002-TC-618]
components: [C002-COMP-011]
risk_refs: [C002-RISK-026, C002-RISK-031, C002-RISK-043]
estimate: S
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-083 — VSC-15 in the prompt-file form only, the conductor copy in the T-050 run sheet, and the fresh run folder t050e (C002-T-050 run of 2026-11-12)

## Intent

The binding run of C002-T-050 of 2026-11-12 (started 01:10 in `C:\Sandbox\runs\t050d`, candidate
e89dae8) failed at VSC-15 in its plain-request form: asked without `/architect:new`, the conductor ran
`sdd change new` with the CLI defaults and asked no profile question (CHG-001 defect D-032, left to a
later change). By P-01's answer to Q-t050-vsc15-01 (`../questions-log.md` round 2026-11-12) this is a
fault of the test design: C002-TS-319 and VSC-15 keep only the prompt-file form. The findings pass
that followed showed that the names must come out of both conductor copies and the prompt file, and
that `code chat -m sdd-conductor` can run the plugin copy of the conductor (finding F-P). By P-01's
answer to Q-copilot-agentcopy-01 ("Keep both, record copy (Recommended)") either copy may be the
session agent and the record names the copy used (C002-IF-009 §4 "Session agent", as revised;
CHG-002 defect D-055 on C002-IF-005 §3, closed by this revision with this task done and VSC-15
passed in C002-T-050's record). This
task brings the checklist (VSC-15, assumption A-2), the record template, the run sheet and
`checklist.test.ts` to the revised C002-TS-319 and C002-IF-009 §4, and points the run sheet at a
fresh run folder. Docs and tests only: no code, no
package, no paid session; the candidate stays e89dae8.

## Targets

| Kind | Target | Change |
|---|---|---|
| modify | `docs/checklists/vscode-copilot.md` › VSC-15 | **Do:** the prompt-file form only. Back up the two package files (`<package folder>\agents\sdd-conductor.agent.md` and `<package folder>\prompts\new.prompt.md`, each to `<name>.t050-backup`); remove the three entries `ask_user`, `askQuestions` and `vscode/askQuestions` from the `tools` lists of the plugin conductor `agents/sdd-conductor.agent.md`, the workspace conductor `.github/agents/sdd-conductor.agent.md` and the prompt file `prompts/new.prompt.md`; reload the window; in a new Local chat with `sdd-conductor` run `/architect:new "Toy change"`; afterwards restore the workspace conductor with git and both package files from their backups, and reload. The plain-request alternative ("Alternatively … plain request …") is removed. **Expect:** unchanged (C002-TS-319). **Record:** the reply's wording in `note` when it differs, and the conductor copy as the Session agent rule says (in this step's `note` only when its session used the other copy than the one named in VSC-02); the "which form ran" clause is removed. A history note: the plain-request form was dropped after the C002-T-050 run of 2026-11-12 (CHG-001 defect D-032). The step ID, group, mode, kind and scenario stay; a title change in the heading is made in the step-index row too |
| modify | same file › "Assumption steps" table, row A-2 (about line 219), and the Assumptions-table text of the record part | A-2 as revised by the Session agent paragraph of C002-IF-009 §4 and C002-IF-005 §3 (defect D-055; P-01 answer to Q-copilot-agentcopy-01), in two halves. **Open half** (still an assumption, settled by VSC-22 of C002-T-050): a conductor session on either copy starts the workspace specialists although plugin agents of the same names are loaded; VSC-22 records the session's copy and the started specialist; a plugin-copy session that starts no specialist goes back to P-01. **Settled half** (Q-copilot-agentcopy-01): the prompt files are offered as slash commands, and **either conductor copy, plugin or workspace, may be the session agent** of a chat started with `code chat -m sdd-conductor` or picked by name, and a prompt file runs on that session agent; the record names the copy used, from the `mode` of the chat session file, in the `note` of VSC-02 when every conductor session used the same copy, else in the `note` of each step whose session used the other copy; the former "the prompt files bind to it" is replaced, with a history note (C002-T-050 run of 2026-11-12, finding F-P). The A-2 references at VSC-22 and VSC-28 (lines about 402 and 538) stay unless they repeat the binding claim |
| modify | same file › VSC-02 Record | the `note` of VSC-02 names the conductor copy (plugin or workspace) of the run's conductor sessions, from the chat session file's `mode`, as the Session agent rule says |
| modify | same file › VSC-22 Record | the session's conductor copy and the specialist it started (workspace or plugin, from the chat session file); a plugin-copy session that starts no specialist is reported to P-01 (A-2 open half) |
| modify | same file › VSC-15 and VSC-18 Record | each notes the invocation form: the prompt file attached with `-a` (the conductor's `code chat` method) or the slash command typed by P-01 (spec critic CR-178, CR-180) |
| modify | `docs/checklists/records/TEMPLATE.md` › the VSC-15 entry, the VSC-02 `note`, the A-2 row of the Assumptions table | VSC-15 `observed` names the three files edited (plugin conductor, workspace conductor, prompt file); no "or plain request"; the VSC-02 `note` placeholder holds the conductor copy (`plugin` or `workspace`, from the session file's `mode`); the VSC-15 and VSC-18 placeholders hold the invocation form (`-a` attached prompt or slash command typed by P-01); the VSC-22 placeholder holds the session's copy and the started specialist; the A-2 row reads as the revised A-2, both halves (C002-TS-618) |
| modify | `docs/runsheets/T-050-vscode-checklist.md` | (a) **banner:** the binding run of 2026-11-12 (01:10, `C:\Sandbox\runs\t050d`, candidate e89dae8) stopped at VSC-15 on a test-design fault (the plain-request form; CHG-001 defect D-032), with the steps that passed (VSC-01 conductor half, 02, 03, 04, 07, 08, 10, 11, 13, 14), no record written (rule 10), none of its results carried over; the remaining steps ran as a non-binding findings pass; the run starts again from step 0 after C002-T-083 is done, on the same candidate e89dae8; (b) every `t050d` path becomes `C:\Sandbox\runs\t050e`, a fresh folder with no earlier package or toy repository; (c) **method:** `code chat -m sdd-conductor` may run either copy of the conductor, the plugin copy included (finding F-P; Q-copilot-agentcopy-01); for every conductor session, read the copy from the `mode` of the chat session file and record it as the Session agent rule says (VSC-02 `note`, or the `note` of each step whose session used the other copy); the VSC-15 bullet as the checklist's Do (three files, two package backups, reload, restore), without the plain request; (d) the prerequisites' **Package** line names C002-T-082's release-candidate commit e89dae8 (the earlier commits kept as history); (e) step 11's statement: "Binding run of C002-T-050, started <time>, after the stopped runs of 2026-11-11 (VSC-14, D-054) and 2026-11-12 (VSC-15, test design) and after C002-T-083 was done (<commit>)." (C002-T-050's done item), the `<commit>` left for C002-T-050 to fill with this task's done commit (the commit that records `sdd task set C002-T-083 --status done`); (f) a settings line before step 0: P-01's settings file has hash `FF55715DE862` |
| modify | `tests/integration/cap06/checklist.test.ts` › the C002-T-080 test of VSC-15 (`/plain request/`) and the C002-T-082 VSC-15 check | VSC-15 names `agents/sdd-conductor.agent.md`, `.github/agents/sdd-conductor.agent.md` and `prompts/new.prompt.md`, the three entries, a reload and the restore of the backups, and no longer holds "plain request" (C002-TC-617); the A-2 row holds the open half (VSC-22 records the copy and the started specialist) and the settled half (either conductor copy may be the session agent, the record names the copy used), and no longer states that the prompt files bind to the workspace conductor; the VSC-02 Record names the conductor copy; the VSC-15 and VSC-18 Records name the invocation form; the template's VSC-15 `observed` holds no "plain request" and its VSC-02 `note` holds the conductor copy (C002-TC-618) |

## Preconditions

- The G2 and G3 approvals of the revision after the C002-T-050 run of 2026-11-12 (C002-TS-319 and
  the VSC-15 row of C002-IF-009 §4 in the prompt-file form only; the Session agent paragraph of
  C002-IF-009 §4 and "Same names in two places" of C002-IF-005 §3, now a fact with P-01's decision).
- C002-T-082 done (candidate e89dae8, done commit c8c1d10).
- Q-t050-vsc15-01 and Q-copilot-agentcopy-01 answered by P-01 (`../questions-log.md` round
  2026-11-12).

## Step outline (no production code)

1. **Tests first.** Change the VSC-15 assertions of `checklist.test.ts` as the Targets table says;
   they fail against the current checklist and template.
2. **Checklist.** Edit VSC-15 Do, Record and its history note, the VSC-02, VSC-18 and VSC-22
   Records, and assumption A-2 with the Assumptions-table text. No step is added or removed and the step index keeps its rows
   (the release check's step check reads them, C002-IF-009 §5).
3. **Record template.** Edit the VSC-15, VSC-18 and VSC-22 placeholders, the VSC-02 `note`
   placeholder and the A-2 row; the template still validates.
4. **Run sheet.** Items (a) to (f) of the Targets table. Every command keeps the paths of the fresh
   folder `t050e`; the method sentence on the conductor copy names the session file's `mode` as the
   evidence, never a guess from the reply.
5. **Check.** `npm run check` (with the exceptions of C002-T-082 step 5 only where they still
   apply), then the dry run. No `npm run package`: `docs/` and `tests/` are not
   inputs of the packages, so `dist/` and the candidate e89dae8 stay as they are; if the dry run
   reports ERR-REL-007 the task stops and goes to the conductor.

## Verification

- `npm test -- cap06/checklist`
- `npm run check`
- `node scripts/release-check.mjs --target copilot --dry-run` (refuses on ERR-REL-003 only)

## Done when

- [ ] VSC-15 removes the three entries from the plugin conductor, the workspace conductor and `prompts/new.prompt.md`, backs up the two package files, reloads, and restores them afterwards; the plain-request form is gone; its Record names the conductor copy only when it differs from the one named in VSC-02
- [ ] The VSC-15 and VSC-18 Records note the invocation form (prompt attached with `-a`, or slash command typed by P-01)
- [ ] A-2 and the Assumptions-table text hold the open half (a session on either copy starts the workspace specialists; VSC-22 records the session's copy and the started specialist; a plugin-copy session that starts no specialist goes back to P-01) and the settled half (either copy may be the session agent; the record names the copy used, in the VSC-02 `note` or in each step whose session used the other copy); the VSC-02 and VSC-22 Records ask for it
- [ ] The template's VSC-15 `observed` names the three files, without "plain request"; its VSC-02 `note`, its VSC-15, VSC-18 and VSC-22 fields and its A-2 row carry the conductor copy, the invocation form and the started specialist as the Targets table says
- [ ] The run sheet carries the 2026-11-12 banner (stop at VSC-15, test design, D-032 of CHG-001, no record), the run folder `C:\Sandbox\runs\t050e` in every path, the conductor-copy method (F-P, session file `mode`), the Package line with e89dae8, the settings hash `FF55715DE862` before step 0, and the step-11 statement of C002-T-050
- [ ] `npm test -- cap06/checklist` and `npm run check` green; the dry run refuses on ERR-REL-003 only; no file of `plugins/architect/` or `dist/` changed
- [ ] Progress reported: `sdd task set C002-T-083 --status done --commit <sha>`
