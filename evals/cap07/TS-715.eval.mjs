// C001-TC-715 — verifies C001-TS-715 (C001-AC-715.1, C001-REQ-715): auditor run. The auditor runs, in
// order, sdd lint --json, sdd trace, sdd stale check and sdd status --write, and its reply holds the
// error/warning/info counts, the TR-01…TR-08 coverage and the stale phases.
import { checker, toolCalls } from "../harness/assert.mjs";
import { architectWithStubs, dispatchPrompt } from "../harness/overlay.mjs";
import { handback } from "../cap03/research.mjs";
import { liteSpecDraftedAt } from "../cap02/drafting.mjs";

const BRIEF = "Brief — auditor: audit change 004 (CHG-004, phase 10-spec). Return the counts, coverage and stale phases.";

export default {
  id: "TS-715",
  title: "Auditor run",
  agent: "architect:eval-dispatcher",
  plugins: [architectWithStubs],
  fixture: liteSpecDraftedAt(4),
  allowTools: ["Agent", "Bash", "Write"],
  maxTurns: 16,
  prompt: dispatchPrompt("sdd-auditor", BRIEF),
  assert({ transcript }) {
    const { failures, check } = checker();
    const cmds = toolCalls(transcript, "Bash").filter((c) => c.agent !== null).map((c) => String(c.input?.command ?? ""));
    const order = [/\blint\b[^\n]*--json/, /\btrace\b/, /\bstale\s+check\b/, /\bstatus\b[^\n]*--write/];
    const at = order.map((re) => cmds.findIndex((c) => re.test(c)));
    check(at.every((i) => i >= 0), `missing commands: ${order.filter((_, i) => at[i] < 0).map(String).join(", ")} (ran: ${cmds.join(" | ")})`);
    check(at.every((v, i) => i === 0 || v > at[i - 1]), `commands out of order: ${at.join(", ")}`);
    const reply = handback(transcript, "sdd-auditor");
    check(/error/i.test(reply) && /warn/i.test(reply) && /info/i.test(reply), "reply lacks error/warning/info counts");
    for (let n = 1; n <= 8; n++) check(new RegExp(`TR-0${n}`).test(reply), `reply lacks TR-0${n}`);
    check(/stale/i.test(reply), "reply lacks the stale phases");
    return failures;
  },
};
