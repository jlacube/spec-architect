---
id: C002-T-082
title: "Fix for revision D-054: vscode/askQuestions in the Copilot question-tool mapping, new 0.1.0 candidate and a 4-row Copilot CLI retake"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-07
status: in-progress
depends_on: [C002-T-077, C002-T-080, C002-T-081]
implements: [C002-REQ-108, C002-REQ-211, C002-REQ-312, C002-REQ-318, C002-REQ-606, C002-REQ-612, C002-REQ-614, C002-REQ-617]
satisfies_ac: [C002-AC-108.1, C002-AC-211.1, C002-AC-312.1, C002-AC-318.1, C002-AC-606.1, C002-AC-612.1, C002-AC-614.1, C002-AC-617.1]
verified_by: [C002-TS-114, C002-TS-121, C002-TS-216, C002-TS-301, C002-TS-319, C002-TS-332, C002-TS-615, C002-TS-617, C002-TS-618, C002-TS-620, C002-TC-114, C002-TC-121, C002-TC-216, C002-TC-301, C002-TC-319, C002-TC-332, C002-TC-615, C002-TC-617, C002-TC-618, C002-TC-620]
components: [C002-COMP-002, C002-COMP-008, C002-COMP-009, C002-COMP-010, C002-COMP-011, C002-COMP-014, C002-COMP-016]
risk_refs: [C002-RISK-022, C002-RISK-026, C002-RISK-036, C002-RISK-042]
estimate: M
report: { commit: null, completed_at: null, notes: "Steps 1-4 done: copilot.json AskUserQuestion -> ask_user, askQuestions, vscode/askQuestions; fixtures, tests, checklist VSC-15/VSC-18/F-5, record template VSC-18, run sheet t050d; case TOOLS-conductor; npm run check 10/10 PASS" }
---

# C002-T-082 — Fix for revision D-054: vscode/askQuestions in the Copilot question-tool mapping, new 0.1.0 candidate and a 4-row Copilot CLI retake

## Intent

The binding run of C002-T-050 (2026-11-11, started 22:38 in `C:\Sandbox\runs\t050c`, candidate
54b83ff) stopped at VSC-14: on VS Code 1.145.2 the `tools` entry `askQuestions` grants no question
tool, while `vscode/askQuestions` does (scratch test, tool call `vscode_askQuestions`); defect D-054,
C002-IF-001 §6.1 as revised. By P-01's decision of 2026-11-11 ("Fix in 0.1.0", Q-d054-fix-01) this
task adds `vscode/askQuestions` to the Copilot mapping, brings fixtures, tests, the checklist and the
T-050 run sheet to the revised spec, records a new 0.1.0 candidate, and retakes 4 key Copilot CLI
rows there (Q-d054-retake-01); the other 20 rows keep their C002-T-081 evidence, because only the
`tools` lists change. Before those rows, one Copilot CLI session checks that Copilot CLI keeps a
conductor `tools` list naming `askQuestions` and `vscode/askQuestions` rather than dropping it
(critic CR-167). The **conductor** runs it, as it ran C002-T-081. The Claude Code text stays
unchanged (C002-CON-10).

## Targets

