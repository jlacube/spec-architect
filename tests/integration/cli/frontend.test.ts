// CLI front-end per C001-IF-01: dispatch, usage errors, workspace discovery, error format and exit
// codes, SDD_DEBUG traces (C001-NFR-702) and the error catalogue mirror of errors.md.
import { test } from "node:test";
import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { splitCells } from "../../../src/model/blocks.ts";
import { splitFrontmatter } from "../../../src/model/frontmatter.ts";
import { CATALOGUE, formatError, CliError } from "../../../src/cli/errors.ts";
import { COMMANDS } from "../../../src/cli/commands.ts";
import { repoRoot } from "../../helpers.ts";
import { makeWorkspace, minimalChange, runBundled, runInProcess } from "./helpers.ts";

const ERRORS_MD = join(repoRoot(), ".sdd", "001-architect-agent-suite", "10-spec", "50-interfaces", "errors.md");
const SDD_CLI_MD = join(repoRoot(), ".sdd", "001-architect-agent-suite", "10-spec", "50-interfaces", "sdd-cli.md");

test("the catalogue mirrors every ERR-CLI and WARN-CLI row of errors.md", () => {
  const rows = readFileSync(ERRORS_MD, "utf8").split("\n").filter((l) => /^\| (ERR|WARN)-CLI-\d{3} \|/.test(l)).map(splitCells);
  assert.ok(rows.length >= 18);
  const expected = rows.map(([code, condition, message, fix]) => ({ code, condition, message, fix }));
  const actual = Object.values(CATALOGUE).map(({ code, condition, message, fix }) => ({ code, condition, message, fix }));
  assert.deepEqual(actual, expected);
  for (const e of Object.values(CATALOGUE)) {
    const expectedExit = e.code.startsWith("WARN") ? 0 : /\(exit 3\)/.test(e.condition) ? 3 : 2;
    assert.equal(e.exitCode, expectedExit, e.code);
  }
});

test("errors render as `ERR-CLI-<nnn>: <message>. Fix: <action>` with placeholders filled", () => {
  assert.equal(formatError(new CliError("ERR-CLI-002", { NNN: "007" })), "ERR-CLI-002: Change `007` not found. Fix: Check `sdd status`");
  assert.equal(
    formatError(new CliError("ERR-CLI-004", { TYPE: "FOO", list: "GOAL, SC" })),
    "ERR-CLI-004: Unknown ID type `FOO`; valid: GOAL, SC. Fix: Use a type from C001-IF-04 §2",
  );
  assert.equal(
    formatError(new CliError("ERR-CLI-014", { NNN: "003", "stopped|archived": "stopped" })),
    "ERR-CLI-014: Change `003` is `stopped`. Fix: Create a new change",
  );
});

