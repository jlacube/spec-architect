---
id: C001-T-083
title: "Ask a blocking question on arrival, templates through the CLI, candidates count (D-019)"
change: CHG-001
phase: 20-plan
artifact: plan/task
milestone: C001-M-6
status: done
depends_on: [C001-T-063]
implements: [C001-REQ-221, C001-REQ-1124, C001-REQ-213, C001-REQ-208]
satisfies_ac: [C001-AC-221.1, C001-AC-1124.1, C001-AC-213.2]
verified_by: [C001-TS-1126, C001-TC-1132]
components: [C001-COMP-01, C001-COMP-02, C001-COMP-09, C001-COMP-10, C001-COMP-12]
risk_refs: [C001-RISK-005]
estimate: M
report: { commit: 2a32f73, completed_at: 2026-10-24, notes: "TC-1132 7/7 (all failed before); C002-TC-107/127 pass with planted lines; arrival parse checks pass on synthetic transcripts and fail on the t082-d018 traces; npm run check exit 0 (Node 22, Node 20); replay sdd-mcp-server 683/26/0 both targets; skill sizes within budget (phase-ideation 9,296); eval passes and D-019 closure in C001-T-082" }
---

# C001-T-083 — Ask a blocking question on arrival, templates through the CLI, candidates count (D-019)

## Intent

Close defect D-019 (P-01, Q-t082-bugs-01 "Fix all 3 now (Recommended)"), found in the
hidden-budget reruns of C001-T-082. The three items:

1. **Blocking question held back.** The conductor held a blocking question back while a
   background specialist ran. C001-REQ-221 and C001-IF-05 `questions.md` §2 now require asking it
   when its hand-back arrives, before the turn ends and before another dispatch, in attended and
   unattended drafting.
2. **Template loop.** The spec-writer looped on templates because bodies name paths under
   `${CLAUDE_PLUGIN_ROOT}/templates/`. C001-REQ-1124 and C001-IF-08 `plugin-layout.md` §4 now
   require `sdd template show`, checked by PLG-TMPL-001.
3. **Candidate list.** The `sdd-conventions` material bullet led agents to give a list where
   C001-IF-05 wants the number of candidates.

## Targets

