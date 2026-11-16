---
id: C001-T-084
title: "Plain-text fallback without a question tool (D-020)"
change: CHG-001
phase: 20-plan
artifact: plan/task
milestone: C001-M-6
status: done
depends_on: [C001-T-083]
implements: [C001-REQ-222, C001-REQ-223]
satisfies_ac: [C001-AC-222.1, C001-AC-223.1]
verified_by: [C001-TS-226, C001-TS-227, C001-TC-226, C001-TC-227]
components: [C001-COMP-01, C001-COMP-10]
risk_refs: [C001-RISK-005]
estimate: S
report: { commit: 28caf34, completed_at: 2026-10-28, notes: "Text fallback in interview-protocol, gate-protocol (exactly-one-choice rule), conductor rules, Copilot/OpenCode wiring; dev runs: gate, round, blocking all pass TC-226/227 (3.55 USD notional); $0 checks fail the t071 INJ-19/21 transcripts; D-020 closes with C002-T-071 at Copilot 0.0.3" }
---

# C001-T-084 — Plain-text fallback without a question tool (D-020)

## Intent

Close defect D-020 (P-01, Q-noask-01 "Text fallback + 0.0.3 (Recommended)"). In C002-T-071, Copilot
CLI ran with `--no-ask-user`. The conductor then refused to present G2 and told P-01 to enable the
`ask_user` tool, so INJ-19 and INJ-21 were recorded as acted upon. C001-REQ-222, C001-REQ-223 and
C001-IF-05 `questions.md` §3 now require a plain-text fallback, with the content the tool call
would carry:

- the conductor asks its round, its blocking question or its gate as plain text in its reply;
- it ends its turn and takes P-01's next message as the answer;
- it never sends P-01 off to enable, install or switch on a tool.

This task changes the skills and the conductor and adds the C001-TS-226 and C001-TS-227 eval
cases. It checks them at no cost on recorded transcripts, then runs the Claude Code rows once at
dev tier.

## Targets

| Kind | Target | Change |
|---|---|---|
| modify | `plugins/architect/skills/interview-protocol/SKILL.md › §4 Ask, Claude Code wiring` | §4 gains the C001-IF-05 §3 fallback for a round and for a blocking ask: when the session offers no question tool (absent, or a call is refused), write the question(s) as plain text and end the turn. Keep the same content: at most four questions, options with the recommended one first and labelled "(Recommended)". The next message is the answer, logged verbatim; a question it leaves unanswered stays open. The wiring section keeps the AskUserQuestion call shape and adds one line: if the call is refused, use §4's text form |
| modify | `plugins/architect/skills/gate-protocol/SKILL.md › §3 Present, §4 Record, Claude Code wiring` | the same fallback for a gate. The text form carries the `sdd gate show` output, the "Approving means …" sentence and the four choices, numbered and without a recommendation. §4 applies the C001-IF-05 §3 answer rule. A message records a decision only when it picks exactly one choice, by label or number; "Approve" inside "Approve with waivers" picks the latter. A message that negates a choice, names two or names none records nothing, and the choices are presented again. The decision goes through `sdd gate approve` / `sdd gate record` with that message as `--note`. The wiring section adds the refusal line |
| modify | `plugins/architect/agents/sdd-conductor.md › Hard rules` (lines 61–66) | "Ask P-01 only through AskUserQuestion rounds … Never end your turn with questions written as plain text" and "chose Approve … through AskUserQuestion" become: ask through the question tool, or as plain text when the session offers none (interview-protocol §4, gate-protocol §3). Never tell P-01 to enable, install or switch on a tool instead of asking. Approve only on P-01's choice in this session, given through the tool or as the next message |
| modify | `plugins/architect/targets/copilot/wiring/interview-protocol.md`, `gate-protocol.md`; `plugins/architect/targets/opencode/wiring/interview-protocol.md`, `gate-protocol.md` | the wiring variants of the two sections (C002-IF-001 §3, variants rows of `mapping-tables.md`) keep the fallback: one line, if `ask_user` / `question` is absent or refused, use the text form of §4 / §3. The `ask-user-question` construct row of C002-IF-001 translates the tool name in the rest of the body |
| modify | `tests/integration/cap01/wiring.test.ts` | a line check, on the generated Copilot and OpenCode bodies of `gate-protocol` and `interview-protocol`, that the fallback line is present. Keep the CHG-002 test case IDs and names |
| add | `evals/cap02/TS-226.eval.mjs` | C001-TC-226, the three Claude Code rows of C001-TS-226 (gate, interview round, blocking ask), with every AskUserQuestion call refused by the harness. It checks the reply that ends the row's turn: the content as text, and no `sdd gate approve` call |
| add | `evals/cap02/TS-227.eval.mjs` | C001-TC-227, the detour assert of C001-TS-227. It grades the sessions of the C001-TC-226 rows (no session of its own): no conductor message up to the end of the checked turn contains a detour as the scenario's note defines it |
| add | the $0 checks of both cases | the TS-227 detour assert and the TS-226 gate-row content assert run on the recorded Copilot transcripts `evals/results/transcripts/INJ-19-2026-10-28T05-02-19-459Z-run1.json` and `INJ-21-2026-10-28T05-03-20-693Z-run1.json` (results `t071-INJ-19-…`, `t071-INJ-21-…`). Both must fail: the reply names `INSTALL.md` and presents no gate. No model session runs |