test("every command of C001-IF-01 is dispatched", () => {
  const spec = readFileSync(SDD_CLI_MD, "utf8").split("\n").filter((l) => /^\| `[a-z-]+( [a-z-]+)?` \|/.test(l));
  const names = spec.map((l) => /^\| `([^`]+)`/.exec(l)![1]);
  assert.deepEqual(COMMANDS.map((c) => c.name).sort(), [...names].sort());
});

test("outside a workspace, commands other than init and version fail with ERR-CLI-001", () => {
  const ws = makeWorkspace({ "empty/readme.txt": "x" });
  try {
    const r = runBundled(["lint"], { cwd: join(ws.root, "empty") });
    assert.equal(r.code, 2);
    assert.equal(r.stderr, "ERR-CLI-001: Not an SDD workspace. Fix: Run `sdd init` or `/architect:init`\n");
    assert.equal(runBundled(["version"], { cwd: join(ws.root, "empty") }).code, 0);
  } finally {
    ws.cleanup();
  }
});

test("the workspace is found by walking up from the current directory, or set with --cwd", () => {
  const ws = makeWorkspace({ ...minimalChange(), "src/deep/x.txt": "x" });
  try {
    assert.equal(runBundled(["lint"], { cwd: join(ws.root, "src", "deep") }).code, 0);
    assert.equal(runBundled(["lint", "--cwd", ws.root], { cwd: repoRoot() }).code, 0);
  } finally {
    ws.cleanup();
  }
});

test("usage errors exit 2: unknown command, missing or extra arguments, bad option values", () => {
  const ws = makeWorkspace(minimalChange());
  try {
    const cases: [string[], RegExp][] = [
      [["frobnicate"], /Usage error: `unknown command frobnicate`/],
      [[], /Usage error: `no command given`/],
      [["lint", "4"], /`<NNN> must have three digits: 4`/],
      [["lint", "--phase", "30-impl"], /--phase must be one of 00-ideation, 10-spec, 20-plan/],
      [["lint", "--quick"], /--quick requires --file/],
      [["lint", "004", "005"], /`unexpected argument 005`/],
      [["gate", "show"], /`missing argument <NNN>`/],
      [["gate", "launch", "004"], /`unknown command gate launch`/],
    ];
    for (const [args, re] of cases) {
      const r = runInProcess(args, { cwd: ws.root });
      assert.equal(r.code, 2, args.join(" "));
      assert.match(r.stderr, re, args.join(" "));
      assert.match(r.stderr, /^ERR-CLI-003: .*\. Fix: See `sdd .*--help`\n$/);
    }
    assert.match(runInProcess(["lint", "007"], { cwd: ws.root }).stderr, /^ERR-CLI-002: Change `007` not found/);
  } finally {
    ws.cleanup();
  }
});

test("commands not yet implemented are refused with ERR-CLI-003 and exit 2", () => {
  const ws = makeWorkspace(minimalChange());
  try {
    const r = runInProcess(["extract-features", "004"], { cwd: ws.root });
    assert.equal(r.code, 2);
    assert.equal(r.stderr, "ERR-CLI-003: Usage error: `sdd extract-features is not implemented yet`. Fix: See `sdd extract-features --help`\n");
  } finally {
    ws.cleanup();
  }
});

test("--help prints usage on standard output and exits 0", () => {
  const top = runInProcess(["--help"], { cwd: repoRoot() });
  assert.equal(top.code, 0);
  assert.match(top.stdout, /^Usage: sdd <command>/);
  assert.match(top.stdout, /gate approve/);
  const lint = runInProcess(["lint", "--help"], { cwd: repoRoot() });
  assert.equal(lint.code, 0);
  assert.match(lint.stdout, /^Usage: sdd lint \[<NNN>\] \[--phase <phase>\] \[--json\] \[--quick --file <path>\]/);
});

test("an unexpected exception is reported as ERR-CLI-016 with exit 3", () => {
  const ws = makeWorkspace(minimalChange());
  try {
    const r = runInProcess(["lint"], {
      cwd: ws.root,
      rules: [{ code: "LINT-TXT-001", severity: "error", fix: "x", scope: "change", check: () => { throw new Error("rule exploded"); } }],
    });
    assert.equal(r.code, 3);
    assert.equal(r.stderr, "ERR-CLI-016: Internal error: `rule exploded`. Fix: Re-run with `SDD_DEBUG=1` and report\n");
  } finally {
    ws.cleanup();
  }
});

test("SDD_DEBUG=1 writes timing and decision traces to standard error for every command (C001-NFR-702)", () => {
  const ws = makeWorkspace(minimalChange());
  try {
    for (const c of COMMANDS) {
      const args = [...c.name.split(" "), ...c.sampleArgs];
      const r = runInProcess(args, { cwd: ws.root, env: { SDD_DEBUG: "1" } });
      const traces = r.stderr.split("\n").filter((l) => l.startsWith("[sdd +"));
      assert.ok(traces.some((l) => l.includes(`command=${c.name.replace(" ", ".")}`)), `${c.name}: ${r.stderr}`);
      assert.ok(traces.some((l) => /exit=\d/.test(l)), c.name);
      const quiet = runInProcess(args, { cwd: ws.root });
      assert.equal(quiet.stderr.includes("[sdd +"), false, c.name);
    }
  } finally {
    ws.cleanup();
  }
});

// M-2 exit criterion (C001-T-028): `sdd lint` exits 0 on this repository, after status --write.
test("lint on a copy of this repository's workspace: every change whose current phase is approved has no error or warning that its gates did not waive", () => {
  const root = realpathSync.native(mkdtempSync(join(tmpdir(), "sdd-repo-")));
  try {
    cpSync(join(repoRoot(), ".sdd"), join(root, ".sdd"), { recursive: true });
    assert.equal(runBundled(["status", "--write"], { cwd: root }).code, 0);
    // A change in a draft phase may have open findings (work in progress); approved phases may not.
    const reg = JSON.parse(readFileSync(join(root, ".sdd", "registry.json"), "utf8")) as { changes: { id: string; phase: string; status: string; phases: Record<string, { status: string }> }[] };
    const approved = reg.changes.filter((c) => c.status !== "archived" && c.phases[c.phase]?.status === "approved").map((c) => c.id.slice(4));
    assert.ok(approved.includes("001"), "CHG-001 is approved");
    for (const nnn of approved) {
      // Findings waived at a gate (`waivers` of change.md, by code or by ID) are accepted (C002-T-053);
      // lint still reports them, so its exit code is 1 when a waived error remains.
      const folder = readdirSync(join(root, ".sdd")).find((n) => n.startsWith(`${nnn}-`))!;
      const fm = splitFrontmatter(readFileSync(join(root, ".sdd", folder, "change.md"), "utf8")).data ?? {};
      const waived = new Set(((fm["waivers"] ?? []) as { item: string }[]).map((w) => String(w.item)));
      const r = runBundled(["lint", nnn, "--json"], { cwd: root });
      assert.ok(r.code === 0 || r.code === 1, r.stdout);
      const findings = (JSON.parse(r.stdout) as { findings: { code: string; severity: string; ids?: string[] }[] }).findings;
      const open = findings.filter((f) => f.severity !== "info" && !waived.has(f.code) && !(f.ids ?? []).some((id) => waived.has(id)));
      assert.deepEqual(open, [], `CHG-${nnn}`);
      if (open.length === 0 && findings.every((f) => f.severity === "info")) assert.equal(r.code, 0, r.stdout);
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
