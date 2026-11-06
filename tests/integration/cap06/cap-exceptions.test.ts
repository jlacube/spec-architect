// C002-TC-679 (C002-TS-679; C002-T-065; the 2.00 USD exception from C002-T-056 step X0 on; the Claude Code
// subscription class, the turn cap above 30 and `--cap-exception` from C002-T-048 step X0 on, revision
// D-025): a case cap above 0.50 USD or 30 turns, and a rerun cap, apply only for a listed cap exception
// (C002-IF-010 §2.2 "Caps above 0.50 USD", critic CR-68). An exception matches on row ID, case file, host
// and auth mode. fx-evals-caps: a temporary case folder with one case file per row at the row's `file`
// path, relative to the fixture root, which run.mjs takes as the repository root for the case-file match;
// `main` runs in a child process from the source files with the stub host for opencode and copilot-cli and
// the Agent SDK stub for claude-code on mock timers (./eval-driver.ts), EVAL_HOST and EVAL_AUTH unset; no
// ledger write, no paid session. On claude-code the stub gets the turn cap and no spend cap, and the runner
// stops the session at the cap itself (revision D-031, C002-T-069). Supporting tests: CAP_EXCEPTIONS holds exactly the rows of the §2.2 table (from revision
// D-030, C002-T-068, 41 rows, each subscription-class row with the rule of its list in "Sessions of CHG-001
// tasks"; from revision D-033, C002-T-070, 42 rows, TS-225 added after TS-224, the 13 rule-1 rows at the
// rerun cap 3.00 USD and the 27 rule-2 rows and TS-421-agent at 1.50 USD); TS-223 at 3.00 USD with
// --cap-exception (1.50 USD before revision D-033), TS-216 at 0.50 USD without it and refused with it under
// --auth api-key (revision D-030); from revision D-035 (C002-T-073), 43 rows, INJ-21 on opencode with the
// session cap 1.00 USD after TS-634, and the four INJ-21 rows of C002-TC-679 (24 rows in all); from revision
// D-037 (C002-T-074), 44 rows, TS-226-blocking of evals/cap02/TS-226.eval.mjs after TS-225, the fourteenth
// rule-1 row at 3.00 USD, the file's other rows without a row; from revision D-038, 45 rows, TS-320 of
// evals/cap03/TS-320.eval.mjs after TS-319, the twenty-eighth rule-2 row at 1.50 USD; from revision D-039,
// still 45 rows, TS-511 of evals/cap05/TS-511.eval.mjs moved from rule 2 to rule 1 at 3.00 USD after TS-802,
// 15 rule-1 rows and 27 rule-2 rows; from revision D-040, 87 rows, the forty-two release-standard rule-2 rows
// after TS-511, 69 rule-2 rows, every row of the 3-run class of C001-ADR-003 in the table and --cap-exception
// refused for a row outside it; the case files
// under evals/ set no row above 0.50 USD but the TS-634 OpenCode row, and no row above 30 turns but TS-213
// and TS-221 of evals/cap02/.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { pathToFileURL } from "node:url";
import { CAP_EXCEPTIONS, capCheck } from "../../../evals/harness/caps.mjs";
import { cliArgs, maxAiCredits } from "../../../evals/harness/runners/copilot-cli.mjs";
import { repoRoot } from "../../helpers.ts";
import { type DriverRun, runDriver, writeCase } from "./eval-driver.ts";

const ROOT = repoRoot();

interface Row {
  file: string;
  row: string;
  /** The row's own caps in its case file (absent: the default). */
  usd?: number;
  turns?: number;
  host: string;
  auth?: "subscription" | "api-key";
  capException?: boolean;
  /** The caps the session gets, or null for a refusal before any session. */
  runs: { usd: number; turns: number } | null;
  /** Text the refusal names besides the row ID and the case file (its auth mode, or the cap). */
  names?: string;
}

const GATE634 = "evals/targets/gate/TS-634.eval.mjs";
const OTHER634 = "evals/targets/other/TS-634.eval.mjs";
const GATE613 = "evals/targets/gate/TS-613.eval.mjs";
const CAP214 = "evals/cap02/TS-214.eval.mjs";
const OTHER214 = "evals/targets/other/TS-214.eval.mjs";
const CAP213 = "evals/cap02/TS-213.eval.mjs";
const INJ = "evals/injection/injection.eval.mjs";

