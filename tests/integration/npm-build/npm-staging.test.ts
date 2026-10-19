// architect-sdd staging, template CLI lines and npm pack (C002-T-022; C002-IF-003, C002-ADR-004), on the
// fx-tgz fixture (staged from this repository's build outputs, packed by `npm pack`, installed into a clean
// prefix). Scenarios:
//   C002-TS-503 / TC-503 (C002-REQ-502)   tarball name, unscoped name, version, bin `sdd`
//   C002-TS-417 / TC-417 (C002-REQ-412)   separate entries sdd and sdd-mcp; plugin scripts/ holds sdd.mjs only
//   C002-TS-519 / TC-519 (C002-REQ-512)   every template and the Serena mode file, SHA-256 equal except translated
//   C002-TS-529 / TC-529 (C002-REQ-518)   hand-off lines read `sdd <arguments>`; source files unchanged
//   C002-TS-530 / C002-TS-535 (C002-REQ-519)  ERR-BLD-002 on a planted plugin path; none on the shipped templates
//   C002-TS-501 / TC-501, C002-TS-502 / TC-502, C002-TS-534 / TC-534 (C002-REQ-501)  installed `sdd`
//   C002-TS-517 (tarball row, open from C002-T-004) and C002-TS-419 (tarball part, open from C002-T-021)
// (The folder is not named build/: that name is git-ignored; `npm test -- build` still selects it.)
import { after, test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { cpSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { npmCli, npmReadme, REPOSITORY_URL, stageNpm } from "../../../scripts/package.mjs";
import { scanCliPaths, translateCliLines } from "../../../scripts/template-cli-lines.mjs";
import { fxBootstrap } from "../../fixtures/fixtures.ts";
import { cleanupFxTgz, fxTgz } from "../../fixtures/fx-tgz.ts";
import { repoRoot } from "../../helpers.ts";
import { runBundled } from "../cli/helpers.ts";

const root = repoRoot();
const PLUGIN = join(root, "plugins", "architect");
const version = (JSON.parse(readFileSync(join(PLUGIN, ".claude-plugin", "plugin.json"), "utf8")) as { version: string }).version;
const sha = (b: Buffer) => createHash("sha256").update(b).digest("hex");

/** Files under `dir`, relative with `/` separators. */
function filesUnder(dir: string, rel = ""): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? filesUnder(join(dir, e.name), `${rel}${e.name}/`) : [`${rel}${e.name}`]));
}

const HANDOFFS = ["full/20-plan/handoff.md", "lite/20-plan/handoff.md"];
// SHA-256 of the source templates before the fixture is built (C002-TS-529: the source stays unchanged).
const sourceShas = new Map(filesUnder(join(PLUGIN, "templates")).map((rel) => [rel, sha(readFileSync(join(PLUGIN, "templates", ...rel.split("/"))))]));
const fx = fxTgz();
const temps: string[] = [];
after(() => {
  cleanupFxTgz();
  for (const t of temps) rmSync(t, { recursive: true, force: true });
});
const entry = (name: string) => {
  const b = fx.entries.get(`package/${name}`);
  assert.ok(b, `tarball holds package/${name}`);
  return b;
};

test("C002-TS-503: the tarball is architect-sdd-<version>.tgz; package.json has the unscoped name, the plugin version and bin sdd", () => {
  assert.equal(fx.tgz.split(/[\\/]/).pop(), `architect-sdd-${version}.tgz`);
  const pkg = JSON.parse(entry("package.json").toString("utf8")) as Record<string, unknown>;
  assert.equal(pkg.name, "architect-sdd");
  assert.equal(pkg.version, version);
  assert.deepEqual(pkg.bin, { sdd: "scripts/sdd.mjs", "sdd-mcp": "scripts/sdd-mcp.mjs" });
  // C002-IF-003 §2 rules: no dependencies of any kind, no scripts, engines.node >=20, the files list.
  for (const k of ["dependencies", "optionalDependencies", "peerDependencies", "scripts"]) assert.equal(pkg[k], undefined, k);
  assert.deepEqual(pkg.engines, { node: ">=20" });
  assert.equal(pkg.type, "module");
  assert.equal(pkg.license, "MIT");
  assert.deepEqual(pkg.files, ["scripts/sdd.mjs", "scripts/sdd-mcp.mjs", "templates/", "serena/", "THIRD_PARTY_NOTICES.md"]);
});

