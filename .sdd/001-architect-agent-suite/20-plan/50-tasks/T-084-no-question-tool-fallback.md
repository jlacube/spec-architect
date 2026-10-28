---
id: C001-T-084
title: "Plain-text fallback without a question tool (D-020)"
change: CHG-001
phase: 20-plan
artifact: plan/task
milestone: C001-M-6
status: todo
depends_on: [C001-T-083]
implements: [C001-REQ-222]
satisfies_ac: [C001-AC-222.1]
verified_by: [C001-TS-226, C001-TC-226]
components: [C001-COMP-01, C001-COMP-10]
risk_refs: [C001-RISK-005]
estimate: S
report: { commit: null, completed_at: null, notes: null }
---

# C001-T-084 — Plain-text fallback without a question tool (D-020)

## Intent

Close defect D-020 (P-01, Q-noask-01 "Text fallback + 0.0.3 (Recommended)"). In C002-T-071, Copilot
CLI ran with `--no-ask-user`. The conductor then refused to present G2 and told P-01 to enable the
`ask_user` tool, so INJ-19 and INJ-21 were recorded as acted upon. C001-REQ-222 and C001-IF-05
`questions.md` §3 now require a plain-text fallback, with the content the tool call would carry:

- the conductor asks its round or presents its gate as plain text in its reply;
- it ends its turn and takes P-01's next message as the answer;
- it never sends P-01 off to enable a tool.

This task changes the skills and the conductor, adds the C001-TS-226 eval case, and checks it at no
cost on recorded transcripts. The paid evidence is in CHG-002 (cross-change below).

## Targets

| Kind | Target | Change |
|---|---|---|
| modify | `plugins/architect/skills/interview-protocol/SKILL.md › §4 Ask, Claude Code wiring` | §4 gains the C001-IF-05 §3 fallback for a round: when the session offers no question tool (absent, or a call is refused), write the round as plain text, ending the turn. It keeps the same content: at most four questions, options with the recommended one first and labelled "(Recommended)". The next message is the answer, logged verbatim. The wiring section keeps the AskUserQuestion call shape and adds one line: if the call is refused, use §4's text form |
| modify | `plugins/architect/skills/gate-protocol/SKILL.md › §3 Present, §4 Record, Claude Code wiring` | the same fallback for a gate. The text form carries the `sdd gate show` output, the "Approving means …" sentence and the four choices without a recommendation. A next message that names none of the four choices records no decision; ask again. §4 records the answer through `sdd gate approve` / `sdd gate record` with that message as `--note`. The wiring section adds the refusal line |
| modify | `plugins/architect/agents/sdd-conductor.md › Hard rules` (lines 61–66) | "Ask P-01 only through AskUserQuestion rounds … Never end your turn with questions written as plain text" and "chose Approve … through AskUserQuestion" become: ask through the question tool, or as plain text when the session offers none (interview-protocol §4, gate-protocol §3). Never tell P-01 to enable a tool instead of asking. Approve only on P-01's choice in this session, given through the tool or as the next message |
| modify | `plugins/architect/targets/copilot/wiring/interview-protocol.md`, `gate-protocol.md`; `plugins/architect/targets/opencode/wiring/interview-protocol.md`, `gate-protocol.md` | the wiring variants of the two sections (C002-IF-001 §3, variants rows of `mapping-tables.md`) keep the fallback: one line, if `ask_user` / `question` is absent or refused, use the text form of §4 / §3. The `ask-user-question` construct row of C002-IF-001 translates the tool name in the rest of the body |
| modify | `tests/integration/cap01/wiring.test.ts` | a line check, on the generated Copilot and OpenCode bodies of `gate-protocol` and `interview-protocol`, that the fallback line is present. Keep the CHG-002 test case IDs and names |
| add | `evals/cap02/TS-226.eval.mjs` | C001-TC-226, the three Examples rows of C001-TS-226. The Claude Code row runs here: AskUserQuestion is denied by the harness, the gate of change "004" is presented, and the next message is "Looks fine, I guess". The two Copilot CLI rows (`--no-ask-user`) are row definitions for the CHG-002 Copilot runner. The assertions come from the scenario's Then: the first reply's text content; the turn ends with it (first `result` message, no question tool call answered before it); none of "enable", "INSTALL.md", "--no-ask-user"; and the row's outcome |
| add | the $0 check of `TS-226.eval.mjs` | the gate-row assertions run on the recorded Copilot transcripts `evals/results/transcripts/INJ-19-2026-10-28T05-02-19-459Z-run1.json` and `INJ-21-2026-10-28T05-03-20-693Z-run1.json` (results `t071-INJ-19-…`, `t071-INJ-21-…`). Both must fail: the reply names `INSTALL.md` and presents no gate. No model session runs |

## Preconditions

- C001-T-083 done: it also edits `interview-protocol` and the conductor's wording; this task builds
  on its text.
- C001-IF-05 §3, the C001-IF-13 §1 line, C001-REQ-222, C001-AC-222.1 and C001-TS-226 are approved in
  the spec. Do not change them.
- Size budgets of C001-NFR-105 (PLG-SIZE-001: ≤ 24,000 characters per skill, ≤ 64,000 per agent
  with its preloaded skills). The two skills are about 5,700 and 7,100 characters, and the
  conductor about 5,300.
- **Cross-change (recorded in `../handoff.md`):** the paid evidence is C002-T-071's Copilot CLI
  0.0.3 retake. It adds the two Copilot CLI rows of C001-TS-226 to its Copilot rows (about
  0.20 USD) and retakes INJ-19 and INJ-21. This task does not wait for that run. D-020 closes when
  C002-T-071 records the two rows passing, with INJ-19 and INJ-21 not acted upon.

## Step outline (no production code)

1. Test first: write `evals/cap02/TS-226.eval.mjs` and run its $0 check on the two recorded
   `t071` transcripts. Both must fail on the "enable a tool" detour.
2. Add the fallback to `interview-protocol` §4 and `gate-protocol` §3 and §4, the refusal line to
   both "Claude Code wiring" sections, and the new hard rules to `sdd-conductor.md`.
3. Update the four wiring variants. Add the line check to `wiring.test.ts`. Run the generator through
   `npm run check` (targets step) and confirm that the generated bodies keep the fallback.
4. Run `npm run check`: PLG-SIZE-001, PLG-VAR-001 (no host-only names in the source), the targets
   step and the tests.
5. Report the task. No paid run here: the Claude Code row of C001-TC-226 runs at release in
   C001-T-072 (C001-ADR-003, class G), and the Copilot rows run in C002-T-071.

## Verification

- the $0 check of `evals/cap02/TS-226.eval.mjs` on the two `t071` transcripts (both fail)
- `npm test -- cap01/wiring` on Node 20.20.2 and on Node 22.22.3
- `npm run check` on Node 22.22.3 (exit 0)
- `node plugins/architect/scripts/sdd.mjs lint`

## Done when

- [ ] `interview-protocol`, `gate-protocol` and `sdd-conductor.md` carry the C001-IF-05 §3 fallback and no "enable a tool" path; the size budgets hold.
- [ ] The generated Copilot and OpenCode bodies of both skills keep the fallback (`wiring.test.ts`).
- [ ] `evals/cap02/TS-226.eval.mjs` exists with the three rows; its $0 check fails both recorded `t071` transcripts.
- [ ] `npm run check` exits 0.
- [ ] Progress reported: `sdd task set C001-T-084 --status done --commit <sha>`. D-020 is closed with C002-T-071's 0.0.3 retake evidence.
