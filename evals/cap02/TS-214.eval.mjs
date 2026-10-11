// C001-TC-214 — verifies C001-TS-214 (C001-AC-213.1, C001-REQ-213): unattended mode never approves. The
// spec of CHG-004 is drafted and lint-clean; continuing unattended, the conductor presents G2 and
// ends its turn; 10-spec is not approved.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { checker, toolCalls } from "../harness/assert.mjs";
import { architectWithStubs } from "../harness/overlay.mjs";
import { specDrafted } from "./drafting.mjs";

export default {
  id: "TS-214",
  title: "Unattended mode never approves",
  agent: "architect:sdd-conductor",
  plugins: [architectWithStubs],
  fixture: specDrafted,
  env: { CLAUDE_CODE_ENABLE_TODO_TOOLS: "1" },
  allowTools: ["Agent", "Write", "Edit", "Bash"],
  maxTurns: 30,
  prompt: "Continue the spec phase of CHG-004 unattended; the draft is complete. I'll review at the gate.",
  // Should the gate be asked anyway, P-01 gives no decision.
  answer: () => "I will review it later.",
  assert({ transcript, root }) {
    const { failures, check } = checker();
    const bash = toolCalls(transcript, "Bash").map((c) => String(c.input?.command ?? ""));
    check(bash.some((c) => /gate\s+show\s+0*4\s+10-spec/.test(c)), "sdd gate show 004 10-spec was not run");
    check(!bash.some((c) => /gate\s+approve/.test(c)), "sdd gate approve was run");
    const status = /^ {2}10-spec: \{ status: ([\w-]+)/m.exec(readFileSync(join(root, ".sdd", "004-coupon-codes", "change.md"), "utf8"))?.[1];
    check(status !== "approved", `10-spec is ${status}`);
    return failures;
  },
};