const ROWS: Row[] = [
  // Revision D-021 … D-022 (7 rows).
  { file: GATE634, row: "TS-634", usd: 2.0, host: "opencode", runs: { usd: 2.0, turns: 30 } },
  { file: GATE634, row: "TS-634", usd: 0.8, host: "opencode", runs: { usd: 0.8, turns: 30 } },
  { file: GATE634, row: "TS-634", usd: 2.2, host: "opencode", runs: null },
  { file: GATE634, row: "TS-634", usd: 2.0, host: "copilot-cli", runs: null },
  { file: OTHER634, row: "TS-634", usd: 2.0, host: "opencode", runs: null },
  { file: GATE613, row: "TS-613", usd: 0.75, host: "opencode", runs: null },
  { file: GATE613, row: "TS-613", usd: 0.5, host: "opencode", runs: { usd: 0.5, turns: 30 } },
  // Revision D-025 (13 rows).
  { file: GATE634, row: "TS-634", usd: 2.0, host: "opencode", capException: true, runs: null, names: "no auth mode" },
  { file: GATE613, row: "TS-613", turns: 40, host: "opencode", runs: null, names: "maxTurns 40" },
  { file: GATE613, row: "TS-613", host: "claude-code", auth: "subscription", capException: true, runs: null, names: "auth subscription" },
  { file: CAP214, row: "TS-214", host: "claude-code", auth: "subscription", capException: true, runs: { usd: 1.5, turns: 30 } },
  { file: CAP214, row: "TS-214", host: "claude-code", auth: "subscription", runs: { usd: 0.5, turns: 30 } },
  { file: CAP214, row: "TS-214", host: "claude-code", auth: "api-key", runs: { usd: 0.5, turns: 30 } },
  { file: CAP214, row: "TS-214", host: "claude-code", auth: "api-key", capException: true, runs: null, names: "auth api-key" },
  { file: CAP214, row: "TS-214", host: "claude-code", capException: true, runs: null, names: "auth api-key" },
  { file: CAP214, row: "TS-214", host: "opencode", capException: true, runs: null, names: "no auth mode" },
  { file: OTHER214, row: "TS-214", host: "claude-code", auth: "subscription", capException: true, runs: null, names: "auth subscription" },
  { file: CAP213, row: "TS-213", turns: 40, host: "claude-code", auth: "subscription", runs: { usd: 0.5, turns: 40 } },
  // TS-213, a rule-1 row: the rerun cap 3.00 USD from revision D-033 on (C002-T-070; 1.50 USD before).
  { file: CAP213, row: "TS-213", turns: 40, host: "claude-code", auth: "subscription", capException: true, runs: { usd: 3.0, turns: 40 } },
  { file: CAP213, row: "TS-213", turns: 40, host: "claude-code", auth: "api-key", runs: null, names: "auth api-key" },
  // Revision D-035 (C002-T-073, 4 rows): INJ-21 at the session cap 1.00 USD on opencode without
  // --cap-exception, refused with it (the exception gives no rerun cap), and at its own 0.50 USD and
  // 16 turns on claude-code and copilot-cli, where no exception gives it a session cap.
  { file: INJ, row: "INJ-21", usd: 0.5, turns: 16, host: "opencode", runs: { usd: 1.0, turns: 16 } },
  { file: INJ, row: "INJ-21", usd: 0.5, turns: 16, host: "opencode", capException: true, runs: null, names: "no auth mode" },
  { file: INJ, row: "INJ-21", usd: 0.5, turns: 16, host: "claude-code", auth: "subscription", runs: { usd: 0.5, turns: 16 } },
  { file: INJ, row: "INJ-21", usd: 0.5, turns: 16, host: "copilot-cli", runs: { usd: 0.5, turns: 16 } },
];

/**
 * The Agent SDK stub of the Claude Code rows (revised for defect D-031 and critic CR-109): on mock timers,
 * one model call each second, 0.25 USD added at the end of each call, each usage request answered with the
 * cost of the ended calls, a result at once after an interrupt.
 */
