// C002-TC-230 — verifies C002-TS-230 (C002-AC-217.1, C002-REQ-217; C002-T-044): in a server session of
// the pinned OpenCode binary (`opencode serve`, whose default rule is `question: deny`), the conductor's
// `question` call reaches the SDK and the OpenCode eval runner answers it through the reply route
// (`question.reply`): the session's events hold a `question` call of `sdd-conductor` answered by the
// runner, no tool part has the status "error" with a text starting "Model tried to call unavailable
// tool", and the run does not end with "question unanswerable".
// Given: the bootstrap workspace with one change (the real CLI, an approved constitution and change 001,
// as C002-TC-219), the OpenCode target package placed by the runner. When: `/architect-new "Export to
// CSV"` (the profile question). OpenCode only: run by C002-T-056 through
// `run.mjs --host opencode --tier dev --filter evals/targets/question-tool/TS-230.eval.mjs`.
import { checker, toolCalls } from "../../harness/assert.mjs";
import { constitution } from "../../cap02/drafting.mjs";
import { git, sdd } from "../../harness/workspaces.mjs";

const UNAVAILABLE = /^Model tried to call unavailable tool/;

/** Tool results of the session that are errors, as `{ id, text }`. */
function errorResults(transcript) {
  return transcript
    .filter((r) => r.type === "sdk" && r.message.type === "user")
    .flatMap((r) => (Array.isArray(r.message.message?.content) ? r.message.message.content : []))
    .filter((b) => b.type === "tool_result" && b.is_error)
    .map((b) => ({ id: b.tool_use_id, text: String(b.content ?? "") }));
}

export default {
  id: "TS-230",
  title: "Conductor's question call answered through the SDK reply route in an opencode serve session (TS-230)",
  host: "opencode",
  agent: "sdd-conductor",
  fixture: (root) => {
    git(root, "init", "-q");
    sdd(root, "init");
    constitution(root, "approved");
    sdd(root, "change", "new", "Booking service", "--profile", "lite");
    sdd(root, "status", "--write");
    git(root, "add", "-A");
    git(root, "commit", "-q", "-m", "fixture");
  },
  allowTools: ["Write", "Edit", "Bash"],
  maxTurns: 16,
  maxBudgetUsd: 0.35,
  prompt: '/architect-new "Export to CSV"',
  answer: (x) => x.options?.[0]?.label ?? "",
  assert({ transcript, end_reason }) {
    const { failures, check } = checker();
    const asks = toolCalls(transcript).filter((c) => c.name === "question" && c.agent === null);
    check(asks.length >= 1, "TS-230: the conductor made no question call");
    const replied = transcript.filter((r) => r.type === "harness" && r.event === "answer" && r.route === "question.reply");
    check(replied.length >= 1, "TS-230: no question call was answered through question.reply");
    const unavailable = errorResults(transcript).filter((e) => UNAVAILABLE.test(e.text));
    check(unavailable.length === 0, `TS-230: unavailable-tool parts: ${unavailable.map((e) => e.text.slice(0, 80)).join(" | ")}`);
    check(toolCalls(transcript).every((c) => c.name !== "invalid"), "TS-230: a tool part named invalid (unavailable tool)");
    check(end_reason !== "question unanswerable", "TS-230: the run ended with question unanswerable");
    return failures;
  },
};
