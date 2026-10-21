// C002-TC-679 (C002-TS-679; C002-T-065; the 2.00 USD exception from C002-T-056 step X0 on; the Claude Code
// subscription class, the turn cap above 30 and `--cap-exception` from C002-T-048 step X0 on, revision
// D-025): a case cap above 0.50 USD or 30 turns, and a rerun cap, apply only for a listed cap exception
// (C002-IF-010 §2.2 "Caps above 0.50 USD", critic CR-68). An exception matches on row ID, case file, host
// and auth mode. fx-evals-caps: a temporary case folder with one case file per row at the row's `file`
// path, relative to the fixture root, which run.mjs takes as the repository root for the case-file match;
// `main` runs in a child process from the source files with the stub host for opencode and copilot-cli and
// the Agent SDK stub for claude-code (./eval-driver.ts), EVAL_HOST and EVAL_AUTH unset; no ledger write, no
// paid session. Supporting tests: CAP_EXCEPTIONS holds exactly the rows of the §2.2 table; the case files
// under evals/ set no row above 0.50 USD but the TS-634 OpenCode row, and no row above 30 turns but TS-213
// and TS-221 of evals/cap02/.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { CAP_EXCEPTIONS } from "../../../evals/harness/caps.mjs";
import { repoRoot } from "../../helpers.ts";
import { runDriver, writeCase } from "./eval-driver.ts";

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
  { file: CAP213, row: "TS-213", turns: 40, host: "claude-code", auth: "subscription", capException: true, runs: { usd: 1.5, turns: 40 } },
  { file: CAP213, row: "TS-213", turns: 40, host: "claude-code", auth: "api-key", runs: null, names: "auth api-key" },
];

const describe = (r: Row) =>
  `${r.row} of ${r.file} (${r.usd !== undefined ? r.usd.toFixed(2) + " USD" : "default USD"}, ${r.turns ?? "default"} turns) --host ${r.host}${r.auth ? " --auth " + r.auth : ""}${r.capException ? " --cap-exception" : ""}`;

ROWS.forEach((row, i) => {
  test(`C002-TS-679 row ${i + 1} — ${describe(row)}: ${row.runs ? `one session at ${row.runs.usd.toFixed(2)} USD and ${row.runs.turns} turns` : "exit 1 before any session"}`, () => {
    const fx = mkdtempSync(join(tmpdir(), "sdd-fx-evals-caps-"));
    try {
      const file = writeCase(fx, row.file, { id: row.row, ...(row.usd !== undefined ? { maxBudgetUsd: row.usd } : {}), ...(row.turns !== undefined ? { maxTurns: row.turns } : {}) });
      const args = [file, "--host", row.host, "--only", row.row, ...(row.auth ? ["--auth", row.auth] : []), ...(row.capException ? ["--cap-exception"] : [])];
      const r = runDriver(args, { root: fx });
      if (row.runs) {
        assert.equal(r.status, 0, r.out);
        assert.equal(r.given.length, 1, "one session");
        assert.equal(r.given[0]!.usd, row.runs.usd, "the session got the spend cap");
        if (row.host === "claude-code") assert.equal(r.given[0]!.turns, row.runs.turns, "the Agent SDK stub got the turn cap");
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
  const sub = (row: string, file: string, turns = 30) => ({ row, file, host: "claude-code", auth: "subscription", usd: 0.5, turns, rerunUsd: 1.5 });
  assert.deepEqual(CAP_EXCEPTIONS, [
    { row: "TS-634", file: GATE634, host: "opencode", auth: null, usd: 2.0, turns: 30, rerunUsd: null },
    sub("TS-214", CAP214),
    sub("TS-215", "evals/cap02/TS-215.eval.mjs"),
    sub("TS-318-00-ideation", "evals/cap03/TS-318.eval.mjs"),
    sub("TS-318-10-spec", "evals/cap03/TS-318.eval.mjs"),
    sub("TS-318-20-plan", "evals/cap03/TS-318.eval.mjs"),
    sub("TS-213", CAP213, 40),
    sub("TS-221", "evals/cap02/TS-221.eval.mjs", 40),
    sub("TS-419", "evals/cap04/TS-419.eval.mjs"),
    sub("TS-420", "evals/cap04/TS-420.eval.mjs"),
    sub("TS-421-agent", "evals/cap04/TS-421.eval.mjs"),
    sub("TS-713", "evals/cap07/TS-713.eval.mjs"),
    sub("TS-715", "evals/cap07/TS-715.eval.mjs"),
    sub("TS-815", "evals/cap08/TS-815.eval.mjs"),
    sub("TS-817-stop", "evals/cap08/TS-817.eval.mjs"),
    sub("TS-817-specify", "evals/cap08/TS-817.eval.mjs"),
    sub("INJ-19", "evals/injection/injection.eval.mjs"),
  ]);
  // Every case file of the table exists.
  for (const e of CAP_EXCEPTIONS) assert.ok(readFileSync(join(ROOT, ...e.file.split("/")), "utf8").length > 0, e.file);
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
