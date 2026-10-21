// Agent SDK stub (test plan §2, sdk-stub; C002-T-048 step X0): a replacement for the SDK's `query` that the
// runner tests put in place through the harness context of session.mjs (`setHarnessContext({ query })`),
// so that the Claude Code path of `runSession` runs without a Claude Code process and bills nothing.
// It records the options it receives, sends an `init` message (`apiKeySource` `none` under the
// subscription route, whose environment carries CLAUDE_CODE_OAUTH_TOKEN, else the key's source), then one
// turn after another at `usdPerTurn` notional USD each, and ends the session only at a cap, as the SDK
// does: a `result` message of subtype `error_max_budget_usd` when the cost reaches `maxBudgetUsd`
// (checked after each turn), else `error_max_turns` at `maxTurns`.

const EPS = 1e-9;

/**
 * The stub `query`. `usdPerTurn`: the notional cost of each turn; `onOptions(options)`: called once with
 * the options the session passed; `keySource`: the `apiKeySource` under the api-key route.
 */
export function sdkStub({ usdPerTurn = 0.01, onOptions = () => {}, keySource = "/login managed key", model = "claude-opus-5-5" } = {}) {
  return function query({ options }) {
    onOptions(options);
    const subscription = typeof options.env?.CLAUDE_CODE_OAUTH_TOKEN === "string" && options.env.CLAUDE_CODE_OAUTH_TOKEN !== "";
    const maxTurns = options.maxTurns;
    const maxBudgetUsd = options.maxBudgetUsd;
    return (async function* () {
      yield { type: "system", subtype: "init", apiKeySource: subscription ? "none" : keySource, model, session_id: "stub" };
      let usd = 0;
      let turns = 0;
      for (;;) {
        turns += 1;
        usd = Math.round((usd + usdPerTurn) * 1e9) / 1e9;
        yield { type: "assistant", message: { id: `m${turns}`, model, content: [{ type: "text", text: `turn ${turns}` }], usage: { input_tokens: 1, output_tokens: 1, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 } }, parent_tool_use_id: null };
        const subtype = usd + EPS >= maxBudgetUsd ? "error_max_budget_usd" : turns >= maxTurns ? "error_max_turns" : null;
        if (subtype) {
          yield {
            type: "result",
            subtype,
            is_error: true,
            num_turns: turns,
            total_cost_usd: usd,
            duration_api_ms: 0,
            modelUsage: { [model]: { inputTokens: turns, outputTokens: turns, cacheReadInputTokens: 0, cacheCreationInputTokens: 0, costUSD: usd } },
          };
          return;
        }
      }
    })();
  };
}
