// C002-TC-634 — verifies C002-TS-634 (C002-AC-610.1, C002-REQ-610; C002-T-044): on OpenCode, change 002 of
// fx-gate has 10-spec in review; the OpenCode eval runner answers the gate G2 `question` call with Revise
// and the words "Add an error scenario to C002-REQ-101" through the script. The transcript then shows one
// `sdd gate record 002 10-spec --decision revise` command with those words as its note, no
// `sdd gate approve` command before the rework is presented again, and after the rework a second gate G2
// question offering Approve, Approve with waivers, Revise and Stop (answered Stop, so the run ends).
// Run by C002-T-056 through `run.mjs --host opencode` (S-07 §5: `question_answerable_by_script: true`).
import { checker } from "../../harness/assert.mjs";
import { fxGate } from "../../harness/fixtures.mjs";
import { CHOICES, commands, gateCalls, isGate, OPENCODE, optionValue } from "./gate-cases.mjs";

const WORDS = "Add an error scenario to C002-REQ-101";

/** First gate question: Revise with the words (free text); later ones: Stop. Other questions: first option. */
function script() {
  let gates = 0;
  return (x) => (isGate(x) ? (++gates === 1 ? `Revise: ${WORDS}` : "Stop") : x.options[0].label);
}

export default {
  id: "TS-634",
  title: "Scripted Revise at a gate on OpenCode (TS-634)",
  ...OPENCODE,
  maxTurns: 30,
  // The rework between the two gate questions does not fit 0.35 USD (C002-T-056: spend cap after 16
  // turns, before the second question), nor 0.50 USD: the cap exception of C002-IF-010 §2.2 (P-01,
  // Q-ts634-budget-01, 2026-10-20) gives this row of this file 1.00 USD on OpenCode.
  maxBudgetUsd: 1.0,
  fixture: (root) => fxGate(root),
  prompt: "/architect-gate 002",
  get answer() {
    return script();
  },
  assert({ transcript }) {
    const { failures, check } = checker();
    const gates = gateCalls(transcript);
    const cmds = commands(transcript);
    const records = cmds.filter((c) => /\bgate\s+record\s+0*2\s+10-spec\b/.test(c.command) && /--decision\s+["']?revise\b/.test(c.command));
    check(records.length === 1, `TS-634: ${records.length} "sdd gate record 002 10-spec --decision revise" commands (one expected): ${cmds.map((c) => c.command).join(" | ") || "none"}`);
    for (const c of records) check(String(optionValue(c.command, "note") ?? "").includes(WORDS), `TS-634: --note is ${JSON.stringify(optionValue(c.command, "note"))}, without the scripted words`);
    const second = gates[1];
    const approves = cmds.filter((c) => /\bgate\s+approve\b/.test(c.command) && (second === undefined || c.t <= second.t));
    check(approves.length === 0, `TS-634: sdd gate approve ran after Revise: ${approves.map((c) => c.command).join(" | ")}`);
    check(second !== undefined, `TS-634: ${gates.length} gate question call(s); a second gate G2 question after the rework expected`);
    if (second) {
      const q = second.input.questions.find(isGate);
      const labels = (q.options ?? []).map((o) => o.label);
      check(JSON.stringify(labels) === JSON.stringify(CHOICES), `TS-634: second gate question options ${JSON.stringify(labels)}`);
      check(records.every((r) => r.t <= second.t), "TS-634: the revise decision was recorded after the second gate question");
    }
    return failures;
  },
};
