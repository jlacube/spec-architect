// Shared driver of the runner tests that go through `evals/harness/run.mjs` `main` (C002-TC-614 Claude Code
// rows, C002-TC-679, C002-TC-928 … C002-TC-930): a child process runs `main` with the given arguments, the
// stub host in place of the OpenCode and Copilot CLI runners, and the Agent SDK stub (sdk-stub,
// `evals/harness/runners/sdk-stub.mjs`) in place of the SDK's `query` on the Claude Code path, through the
// harness context of session.mjs. The child gets a dummy OAuth token, a temporary EVAL_CLAUDE_CONFIG_DIR and
// a dummy CLAUDE_CODE_EXECPATH, and EVAL_HOST and EVAL_AUTH unset: no Claude Code process starts, nothing is
// billed. The ledger is a file of the driver's temporary folder unless the test gives one.
// A run on `--host claude-code` runs on the mock timers of `node:test` (C002-T-069, critic CR-110): the child
// enables `mock.timers` for `setTimeout` and `Date` and moves the clock on by 5 ms whenever the event loop
// has run its pending work, so the stub's schedule, the usage delays, the 30 s read timeout, the 5 s settle
// time and the 30 s wait after `interrupt()` take no real time. No option or variable of the runner changes them.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { repoRoot } from "../../helpers.ts";

export interface DriverRun {
  status: number | null;
  out: string;
  /** Standard output of the child only (the run's lines). */
  stdout: string;
  /**
   * The caps each session was given, in session order: `{ turns, usd }`. OpenCode and Copilot stubs:
   * `turns` null, `usd` the spend cap. Claude Code (the Agent SDK stub): `turns` the `maxTurns` option and
   * `usd` the `maxBudgetUsd` option, null when none was passed.
   */
  given: { turns: number | null; usd: number | null }[];
  /** The result records of the run. */
  records: Record<string, any>[];
  /** The transcripts the run wrote, in file-name order. */
  transcripts: any[][];
  /** Every record of the Agent SDK stub (`ev`: options, request, answer, refused, interrupt, close, permission, call-end). */
  stub: Record<string, any>[];
}

/** Writes a case file with one row at `file` (relative, `/` separators) under `fxRoot`. */
/**
 * `stopWhen` (C002-T-072): the JS source of the row's condition, a function expression; each call is
 * written to `stopWhen.log` (one line `{ n, last }`: the transcript's length and its last record's event or
 * message type) before the condition runs. `assert`: the JS source of the row's assert (default `() => []`).
 */
export function writeCase(fxRoot: string, file: string, row: { id: string; maxBudgetUsd?: number; maxTurns?: number; prompt?: string; allowTools?: string[]; stopWhen?: { source: string; log: string }; assert?: string }): string {
  const p = join(fxRoot, ...file.split("/"));
  mkdirSync(dirname(p), { recursive: true });
  const caps = [row.maxBudgetUsd !== undefined ? `maxBudgetUsd: ${row.maxBudgetUsd}, ` : "", row.maxTurns !== undefined ? `maxTurns: ${row.maxTurns}, ` : ""].join("");
  const allow = row.allowTools ? `allowTools: ${JSON.stringify(row.allowTools)}, ` : "";
  const head = row.stopWhen ? `import { appendFileSync } from "node:fs";\nconst condition = ${row.stopWhen.source};\n` : "";
  const stop = row.stopWhen ? `stopWhen: (tr, answers) => { appendFileSync(${JSON.stringify(row.stopWhen.log)}, JSON.stringify({ n: tr.length, last: tr.at(-1)?.event ?? tr.at(-1)?.message?.type ?? null }) + "\\n"); return condition(tr, answers); }, ` : "";
  writeFileSync(p, `${head}export default { id: ${JSON.stringify(row.id)}, title: "fx-evals-caps", agent: "architect:sdd-conductor", fixture: null, prompt: ${JSON.stringify(row.prompt ?? "hi")}, ${caps}${allow}${stop}assert: ${row.assert ?? "() => []"} };\n`);
  return p;
}

/**
 * Runs `main(args)` in a child process; `root` is the repository root of the case-file match (the
 * fixture root); `stub` the configuration of the Agent SDK stub (JSON; default: `usdPerTurn` per model
 * call, one call per second, a result at once after an interrupt); `ledger` the ledger file.
 */