const CLAUDE_STUB = { usdPerCall: 0.25, everyMs: 1000, usageDelayMs: 100, afterInterrupt: [{ result: {} }] };

/**
 * A Claude Code session row: the stub got `maxTurns` and no `maxBudgetUsd` or `taskBudget`, and the runner
 * stopped the session itself at the reading of the cap in force, after the second call at 0.50 USD, after
 * the sixth at 1.50 USD (and not at the 0.50 USD reading of the second), or after the twelfth at 3.00 USD
 * (and not at the 0.50 or 1.50 USD readings; revision D-033), with `error_max_budget_usd`.
 */
function claudeSession(r: DriverRun, caps: { usd: number; turns: number }) {
  assert.deepEqual(r.given[0], { turns: caps.turns, usd: null }, "the Agent SDK stub got the turn cap and no spend cap");
  const o = r.stub.find((e) => e["ev"] === "options")!;
  assert.equal(o["maxBudgetUsd"], "absent");
  assert.equal(o["taskBudget"], "absent");
  const tr = r.transcripts[0]!;
  const capRecs = tr.filter((x) => x.type === "harness" && x.event === "cap");
  assert.equal(capRecs.length, 1, "one cap record");
  assert.equal(capRecs[0].usd, caps.usd, `stopped at the ${caps.usd.toFixed(2)} USD reading`);
  assert.equal(capRecs[0].cap_usd, caps.usd);
  const calls = Math.round(caps.usd / 0.25);
  const interrupt = r.stub.find((e) => e["ev"] === "interrupt")!;
  assert.ok(Math.abs((interrupt["t"] as number) - ((calls - 1) * 1000 + 100)) < 50, `stopped after model call ${calls}: interrupt at ${interrupt["t"]} ms`);
  assert.equal(r.stub.filter((e) => e["ev"] === "call-end").length, calls, `${calls} model calls ended`);
  assert.equal(r.records[0]!["metrics"].result_subtype, "error_max_budget_usd");
}

const describe = (r: Row) =>
  `${r.row} of ${r.file} (${r.usd !== undefined ? r.usd.toFixed(2) + " USD" : "default USD"}, ${r.turns ?? "default"} turns) --host ${r.host}${r.auth ? " --auth " + r.auth : ""}${r.capException ? " --cap-exception" : ""}`;

ROWS.forEach((row, i) => {
  test(`C002-TS-679 row ${i + 1} — ${describe(row)}: ${row.runs ? `one session at ${row.runs.usd.toFixed(2)} USD and ${row.runs.turns} turns` : "exit 1 before any session"}`, () => {
    const fx = mkdtempSync(join(tmpdir(), "sdd-fx-evals-caps-"));
    try {
      const file = writeCase(fx, row.file, { id: row.row, ...(row.usd !== undefined ? { maxBudgetUsd: row.usd } : {}), ...(row.turns !== undefined ? { maxTurns: row.turns } : {}) });
      const args = [file, "--host", row.host, "--only", row.row, ...(row.auth ? ["--auth", row.auth] : []), ...(row.capException ? ["--cap-exception"] : [])];
      const r = runDriver(args, { root: fx, stub: CLAUDE_STUB });
      if (row.runs) {
        assert.equal(r.status, 0, r.out);
        assert.equal(r.given.length, 1, "one session");
        if (row.host === "claude-code") claudeSession(r, row.runs);
        else assert.equal(r.given[0]!.usd, row.runs.usd, "the session got the spend cap");
        if (row.host === "copilot-cli") {
          // The Copilot CLI eval runner passes the session's spend cap to the host as AI Credits.
          const args = cliArgs({ text: "hi", agent: "architect:sdd-conductor", copy: "pkg", serversFile: "servers.json", maxAiCredits: maxAiCredits(r.given[0]!.usd!), logDir: "logs", usageFile: "usage.json", model: null }) as string[];
          assert.equal(args.filter((a) => a === "--max-ai-credits").length, 1);
          assert.equal(args[args.indexOf("--max-ai-credits") + 1], String(Math.round(row.runs.usd * 100)), "the host's command line holds --max-ai-credits 50");
        }
        assert.equal(r.records.length, 1);
        assert.deepEqual(r.records[0]!["caps"], { turns: row.runs.turns, usd: row.runs.usd });
      } else {
        assert.equal(r.status, 1, r.out);
        assert.deepEqual(r.given, [], "the stub never started");
        assert.ok(r.out.includes(row.row) && r.out.includes(row.file), r.out);
        if (row.names) assert.ok(r.out.includes(row.names), `names ${row.names}: ${r.out}`);
        assert.match(r.out, /no session started/);
      }
    } finally {
      rmSync(fx, { recursive: true, force: true });
    }
  });
});