test("C002-TS-417: the tarball holds exactly the layout of C002-IF-003 §1, with separate sdd and sdd-mcp bundles", () => {
  const expected = [
    "package.json",
    "README.md",
    "LICENSE",
    "THIRD_PARTY_NOTICES.md",
    "scripts/sdd.mjs",
    "scripts/sdd-mcp.mjs",
    "serena/architect-read-only.yml",
    ...filesUnder(join(PLUGIN, "templates")).map((r) => `templates/${r}`),
  ].map((r) => `package/${r}`);
  assert.deepEqual([...fx.entries.keys()].sort(), expected.sort());
  // templates/ sits beside scripts/ (the CLI reads the folder above its bundle, blast-radius §3.3).
  for (const p of ["full", "lite", "constitution"]) assert.ok([...fx.entries.keys()].some((k) => k.startsWith(`package/templates/${p}/`)), p);
  // Byte copies of the build outputs (C002-ADR-004: one CLI bundle in three places).
  assert.ok(entry("scripts/sdd.mjs").equals(readFileSync(join(PLUGIN, "scripts", "sdd.mjs"))), "scripts/sdd.mjs is the plugin bundle, byte for byte");
  assert.ok(entry("scripts/sdd-mcp.mjs").equals(readFileSync(join(root, "build", "npm", "sdd-mcp.mjs"))), "scripts/sdd-mcp.mjs is build/npm/sdd-mcp.mjs");
  for (const [bin, what] of [["sdd", "sdd CLI"], ["sdd-mcp", "sdd MCP server"]] as const) {
    const [first, second] = entry(`scripts/${bin}.mjs`).toString("utf8").split("\n");
    assert.equal(first, "#!/usr/bin/env node", bin);
    assert.equal(second, `// architect-plugin@${version} — ${what}. Generated by scripts/build.mjs; do not edit.`);
  }
  assert.notEqual(sha(entry("scripts/sdd.mjs")), sha(entry("scripts/sdd-mcp.mjs")));
  assert.deepEqual(readdirSync(join(PLUGIN, "scripts")), ["sdd.mjs"]);
  // README: install and the two executables.
  const readme = entry("README.md").toString("utf8");
  assert.ok(readme.includes(`npm install -g architect-sdd@${version}`));
  assert.ok(readme.includes("`sdd <command> …`") && readme.includes("`sdd-mcp --profile files|shell"));
  assert.equal(readme, npmReadme(version));
});

test("npm README names the repository URL https://github.com/jlacube/spec-architect, whose README is the full guide (C002-IF-003 §1)", () => {
  assert.equal(REPOSITORY_URL, "https://github.com/jlacube/spec-architect");
  const readme = npmReadme("0.3.0");
  assert.ok(readme.split("\n").some((l) => l.includes("https://github.com/jlacube/spec-architect") && /full guide/i.test(l)), readme);
});

test("C002-TS-419 (tarball part): LICENSE holds the MIT license and THIRD_PARTY_NOTICES.md the union of both bundles", () => {
  const license = entry("LICENSE");
  assert.match(license.toString("utf8"), /^MIT License/);
  assert.ok(license.equals(readFileSync(join(root, "LICENSE"))));
  const notices = entry("THIRD_PARTY_NOTICES.md");
  assert.ok(notices.equals(readFileSync(join(root, "build", "npm", "THIRD_PARTY_NOTICES.md"))), "the union notices of the build");
  for (const name of ["yaml", "@modelcontextprotocol/sdk"]) assert.match(notices.toString("utf8"), new RegExp(`^### ${name.replace("/", "\\/")} \\d+\\.\\d+\\.\\d+ — \\S+`, "m"), name);
});

