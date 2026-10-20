// C002-T-025 — the generator frame (C002-IF-004, C002-COMP-001): entry, source reader, writer and
// manifest. C002-TC-104 verifies C002-TS-104 (the source plugin keeps every file byte for byte after a
// generation of both targets); C002-TC-105 verifies C002-TS-105 (a failed generation, here fx-src with
// an invalid table, leaves the fixture's plugin folder untouched). Beside them: all or nothing
// (C002-INV-02) on a planted diagnostic and on a planted write error during the second target's rename,
// each starting from an earlier `<out>/<target>/` that must be gone afterwards; byte-identical runs with
// stable file order and LF line endings (C002-NFR-301); exit codes and print forms of C002-IF-004.
// C002-TC-672 (C002-T-064): a source without a package version fails the run with one ERR-GEN-007 for
// no target; the package version and its token come from the source plugin.json, never a built-in one.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, sep } from "node:path";
import { diagnostic } from "../../../scripts/generate/diagnostics.ts";
import { main, type MainOptions } from "../../../scripts/generate/main.ts";
import type { Emitter } from "../../../scripts/generate/model.ts";
import { TARGETS } from "../../../scripts/generate/tables.ts";
import { fsOps, MANIFEST } from "../../../scripts/generate/writer.ts";
import { repoRoot } from "../../helpers.ts";

const root = repoRoot();
const PLUGIN = join(root, "plugins", "architect");
const SORTED = [...TARGETS].sort();
const sha = (data: Buffer) => createHash("sha256").update(data).digest("hex");

/** Every file under `dir` (relative, `/`-separated) with the SHA-256 of its bytes, in path order. */
function tree(dir: string): Map<string, string> {
  const out = new Map<string, string>();
  const walk = (abs: string, rel: string) => {
    for (const name of readdirSync(abs).sort()) {
      const p = join(abs, name);
      const r = rel === "" ? name : `${rel}/${name}`;
      if (statSync(p).isDirectory()) walk(p, r);
      else out.set(r, sha(readFileSync(p)));
    }
  };
  walk(dir, "");
  return out;
}

function tmp(): string {
  return mkdtempSync(join(tmpdir(), "sdd-gen-"));
}

/** fx-src: a copy of the source plugin with its mapping tables (C002-T-025 fixture). */
function fxSrc(base: string): string {
  const src = join(base, "src", "plugins", "architect");
  cpSync(PLUGIN, src, { recursive: true });
  return src;
}

function cli(args: string[]) {
  const r = spawnSync(process.execPath, [join(root, "scripts", "generate.mjs"), ...args], { cwd: root, encoding: "utf8" });
  return { code: r.status, stdout: r.stdout, stderr: r.stderr };
}

/** Runs `main` in process with captured output. */
function run(args: string[], options: MainOptions = {}) {
  const stdout: string[] = [];
  const stderr: string[] = [];
  const code = main(args, { cwd: root, stdout: (l) => stdout.push(l), stderr: (l) => stderr.push(l), ...options });
  return { code, stdout: stdout.join("\n"), stderr: stderr.join("\n") };
}

/** An earlier run's packages and staging folders under `out`, plus an unrelated file the run must keep. */
function plantEarlier(out: string): void {
  for (const t of TARGETS) {
    mkdirSync(join(out, t, "sub"), { recursive: true });
    writeFileSync(join(out, t, "sub", "sdd-retired.md"), "old\n");
    mkdirSync(join(out, `.staging-${t}`), { recursive: true });
    writeFileSync(join(out, `.staging-${t}`, "half.md"), "half\n");
  }
  writeFileSync(join(out, "keep.zip"), "unrelated\n");
}

function assertNoSelectedOutput(out: string): void {
  for (const t of TARGETS) {
    assert.ok(!existsSync(join(out, t)), `${t}/ must not exist after a failed run`);
    assert.ok(!existsSync(join(out, `.staging-${t}`)), `.staging-${t}/ must not exist after a failed run`);
  }
  assert.ok(existsSync(join(out, "keep.zip")), "files outside the selected packages are kept");
}

