// C002-T-040: the expectation rules of the corpus replay suite in the order of C002-IF-009 §2.1 on
// synthetic cases, the caller of §2.2, the capability rule of C002-REQ-633 (present: replayed with its
// own input; absent: `error`), and `npm test` leaving tests/replay/ out (CR-17).
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { BashCase, CorpusCase } from "../../guards/fixture.ts";
import { repoRoot } from "../../helpers.ts";
import { createStubAdapter, joinedPath, type ReplayInput } from "../../replay/adapter.ts";
import { callerOf, expectationOf, type Mechanism, MECHANISMS } from "../../replay/expect.ts";
import { completenessProblems, validateReport } from "../../replay/report.ts";
import { runReplay } from "../../replay/suite.ts";

const pc = (o: Partial<CorpusCase>): CorpusCase => ({ id: "PG-X", category: "outside", tool: "Write", agent: "architect:sdd-spec-writer", path: "{repo}/src/a.ts", expect: "deny", ...o });
const OTHERS: Mechanism[] = ["sdd-mcp-server", "copilot-hooks"];

test("rule 1: an identity case is not applicable to sdd-mcp-server and copilot-hooks, replayed on OpenCode (C002-REQ-626)", () => {
  // Rule 1 comes before rule 2: an identity case without a cwd is still not applicable there.
  for (const c of [pc({ category: "identity", agent: null, expect: "allow" }), pc({ category: "identity", cwd: null })])
    for (const m of OTHERS) assert.deepEqual(expectationOf(c, m, "win32"), { applicable: false, rule: "C002-REQ-626" });
  assert.deepEqual(expectationOf(pc({ category: "identity", agent: null, expect: "allow" }), "opencode-permissions", "win32"), { applicable: true, expected: "allow", source: "corpus", malformed: false });
});

test("rule 2: no cwd, an empty cwd or no tool name is a malformed call expecting deny on every mechanism (C002-REQ-630)", () => {
  for (const c of [pc({ cwd: null, expect: "allow" }), pc({ cwd: "" }), pc({ tool: null, expect: "allow" }), pc({ category: "memory", cwd: null, expect: "allow" })])
    for (const m of MECHANISMS) assert.deepEqual(expectationOf(c, m, "win32"), { applicable: true, expected: "deny", source: "C002-REQ-630", malformed: true });
  // Rule 2 comes before rule 3: an unknown architect:sdd-* caller without a tool name on OpenCode.
  assert.equal((expectationOf(pc({ category: "identity", agent: "architect:sdd-unknown", tool: null }), "opencode-permissions", "win32") as { source: string }).source, "C002-REQ-630");
  // A set cwd other than {repo} is not a C002-REQ-630 case (C002-TS-644).
  assert.deepEqual(expectationOf(pc({ category: "cwd", cwd: "{repo}/src", path: ".sdd/a.md" }), "sdd-mcp-server", "win32"), { applicable: true, expected: "deny", source: "corpus", malformed: false });
});

test("rule 3: an unknown architect:sdd-* identity caller expects allow on OpenCode (C002-REQ-632)", () => {
  for (const agent of ["architect:sdd-unknown", "architect:sdd-"])
    assert.deepEqual(expectationOf(pc({ category: "identity", agent }), "opencode-permissions", "win32"), { applicable: true, expected: "allow", source: "C002-REQ-632", malformed: false });
  // One of the ten keeps its corpus expectation (BG-265), and a non-identity case is not rule 3.
  assert.equal((expectationOf(pc({ category: "identity", agent: "architect:sdd-conductor" }), "opencode-permissions", "win32") as { source: string }).source, "corpus");
  assert.equal((expectationOf(pc({ agent: "architect:sdd-unknown" }), "opencode-permissions", "win32") as { source: string }).source, "corpus");
});

test("rule 4: a memory case expects deny on every mechanism (C002-REQ-625); rule 5 takes the corpus value per platform", () => {
  for (const m of MECHANISMS) assert.deepEqual(expectationOf(pc({ category: "memory", expect: "allow" }), m, "win32"), { applicable: true, expected: "deny", source: "C002-REQ-625", malformed: false });
  const perPlatform = pc({ expect: { win32: "deny", posix: "allow" } });
  assert.equal((expectationOf(perPlatform, "sdd-mcp-server", "win32") as { expected: string }).expected, "deny");
  assert.equal((expectationOf(perPlatform, "sdd-mcp-server", "posix") as { expected: string }).expected, "allow");
  assert.deepEqual(expectationOf(pc({ stdin: "not json" }), "copilot-hooks", "win32"), { applicable: true, expected: "deny", source: "corpus", malformed: true });
});