| Kind | Target | Change |
|---|---|---|
| modify | `plugins/architect/skills/phase-spec/SKILL.md › Unattended drafting, "Stop on a blocking question"` (about line 103) | the rule of C001-IF-05 §2: when a hand-back holding a `blocking: true` question arrives, ask it (an interview round) before ending the turn and before dispatching another specialist, without waiting for specialists still running. For what makes a question blocking, point to the blocking bullet of `sdd-conventions`; shipped skills cite skill sections, never CHG-001 spec IDs |
| modify | `plugins/architect/skills/interview-protocol/SKILL.md › §2 item 3 (Batch), §8 Unattended drafting` | the same §2 rule in both places, attended and unattended; §8 drops "when you reach a blocking question" for "when a hand-back with a blocking question arrives". Point to the blocking bullet of `sdd-conventions`, not to a spec ID |
| modify | `plugins/architect/skills/phase-spec/SKILL.md › step 2, attended` (line 41) | "Interview on the returned questions … before step 3 when they are blocking" becomes: when a hand-back with a blocking question arrives, ask it before the turn ends and before another dispatch (interview-protocol §2); non-blocking questions are batched as before |
| modify | `plugins/architect/skills/phase-ideation/SKILL.md › steps 3–4` (line 58, "Wait for all hand-backs") | collect `questions` blocks as the hand-backs arrive; a blocking question is asked on its arrival (interview-protocol §2), without waiting for the other hand-backs; the exit still needs every dispatched specialist handed back |
| add | `evals/fixtures/transcripts/ts225-pass.jsonl`, `ts215-pass.jsonl` | synthetic passing transcripts: the cartographer's hand-back with a blocking question arrives (`task_notification`) while the spec-writer runs, then an AskUserQuestion carrying it, no Agent call between, then the turn ends. A parse check runs the TS-225 and TS-215 assertions on them (pass) and on the recorded `t082-d018` traces (the observed failures), with no model session |
| modify | `plugins/architect/skills/phase-ideation/SKILL.md › new section "Specialist brief"`, line 55 | C001-IF-08 §4 item 2 (114b589): the content of `references/brief-template.md` becomes a section of this skill, and line 55 names that section. The return-contract line points to the blocking bullet of `sdd-conventions` instead of restating the old "only for what P-01 alone can decide" test. The skill grows from about 7,300 to about 9,400 characters, within the 24,000 budget |
| delete | `plugins/architect/skills/phase-ideation/references/brief-template.md` | inlined above; no body may name a `references/` path |
| modify | `plugins/architect/skills/phase-spec/SKILL.md` (line 38) | the briefs follow the "Specialist brief" section of `phase-ideation`, named by section. A session that has not loaded that skill loads it with the Skill tool. No file path |
| modify | `plugins/architect/skills/interview-protocol/SKILL.md` (line 17) | drop the link to `references/questions.schema.json`. The file stays as the byte copy of C001-IF-05 for the eval harness and its copy test; the field rules an agent needs are already in the `sdd-conventions` and `interview-protocol` bodies |
| modify | `plugins/architect/agents/sdd-spec-writer.md` (lines 17–19) | name templates as `sdd template show <profile>/<path>` and list them with `sdd template list <profile>` (C001-IF-08 §4) |
| modify | `plugins/architect/commands/decide.md` (line 18), `plugins/architect/commands/init.md` (line 25) | the same switch for the DEC, OA, ADR and constitution templates, naming the whole argument. DEC, OA and ADR always use the `full` profile, whatever the change's profile, because they exist only there (for example `sdd template show full/00-ideation/decisions/DEC-{{SEQ}}-{{SLUG}}.md`; C001-IF-08 §4 item 1) |
| modify | `plugins/architect/skills/sdd-conventions/SKILL.md › Return contract, material bullet` | "`candidates_considered`: the number of candidates (4 or 5)" |
| add | `scripts/check/tmpl.mjs` | PLG-TMPL-001 (C001-IF-08 §3 rule table, §4 as widened in 114b589). One error, with file and line, for each body line of an agent, command or skill that contains any of these: a `${CLAUDE_PLUGIN_ROOT}/` path other than `${CLAUDE_PLUGIN_ROOT}/scripts/sdd.mjs`; a path containing `references/`; a relative link target that resolves to a file of the plugin. A `sdd template show` line is not a finding. `hooks/hooks.json` and `.mcp.json` are not bodies. Registered with the plugin checks in `scripts/check/run.mjs` |
| add | fixtures of PLG-TMPL-001 in `tests/integration/cap11/TS-1126.test.ts` | plugin copies made with `pluginCopy` (`tests/integration/cap11/structure.ts`), as the other PLG rule tests do. There is one copy per Examples row of the C001-TS-1126 outline (7 rows, c9e58ef): a template path under the plugin root, another plugin-root path, a `references/` path, a relative link into the plugin, the CLI path only, a template through the CLI, and `hooks/hooks.json`. Each row has its file and added line and expects exactly that row's findings |
| add | `tests/integration/cap11/TS-1126.test.ts` | C001-TC-1132 (holds the fixtures above) |
| add | `evals/cap02/TS-225.eval.mjs` | C001-TC-225, built like `evals/cap02/TS-215.eval.mjs` but attended ("Draft the spec of CHG-001."). The terms of the C001-AC-221.1 note are read from the transcript: hand-back, arrives (`task_notification` for an async call, the tool result that is not a launch notice for a sync call), still running, carries, the conductor's turn ends. Pass: an AskUserQuestion call carrying the blocking question after the arrival and before the turn ends, with no Agent call between. A run whose Given does not hold is reported as "Given not met" with `valid_run` false, not as a conductor failure (C001-AC-221.1 note; the replacement rule is applied by the runner of C001-T-082 and C001-T-072) |
| modify | `evals/cap02/TS-215.eval.mjs` | checks of the revised C001-TS-215: the same arrival-to-ask checks and "Given not met" reporting as TS-225, in unattended drafting, with the spec-writer still running at the arrival |
| modify | `tests/integration/cap01/constructs.test.ts` › C002-TC-107, C002-TC-127 rows | C002-REQ-115 check: the shipped sources no longer hold template paths, so the rows that read `agents/sdd-spec-writer.md:19`, `commands/decide.md:18` and `commands/init.md:25` plant those lines in fx-src (the on-disk copy) instead. The generator rewrite stays tested. Keep the CHG-002 test case IDs and names |
| modify (only if they hold the shipped template lines) | `tests/fixtures/targets/*.json` | regenerated expected outputs after the source switch |
| modify | `plugins/architect/scripts/sdd.mjs` | rebuilt bundle, only if a `src/` file changed |