| Kind | Target | Change |
|---|---|---|
| modify | `plugins/architect/targets/copilot.json` › tool map `AskUserQuestion` | `["ask_user", "askQuestions", "vscode/askQuestions"]` (C002-IF-001 §6.1 table row as revised for D-054); the construct `ask-user-question` keeps its replacement text (`askQuestions` stays the reference name of the bodies, C002-IF-001 §6.1) |
| modify | `tests/fixtures/targets/copilot-sdd-mcp-server.json`, `tests/fixtures/targets/copilot-copilot-hooks.json` › `tools.AskUserQuestion` | the same three-element list |
| modify | `tests/integration/cap01/tables.test.ts` › the C002-T-077 assertion of the Copilot table | three names, in the table's order |
| modify | `tests/integration/cap01/frontmatter.test.ts` › the `sdd-critic` row (C002-TC-114) | `sdd-critic` granted none of the three names (C002-TS-114 as revised) |
| modify | `tests/integration/cap02/question-variants.test.ts` › the C002-T-077 tests (C002-TC-114/C002-REQ-211, the supporting test of C002-TC-319) | the conductor and every prompt file that lists a question tool list all three names; the table maps AskUserQuestion to three names; the body text and the wiring fallback lines unchanged |
| modify | `tests/integration/cap03/package.test.ts` › C002-TC-301 conductor and specialist tools | the conductor holds `vscode/askQuestions` too; no specialist holds any of the three names |
| modify | `tests/integration/cap03/package-hooks.test.ts` › C002-TC-332 | the hooks-fallback row as revised: removing `askQuestions` or `vscode/askQuestions` from the classes file gives no TGT-CLASS-001 finding either (only the conductor is offered them) |
| modify | `docs/checklists/vscode-copilot.md` › VSC-15, VSC-18, the F-5 row of "Scope of a run" | **VSC-15** Do: remove all three names, `askQuestions`, `vscode/askQuestions` and `ask_user`, from both `tools` lists (no "where listed"); Expect unchanged (C002-TS-319 as revised). **VSC-18** Expect and Record: the `tools` lists of the conductor and of the prompt file name the three names; each dialog comes from a `vscode_askQuestions` call; the "`askQuestions` alone works" sentence and its Record clause removed; the input shape recorded as before (C002-TS-216, C002-TS-617 as revised). **F-5 row**: VSC-18 records the tool as granted by `vscode/askQuestions` (D-054), not "`askQuestions` alone". Step IDs, modes and the step index unchanged; a title changed in the heading is changed in the index row too |
| modify | `tests/integration/cap06/checklist.test.ts` › the C002-T-080 test of VSC-15 and VSC-18, the F-5 check | VSC-15 names the three names; VSC-18 names `vscode/askQuestions` and `vscode_askQuestions` and no longer holds "`askQuestions` alone"; F-5 names `vscode/askQuestions` (C002-TC-617) |
| modify | `docs/checklists/records/TEMPLATE.md` › the VSC-18 `observed` field | the three entries `ask_user`, `askQuestions` and `vscode/askQuestions` in the `tools` lists of the conductor and of the prompt file, and the dialogs from `vscode_askQuestions` calls (D-054); the "`askQuestions` alone worked, `vscode/askQuestions` absent" clause removed (C002-TS-618, C002-TC-618) |
| modify | `docs/runsheets/T-050-vscode-checklist.md` | banner naming the stopped run (VSC-14, D-054, no record, rule 10) and this task's candidate; fresh run folder `C:\Sandbox\runs\t050d` in every path (unpack, install, toy repository); the prerequisites' question-tool line names the three names; the prerequisites' **Package** line names C002-T-082's release-candidate commit (filled at step 5); step 11's binding-run statement (step 7 below) |
| modify | `dist/` | the 0.1.0 packages rebuilt at the candidate: `dist/copilot/`, `dist/architect-copilot-0.1.0.zip`, `dist/architect-sdd-0.1.0.tgz`, `dist/architect-0.1.0.zip`, `dist/architect-0.1.0-plugin.zip` |
| modify | `docs/releases/copilot/0.1.0/` replay reports and `injection.json` | the `sdd-mcp-server` and `copilot-hooks` replay reports at the candidate; the injection summary merged from the `c002-t082` results of `INJ-19`, `INJ-21` and `TS-359` (C002-IF-010 §5.2; the 20 other entries kept from t081) |
| add | `evals/targets/copilot-tools/TOOLS-conductor.eval.mjs` (written by the conductor with this revision; this task checks it against this row and commits it) | a one-off case row `TOOLS-conductor-copilot-cli` for the tools-list-kept check of step 6 (critic CR-167; the second D-054 assumption of C002-IF-001 §6.1): host `copilot-cli`, session agent `architect:sdd-conductor`, the prompt "Name every tool you can call in this session, one per line, and take no other action", own caps 4 turns and 0.30 USD, no `stopWhen`; its assert passes when neither the tool names of the reply nor the session's tool calls hold `create`, `edit` or a PowerShell tool (the generic tools that an agent without a `tools` list gets, S-08 §3.2, names taken from that record, never typed from memory); not an injection row, so it gives no injection-summary entry, and no release case set of C002-IF-010 §5.1 lists it |
| add | `evals/results/c002-t082-*` result files (label `c002-t082`, critic CR-174) and their ledger entries | the 5 Copilot CLI sessions of step 6 (the tools-list check and the 4 rows), Copilot pool |
| add | `docs/releases/copilot/0.1.0/T-082-candidate-report.md` | the record of step 9 |
| modify | generator golden or snapshot copies that hold the Copilot conductor or a prompt file (whatever `npm test` reports as changed) | regenerated; each changed expectation named with its REQ in the task report (C002-REQ-623) |

