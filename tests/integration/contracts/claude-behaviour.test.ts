// C002-TC-627 — verifies C002-TS-627 (C002-AC-623.1, C002-REQ-623; C002-T-048): a Claude Code behaviour
// change is caught by the regression set. Each Examples row plants its change into a copy of the source
// (fx-src: src/, scripts/, package.json, plugins/architect/ and the guard tests with their helpers),
// rebuilds the bundled CLI of the copy, runs the named regression test against the copy with the copy's
// own `scripts/test.mjs`, and asserts that the run fails and names the expected case. A control run of
// the unplanted copy passes the same tests, so each failure comes from its plant. The repository itself
// is never changed.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { repoRoot } from "../../helpers.ts";

/** One planted change: `insert` goes right before `anchor`, which must occur exactly once in `file`. */
interface Plant {
  file: string;
  anchor: string;
  insert: string;
}

/** The copy of the build and test inputs that the named regression tests need (fx-src). */
function makeCopy(): { dir: string; cleanup: () => void } {
  const root = repoRoot();
  const dir = realpathSync.native(mkdtempSync(join(tmpdir(), "sdd-claude-behaviour-")));
  for (const d of ["src", "scripts", join("plugins", "architect"), join("tests", "guards")]) {
    cpSync(join(root, d), join(dir, d), { recursive: true, filter: (src) => !src.includes("node_modules") });
  }
  for (const f of ["package.json", join("tests", "helpers.ts"), join("tests", "no-network.mjs"), join("tests", "integration", "cli", "helpers.ts")]) {
    mkdirSync(join(dir, f, ".."), { recursive: true });
    cpSync(join(root, f), join(dir, f));
  }
  // node_modules: links to the real packages (as C001-TS-1115), removed one by one before the copy.
  const links: string[] = [];
  mkdirSync(join(dir, "node_modules"));
  for (const e of readdirSync(join(root, "node_modules"), { withFileTypes: true })) {
    if (!e.isDirectory() || e.name.startsWith(".")) continue;
    const link = join(dir, "node_modules", e.name);
    symlinkSync(join(root, "node_modules", e.name), link, process.platform === "win32" ? "junction" : "dir");
    links.push(link);
  }
  return {
    dir,
    cleanup: () => {
      for (const l of links) unlinkSync(l);
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

function plant(dir: string, p: Plant): void {
  const file = join(dir, p.file);
  const text = readFileSync(file, "utf8");
  assert.equal(text.split(p.anchor).length - 1, 1, `${p.file}: the plant anchor ${JSON.stringify(p.anchor)} occurs exactly once`);
  writeFileSync(file, text.replace(p.anchor, `${p.insert}\n  ${p.anchor}`));
}

/** Builds the copy's bundled CLI, then runs its `scripts/test.mjs` on the given test files. */
function runRegression(dir: string, tests: string[]): { status: number | null; out: string } {
  const env: Record<string, string | undefined> = { ...process.env };
  // A run started from inside a test must report its own exit code, not to the outer runner (as C001-TS-1118).
  delete env["NODE_TEST_CONTEXT"];
  delete env["SDD_TEST_OUTDIR"];
  const b = spawnSync(process.execPath, [join(dir, "scripts", "build.mjs")], { cwd: dir, env, encoding: "utf8" });
  assert.equal(b.status, 0, `build of the copy: ${b.stdout}${b.stderr}`);
  const r = spawnSync(process.execPath, [join(dir, "scripts", "test.mjs"), ...tests], { cwd: dir, env, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  return { status: r.status, out: `${r.stdout}${r.stderr}` };
}

const ROWS: { change: string; plant: Plant; tests: string[]; failing: string; names: RegExp[] }[] = [
  {
    change: 'makes the path guard allow "C:/repo/.sdd/../src/app.ts" for an Architect agent',
    plant: {
      file: "src/hooks/guard-path.ts",
      anchor: "const lexical = normalisePath(raw, { cwd });",
      insert: '  if (raw.split("\\\\").join("/").endsWith("/.sdd/../src/app.ts")) return { allow: true }; // planted (C002-TS-627 row 1)',
    },
    tests: ["tests/guards/path-corpus"],
    failing: 'the path corpus case for "C:/repo/.sdd/../src/app.ts"',
    names: [/PG-096 traversal "\{repo\}\/\.sdd\/\.\.\/src\/app\.ts": expected deny, got allow/],
  },
  {
    change: "makes the bash guard deny the Serena step of the Claude Code doctor command (the command of C002-TS-528)",
    plant: {
      file: "src/hooks/guard-bash.ts",
      anchor: "if (entry) {",
      insert: '  if (/serena-config\\s+"?\\$\\{CLAUDE_PLUGIN_DATA\\}/.test(cmd)) return deny(RULE_ALLOWLIST, tool, cmd, "planted (C002-TS-627 row 2)");',
    },
    tests: ["tests/guards/serena"],
    failing: "the test of the doctor's Serena step on Claude Code",
    names: [/not ok \d+ - C002-TS-528: the Serena step of the Claude Code doctor and init commands is allowed with CLAUDE_PLUGIN_DATA set|✖ C002-TS-528: the Serena step of the Claude Code doctor and init commands is allowed with CLAUDE_PLUGIN_DATA set/],
  },
  {
    change: 'makes the bash guard deny "node C:/p/scripts/sdd.mjs lint 002" for an Architect agent',
    plant: {
      file: "src/hooks/guard-bash.ts",
      anchor: "const dialect = dialectOf(tool);",
      insert: '  if (/^node\\s+\\S+\\/sdd\\.mjs\\s+lint(\\s|$)/.test(cmd.trim())) return deny(RULE_ALLOWLIST, tool, cmd, "planted (C002-TS-627 row 3)");',
    },
    tests: ["tests/guards/bash-corpus"],
    failing: 'the shell corpus case for "node <path>/sdd.mjs lint"',
    names: [/BG-001 scenario "node C:\/p\/scripts\/sdd\.mjs lint --json": expected allow, got GUARD-BASH-001/],
  },
];

test("control: the unplanted copy passes the named regression tests", { timeout: 600000 }, () => {
  const fx = makeCopy();
  try {
    const r = runRegression(fx.dir, [...new Set(ROWS.flatMap((row) => row.tests))]);
    assert.equal(r.status, 0, r.out.slice(-4000));
  } finally {
    fx.cleanup();
  }
});

for (const [i, row] of ROWS.entries()) {
  test(`C002-TS-627 row ${i + 1}: a change that ${row.change} fails, naming ${row.failing}`, { timeout: 600000 }, () => {
    const fx = makeCopy();
    try {
      plant(fx.dir, row.plant);
      const r = runRegression(fx.dir, row.tests);
      assert.notEqual(r.status, 0, `the regression run passed with the planted change:\n${r.out.slice(-4000)}`);
      for (const name of row.names) assert.match(r.out, name, r.out.slice(-4000));
    } finally {
      fx.cleanup();
    }
  });
}
