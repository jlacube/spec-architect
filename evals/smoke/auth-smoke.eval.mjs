// Smoke scenario of the eval auth switch (CHG-002 D-003): one short session without a plugin, used
// once per billing route to check that `api_key_source` in the result matches --auth
// (`node evals/harness/run.mjs evals/smoke/auth-smoke.eval.mjs --auth subscription --label auth-smoke`).
import { finalReply } from "../harness/assert.mjs";

export default {
  id: "auth-smoke",
  title: "Eval auth switch smoke session",
  plugins: [],
  prompt: "Reply with the single word: ok",
  maxTurns: 2,
  maxBudgetUsd: 0.05,
  model: "haiku",
  assert(session) {
    const reply = finalReply(session.transcript) ?? "";
    return /\bok\b/i.test(reply) ? [] : [`unexpected reply: ${reply.slice(0, 80)}`];
  },
};