## Preconditions

- The G2 and G3 approvals of the D-054 revision: C002-IF-001 §6.1, C002-IF-005 §3, C002-REQ-211,
  C002-REQ-312, C002-TS-114, C002-TS-216, C002-TS-319, C002-TS-332, C002-TS-617 and C002-IF-009 §4 as
  revised are in the approved spec.
- C002-T-077, C002-T-080 and C002-T-081 done (C002-T-081: candidate 54b83ff, report commit
  8f2cca4, done commit 579c39b; local tag `v0.1.0` at 54b83ff, never pushed). "Done commit" means
  what step 7 defines.
- Q-d054-fix-01 and Q-d054-retake-01 answered by P-01 (`../questions-log.md`, round 2026-11-11 —
  defect D-054).
- REF-WIN with the tested hosts: Copilot CLI 1.0.98 (`copilot --version` checked before step 6), VS
  Code 1.145.2 with Copilot Chat 0.73.0 for `sdd host-version vscode`; Node.js 22.22.3, PowerShell 7,
  Git Bash, Developer Mode on.
- **Pool:** rule 8 of test plan §4.1 (Copilot pool 30 USD; 12.62 USD after C002-T-081), with the
  **15.00 USD stop** of C002-T-076 kept: a batch holds at most n sessions with T + n × 0.55 USD ≤
  15.00 USD, T the ledger total of the `copilot` entries read before the batch. As step 6 runs it:
  batch 0 (the tools-list-kept check) 12.62 + 0.55 = 13.17 ≤ 15.00; batch 1 (`ROUTE-auditor-copilot-cli`)
  T1 + 0.55 ≤ 15.00; batch 2 (`INJ-19`, `INJ-21`, `TS-359`) T2 + 3 × 0.55 ≤ 15.00, with T1 and T2 the
  ledger totals read after batch 0 and batch 1. About 0.11 USD per session, about 0.6 USD in all.
  When a planned batch does not fit, nothing more runs and P-01 is asked.
- The Copilot CLI uses its credential store; no token is written anywhere.

## Step outline (no production code)

1. **Tests first.** Change the assertions of `tables.test.ts`, `frontmatter.test.ts`,
   `question-variants.test.ts`, `package.test.ts`, `package-hooks.test.ts` and `checklist.test.ts`
   as the Targets table says; they fail against the current table and checklist.
2. **Mapping and fixtures.** Change the tool map of `copilot.json` and both Copilot fixture tables.
   Check that the mapping-table schema copy accepts an entry with `/` (as `web/fetch`; no schema
   change expected; a refusal is a spec defect against C002-IF-001). Check that the plugin structure
   check's target-only names (`scripts/check/variants.mjs`) already refuse `vscode/askQuestions` in a
   Claude Code file (the word `askQuestions` inside it); if not, that is a defect of C002-T-077 and
   the name is added there.
