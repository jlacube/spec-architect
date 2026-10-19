// C002-TC-613 — verifies C002-TS-613 (C002-AC-610.1, C002-REQ-610; C002-T-044): on OpenCode, change 002 of
// fx-gate has 10-spec in review; the OpenCode eval runner answers the gate G2 `question` call with
// "Approve" through the script (`question.reply`). The transcript then shows one `sdd gate approve`
// command for change 002 with the scripted words as its note. The scenario's second Then — the results
// hold the interview and gate scenarios of C001-CAP-02 (evals/cap02/TS-206 … 212, 222 and evals/cap08/
// TS-802 … 804, reused unchanged: the runner maps their tool names back to Claude Code's) and
// C002-TC-634, 635, each with the target "opencode" — is the run of C002-T-056 step 3:
//   node evals/harness/run.mjs --host opencode --tier dev --filter evals/targets/gate <the C001-CAP-02 case files>
// S-07 §5 recorded `question_answerable_by_script: true` (Given).
import { checker } from "../../harness/assert.mjs";
import { fxGate } from "../../harness/fixtures.mjs";
import { commands, gateCalls, isGate, OPENCODE, optionValue } from "./gate-cases.mjs";

const ANSWER = "Approve";

export default {
  id: "TS-613",
  title: "Scripted gate approval on OpenCode (TS-613)",
  ...OPENCODE,
  fixture: (root) => fxGate(root),
  prompt: "/architect-gate 002",
  answer: (x) => (isGate(x) ? ANSWER : x.options[0].label),
  assert({ transcript }) {
    const { failures, check } = checker();
    check(gateCalls(transcript).length >= 1, "TS-613: no gate question call");
    const all = commands(transcript);
    const approves = all.filter((c) => /\bgate\s+approve\s+0*2\s+10-spec\b/.test(c.command));
    check(approves.length === 1, `TS-613: ${approves.length} "sdd gate approve 002 10-spec" commands (one expected): ${all.map((c) => c.command).join(" | ") || "none"}`);
    for (const c of approves) check(optionValue(c.command, "note") === ANSWER, `TS-613: --note is ${JSON.stringify(optionValue(c.command, "note"))}, not the scripted ${JSON.stringify(ANSWER)}`);
    return failures;
  },
};
