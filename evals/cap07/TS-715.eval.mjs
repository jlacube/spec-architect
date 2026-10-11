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
    // Position of each command: its call index, then its offset inside that call.
    const at = order.map((re) => {
      const i = cmds.findIndex((c) => re.test(c));
      return i < 0 ? -1 : i * 1e6 + cmds[i].search(re);
    });
    check(at.every((i) => i >= 0), `missing commands: ${order.filter((_, i) => at[i] < 0).map(String).join(", ")} (ran: ${cmds.join(" | ")})`);
    check(at.every((v, i) => i === 0 || v > at[i - 1]), `commands out of order (ran: ${cmds.join(" | ")})`);
    check(cmds.every((c) => !/&&|;|\|\||>/.test(c)), `chained commands (Bash allowlist, C001-IF-07 §3): ${cmds.filter((c) => /&&|;|\|\||>/.test(c)).join(" | ")}`);
    const reply = handback(transcript, "sdd-auditor");
    check(/error/i.test(reply) && /warn/i.test(reply) && /info/i.test(reply), "reply lacks error/warning/info counts");
    // TR-01 … TR-08 as far as `sdd trace` prints them (plan rules TR-06 … 08 only once the plan started).
    const traceOut = transcript
      .filter((r) => r.type === "sdk" && r.message.type === "user" && r.message.parent_tool_use_id)
      .flatMap((r) => (r.message.message?.content ?? []).filter((b) => b.type === "tool_result").map((b) => (typeof b.content === "string" ? b.content : JSON.stringify(b.content))))
      .find((c) => /TR-01 /.test(c)) ?? "";
    const printed = [...new Set([...traceOut.matchAll(/\bTR-0[1-8]\b/g)].map((m) => m[0]))];
    check(printed.length >= 5, `sdd trace output not found or incomplete: ${printed.join(", ")}`);
    for (const code of printed) check(reply.includes(code), `reply lacks ${code}`);
    check(/stale/i.test(reply), "reply lacks the stale phases");
    return failures;
  },
};