// Revision D-030 (C002-T-068): session supporting tests of the CHG-001 release rows, not Examples rows of
// C002-TS-679 (test plan §8, C002-TC-679).
const CAP223 = "evals/cap02/TS-223.eval.mjs";
const CAP216 = "evals/cap02/TS-216.eval.mjs";
const D030_ROWS: Row[] = [
  // TS-223, a rule-1 row: 3.00 USD from revision D-033 on (C002-T-070; 1.50 USD before).
  { file: CAP223, row: "TS-223", host: "claude-code", auth: "subscription", capException: true, runs: { usd: 3.0, turns: 30 } },
  { file: CAP216, row: "TS-216", host: "claude-code", auth: "subscription", runs: { usd: 0.5, turns: 30 } },
  { file: CAP216, row: "TS-216", host: "claude-code", auth: "api-key", capException: true, runs: null, names: "auth api-key" },
];

D030_ROWS.forEach((row) => {
  test(`C002-TS-679 (supporting, revision D-030) — ${describe(row)}: ${row.runs ? `one session at ${row.runs.usd.toFixed(2)} USD and ${row.runs.turns} turns` : "exit 1 before any session"}`, () => {
    const fx = mkdtempSync(join(tmpdir(), "sdd-fx-evals-caps-"));
    try {
      const file = writeCase(fx, row.file, { id: row.row });
      const args = [file, "--host", row.host, "--only", row.row, ...(row.auth ? ["--auth", row.auth] : []), ...(row.capException ? ["--cap-exception"] : [])];
      const r = runDriver(args, { root: fx, stub: CLAUDE_STUB });
      if (row.runs) {
        assert.equal(r.status, 0, r.out);
        assert.equal(r.given.length, 1, "one session");
        claudeSession(r, row.runs);
        assert.equal(r.records.length, 1);
        assert.deepEqual(r.records[0]!["caps"], { turns: row.runs.turns, usd: row.runs.usd });
      } else {
        assert.equal(r.status, 1, r.out);
        assert.deepEqual(r.given, [], "the stub never started");
        assert.ok(r.out.includes(row.row) && r.out.includes(row.file), r.out);
        if (row.names) assert.ok(r.out.includes(row.names), `names ${row.names}: ${r.out}`);
        assert.match(r.out, /no session started/);
      }
    } finally {
      rmSync(fx, { recursive: true, force: true });
    }
  });
});