test("C002-TS-519: every template and the Serena mode file, with the source SHA-256 except the translated hand-off templates", () => {
  for (const [rel, srcSha] of sourceShas) {
    const staged = sha(entry(`templates/${rel}`));
    if (HANDOFFS.includes(rel)) assert.notEqual(staged, srcSha, `${rel} is translated`);
    else assert.equal(staged, srcSha, rel);
  }
  assert.equal(sha(entry("serena/architect-read-only.yml")), sha(readFileSync(join(PLUGIN, "serena", "architect-read-only.yml"))));
});

for (const [profile, line, args] of [
  ["full", 20, "task set <task-id> --status in-progress"],
  ["full", 23, 'defect add --ref <ID> --summary "<what is wrong>"'],
  ["lite", 21, 'task set <task-id> --status done --commit <sha> --note "<summary>"'],
  ["lite", 22, 'task set <task-id> --status blocked --reason "<why>"'],
] as const) {
  test(`C002-TS-529: line ${line} of ${profile}/20-plan/handoff.md reads "sdd ${args}" in the tarball; the source is unchanged`, () => {
    const rel = `${profile}/20-plan/handoff.md`;
    const srcPath = join(PLUGIN, "templates", profile, "20-plan", "handoff.md");
    const src = readFileSync(srcPath, "utf8").split("\n");
    assert.equal(src[line - 1], `node <plugin-root>/scripts/sdd.mjs ${args}`, "the source line of the scenario");
    const staged = entry(`templates/${rel}`).toString("utf8");
    const lines = staged.split("\n");
    assert.equal(lines[line - 1], `sdd ${args}`);
    assert.equal(lines.length, src.length, "line numbers stay");
    assert.ok(!staged.includes("scripts/sdd.mjs") && !staged.includes("<plugin-root>"));
    // Nothing else changes.
    lines.forEach((l, i) => {
      if (l !== src[i]) assert.equal(`node <plugin-root>/scripts/${l.replace(/^sdd /, "sdd.mjs ")}`, src[i]);
    });
    assert.equal(sha(readFileSync(srcPath)), sourceShas.get(rel));
  });
}

test("C002-TS-535: the shipped templates leave no plugin path of the CLI after the translation", () => {
  assert.deepEqual(fx.scan, []);
});

/** fx-plugin-tmpl: the staging inputs of this repository with templates planted at given lines. */
function fxPluginTmpl(plant: Record<string, [number, string]>): string {
  const repo = realpathSync.native(mkdtempSync(join(tmpdir(), "sdd-fx-plugin-tmpl-")));
  temps.push(repo);
  for (const rel of ["plugins/architect/scripts", "plugins/architect/templates", "plugins/architect/serena", "build/npm/sdd-mcp.mjs", "build/npm/THIRD_PARTY_NOTICES.md", "LICENSE"]) {
    cpSync(join(root, ...rel.split("/")), join(repo, ...rel.split("/")), { recursive: true });
  }
  for (const [rel, [line, text]] of Object.entries(plant)) {
    const p = join(repo, "plugins", "architect", "templates", ...rel.split("/"));
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, [...Array.from({ length: line - 1 }, (_, i) => `Line ${i + 1}.`), text, ""].join("\n"));
  }
  return repo;
}