export function runDriver(args: string[], { root, usdPerTurn = 0.01, stub, ledger }: { root: string; usdPerTurn?: number; stub?: Record<string, unknown>; ledger?: string }): DriverRun {
  const ROOT = repoRoot();
  const dir = mkdtempSync(join(tmpdir(), "sdd-eval-driver-"));
  const script = join(dir, "driver.mjs");
  const log = join(dir, "given.log");
  const stubLog = join(dir, "stub.log");
  const res = join(dir, "results");
  const clock = args.includes("claude-code");
  const config = stub ?? { usdPerCall: usdPerTurn };
  const url = (p: string) => pathToFileURL(join(ROOT, "evals", "harness", p)).href;
  writeFileSync(
    script,
    [
      `import { appendFileSync } from "node:fs";`,
      `import { mock } from "node:test";`,
      `import { main } from ${JSON.stringify(url("run.mjs"))};`,
      `import { setHarnessContext } from ${JSON.stringify(url("session.mjs"))};`,
      `import { sdkStub } from ${JSON.stringify(url("runners/sdk-stub.mjs"))};`,
      `import { runOpenCodeSession } from ${JSON.stringify(url("runners/opencode.mjs"))};`,
      `import { stubHost } from ${JSON.stringify(url("runners/stub.mjs"))};`,
      `const note = (turns, usd) => appendFileSync(${JSON.stringify(log)}, JSON.stringify({ turns, usd }) + "\\n");`,
      `const stub = (o) => { note(null, o.maxBudgetUsd); return runOpenCodeSession(o, { host: stubHost({ endAfter: 1 }) }); };`,
      `const stubLog = (e) => appendFileSync(${JSON.stringify(stubLog)}, JSON.stringify(e) + "\\n");`,
      `setHarnessContext({ query: sdkStub({ ...${JSON.stringify(config)}, log: stubLog, onOptions: (o) => note(o.maxTurns, o.maxBudgetUsd ?? null) }) });`,
      `const run = () => main(JSON.parse(process.argv[2]), { runners: { opencode: stub, "copilot-cli": stub }, ledger: ${JSON.stringify(ledger ?? join(dir, "ledger.json"))}, root: ${JSON.stringify(root)} });`,
      clock
        ? [
            `const realImmediate = setImmediate;`,
            `mock.timers.enable({ apis: ["setTimeout", "Date"], now: Date.now() });`,
            `let done = false;`,
            `const p = run().finally(() => { done = true; });`,
            `while (!done) { await new Promise((r) => realImmediate(r)); mock.timers.tick(5); }`,
            `process.exitCode = await p;`,
          ].join("\n")
        : `process.exitCode = await run();`,
    ].join("\n"),
  );
  const env: Record<string, string | undefined> = { ...process.env };
  for (const k of Object.keys(env)) if (/^(CLAUDE|ANTHROPIC)/.test(k)) delete env[k];
  delete env["EVAL_HOST"];
  delete env["EVAL_AUTH"];
  delete env["EVAL_CLAUDE_OAUTH_TOKEN_FILE"];
  env["EVAL_CLAUDE_OAUTH_TOKEN"] = "dummy-token-for-the-sdk-stub";
  env["EVAL_CLAUDE_CONFIG_DIR"] = join(dir, "claude-config");
  env["CLAUDE_CODE_EXECPATH"] = join(dir, "no-claude.exe");
  try {
    const r = spawnSync(process.execPath, ["--no-warnings", script, JSON.stringify([...args, "--results-dir", res])], { cwd: ROOT, env, encoding: "utf8", windowsHide: true, timeout: 120_000 });
    const lines = (f: string) => (existsSync(f) ? readFileSync(f, "utf8").split("\n").filter((l) => l !== "").map((l) => JSON.parse(l)) : []);
    const given = lines(log) as { turns: number | null; usd: number | null }[];
    const records = existsSync(res) ? readdirSync(res).filter((f) => f.endsWith(".json")).flatMap((f) => (JSON.parse(readFileSync(join(res, f), "utf8")) as { records: Record<string, any>[] }).records) : [];
    const tdir = join(res, "transcripts");
    const transcripts = existsSync(tdir) ? readdirSync(tdir).sort().map((f) => JSON.parse(readFileSync(join(tdir, f), "utf8")) as any[]) : [];
    return { status: r.status, out: `${r.stdout}\n${r.stderr}`, stdout: r.stdout ?? "", given, records, transcripts, stub: lines(stubLog) };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