test("C002-TS-679 (supporting): CAP_EXCEPTIONS holds exactly the rows of the C002-IF-010 §2.2 table", () => {
  // `rule`: the list of C002-IF-010 §2.2 "Sessions of CHG-001 tasks" that holds the row (1 or 2), null for
  // a row in neither list (TS-421-agent, no release case of C001-ADR-003). `rerunUsd`: 3.00 USD for a rule-1
  // row, 1.50 USD for every other row (revision D-033, C002-T-070).
  const sub = (row: string, file: string, rule: 1 | 2 | null, turns = 30) => ({ row, file, host: "claude-code", auth: "subscription", usd: 0.5, turns, rerunUsd: rule === 1 ? 3.0 : 1.5, rule });
  assert.deepEqual(CAP_EXCEPTIONS, [
    { row: "TS-634", file: GATE634, host: "opencode", auth: null, usd: 2.0, turns: 30, rerunUsd: null },
    // Revision D-035 (C002-T-073): INJ-21 on opencode, paid class: the row's own caps (the default
    // 0.50 USD, its 16 turns), the session cap 1.00 USD, no rerun cap.
    { row: "INJ-21", file: INJ, host: "opencode", auth: null, usd: 0.5, turns: 16, sessionUsd: 1.0, rerunUsd: null },
    sub("TS-214", CAP214, 2),
    sub("TS-215", "evals/cap02/TS-215.eval.mjs", 1),
    sub("TS-318-00-ideation", "evals/cap03/TS-318.eval.mjs", 1),
    sub("TS-318-10-spec", "evals/cap03/TS-318.eval.mjs", 1),
    sub("TS-318-20-plan", "evals/cap03/TS-318.eval.mjs", 1),
    sub("TS-213", CAP213, 1, 40),
    sub("TS-221", "evals/cap02/TS-221.eval.mjs", 1, 40),
    sub("TS-419", "evals/cap04/TS-419.eval.mjs", 2),
    sub("TS-420", "evals/cap04/TS-420.eval.mjs", 2),
    sub("TS-421-agent", "evals/cap04/TS-421.eval.mjs", null),
    sub("TS-713", "evals/cap07/TS-713.eval.mjs", 2),
    sub("TS-715", "evals/cap07/TS-715.eval.mjs", 2),
    sub("TS-815", "evals/cap08/TS-815.eval.mjs", 2),
    sub("TS-817-stop", "evals/cap08/TS-817.eval.mjs", 2),
    sub("TS-817-specify", "evals/cap08/TS-817.eval.mjs", 2),
    sub("INJ-19", INJ, 2),
    // Revision D-030 (24 rows, the table's three D-030 rows in order).
    sub("TS-223", CAP223, 1),
    sub("TS-224", "evals/cap02/TS-224.eval.mjs", 1),
    // Revision D-033 (spec critic CR-114): TS-225, the attended twin of TS-215, after TS-224.
    sub("TS-225", "evals/cap02/TS-225.eval.mjs", 1),
    // Revision D-037 (C002-T-074): TS-226-blocking, rule 1, after TS-225; the other rows of
    // evals/cap02/TS-226.eval.mjs get no exception.
    sub("TS-226-blocking", "evals/cap02/TS-226.eval.mjs", 1),
    sub("TS-127", "evals/cap01/TS-127.eval.mjs", 2),
    sub("TS-201", "evals/cap02/TS-201.eval.mjs", 2),
    sub("TS-216", CAP216, 2),
    sub("TS-217", "evals/cap02/TS-217.eval.mjs", 2),
    sub("TS-218", "evals/cap02/TS-218.eval.mjs", 2),
    sub("TS-319", "evals/cap03/TS-319.eval.mjs", 2),
    // Revision D-038: TS-320, rule 2, after TS-319 (the same critic review).
    sub("TS-320", "evals/cap03/TS-320.eval.mjs", 2),
    sub("TS-401", "evals/cap04/TS-401.eval.mjs", 2),
    sub("TS-418", "evals/cap04/TS-418.eval.mjs", 2),
    sub("TS-424", "evals/cap04/TS-424.eval.mjs", 2),
    sub("TS-515", "evals/cap05/TS-515.eval.mjs", 2),
    sub("TS-622", "evals/cap06/TS-622.eval.mjs", 2),
    sub("TS-710", "evals/cap07/TS-710.eval.mjs", 2),
    sub("TS-712", "evals/cap07/TS-712.eval.mjs", 2),
    sub("TS-714", "evals/cap07/TS-714.eval.mjs", 2),
    sub("INJ-17", INJ, 2),
    sub("INJ-18", INJ, 2),
    sub("INJ-21", INJ, 2),
    sub("TS-507", "evals/cap05/TS-507.eval.mjs", 1),
    sub("TS-508", "evals/cap05/TS-508.eval.mjs", 1),
    sub("TS-711", "evals/cap07/TS-711.eval.mjs", 1),
    sub("TS-802", "evals/cap08/TS-802.eval.mjs", 1),
    // Revision D-039: TS-511, moved from rule 2 to rule 1, after TS-802.
    sub("TS-511", "evals/cap05/TS-511.eval.mjs", 1),
    // Revision D-040: the release-standard rows without another row, rule 2, in C001-ADR-003 order.
    sub("TS-119", "evals/cap01/TS-119.eval.mjs", 2),
    sub("TS-120", "evals/cap01/TS-120.eval.mjs", 2),
    sub("TS-121", "evals/cap01/TS-121.eval.mjs", 2),
    sub("TS-122", "evals/cap01/TS-122.eval.mjs", 2),
    sub("TS-202", "evals/cap02/TS-202.eval.mjs", 2),
    sub("TS-203", "evals/cap02/TS-203.eval.mjs", 2),
    sub("TS-206", "evals/cap02/TS-206.eval.mjs", 2),
    sub("TS-207", "evals/cap02/TS-207.eval.mjs", 2),
    sub("TS-208", "evals/cap02/TS-208.eval.mjs", 2),
    sub("TS-210", "evals/cap02/TS-210.eval.mjs", 2),
    sub("TS-211", "evals/cap02/TS-211.eval.mjs", 2),
    sub("TS-222", "evals/cap02/TS-222.eval.mjs", 2),
    sub("TS-301", "evals/cap03/TS-301.eval.mjs", 2),
    sub("TS-303", "evals/cap03/TS-303.eval.mjs", 2),
    sub("TS-304", "evals/cap03/TS-304.eval.mjs", 2),
    sub("TS-305", "evals/cap03/TS-305.eval.mjs", 2),
    sub("TS-306", "evals/cap03/TS-306.eval.mjs", 2),
    sub("TS-307", "evals/cap03/TS-307.eval.mjs", 2),
    sub("TS-309", "evals/cap03/TS-309.eval.mjs", 2),
    sub("TS-312", "evals/cap03/TS-312.eval.mjs", 2),
    sub("TS-313", "evals/cap03/TS-313.eval.mjs", 2),
    sub("TS-315", "evals/cap03/TS-315.eval.mjs", 2),
    sub("TS-316", "evals/cap03/TS-316.eval.mjs", 2),
    sub("TS-317", "evals/cap03/TS-317.eval.mjs", 2),
    sub("TS-423", "evals/cap04/TS-423.eval.mjs", 2),
    sub("TS-609", "evals/cap06/TS-609.eval.mjs", 2),
    sub("impact", "evals/cap06/impact.eval.mjs", 2),
    sub("TS-910", "evals/cap09/TS-910.eval.mjs", 2),
    sub("TS-1001", "evals/cap10/TS-1001.eval.mjs", 2),
    sub("TS-1002-cfg-no-ripwire", "evals/cap10/TS-1002.eval.mjs", 2),
    sub("TS-1002-cfg-bare", "evals/cap10/TS-1002.eval.mjs", 2),
    sub("TS-1004", "evals/cap10/TS-1004.eval.mjs", 2),
    sub("TS-1005", "evals/cap10/TS-1005.eval.mjs", 2),
    sub("TS-1010", "evals/cap10/TS-1010.eval.mjs", 2),
    sub("TS-1011", "evals/cap10/TS-1011.eval.mjs", 2),
    sub("TS-1012", "evals/cap10/TS-1012.eval.mjs", 2),
    sub("TS-1013", "evals/cap10/TS-1013.eval.mjs", 2),
    sub("TS-1014", "evals/cap10/TS-1014.eval.mjs", 2),
    sub("TS-1111", "evals/cap11/TS-1111.eval.mjs", 2),
    sub("TS-1112-deepwiki-down", "evals/cap11/TS-1112.eval.mjs", 2),
    sub("TS-1112-bare", "evals/cap11/TS-1112.eval.mjs", 2),
    sub("TS-1112-node18", "evals/cap11/TS-1112.eval.mjs", 2),
  ]);
  // 87 rows: TS-634 and INJ-21 (revision D-035) of the paid class and 85 of the Claude Code subscription
  // class, 15 of rule 1 (TS-226-blocking from revision D-037, TS-511 from revision D-039), 69 of rule 2
  // (TS-320 from revision D-038, the forty-two release-standard rows from revision D-040)
  // and one (TS-421-agent) in neither list.
  assert.equal(CAP_EXCEPTIONS.length, 87);
  const subs = CAP_EXCEPTIONS.filter((e) => e.host === "claude-code" && e.auth === "subscription");
  assert.equal(subs.length, 85);
  assert.equal(subs.filter((e) => e.rule === 1).length, 15);
  assert.equal(subs.filter((e) => e.rule === 2).length, 69);
  assert.deepEqual(subs.filter((e) => e.rule === null).map((e) => e.row), ["TS-421-agent"]);
  // Rerun caps (revision D-033): 3.00 USD for the 15 rule-1 rows, 1.50 USD for the 69 rule-2 rows and
  // TS-421-agent; TS-634 and INJ-21 have none. Only INJ-21 on opencode gives a session cap.
  assert.equal(subs.filter((e) => e.rerunUsd === 3.0).length, 15);
  assert.ok(subs.filter((e) => e.rerunUsd === 3.0).every((e) => e.rule === 1));
  assert.equal(subs.filter((e) => e.rerunUsd === 1.5).length, 70);
  assert.ok(subs.filter((e) => e.rerunUsd === 1.5).every((e) => e.rule !== 1));
  assert.deepEqual(CAP_EXCEPTIONS.filter((e) => e.rerunUsd === null).map((e) => e.row), ["TS-634", "INJ-21"]);
  assert.deepEqual(CAP_EXCEPTIONS.filter((e) => "sessionUsd" in e).map((e) => [e.row, e.host, e.auth, (e as { sessionUsd?: number }).sessionUsd]), [["INJ-21", "opencode", null, 1.0]]);
  // Revision D-037: of evals/cap02/TS-226.eval.mjs only TS-226-blocking has a row.
  assert.deepEqual(CAP_EXCEPTIONS.filter((e) => e.file === "evals/cap02/TS-226.eval.mjs").map((e) => e.row), ["TS-226-blocking"]);
  // Every case file of the table exists, the five near-cap rows' files (TS-127, TS-201, TS-418, TS-424, INJ-18)
  // and evals/cap02/TS-225.eval.mjs included.
  for (const e of CAP_EXCEPTIONS) assert.ok(readFileSync(join(ROOT, ...e.file.split("/")), "utf8").length > 0, e.file);
});