test("C002-TC-104 (C002-TS-104): generating both targets keeps every file of plugins/architect/ byte for byte", () => {
  const base = tmp();
  try {
    const before = tree(PLUGIN);
    const r = cli(["--out", join(base, "out")]);
    assert.equal(r.code, 0, r.stderr);
    assert.deepEqual(tree(PLUGIN), before, "no file under plugins/architect/ changed, appeared or disappeared");
    const version = (JSON.parse(readFileSync(join(PLUGIN, ".claude-plugin", "plugin.json"), "utf8")) as { version: string }).version;
    for (const t of TARGETS) {
      const m = JSON.parse(readFileSync(join(base, "out", t, MANIFEST), "utf8")) as Record<string, unknown>;
      const table = JSON.parse(readFileSync(join(PLUGIN, "targets", `${t}.json`), "utf8")) as { enforcement_mode: string; host: { tested_versions: object } };
      assert.deepEqual(Object.keys(m), ["target", "package_version", "enforcement_mode", "mode_source", "table_schema_version", "tested_versions", "source_digest", "files"]);
      assert.equal(m.target, t);
      assert.equal(m.package_version, version);
      assert.equal(m.enforcement_mode, table.enforcement_mode);
      assert.equal(m.mode_source, "table");
      assert.equal(m.table_schema_version, 1);
      assert.deepEqual(m.tested_versions, table.host.tested_versions);
      assert.match(String(m.source_digest), /^sha256:[0-9a-f]{64}$/);
      assert.match(r.stdout, new RegExp(`^${t}: written .*/${t}/ \\(\\d+ files, mode ${table.enforcement_mode}\\)$`, "m"));
      assert.ok(!existsSync(join(base, "out", `.staging-${t}`)));
    }
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("two runs write byte-identical trees with LF line endings and no machine path (C002-NFR-301)", () => {
  const base = tmp();
  try {
    assert.equal(cli(["--out", join(base, "a")]).code, 0);
    assert.equal(cli(["--out", join(base, "b")]).code, 0);
    const a = tree(join(base, "a"));
    assert.deepEqual(tree(join(base, "b")), a);
    for (const t of TARGETS) {
      const text = readFileSync(join(base, "a", t, MANIFEST), "utf8");
      assert.ok(!text.includes("\r"), "LF only");
      assert.ok(!text.includes(base.split(sep).join("/")) && !text.includes(base), "no machine path");
    }
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("emitted files: byte order of path, LF line endings, every file hashed in the manifest, identical across runs", () => {
  const base = tmp();
  const emitter: Emitter = () => ({
    files: new Map([
      ["b/z.md", "z\r\nline\r\n"],
      [".opencode/agents/sdd-auditor.md", "a\rb\n"],
      ["B.md", "upper\n"],
      ["a.json", "{}\n"],
    ]),
    diagnostics: [],
  });
  const emitters = Object.fromEntries(TARGETS.map((t) => [t, emitter]));
  try {
    for (const out of ["one", "two"]) assert.equal(run(["--out", join(base, out)], { emitters }).code, 0);
    assert.deepEqual(tree(join(base, "two")), tree(join(base, "one")));
    for (const t of TARGETS) {
      const dir = join(base, "one", t);
      const m = JSON.parse(readFileSync(join(dir, MANIFEST), "utf8")) as { files: { path: string; sha256: string }[] };
      assert.deepEqual(m.files.map((f) => f.path), [".opencode/agents/sdd-auditor.md", "B.md", "a.json", "b/z.md"]);
      for (const f of m.files) {
        const data = readFileSync(join(dir, ...f.path.split("/")));
        assert.ok(!data.includes(0x0d), `${f.path}: LF only`);
        assert.equal(f.sha256, sha(data), f.path);
      }
      assert.equal(readFileSync(join(dir, "b", "z.md"), "utf8"), "z\nline\n");
      assert.deepEqual([...tree(dir).keys()].sort(), [...m.files.map((f) => f.path), MANIFEST].sort(), "files lists every other file");
    }
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("C002-TC-105 (C002-TS-105): an invalid table fails the run, keeps no package and leaves the fixture plugin untouched", () => {
  const base = tmp();
  try {
    const src = fxSrc(base);
    const tablePath = join(src, "targets", "copilot.json");
    const table = JSON.parse(readFileSync(tablePath, "utf8")) as Record<string, unknown>;
    writeFileSync(tablePath, JSON.stringify({ ...table, enforcement_mode: "bogus" }, null, 2) + "\n");
    const out = join(base, "out");
    plantEarlier(out);
    const before = tree(src);

    const r = cli(["--source", src, "--out", out]);
    assert.equal(r.code, 1, r.stderr);
    assert.match(r.stderr, /^ERR-GEN-004: targets\/copilot\.json: \/enforcement_mode: .+\. Fix: Correct the table entry at the pointer$/m);
    assert.match(r.stdout, /^copilot: not written \([1-9]\d* errors\)$/m);
    assert.match(r.stdout, /^opencode: not written \(0 errors\)$/m);
    assertNoSelectedOutput(out);
    assert.deepEqual(tree(src), before, "no file of the fixture's plugin folder changed, appeared or disappeared");
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("all or nothing: a planted diagnostic of one target removes both earlier packages (C002-INV-02)", () => {
  const base = tmp();
  try {
    const out = join(base, "out");
    plantEarlier(out);
    const planted: Emitter = () => ({
      files: new Map([["x.md", "x\n"]]),
      diagnostics: [diagnostic("ERR-GEN-001", 'agents/sdd-critic.md:7: tool name "KillShell" has no entry in the copilot mapping table', { file: "agents/sdd-critic.md", line: 7, construct: "KillShell", target: "copilot" })],
    });
    const r = run(["--out", out], { emitters: { copilot: planted } });
    assert.equal(r.code, 1);
    assert.equal(
      r.stderr,
      'ERR-GEN-001: agents/sdd-critic.md:7: tool name "KillShell" has no entry in the copilot mapping table. Fix: Add the entry to `plugins/architect/targets/copilot.json`, or remove the construct from the source',
    );
    assert.equal(r.stdout, "copilot: not written (1 errors)\nopencode: not written (0 errors)");
    assertNoSelectedOutput(out);
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("all or nothing: a write error during the second target's rename removes every selected package (ERR-GEN-010, exit 3)", () => {
  const base = tmp();
  try {
    const out = join(base, "out");
    plantEarlier(out);
    const second = SORTED[1]!;
    const renamed: string[] = [];
    const ops = {
      ...fsOps,
      rename: (from: string, to: string) => {
        if (to === join(out, second)) throw Object.assign(new Error("planted"), { code: "EPLANTED" });
        fsOps.rename(from, to);
        renamed.push(to);
      },
    };
    const r = run(["--out", out], { ops });
    assert.equal(r.code, 3);
    assert.deepEqual(renamed, [join(out, SORTED[0]!)], "the first target was already in place when the second failed");
    assert.match(r.stderr, new RegExp(`^ERR-GEN-010: could not write .*/out/${second}: EPLANTED; no target package was kept\\. Fix: Check disk space and permissions, then run again$`));
    for (const t of TARGETS) assert.match(r.stdout, new RegExp(`^${t}: not written \\(\\d+ errors\\)$`, "m"));
    assertNoSelectedOutput(out);
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("a write error while staging keeps no package either", () => {
  const base = tmp();
  try {
    const out = join(base, "out");
    plantEarlier(out);
    const ops = {
      ...fsOps,
      writeFile: (p: string, d: Buffer) => {
        if (p.includes(`.staging-${SORTED[1]}`)) throw Object.assign(new Error("disk full"), { code: "ENOSPC" });
        fsOps.writeFile(p, d);
      },
    };
    const r = run(["--out", out], { ops });
    assert.equal(r.code, 3);
    assert.match(r.stderr, /^ERR-GEN-010: could not write .*: ENOSPC; no target package was kept\. Fix: /);
    assertNoSelectedOutput(out);
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("--target selects one target; --mode overrides the mode and the manifest records it", () => {
  const base = tmp();
  try {
    const out = join(base, "out");
    const r = run(["--target", "opencode", "--mode", "opencode=native-permissions", "--out", out]);
    assert.equal(r.code, 0, r.stderr);
    assert.ok(!existsSync(join(out, "copilot")));
    const m = JSON.parse(readFileSync(join(out, "opencode", MANIFEST), "utf8")) as Record<string, unknown>;
    assert.equal(m.enforcement_mode, "native-permissions");
    assert.equal(m.mode_source, "override");
    assert.match(r.stdout, /^opencode: written .*\/opencode\/ \(\d+ files, mode native-permissions\)$/);
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("--json prints one document; written is false for every target of a failed run", () => {
  const base = tmp();
  try {
    const r = run(["--json", "--mode", "copilot=native-permissions", "--out", join(base, "out")]);
    assert.equal(r.code, 1);
    const doc = JSON.parse(r.stdout) as { targets: Record<string, unknown>[]; diagnostics: Record<string, unknown>[] };
    assert.deepEqual(doc.targets.map((t) => [t.target, t.written]), SORTED.map((t) => [t, false]));
    for (const t of doc.targets) assert.deepEqual(Object.keys(t), ["target", "mode", "mode_source", "written", "errors", "files", "out"]);
    assert.equal(doc.diagnostics.length, 1);
    const d = doc.diagnostics[0]!;
    assert.deepEqual(Object.keys(d), ["severity", "code", "file", "line", "target", "construct", "message", "fix"]);
    assert.equal(d.code, "ERR-GEN-009");
    assert.equal(d.message, 'mode "native-permissions" is not an enforcement mode of copilot', "the message field holds no code");
    assert.equal(d.target, "copilot");
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("an output folder inside the source plugin is refused (ERR-GEN-008) and nothing is written under it", () => {
  const base = tmp();
  try {
    const src = fxSrc(base);
    const before = tree(src);
    const r = run(["--source", src, "--out", join(src, "dist")]);
    assert.equal(r.code, 1);
    assert.match(r.stderr, /^ERR-GEN-008: output folder .*\/dist lies inside the source plugin .*\. Fix: Choose an output folder outside `plugins\/architect\/`$/);
    assert.deepEqual(tree(src), before);
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("usage errors exit 2: unknown option, unknown target, malformed --mode", () => {
  for (const args of [["--bogus"], ["--target", "cursor"], ["--mode", "opencode"], ["--target", "opencode", "--mode", "copilot=sdd-mcp-server"], ["extra"]]) {
    const r = run(args);
    assert.equal(r.code, 2, args.join(" "));
    assert.match(r.stderr, /^generate: .+\nusage: node scripts\/generate\.mjs /, args.join(" "));
    assert.equal(r.stdout, "");
  }
});

// --- C002-TC-672 (C002-T-064; C002-IF-004 Output "Source without a version", errors.md ERR-GEN-007) ---

const TS672: { manifest: string; write: ((file: string) => void) | null; parse: boolean }[] = [
  { manifest: "does not exist", write: null, parse: false },
  { manifest: 'parses and has no "version" key', write: (f) => writeFileSync(f, JSON.stringify({ name: "architect" }, null, 2) + "\n"), parse: false },
  { manifest: 'parses and gives "version" the number 3', write: (f) => writeFileSync(f, JSON.stringify({ name: "architect", version: 3 }, null, 2) + "\n"), parse: false },
  { manifest: 'parses and gives "version" the empty string ""', write: (f) => writeFileSync(f, JSON.stringify({ name: "architect", version: "" }, null, 2) + "\n"), parse: false },
  { manifest: `holds the text '{ "name": "architect", ' and does not parse`, write: (f) => writeFileSync(f, '{ "name": "architect", '), parse: true },
];

for (const row of TS672) {
  test(`C002-TS-672: a source whose .claude-plugin/plugin.json ${row.manifest} fails the run with one ERR-GEN-007 for no target`, () => {
    const base = tmp();
    try {
      const src = join(base, "src-noversion");
      cpSync(PLUGIN, src, { recursive: true });
      const manifest = join(src, ".claude-plugin", "plugin.json");
      rmSync(manifest);
      row.write?.(manifest);
      const out = join(base, "out");
      const before = tree(src);
      const r = cli(["--source", src, "--out", out, "--json"]);
      assert.equal(r.code, 1, r.stdout + r.stderr);
      const doc = JSON.parse(r.stdout) as { targets: { target: string; written: boolean }[]; diagnostics: { code: string; file: string | null; target: string | null; message: string }[] };
      assert.equal(doc.diagnostics.length, 1, JSON.stringify(doc.diagnostics));
      const d = doc.diagnostics[0]!;
      assert.deepEqual([d.code, d.file, d.target], ["ERR-GEN-007", ".claude-plugin/plugin.json", null]);
      if (row.parse) {
        assert.ok(!d.message.includes("version missing"), d.message);
        assert.match(d.message, /^\.claude-plugin\/plugin\.json: .*JSON/i, d.message);
      } else assert.equal(d.message, ".claude-plugin/plugin.json: version missing or not a non-empty string");
      assert.ok(doc.targets.length > 0);
      for (const t of doc.targets) assert.equal(t.written, false, t.target);
      assert.equal(existsSync(join(out, "opencode")), false);
      assert.equal(existsSync(join(out, "copilot")), false);
      assert.deepEqual(tree(src), before, "every source file keeps its SHA-256");
    } finally {
      rmSync(base, { recursive: true, force: true });
    }
  });
}

test("the package version comes from the source plugin.json (supports C002-TC-515, C002-TC-670, C002-TC-671): 0.3.0 in both manifests and the {{package_version}} token; the repository's plugin gives its own", () => {
  const base = tmp();
  try {
    const src = fxSrc(base);
    const manifestFile = join(src, ".claude-plugin", "plugin.json");
    const m = JSON.parse(readFileSync(manifestFile, "utf8")) as { version: string };
    const own = m.version;
    assert.notEqual(own, "0.3.0", "the fixture changes the version");
    writeFileSync(manifestFile, JSON.stringify({ ...m, version: "0.3.0" }, null, 2) + "\n");
    const out = join(base, "out");
    const r = run(["--source", src, "--out", out, "--quiet"]);
    assert.equal(r.code, 0, r.stderr);
    for (const t of SORTED) {
      const target = JSON.parse(readFileSync(join(out, t, MANIFEST), "utf8")) as { package_version: string };
      assert.equal(target.package_version, "0.3.0", t);
      const install = readFileSync(join(out, t, "INSTALL.md"), "utf8");
      assert.ok(install.includes("0.3.0"), `${t}/INSTALL.md carries the token value 0.3.0`);
      assert.ok(!install.includes(`architect-sdd@${own}`), `${t}/INSTALL.md does not carry the built-in version ${own}`);
      for (const [path] of tree(join(out, t))) assert.ok(!readFileSync(join(out, t, ...path.split("/")), "latin1").includes("{{package_version}}"), `${t}/${path}`);
    }
    // The repository's plugin gives its own version.
    const out2 = join(base, "out-repo");
    assert.equal(run(["--source", PLUGIN, "--out", out2, "--quiet"]).code, 0);
    for (const t of SORTED) assert.equal((JSON.parse(readFileSync(join(out2, t, MANIFEST), "utf8")) as { package_version: string }).package_version, own, t);
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});