test("C002-TS-530: a plugin path of the CLI left in a staged template fails with ERR-BLD-002 naming template, line and construct", () => {
  const repo = fxPluginTmpl({
    "full/20-plan/plan.md": [12, "The CLI lives at <plugin-root>/scripts/sdd.mjs."],
    "lite/10-spec/spec.md": [7, 'Run ${CLAUDE_PLUGIN_ROOT}/scripts/sdd.mjs with "lint".'],
  });
  const msgs = stageNpm(repo, join(repo, "dist", "npm", "architect-sdd"), version);
  assert.deepEqual(msgs, [
    'ERR-BLD-002: build failed: template full/20-plan/plan.md:12: plugin path of the CLI "<plugin-root>/scripts/sdd.mjs"',
    'ERR-BLD-002: build failed: template lite/10-spec/spec.md:7: plugin path of the CLI "${CLAUDE_PLUGIN_ROOT}"',
  ]);
  // The staging writes only under dist/: the planted sources are as written.
  assert.ok(readFileSync(join(repo, "plugins", "architect", "templates", "full", "20-plan", "plan.md"), "utf8").includes("<plugin-root>/scripts/sdd.mjs"));
});

test("CLI-line translation: node with either plugin path, quoted or not, becomes sdd; other text is left for the scan", () => {
  assert.equal(translateCliLines("node <plugin-root>/scripts/sdd.mjs lint\n"), "sdd lint\n");
  assert.equal(translateCliLines('run `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdd.mjs" status` now'), "run `sdd status` now");
  assert.equal(translateCliLines("node '<plugin-root>/scripts/sdd.mjs' a\r\nnode <plugin-root>/scripts/sdd.mjs b"), "sdd a\r\nsdd b");
  // Not an invocation (no `node`, mismatched quotes, other line): unchanged, then reported by the scan.
  for (const text of ["see <plugin-root>/scripts/sdd.mjs", "node \"<plugin-root>/scripts/sdd.mjs' x", "node\n<plugin-root>/scripts/sdd.mjs x"]) {
    assert.equal(translateCliLines(text), text);
    assert.ok(scanCliPaths(translateCliLines(text)).length > 0, text);
  }
  assert.deepEqual(scanCliPaths("a\nnode $ROOT/scripts/sdd.mjs x and %ROOT%\\scripts\\sdd.mjs\n"), [
    { line: 2, construct: "$ROOT/scripts/sdd.mjs" },
    { line: 2, construct: "%ROOT%\\scripts\\sdd.mjs" },
  ]);
  assert.deepEqual(scanCliPaths("${CLAUDE_PLUGIN_ROOT}/agents/x.md"), [{ line: 1, construct: "${CLAUDE_PLUGIN_ROOT}" }]);
  assert.deepEqual(scanCliPaths("sdd task set <task-id>; node scripts/sdd.mjs from the repository"), []);
});

test("npm's JavaScript entry: npm_execpath, else beside the Node executable; none found names the places", () => {
  const dir = realpathSync.native(mkdtempSync(join(tmpdir(), "sdd-npmcli-")));
  temps.push(dir);
  const cli = join(dir, "node_modules", "npm", "bin", "npm-cli.js");
  mkdirSync(dirname(cli), { recursive: true });
  writeFileSync(cli, "");
  assert.equal(npmCli({ npm_execpath: cli }, join(dir, "elsewhere", "node.exe")), cli);
  assert.equal(npmCli({}, join(dir, "node.exe")), cli);
  assert.throws(() => npmCli({}, join(dir, "x", "y", "node.exe")), /npm_execpath \(not set\).*npm-cli\.js.*npm-cli\.js/);
});

test("C002-TS-501 / C002-TS-517 (tarball row): the installed sdd --version prints exactly the bundled CLI's version line", () => {
  const bundled = runBundled(["--version"], { cwd: tmpdir() });
  const installed = fx.runShim("sdd", ["--version"], { cwd: tmpdir() });
  assert.deepEqual(installed, { code: 0, stdout: `${version}\n`, stderr: "" });
  assert.deepEqual(installed, bundled);
  // C002-TS-518 row: `sdd version` keeps its form.
  assert.deepEqual(fx.runShim("sdd", ["version"], { cwd: tmpdir() }), { code: 0, stdout: `architect-plugin@${version}\n`, stderr: "" });
  // Both executables are installed.
  for (const bin of ["sdd", "sdd-mcp"]) assert.ok(readdirSync(fx.binDir).some((f) => f === bin || f === `${bin}.cmd`), bin);
});