// --- The platform rule of C002-IF-009 §2.1 (defect D-018 item 2, critic CR-61, CR-66; C002-T-065) ---
test("platform rule: a last-row case whose platforms list leaves out the host platform is not applicable, rule platforms, on every mechanism", () => {
  for (const m of MECHANISMS) {
    assert.deepEqual(expectationOf(pc({ platforms: ["win32"] }), m, "posix"), { applicable: false, rule: "platforms" });
    assert.deepEqual(expectationOf(pc({ platforms: ["posix"] }), m, "win32"), { applicable: false, rule: "platforms" });
    assert.equal(expectationOf(pc({ platforms: ["win32", "posix"] }), m, "win32").applicable, true);
    assert.equal(expectationOf(pc({ platforms: ["win32"] }), m, "win32").applicable, true);
  }
});

test("platform rule before C002-REQ-633: a [\"posix\"] case with requires on win32 is not applicable (platforms); a [\"win32\"] one is replayed", () => {
  const sym = (platforms: string[]) => pc({ category: "symlink", requires: "file-symlink", platforms });
  for (const m of MECHANISMS) {
    assert.deepEqual(expectationOf(sym(["posix"]), m, "win32"), { applicable: false, rule: "platforms" });
    assert.deepEqual(expectationOf(sym(["win32"]), m, "win32"), { applicable: true, expected: "deny", source: "corpus", malformed: false });
  }
});

test("platform rule: a platforms value outside win32/posix, or an empty list, excludes nothing (fail-closed)", () => {
  for (const platforms of [["linux"], [], ["win32", "linux"], "posix" as unknown as string[]])
    for (const m of MECHANISMS) assert.equal(expectationOf(pc({ platforms }), m, "win32").applicable, true, JSON.stringify(platforms));
});

test("platform rule: the rows above the last keep their expectation on any host (a memory case limited to posix stays deny)", () => {
  for (const m of MECHANISMS) assert.deepEqual(expectationOf(pc({ category: "memory", expect: "allow", platforms: ["posix"] }), m, "win32"), { applicable: true, expected: "deny", source: "C002-REQ-625", malformed: false });
  assert.deepEqual(expectationOf(pc({ category: "identity", platforms: ["posix"] }), "sdd-mcp-server", "win32"), { applicable: false, rule: "C002-REQ-626" });
});

const bc = (o: Partial<BashCase>): BashCase => ({ id: "BG-X", category: "tool", tool: "Bash", agent: "architect:sdd-planner", command: "git status", expect: "allow", ...o });
const realShell = (JSON.parse(readFileSync(join(repoRoot(), "tests", "guards", "bash-corpus.json"), "utf8")) as { cases: BashCase[] }).cases;
const realPath = (JSON.parse(readFileSync(join(repoRoot(), "tests", "guards", "path-corpus.json"), "utf8")) as { cases: CorpusCase[] }).cases;
const idsWith = <T extends CorpusCase | BashCase>(cases: T[], corpus: "path" | "shell", m: Mechanism, source: string) =>
  cases.filter((c) => (expectationOf(c, m, "win32", corpus) as { source?: string }).source === source).map((c) => c.id);

for (const m of MECHANISMS)
  test(`rule 5 (${m}): a shell-corpus write-tool case expects deny (C001-REQ-1103); BG-268 is one, the read-tool cases BG-269 and BG-270 are not`, () => {
    for (const tool of ["Write", "Edit", "MultiEdit", "NotebookEdit"])
      assert.deepEqual(expectationOf(bc({ tool, command: "rm -rf src" }), m, "win32", "shell"), { applicable: true, expected: "deny", source: "C001-REQ-1103", malformed: false });
    assert.deepEqual(idsWith(realShell, "shell", m, "C001-REQ-1103"), ["BG-268"]);
    for (const id of ["BG-269", "BG-270"]) assert.equal((expectationOf(realShell.find((c) => c.id === id)!, m, "win32", "shell") as { source: string }).source, "corpus");
    // A path-corpus write is not this row.
    assert.equal((expectationOf(pc({ tool: "Write" }), m, "win32", "path") as { source: string }).source, "corpus");
  });

