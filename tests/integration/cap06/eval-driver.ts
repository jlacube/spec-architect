// Shared driver of the runner tests that go through `evals/harness/run.mjs` `main` (C002-TC-614 Claude Code
// rows, C002-TC-679): a child process runs `main` with the given arguments, the stub host in place of the
// OpenCode and Copilot CLI runners, and the Agent SDK stub (sdk-stub, `evals/harness/runners/sdk-stub.mjs`)
// in place of the SDK's `query` on the Claude Code path, through the harness context of session.mjs. The
// child gets a dummy OAuth token, a temporary EVAL_CLAUDE_CONFIG_DIR and a dummy CLAUDE_CODE_EXECPATH, and
// EVAL_HOST and EVAL_AUTH unset: no Claude Code process starts, no ledger is written, nothing is billed.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { repoRoot } from "../../helpers.ts";

export interface DriverRun {
  status: number | null;
  out: string;
  /** The caps each session was given, in session order: `{ turns, usd }` (OpenCode and Copilot stubs: `turns` null). */
  given: { turns: number | null; usd: number }[];
  /** The result records of the run. */
  records: Record<string, any>[];
}

/** Writes a case file with one row at `file` (relative, `/` separators) under `fxRoot`. */
export function writeCase(fxRoot: string, file: string, row: { id: string; maxBudgetUsd?: number; maxTurns?: number }): string {
  const p = join(fxRoot, ...file.split("/"));
  mkdirSync(dirname(p), { recursive: true });
  const caps = [row.maxBudgetUsd !== undefined ? `maxBudgetUsd: ${row.maxBudgetUsd}, ` : "", row.maxTurns !== undefined ? `maxTurns: ${row.maxTurns}, ` : ""].join("");
  writeFileSync(p, `export default { id: ${JSON.stringify(row.id)}, title: "fx-evals-caps", agent: "architect:sdd-conductor", fixture: null, prompt: "hi", ${caps}assert: () => [] };\n`);
  return p;
}

/**
 * Runs `main(args)` in a child process; `root` is the repository root of the case-file match (the
 * fixture root); `usdPerTurn` the notional cost per turn of the Agent SDK stub.
 */
export function runDriver(args: string[], { root, usdPerTurn = 0.01 }: { root: string; usdPerTurn?: number }): DriverRun {
  const ROOT = repoRoot();
  const dir = mkdtempSync(join(tmpdir(), "sdd-eval-driver-"));
  const script = join(dir, "driver.mjs");
  const log = join(dir, "given.log");
  const res = join(dir, "results");
  const url = (p: string) => pathToFileURL(join(ROOT, "evals", "harness", p)).href;
  writeFileSync(
    script,
    [
      `import { appendFileSync } from "node:fs";`,
      `import { main } from ${JSON.stringify(url("run.mjs"))};`,
      `import { setHarnessContext } from ${JSON.stringify(url("session.mjs"))};`,
      `import { sdkStub } from ${JSON.stringify(url("runners/sdk-stub.mjs"))};`,
      `import { runOpenCodeSession } from ${JSON.stringify(url("runners/opencode.mjs"))};`,
      `import { stubHost } from ${JSON.stringify(url("runners/stub.mjs"))};`,
      `const note = (turns, usd) => appendFileSync(${JSON.stringify(log)}, JSON.stringify({ turns, usd }) + "\\n");`,
      `const stub = (o) => { note(null, o.maxBudgetUsd); return runOpenCodeSession(o, { host: stubHost({ endAfter: 1 }) }); };`,
      `setHarnessContext({ query: sdkStub({ usdPerTurn: ${usdPerTurn}, onOptions: (o) => note(o.maxTurns, o.maxBudgetUsd) }) });`,
      `process.exitCode = await main(JSON.parse(process.argv[2]), { runners: { opencode: stub, "copilot-cli": stub }, ledger: "unused", root: ${JSON.stringify(root)} });`,
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
    const r = spawnSync(process.execPath, [script, JSON.stringify([...args, "--results-dir", res])], { cwd: ROOT, env, encoding: "utf8", windowsHide: true, timeout: 120_000 });
    const given = existsSync(log) ? readFileSync(log, "utf8").split("\n").filter((l) => l !== "").map((l) => JSON.parse(l) as { turns: number | null; usd: number }) : [];
    const records = existsSync(res) ? readdirSync(res).filter((f) => f.endsWith(".json")).flatMap((f) => (JSON.parse(readFileSync(join(res, f), "utf8")) as { records: Record<string, any>[] }).records) : [];
    return { status: r.status, out: `${r.stdout}\n${r.stderr}`, given, records };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
