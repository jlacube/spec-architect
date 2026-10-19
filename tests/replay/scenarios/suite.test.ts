// Corpus replay suite scenarios (C002-T-040) against the stub adapter, which decides with the guard
// cores as a generated mechanism would and reports for the mechanism it emulates, on the corpora of
// tests/guards/ and planted corpus fixtures. Run by `npm run replay -- suite`, never by `npm test`.
// The rows that need a real mechanism (the packed sdd MCP server, the Copilot hook command, OpenCode
// through C002-ADR-005) run with the adapters of C002-T-041 and C002-T-042: C002-TS-609 and the
// mechanism rows of C002-TS-628, C002-TS-638, C002-TS-643 and C002-TS-644 below also run against the
// real `sdd-mcp-server` (the server of dist/architect-sdd-<version>.tgz, `npm run package`) and
// `copilot-hooks` adapters; C002-TC-608 with C002-T-049 (release runs), C002-TC-637 (release-check
// refusal) with C002-T-047.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import type { TestContext } from "node:test";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { BashCase, Corpus } from "../../guards/fixture.ts";
import { createStubAdapter, joinedPath, type ReplayAdapter, type StubAdapter } from "../adapter.ts";
import { createCopilotHooksAdapter } from "../adapters/copilot-hooks.ts";
import { createMcpServerAdapter } from "../adapters/sdd-mcp-server.ts";
import { repoRoot } from "../../helpers.ts";
import { type Mechanism, MECHANISMS } from "../expect.ts";
import { main } from "../main.ts";
import { type ReplayReport, type ReportCase, sourceVersion } from "../report.ts";
import { DEFAULT_PATH_CORPUS, DEFAULT_SHELL_CORPUS, loadCorpora, type ReplayResult, runReplay } from "../suite.ts";

const MEMORY_FILE = ".claude/agent-memory/architect-sdd-cartographer/MEMORY.md";

interface Run {
  result: ReplayResult;
  stub: StubAdapter;
  repo: string;
  memoryFileAfter: boolean;
}
const runs = new Map<Mechanism, Promise<Run>>();

/** One stub replay of the corpora per emulated mechanism, shared by the scenarios. */
function replayed(mechanism: Mechanism): Promise<Run> {
  let r = runs.get(mechanism);
  if (!r) {
    r = (async () => {
      const stub = createStubAdapter({ emulate: mechanism, target: mechanism === "copilot-hooks" ? "copilot" : "opencode" });
      let repo = "";
      let memoryFileAfter = true;
      const result = await runReplay(stub, {
        afterRun: (fx) => {
          repo = fx.repo;
          memoryFileAfter = existsSync(`${fx.repo}/${MEMORY_FILE}`);
        },
      });
      return { result, stub, repo, memoryFileAfter };
    })();
    runs.set(mechanism, r);
  }
  return r;
}

const entry = (report: ReplayReport, id: string): ReportCase => {
  const e = report.cases.find((c) => c.id === id);
  assert.ok(e, `${id} is a replayed case`);
  return e;
};
const notApplicable = (report: ReplayReport, id: string) => report.not_applicable.some((n) => n.id === id);
const corpusExpect = (id: string) => {
  const { path, shell } = loadCorpora();
  return [...path.corpus.cases, ...shell.cases].find((c) => c.id === id)!.expect;
};