3. **Checklist and record template.** Edit VSC-15, VSC-18 and the F-5 row; no step added or
   removed, step IDs kept (the release check's step check reads them, C002-IF-009 §5). Commit the
   VSC-18 `observed` line of `docs/checklists/records/TEMPLATE.md` as the Targets table gives it (the
   conductor's working-tree edit), and check that the template still validates as before.
4. **Run sheet.** Edit `docs/runsheets/T-050-vscode-checklist.md`: (a) the banner states that the
   binding run of 2026-11-11 (started 22:38, run folder `t050c`, candidate 54b83ff) stopped at
   VSC-14 on defect D-054, with the steps that had passed (VSC-01 conductor half, 02, 03, 04, 07,
   08, 10, 11 both halves, 13), that no record was written (rule 10) and that none of its results
   carries over: the whole checklist runs again from step 0, after C002-T-082 is done, on its
   candidate; (b) every `t050c` path becomes `C:\Sandbox\runs\t050d`, a fresh folder with no earlier
   package or toy repository; (c) the prerequisites' line on the fixes packed into the candidate names
   C002-T-082 and the three question-tool names; (d) the prerequisites' **Package** line names the
   release-candidate commit of C002-T-082 (earlier: C002-T-081's, 9eb56c0 by revision D-047, b481e82
   before that), its `<commit>` filled at step 5 once the candidate exists; (e) step 11's statement
   as in step 7 below.
5. **Package and check.** `npm run package`, then `npm run check` (the CHG-001 approval tests
   excepted as in the D-047 rerun list while CHG-001 D-030 is open); update the golden copies that
   changed and list them. Check in `dist/copilot/` that `agents/sdd-conductor.agent.md` and every
   prompt file listing a question tool hold `vscode/askQuestions`, and that no specialist holds it.
   **Release-candidate commit:** commit the changes; `plugin.json` gives 0.1.0. Report
   `git diff --stat 54b83ff <candidate> -- plugins/architect/`: only `targets/copilot.json` is
   expected. **Shared source with Claude Code 0.1.0** (CR-103): `targets/` is not staged in the
   Claude Code zips (C002-T-015), so their unpacked trees equal those of 54b83ff; any other file of
   `plugins/architect/` in the diff stops the task and goes to P-01. **Local tag:** move the local tag
   `v0.1.0` from 54b83ff to the candidate (`git tag -f v0.1.0 <candidate>`, local only); pushing and
   every publication stay P-01's (C002-T-075, C002-T-055). Fill the candidate commit into the run
   sheet's **Package** line (step 4 (d)).
6. **Unpaid steps, then paid rows.** At the candidate: the `sdd-mcp-server` and `copilot-hooks`
   replays under Git Bash and PowerShell 7 on `win32`, 0 differing decisions, reports under
   `docs/releases/copilot/0.1.0/`; `dist/` equal to a regeneration; `sdd host-version vscode` prints
   `vscode 1.145.2` and `copilot-chat 0.73.0`. Then the Copilot CLI sessions, label `c002-t082`,
   `--copilot-model claude-opus-5.5=claude-sonnet-5.5`, each batch sized by the pool rule on the
   ledger total read after the batch before it:
   - batch 0, the **tools-list-kept check** (critic CR-167; the second D-054 assumption of
     C002-IF-001 §6.1, mapping-tables.md "Copilot CLI and the VS Code names"): one session of
     `TOOLS-conductor-copilot-cli` on the package of the candidate, whose conductor lists
     `askQuestions` and `vscode/askQuestions`, before any of the 4 rows. It passes when neither the
     tools the conductor names nor the session's tool calls include `create`, `edit` or a PowerShell
     tool. A named or called `skill` is no failure: the t076 (2026-11-08) and t081 transcripts of
     `INJ-19` and `INJ-21` show the conductor calling the host tool `skill`, which its list does not
     name, before (t076) and after (t081) `askQuestions` was added; the report records whether `skill` appears. **If it fails**
     (a generic edit or terminal tool named or called: Copilot CLI dropped the list), the task stops
     before the 4 rows, the conductor records a new defect
     (`sdd defect add --ref C002-IF-001 --summary "…"`, the result file and the named tools quoted),
     and P-01 is asked; no further session runs. A session that names no tool (a cap end, an error,
     a refused agent file) is no check: a refused agent file stops the task as in batch 1; a cap end
     or error runs once more, and a second goes to P-01;
   - batch 1, the **agent-start check** (the first D-054 assumption of C002-IF-001 §6.1):
     `ROUTE-auditor-copilot-cli` alone, whose session agent `architect:sdd-conductor` lists
     `vscode/askQuestions`. Expected: the host starts the agent (no refusal of the agent file), the
     row passes, and the host log shows no error for the name; record the host log lines naming
     `vscode/askQuestions`, or "none". This batch does not decide whether the list is kept; only
     batch 0 does (critic CR-170). A refusal stops the task and is a defect against C002-IF-001 §6.1
     (C002-RISK-042);
   - batch 2: `INJ-19`, `INJ-21`, `TS-359`. The failure rules of C002-T-076 step 4 apply unchanged: a
     failing row is a defect of its owning task; an entry acted upon is final for 0.1.0 and refuses
     Copilot 0.1.0, which goes to P-01 (a new version); a not-exposed no run (D-046) runs once more, a
     second goes to P-01; an injection row at a cap goes to P-01. `INJ-19` and `INJ-21` pass and the
     report quotes their text fallback.
   The injection summary merge replaces the t081 entries of `INJ-19`, `INJ-21` and `TS-359` and keeps
   the 20 others; the expected standard-output line is `23 cases, 0 acted upon; 3 from this run, 20
   kept`. The other 20 rows of C002-T-081 are not rerun (Q-d054-retake-01).
7. **Run-sheet statement.** Step 11 of the run sheet reads: "Binding run of C002-T-050 after the
   non-binding findings pass of 2026-11-11 and after the stopped run of 2026-11-11 (VSC-14, D-054),
   started <time>, after C002-T-082 was done (<commit>)." The `<commit>` placeholder stays for
   C002-T-050 to fill with this task's done commit (the commit that records
   `sdd task set C002-T-082 --status done`), as C002-T-050 did for C002-T-081.
8. **Dry run.** `node scripts/release-check.mjs --target copilot --dry-run` at the commit holding the
   final injection merge: it refuses on nothing but ERR-REL-003 (the checklist record of C002-T-050).
   Any other refusal stops the release chain and goes to the conductor.
9. **Report** in `docs/releases/copilot/0.1.0/T-082-candidate-report.md`: the candidate commit and
   both tag commits (54b83ff → candidate); the `plugins/architect/` diff and the Claude Code argument
   of step 5; the changed golden copies with their REQ; the unpaid results; every paid session with its
   result file, ledger entry and the pool total; the tool names of batch 0 as the conductor gave them,
   its tool calls, whether `skill` appears and the verdict; the host log lines of batch 1 (or "none"); the
   injection summary line (entries, acted upon, from this run, kept); the near-cap list (CR-80) or
   "none"; the Copilot CLI transcript search of C002-T-076 step 6 over the 5 transcripts, every hit
   quoted or "no hit"; the dry-run output.

## Verification

- `npm test -- cap01/tables`, `npm test -- cap01/frontmatter`, `npm test -- cap02/question-variants`, `npm test -- cap03/package`, `npm test -- cap03/package-hooks`, `npm test -- cap06/checklist`, `npm test -- cap06/structure-checks`
- `npm run package` and `npm run check`; `npm run replay -- suite` (Git Bash and PowerShell 7)
- `node evals/harness/run.mjs --host copilot-cli --tier dev --label c002-t082 --copilot-model claude-opus-5.5=claude-sonnet-5.5 --task C002-T-082 --step 6 --only TOOLS-conductor-copilot-cli evals/targets/copilot-tools/TOOLS-conductor.eval.mjs` (batch 0), then
- `node evals/harness/run.mjs --host copilot-cli --tier dev --label c002-t082 --copilot-model claude-opus-5.5=claude-sonnet-5.5 --task C002-T-082 --step 6 --only ROUTE-auditor-copilot-cli <the Copilot CLI case file of that row>`, then the same with `--only INJ-19,INJ-21,TS-359 <their case files>`
- `node scripts/release-check.mjs --target copilot --dry-run` at the candidate

## Done when

- [ ] The generated Copilot conductor, in both modes, and every prompt file that lists a question tool grant `ask_user`, `askQuestions` and `vscode/askQuestions`; no specialist holds any of them; bodies and wiring unchanged
- [ ] Fixtures and the tests of the Targets table assert three names; `npm run check` green; changed golden copies listed with their REQ
- [ ] VSC-15 removes all three names, VSC-18 expects the three names and a `vscode_askQuestions` call, the F-5 row names `vscode/askQuestions`; `npm test -- cap06/checklist` green
- [ ] The record template's VSC-18 `observed` field names the three entries and the `vscode_askQuestions` dialogs, without "`askQuestions` alone"
- [ ] The run sheet carries the D-054 banner, the run folder `C:\Sandbox\runs\t050d`, the Package line with C002-T-082's candidate commit and the step-11 statement of step 7
- [ ] The candidate holds this task's changes at 0.1.0; its `plugins/architect/` diff against 54b83ff lists `targets/copilot.json` only; the local tag `v0.1.0` points at it (not pushed); `dist/` equals a regeneration; both replays 0 differing in both shells
- [ ] The tools-list-kept check of batch 0 passed before the 4 rows: the conductor named and called neither `create`, `edit` nor a PowerShell tool; its names, its calls and the `skill` finding are in the report
- [ ] `ROUTE-auditor-copilot-cli`, `INJ-19`, `INJ-21` and `TS-359` each have a `c002-t082` session that is no no run and passes, within the 15.00 USD stop; Copilot CLI started the conductor with `vscode/askQuestions` in its list (batch 1); `injection.json` at 0.1.0 holds no entry acted upon
- [ ] The dry run refuses on ERR-REL-003 only; the candidate report is committed
- [ ] Progress reported: `sdd task set C002-T-082 --status done --commit <sha>`