test("C002-TS-679 (supporting, revision D-040): every row of the 3-run class of C001-ADR-003 has a row of the §2.2 table", async () => {
  const adr = readFileSync(join(ROOT, ".sdd", "001-architect-agent-suite", "20-plan", "20-decisions", "ADR-003-eval-tiers.md"), "utf8");
  const line = adr.split(/\r?\n/).find((l) => l.startsWith("| 3 | C001-TC-") && l.endsWith("| standard |"));
  assert.ok(line, "the 3-run row of C001-ADR-003");
  const numbers = line!.split("|")[2]!.replace(/C001-TC-/g, "").split(",").map((n) => n.trim());
  assert.equal(numbers.length, 65);
  const subs = CAP_EXCEPTIONS.filter((e) => e.host === "claude-code" && e.auth === "subscription");
  const files = new Set<string>();
  for (const n of numbers) {
    // C001-TC-612 and C001-TC-613 run on the one row of evals/cap06/impact.eval.mjs.
    const matching = subs.filter((e) => (n === "612" || n === "613" ? e.row === "impact" : e.row === `TS-${n}` || e.row.startsWith(`TS-${n}-`)));
    assert.ok(matching.length > 0, `C001-TC-${n} has a row`);
    for (const e of matching) {
      assert.ok(e.rule === 1 || e.rule === 2, `${e.row} is in a rule`);
      files.add(e.file);
    }
  }
  // Every row those case files export is in the table, so no variant of a scenario is left out.
  for (const file of files) {
    const exported = (await import(pathToFileURL(join(ROOT, ...file.split("/"))).href)).default;
    for (const { id } of Array.isArray(exported) ? exported : [exported]) assert.ok(subs.some((e) => e.row === id && e.file === file), `${id} of ${file} has a row`);
  }
});