/** Runs `npm run replay -- --mechanism stub …` in process on planted corpora; returns the exit code and report. */
async function runCli(args: string[], plant?: { path?: (c: Corpus) => void; shell?: (cases: BashCase[]) => BashCase[] | void }, mechanism = "stub"): Promise<{ code: number; report: ReplayReport; log: string[] }> {
  const dir = mkdtempSync(join(tmpdir(), "sdd-replay-cli-"));
  try {
    const corpusArgs: string[] = [];
    if (plant?.path) {
      const c = JSON.parse(readFileSync(DEFAULT_PATH_CORPUS, "utf8")) as Corpus;
      plant.path(c);
      writeFileSync(join(dir, "path-corpus.json"), JSON.stringify(c));
      corpusArgs.push("--path-corpus", join(dir, "path-corpus.json"));
    }
    if (plant?.shell) {
      const c = JSON.parse(readFileSync(DEFAULT_SHELL_CORPUS, "utf8")) as { cases: BashCase[] };
      const kept = plant.shell(c.cases);
      if (kept) c.cases = kept;
      writeFileSync(join(dir, "bash-corpus.json"), JSON.stringify(c));
      corpusArgs.push("--shell-corpus", join(dir, "bash-corpus.json"));
    }
    const log: string[] = [];
    const code = await main(["--mechanism", mechanism, ...args, ...corpusArgs, "--out", dir], (l) => log.push(l));
    const report = JSON.parse(readFileSync(join(dir, "replay-sdd-mcp-server.json"), "utf8")) as ReplayReport;
    return { code, report, log };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** The planted rows of the revised C002-TS-609 that expect deny and are allowed. */
const WRITE_SHELL_LABEL = 'a shell case of the tool "Write" whose command text is ".sdd/002-x/notes.md", which the write-tool row of C002-IF-009 §2.1 expects "deny"';
const TRAILING_LABEL = 'a path case writing the folder path "{repo}/.sdd/004-x/" with a trailing separator, planted as "deny", which the guard allows (ERR-MCP-003 on the server)';
const PLANTED_DECISIONS: Record<string, [string, string]> = { "BG-900": ["deny", "allow"], "PG-901": ["deny", "allow"] };
const writeShellCase = (cases: BashCase[]): BashCase => ({ ...cases.find((x) => x.id === "BG-268")!, id: "BG-900", command: ".sdd/002-x/notes.md", expect: "allow" });
const trailingCase = (c: Corpus): Corpus["cases"][number] => ({ ...c.cases.find((x) => x.id === "PG-048")!, id: "PG-901", expect: "deny" });

for (const [label, plant, id] of [
  [
    'the shell case "sdd status > out.txt"',
    {
      shell: (cases: BashCase[]) => {
        const c = cases.find((x) => x.command === "sdd status > out.txt")!;
        c.expect = "allow";
        delete c.rule;
      },
    },
    "", // found below by command
  ],
  [
    'a path case writing "{repo}/src/app.ts" through the tool "NotebookEdit"',
    {
      path: (c: Corpus) => {
        c.cases.push({ id: "PG-900", category: "outside", tool: "NotebookEdit", agent: "architect:sdd-spec-writer", field: "notebook_path", path: "{repo}/src/app.ts", expect: "allow" });
      },
    },
    "PG-900",
  ],
  [WRITE_SHELL_LABEL, { shell: (cases: BashCase[]) => [...cases, writeShellCase(cases)] }, "BG-900"],
  [
    TRAILING_LABEL,
    {
      path: (c: Corpus) => {
        c.cases.push(trailingCase(c));
      },
    },
    "PG-901",
  ],
] as const) {
  test(`C002-TS-609 — a differing decision is reported: ${label}`, async () => {
    const { code, report, log } = await runCli([], plant);
    const caseId = id || loadCorpora().shell.cases.find((x) => x.command === "sdd status > out.txt")!.id;
    const e = entry(report, caseId);
    const [expected, actual] = PLANTED_DECISIONS[caseId] ?? ["allow", "deny"];
    assert.equal(report.mechanism, "sdd-mcp-server");
    assert.deepEqual([e.expected, e.actual], [expected, actual]);
    if (caseId === "BG-900") assert.equal(e.expected_source, "C001-REQ-1103");
    assert.equal(report.differing, 1);
    assert.ok(log.some((l) => l.includes(`differing ${caseId}`) && l.includes(`expected ${expected}`) && l.includes(`got ${actual}`)), log.join("\n"));
    assert.notEqual(code, 0, "the suite exits non-zero");
  });
}

for (const m of MECHANISMS) {
  test(`C002-TS-628 — memory case expectation per mechanism: ${m} (stub)`, async () => {
    const { result } = await replayed(m);
    const e = entry(result.report, "PG-205");
    assert.deepEqual([e.expected, e.expected_source, e.actual], ["deny", "C002-REQ-625", "deny"]);
    assert.equal(corpusExpect("PG-205"), "allow", "the corpus still records allow");
  });
}

test("C002-TS-629 — a memory write allowed on a generated target is a difference", async () => {
  const { code, report } = await runCli(["--seed", "allow-memory"]);
  const e = entry(report, "PG-205");
  assert.deepEqual([e.expected, e.actual], ["deny", "allow"]);
  assert.ok(report.differing >= 1);
  assert.notEqual(code, 0, "the suite exits non-zero");
});

for (const m of MECHANISMS) {
  test(`C002-TS-638 — memory case of a non-Architect caller replayed as an Architect write: ${m} (stub)`, async () => {
    const { result, stub, memoryFileAfter } = await replayed(m);
    const e = entry(result.report, "PG-224");
    assert.deepEqual([e.expected, e.expected_source, e.actual], ["deny", "C002-REQ-625", "deny"]);
    assert.ok(!notApplicable(result.report, "PG-224"));
    assert.equal(e.fed_as.caller, "sdd-conductor");
    assert.equal(stub.calls.find((c) => c.id === "PG-224")!.caller, "sdd-conductor");
    if (m === "sdd-mcp-server") assert.equal(e.fed_as.tool, "write_file");
    assert.equal(memoryFileAfter, false, `${MEMORY_FILE} does not exist in the replay fixture afterwards`);
  });
}

for (const m of MECHANISMS) {
  test(`C002-TS-631 — completeness of the replay report: ${m} (stub)`, async () => {
    const { result } = await replayed(m);
    const { report } = result;
    assert.deepEqual(result.problems, [], "schema-valid, every case once, counts consistent");
    assert.deepEqual(result.omitted, []);
    const { path, shell } = loadCorpora();
    const listed = [...report.cases, ...report.not_applicable].map((c) => c.id).sort();
    assert.deepEqual(listed, [...path.corpus.cases, ...shell.cases].map((c) => c.id).sort(), "every case ID exactly once");
    const identity = [...path.corpus.cases, ...shell.cases].filter((c) => c.category === "identity").map((c) => c.id).sort();
    assert.deepEqual(report.not_applicable.map((n) => n.id).sort(), m === "opencode-permissions" ? [] : identity);
    for (const id of ["PG-253", "PG-254", "BG-277", "PG-256", "PG-163"]) entry(report, id);
    assert.equal(report.differing, 0);
  });
}

for (const m of MECHANISMS) {
  test(`C002-TS-643 — absent-field cases per mechanism: ${m} (stub)`, async () => {
    const { result } = await replayed(m);
    const tools: Record<string, string> = { "PG-253": "write_file", "PG-254": "write_file", "BG-277": "run_command", "PG-256": "write_file" };
    for (const [id, tool] of Object.entries(tools)) {
      const e = entry(result.report, id);
      assert.deepEqual([e.expected, e.expected_source, e.actual, e.fed_as.malformed], ["deny", "C002-REQ-630", "deny", true], id);
      assert.equal(e.fed_as.tool, tool, `${id} names the tool of its malformed call`);
      assert.ok(!notApplicable(result.report, id));
    }
    assert.equal(entry(result.report, "PG-163").fed_as.malformed, false);
    assert.deepEqual(["PG-256", "PG-253", "PG-254", "BG-277"].map(corpusExpect), ["allow", "deny", "deny", "deny"], "the corpora keep their expectations");
  });
}

for (const m of MECHANISMS) {
  test(`C002-TS-644 — a case with a cwd other than the repository root keeps its corpus expectation: ${m} (stub)`, async () => {
    const { result, stub, repo } = await replayed(m);
    const e = entry(result.report, "PG-134");
    assert.deepEqual([e.expected, e.expected_source, e.actual, e.fed_as.malformed], ["deny", "corpus", "deny", false]);
    const input = stub.calls.find((c) => c.id === "PG-134")!;
    assert.deepEqual([input.cwd, input.path, input.malformed], [`${repo}/src`, ".sdd/a.md", false]);
    assert.equal(joinedPath(input), `${repo}/src/.sdd/a.md`);
    assert.equal(joinedPath(stub.calls.find((c) => c.id === "PG-129")!), `${repo}/src/../.sdd/a.md`);
    assert.equal(entry(result.report, "PG-129").actual, "allow");
  });
}

test("C002-TS-645 — a malformed call allowed on a generated target is a difference", async () => {
  const { code, report } = await runCli(["--seed", "allow-malformed-write"]);
  for (const id of ["PG-253", "PG-256"]) {
    const e = entry(report, id);
    assert.deepEqual([e.expected, e.actual], ["deny", "allow"], id);
  }
  assert.ok(report.differing >= 2);
  assert.notEqual(code, 0, "the suite exits non-zero");
});

for (const m of MECHANISMS) {
  test(`C002-TS-649 — PG-163 replayed on a host with file-symlink: ${m} (stub)`, async (t) => {
    const { result, stub, repo } = await replayed(m);
    if (!result.report.replay_host.capabilities.includes("file-symlink")) {
      t.skip("this host cannot create file symbolic links (Developer Mode off, not elevated)");
      return;
    }
    const input = stub.calls.find((c) => c.id === "PG-163");
    assert.ok(input, "PG-163 was fed to the mechanism");
    assert.deepEqual([input.tool, input.path, input.malformed], ["Write", `${repo}/.sdd/file-link.md`, false]);
    const e = entry(result.report, "PG-163");
    assert.deepEqual([e.expected, e.expected_source, e.actual, e.fed_as.malformed], ["deny", "corpus", "deny", false]);
    assert.ok(!notApplicable(result.report, "PG-163"));
    if (process.platform === "win32") assert.equal(result.report.replay_host.platform, "win32");
  });
}

test("C002-TS-650 — PG-163 on a host without file-symlink is an error that counts as differing", async () => {
  const stub = createStubAdapter();
  const { report } = await runReplay(stub, { denyCapabilities: ["file-symlink"] });
  const e = entry(report, "PG-163");
  assert.deepEqual([e.expected, e.expected_source, e.actual], ["deny", "corpus", "error"]);
  assert.match(e.detail ?? "", /file-symlink/);
  assert.ok(!notApplicable(report, "PG-163"));
  assert.ok(!stub.calls.some((c) => c.id === "PG-163"), "the server received no call for PG-163");
  assert.ok(!report.replay_host.capabilities.includes("file-symlink"));
  assert.ok(report.differing >= 1);
  const cli = await runCli(["--deny-capability", "file-symlink"]);
  assert.notEqual(cli.code, 0, "the suite exits non-zero");
  assert.equal(entry(cli.report, "PG-163").actual, "error");
});

// --- Real adapters (C002-T-041) -----------------------------------------------------------------------

const TGZ = join(repoRoot(), "dist", `architect-sdd-${sourceVersion()}.tgz`);

/** False (and the test skipped) when the packed tarball the server adapter installs is missing. */
function haveTarball(t: TestContext): boolean {
  if (existsSync(process.env["SDD_REPLAY_TGZ"] ?? TGZ)) return true;
  t.skip(`${TGZ} is missing: run \`npm run package\` first (or set SDD_REPLAY_TGZ)`);
  return false;
}

/** The planted corpora of C002-TS-609 cut to the planted case and one case per corpus, so that the run counts only that difference. */
const SHELL_KEEP = ["BG-115"];
const PATH_KEEP = ["PG-003"];
for (const [label, plant, id] of [
  [
    'the shell case "sdd status > out.txt"',
    {
      path: (c: Corpus) => {
        c.cases = c.cases.filter((x) => PATH_KEEP.includes(x.id));
      },
      shell: (cases: BashCase[]) => {
        const c = cases.find((x) => x.command === "sdd status > out.txt")!;
        c.expect = "allow";
        delete c.rule;
        return cases.filter((x) => x === c || SHELL_KEEP.includes(x.id));
      },
    },
    "",
  ],
  [
    'a path case writing "{repo}/src/app.ts" through the tool "NotebookEdit"',
    {
      path: (c: Corpus) => {
        c.cases = [...c.cases.filter((x) => PATH_KEEP.includes(x.id)), { id: "PG-900", category: "outside", tool: "NotebookEdit", agent: "architect:sdd-spec-writer", field: "notebook_path", path: "{repo}/src/app.ts", expect: "allow" }];
      },
      shell: (cases: BashCase[]) => cases.filter((x) => SHELL_KEEP.includes(x.id)),
    },
    "PG-900",
  ],
  [
    WRITE_SHELL_LABEL,
    {
      path: (c: Corpus) => {
        c.cases = c.cases.filter((x) => PATH_KEEP.includes(x.id));
      },
      shell: (cases: BashCase[]) => [...cases.filter((x) => SHELL_KEEP.includes(x.id)), writeShellCase(cases)],
    },
    "BG-900",
  ],
  [
    TRAILING_LABEL,
    {
      path: (c: Corpus) => {
        c.cases = [...c.cases.filter((x) => PATH_KEEP.includes(x.id)), trailingCase(c)];
      },
      shell: (cases: BashCase[]) => cases.filter((x) => SHELL_KEEP.includes(x.id)),
    },
    "PG-901",
  ],
] as const) {
  test(`C002-TS-609 — a differing decision is reported by the real sdd MCP server: ${label}`, async (t) => {
    if (!haveTarball(t)) return;
    const { code, report, log } = await runCli([], plant, "sdd-mcp-server");
    const caseId = id || loadCorpora().shell.cases.find((x) => x.command === "sdd status > out.txt")!.id;
    const e = entry(report, caseId);
    const [expected, actual] = PLANTED_DECISIONS[caseId] ?? ["allow", "deny"];
    assert.equal(report.mechanism, "sdd-mcp-server");
    assert.deepEqual([e.expected, e.actual], [expected, actual]);
    if (caseId === "BG-900") assert.deepEqual([e.expected_source, e.fed_as.tool], ["C001-REQ-1103", "write_file"]);
    if (caseId === "PG-901") assert.match(e.detail ?? "", /^ERR-MCP-003 after the boundary allowed the call/);
    assert.equal(report.differing, 1);
    assert.ok(log.some((l) => l.includes(`differing ${caseId}`) && l.includes(`expected ${expected}`) && l.includes(`got ${actual}`)), log.join("\n"));
    assert.notEqual(code, 0, "the suite exits non-zero");
  });
}

const realRuns = new Map<Mechanism, Promise<ReplayResult>>();

/** One replay of the corpora per real adapter of C002-T-041, shared by the scenarios below. */
function realReplay(mechanism: "sdd-mcp-server" | "copilot-hooks"): Promise<ReplayResult> {
  let r = realRuns.get(mechanism);
  if (!r) {
    const adapter: ReplayAdapter = mechanism === "sdd-mcp-server" ? createMcpServerAdapter() : createCopilotHooksAdapter();
    r = runReplay(adapter);
    realRuns.set(mechanism, r);
  }
  return r;
}

for (const m of ["sdd-mcp-server", "copilot-hooks"] as const) {
  test(`C002-TS-628, C002-TS-638, C002-TS-643, C002-TS-644 — mechanism rows against the real ${m} adapter`, async (t) => {
    if (m === "sdd-mcp-server" && !haveTarball(t)) return;
    const { report, problems, omitted } = await realReplay(m);
    assert.deepEqual([problems, omitted], [[], []]);
    // C002-TS-628, C002-TS-638: memory cases deny, a non-Architect caller's memory case played by the conductor.
    for (const id of ["PG-205", "PG-224"]) assert.deepEqual([entry(report, id).expected, entry(report, id).expected_source, entry(report, id).actual], ["deny", "C002-REQ-625", "deny"], id);
    assert.equal(entry(report, "PG-224").fed_as.caller, "sdd-conductor");
    // C002-TS-643: the absent-field cases are malformed calls, denied.
    for (const id of ["PG-253", "PG-254", "BG-277", "PG-256"]) {
      const e = entry(report, id);
      assert.deepEqual([e.expected, e.expected_source, e.actual, e.fed_as.malformed], ["deny", "C002-REQ-630", "deny", true], id);
    }
    // C002-TS-644: a case with its own cwd keeps its corpus expectation.
    assert.deepEqual([entry(report, "PG-134").actual, entry(report, "PG-129").actual], ["deny", "allow"]);
    const identity = [...loadCorpora().path.corpus.cases, ...loadCorpora().shell.cases].filter((c) => c.category === "identity").map((c) => c.id).sort();
    assert.deepEqual(report.not_applicable.map((n) => n.id).sort(), identity);
  });
}
