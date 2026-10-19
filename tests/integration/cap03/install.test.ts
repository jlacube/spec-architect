// C002-T-058 — `sdd install copilot [--package <dir>]` (C002-IF-007 §Install; C002-IF-005 §3). Every case
// installs into a fresh temporary git repository (fx-cp-install, or fx-cp with `.sdd/`) from a copy of the
// generated Copilot package (pkg-cp: `sdd-mcp-server`, pkg-cp-hooks: `copilot-hooks`) in a temporary
// folder that stands for `C:/fx/pkg-cp`.
//   C002-TC-341 … C002-TC-350 (C002-AC-322.1, C002-AC-323.1, C002-AC-324.1), C002-TC-354, C002-TC-356
//   (C002-AC-326.1), C002-TC-360, C002-TC-361 (C002-AC-327.1); also the installed hook files of C002-TC-311
//   (carried from C002-T-033) and the failed-write rule of §Install step 5 (ERR-CLI-017, second run).
import { after, test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { canonicalJson, unusablePathReason } from "../../../src/cli/install-copilot.ts";
import { cleanupFxTgz, fxTgz } from "../../fixtures/fx-tgz.ts";
import { cleanupPackages, copilotPackage, openCodePackage, preToolUse, splitHookCommand, tempFolder, type CopilotMode } from "../../fixtures/pkg-cp.ts";
import { CLI, makeWorkspace, minimalChange, REBUILD, type Result } from "../cli/helpers.ts";

const AGENTS = ["sdd-conductor", "sdd-researcher", "sdd-cartographer", "sdd-options-analyst", "sdd-spec-writer", "sdd-test-designer", "sdd-architect", "sdd-planner", "sdd-critic", "sdd-auditor"];
const SERVERS = ["context7", "deepwiki", "sdd-files", "sdd-shell", "serena"];
const NEXT = "next: select sdd-conductor in a Local chat (INSTALL.md step 4)";
const GUARD = ".github/hooks/architect-guard.json";
const RECORD = ".github/architect-install.json";
const MCP = ".vscode/mcp.json";

const cleanups: (() => void)[] = [];
after(() => {
  for (const c of cleanups) c();
  cleanupPackages();
  cleanupFxTgz();
});

/** fx-cp-install: a git repository with `src/app.ts` and `README.md`, without `.github/`, `.vscode/` and `.sdd/`. */
function fxInstall(extra: Record<string, string> = {}): string {
  const w = makeWorkspace({ ".git/HEAD": "ref: refs/heads/main\n", "src/app.ts": "export {};\n", "README.md": "# fx-cp-install\n", ...extra });
  cleanups.push(w.cleanup);
  return w.root;
}

/** fx-cp: a git repository with `.sdd/` (one active change) and `src/app.ts`. */
function fxCp(): string {
  const w = makeWorkspace({ ...minimalChange(), ".sdd/registry.json": REBUILD, ".git/HEAD": "ref: refs/heads/main\n", "src/app.ts": "export {};\n" });
  cleanups.push(w.cleanup);
  return w.root;
}

function node(script: string, args: string[], cwd: string, stdin = "", env: Record<string, string> = {}): Result {
  const r = spawnSync(process.execPath, [script, ...args], { cwd, env: { ...process.env, SDD_DEBUG: "", SDD_TEST_FAULT: "", ...env }, encoding: "utf8", input: stdin });
  return { code: r.status ?? -1, stdout: r.stdout, stderr: r.stderr };
}

/** `sdd install copilot --package <pkg>` in `repo` (the plugin's bundled CLI, the same program as the copy). */
const install = (repo: string, pkg: string, env: Record<string, string> = {}) => node(CLI, ["install", "copilot", "--package", pkg], repo, "", env);

/** Every file under `dir` (relative, `/`-separated) with its SHA-256. */
function tree(dir: string): Record<string, string> {
  const out: Record<string, string> = {};
  const walk = (abs: string, rel: string) => {
    if (!existsSync(abs)) return;
    for (const name of readdirSync(abs).sort()) {
      const p = join(abs, name);
      const r = rel === "" ? name : `${rel}/${name}`;
      if (statSync(p).isDirectory()) walk(p, r);
      else out[r] = createHash("sha256").update(readFileSync(p)).digest("hex");
    }
  };
  walk(dir, "");
  return out;
}

const sha = (b: string | Buffer) => `sha256:${createHash("sha256").update(b).digest("hex")}`;
const read = (p: string) => readFileSync(p);
const json = (p: string) => JSON.parse(readFileSync(p, "utf8")) as Record<string, unknown>;
const lines = (s: string) => s.split("\n").filter((l) => l !== "");
const errLines = (r: Result, code: string) => lines(r.stderr).filter((l) => l.startsWith(`${code}: `));
const pkgServers = (pkg: string) => (json(join(pkg, "install", "mcp.json")) as { servers: Record<string, unknown> }).servers;

function assertWritesNothing(repo: string, pkg: string | null): void {
  assert.equal(existsSync(join(repo, ".github")), false, ".github/ absent");
  assert.equal(existsSync(join(repo, ".vscode")), false, ".vscode/ absent");
  if (pkg !== null) for (const f of ["hooks.json", "plugin.json"]) assert.equal(existsSync(join(pkg, f)), false, `${pkg}/${f} absent`);
}

test("C002-TS-341 (C002-TC-341): first install writes the ten agents, the workspace hook file, plugin.json, .vscode/mcp.json and the record; nothing else", () => {
  const repo = fxInstall();
  const pkg = copilotPackage("sdd-mcp-server");
  const before = tree(repo);
  const r = install(repo, pkg);
  assert.equal(r.code, 0, r.stderr);
  assert.equal(r.stderr, "");
  assert.deepEqual(readdirSync(join(repo, ".github", "agents")).sort(), AGENTS.map((a) => `${a}.agent.md`).sort());
  for (const a of AGENTS) assert.ok(read(join(repo, ".github", "agents", `${a}.agent.md`)).equals(read(join(pkg, "agents", `${a}.agent.md`))), a);
  assert.deepEqual(readdirSync(join(repo, ".github", "hooks")), ["architect-guard.json"]);
  assert.ok(read(join(pkg, "plugin.json")).equals(read(join(pkg, "install", "plugin.json"))), "plugin.json is a byte copy");
  const rec = json(join(repo, RECORD)) as { package_version: string; agents: Record<string, string>; hook_files: Record<string, string>; mcp_servers: Record<string, string> };
  assert.equal(rec.package_version, (json(join(pkg, "architect-target.json")) as { package_version: string }).package_version);
  assert.deepEqual(Object.keys(rec.agents).sort(), AGENTS.map((a) => `.github/agents/${a}.agent.md`).sort());
  for (const [p, h] of Object.entries(rec.agents)) assert.equal(h, sha(read(join(repo, p))), p);
  assert.deepEqual(rec.hook_files, { [GUARD]: sha(read(join(repo, GUARD))) });
  const servers = pkgServers(pkg);
  assert.deepEqual(Object.keys(rec.mcp_servers).sort(), SERVERS);
  for (const n of SERVERS) assert.equal(rec.mcp_servers[n], sha(canonicalJson(servers[n])), n);
  const out = lines(r.stdout);
  assert.ok(out.includes(`written ${GUARD}`), r.stdout);
  for (const a of AGENTS) assert.ok(out.includes(`written .github/agents/${a}.agent.md`), a);
  assert.equal(out.at(-1), NEXT);
  // The guard hook before the agents (C002-CON-08), in the order of §Install step 5.
  assert.deepEqual(out.slice(0, 3), [`written ${pkg}/hooks.json`, `written ${GUARD}`, `written ${pkg}/plugin.json`]);
  assert.ok(out.indexOf(`written ${MCP}`) > out.indexOf("written .github/agents/sdd-auditor.agent.md"));
  assert.equal(out.at(-2), `written ${RECORD}`);
  // No file outside .github/ and .vscode/ added or changed; no .sdd/.
  const after = Object.fromEntries(Object.entries(tree(repo)).filter(([p]) => !p.startsWith(".github/") && !p.startsWith(".vscode/")));
  assert.deepEqual(after, before);
  assert.equal(existsSync(join(repo, ".sdd")), false);
});

test("C002-TS-342 (C002-TC-342): without --package, the package that holds the running CLI copy is installed", () => {
  const repo = fxInstall();
  const pkg = copilotPackage("sdd-mcp-server");
  const r = node(join(pkg, "scripts", "sdd.mjs"), ["install", "copilot"], repo);
  assert.equal(r.code, 0, r.stderr);
  for (const a of AGENTS) assert.ok(read(join(repo, ".github", "agents", `${a}.agent.md`)).equals(read(join(pkg, "agents", `${a}.agent.md`))), a);
  assert.ok(lines(r.stdout).includes(`written ${pkg}/hooks.json`), r.stdout);
});

test("C002-TS-343 (C002-TC-343): a second run with the same package changes nothing and reports unchanged", () => {
  const repo = fxInstall();
  const pkg = copilotPackage("sdd-mcp-server");
  assert.equal(install(repo, pkg).code, 0);
  const before = tree(repo);
  const r = install(repo, pkg);
  assert.equal(r.code, 0, r.stderr);
  assert.deepEqual(tree(repo), before);
  const out = lines(r.stdout);
  assert.ok(out.includes(`unchanged ${GUARD}`), r.stdout);
  for (const a of AGENTS) assert.ok(out.includes(`unchanged .github/agents/${a}.agent.md`), a);
  assert.ok(out.includes(`unchanged ${MCP}`) && out.includes(`unchanged ${RECORD}`), r.stdout);
  assert.equal(out.at(-1), NEXT);
});

test("C002-TS-344 (C002-TC-344): an install after a package update replaces the changed agent and records the new version", () => {
  const repo = fxInstall();
  const pkg = copilotPackage("sdd-mcp-server");
  const manifest = join(pkg, "architect-target.json");
  const setVersion = (v: string) => writeFileSync(manifest, JSON.stringify({ ...json(manifest), package_version: v }, null, 2) + "\n");
  setVersion("0.3.0");
  assert.equal(install(repo, pkg).code, 0);
  setVersion("0.3.1");
  const critic = join(pkg, "agents", "sdd-critic.agent.md");
  writeFileSync(critic, readFileSync(critic, "utf8") + "\nUpdated in 0.3.1.\n");
  const r = install(repo, pkg);
  assert.equal(r.code, 0, r.stderr);
  assert.ok(read(join(repo, ".github", "agents", "sdd-critic.agent.md")).equals(read(critic)));
  assert.ok(lines(r.stdout).includes("written .github/agents/sdd-critic.agent.md"), r.stdout);
  assert.ok(lines(r.stdout).includes("unchanged .github/agents/sdd-planner.agent.md"), r.stdout);
  const rec = json(join(repo, RECORD)) as { package_version: string; agents: Record<string, string> };
  assert.equal(rec.package_version, "0.3.1");
  assert.equal(rec.agents[".github/agents/sdd-critic.agent.md"], sha(read(critic)));
});

test("C002-TS-345 (C002-TC-345): a package the install command cannot use is refused with ERR-CLI-022 (ERR-CLI-003 for another target); nothing is written", () => {
  const variant = (change: (pkg: string) => void) => {
    const pkg = copilotPackage("sdd-mcp-server");
    change(pkg);
    return pkg;
  };
  const PKG_PATH = "<the package path>";
  const empty = `${tempFolder()}/empty`;
  mkdirSync(empty);
  const rows: [string, () => { pkg: string; run: (repo: string) => Result }, string, string[]][] = [
    ["empty folder", () => ({ pkg: empty, run: (repo) => install(repo, empty) }), "ERR-CLI-022", [empty, "architect-target.json"]],
    ["OpenCode package", () => { const p = openCodePackage(); return { pkg: p, run: (repo) => install(repo, p) }; }, "ERR-CLI-022", [PKG_PATH, '"opencode"']],
    ["manifest not JSON", () => { const p = variant((d) => writeFileSync(join(d, "architect-target.json"), "{ not json")); return { pkg: p, run: (repo) => install(repo, p) }; }, "ERR-CLI-022", [PKG_PATH, "architect-target.json"]],
    ["agent missing", () => { const p = variant((d) => rmSync(join(d, "agents", "sdd-critic.agent.md"))); return { pkg: p, run: (repo) => install(repo, p) }; }, "ERR-CLI-022", ["agents/sdd-critic.agent.md"]],
    ["install/mcp.json missing", () => { const p = variant((d) => rmSync(join(d, "install", "mcp.json"))); return { pkg: p, run: (repo) => install(repo, p) }; }, "ERR-CLI-022", ["install/mcp.json"]],
    ["install/plugin.json missing", () => { const p = variant((d) => rmSync(join(d, "install", "plugin.json"))); return { pkg: p, run: (repo) => install(repo, p) }; }, "ERR-CLI-022", ["install/plugin.json"]],
    ["install/hooks.template.json missing", () => { const p = variant((d) => rmSync(join(d, "install", "hooks.template.json"))); return { pkg: p, run: (repo) => install(repo, p) }; }, "ERR-CLI-022", ["install/hooks.template.json"]],
    ["hooks/tool-classes.json missing", () => { const p = variant((d) => rmSync(join(d, "hooks", "tool-classes.json"))); return { pkg: p, run: (repo) => install(repo, p) }; }, "ERR-CLI-022", ["hooks/tool-classes.json"]],
    ["install opencode", () => { const p = copilotPackage("sdd-mcp-server"); return { pkg: p, run: (repo) => node(CLI, ["install", "opencode", "--package", p], repo) }; }, "ERR-CLI-003", ["install opencode"]],
  ];
  for (const [label, make, code, named] of rows) {
    const repo = fxInstall();
    const made = make();
    const r = made.run(repo);
    assert.equal(r.code, 2, `${label}: ${r.stdout}${r.stderr}`);
    assert.ok(r.stderr.startsWith(`${code}: `), `${label}: ${r.stderr}`);
    for (const n of named.map((x) => (x === PKG_PATH ? made.pkg : x))) assert.ok(r.stderr.includes(n), `${label}: ${n} in ${r.stderr}`);
    assert.equal(lines(r.stderr).length, 1, label);
    assertWritesNothing(repo, made.pkg);
  }
});

test("C002-TS-345 (C002-TC-345): the globally installed architect-sdd is not the CLI copy of a Copilot package (fx-tgz)", () => {
  const repo = fxInstall();
  const r = fxTgz().runEntry("sdd", ["install", "copilot"], { cwd: repo });
  assert.equal(r.code, 2, r.stdout + r.stderr);
  assert.ok(r.stderr.startsWith("ERR-CLI-022: "), r.stderr);
  assert.ok(r.stderr.includes("--package"), r.stderr);
  assertWritesNothing(repo, null);
  // The same refusal from this repository's plugin CLI, whose folder is no Copilot package.
  const plugin = node(CLI, ["install", "copilot"], repo);
  assert.equal(plugin.code, 2);
  assert.match(plugin.stderr, /^ERR-CLI-022: `cannot install from .*scripts\/sdd\.mjs: no --package given, and the running CLI is not the scripts\/sdd\.mjs of a Copilot package`/);
  assertWritesNothing(repo, null);
});

test("C002-TS-346 (C002-TC-346): the package's servers are merged into an adopter's .vscode/mcp.json, every other key and entry kept in place", () => {
  const repo = fxInstall({ [MCP]: '{ "inputs": [], "servers": { "my-db": { "type": "stdio", "command": "my-db-mcp" } } }' });
  const pkg = copilotPackage("sdd-mcp-server");
  const r = install(repo, pkg);
  assert.equal(r.code, 0, r.stderr);
  const text = readFileSync(join(repo, MCP), "utf8");
  const doc = JSON.parse(text) as { inputs: unknown; servers: Record<string, unknown> };
  assert.deepEqual(Object.keys(doc), ["inputs", "servers"]);
  assert.deepEqual(doc.inputs, []);
  assert.deepEqual(Object.keys(doc.servers), ["my-db", ...SERVERS]);
  assert.deepEqual(doc.servers["my-db"], { type: "stdio", command: "my-db-mcp" });
  for (const n of SERVERS) assert.deepEqual(doc.servers[n], pkgServers(pkg)[n], n);
  assert.equal(text, JSON.stringify(doc, null, 2) + "\n", "two-space indentation, final newline");
  assert.ok(!text.includes("\r"), "LF line ends");
  assert.ok(lines(r.stdout).includes(`merged ${MCP} (${SERVERS.join(", ")})`), r.stdout);
});

test("C002-TS-347 (C002-TC-347): without .vscode/, .vscode/mcp.json holds only the package's servers", () => {
  const repo = fxInstall();
  const pkg = copilotPackage("sdd-mcp-server");
  assert.equal(install(repo, pkg).code, 0);
  const doc = json(join(repo, MCP));
  assert.deepEqual(Object.keys(doc), ["servers"]);
  assert.deepEqual(doc["servers"], pkgServers(pkg));
});

test("C002-TS-348 (C002-TC-348): adopter copies equal to the package's are no conflicts and are recorded", () => {
  const pkg = copilotPackage("sdd-mcp-server");
  // The workspace hook file this install writes for the package, from a first install elsewhere.
  const other = fxInstall();
  assert.equal(install(other, pkg).code, 0);
  const guard = readFileSync(join(other, GUARD), "utf8");
  const files = pkgServers(pkg)["sdd-files"] as Record<string, unknown>;
  // The same entry with its keys in another order is equal.
  const reordered = Object.fromEntries(Object.entries(files).reverse());
  const repo = fxInstall({
    [MCP]: JSON.stringify({ servers: { "sdd-files": reordered } }),
    ".github/agents/sdd-critic.agent.md": readFileSync(join(pkg, "agents", "sdd-critic.agent.md"), "utf8"),
    [GUARD]: guard,
  });
  const r = install(repo, pkg);
  assert.equal(r.code, 0, r.stderr);
  assert.deepEqual(errLines(r, "ERR-CLI-021"), []);
  const rec = json(join(repo, RECORD)) as { agents: Record<string, string>; hook_files: Record<string, string>; mcp_servers: Record<string, string> };
  assert.equal(rec.agents[".github/agents/sdd-critic.agent.md"], sha(read(join(repo, ".github", "agents", "sdd-critic.agent.md"))));
  assert.equal(rec.hook_files[GUARD], sha(read(join(repo, GUARD))));
  assert.equal(rec.mcp_servers["sdd-files"], sha(canonicalJson(files)));
  assert.ok(lines(r.stdout).includes("unchanged .github/agents/sdd-critic.agent.md") && lines(r.stdout).includes(`unchanged ${GUARD}`), r.stdout);
  // The equal entry keeps its key order; the others are appended.
  assert.deepEqual(Object.keys((json(join(repo, MCP)) as { servers: Record<string, unknown> }).servers["sdd-files"] as object), Object.keys(reordered));
});

test("C002-TS-349 (C002-TC-349): an adopter file or server in the way: exactly one ERR-CLI-021 line, exit 2, nothing written", () => {
  const rows: [string, Record<string, string>, string][] = [
    ["adopter agent", { ".github/agents/sdd-critic.agent.md": "# my critic\n" }, "install conflict: .github/agents/sdd-critic.agent.md was not written by sdd install copilot"],
    ["adopter hook file", { [GUARD]: '{ "hooks": {} }' }, "install conflict: .github/hooks/architect-guard.json was not written by sdd install copilot"],
    ["adopter server", { [MCP]: '{ "servers": { "sdd-files": { "type": "stdio", "command": "my-files-mcp" } } }' }, 'install conflict: .vscode/mcp.json server "sdd-files" was not written by sdd install copilot'],
    ["comment line", { [MCP]: '// my servers\n{ "servers": {} }\n' }, "install conflict: .vscode/mcp.json cannot be parsed as JSON without comments:"],
    ["trailing comma", { [MCP]: '{ "servers": { "my-db": { "type": "stdio", "command": "my-db-mcp" }, } }\n' }, "install conflict: .vscode/mcp.json cannot be parsed as JSON without comments:"],
    ["array", { [MCP]: "[]" }, "install conflict: .vscode/mcp.json"],
    ["servers a string", { [MCP]: '{ "servers": "none" }' }, "install conflict: .vscode/mcp.json"],
  ];
  for (const [label, files, message] of rows) {
    const repo = fxInstall(files);
    const pkg = copilotPackage("sdd-mcp-server");
    const before = tree(repo);
    const r = install(repo, pkg);
    assert.equal(r.code, 2, `${label}: ${r.stdout}${r.stderr}`);
    const errs = errLines(r, "ERR-CLI-021");
    assert.equal(errs.length, 1, `${label}: ${r.stderr}`);
    assert.ok(errs[0]!.includes(message), `${label}: ${errs[0]}`);
    assert.equal(r.stdout, "", label);
    assert.deepEqual(tree(repo), before, `${label}: no file added or changed`);
    for (const f of [join(repo, RECORD), join(pkg, "hooks.json"), join(pkg, "plugin.json")]) assert.equal(existsSync(f), false, `${label}: ${f}`);
  }
});

test("C002-TS-350 (C002-TC-350): files and entries edited after an install are the adopter's: two ERR-CLI-021 lines, nothing changed", () => {
  const repo = fxInstall();
  const pkg = copilotPackage("sdd-mcp-server");
  assert.equal(install(repo, pkg).code, 0);
  const planner = join(repo, ".github", "agents", "sdd-planner.agent.md");
  writeFileSync(planner, readFileSync(planner, "utf8") + "\nMy own note.\n");
  const mcp = json(join(repo, MCP)) as { servers: Record<string, { args: string[] }> };
  mcp.servers["sdd-shell"]!.args = ["--profile", "shell", "--verbose"];
  writeFileSync(join(repo, MCP), JSON.stringify(mcp, null, 2) + "\n");
  const before = tree(repo);
  const pkgBefore = tree(pkg);
  const r = install(repo, pkg);
  assert.equal(r.code, 2, r.stdout + r.stderr);
  const errs = errLines(r, "ERR-CLI-021");
  assert.equal(errs.length, 2, r.stderr);
  assert.ok(errs.some((e) => e.includes("install conflict: .github/agents/sdd-planner.agent.md was not written by sdd install copilot")), r.stderr);
  assert.ok(errs.some((e) => e.includes('install conflict: .vscode/mcp.json server "sdd-shell" was not written by sdd install copilot')), r.stderr);
  assert.deepEqual(tree(repo), before);
  assert.deepEqual(tree(pkg), pkgBefore, "the package's hooks.json and plugin.json as they were");
});

test("§Install step 5: a failed write ends with ERR-CLI-017 (exit 3) naming the files already written; a second run completes the install", () => {
  const repo = fxInstall();
  const pkg = copilotPackage("sdd-mcp-server");
  // The fourth atomic write is the first agent file: hooks.json, the workspace hook file and plugin.json are written.
  const r = install(repo, pkg, { SDD_TEST_FAULT: "atomic-write-fail-at=4" });
  assert.equal(r.code, 3, r.stdout + r.stderr);
  const err = errLines(r, "ERR-CLI-017");
  assert.equal(err.length, 1, r.stderr);
  assert.ok(err[0]!.includes(".github/agents/") && err[0]!.includes(`already written: ${pkg}/hooks.json, ${GUARD}, ${pkg}/plugin.json`), err[0]);
  assert.ok(existsSync(join(repo, GUARD)) && existsSync(join(pkg, "hooks.json")), "the guard hook was written before the agents");
  assert.equal(existsSync(join(repo, RECORD)), false, "no record");
  assert.equal(existsSync(join(repo, MCP)), false);
  assert.deepEqual(readdirSync(join(repo, ".github", "agents")).filter((n) => !n.includes(".tmp-")), [], "no agent file yet");
  const again = install(repo, pkg);
  assert.equal(again.code, 0, again.stderr);
  assert.ok(lines(again.stdout).includes(`unchanged ${GUARD}`), again.stdout);
  assert.equal(readdirSync(join(repo, ".github", "agents")).length, 10);
  assert.ok(existsSync(join(repo, RECORD)));
});

test("the repository is the root of C002-IF-008 §1.1 rule 3 from the working folder (also with --cwd)", () => {
  const repo = fxInstall();
  const pkg = copilotPackage("sdd-mcp-server");
  const r = node(CLI, ["install", "copilot", "--package", pkg], join(repo, "src"));
  assert.equal(r.code, 0, r.stderr);
  assert.ok(existsSync(join(repo, GUARD)) && !existsSync(join(repo, "src", ".github")));
  const other = fxInstall();
  const c = node(CLI, ["install", "copilot", "--package", pkg, "--cwd", join(other, "src")], repo);
  assert.equal(c.code, 0, c.stderr);
  assert.ok(existsSync(join(other, GUARD)));
});

const TEN = AGENTS.join(",");
for (const mode of ["sdd-mcp-server", "copilot-hooks"] as CopilotMode[]) {
  test(`C002-TS-354 (C002-TC-354) [${mode}], C002-TC-311 installed: hooks.json and the workspace hook file hold the commands with the absolute CLI copy, no plugin-root token`, () => {
    const repo = fxInstall();
    const pkg = copilotPackage(mode);
    assert.equal(install(repo, pkg).code, 0);
    const cli = `${pkg}/scripts/sdd.mjs`;
    const template = readFileSync(join(pkg, "install", "hooks.template.json"), "utf8");
    const hooksText = readFileSync(join(pkg, "hooks.json"), "utf8");
    assert.equal(hooksText, template.split("@CLI_COPY@").join(cli), "every hook entry of the template, @CLI_COPY@ replaced");
    const hooks = (JSON.parse(hooksText) as { hooks: Record<string, { command: string }[]> }).hooks;
    assert.deepEqual(hooks["SessionStart"], [{ command: `node "${cli}" hook session-start --host copilot`, type: "command" }]);
    const guardText = readFileSync(join(repo, GUARD), "utf8");
    const guard = JSON.parse(guardText) as { hooks: Record<string, unknown> };
    assert.deepEqual(Object.keys(guard), ["hooks"]);
    assert.deepEqual(Object.keys(guard.hooks), ["PreToolUse"]);
    assert.deepEqual(guard.hooks["PreToolUse"], hooks["PreToolUse"]);
    assert.deepEqual(preToolUse(join(repo, GUARD)), [{ command: `node "${cli}" hook guard --host copilot --mode ${mode} --agents ${TEN}`, type: "command" }]);
    assert.equal(guardText, JSON.stringify(guard, null, 2) + "\n");
    assert.ok(!guardText.includes("\r"));
    for (const text of [hooksText, guardText, template]) {
      const commands = JSON.stringify(text);
      for (const bad of ["${PLUGIN_ROOT}", "${CLAUDE_PLUGIN_ROOT}"]) assert.ok(!text.includes(bad), bad);
      for (const es of Object.values((JSON.parse(text) as { hooks: Record<string, { command: string }[]> }).hooks)) for (const e of es) assert.ok(!e.command.includes("\\"), `${commands}: backslash`);
    }
    for (const text of [hooksText, guardText]) assert.ok(!text.includes("@CLI_COPY@"));
    // The installed command runs the package's CLI copy with the package's classes file (C002-TC-311).
    const { script, args } = splitHookCommand(preToolUse(join(repo, GUARD))[0]!.command);
    assert.equal(script, cli);
    const cp = fxCp();
    const stdin = JSON.stringify({ hook_event_name: "PreToolUse", cwd: cp, agent_type: "general-purpose", tool_name: "Glob", tool_input: { pattern: "src/**" } });
    assert.deepEqual(node(script, args, cp, stdin), { code: 0, stdout: "", stderr: "" }, "Glob is read_only in the package's classes file");
  });
}

test("C002-TS-356 (C002-TC-356): a package path holding $, % or a backtick is refused with ERR-CLI-022 naming it; nothing is written", () => {
  for (const name of ["pkg$cp", "100%cp", "pkg`cp"]) {
    const repo = fxInstall();
    const pkg = copilotPackage("sdd-mcp-server", name);
    const r = install(repo, pkg);
    assert.equal(r.code, 2, `${name}: ${r.stdout}${r.stderr}`);
    assert.ok(r.stderr.startsWith("ERR-CLI-022: "), r.stderr);
    assert.ok(r.stderr.includes(pkg), `${name}: ${r.stderr}`);
    assertWritesNothing(repo, pkg);
  }
  // `"` and control characters cannot be folder names on Windows; the rule itself.
  assert.match(unusablePathReason('/fx/pkg"cp') ?? "", /character "/);
  assert.match(unusablePathReason("/fx/pkg\ncp") ?? "", /control character U\+000A/);
  assert.match(unusablePathReason("/fx/pkg\u007fcp") ?? "", /control character U\+007F/);
  assert.equal(unusablePathReason("C:/fx/pkg-cp (2)/é"), null);
});

const writeInput = (cwd: string, agent: string | null) =>
  JSON.stringify({ hook_event_name: "PreToolUse", session_id: "s-1", cwd, tool_name: "Write", tool_input: { path: "src/app.ts" }, ...(agent === null ? {} : { agent_type: agent, agent_id: "a-1" }) });

/** Exit 2 with the deny decision on standard output and `rule` on standard error. */
function assertDeny(r: Result, rule: string, label: string): void {
  assert.equal(r.code, 2, `${label}: ${r.stdout}${r.stderr}`);
  assert.ok(r.stderr.includes(rule), `${label}: ${r.stderr}`);
  const d = JSON.parse(r.stdout) as { permissionDecision: string; hookSpecificOutput: { permissionDecision: string } };
  assert.equal(d.permissionDecision, "deny", label);
  assert.equal(d.hookSpecificOutput.permissionDecision, "deny", label);
}

test("C002-TS-360 (C002-TC-360): with hooks.json and plugin.json deleted from the package, the workspace hook file alone denies", () => {
  const rows: [CopilotMode, string, string][] = [
    ["sdd-mcp-server", "general-purpose", "GUARD-HOOK-002"],
    ["copilot-hooks", "general-purpose", "GUARD-HOOK-002"],
    ["copilot-hooks", "sdd-spec-writer", "GUARD-PATH-001"],
  ];
  for (const [mode, agent, rule] of rows) {
    const cp = fxCp();
    const pkg = copilotPackage(mode);
    const r = install(cp, pkg);
    assert.equal(r.code, 0, r.stderr);
    assert.equal(existsSync(join(cp, ".sdd", "004-x", "change.md")), true, "the install leaves .sdd/ alone");
    rmSync(join(pkg, "hooks.json"));
    rmSync(join(pkg, "plugin.json"));
    const { script, args } = splitHookCommand(preToolUse(join(cp, GUARD))[0]!.command);
    assertDeny(node(script, args, cp, writeInput(cp, agent)), rule, `${mode} ${agent}`);
  }
});

test("C002-TS-361 (C002-TC-361): after the package folder is renamed, the workspace hook command fails and holds no allow decision", () => {
  const cp = fxCp();
  const parent = tempFolder("sdd-fx-pkg-");
  const pkg = copilotPackage("sdd-mcp-server", "pkg-cp", parent);
  assert.equal(install(cp, pkg).code, 0);
  renameSync(pkg, `${parent}/pkg-cp-moved`);
  const { script, args } = splitHookCommand(preToolUse(join(cp, GUARD))[0]!.command);
  const r = node(script, args, cp, writeInput(cp, null));
  assert.notEqual(r.code, 0, "the hosts treat a non-zero exit as a denied call");
  assert.ok(!/"permissionDecision"\s*:\s*"allow"/.test(r.stdout), r.stdout);
  assert.equal(r.stdout.trim(), "");
});