## Preconditions

- C001-T-063 done: the D-013 rework of `evals/cap02/TS-215.eval.mjs` exists.
- `sdd template show` and `sdd template list` exist (C002-REQ-513, C002-REQ-520).
- C001-IF-05 §1 and §2, C001-IF-08 §4, C001-REQ-221, C001-REQ-1124 and the revised C001-TS-215 are
  approved in the spec. Do not change them.
- Size budgets of C001-NFR-105 (PLG-SIZE-001: ≤ 24,000 characters per skill, ≤ 64,000 per agent
  with its preloaded skills). `sdd-conventions` and `interview-protocol` are preloaded widely, so
  the edits replace text and add as little as possible.
- `tests/integration/cap01/constructs.test.ts` and `tests/fixtures/targets/` come from CHG-002.
  Change them only as the Targets say.

## Step outline (no production code)

1. Test first: `TS-1126.test.ts` with its plugin-copy fixtures. Watch the check fail on the shipped
   plugin (six body lines today: template paths in `sdd-spec-writer.md`, `decide.md` and `init.md`;
   `references/` paths in `phase-ideation`, `phase-spec` and `interview-protocol`, the last one also a
   relative link).
2. Switch `sdd-spec-writer.md`, `decide.md` and `init.md` to `sdd template show`, inline the brief
   template into `phase-ideation`, and drop the schema link. The shipped plugin
   then passes PLG-TMPL-001. Rework the C002-TC-107 and C002-TC-127 rows to plant the template
   lines in fx-src. Regenerate `tests/fixtures/targets/*.json` if they hold those lines.
3. Rewrite the conductor wording and the `sdd-conventions` material bullet:
   - phase-spec step 2 and the unattended "Stop on a blocking question";
   - phase-ideation steps 3–4;
   - interview-protocol §2 and §8;
   - the brief template.

   Every shipped text points to the blocking bullet of `sdd-conventions` and to interview-protocol §2,
   never to a CHG-001 spec ID.
4. Write `evals/cap02/TS-225.eval.mjs` and revise `TS-215.eval.mjs`. Build the two synthetic passing
   transcripts. The parse check must pass both and must reproduce the observed failure on the
   recorded `t082-d018` traces. Those sessions count as no runs (CHG-002 handoff, D-033). No model
   session runs in this task.
5. Run `npm run check`: PLG-TMPL-001, PLG-SIZE-001, the targets step and the tests.
6. Report the task with the commit of steps 1–5. The paid eval runs of C001-TC-225, 215, 213 and
   223, and the closure of D-019, are in C001-T-082 (step 4 and its Done when). If those runs show a
   wording problem, this task reopens.

## Verification

- `npm test -- cap11/TS-1126 cap01/constructs` on Node 20.20.2 and on Node 22.22.3
- the parse check of the TS-225 and TS-215 assertions on the synthetic and the recorded transcripts (pass on the synthetic, fail on the recorded)
- `node scripts/check.mjs --steps structure,targets` (PLG-TMPL-001 and PLG-SIZE-001 report nothing on the shipped plugin)
- `npm run check` on Node 22.22.3 (exit 0)
- `node plugins/architect/scripts/sdd.mjs lint`

## Done when

- [ ] No agent, command or skill body names a plugin file to read (C001-IF-08 §4); `references/brief-template.md` is inlined and deleted; PLG-TMPL-001 and C001-TC-1132 pass.
- [ ] C002-TC-107 and C002-TC-127 pass with the template lines planted in fx-src (C002-TS-107 and C002-TS-127 as revised in b82aaad).
- [ ] The TS-225 and TS-215 assertions pass on the synthetic transcripts and fail on the recorded `t082-d018` traces.
- [ ] The conductor wording asks a blocking question on arrival and points to the `sdd-conventions` blocking bullet; the material bullet asks for the number of candidates; the size budgets hold.
- [ ] Progress reported: `sdd task set C001-T-083 --status done --commit <sha>`. D-019 is closed from C001-T-082.
