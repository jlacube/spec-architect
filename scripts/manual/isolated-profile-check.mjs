// Automated functional part of C001-TC-1102 in an isolated Claude profile (C001-TS-1102; definition in
// C001-SPEC-NFR, "Isolated Claude profile"; defect D-030, P-01 Q-clean-profile-01, 2026-11-10).
//
//   node scripts/manual/isolated-profile-check.mjs <new empty folder> [--claude <claude.exe>] [--repo <path>] [--json]
//
// Runs the Claude Code binary (--claude, else CLAUDE_CODE_EXECPATH) with every CLAUDE* / ANTHROPIC*
// variable removed and CLAUDE_CONFIG_DIR, HOME, USERPROFILE and APPDATA pointing into the folder, then:
// marketplace add <repo>, install architect@architect-local, plugin list, plugin details, an unknown
// agent (refused with the list of agents, before any model call) and, only while the profile is signed
// out, `claude -p --agent architect:sdd-conductor` up to its init event (no init event is a FAIL) (the session ends at the API call
// with "Not logged in", so no model turn is billed). Prints each command and its output, then PASS or
// FAIL; exit 0 on PASS, 1 on FAIL. Session and hook ids are masked; no credential is read or printed.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args.splice(i, 2)[1] : undefined;
};
const json = args.includes("--json") && args.splice(args.indexOf("--json"), 1).length > 0;
const claude = opt("--claude") ?? process.env.CLAUDE_CODE_EXECPATH;
const repo = resolve(opt("--repo") ?? join(fileURLToPath(new URL(".", import.meta.url)), "..", ".."));
const root = args[0] && resolve(args[0]);
if (!root || !claude) {
  console.error("usage: node scripts/manual/isolated-profile-check.mjs <new empty folder> [--claude <claude.exe>] [--repo <path>] [--json]");
  console.error("(--claude defaults to CLAUDE_CODE_EXECPATH, the desktop-bundled Claude Code)");
  process.exit(2);
}
if (existsSync(root) && readdirSync(root).length > 0) {
  console.error(`${root} is not empty: give a new folder`);
  process.exit(2);
}
const toy = join(root, "toy");
mkdirSync(join(root, "AppData", "Roaming"), { recursive: true });
mkdirSync(toy, { recursive: true });

const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^(CLAUDE|ANTHROPIC)/i.test(k)));
Object.assign(env, {
  CLAUDE_CONFIG_DIR: join(root, ".claude"),
  HOME: root,
  USERPROFILE: root,
  APPDATA: join(root, "AppData", "Roaming"),
});
const mask = (s) => s.replace(/"(session_id|uuid|hook_id|id)":"[^"]*"/g, '"$1":"…"');
const steps = [];
const run = (label, argv, cwd = toy, timeout = 90_000) => {
  const t0 = Date.now();
  const r = spawnSync(claude, argv, { cwd, env, encoding: "utf8", timeout });
  const out = mask(`${r.stdout ?? ""}${r.stderr ?? ""}`).trim();
  const step = { label, command: `claude ${argv.join(" ")}`, exit: r.status, ms: Date.now() - t0, out };
  steps.push(step);
  const lines = out.split(/\r?\n/);
  const shown = lines.length > 12 ? [...lines.slice(0, 12), `… (${lines.length - 12} more lines)`].join("\n") : out;
  if (!json) console.log(`\n> ${step.command}   (exit ${step.exit}, ${step.ms} ms)\n${shown}`);
  return step;
};

spawnSync("git", ["init", "-q"], { cwd: toy });
// The repository state the check ran on (D-030 closes on a PASS at the commit of the approved revision).
const git = (a) => spawnSync("git", ["-C", repo, ...a], { encoding: "utf8" }).stdout?.trim() ?? "";
const commit = git(["rev-parse", "--short", "HEAD"]);
const dirtyPlugin = git(["status", "--porcelain", "--", "plugins/architect", ".claude-plugin"]) !== "";
if (!json) console.log(`repository ${repo} at ${commit}${dirtyPlugin ? " (plugin files modified in the working tree)" : " (plugin files clean)"}`);
const version = run("version", ["--version"]);
const auth = run("auth", ["auth", "status"]);
const signedOut = /"loggedIn":\s*false/.test(auth.out);
const add = run("marketplace add", ["plugin", "marketplace", "add", repo]);
const install = run("install", ["plugin", "install", "architect@architect-local"]);
const list = run("list", ["plugin", "list"]);
const details = run("details", ["plugin", "details", "architect@architect-local"]);
const unknown = run("unknown agent", ["-p", "--agent", "architect:no-such-agent", "hi"]);
let init = null;
if (signedOut) {
  const conductor = run("conductor", ["-p", "--agent", "architect:sdd-conductor", "--output-format", "stream-json", "--verbose", "--max-turns", "1", "hi"]);
  const events = conductor.out.split(/\r?\n/).flatMap((l) => { try { return [JSON.parse(l)]; } catch { return []; } });
  const ev = events.find((e) => e.type === "system" && e.subtype === "init");
  const result = events.find((e) => e.type === "result");
  init = ev && { tools: ev.tools, agents: ev.agents?.filter((a) => a.startsWith("architect:")), apiKeySource: ev.apiKeySource, version: ev.claude_code_version, plugins: ev.mcp_servers?.map((m) => m.name), result: result?.result, cost: result?.total_cost_usd };
  if (!json) console.log(`\nconductor init: ${JSON.stringify(init)}`);
}

const checks = {
  signedOutAtStart: signedOut,
  marketplaceAdded: add.exit === 0 && /architect-local/.test(add.out),
  installed: install.exit === 0,
  listedEnabled: /architect@architect-local/.test(list.out) && /enabled/.test(list.out),
  version: (list.out.match(/Version:\s*(\S+)/) ?? [])[1] ?? null,
  conductorInPlugin: /sdd-conductor/.test(details.out),
  unknownAgentRefusedWithConductorListed: unknown.exit !== 0 && /architect:sdd-conductor/.test(unknown.out),
  // Signed out, the conductor probe must reach its init event (a missing init event is a failure);
  // signed in, it is not run (it would bill a turn) and the check says so.
  conductorStarts: signedOut ? Boolean(init) && init.tools?.includes("Task") === true && !init.tools.includes("WebSearch") && (init.cost ?? 0) === 0 : null,
};
const pass = checks.marketplaceAdded && checks.installed && checks.listedEnabled && checks.conductorInPlugin && checks.unknownAgentRefusedWithConductorListed && checks.conductorStarts !== false;
if (json) console.log(JSON.stringify({ root, claude, repo, commit, dirtyPlugin, claudeVersion: version.out, checks, init, steps, pass }, null, 2));
else {
  console.log(`\nchecks: ${JSON.stringify(checks)}`);
  console.log(`Functional check: ${pass ? "PASS" : "FAIL"}${checks.conductorStarts === null ? " (conductor session not probed: profile signed in)" : ""}`);
}
process.exit(pass ? 0 : 1);
