---
id: C002-T-084
title: "Fix for revisions D-056, D-057: the researcher's Context7 and DeepWiki probe in the shared doctor, init and researcher text, the pre-install warning of the Copilot install notes, the checklist, and both 0.1.0 candidates rebuilt"
change: CHG-002
phase: 20-plan
artifact: plan/task
milestone: C002-M-07
status: todo
depends_on: [C002-T-038, C002-T-079, C002-T-080, C002-T-082, C002-T-083]
implements: [C002-REQ-304, C002-REQ-504, C002-REQ-505, C002-REQ-507, C002-REQ-522, C002-REQ-614, C002-REQ-615, C002-REQ-623]
satisfies_ac: [C002-AC-304.1, C002-AC-504.1, C002-AC-505.1, C002-AC-507.1, C002-AC-522.1, C002-AC-614.1, C002-AC-615.1, C002-AC-623.1]
verified_by: [C002-TS-306, C002-TS-506, C002-TS-508, C002-TS-509, C002-TS-511, C002-TS-512, C002-TS-617, C002-TS-618, C002-TS-626, C002-TS-709, C002-TS-710, C002-TC-306, C002-TC-506, C002-TC-508, C002-TC-509, C002-TC-511, C002-TC-512, C002-TC-617, C002-TC-618, C002-TC-626, C002-TC-935, C002-TC-936]
components: [C002-COMP-002, C002-COMP-004, C002-COMP-009, C002-COMP-011, C002-COMP-014, C002-COMP-015, C002-COMP-016, C002-COMP-017, C002-COMP-019]
risk_refs: [C002-RISK-022, C002-RISK-031, C002-RISK-044, C002-RISK-045]
estimate: M
report: { commit: null, completed_at: null, notes: null }
---

# C002-T-084 — Fix for revisions D-056, D-057: the researcher's Context7 and DeepWiki probe in the shared doctor, init and researcher text, the pre-install warning of the Copilot install notes, the checklist, and both 0.1.0 candidates rebuilt

## Intent

Run 3 of C002-T-050 (2026-11-12, started 07:19 in `C:\Sandbox\runs\t050e`, candidate e89dae8) passed
every step but two findings of P-01's end batch. **D-056** (VSC-01, twin half): VS Code 1.145.2 offers
the Architect agents and prompt files of a registered package folder that has no `plugin.json`, so
checklist assumption A-3 is refuted; by P-01's answers to Q-t050-a3-01 and Q-t050-a3-02 the layout
stays and the install notes, the checklist and the record template follow C002-IF-005 §3 "Registered
before the install" and §5 step 3 (C002-REQ-304). **D-057** (VSC-12): the doctor gave the Context7 and
DeepWiki probe calls to `sdd-cartographer`, which holds neither server's tools on any host, so both
rows read `unreachable`; by P-01's answers to Q-t050-doctor-01 and Q-t050-doctor-02 the shared source
changes, on Claude Code too: `sdd-researcher` makes the two calls under a probe line of its own agent
body (C002-COMP-019), the cartographer records their outcomes, and the doctor maps each outcome to a
status and fix (C002-IF-006 §2.1; C002-REQ-504, C002-REQ-507, C002-REQ-522). This task brings the
shared source, the generator variants, the install notes, the schema copy, the README, the eval
runners' `mcpOverrides`, the doctor evals, the tests, the checklist, the record template and the
T-050 run sheet to the revised spec, rebuilds both 0.1.0 candidates (Claude Code plugin and Copilot
package), and runs the unpaid release checks and the Claude Code doctor evals. The **conductor** runs
it, as it ran C002-T-082.

## Targets

