// C002-T-034 — `npm run package` runs the generator and zips each target (C002-REQ-101, flow F1). The
// packaging steps of scripts/package.mjs run here on a temporary dist/ (stageMarketplace for the Claude
// Code outputs, packageTargets for the generator step and the target zips, as the script entry does).
//   C002-TC-101 (C002-TS-101)  one packaging run writes both target packages beside the Claude Code ones
//   C002-TC-102 (C002-TS-102)  a generator error (fx-plugin-unmapped) fails the packaging run
//   C002-TC-103 (C002-TS-103)  files of an earlier run are not kept
import { test } from "node:test";
import assert from "node:assert/strict";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { GENERATED_TARGETS, packageTargets, stageMarketplace, targetZipName } from "../../../scripts/package.mjs";
import { MANIFEST } from "../../../scripts/generate/writer.ts";
import { repoRoot } from "../../helpers.ts";
import { readZip } from "../../helpers/zip.ts";

const root = repoRoot();
const PLUGIN = join(root, "plugins", "architect");
const version = (JSON.parse(readFileSync(join(PLUGIN, ".claude-plugin", "plugin.json"), "utf8")) as { version: string }).version;
const TS_108_MESSAGE =
  'ERR-GEN-001: agents/sdd-critic.md:7: tool name "KillShell" has no entry in the copilot mapping table. Fix: Add the entry to `plugins/architect/targets/copilot.json`, or remove the construct from the source';

/** Every file under `dir`, relative and "/"-separated, sorted. */
function relFiles(dir: string): string[] {
  const out: string[] = [];
  const walk = (abs: string, rel: string) => {
    for (const name of readdirSync(abs).sort()) {
      const p = join(abs, name);
      const r = rel === "" ? name : `${rel}/${name}`;
      if (statSync(p).isDirectory()) walk(p, r);
      else out.push(r);
    }
  };
  walk(dir, "");
  return out.sort();
}

type Manifest = { target: string; package_version: string; files: { path: string }[] };
const manifestOf = (dir: string) => JSON.parse(readFileSync(join(dir, MANIFEST), "utf8")) as Manifest;

/** fx-plugin-unmapped: a copy of the source plugin whose sdd-critic lists "KillShell" on line 7, mapped for OpenCode only (as C002-TS-108). */
function fxPluginUnmapped(base: string): string {
  const src = join(base, "src", "plugins", "architect");
  cpSync(PLUGIN, src, { recursive: true });
  const file = join(src, "agents", "sdd-critic.md");
  const lines = readFileSync(file, "utf8").replace(/\r\n/g, "\n").split("\n");
  assert.match(lines[6]!, /^tools: /, "line 7 holds the tools field");
  lines[6] += ", KillShell";
  writeFileSync(file, lines.join("\n"));
  const table = join(src, "targets", "opencode.json");
  const d = JSON.parse(readFileSync(table, "utf8")) as { tools: Record<string, unknown> };
  d.tools["KillShell"] = [];
  writeFileSync(table, JSON.stringify(d, null, 2) + "\n");
  return src;
}

test("C002-TC-101 (C002-TS-101): one packaging run writes both target packages and the Claude Code outputs as before", () => {
  const base = mkdtempSync(join(tmpdir(), "sdd-pkg-"));
  try {
    const dist = join(base, "dist");
    const stage = join(dist, `architect-${version}`);
    stageMarketplace(root, stage, version);
    const r = packageTargets({ root, dist, version, stdio: "pipe" });
    assert.equal(r.code, 0, r.stderr);

    // The Claude Code plugin and marketplace as before CHG-002: the source plugin minus targets/.
    assert.ok(existsSync(join(stage, ".claude-plugin", "marketplace.json")));
    assert.ok(existsSync(join(stage, "INSTALL.md")));
    assert.deepEqual(relFiles(join(stage, "plugins", "architect")), relFiles(PLUGIN).filter((p) => !p.startsWith("targets/")));

    for (const t of GENERATED_TARGETS) {
      const dir = join(dist, t);
      const m = manifestOf(dir);
      assert.equal(m.target, t);
      assert.equal(m.package_version, version);
      assert.deepEqual(relFiles(dir), [...m.files.map((f) => f.path), MANIFEST].sort(), `${t}: the folder holds the generated package`);
      assert.match(r.stdout, new RegExp(`^${t}: written .*/${t}/ \\(\\d+ files, mode [a-z-]+\\)$`, "m"));
      assert.ok(existsSync(join(dist, targetZipName(t, version))), `${t}: zip written`);
    }
    assert.deepEqual(r.zips, GENERATED_TARGETS.map((t) => join(dist, targetZipName(t, version))));
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("C002-TC-102 (C002-TS-102): a generator error fails the packaging run with the C002-TS-108 message and no target output", () => {
  const base = mkdtempSync(join(tmpdir(), "sdd-pkg-"));
  try {
    const src = fxPluginUnmapped(base);
    const dist = join(base, "dist");
    mkdirSync(dist, { recursive: true });
    for (const t of GENERATED_TARGETS) writeFileSync(join(dist, targetZipName(t, version)), "earlier run\n");
    const r = packageTargets({ root, dist, version, source: src, stdio: "pipe" });
    assert.notEqual(r.code, 0);
    assert.equal(r.code, 1, "the generator's exit code is passed through");
    assert.ok(r.stderr.split(/\r?\n/).includes(TS_108_MESSAGE), r.stderr);
    assert.deepEqual(r.zips, []);
    for (const t of GENERATED_TARGETS) {
      assert.ok(!existsSync(join(dist, t)), `${t}/ must not exist`);
      assert.ok(!existsSync(join(dist, targetZipName(t, version))), `${t} zip must not exist`);
    }
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("C002-TC-103 (C002-TS-103): files of an earlier run are not kept", () => {
  const base = mkdtempSync(join(tmpdir(), "sdd-pkg-"));
  try {
    const dist = join(base, "dist");
    const retired = join(dist, "opencode", ".opencode", "agents", "sdd-retired.md");
    mkdirSync(join(retired, ".."), { recursive: true });
    writeFileSync(retired, "old\n");
    mkdirSync(join(dist, "copilot"), { recursive: true });
    writeFileSync(join(dist, "copilot", "stale.md"), "old\n");
    for (const t of GENERATED_TARGETS) writeFileSync(join(dist, targetZipName(t, version)), "earlier run\n");

    const r = packageTargets({ root, dist, version, stdio: "pipe" });
    assert.equal(r.code, 0, r.stderr);
    assert.deepEqual(relFiles(join(dist, "opencode")).filter((p) => p.endsWith("sdd-retired.md")), []);
    for (const t of GENERATED_TARGETS) {
      const dir = join(dist, t);
      const written = [...manifestOf(dir).files.map((f) => f.path), MANIFEST].sort();
      assert.deepEqual(relFiles(dir), written, `${t}: every file is one the generator wrote in this run`);
      assert.deepEqual([...readZip(join(dist, targetZipName(t, version))).keys()].sort(), written, `${t}: the zip is this run's`);
    }
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});
