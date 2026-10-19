// Shared parts of the replay adapters of C002-T-041 (`sdd-mcp-server`, `copilot-hooks`): the target
// package generated for an enforcement mode (once per process, as `npm run generate` writes it), the
// grants of its agents (C002-IF-009 §2.2: an agent not granted the tool a case maps to leaves the case
// to the conductor; the server's Read/Glob/Grep row), and the sandbox every spawned process runs in.
//
// Sandbox (lesson of C002-T-043: an allowed `node <sdd.mjs> serena-launch …` started the real Serena):
// PATH holds only a folder of inert stubs, one for every allowlisted executable other than `node`
// (an extensionless script that exits 0 and, on Windows, a `.cmd` twin), and the folder of the Node.js
// executable running the replay; SERENA_HOME, LOCALAPPDATA and XDG_DATA_HOME point into the run folder,
// so no case writes the user's `~/.serena` or per-user data folder, and no real Serena, ripwire,
// ast-grep, uv or git starts. The sdd MCP server runs a `.cmd`-only match never (ERR-MCP-006), and a
// Windows process start without a shell finds no `.exe` stub: both are results after the boundary
// allowed the call, so the decision is unchanged (C002-IF-009 §2.3).
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, dirname, join } from "node:path";
import { parse as parseYaml } from "yaml";
import { main as generate } from "../../../scripts/generate/main.ts";
import { loadTargetTable, type Mode, toolGrants } from "../../../scripts/generate/tables.ts";
import { repoRoot } from "../../helpers.ts";
import type { Target } from "../adapter.ts";

const WIN = process.platform === "win32";

/** Allowlisted executables (C001-IF-07 §3, C002-IF-008 §1) that the sandbox replaces by inert stubs; `node` stays real. */
export const INERT = ["sdd", "sdd-mcp", "git", "ripwire", "ast-grep", "sg", "serena", "uv", "uvx", "claude"];

/** Environment variables of the replay's own process that no spawned mechanism inherits. */
const DROPPED = ["CLAUDE_PLUGIN_ROOT", "CLAUDE_PLUGIN_DATA", "CLAUDE_PROJECT_DIR", "SDD_DEBUG", "SDD_TEST_FAULT", "SERENA_HOME", "XDG_DATA_HOME", "NODE_PATH"];

/** The sandbox of one adapter run: the stub folder and the environment of every spawned process. */
export interface Sandbox {
  runDir: string;
  bin: string;
  /** The process environment with the case's environment stub applied (values already resolved). */
  env(stub?: Record<string, string | null>): Record<string, string>;
  cleanup(): void;
}

export function createSandbox(prefix: string): Sandbox {
  const runDir = mkdtempSync(join(tmpdir(), prefix));
  const bin = join(runDir, "bin");
  mkdirSync(bin, { recursive: true });
  for (const exe of INERT) {
    writeFileSync(join(bin, exe), "#!/bin/sh\nexit 0\n", { mode: 0o755 });
    if (WIN) writeFileSync(join(bin, `${exe}.cmd`), "@exit /b 0\r\n");
  }
  const local = join(runDir, "localappdata");
  const xdg = join(runDir, "xdg-data");
  mkdirSync(local, { recursive: true });
  mkdirSync(xdg, { recursive: true });
  const base: Record<string, string> = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (v === undefined || DROPPED.includes(k.toUpperCase()) || k.toUpperCase() === "PATH") continue;
    base[k] = v;
  }
  const pathKey = WIN ? "Path" : "PATH";
  base[pathKey] = [bin, dirname(process.execPath)].join(delimiter);
  base["SERENA_HOME"] = join(runDir, "serena-home");
  base["XDG_DATA_HOME"] = xdg;
  if (WIN) base["LOCALAPPDATA"] = local;
  return {
    runDir,
    bin,
    env(stub) {
      const env = { ...base };
      for (const [k, v] of Object.entries(stub ?? {})) {
        if (v === null) delete env[k];
        else env[k] = v;
      }
      return env;
    },
    cleanup() {
      if (process.env["SDD_REPLAY_KEEP_RUN"]) {
        console.log(`replay: run folder kept: ${runDir}`);
        return;
      }
      rmSync(runDir, { recursive: true, force: true, maxRetries: 20, retryDelay: 250 });
    },
  };
}