| Kind | Target | Change |
|---|---|---|
| modify | `plugins/architect/agents/sdd-researcher.md` › body | the probe line of C002-COMP-019 (C002-IF-006 §2.1 step 1): a doctor or init probe brief is answered with the outcome lines only (`<server>: ok`, `<server>: failed: <error text as returned>`, `<server>: refused: <host text as returned>`, `<server>: not offered`), at most one call per server, a deferred tool loaded before `not offered` is reported, and no note is written; the `tools` list unchanged |
| modify | `plugins/architect/commands/doctor.md` › step 2 (Probe), step 3 (Report), the Context7 and DeepWiki rows of the remedies table | step 2 as C002-IF-006 §2.1 steps 1 and 2: first dispatch `sdd-researcher` with the probe brief (Context7 `resolve-library-id` with a short library name, DeepWiki `read_wiki_structure` on `oraios/serena`); then `sdd-cartographer` as today, with the two lines in its brief and no call to either server. Step 3: the two remote rows take status and fix from the researcher's line by the table of §2.1 step 3 (`ok`; `failed` → `unreachable`, `check network; endpoint <endpoint>`; `not offered` → `untested` with the two-cause fix; `refused` → `untested`, `allow the <server> tools for the researcher`; no line → `untested`, `no probe outcome from the researcher; run the doctor again`). Remedies table: each row carries those fixes, the endpoint staying the first code span of the fix cell (the C001-TS-1116 test reads the first code span) |
| modify | `plugins/architect/commands/init.md` › step 3 | the toolchain record takes Context7 and DeepWiki from the same researcher probe, dispatched before the cartographer, with the two lines in the cartographer's brief (C002-IF-006 §2.1; C002-REQ-507); the baseline survey and the inventory stubs unchanged |
| modify | `plugins/architect/skills/code-discovery/SKILL.md` › Toolchain record | Context7 and DeepWiki detected `yes` for the researcher's `ok` line in the brief and `no` otherwise, with endpoint and fallback, no longer "when their tools load" (C002-COMP-016 as revised) |
| modify | `plugins/architect/targets/copilot.json`, `plugins/architect/targets/opencode.json` › anchors `doctor-probe`, `doctor-report`, `code-discovery-toolchain` | the anchor lines follow the new source text verbatim (C002-IF-001 §2.1) |
| modify | `plugins/architect/targets/copilot/wiring/doctor-probe.md`, `doctor-report.md`, `code-discovery-toolchain.md`; the same three files under `plugins/architect/targets/opencode/wiring/` | the researcher probe, the outcome table and the fixes of C002-IF-006 §2.1 as the source states them, in each host's agent-start and tool names; the host, sdd CLI and Copilot hooks rows and the OpenCode `.sdd/` test without `glob` unchanged. The researcher's agent file and `init.md` have no variant: the constructs translate them (§2.1 Where the text lives) |
| modify | `plugins/architect/targets/copilot/install.md` › the install list (line 52) and step 3 (lines 63–65) | line 52: `plugin.json` and `hooks.json` are written into the package folder, without "which make the folder a plugin"; step 3: VS Code loads the folder as soon as it is registered in `chat.pluginLocations`, also before the install, and its Architect agents, prompt files and skills then run with no guard hook; where the folder was registered before the install, use no Architect agent, prompt file or skill in that window until the install has run and the window is reloaded; reload after each later install that changes `hooks.json` (C002-IF-005 §5 step 3; C002-REQ-304, C002-TS-306) |
| modify | `plugins/architect/targets/mapping-table.schema.json` › `placement.plugin_manifest.description` (line 73) | identical to the spec copy `10-spec/50-interfaces/mapping-table.schema.json`; `tests/integration/contracts/schema-copies.test.ts` stays green |
| modify | `plugins/architect/README.md` › Troubleshooting, and the Copilot VS Code section where it repeats the install-notes sentence | rows for `Doctor: Context7 untested` and `Doctor: DeepWiki untested` (the three causes and their fixes), the `unreachable` rows saying "a probe call reached the server and failed"; the Copilot section's settings sentence as in the install notes (C001-TS-1116 green) |
| modify | the eval runners and `evals/harness/overlay.mjs` (new or extended) › case field `mcpOverrides` | `{ <server>: <url> \| false }` on every host (C002-IF-010 §2.1): OpenCode `"enabled": false` for `false`, URL replaced otherwise; Copilot CLI the entry left out of the `--additional-mcp-config` servers file; Claude Code a temporary overlay copy of the plugin whose `.mcp.json` has the URL replaced or the server removed; an undeclared server name ends the row with exit code 1 before any session; unit tests offline |
| add | `evals/harness/stub-mcp.mjs` | a loopback HTTP MCP stub listing the DeepWiki tools, with the two failures of C002-TS-709 (`isError` result; JSON-RPC error `-32603`), started and stopped by the case; its unit test drives the request handler in process, without a socket (`tests/no-network.mjs`) |
| add | `evals/targets/doctor/TS-709.eval.mjs` (C002-TC-935), `evals/targets/doctor/TS-710.eval.mjs` (C002-TC-936) | one case per Examples row: TS-709 through `mcpOverrides` with the stub URL; TS-710 through `mcpOverrides` `false` and the rows with the URL of `cfg-deepwiki-down`; each case first checks the Given line on the researcher's tool list (deferred tools included) and fails its set-up, not the doctor, when the list does not match |
| modify | `evals/targets/doctor/TS-506.eval.mjs`, `TS-509.eval.mjs`, `TS-511.eval.mjs`, `TS-512.eval.mjs`, `doctor-cases.mjs` | TS-506: the four Examples rows (with and without `.sdd/`), Context7 and DeepWiki `ok` with an empty Fix, one call each by `sdd-researcher`, and the `written` column (only `toolchain.md`, or no file); TS-509: the Claude Code row "cfg-full with no `sdd` on PATH" expects `completed`, and the rows "the researcher's DeepWiki probe call fails" (Claude Code, OpenCode; `mcpOverrides` to the stub) and "the researcher is offered no Context7 tool" (OpenCode; `mcpOverrides` `false`); TS-511: detected `yes` with endpoints; TS-512: the outline with the OpenCode and Claude Code rows, the researcher's two calls and no Context7 or DeepWiki call by any other agent |
| modify | `evals/cap11/TS-1112.eval.mjs` › row `deepwiki-down` | DeepWiki expected `untested` with the `not offered` fix of C002-IF-006 §2.1 in place of `unreachable`, the outcome staying `completed with warnings` (C002-TS-626, the changed expectation named there); `cfg-deepwiki-down` in `evals/harness/machines.mjs` unchanged (its unresolvable URL is the blocked endpoint of C002-TS-710) |
| modify | `tests/integration/cap05/doctor-variants.test.ts` | the C002-REQ-506 test pins the new Claude Code doctor (eight rows, the minimum-version row, the three outcome lines, a new SHA-256 named as a changed expectation under C002-REQ-504 in the task report); on the source and on each generated package in each mode: step 2 dispatches `sdd-researcher` before `sdd-cartographer`; the cartographer's brief carries the lines and makes no Context7 or DeepWiki call; step 3 and the remedies rows carry the five outcomes of §2.1 step 3 with their exact fix texts; `init.md` step 3 and its generated prompt carry the same probe; the toolchain record item names the researcher's outcome and no longer "when their tools load"; the researcher's agent file and each generated copy carry the probe line |
| add or modify | a tool-grant assertion (in `doctor-variants.test.ts` or the existing agent tests) | on every host the researcher holds both servers' tools and the cartographer neither (C002-IF-005 §4); the researcher's `tools` list unchanged |
| modify | `tests/integration/cap03/package.test.ts` › C002-TC-306 | the settings step's pre-install warning; the install list without "make the folder a plugin" |
| modify | `docs/checklists/vscode-copilot.md` › row A-3 (line 223), VSC-01 Expect (lines 247–248), VSC-12 and VSC-13 | **A-3:** refuted on VS Code 1.145.2 (defect D-056; P-01's answers to Q-t050-a3-01, Q-t050-a3-02), with the pre-install window of C002-IF-005 §3 and a history note keeping the old statement. **VSC-01 Expect:** no `plugin.json` and no `hooks.json` at the package root yet, and the agent picker and the slash-command list offer the Architect agents and prompt files (C002-IF-009 §4 VSC-01 row); Record keeps what they show and, for the twin, its only `chat.pluginLocations` entry, no user prompt file and no other plugin; Do adds "use no Architect entry before the install". **VSC-13:** Do names the precondition of C002-TS-508 (`context7` and `deepwiki` of `.vscode/mcp.json` enabled, network access); Expect adds the two rows `ok` with an empty Fix; Record keeps both rows. **VSC-12:** the doctor run that `/architect:doctor` starts shows the same two rows `ok`, kept in Record. Step IDs, groups, modes and the step index unchanged |
| modify | `docs/checklists/records/TEMPLATE.md` | the A-3 row refuted with its reason; the VSC-01, VSC-12 and VSC-13 placeholders as above; a Notes section for a targeted retake as C002-IF-009 §4 "Targeted retake after a revision" lists it (the earlier run's results of the retaken steps with the defect or changed file behind each, both candidates, both run folders, the comparison with every changed file's SHA-256 on both sides and the fix that touches it), and a `note` placeholder for a step not retaken that cites the earlier run by run folder, candidate and date |
| modify | `tests/integration/cap06/checklist.test.ts` | C002-TC-617 and the template checks of C002-TC-618 for the rows above |
| modify | `docs/runsheets/T-050-vscode-checklist.md` | (a) banner: run 3 (2026-11-12 07:19, `t050e`, e89dae8) passed all steps but VSC-01 (twin half, D-056) and VSC-12 (D-057), no record written; P-01's answer to Q-t050-retake-01; (b) a section **Targeted retake** with C002-T-050 step 0: the usage audit of run 3, the comparison with its expected file list, the retake order, the twin in profile `t050-twin` under `C:\Sandbox\runs\t050f\twin`, the record rules of C002-IF-009 §4; (c) the Package line names this task's candidate commit (filled at step 7) beside e89dae8; (d) the settings check before the retake |
| add | `docs/releases/copilot/0.1.0/T-084-candidate-report.md` | the record of step 9 |
| modify | generator golden or snapshot copies that hold the doctor, init, researcher or cartographer text (whatever `npm test` reports as changed) | regenerated; each changed expectation named with its REQ in the task report (C002-REQ-623) |

## Preconditions

- The G2 and G3 approvals of the revision for D-056 and D-057 (C002-REQ-304, C002-REQ-504,
  C002-REQ-505, C002-REQ-507, C002-REQ-522, C002-REQ-615, C002-REQ-618, C002-REQ-623, C002-TS-306,
  C002-TS-506, C002-TS-508, C002-TS-509, C002-TS-511, C002-TS-512, C002-TS-626, C002-TS-709,
  C002-TS-710, C002-COMP-019, C002-IF-005 §3 and §5, C002-IF-006 §2 and §2.1, C002-IF-001 §2.1,
  C002-IF-009 §4 and §5, C002-IF-010 §2.1 and C002-DOD-022 as revised).
- C002-T-082 and C002-T-083 done (candidate e89dae8, local tag `v0.1.0` at e89dae8).
- P-01's answers of 2026-11-12 and the conductor's decisions of 2026-11-13 logged
  (`../questions-log.md`, round "2026-11-12 — C002-T-050 run 3 end batch").
- REF-WIN with Node.js 22.22.3, PowerShell 7, Git Bash, Developer Mode on; Claude Code at its tested
  version for the `--auth subscription` sessions; VS Code 1.145.2 with Copilot Chat 0.73.0 for
  `sdd host-version vscode`.
- **Spend:** no OpenRouter session (the OpenCode rows go to CHG-003, conductor's decision on
  Q-t084-opencode-01); no Copilot CLI session (Q-t084-copilot-cli-01; Copilot pool 13.14 of 30 USD,
  C002-T-076's 15.00 USD stop untouched); the Claude Code sessions of step 8 on P-01's Max plan
  (`--auth subscription`), 13 sessions, about 4 … 5 USD notional, inside the pacing limits of P-01's
  standing rules.

## Step outline (no production code)

1. **Baseline copy.** Before any rebuild, copy e89dae8's `dist/architect-copilot-0.1.0.zip`,
   `dist/architect-sdd-0.1.0.tgz`, `dist/architect-0.1.0.zip` and `dist/architect-0.1.0-plugin.zip`
   with their SHA-256 to `C:\Sandbox\runs\t050f\e89dae8\`. If `dist/` no longer holds e89dae8's
   artifacts, rebuild them from a clean checkout of e89dae8 in a temporary folder outside the
   repository and check their SHA-256 against T-082's candidate report.
2. **Tests first.** Change `doctor-variants.test.ts`, `package.test.ts` (C002-TC-306),
   `checklist.test.ts` and the tool-grant assertion as the Targets table says; write the
   `mcpOverrides` unit tests, the stub's in-process test and the TS-709 and TS-710 case files. They
   fail against the current code and text.
3. **Runners.** Add `mcpOverrides` with `<url> | false` to the three runners (Claude Code through the
   overlay copy), with the exit code 1 for an undeclared server.
4. **Shared source.** Edit the researcher's probe line, `doctor.md` steps 2 and 3 and its two remedies
   rows, `init.md` step 3 and the toolchain-record item of the code-discovery skill; then the README
   Troubleshooting rows; `npm test -- cap11/TS-1116` green.
5. **Variants, tables, install notes, schema copy.** Update the three anchors in both tables and the
   six wiring files; check with the plugin structure check that no Claude Code construct is left in a
   generated file (PLG-VAR-001, the stand-in detectors). Edit `targets/copilot/install.md` line 52
   and step 3; make `targets/mapping-table.schema.json` line 73 identical to the spec copy.
6. **Checklist, template, run sheet.** As the Targets table says; no step added or removed, step IDs
   kept (C002-IF-009 §5 step check). The run sheet's retake section lists the expected changed files
   of step 7 and the steps of C002-T-050 step 0.
7. **Package, check and candidate.** `npm run package`, then `npm run check` (the CHG-001 approval
   tests excepted only where C002-T-082 step 5 still excepts them); update the golden copies and list
   them. **Comparison against the baseline of step 1**, file by file by SHA-256 over the unpacked
   artifacts (C002-IF-009 §4 Targeted retake after a revision, condition 3, for the Copilot package
   and the tarball; CR-103 for the Claude Code zips):
   - Copilot zip: exactly `INSTALL.md`, `prompts/doctor.prompt.md`, `prompts/init.prompt.md`,
     `skills/code-discovery/SKILL.md`, `agents/sdd-cartographer.agent.md` (the inlined toolchain item
     only), `agents/sdd-researcher.agent.md` (the probe line only) and `architect-target.json`, with
     no file added or removed;
   - Claude Code plugin zip and full zip: exactly `commands/doctor.md`, `commands/init.md`,
     `skills/code-discovery/SKILL.md`, `agents/sdd-researcher.md` and `README.md`;
   - `architect-sdd-0.1.0.tgz`: no file differs.
   Any other difference stops the task and goes to the conductor. **Release-candidate commit:**
   commit; `plugin.json` gives 0.1.0. Report `git diff --stat e89dae8 <candidate> --
   plugins/architect/`. **Local tag:** move `v0.1.0` from e89dae8 to the candidate (`git tag -f`,
   local only; pushing and every publication stay P-01's). Fill the candidate commit into the run
   sheet's Package line.
8. **Unpaid steps, then the Claude Code doctor evals.** At the candidate: the `sdd-mcp-server` and
   `copilot-hooks` replays under Git Bash and PowerShell 7 on `win32`, 0 differing, reports under
   `docs/releases/copilot/0.1.0/`; `dist/` equal to a regeneration; `sdd host-version vscode` prints
   `vscode 1.145.2` and `copilot-chat 0.73.0`. Then, label `c002-t084`, `--auth subscription`, one
   session per row, at most one rerun after a failure (DOD-G-01 waiver), 13 sessions: C002-TC-506
   (2 Claude Code rows), C002-TC-509 (2: no `sdd` on PATH; the DeepWiki probe call fails),
   C002-TC-511 (1), C002-TC-512 (the Claude Code init row, 1), C002-TC-935 (2), C002-TC-936 (3:
   Context7 `false`, DeepWiki `false`, the `cfg-deepwiki-down` URL), C001-TC-1112 `deepwiki-down` (1)
   and `evals/cap11/doctor-no-ripwire.eval.mjs` (regression-set §5 row 1, 1). A file written by
   `sdd-researcher`, or a second failure of a row, reopens this task and goes to the conductor.
9. **Dry run and report.** `node scripts/release-check.mjs --target copilot --dry-run` at the
   candidate refuses on ERR-REL-003 only (the record of C002-T-050). Report in
   `docs/releases/copilot/0.1.0/T-084-candidate-report.md`: both commits of the tag move; the three
   comparison results of step 7, each changed file with its SHA-256 on both sides and the fix that
   touches it (C002-T-050 copies this into its record's Notes); the `plugins/architect/` diff; the
   changed golden copies with their REQ; the unpaid results; each Claude Code session with its result
   file and notional cost; the dry-run output; and the note that CHG-001's Claude Code 0.1.0 evidence
   was taken on e89dae8's doctor, init and researcher text (`handoff.md`, CHG-001 impact).

## Verification

- `npm test -- cap05/doctor-variants`, `npm test -- cap03/package`, `npm test -- cap06/checklist`, `npm test -- cap11/TS-1116`, `npm test -- contracts/schema-copies`, and the unit tests of `mcpOverrides` and the stub
- `npm run package`, `npm run check`; `npm run replay -- suite` (Git Bash and PowerShell 7)
- `node evals/harness/run.mjs --host claude-code --tier dev --auth subscription --label c002-t084 --task C002-T-084 --step 8 --only <row> <case file>` per row of step 8
- `node scripts/release-check.mjs --target copilot --dry-run` at the candidate

## Done when

- [ ] On Claude Code, OpenCode and Copilot the doctor's probe step and the init command's step 3 dispatch `sdd-researcher` for the two probe calls before `sdd-cartographer`, the cartographer gets the outcome lines and calls neither server, the Report step maps the five outcomes of C002-IF-006 §2.1 step 3 to their statuses and fixes, the toolchain record item reads the researcher's outcome, and the researcher's agent body carries the probe line with its `tools` list unchanged
- [ ] The three anchors and six wiring files of both targets follow the source; `npm run check` green; the C002-REQ-506 pin and every other changed expectation listed with its REQ
- [ ] The three runners take `mcpOverrides` with `<url> | false`; the TS-709 and TS-710 case files exist with all Examples rows; `TS-1112-deepwiki-down` expects `untested` with the `not offered` fix
- [ ] The Copilot install notes carry the pre-install warning and no "make the folder a plugin"; the target schema copy equals the spec copy; the README Troubleshooting covers every fix of both servers
- [ ] A-3 reads refuted, VSC-01 expects the entries shown, VSC-12 and VSC-13 expect Context7 and DeepWiki `ok`, the template and the run sheet carry the targeted retake; `npm test -- cap06/checklist` green
- [ ] The candidate holds this task's changes at 0.1.0; the three comparison results match step 7's lists exactly; the local tag `v0.1.0` points at the candidate (not pushed); `dist/` equals a regeneration; both replays 0 differing in both shells
- [ ] The 13 Claude Code rows of step 8 have `c002-t084` sessions that passed, and no researcher session wrote a file
- [ ] The dry run refuses on ERR-REL-003 only; the candidate report is committed
- [ ] Progress reported: `sdd task set C002-T-084 --status done --commit <sha>`
