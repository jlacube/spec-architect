// C002-TC-679 (C002-TS-679; C002-T-065): a case cap above 0.50 USD runs only for a listed cap exception
// (C002-IF-010 §2.2 "Caps above 0.50 USD", critic CR-68). fx-evals-caps: a temporary case folder with one
// case file per row at the row's `file` path, relative to the fixture root, which run.mjs takes as the
// repository root for the case-file match; `node evals/harness/run.mjs --host <host> --only <row>` runs in
// a child process from the source files with a stub host in place of the host of `--host` that records
// the spend cap it is given; no ledger write, no paid session. A supporting test reads every case file
// under evals/ and finds no row above 0.50 USD other than the TS-634 OpenCode row of the gate case file.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { pathToFileURL } from "node:url";
import { CAP_EXCEPTIONS } from "../../../evals/harness/caps.mjs";
import { repoRoot } from "../../helpers.ts";

const ROOT = repoRoot();

/** Runs run.mjs `main` in a child process with the stub host for every host; returns the exit code, the output and the caps the stub got. */
function runCaps(fxRoot: string, file: string, host: string, row: string): { status: number | null; out: string; caps: number[]; records: Record<string, any>[] } {
  const dir = mkdtempSync(join(tmpdir(), "sdd-caps-run-"));
  const script = join(dir, "driver.mjs");
  const capsLog = join(dir, "caps.log");
  const res = join(dir, "results");
  const url = (p: string) => pathToFileURL(join(ROOT, "evals", "harness", p)).href;
  writeFileSync(
    script,
    [
      `import { appendFileSync } from "node:fs";`,
      `import { main } from ${JSON.stringify(url("run.mjs"))};`,
      `import { runOpenCodeSession } from ${JSON.stringify(url("runners/opencode.mjs"))};`,
      `import { stubHost } from ${JSON.stringify(url("runners/stub.mjs"))};`,
      `const stub = (o) => { appendFileSync(${JSON.stringify(capsLog)}, String(o.maxBudgetUsd) + "\\n"); return runOpenCodeSession(o, { host: stubHost({ endAfter: 1 }) }); };`,
      `process.exitCode = await main(JSON.parse(process.argv[2]), { runners: { opencode: stub, "claude-code": stub, "copilot-cli": stub }, ledger: "unused", root: ${JSON.stringify(fxRoot)} });`,
    ].join("\n"),
  );
  try {
    const r = spawnSync(process.execPath, [script, JSON.stringify([join(fxRoot, ...file.split("/")), "--host", host, "--only", row, "--results-dir", res])], { cwd: ROOT, encoding: "utf8", windowsHide: true, timeout: 120_000 });
    const caps = existsSync(capsLog) ? readFileSync(capsLog, "utf8").split("\n").filter((l) => l !== "").map(Number) : [];
    const records = existsSync(res) ? readdirSync(res).filter((f) => f.endsWith(".json")).flatMap((f) => (JSON.parse(readFileSync(join(res, f), "utf8")) as { records: Record<string, any>[] }).records) : [];
    return { status: r.status, out: `${r.stdout}\n${r.stderr}`, caps, records };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const ROWS: { file: string; row: string; cap: number; host: string; runs: boolean }[] = [
  { file: "evals/targets/gate/TS-634.eval.mjs", row: "TS-634", cap: 1.0, host: "opencode", runs: true },
  { file: "evals/targets/gate/TS-634.eval.mjs", row: "TS-634", cap: 0.8, host: "opencode", runs: true },
  { file: "evals/targets/gate/TS-634.eval.mjs", row: "TS-634", cap: 1.2, host: "opencode", runs: false },
  { file: "evals/targets/gate/TS-634.eval.mjs", row: "TS-634", cap: 1.0, host: "copilot-cli", runs: false },
  { file: "evals/targets/other/TS-634.eval.mjs", row: "TS-634", cap: 1.0, host: "opencode", runs: false },
  { file: "evals/targets/gate/TS-613.eval.mjs", row: "TS-613", cap: 0.75, host: "opencode", runs: false },
  { file: "evals/targets/gate/TS-613.eval.mjs", row: "TS-613", cap: 0.5, host: "opencode", runs: true },
];

ROWS.forEach((row, i) => {
  test(`C002-TS-679 row ${i + 1} — ${row.row} of ${row.file} at ${row.cap.toFixed(2)} USD on ${row.host}: ${row.runs ? "one session at that cap" : "exit 1 before any session"}`, () => {
    const fx = mkdtempSync(join(tmpdir(), "sdd-fx-evals-caps-"));
    try {
      const file = join(fx, ...row.file.split("/"));
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, `export default { id: ${JSON.stringify(row.row)}, title: "fx-evals-caps", agent: "architect:sdd-conductor", fixture: null, prompt: "hi", maxBudgetUsd: ${row.cap}, assert: () => [] };\n`);
      const r = runCaps(fx, row.file, row.host, row.row);
      if (row.runs) {
        assert.equal(r.status, 0, r.out);
        assert.deepEqual(r.caps, [row.cap], "one session, given the row's cap");
        assert.equal(r.records.length, 1);
        assert.equal(r.records[0]!["caps"].usd, row.cap);
        assert.equal(r.records[0]!["caps"].turns, 30);
      } else {
        assert.equal(r.status, 1, r.out);
        assert.deepEqual(r.caps, [], "the stub never started");
        assert.ok(r.out.includes(row.row) && r.out.includes(row.file), r.out);
        assert.match(r.out, /no session started/);
      }
    } finally {
      rmSync(fx, { recursive: true, force: true });
    }
  });
});

test("C002-TS-679 (supporting): the exceptions in force are TS-634 of evals/targets/gate/TS-634.eval.mjs on opencode at 1.00 USD only", () => {
  assert.deepEqual(CAP_EXCEPTIONS, [{ row: "TS-634", file: "evals/targets/gate/TS-634.eval.mjs", host: "opencode", usd: 1.0 }]);
});

test("C002-TS-679 (supporting): no case file under evals/ sets a cap above 0.50 USD but the TS-634 OpenCode row of the gate case file", () => {
  const above: string[] = [];
  const walk = (d: string) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isDirectory()) {
        if (!["node_modules", "results", "harness"].includes(e.name)) walk(p);
      } else if (e.name.endsWith(".mjs")) {
        for (const m of readFileSync(p, "utf8").matchAll(/\bmaxBudgetUsd\s*:\s*([0-9.]+)/g))
          if (Number(m[1]) > 0.5 + 1e-9) above.push(`${relative(ROOT, p).split("\\").join("/")}: ${m[1]}`);
      }
    }
  };
  walk(join(ROOT, "evals"));
  assert.deepEqual(above, ["evals/targets/gate/TS-634.eval.mjs: 1.0"]);
  // The TS-634 row is an OpenCode row (its host field), so the exception's host matches it.
  const text = readFileSync(join(ROOT, "evals", "targets", "gate", "TS-634.eval.mjs"), "utf8");
  assert.match(text, /\.\.\.OPENCODE/);
  assert.match(readFileSync(join(ROOT, "evals", "targets", "gate", "gate-cases.mjs"), "utf8"), /export const OPENCODE = \{ host: "opencode"/);
});
