// C002-NFR-101: refusal time of the sdd MCP server, p95 over 50 refused calls, threshold 300 ms. Each
// profile's server is started once (rules and schemas loaded once per process, architecture §6.1) in a
// throwaway repository; the calls alternate between refused write calls (deny cases of the path guard
// corpus) and refused command calls (deny cases of the bash guard corpus). A warm-up pass sends every
// selected case once and checks that each one is refused, before the timed calls start.
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { startServer } from "./mcp-client.mjs";
import { p95, record, ROOT } from "./lib.mjs";

const RUNS = 50;
const THRESHOLD_MS = 300;

const corpus = (name) => JSON.parse(readFileSync(join(ROOT, "tests", "guards", name), "utf8")).cases;

/** Deny cases of the path corpus that need only the {repo} placeholder and no link, UNC or identity setup. */
const PATH_CATEGORIES = new Set(["outside", "prefix", "traversal", "case", "separators", "drive", "windows-names", "unc"]);
function pathCases(root) {
  return corpus("path-corpus.json")
    .filter((c) => c.expect === "deny" && PATH_CATEGORIES.has(c.category) && (c.tool === "Write" || c.tool === "Edit") && typeof c.path === "string")
    .filter((c) => !/\{(?!repo\})/.test(c.path) && !/^[\\/]{2}/.test(c.path) && !/link/i.test(c.path))
    .map((c) => ({ id: c.id, name: "write_file", args: { path: c.path.split("{repo}").join(root), content: "x" } }));
}

/** Deny cases of the bash corpus without placeholders, stdin, cwd or environment, and not identity cases. */
const BASH_SKIP = new Set(["identity", "malformed"]);
function commandCases() {
  return corpus("bash-corpus.json")
    .filter((c) => c.expect === "deny" && !BASH_SKIP.has(c.category) && (c.tool === "Bash" || c.tool === "PowerShell"))
    .filter((c) => c.stdin === undefined && c.cwd === undefined && c.env === undefined && typeof c.command === "string" && !/\{[a-z]/i.test(c.command))
    .map((c) => ({ id: c.id, name: "run_command", args: { command: c.command, ...(c.tool === "PowerShell" ? { dialect: "powershell" } : {}) } }));
}

function fixture() {
  const root = realpathSync.native(mkdtempSync(join(tmpdir(), "sdd-fx-mcp-bench-")));
  for (const [rel, content] of Object.entries({ ".sdd/SDD.md": "# SDD workspace\n", ".sdd/004-x/existing.md": "x\n", "src/app.ts": "x\n", "README.md": "x\n" })) {
    const p = join(root, ...rel.split("/"));
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, content);
  }
  return { root, cleanup: () => rmSync(root, { recursive: true, force: true }) };
}

export async function benchMcpRefusals() {
  const fx = fixture();
  const root = fx.root.split("\\").join("/");
  const files = await startServer("files", fx.root);
  const shell = await startServer("shell", fx.root);
  try {
    const server = { write_file: files, run_command: shell };
    const pick = (cases, n) => Array.from({ length: n }, (_, i) => cases[Math.floor((i * cases.length) / n)]);
    const paths = pick(pathCases(root), RUNS / 2);
    const commands = pick(commandCases(), RUNS / 2);
    // Warm-up: every case once; each must be refused by the guard core.
    for (const c of [...paths, ...commands]) {
      const { result } = await server[c.name].call(c.name, c.args);
      // A refusal is a text-only error result whose text starts with the guard rule (C002-IF-002 §6.1).
      if (result.isError !== true || "structuredContent" in result || !/^GUARD-(PATH|BASH)-00\d: /.test(result.content?.[0]?.text ?? "")) throw new Error(`${c.id} was not refused: ${JSON.stringify(result)}`);
    }
    const calls = paths.flatMap((p, i) => [p, commands[i]]);
    const times = [];
    for (const c of calls) times.push((await server[c.name].call(c.name, c.args)).ms);
    const value = p95(times);
    return record("mcp-refusals", {
      nfr: "C002-NFR-101",
      threshold_ms: THRESHOLD_MS,
      runs: times.length,
      cases: calls.map((c) => c.id),
      times_ms: times.map((t) => Math.round(t * 10) / 10),
      p95_ms: value,
      pass: value <= THRESHOLD_MS,
    });
  } finally {
    await files.close();
    await shell.close();
    fx.cleanup();
  }
}

if (fileURLToPath(import.meta.url) === process.argv[1]) await benchMcpRefusals();