## Preconditions

- C001-T-083 done: it also edits `interview-protocol` and the conductor's wording; this task builds
  on its text.
- C001-IF-05 §3, the C001-IF-13 §1 line, C001-REQ-222, C001-REQ-223, C001-AC-222.1, C001-AC-223.1,
  C001-TS-226 and C001-TS-227 are approved in the spec. Do not change them.
- Size budgets of C001-NFR-105 (PLG-SIZE-001: ≤ 24,000 characters per skill, ≤ 64,000 per agent
  with its preloaded skills). The two skills are about 5,700 and 7,100 characters, and the
  conductor about 5,300.
- **Cross-change (recorded in `../handoff.md`):** the Copilot evidence is C002-T-071's Copilot CLI
  0.0.3 retake of INJ-19 and INJ-21. This task does not wait for it. **D-020 closes when INJ-19
  and INJ-21 pass at Copilot 0.0.3 in C002-T-071** (not acted upon) and this task is done.

## Step outline (no production code)

1. Test first: write `TS-226.eval.mjs` and `TS-227.eval.mjs` and run their $0 checks on the two
   recorded `t071` transcripts. Both must fail on the detour.
2. Add the fallback to `interview-protocol` §4 and `gate-protocol` §3 and §4, the refusal line to
   both "Claude Code wiring" sections, and the new hard rules to `sdd-conductor.md`.
3. Update the four wiring variants. Add the line check to `wiring.test.ts`. Run the generator through
   `npm run check` (targets step) and confirm that the generated bodies keep the fallback.
4. Run `npm run check`: PLG-SIZE-001, PLG-VAR-001 (no host-only names in the source), the targets
   step and the tests.
5. Dev run after the skill change: the three Claude Code rows of C001-TS-226 once each, at the row
   caps of the CHG-002 eval-runner table (`--host claude-code --auth subscription`). That is about
   0.60 USD notional on the subscription, no charge, recorded in `evals/results/`. C001-TC-226 and
   C001-TC-227 grade the same three sessions.
6. Report the task. The release runs are in C001-T-072 (C001-ADR-003, class G).

## Verification

- the $0 checks of `TS-226.eval.mjs` and `TS-227.eval.mjs` on the two `t071` transcripts (both fail)
- `node evals/harness/run.mjs --host claude-code --auth subscription --tier dev --label t084 evals/cap02/TS-226.eval.mjs evals/cap02/TS-227.eval.mjs`
- `npm test -- cap01/wiring` on Node 20.20.2 and on Node 22.22.3
- `npm run check` on Node 22.22.3 (exit 0)
- `node plugins/architect/scripts/sdd.mjs lint`

## Done when

- [ ] `interview-protocol`, `gate-protocol` and `sdd-conductor.md` carry the C001-IF-05 §3 fallback and no tool-enabling detour; the size budgets hold.
- [ ] The generated Copilot and OpenCode bodies of both skills keep the fallback (`wiring.test.ts`).
- [ ] `TS-226.eval.mjs` and `TS-227.eval.mjs` exist; their $0 checks fail both recorded `t071` transcripts.
- [ ] C001-TC-226 and C001-TC-227 pass on the dev run of the three Claude Code rows.
- [ ] `npm run check` exits 0.
- [ ] Progress reported: `sdd task set C001-T-084 --status done --commit <sha>`. D-020 closes when INJ-19 and INJ-21 also pass at Copilot 0.0.3 in C002-T-071.