const SERENA_IDS = ["BG-374", "BG-379", "BG-384", "BG-389", "BG-402", "BG-403", "BG-404", "BG-405", "BG-406", "BG-407"];
for (const m of MECHANISMS)
  test(`rule 6 (${m}): the \${CLAUDE_PLUGIN_DATA} Serena cases expect deny on sdd-mcp-server only (C002-REQ-517); BG-408 and BG-409 are no such case`, () => {
    const ids = idsWith(realShell, "shell", m, "C002-REQ-517");
    if (m === "sdd-mcp-server") {
      assert.deepEqual(ids, SERENA_IDS);
      for (const id of SERENA_IDS) assert.equal((expectationOf(realShell.find((c) => c.id === id)!, m, "win32", "shell") as { expected: string }).expected, "deny");
    } else {
      assert.deepEqual(ids, []);
      for (const id of SERENA_IDS) {
        const c = realShell.find((x) => x.id === id)!;
        assert.deepEqual(expectationOf(c, m, "win32", "shell"), { applicable: true, expected: c.expect, source: "corpus", malformed: false });
      }
    }
    for (const id of ["BG-408", "BG-409", "BG-034"]) assert.equal((expectationOf(realShell.find((c) => c.id === id)!, m, "win32", "shell") as { source: string }).source, "corpus");
  });

for (const m of MECHANISMS)
  test(`rule 7 (${m}): the linked-cwd cases PG-135 and PG-136 expect deny on sdd-mcp-server only (C002-REQ-401)`, () => {
    const ids = idsWith(realPath, "path", m, "C002-REQ-401");
    assert.deepEqual(ids, m === "sdd-mcp-server" ? ["PG-135", "PG-136"] : []);
    const pg135 = realPath.find((c) => c.id === "PG-135")!;
    assert.deepEqual(expectationOf(pg135, m, "win32", "path"), m === "sdd-mcp-server"
      ? { applicable: true, expected: "deny", source: "C002-REQ-401", malformed: false }
      : { applicable: true, expected: "allow", source: "corpus", malformed: false });
    // Another cwd case (PG-137, {repo2}) is not this row.
    assert.equal((expectationOf(realPath.find((c) => c.id === "PG-137")!, m, "win32", "path") as { source: string }).source, "corpus");
  });

test("a case requiring a host capability is never a malformed call nor not applicable (C002-REQ-633)", () => {
  for (const m of MECHANISMS) assert.deepEqual(expectationOf(pc({ category: "symlink", requires: "file-symlink", cwd: null }), m, "win32"), { applicable: true, expected: "deny", source: "corpus", malformed: false });
});

test("the caller of §2.2: own generated agent, conductor for memory and other callers, adopter agent for OpenCode identity cases", () => {
  assert.equal(callerOf(pc({}), "sdd-mcp-server"), "sdd-spec-writer");
  assert.equal(callerOf(pc({ category: "memory", agent: "general-purpose" }), "copilot-hooks"), "sdd-conductor");
  assert.equal(callerOf(pc({ category: "identity", agent: "architect:sdd-unknown" }), "opencode-permissions"), "adopter-agent");
  assert.equal(callerOf(pc({ category: "identity", agent: null }), "opencode-permissions"), "adopter-agent");
  assert.equal(callerOf(pc({ category: "identity", agent: "architect:sdd-auditor" }), "opencode-permissions"), "sdd-auditor");
});

test("the path is joined to the case's cwd without normalisation; an absolute path is kept (§2.2)", () => {
  const input = (path: string, cwd: string | null) => ({ path, cwd }) as ReplayInput;
  assert.equal(joinedPath(input(".sdd/a.md", "C:/r/src")), "C:/r/src/.sdd/a.md");
  assert.equal(joinedPath(input("../.sdd/a.md", "C:/r/src")), "C:/r/src/../.sdd/a.md");
  assert.equal(joinedPath(input("C:/r/.sdd/a.md", "C:/r/src")), "C:/r/.sdd/a.md");
  assert.equal(joinedPath(input("a.md", null)), "a.md");
});

