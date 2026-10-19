// C002-TC-635 — verifies C002-TS-635 (C002-AC-610.1, C002-REQ-610; C002-T-044): on OpenCode, change 002 of
// fx-gate has 00-ideation approved (fx-gate variant "ideation-approved"); `/architect-revise ideation 002`
// runs without a reason, and the OpenCode eval runner answers the reason question with "Scope changed"
// through the script. The transcript then shows one `sdd change revise 002 00-ideation` command with the
// reason "Scope changed", and `sdd status` afterwards shows phase 00-ideation of change 002 as
// in-revision. Run by C002-T-056 through `run.mjs --host opencode` (S-07 §5).
import { checker } from "../../harness/assert.mjs";
import { fxGate } from "../../harness/fixtures.mjs";
import { sdd } from "../../harness/workspaces.mjs";
import { commands, OPENCODE, optionValue } from "./gate-cases.mjs";

const REASON = "Scope changed";

export default {
  id: "TS-635",
  title: "Revise command on OpenCode with a scripted reason (TS-635)",
  ...OPENCODE,
  fixture: (root) => fxGate(root, { variant: "ideation-approved" }),
  prompt: "/architect-revise ideation 002",
  // The reason question (free text or with options) gets the reason; any other question its first option.
  answer: (x) => (/reason|why/i.test(`${x.header ?? ""} ${x.question ?? ""}`) ? REASON : x.options[0].label),
  assert({ transcript, root }) {
    const { failures, check } = checker();
    const cmds = commands(transcript);
    const revises = cmds.filter((c) => /\bchange\s+revise\s+0*2\s+00-ideation\b/.test(c.command));
    check(revises.length === 1, `TS-635: ${revises.length} "sdd change revise 002 00-ideation" commands (one expected): ${cmds.map((c) => c.command).join(" | ") || "none"}`);
    for (const c of revises) check(optionValue(c.command, "reason") === REASON, `TS-635: --reason is ${JSON.stringify(optionValue(c.command, "reason"))}`);
    const status = sdd(root, "status");
    const row = status.split(/\r?\n/).find((l) => /^\|\s*002\s*\|/.test(l)) ?? "";
    check(/\|\s*00-ideation\s*\|\s*in-revision\s*\|/.test(row), `TS-635: sdd status does not show 00-ideation of change 002 as in-revision:\n${status.slice(0, 600)}`);
    return failures;
  },
};
