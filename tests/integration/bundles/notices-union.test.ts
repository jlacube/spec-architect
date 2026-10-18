// C002-TC-418 / C002-TS-418 (C002-AC-413.1, C002-REQ-413) and C002-TC-419 / C002-TS-419 (C002-AC-414.1,
// C002-REQ-414), build part (C002-T-021, C002-ADR-004): one esbuild run bundles the sdd CLI into the
// plugin and the sdd MCP server into build/npm/; a GPL-3.0 package in either entry fails the build with
// a line `ERR-BLD-001: <message>` (C002-T-061) naming the entry, the package and its license; build/npm/THIRD_PARTY_NOTICES.md lists
// every package of both bundles, the plugin's notices only those of sdd.mjs. Runs on a temporary copy of
// the build inputs (the repository is untouched). The tarball row of TS-419 (LICENSE and notices read
// from the packed architect-sdd) needs fx-tgz and belongs to the packaging task.
// (The folder is not named build/: that name is git-ignored.)
import { after, test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { build } from "esbuild";
import { bundledPackages } from "../../../scripts/licenses.mjs";
import { repoRoot } from "../../helpers.ts";

const root = repoRoot();
const version = (JSON.parse(readFileSync(join(root, "plugins", "architect", ".claude-plugin", "plugin.json"), "utf8")) as { version: string }).version;
const trees: string[] = [];
after(() => {
  for (const t of trees) rmSync(t, { recursive: true, force: true });
});

/** fx-src: a copy of the build inputs with the real node_modules (junctions) and a GPL-3.0 "gpl-lib". */
function buildTree(): string {
  const tmp = realpathSync.native(mkdtempSync(join(tmpdir(), "sdd-bundles-")));
  trees.push(tmp);
  for (const d of ["scripts", "src"]) cpSync(join(root, d), join(tmp, d), { recursive: true });
  cpSync(join(root, "package.json"), join(tmp, "package.json"));
  mkdirSync(join(tmp, "plugins", "architect", "scripts"), { recursive: true });
  cpSync(join(root, "plugins", "architect", ".claude-plugin"), join(tmp, "plugins", "architect", ".claude-plugin"), { recursive: true });
  cpSync(join(root, "plugins", "architect", "THIRD_PARTY_NOTICES.md"), join(tmp, "plugins", "architect", "THIRD_PARTY_NOTICES.md"));
  mkdirSync(join(tmp, "node_modules"));
  for (const e of readdirSync(join(root, "node_modules"), { withFileTypes: true })) {
    if (e.isDirectory() && !e.name.startsWith(".")) symlinkSync(join(root, "node_modules", e.name), join(tmp, "node_modules", e.name), "junction");
  }
  mkdirSync(join(tmp, "node_modules", "gpl-lib"));
  writeFileSync(join(tmp, "node_modules", "gpl-lib", "package.json"), JSON.stringify({ name: "gpl-lib", version: "1.0.0", license: "GPL-3.0", main: "index.js" }));
  writeFileSync(join(tmp, "node_modules", "gpl-lib", "index.js"), "module.exports = 1;\n");
  return tmp;
}

function runBuild(tree: string): { status: number | null; stdout: string; stderr: string } {
  return spawnSync(process.execPath, [join(tree, "scripts", "build.mjs")], { cwd: tree, encoding: "utf8" });
}

for (const [entry, name, source] of [
  ["sdd executable", "sdd", ["src", "cli.ts"]],
  ["sdd MCP server", "sdd-mcp", ["src", "mcp", "server.ts"]],
] as const) {
  test(`C002-TS-418: GPL dependency in the ${entry} entry fails the build (ERR-BLD-001)`, () => {
    const tree = buildTree();
    const file = join(tree, ...source);
    writeFileSync(file, `import gpl from "gpl-lib";\nvoid gpl;\n${readFileSync(file, "utf8")}`);
    const r = runBuild(tree);
    assert.notEqual(r.status, 0, r.stdout);
    // C002-TS-418 (revised, print form of errors.md §4): a line starts with the code and its message.
    const line = r.stderr.split(/\r?\n/).find((l) => l.startsWith("ERR-BLD-001: "));
    assert.ok(line, `an ERR-BLD-001 line on standard error:\n${r.stderr}`);
    assert.ok(line.startsWith("ERR-BLD-001: build failed: "), line);
    assert.ok(line.endsWith("bundled package license not allowed: gpl-lib@1.0.0 (GPL-3.0)"), line);
    assert.equal(line, `ERR-BLD-001: build failed: ${name}: bundled package license not allowed: gpl-lib@1.0.0 (GPL-3.0)`);
    assert.doesNotMatch(r.stderr, /Could not resolve/, "fails on the licence, not on resolution");
    // Nothing is written when the check fails.
    assert.equal(existsSync(join(tree, "plugins", "architect", "scripts", "sdd.mjs")), false);
    assert.equal(existsSync(join(tree, "build", "npm", "sdd-mcp.mjs")), false);
  });
}

test("C002-TS-419: build/npm/THIRD_PARTY_NOTICES.md lists every package of both bundles; the plugin keeps sdd.mjs only", async () => {
  const tree = buildTree();
  const r = runBuild(tree);
  assert.equal(r.status, 0, r.stderr);

  // Where the bundles land (C002-ADR-004, C002-CON-12).
  assert.deepEqual(readdirSync(join(tree, "plugins", "architect", "scripts")), ["sdd.mjs"]);
  const server = readFileSync(join(tree, "build", "npm", "sdd-mcp.mjs"), "utf8").split("\n");
  assert.equal(server[0], "#!/usr/bin/env node");
  assert.equal(server[1], `// architect-plugin@${version} — sdd MCP server. Generated by scripts/build.mjs; do not edit.`);

  // The packages of each entry, from their own metafiles.
  const meta = async (entry: string): Promise<{ inputs: Record<string, unknown> }> =>
    (await build({ entryPoints: [entry], bundle: true, platform: "node", format: "esm", write: false, metafile: true, logLevel: "silent", define: { __SDD_VERSION__: '"0.0.0"' } })).metafile;
  const cliPkgs = bundledPackages(root, await meta(join(root, "src", "cli.ts")));
  const serverPkgs = bundledPackages(root, await meta(join(root, "src", "mcp", "server.ts")));
  const union = bundledPackages(root, [await meta(join(root, "src", "cli.ts")), await meta(join(root, "src", "mcp", "server.ts"))]);
  for (const name of ["yaml", "@modelcontextprotocol/sdk", "ajv", "zod"]) assert.ok(union.some((p) => p.name === name), `${name} is bundled`);
  assert.deepEqual(new Set(union.map((p) => p.name)), new Set([...cliPkgs, ...serverPkgs].map((p) => p.name)));

  const npmNotices = readFileSync(join(tree, "build", "npm", "THIRD_PARTY_NOTICES.md"), "utf8");
  for (const p of union) assert.ok(npmNotices.includes(`### ${p.name} ${p.version} — ${p.license}`), `${p.name} ${p.version} (${p.license}) listed`);
  assert.equal(npmNotices.match(/^### /gm)?.length, union.length, "no other package listed");

  const pluginNotices = readFileSync(join(tree, "plugins", "architect", "THIRD_PARTY_NOTICES.md"), "utf8");
  for (const p of cliPkgs) assert.ok(pluginNotices.includes(`### ${p.name} ${p.version} — ${p.license}`), `plugin lists ${p.name}`);
  assert.ok(!pluginNotices.includes("@modelcontextprotocol/sdk"), "the plugin's notices do not list the MCP SDK");

  // The plugin bundle does not contain the MCP SDK (C002-CON-12).
  assert.ok(!cliPkgs.some((p) => p.name === "@modelcontextprotocol/sdk"));
  assert.ok(!readFileSync(join(tree, "plugins", "architect", "scripts", "sdd.mjs"), "utf8").includes("@modelcontextprotocol/sdk"));

  // The MIT LICENSE that architect-sdd carries (the packed tarball is checked by the packaging task).
  assert.match(readFileSync(join(root, "LICENSE"), "utf8"), /^MIT License/);
});