test("C002-TS-502 (C002-TC-502): the installed sdd creates the same change folder as the bundled CLI (003-export, fx-bootstrap holding 001 and 002), apart from the translated CLI lines (CLAUDE_PLUGIN_ROOT unset)", () => {
  const a = fxBootstrap();
  const b = fxBootstrap();
  try {
    const args = ["change", "new", "Export", "--profile", "lite", "--kind", "greenfield"];
    const env = { CLAUDE_PLUGIN_ROOT: undefined, CLAUDE_PLUGIN_DATA: undefined };
    // Given: the bundled CLI has created the change of fx-b.
    const bundled = runBundled(args, { cwd: b.root, env });
    assert.equal(bundled.code, 0, bundled.stderr);
    // When: the installed sdd runs in fx-a.
    const installed = fx.runEntry("sdd", args, { cwd: a.root, env });
    assert.equal(installed.code, 0, installed.stderr);
    const created = readdirSync(join(a.root, ".sdd")).filter((d) => d.endsWith("-export"));
    assert.equal(created.length, 1, readdirSync(join(a.root, ".sdd")).join(", "));
    // The same change folder in both copies: the next free number of fx-bootstrap, which holds 001 and 002.
    const folder = created[0]!;
    assert.equal(String(folder), "003-export", "the next free change number of fx-bootstrap");
    assert.deepEqual(readdirSync(join(b.root, ".sdd")).filter((d) => d.endsWith("-export")), [folder]);
    // The same list of relative file paths.
    const fa = filesUnder(join(a.root, ".sdd", folder)).sort();
    assert.deepEqual(fa, filesUnder(join(b.root, ".sdd", folder)).sort());
    // Each file has the same lines, except lines of 20-plan/handoff.md in which fx-b holds
    // `node <plugin-root>/scripts/sdd.mjs` and fx-a `sdd` in its place, the rest of the line being equal.
    const PLUGIN_CLI = "node <plugin-root>/scripts/sdd.mjs";
    const differing: string[] = [];
    for (const rel of fa) {
      const la = readFileSync(join(a.root, ".sdd", folder, rel), "utf8").split("\n");
      const lb = readFileSync(join(b.root, ".sdd", folder, rel), "utf8").split("\n");
      assert.equal(la.length, lb.length, `${rel}: line count`);
      lb.forEach((line, i) => {
        if (la[i] === line) return;
        differing.push(rel);
        assert.equal(rel, "20-plan/handoff.md", `${rel}:${i + 1} differs: ${JSON.stringify(la[i])} vs ${JSON.stringify(line)}`);
        assert.ok(line.includes(PLUGIN_CLI), `${rel}:${i + 1} of fx-b holds ${PLUGIN_CLI}: ${line}`);
        assert.equal(la[i], line.split(PLUGIN_CLI).join("sdd"), `${rel}:${i + 1}`);
      });
    }
    assert.ok(differing.includes("20-plan/handoff.md"), "the hand-off CLI lines are translated");
  } finally {
    a.cleanup();
    b.cleanup();
  }
});

test("C002-TS-534: the installed sdd shows the shipped hand-off template with sdd lines", () => {
  const fxb = fxBootstrap();
  try {
    rmSync(join(fxb.root, ".sdd", "_templates"), { recursive: true, force: true });
    const r = fx.runShim("sdd", ["template", "show", "full/20-plan/handoff.md"], { cwd: fxb.root });
    assert.equal(r.code, 0, r.stderr);
    assert.ok(r.stdout.split(/\r?\n/).includes("sdd task set <task-id> --status in-progress"), r.stdout);
    assert.ok(!r.stdout.includes("scripts/sdd.mjs"));
    assert.equal(r.stdout, entry("templates/full/20-plan/handoff.md").toString("utf8"));
  } finally {
    fxb.cleanup();
  }
});
