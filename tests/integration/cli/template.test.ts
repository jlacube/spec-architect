// `sdd template show` and `sdd template list` (C002-T-012; C002-IF-007, C002-REQ-513, C002-REQ-514,
// C002-REQ-520): repository override first, shipped fallback, refusal of paths that leave the
// profile folder (`..`, links), code-point order and uniqueness, and the npm `sdd` reading its own
// templates while CLAUDE_PLUGIN_ROOT is set (C002-TC-538 on the installed tarball, fx-tgz; C002-T-061).
import { after, test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fxBootstrap } from "../../fixtures/fixtures.ts";
import { cleanupFxTgz, fxTgz } from "../../fixtures/fx-tgz.ts";
import { repoRoot } from "../../helpers.ts";
import { CLI, runBundled } from "./helpers.ts";

after(cleanupFxTgz);

const PLUGIN = join(repoRoot(), "plugins", "architect");
const shipped = (rel: string) => readFileSync(join(PLUGIN, "templates", ...rel.split("/")), "utf8");

function put(root: string, rel: string, text: string): void {
  const p = join(root, ...rel.split("/"));
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, text);
}

/** Files under `dir`, relative with `/` separators. */
function filesUnder(dir: string, rel = ""): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? filesUnder(join(dir, e.name), `${rel}${e.name}/`) : [`${rel}${e.name}`]));
}

/** Runs a copy of the bundled CLI at `script` (an npm-like package layout) with `env` laid over the inherited environment. */
function runBundledAt(script: string, args: string[], cwd: string, env: Record<string, string>): { code: number; stdout: string; stderr: string } {
  const r = spawnSync(process.execPath, [script, ...args], { cwd, env: { ...process.env, SDD_DEBUG: undefined, ...env }, encoding: "utf8" });
  return { code: r.status ?? -1, stdout: r.stdout, stderr: r.stderr };
}

test("C002-TC-520 (C002-TS-520): template show prints the repository override when that file exists, else the shipped template", () => {
  const fx = fxBootstrap();
  try {
    const rel = "full/10-spec/70-dod.md";
    // No .sdd/_templates/: the shipped template, byte for byte, nothing on standard error.
    let r = runBundled(["template", "show", rel], { cwd: fx.root });
    assert.equal(r.code, 0, r.stderr);
    assert.equal(r.stdout, shipped(rel));
    assert.equal(r.stderr, "");
    // An override folder without that file: still the shipped template.
    put(fx.root, ".sdd/_templates/full/10-spec/nfr.md", "# Our NFRs\n");
    r = runBundled(["template", "show", rel], { cwd: fx.root });
    assert.equal(r.code, 0, r.stderr);
    assert.equal(r.stdout, shipped(rel));
    // The override: printed unchanged (no newline added).
    put(fx.root, ".sdd/_templates/full/10-spec/70-dod.md", "# Our DoD");
    r = runBundled(["template", "show", rel], { cwd: join(fx.root, ".sdd") });
    assert.equal(r.code, 0, r.stderr);
    assert.equal(r.stdout, "# Our DoD");
    // The constitution profile is shipped too.
    r = runBundled(["template", "show", "constitution/constitution.md"], { cwd: fx.root });
    assert.equal(r.code, 0, r.stderr);
    assert.equal(r.stdout, shipped("constitution/constitution.md"));
  } finally {
    fx.cleanup();
  }
});

test("C002-TC-521 (C002-TS-521): an unknown template or profile exits 2 with ERR-CLI-019 naming the profile and the path", () => {
  const fx = fxBootstrap();
  try {
    for (const [arg, profile, path] of [
      ["full/10-spec/missing.md", "full", "10-spec/missing.md"],
      ["beta/ideation.md", "beta", "ideation.md"],
      ["full/10-spec", "full", "10-spec"],
    ] as const) {
      const r = runBundled(["template", "show", arg], { cwd: fx.root });
      assert.equal(r.code, 2, arg);
      assert.equal(r.stdout, "", arg);
      assert.ok(r.stderr.startsWith("ERR-CLI-019"), r.stderr);
      assert.ok(r.stderr.includes(`no ${profile} template ${path}`), r.stderr);
      assert.ok(r.stderr.includes(`sdd template list ${profile}`), r.stderr);
    }
  } finally {
    fx.cleanup();
  }
});

test("C002-TC-522 (C002-TS-522): a path that leaves the profile's template folder through `..` or a link is refused; `..` inside it is accepted", () => {
  const fx = fxBootstrap();
  try {
    put(fx.root, ".sdd/_templates/full/10-spec/70-dod.md", "# Our DoD\n");
    put(fx.root, "package.json", "{}\n");
    // A junction needs no privilege on Windows; elsewhere the type is ignored.
    symlinkSync(fx.root, join(fx.root, ".sdd", "_templates", "full", "link-out"), "junction");
    for (const arg of ["full/../../package.json", "full/../../../.sdd/registry.json", "full/../lite/10-spec/spec.md", "full/link-out/package.json"]) {
      const r = runBundled(["template", "show", arg], { cwd: fx.root });
      assert.equal(r.code, 2, arg);
      assert.equal(r.stdout, "", arg);
      assert.ok(r.stderr.startsWith("ERR-CLI-019"), `${arg}: ${r.stderr}`);
      assert.ok(r.stderr.includes("no full template "), r.stderr);
    }
    const ok = runBundled(["template", "show", "full/10-spec/../10-spec/70-dod.md"], { cwd: fx.root });
    assert.equal(ok.code, 0, ok.stderr);
    assert.equal(ok.stdout, "# Our DoD\n");
    // The link is not listed either.
    const list = runBundled(["template", "list", "full"], { cwd: fx.root });
    assert.equal(list.code, 0);
    assert.equal(list.stdout.split("\n").some((l) => l.startsWith("link-out")), false, list.stdout);
  } finally {
    fx.cleanup();
  }
});