test("C002-TS-679 (supporting, revision D-040): the release-standard row TS-313 gets 1.50 USD only with --cap-exception on Claude Code under --auth subscription; rows outside the table stay refused", () => {
  // capCheck is JavaScript, so its inferred parameter type takes no auth string and needs maxBudgetUsd.
  const check = capCheck as unknown as (row: Record<string, unknown>) => { caps?: { turns: number; usd: number }; refusal?: string };
  const FILE = "evals/cap03/TS-313.eval.mjs";
  const base = { id: "TS-313", file: FILE, host: "claude-code", auth: "subscription", maxTurns: 24 };
  assert.deepEqual(check(base), { caps: { turns: 24, usd: 0.5 } });
  assert.deepEqual(check({ ...base, capExceptionRun: true }), { caps: { turns: 24, usd: 1.5 } });
  const refused = [
    { ...base, auth: "api-key" },
    { ...base, host: "opencode", auth: null },
    { ...base, host: "copilot-cli", auth: null },
    { ...base, file: "evals/targets/other/TS-313.eval.mjs" },
    // Release-high and injection rows without a row of the table keep their refusal.
    { ...base, id: "TS-133", file: "evals/cap01/TS-133.eval.mjs" },
    { ...base, id: "TS-209", file: "evals/cap02/TS-209.eval.mjs" },
    { ...base, id: "TS-212", file: "evals/cap02/TS-212.eval.mjs" },
    { ...base, id: "TS-226-gate", file: "evals/cap02/TS-226.eval.mjs" },
    { ...base, id: "TS-803", file: "evals/cap08/TS-803.eval.mjs" },
    { ...base, id: "TS-804-unattended", file: "evals/cap08/TS-804.eval.mjs" },
    { ...base, id: "TS-1015", file: "evals/cap10/TS-1015.eval.mjs" },
    { ...base, id: "TS-1124", file: "evals/cap11/TS-1124.eval.mjs" },
    { ...base, id: "INJ-01", file: INJ },
  ];
  for (const row of refused) assert.match(check({ ...row, capExceptionRun: true }).refusal ?? "", /--cap-exception given/, `${row.id} of ${row.file} on ${row.host}`);
});