const packages = new Map<string, string>();
let packageRoot: string | undefined;

/** The target package generated for `mode` (once per process), as `npm run generate` writes it. */
export function generatedPackage(target: Target, mode: Mode): string {
  const key = `${target}:${mode}`;
  const done = packages.get(key);
  if (done) return done;
  if (!packageRoot) {
    packageRoot = mkdtempSync(join(tmpdir(), "sdd-replay-pkg-"));
    const dir = packageRoot;
    process.once("exit", () => rmSync(dir, { recursive: true, force: true }));
  }
  const out = join(packageRoot, `${target}-${mode}`);
  const lines: string[] = [];
  const code = generate(["--target", target, "--mode", `${target}=${mode}`, "--source", join(repoRoot(), "plugins", "architect"), "--out", out, "--quiet"], {
    cwd: repoRoot(),
    stdout: (l) => lines.push(l),
    stderr: (l) => lines.push(l),
  });
  if (code !== 0) throw new Error(`generating the ${target} package (${mode}) failed (exit ${code}):\n${lines.join("\n")}`);
  const dir = join(out, target);
  packages.set(key, dir);
  return dir;
}

/** The source tool whose table row a corpus tool takes (§2.2 rows: NotebookEdit as Write, MultiEdit as Edit, PowerShell as Bash). */
function tableTool(corpusTool: string): string {
  if (corpusTool === "NotebookEdit") return "Write";
  if (corpusTool === "MultiEdit") return "Edit";
  if (corpusTool === "PowerShell") return "Bash";
  return corpusTool;
}

export type Grants = (agent: string, corpusTool: string) => boolean;

/**
 * The grants of the generated package's agents: true when the package grants `agent` a tool the
 * target's table maps `corpusTool` to under `mode`; true also for a corpus tool the table does not map
 * (the case then decides by its own input) and for an agent the package does not hold.
 */
export function packageGrants(target: Target, mode: Mode, pkg: string): Grants {
  const table = loadTargetTable(repoRoot(), target);
  let granted: (agent: string, tool: string) => boolean | undefined;
  if (target === "opencode") {
    const config = JSON.parse(readFileSync(join(pkg, "opencode.json"), "utf8")) as { agent?: Record<string, { tools?: Record<string, boolean> }> };
    granted = (agent, tool) => {
      const tools = config.agent?.[agent]?.tools;
      return tools === undefined ? undefined : (tools[tool] ?? tools["*"] ?? true);
    };
  } else {
    const lists = new Map<string, string[] | null>();
    const toolsOf = (agent: string): string[] | null => {
      if (!lists.has(agent)) {
        let list: string[] | null = null;
        try {
          const file = (table.placement["agent_file"] ?? "{name}.agent.md").replace("{name}", agent);
          const text = readFileSync(join(pkg, table.placement["agents_dir"] ?? "agents", file), "utf8");
          const fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
          const doc = fm ? (parseYaml(fm[1]!) as { tools?: unknown }) : {};
          list = Array.isArray(doc.tools) ? doc.tools.map(String) : null;
        } catch {
          list = null;
        }
        lists.set(agent, list);
      }
      return lists.get(agent)!;
    };
    granted = (agent, tool) => {
      const list = toolsOf(agent);
      return list === null ? undefined : list.includes(tool);
    };
  }
  return (agent, corpusTool) => {
    const entry = table.tools[tableTool(corpusTool)];
    const mapped = entry === undefined ? undefined : toolGrants(entry, mode);
    if (mapped === undefined || mapped.length === 0) return true;
    const each = mapped.map((t) => granted(agent, t));
    if (each.every((g) => g === undefined)) return true;
    return each.some((g) => g === true);
  };
}

/** The first line of a file, or null when it is not a readable file. */
export function firstLine(path: unknown): string | null {
  if (typeof path !== "string" || path === "") return null;
  try {
    return readFileSync(path, "utf8").split(/\r?\n/)[0] ?? "";
  } catch {
    return null;
  }
}

const MAX_DETAIL = 500;
export const clip = (s: string): string => (s.length > MAX_DETAIL ? `${s.slice(0, MAX_DETAIL)}…` : s);
