// `npm run smoke:npm` — install smoke test of the packed `architect-sdd` tarball (C002-T-023; C002-IF-003
// §4, C002-NFR-401, C002-NFR-402, C002-TS-501, C002-DOD-016, C002-DOD-017).
//   node scripts/smoke-npm.mjs [--tgz <path>] [--shell bash|pwsh|both] [--node <node executable>] [--keep] [--no-record]
// 1. Installs the tarball (default dist/architect-sdd-<plugin version>.tgz, written by `npm run package`)
//    globally into a fresh prefix in a temporary folder outside the repository, with the npm cache and
//    user config isolated there and npm offline (the package has no dependencies, so nothing is fetched).
// 2. Checks that the install folder holds no package other than architect-sdd (C002-NFR-402).
// 3. Per shell (Git Bash, PowerShell 7; default both), with the prefix and the selected Node.js first on
//    PATH and CLAUDE_PLUGIN_ROOT / CLAUDE_PLUGIN_DATA unset, the shell resolves the bare commands as an
//    adopter's would: `sdd` resolves to the prefix; `sdd --version` prints the plugin version, equal to
//    the output of `node plugins/architect/scripts/sdd.mjs --version` (C002-TS-501); `sdd init`,
//    `sdd change new` and `sdd status` run in a fixture workspace; `sdd-mcp --profile files` answers one
//    MCP `initialize` exchange and `tools/list`, then exits 0 when its standard input closes.
// 4. Removes the temporary folder (unless --keep) and records the result in
//    bench/results/smoke-npm-<timestamp>.json (unless --no-record). Exit 0 when every probe passed.
// The Node.js version is the one running this script, or --node (its own npm installs the tarball).
import { execFileSync, spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { npmCli } from "./package.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const win = process.platform === "win32";

const argv = process.argv.slice(2);
const opt = (name) => {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
};
const { version } = JSON.parse(readFileSync(join(root, "plugins", "architect", ".claude-plugin", "plugin.json"), "utf8"));
const tgz = resolve(opt("--tgz") ?? join(root, "dist", `architect-sdd-${version}.tgz`));
const node = resolve(opt("--node") ?? process.execPath);
const shellArg = opt("--shell") ?? "both";
if (!["bash", "pwsh", "both"].includes(shellArg)) {
  console.error(`smoke:npm: --shell must be bash, pwsh or both (got ${shellArg})`);
  process.exit(2);
}
if (!existsSync(tgz)) {
  console.error(`smoke:npm: ${tgz} not found; run \`npm run package\` first`);
  process.exit(2);
}

/** Git Bash (never WSL's System32\bash.exe) and PowerShell 7 executables. */
function shellExe(shell) {
  const env = shell === "bash" ? process.env.SMOKE_BASH : process.env.SMOKE_PWSH;
  if (env) return env;
  if (!win) return shell;
  const candidates =
    shell === "bash"
      ? [join(process.env.ProgramFiles ?? "C:\\Program Files", "Git", "bin", "bash.exe"), join(process.env.LOCALAPPDATA ?? "", "Programs", "Git", "bin", "bash.exe")]
      : [join(process.env.ProgramFiles ?? "C:\\Program Files", "PowerShell", "7", "pwsh.exe")];
  return candidates.find((c) => existsSync(c)) ?? (shell === "bash" ? "bash.exe" : "pwsh.exe");
}
/** Arguments that make `shell` run one command line. */
const shellArgs = (shell, line) => (shell === "bash" ? ["--noprofile", "--norc", "-c", line] : ["-NoLogo", "-NoProfile", "-NonInteractive", "-Command", line]);

const started = Date.now();
const tmp = realpathSync.native(mkdtempSync(join(tmpdir(), "sdd-smoke-npm-")));
const rel = relative(root, tmp);
if (!rel.startsWith("..") && !isAbsolute(rel)) throw new Error(`temporary folder ${tmp} is inside the repository`);
const prefix = join(tmp, "prefix");
const binDir = win ? prefix : join(prefix, "bin");
const modulesDir = win ? join(prefix, "node_modules") : join(prefix, "lib", "node_modules");

/** Environment of every child: no npm_* of an enclosing `npm run`, no plugin variables, no NODE_PATH. */
function cleanEnv(extraPath = []) {
  const env = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (/^npm_/i.test(k) || ["CLAUDE_PLUGIN_ROOT", "CLAUDE_PLUGIN_DATA", "NODE_PATH", "NODE_OPTIONS", "SDD_DEBUG", "SDD_TEST_FAULT"].includes(k.toUpperCase())) continue;
    env[k] = v;
  }
  const pathKey = Object.keys(env).find((k) => k.toUpperCase() === "PATH") ?? "PATH";
  env[pathKey] = [...extraPath, env[pathKey] ?? ""].join(delimiter);
  return env;
}