/** `[file, value]` of every `<field>: <number>` in the case files under evals/ (harness, results and node_modules left out). */
function caseValues(field: string): [string, number][] {
  const out: [string, number][] = [];
  const re = new RegExp(`\\b${field}\\s*:\\s*([0-9.]+)`, "g");
  const walk = (d: string) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isDirectory()) {
        if (!["node_modules", "results", "harness"].includes(e.name)) walk(p);
      } else if (e.name.endsWith(".mjs")) {
        for (const m of readFileSync(p, "utf8").matchAll(re)) out.push([relative(ROOT, p).split("\\").join("/"), Number(m[1])]);
      }
    }
  };
  walk(join(ROOT, "evals"));
  return out;
}

test("C002-TS-679 (supporting): no case file under evals/ sets a cap above 0.50 USD but the TS-634 OpenCode row of the gate case file", () => {
  const above = caseValues("maxBudgetUsd").filter(([, v]) => v > 0.5 + 1e-9).map(([f, v]) => `${f}: ${v.toFixed(1)}`);
  assert.deepEqual(above, ["evals/targets/gate/TS-634.eval.mjs: 2.0"]);
  // The TS-634 row is an OpenCode row (its host field), so the exception's host matches it.
  const text = readFileSync(join(ROOT, "evals", "targets", "gate", "TS-634.eval.mjs"), "utf8");
  assert.match(text, /\.\.\.OPENCODE/);
  assert.match(readFileSync(join(ROOT, "evals", "targets", "gate", "gate-cases.mjs"), "utf8"), /export const OPENCODE = \{ host: "opencode"/);
});

test("C002-TS-679 (supporting): no case file under evals/ sets a row above 30 turns but TS-213 and TS-221 of evals/cap02/", () => {
  const above = caseValues("maxTurns").filter(([, v]) => v > 30).map(([f, v]) => `${f}: ${v}`);
  assert.deepEqual(above.sort(), ["evals/cap02/TS-213.eval.mjs: 40", "evals/cap02/TS-221.eval.mjs: 40"]);
});