test("C002-TC-531 (C002-TS-531): template list prints every shipped template of the profile once, in code-point order", () => {
  const fx = fxBootstrap();
  try {
    const r = runBundled(["template", "list", "lite"], { cwd: fx.root });
    assert.equal(r.code, 0, r.stderr);
    assert.equal(r.stderr, "");
    const lines = r.stdout.split("\n");
    assert.equal(lines.pop(), "", "one path per line, final newline");
    const expected = filesUnder(join(PLUGIN, "templates", "lite"));
    assert.deepEqual([...lines].sort(), [...expected].sort());
    assert.deepEqual(lines, [...lines].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)));
    assert.equal(lines[0], "00-ideation/ideation.md");
    assert.equal(lines.at(-1), "ids.json");
    // An unknown profile prints no line.
    const none = runBundled(["template", "list", "beta"], { cwd: fx.root });
    assert.deepEqual([none.code, none.stdout, none.stderr], [0, "", ""]);
  } finally {
    fx.cleanup();
  }
});

test("C002-TC-532 (C002-TS-532): repository templates are merged, each path once, upper case before lower case, and every line resolves", () => {
  const fx = fxBootstrap();
  try {
    put(fx.root, ".sdd/_templates/lite/10-spec/spec.md", "# Our spec\n");
    put(fx.root, ".sdd/_templates/lite/10-spec/Notes.md", "# Notes\n");
    const r = runBundled(["template", "list", "lite"], { cwd: fx.root });
    assert.equal(r.code, 0, r.stderr);
    const lines = r.stdout.trimEnd().split("\n");
    assert.equal(lines.filter((l) => l === "10-spec/spec.md").length, 1);
    assert.equal(new Set(lines).size, lines.length);
    assert.equal(lines.indexOf("10-spec/Notes.md") + 1, lines.indexOf("10-spec/dod.md"), r.stdout);
    for (const l of lines) assert.equal(runBundled(["template", "show", `lite/${l}`], { cwd: fx.root }).code, 0, l);
  } finally {
    fx.cleanup();
  }
});

test("C002-TC-538 (C002-TS-538): the installed npm sdd in a Claude Code session reads its own templates, not those of CLAUDE_PLUGIN_ROOT", () => {
  const fx = fxBootstrap();
  const pluginRoot = realpathSync.native(mkdtempSync(join(tmpdir(), "sdd-fx-plugin-root-")));
  try {
    const tgz = fxTgz();
    rmSync(join(fx.root, ".sdd", "_templates"), { recursive: true, force: true });
    put(pluginRoot, "templates/full/20-plan/handoff.md", "# plugin copy\n");
    const r = tgz.runShim("sdd", ["template", "show", "full/20-plan/handoff.md"], { cwd: fx.root, env: { CLAUDE_PLUGIN_ROOT: pluginRoot.replace(/\\/g, "/") } });
    assert.equal(r.code, 0, r.stderr);
    assert.equal(r.stdout, readFileSync(join(tgz.pkgDir, "templates", "full", "20-plan", "handoff.md"), "utf8"));
    assert.ok(!r.stdout.includes("# plugin copy"), r.stdout);
  } finally {
    fx.cleanup();
    rmSync(pluginRoot, { recursive: true, force: true });
  }
});

test("the npm sdd reads the templates shipped beside it, also while CLAUDE_PLUGIN_ROOT names the Claude Code plugin", () => {
  const pkg = realpathSync.native(mkdtempSync(join(tmpdir(), "sdd-npm-")));
  try {
    mkdirSync(join(pkg, "scripts"));
    copyFileSync(CLI, join(pkg, "scripts", "sdd.mjs"));
    put(pkg, "templates/full/10-spec/70-dod.md", "# npm package DoD\n");
    put(pkg, "work/readme.txt", "x");
    const r = runBundledAt(join(pkg, "scripts", "sdd.mjs"), ["template", "show", "full/10-spec/70-dod.md"], join(pkg, "work"), { CLAUDE_PLUGIN_ROOT: PLUGIN });
    assert.equal(r.code, 0, r.stderr);
    assert.equal(r.stdout, "# npm package DoD\n");
    const list = runBundledAt(join(pkg, "scripts", "sdd.mjs"), ["template", "list", "full"], join(pkg, "work"), { CLAUDE_PLUGIN_ROOT: PLUGIN });
    assert.equal(list.stdout, "10-spec/70-dod.md\n");
  } finally {
    rmSync(pkg, { recursive: true, force: true });
  }
});
