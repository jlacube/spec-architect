// C002-TC-614, the three Claude Code rows (C002-TS-614, C002-REQ-611, C002-NFR-105; revision D-025,
// C002-T-048 step X0): the Claude Code eval runner (`runSession` with `--host claude-code`, through
// `evals/harness/run.mjs`, EVAL_HOST and EVAL_AUTH unset) on the Agent SDK stub (sdk-stub) ends a case row
// without `maxTurns` and `maxBudgetUsd` at the default caps of 30 turns and 0.50 USD: at a notional
// 0.01 USD per turn by the turn cap (`error_max_turns` after 30 turns), at 0.10 USD per turn by the spend
// cap (`error_max_budget_usd` after 5 turns), under `--auth subscription` and, for the spend cap, under
// `--auth api-key`. No Claude Code process starts and nothing is billed (tests/integration/cap06/eval-driver.ts).
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runDriver, writeCase } from "./eval-driver.ts";

const ROWS: { auth: "subscription" | "api-key"; usdPerTurn: number; turns: number; subtype: string; keySource: string }[] = [
  { auth: "subscription", usdPerTurn: 0.01, turns: 30, subtype: "error_max_turns", keySource: "none" },
  { auth: "subscription", usdPerTurn: 0.1, turns: 5, subtype: "error_max_budget_usd", keySource: "none" },
  { auth: "api-key", usdPerTurn: 0.1, turns: 5, subtype: "error_max_budget_usd", keySource: "/login managed key" },
];

ROWS.forEach((row, i) => {
  test(`C002-TS-614 Claude Code row ${i + 1} — --auth ${row.auth} at ${row.usdPerTurn.toFixed(2)} USD per turn: ${row.subtype} after ${row.turns} turns, caps { turns: 30, usd: 0.50 }`, () => {
    const fx = mkdtempSync(join(tmpdir(), "sdd-claude-runner-"));
    try {
      const file = writeCase(fx, "evals/cap06/TS-614-claude.eval.mjs", { id: "TS-614-claude" });
      const r = runDriver([file, "--host", "claude-code", "--auth", row.auth, "--tier", "dev"], { root: fx, usdPerTurn: row.usdPerTurn });
      assert.equal(r.status, 0, r.out);
      assert.deepEqual(r.given, [{ turns: 30, usd: 0.5 }], "the stub received maxTurns 30 and maxBudgetUsd 0.50");
      assert.equal(r.records.length, 1, r.out);
      const rec = r.records[0]!;
      assert.equal(rec["metrics"].turns, row.turns);
      assert.equal(rec["metrics"].result_subtype, row.subtype);
      assert.deepEqual(rec["caps"], { turns: 30, usd: 0.5 });
      assert.equal(rec["auth"], row.auth);
      assert.equal(rec["api_key_source"], row.keySource);
    } finally {
      rmSync(fx, { recursive: true, force: true });
    }
  });
});
