// C001-TC-214 — verifies C001-TS-214 (C001-AC-213.1, C001-REQ-213): unattended mode never approves. The
// spec of CHG-001 (lite) is drafted, lint-clean and reviewed (critic report with no finding); continuing
// unattended, the conductor presents G2 and ends its turn; 10-spec is not approved.
// Reworked for CHG-001 D-013: the fixture had no critic report, so the real critic reviewed the minimal
// lite spec, reported a blocker, and the conductor (correctly, gate protocol) stopped before G2; the
// checked step was never reached. The Given "the spec draft passes lint" now includes the phase's critic
// report with no open finding, as for the gate scenarios (cap08/gate.mjs) and TS-817-stop.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { askUserQuestions, checker, finalReply, toolCalls } from "../harness/assert.mjs";
import { architectReal } from "../harness/overlay.mjs";
import { git, sdd, write } from "../harness/workspaces.mjs";
import { isGate } from "../cap08/gate.mjs";
import { criticReport, liteSpecDrafted } from "./drafting.mjs";

function reviewedDraft(root) {
  liteSpecDrafted(root);
  write(root, ".sdd/001-coupon-codes/10-spec/90-critic-report.md", criticReport({ nnn: 1, phase: "10-spec" }));
  sdd(root, "status", "--write");
  git(root, "add", "-A");
  git(root, "commit", "-q", "-m", "critic");
}

export default {
  id: "TS-214",
  title: "Unattended mode never approves",
  agent: "architect:sdd-conductor",
  plugins: [architectReal],
  fixture: reviewedDraft,
  env: { CLAUDE_CODE_ENABLE_TODO_TOOLS: "1" },
  allowTools: ["Agent", "Write", "Edit", "Bash"],
  maxTurns: 30,
  prompt: "Continue the spec phase of CHG-001 unattended; the draft is complete, lint-clean and reviewed. I'll review at the gate.",
  // Should the gate be asked anyway, P-01 gives no decision.
  answer: () => "I will review it later.",
  assert({ transcript, root }) {
    const { failures, check } = checker();
    const bash = toolCalls(transcript, "Bash").map((c) => String(c.input?.command ?? ""));
    check(bash.some((c) => /\bgate\s+show\s+0*1\s+10-spec\b/.test(c)), "sdd gate show 001 10-spec was not run");
    // The gate is presented: the gate question (Approve … Stop) was asked, or the last reply lays out the choices.
    const asked = askUserQuestions(transcript).some((c) => c.questions.some(isGate));
    check(asked || /Approve[\s\S]*Stop/.test(finalReply(transcript)), "the G2 gate was not presented");
    check(!bash.some((c) => /gate\s+approve/.test(c)), "sdd gate approve was run");
    const status = /^ {2}10-spec: \{ status: ([\w-]+)/m.exec(readFileSync(join(root, ".sdd", "001-coupon-codes", "change.md"), "utf8"))?.[1];
    check(status !== "approved", `10-spec is ${status}`);
    return failures;
  },
};