const result = { kind: "smoke-npm", task: "C002-T-023", started_at: new Date(started).toISOString(), tarball: relative(root, tgz).split("\\").join("/"), version, platform: process.platform, node: null, npm: null, install: null, shells: [], pass: false, seconds: null };
const record = (probes, name, ok, ms, detail) => {
  probes.push({ name, ok, ms: Math.round(ms), detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name} (${Math.round(ms)} ms)${ok ? "" : ` — ${detail}`}`);
  return ok;
};

/** Runs one command line in `shell`; returns { code, stdout, stderr, ms }. */
function inShell(shell, line, cwd) {
  const t = Date.now();
  const r = spawnSync(shellExe(shell), shellArgs(shell, line), { cwd, env: cleanEnv([binDir, dirname(node)]), encoding: "utf8", input: "", timeout: 60000 });
  return { code: r.status ?? -1, stdout: String(r.stdout ?? ""), stderr: String(r.stderr ?? "") + (r.error ? String(r.error) : ""), ms: Date.now() - t };
}

/** One MCP exchange through `shell`: initialize, notifications/initialized, tools/list, then stdin closed. */
function mcpExchange(shell, cwd) {
  return new Promise((done) => {
    const t = Date.now();
    const child = spawn(shellExe(shell), shellArgs(shell, "sdd-mcp --profile files"), { cwd, env: cleanEnv([binDir, dirname(node)]), stdio: ["pipe", "pipe", "pipe"] });
    let out = "";
    let err = "";
    const replies = new Map();
    let settled = false;
    const finish = (ok, detail) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (!ok) child.kill();
      done({ ok, detail, ms: Date.now() - t });
    };
    const timer = setTimeout(() => finish(false, `no complete exchange within 30 s; stdout=${out.slice(0, 400)} stderr=${err.slice(0, 400)}`), 30000);
    const send = (m) => child.stdin.write(JSON.stringify({ jsonrpc: "2.0", ...m }) + "\n");
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (s) => (err += s));
    child.on("error", (e) => finish(false, String(e)));
    child.stdout.on("data", (s) => {
      out += s;
      for (const line of s.split("\n")) {
        if (!line.trim()) continue;
        let m;
        try {
          m = JSON.parse(line);
        } catch {
          continue;
        }
        replies.set(m.id, m);
        if (m.id === 1) {
          const r = m.result;
          if (!r || r.serverInfo?.name !== "sdd-mcp" || r.serverInfo?.version !== version || typeof r.protocolVersion !== "string") return finish(false, `initialize: ${line}`);
          send({ method: "notifications/initialized" });
          send({ id: 2, method: "tools/list", params: {} });
        } else if (m.id === 2) {
          const tools = m.result?.tools;
          if (!Array.isArray(tools) || tools.length === 0) return finish(false, `tools/list: ${line}`);
          child.stdin.end();
        }
      }
    });
    child.on("exit", (code) => {
      const init = replies.get(1)?.result;
      const tools = replies.get(2)?.result?.tools;
      if (init && tools && code === 0) finish(true, `server ${init.serverInfo.name} ${init.serverInfo.version}, protocol ${init.protocolVersion}, ${tools.length} tools (files profile), exit 0 on end of input`);
      else finish(false, `exit ${code}; stdout=${out.slice(0, 400)} stderr=${err.slice(0, 400)}`);
    });
    send({ id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "sdd-smoke-npm", version: "1.0.0" } } });
  });
}

let pass = true;
try {
  result.node = execFileSync(node, ["--version"], { encoding: "utf8" }).trim();
  const cli = npmCli(node === process.execPath ? process.env : {}, node);
  result.npm = execFileSync(node, [cli, "--version"], { encoding: "utf8", env: cleanEnv() }).trim();
  console.log(`smoke:npm: ${result.tarball} with Node.js ${result.node} (npm ${result.npm}); temporary folder ${tmp}`);

  // 1. Install into the clean prefix, offline.
  const install = [];
  mkdirSync(prefix);
  writeFileSync(join(tmp, "npmrc"), "");
  let t = Date.now();
  const r = spawnSync(
    node,
    [cli, "install", "--global", tgz, "--prefix", prefix, "--cache", join(tmp, "npm-cache"), "--userconfig", join(tmp, "npmrc"), "--offline", "--no-audit", "--no-fund", "--no-update-notifier", "--loglevel", "error"],
    { cwd: tmp, env: cleanEnv([dirname(node)]), encoding: "utf8" },
  );
  pass = record(install, "npm install --global <tarball> --prefix <clean prefix> --offline", r.status === 0, Date.now() - t, `exit ${r.status}: ${r.stderr}`) && pass;
  // 2. The install folder holds architect-sdd only, and it carries no node_modules of its own.
  t = Date.now();
  const others = existsSync(modulesDir) ? readdirSync(modulesDir).filter((n) => !n.startsWith(".") && n !== "architect-sdd") : ["(no node_modules folder)"];
  const nested = existsSync(join(modulesDir, "architect-sdd", "node_modules"));
  const bins = ["sdd", "sdd-mcp"].filter((b) => !existsSync(join(binDir, win ? `${b}.cmd` : b)));
  pass = record(install, "install folder holds architect-sdd only, with both executables", existsSync(join(modulesDir, "architect-sdd", "package.json")) && others.length === 0 && !nested && bins.length === 0, Date.now() - t, `other packages: ${others.join(", ") || "none"}; nested node_modules: ${nested}; missing shims: ${bins.join(", ") || "none"}`) && pass;
  result.install = install;

  const bundled = spawnSync(node, [join(root, "plugins", "architect", "scripts", "sdd.mjs"), "--version"], { cwd: tmp, env: cleanEnv(), encoding: "utf8" });

  // 3. The probes, per shell.
  for (const shell of shellArg === "both" ? ["bash", "pwsh"] : [shellArg]) {
    const probes = [];
    const exe = shellExe(shell);
    console.log(`\n--- ${shell} (${exe}) ---`);
    const ws = join(tmp, `ws-${shell}`);
    mkdirSync(ws);
    const which = inShell(shell, shell === "bash" ? (win ? `for c in sdd sdd-mcp; do cygpath -w "$(command -v $c)"; done; node --version` : "command -v sdd sdd-mcp && node --version") : "(Get-Command sdd).Source; (Get-Command sdd-mcp).Source; node --version", ws);
    const lines = which.stdout.trim().split(/\r?\n/);
    // Git Bash prints the paths through cygpath: its /tmp is the Windows temporary folder.
    const inPrefix = (p) => Boolean(p) && (win ? p.toLowerCase().startsWith(binDir.toLowerCase()) : p.startsWith(binDir));
    pass = record(probes, `${shell}: sdd and sdd-mcp resolve to the prefix; node is ${result.node}`, which.code === 0 && inPrefix(lines[0]) && inPrefix(lines[1]) && lines[2] === result.node, which.ms, `exit ${which.code}: ${which.stdout} ${which.stderr}`) && pass;

    const v = inShell(shell, "sdd --version", ws);
    pass = record(probes, `${shell}: sdd --version prints ${version}, the bundled CLI's output (C002-TS-501)`, v.code === 0 && v.stdout.replace(/\r\n/g, "\n") === `${version}\n` && v.stdout.replace(/\r\n/g, "\n") === bundled.stdout && bundled.status === 0, v.ms, `exit ${v.code}: ${JSON.stringify(v.stdout)} vs bundled ${JSON.stringify(bundled.stdout)} ${v.stderr}`) && pass;

    const init = inShell(shell, "sdd init", ws);
    pass = record(probes, `${shell}: sdd init creates the fixture workspace`, init.code === 0 && existsSync(join(ws, ".sdd", "registry.json")), init.ms, `exit ${init.code}: ${init.stdout} ${init.stderr}`) && pass;
    const change = inShell(shell, 'sdd change new "Smoke" --profile lite --kind greenfield', ws);
    pass = record(probes, `${shell}: sdd change new creates change 001 from the shipped templates`, change.code === 0 && existsSync(join(ws, ".sdd", "001-smoke", "20-plan", "handoff.md")), change.ms, `exit ${change.code}: ${change.stdout} ${change.stderr}`) && pass;
    const status = inShell(shell, "sdd status", ws);
    pass = record(probes, `${shell}: sdd status lists the change`, status.code === 0 && /^\| 001 \| Smoke \| 00-ideation \|/m.test(status.stdout), status.ms, `exit ${status.code}: ${status.stdout} ${status.stderr}`) && pass;

    const mcp = await mcpExchange(shell, ws);
    pass = record(probes, `${shell}: sdd-mcp --profile files answers initialize and tools/list, exits 0`, mcp.ok, mcp.ms, mcp.detail) && pass;
    result.shells.push({ shell, executable: exe, probes });
  }
} catch (e) {
  pass = false;
  console.error(`smoke:npm: internal error: ${e instanceof Error ? (e.stack ?? e.message) : String(e)}`);
  result.error = e instanceof Error ? e.message : String(e);
} finally {
  if (argv.includes("--keep")) console.log(`kept ${tmp}`);
  else rmSync(tmp, { recursive: true, force: true });
}

result.pass = pass;
result.seconds = Number(((Date.now() - started) / 1000).toFixed(1));
const probes = [...(result.install ?? []), ...result.shells.flatMap((s) => s.probes)];
console.log(`\nsmoke:npm: ${pass ? "PASS" : "FAIL"} — ${probes.filter((p) => p.ok).length}/${probes.length} probes, Node.js ${result.node}, shells ${result.shells.map((s) => s.shell).join(", ") || "none"}, ${result.seconds} s`);
if (!argv.includes("--no-record")) {
  const dir = join(root, "bench", "results");
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `smoke-npm-${result.started_at.replace(/[:.]/g, "-")}.json`);
  writeFileSync(file, JSON.stringify(result, null, 2) + "\n");
  console.log(`recorded ${relative(root, file).split("\\").join("/")}`);
}
process.exitCode = pass ? 0 : 1;
