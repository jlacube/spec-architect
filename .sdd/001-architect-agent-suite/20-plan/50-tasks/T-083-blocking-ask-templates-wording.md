---
id: C001-T-083
title: "Ask a blocking question on arrival, templates through the CLI, candidates count (D-019)"
change: CHG-001
phase: 20-plan
artifact: plan/task
milestone: C001-M-6
status: todo
depends_on: [C001-T-063]
implements: [C001-REQ-221, C001-REQ-1124, C001-REQ-213, C001-REQ-208]
satisfies_ac: [C001-AC-221.1, C001-AC-1124.1, C001-AC-213.2]
verified_by: [C001-TS-225, C001-TS-1126, C001-TS-215, C001-TC-225, C001-TC-1132, C001-TC-215, C001-TC-213, C001-TC-223]
components: [C001-COMP-01, C001-COMP-02, C001-COMP-09, C001-COMP-10, C001-COMP-12]
risk_refs: [C001-RISK-005]
estimate: M
report: { commit: null, completed_at: null, notes: null }
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
| modify | `plugins/architect/skills/phase-spec/SKILL.md › Unattended drafting, "Stop on a blocking question"` (about line 103) | the C001-IF-05 §2 rule: when a hand-back holding a `blocking: true` question arrives, ask it (an interview round) before ending the turn and before dispatching another specialist, without waiting for specialists still running. Cite C001-IF-05 §1 for what makes a question blocking instead of restating a test |
| modify | `plugins/architect/skills/interview-protocol/SKILL.md › §2 item 3 (Batch), §8 Unattended drafting` | the same §2 rule in both places, attended and unattended; §8 drops "when you reach a blocking question" for "when a hand-back with a blocking question arrives (C001-IF-05 §2)" |
| modify | `plugins/architect/skills/phase-ideation/references/brief-template.md › return contract line` | the brief cites C001-IF-05 §1 for the `blocking` flag instead of restating the old "only for what P-01 alone can decide" test |
| modify | `plugins/architect/agents/sdd-spec-writer.md` (lines 17–19) | name templates as `sdd template show <profile>/<path>` and list them with `sdd template list <profile>` (C001-IF-08 §4) |
| modify | `plugins/architect/commands/decide.md` (line 18), `plugins/architect/commands/init.md` (line 25) | the same switch for the DEC, ADR and constitution templates, naming the whole argument (for example `sdd template show full/00-ideation/decisions/DEC-{{SEQ}}-{{SLUG}}.md`) |
| modify | `plugins/architect/skills/sdd-conventions/SKILL.md › Return contract, material bullet` | "`candidates_considered`: the number of candidates (4 or 5)" |
| add | `scripts/check/tmpl.mjs` | PLG-TMPL-001 (C001-IF-08 §3 rule table, §4): error for each line of an agent, command or skill body that names a path under `${CLAUDE_PLUGIN_ROOT}/templates/`, with file and line; a `sdd template show` line is not a finding. Registered with the plugin checks in `scripts/check/run.mjs` |
| add | fixtures of PLG-TMPL-001 in `tests/integration/cap11/TS-1126.test.ts` | plugin copies made with `pluginCopy` (`tests/integration/cap11/structure.ts`), as the other PLG rule tests do: the C001-TS-1126 copy (a template path and a `sdd template show` line in `agents/sdd-spec-writer.md`), a command body and a skill body with a template path (one finding each), and the unchanged shipped plugin (no finding) |
| add | `tests/integration/cap11/TS-1126.test.ts` | C001-TC-1132 (holds the fixtures above) |
| add | `evals/cap02/TS-225.eval.mjs` | C001-TC-225, built like `evals/cap02/TS-215.eval.mjs` but attended ("Draft the spec of CHG-001."). The terms of the C001-AC-221.1 note are read from the transcript: hand-back, arrives (`task_notification` for an async call, the tool result that is not a launch notice for a sync call), still running, carries, the conductor's turn ends. Pass: an AskUserQuestion call carrying the blocking question after the arrival and before the turn ends, with no Agent call between |
| modify | `evals/cap02/TS-215.eval.mjs` | checks of the revised C001-TS-215: the same arrival-to-ask checks as TS-225 in unattended drafting, with the spec-writer still running at the arrival |
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
   plugin (three bodies name template paths).
2. Switch `sdd-spec-writer.md`, `decide.md` and `init.md` to `sdd template show`. The shipped plugin
   then passes PLG-TMPL-001. Rework the C002-TC-107 and C002-TC-127 rows to plant the template
   lines in fx-src. Regenerate `tests/fixtures/targets/*.json` if they hold those lines.
3. Rewrite the conductor wording (phase-spec, interview-protocol §2 and §8, brief template) and the
   `sdd-conventions` material bullet.
4. Write `evals/cap02/TS-225.eval.mjs` and revise `TS-215.eval.mjs`. Check both on a recorded
   transcript (the 2026-10-24 `t082-d018` traces) so that the arrival and turn-end parsing works
   before any paid run. Those sessions count as no runs (CHG-002 handoff, D-033).
5. Run `npm run check`: PLG-TMPL-001, PLG-SIZE-001, the targets step and the tests.
6. The eval runs of C001-TC-225, 215, 213 and 223 are made in C001-T-082 step 4, at the 3.00 USD
   rule-1 cap of C002-T-070. This task reports with the commit of steps 1–5. If those runs show a
   wording problem, this task reopens.

## Verification

- `npm test -- cap11/TS-1126 cap01/constructs` on Node 20.20.2 and on Node 22.22.3
- `node scripts/check.mjs --steps structure,targets` (PLG-TMPL-001 and PLG-SIZE-001 report nothing on the shipped plugin)
- `npm run check` on Node 22.22.3 (exit 0)
- `node plugins/architect/scripts/sdd.mjs lint`

## Done when

- [ ] No agent, command or skill body names a path under `${CLAUDE_PLUGIN_ROOT}/templates/`; PLG-TMPL-001 and C001-TC-1132 pass.
- [ ] The conductor wording follows C001-IF-05 §2 and cites §1; the material bullet asks for the number of candidates; the size budgets hold.
- [ ] `evals/cap02/TS-225.eval.mjs` exists and `TS-215.eval.mjs` checks the revised scenario; both parse the recorded `t082-d018` transcripts.
- [ ] C002-TC-107 and C002-TC-127 still pass with the planted lines.
- [ ] All test cases in `verified_by` pass at the tier required by C001-ADR-003; the eval cases through C001-T-082 step 4.
- [ ] Progress reported: `sdd task set C001-T-083 --status done --commit <sha>`. That commit and the C001-T-082 step 4 results are the resolution evidence for closing D-019.