/** A synthetic pair of corpora with one case requiring file-symlink. */
function synthetic(): { dir: string; path: string; shell: string } {
  const dir = mkdtempSync(join(tmpdir(), "sdd-replay-unit-"));
  const pathCases: CorpusCase[] = [
    pc({ id: "PG-1", category: "inside", path: "{repo}/.sdd/a.md", expect: "allow" }),
    pc({ id: "PG-2", category: "symlink", path: "{repo}/.sdd/file-link.md", requires: "file-symlink" }),
    pc({ id: "PG-3", category: "identity", agent: null, expect: "allow" }),
    pc({ id: "PG-4", category: "memory", path: "{repo}/.claude/agent-memory/architect-sdd-spec-writer/M.md", expect: "allow" }),
  ];
  const shellCases: BashCase[] = [{ id: "BG-1", category: "git", tool: "Bash", agent: "architect:sdd-planner", command: "git status", expect: "allow" }];
  const fixture = { files: { "src/app.ts": "x\n", ".sdd/x.md": "x\n" }, dirs: [], junctions: {}, hardlinks: {}, fileSymlinks: { ".sdd/file-link.md": "src/app.ts" } };
  writeFileSync(join(dir, "path.json"), JSON.stringify({ fixture, cases: pathCases }));
  writeFileSync(join(dir, "shell.json"), JSON.stringify({ cases: shellCases }));
  return { dir, path: join(dir, "path.json"), shell: join(dir, "shell.json") };
}

test("capability present: the case is replayed with its own input; absent: error naming the capability, never fed", async (t) => {
  const s = synthetic();
  try {
    const present = createStubAdapter();
    const withCap = await runReplay(present, { pathCorpus: s.path, shellCorpus: s.shell });
    assert.deepEqual(withCap.problems, []);
    const pg2 = withCap.report.cases.find((c) => c.id === "PG-2")!;
    if (!withCap.report.replay_host.capabilities.includes("file-symlink")) t.diagnostic("this host cannot create file symbolic links; the present branch shows the error row");
    else {
      assert.deepEqual([pg2.expected, pg2.expected_source, pg2.actual, pg2.fed_as.malformed], ["deny", "corpus", "deny", false]);
      assert.ok(present.calls.some((c) => c.id === "PG-2"));
      assert.equal(withCap.report.differing, 0);
    }
    assert.deepEqual(withCap.report.not_applicable.map((n) => n.id), ["PG-3"]);

    const absent = createStubAdapter();
    const without = await runReplay(absent, { pathCorpus: s.path, shellCorpus: s.shell, denyCapabilities: ["file-symlink"] });
    assert.deepEqual(without.problems, []);
    const e = without.report.cases.find((c) => c.id === "PG-2")!;
    assert.equal(e.actual, "error");
    assert.match(e.detail ?? "", /file-symlink/);
    assert.ok(!absent.calls.some((c) => c.id === "PG-2"), "the case is not fed");
    assert.deepEqual(without.report.replay_host.capabilities, []);
    assert.equal(without.report.differing, 1, "an error counts as differing (C002-REQ-606)");
  } finally {
    rmSync(s.dir, { recursive: true, force: true });
  }
});

test("the report validates against the schema; completeness and counts are checked", async () => {
  const s = synthetic();
  try {
    const { report } = await runReplay(createStubAdapter({ emulate: "opencode-permissions" }), { pathCorpus: s.path, shellCorpus: s.shell });
    assert.deepEqual(validateReport(report), []);
    assert.deepEqual(completenessProblems(report, { path: ["PG-1", "PG-2", "PG-3", "PG-4"], shell: ["BG-1"] }), []);
    assert.deepEqual(completenessProblems(report, { path: ["PG-1", "PG-2", "PG-3", "PG-4", "PG-5"], shell: ["BG-1"] }), ["PG-5: listed 0 times"]);
    // The schema refuses what §2.1 forbids: a not-applicable entry on OpenCode, C002-REQ-630 without malformed.
    assert.notDeepEqual(validateReport({ ...report, not_applicable: [{ id: "PG-3", corpus: "path", category: "identity", rule: "C002-REQ-626" }] }), []);
    const bad = { ...report, cases: report.cases.map((c) => (c.id === "PG-1" ? { ...c, expected_source: "C002-REQ-630" } : c)) };
    assert.notDeepEqual(validateReport(bad), []);
  } finally {
    rmSync(s.dir, { recursive: true, force: true });
  }
});

test("npm test leaves tests/replay/ out (CR-17)", () => {
  const r = spawnSync(process.execPath, [join(repoRoot(), "scripts", "test.mjs"), "tests/replay/"], { cwd: repoRoot(), encoding: "utf8", env: { ...process.env, NODE_TEST_CONTEXT: "" } });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /no test files match: tests\/replay\//);
});
