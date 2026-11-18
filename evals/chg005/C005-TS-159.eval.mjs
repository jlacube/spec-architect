// C005-TC-057 — verifies C005-TS-159 (C005-AC-123.1, C005-REQ-123): the kind given by the new-change command
// is not asked again.
import { createdWith, kindCalls } from "./kind-round.mjs";
import { isProfileQuestion, newChangeCase, pick } from "./new-change.mjs";

export default newChangeCase({
  id: "C005-TS-159",
  title: "Kind given by the new-change command is not asked again",
  prompt: '/architect:new "Export the order list to CSV" --kind brownfield',
  reply: (q) => (isProfileQuestion(q) ? pick(q, /\blite\b/i) : q.options[0].label),
  check(ctx) {
    ctx.check(kindCalls(ctx.calls).length === 0, "a question asked for the kind");
    createdWith(ctx, "lite", "brownfield");
  },
});
