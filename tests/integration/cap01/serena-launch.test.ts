// C002-TC-125 / C002-TS-125 (C002-AC-114.1, C002-REQ-114; owned by C002-T-029, critic CR-5): Serena started
// from the `serena` declaration of the generated `opencode.json`, through the packed and globally
// installed `architect-sdd` (fx-tgz), in a copy of fx-oc, with the per-user data variable pointing at a
// temporary user profile. An MCP client sends `tools/list`: no tool of Serena's editing set is listed,
// the configuration is written in the per-user folder, and the repository gets no `.serena/` folder.
// Runs on E-SER (Serena 1.7.x installed); skipped when Serena is not installed.
// The scenario's `C:/fx-home/AppData/Local` is a folder of the test's temporary profile here
// (`<tmp>/fx-home/AppData/Local`), so the run writes nothing outside its temporary folder.
import { after, test } from "node:test";
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { main } from "../../../scripts/generate/main.ts";
import { cleanupFxTgz, fxTgz } from "../../fixtures/fx-tgz.ts";
import { repoRoot } from "../../helpers.ts";
import { serenaInstalled } from "../cap10/serena-tools.ts";

const EDITING = ["create_text_file", "replace_symbol_body", "insert_after_symbol", "execute_shell_command"];

after(() => cleanupFxTgz());

/** fx-oc (copy): a repository with `.sdd/` (change `002-x` in phase `10-spec`), `src/app.ts` and `README.md`. */
function fxOc(base: string): string {
  const repo = join(base, "fx-oc");
  mkdirSync(join(repo, ".sdd", "002-x", "10-spec"), { recursive: true });
  mkdirSync(join(repo, "src"), { recursive: true });
  writeFileSync(join(repo, ".sdd", "SDD.md"), "# SDD workspace\n");
  writeFileSync(join(repo, "src", "app.ts"), "export function f(): number {\n  return 1;\n}\n");
  writeFileSync(join(repo, "README.md"), "# fx-oc\n");
  spawnSync("git", ["init", "-q"], { cwd: repo });
  return repo;
}

/** The per-user data variable of this platform pointing at `<home>`, and the data folder it yields. */
function userData(home: string): { env: Record<string, string>; data: string } {
  if (process.platform === "win32") {
    const local = `${home}/AppData/Local`;
    return { env: { LOCALAPPDATA: local }, data: `${local}/architect-sdd` };
  }
  if (process.platform === "darwin") return { env: { HOME: home }, data: `${home}/Library/Application Support/architect-sdd` };
  return { env: { XDG_DATA_HOME: `${home}/.local/share` }, data: `${home}/.local/share/architect-sdd` };
}

/** Starts `command` as an MCP client would (the installed shim on PATH), sends initialize and tools/list. */
async function toolsList(command: string[], cwd: string, env: NodeJS.ProcessEnv, binDir: string, timeoutMs = 150000): Promise<string[]> {
  const [bin, ...args] = command as [string, ...string[]];
  const win = process.platform === "win32";
  // The npm shim of the installed package, as a host resolves `sdd` on PATH (arguments need no quoting).
  const child = win
    ? spawn(process.env.ComSpec ?? "cmd.exe", ["/d", "/s", "/c", `""${join(binDir, `${bin}.cmd`)}" ${args.join(" ")}"`], { cwd, env, stdio: ["pipe", "pipe", "pipe"], windowsVerbatimArguments: true })
    : spawn(join(binDir, bin), args, { cwd, env, stdio: ["pipe", "pipe", "pipe"] });
  const send = (msg: object) => child.stdin.write(JSON.stringify({ jsonrpc: "2.0", ...msg }) + "\n");
  let stderr = "";
  child.stderr.on("data", (d: Buffer) => (stderr += d.toString("utf8")));
  try {
    return await new Promise<string[]>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`serena did not answer tools/list in time; stderr: ${stderr.slice(-2000)}`)), timeoutMs);
      let buf = "";
      child.stdout.on("data", (d: Buffer) => {
        buf += d.toString("utf8");
        let nl: number;
        while ((nl = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, nl).trim();
          buf = buf.slice(nl + 1);
          if (!line.startsWith("{")) continue;
          const msg = JSON.parse(line) as { id?: number; result?: { tools?: { name: string }[] } };
          if (msg.id === 1) {
            send({ method: "notifications/initialized" });
            send({ id: 2, method: "tools/list", params: {} });
          } else if (msg.id === 2) {
            clearTimeout(timer);
            resolve((msg.result?.tools ?? []).map((t) => t.name).sort());
          }
        }
      });
      child.on("error", reject);
      child.on("exit", (code) => {
        clearTimeout(timer);
        reject(new Error(`the server exited (${code}) before tools/list; stderr: ${stderr.slice(-2000)}`));
      });
      send({ id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "sdd-test", version: "0" } } });
    });
  } finally {
    child.removeAllListeners("exit");
    child.kill();
    if (win && child.pid) spawnSync("taskkill", ["/pid", String(child.pid), "/t", "/f"], { stdio: "ignore" });
  }
}

test(
  "C002-TC-125 (C002-TS-125): Serena started from the OpenCode declaration through the installed architect-sdd lists no editing tool, writes its config per user and leaves no .serena/ in the repository",
  { skip: !serenaInstalled() && "Serena is not installed (E-SER)", timeout: 240000 },
  async (t) => {
    const base = realpathSync.native(mkdtempSync(join(tmpdir(), "sdd-serena-launch-"))).split("\\").join("/");
    try {
      const err: string[] = [];
      const code = main(["--target", "opencode", "--out", join(base, "dist"), "--quiet"], { cwd: repoRoot(), stdout: () => {}, stderr: (l) => err.push(l) });
      assert.equal(code, 0, err.join("\n"));
      const config = JSON.parse(readFileSync(join(base, "dist", "opencode", "opencode.json"), "utf8")) as { mcp: Record<string, { type: string; command: string[] }> };
      const serena = config.mcp["serena"]!;
      assert.equal(serena.type, "local");
      assert.equal(serena.command[0], "sdd");

      const fx = fxTgz();
      const repo = fxOc(base);
      const { env: dataEnv, data } = userData(`${base}/fx-home`);
      const env: NodeJS.ProcessEnv = { ...process.env, ...dataEnv, PATH: `${fx.binDir}${process.platform === "win32" ? ";" : ":"}${process.env.PATH ?? ""}` };
      // Serena is an external tool (it may install a language server): the no-network preload of the
      // test run covers the sdd CLI only; the plugin variables of a Claude Code session do not apply.
      for (const k of ["NODE_OPTIONS", "SDD_NO_NETWORK_LOG", "SDD_DEBUG", "SDD_TEST_FAULT", "CLAUDE_PLUGIN_ROOT", "CLAUDE_PLUGIN_DATA", "SERENA_HOME"]) delete env[k];

      const tools = await toolsList(serena.command, repo, env, fx.binDir);
      t.diagnostic(`serena tools: ${tools.join(", ")}`);
      assert.ok(tools.length > 0, "the server lists tools");
      assert.deepEqual(tools.filter((n) => EDITING.includes(n)), [], `no tool of the editing set: ${tools.join(", ")}`);
      assert.ok(existsSync(join(data, "serena", "serena_config.yml")), `${data}/serena/serena_config.yml exists`);
      assert.ok(!existsSync(join(repo, ".serena")), "fx-oc has no .serena/ folder");
    } finally {
      try {
        rmSync(base, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
      } catch {
        // A language server Serena started may still hold the temporary folder; it is left for the OS.
      }
    }
  },
);
