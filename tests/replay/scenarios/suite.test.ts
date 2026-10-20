// Corpus replay suite scenarios (C002-T-040) against the stub adapter, which decides with the guard
// cores as a generated mechanism would and reports for the mechanism it emulates, on the corpora of
// tests/guards/ and planted corpus fixtures. Run by `npm run replay -- suite`, never by `npm test`.
// The rows that need a real mechanism (the packed sdd MCP server, the Copilot hook command, OpenCode
// through C002-ADR-005) run with the adapters of C002-T-041 and C002-T-042: C002-TS-609 and the
// mechanism rows of C002-TS-628, C002-TS-638, C002-TS-643 and C002-TS-644 below also run against the
// real `sdd-mcp-server` (the server of dist/architect-sdd-<version>.tgz, `npm run package`) and
// `copilot-hooks` adapters; C002-TC-608 with C002-T-049 (release runs), C002-TC-637 (release-check
// refusal) with C002-T-047. C002-TC-661 (the per-mechanism rows of C002-IF-009 §2.1 revised for D-014)
// and C002-TC-662 (ERR-MCP-003 read as allow) run against the real adapters only (C002-T-041); the
// OpenCode row of C002-TC-661 (@mode-native) through the adapter of C002-T-042.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import type { TestContext } from "node:test";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { BashCase, Corpus } from "../../guards/fixture.ts";
import { createStubAdapter, joinedPath, type ReplayAdapter, type StubAdapter } from "../adapter.ts";
import { type CopilotHooksAdapter, createCopilotHooksAdapter } from "../adapters/copilot-hooks.ts";
import type { SentCall } from "../adapters/opencode-permissions.ts";
import { createMcpServerAdapter, type McpServerAdapter } from "../adapters/sdd-mcp-server.ts";
import { loadTargetTable } from "../../../scripts/generate/tables.ts";
import { repoRoot } from "../../helpers.ts";
import { type Mechanism, MECHANISMS } from "../expect.ts";
import { ADAPTERS, main } from "../main.ts";
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
    assert.equal(result.report.not_applicable.filter((n) => n.rule === "platforms").length, 0, "no case of the present corpora is limited away from this platform");
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
    if (caseId === "PG-901") assert.match(e.detail ?? "", /^ERR-MCP-003: could not write /);
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
    const { report, problems } = await realReplay(m);
    assert.deepEqual(problems, []);
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

// --- C002-TC-661, C002-TC-662 (C002-T-041, C002-T-063; the OpenCode row with C002-T-042) ---------------

const PLUGIN_DATA_LITERAL = "${CLAUDE_PLUGIN_DATA}";
const digest = (file: string) => createHash("sha256").update(readFileSync(file)).digest("hex");
const RECORD_MODE = loadTargetTable(repoRoot(), "opencode").enforcement_mode;
const FIXTURE_APP_TS = (JSON.parse(readFileSync(DEFAULT_PATH_CORPUS, "utf8")) as Corpus).fixture.files["src/app.ts"]!;
const commandOf = (id: string): string => loadCorpora().shell.cases.find((c) => c.id === id)!.command as string;

type RowMechanism = "opencode-permissions" | "sdd-mcp-server" | "copilot-hooks";

/** The cases of the Examples of C002-TS-661 (and PG-048 of C002-TS-662) replayed per mechanism, cut from the corpora. */
const ROW_CASES: Record<RowMechanism, { path: string[]; shell: string[] }> = {
  // BG-268 beside a path case that changes no file (PG-050, an Edit that OpenCode denies).
  "opencode-permissions": { path: ["PG-050"], shell: ["BG-268"] },
  "sdd-mcp-server": { path: ["PG-135", "PG-136", "PG-048"], shell: ["BG-268", "BG-374", "BG-403", "BG-405", "BG-408"] },
  "copilot-hooks": { path: ["PG-135"], shell: ["BG-268", "BG-374"] },
};

/** Paths under `root` whose last segment is `name`; links (junctions) and node_modules are not entered. */
function named(root: string, name: string): string[] {
  const hits: string[] = [];
  const walk = (dir: string) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = `${dir}/${e.name}`;
      if (e.name === name) hits.push(p);
      if (e.isDirectory() && !e.isSymbolicLink() && e.name !== "node_modules") walk(p);
    }
  };
  walk(root);
  return hits;
}

interface Sent {
  tool: string;
  args: Record<string, unknown>;
  agent?: string;
  /** sdd MCP server: the JSON-RPC response to the call. */
  response?: { result?: Record<string, unknown>; error?: unknown };
}

interface RowRun {
  report: ReplayReport;
  problems: string[];
  repo: string;
  repolink: string;
  /** The tool and arguments (server, OpenCode) or the hook's tool_name and whole input (Copilot) per case. */
  sent: Map<string, Sent>;
  srcExists: boolean;
  sddAExists: boolean;
  appTs: string | null;
  rmNamed: string[];
  pluginDataNamed: string[];
  digestsBefore: string[];
  digestsAfter: string[];
}

const rowRuns = new Map<RowMechanism, Promise<RowRun>>();

/** One replay of the cases of ROW_CASES (cut corpora in a temporary folder) through the real adapter of `m`. */
function rowReplay(m: RowMechanism): Promise<RowRun> {
  let r = rowRuns.get(m);
  if (r) return r;
  r = (async () => {
    const digestsBefore = [DEFAULT_PATH_CORPUS, DEFAULT_SHELL_CORPUS].map(digest);
    const dir = mkdtempSync(join(tmpdir(), "sdd-tc661-"));
    try {
      const p = JSON.parse(readFileSync(DEFAULT_PATH_CORPUS, "utf8")) as Corpus;
      p.cases = p.cases.filter((c) => ROW_CASES[m].path.includes(c.id));
      const s = JSON.parse(readFileSync(DEFAULT_SHELL_CORPUS, "utf8")) as { cases: BashCase[] };
      s.cases = s.cases.filter((c) => ROW_CASES[m].shell.includes(c.id));
      assert.equal(p.cases.length + s.cases.length, ROW_CASES[m].path.length + ROW_CASES[m].shell.length, "every named case is in the corpora");
      writeFileSync(join(dir, "path-corpus.json"), JSON.stringify(p));
      writeFileSync(join(dir, "bash-corpus.json"), JSON.stringify(s));
      const adapter: ReplayAdapter =
        m === "sdd-mcp-server" ? createMcpServerAdapter() : m === "copilot-hooks" ? createCopilotHooksAdapter() : await ADAPTERS["opencode-permissions"]!({ mode: "native-permissions" });
      const run: Partial<RowRun> = {};
      const { report, problems } = await runReplay(adapter, {
        pathCorpus: join(dir, "path-corpus.json"),
        shellCorpus: join(dir, "bash-corpus.json"),
        afterRun: (fx) => {
          run.repo = fx.repo;
          run.repolink = fx.resolvePath("{repolink}");
          run.srcExists = existsSync(`${fx.repo}/src`);
          run.sddAExists = existsSync(`${fx.repo}/.sdd/a.md`);
          run.appTs = existsSync(`${fx.repo}/src/app.ts`) ? readFileSync(`${fx.repo}/src/app.ts`, "utf8") : null;
          run.rmNamed = named(fx.base, "rm -rf src");
          run.pluginDataNamed = named(fx.base, PLUGIN_DATA_LITERAL);
        },
      });
      const sent = new Map<string, Sent>();
      if (m === "sdd-mcp-server") for (const c of (adapter as McpServerAdapter).calls) sent.set(c.id, { tool: c.tool, args: (c.args ?? {}) as Record<string, unknown>, ...(c.response ? { response: c.response as Sent["response"] } : {}) });
      else if (m === "copilot-hooks")
        for (const c of (adapter as CopilotHooksAdapter).calls) {
          const input = JSON.parse(c.stdin) as Record<string, unknown>;
          sent.set(c.id, { tool: String(input["tool_name"]), args: input });
        }
      else for (const c of (adapter as ReplayAdapter & { calls: SentCall[] }).calls) sent.set(c.id, { tool: c.tool, args: c.args as Record<string, unknown>, agent: c.agent });
      return { ...(run as RowRun), report, problems, sent, digestsBefore, digestsAfter: [DEFAULT_PATH_CORPUS, DEFAULT_SHELL_CORPUS].map(digest) };
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  })();
  rowRuns.set(m, r);
  return r;
}

interface Row {
  corpus: "path" | "shell";
  id: string;
  corpusExpect: "allow" | "deny";
  mechanism: RowMechanism;
  fedAs: string;
  fed(r: RowRun): void;
  expected: "allow" | "deny";
  source: string;
  afterText: string;
  after(r: RowRun): void;
}

const toolInput = (s: Sent | undefined): Record<string, unknown> => (s?.args["tool_input"] ?? {}) as Record<string, unknown>;
const serverRunCommand = (id: string) => (r: RowRun) => assert.deepEqual({ tool: r.sent.get(id)?.tool, args: r.sent.get(id)?.args }, { tool: "run_command", args: { command: commandOf(id), dialect: "bash" } });
const noPluginDataEntry = (r: RowRun) => assert.deepEqual(r.pluginDataNamed, [], `the replay fixture holds no file or folder named ${PLUGIN_DATA_LITERAL}`);
const srcKeptNoRmFile = (r: RowRun) => assert.deepEqual([r.srcExists, r.rmNamed], [true, []], '"{repo}/src" still exists and no file "rm -rf src" exists in the replay fixture');

/** The Examples of C002-TS-661, in order. */
const TS_661: Row[] = [
  {
    corpus: "shell", id: "BG-268", corpusExpect: "allow", mechanism: "opencode-permissions",
    fedAs: 'a "write" call of "sdd-cartographer" whose "filePath" is "rm -rf src"',
    fed: (r) => {
      const c = r.sent.get("BG-268");
      assert.ok(c, "BG-268 was sent to OpenCode");
      assert.deepEqual([c.tool, c.agent, c.args["filePath"]], ["write", "sdd-cartographer", "rm -rf src"]);
    },
    expected: "deny", source: "C001-REQ-1103", afterText: '"{repo}/src" still exists, no file "rm -rf src"', after: srcKeptNoRmFile,
  },
  {
    corpus: "shell", id: "BG-268", corpusExpect: "allow", mechanism: "sdd-mcp-server",
    fedAs: 'a "write_file" call whose "path" is "rm -rf src"',
    fed: (r) => assert.deepEqual([r.sent.get("BG-268")?.tool, r.sent.get("BG-268")?.args["path"]], ["write_file", "rm -rf src"]),
    expected: "deny", source: "C001-REQ-1103", afterText: '"{repo}/src" still exists, no file "rm -rf src"', after: srcKeptNoRmFile,
  },
  {
    corpus: "shell", id: "BG-268", corpusExpect: "allow", mechanism: "copilot-hooks",
    fedAs: 'hook input with the "tool_name" "Write" and "rm -rf src" as "tool_input.path"',
    fed: (r) => assert.deepEqual([r.sent.get("BG-268")?.tool, toolInput(r.sent.get("BG-268"))["path"]], ["Write", "rm -rf src"]),
    expected: "deny", source: "C001-REQ-1103", afterText: '"{repo}/src" still exists', after: (r) => assert.equal(r.srcExists, true),
  },
  ...(["BG-374", "BG-403", "BG-405"] as const).map(
    (id): Row => ({
      corpus: "shell", id, corpusExpect: id === "BG-405" ? "deny" : "allow", mechanism: "sdd-mcp-server",
      fedAs: `a "run_command" call with the case's command and the "dialect" "bash"`,
      fed: serverRunCommand(id),
      expected: "deny", source: "C002-REQ-517", afterText: `no file or folder named ${PLUGIN_DATA_LITERAL}`, after: noPluginDataEntry,
    }),
  ),
  {
    corpus: "shell", id: "BG-374", corpusExpect: "allow", mechanism: "copilot-hooks",
    fedAs: `hook input with the "tool_name" "Bash" and the case's command as "tool_input.command"`,
    fed: (r) => assert.deepEqual([r.sent.get("BG-374")?.tool, toolInput(r.sent.get("BG-374"))["command"]], ["Bash", commandOf("BG-374")]),
    expected: "allow", source: "corpus", afterText: `no file or folder named ${PLUGIN_DATA_LITERAL}`, after: noPluginDataEntry,
  },
  {
    corpus: "shell", id: "BG-408", corpusExpect: "deny", mechanism: "sdd-mcp-server",
    fedAs: `a "run_command" call with the case's command (single quotes) and the "dialect" "bash"`,
    fed: serverRunCommand("BG-408"),
    expected: "deny", source: "corpus", afterText: `no file or folder named ${PLUGIN_DATA_LITERAL}`, after: noPluginDataEntry,
  },
  {
    corpus: "path", id: "PG-135", corpusExpect: "allow", mechanism: "sdd-mcp-server",
    fedAs: 'a "write_file" call whose "path" is "{repolink}/.sdd/a.md", the server at "{repo}"',
    fed: (r) => assert.deepEqual([r.sent.get("PG-135")?.tool, r.sent.get("PG-135")?.args["path"]], ["write_file", `${r.repolink}/.sdd/a.md`]),
    expected: "deny", source: "C002-REQ-401", afterText: '"{repo}/.sdd/a.md" does not exist', after: (r) => assert.equal(r.sddAExists, false),
  },
  {
    corpus: "path", id: "PG-136", corpusExpect: "deny", mechanism: "sdd-mcp-server",
    fedAs: 'a "write_file" call whose "path" is "{repolink}/src/app.ts", the server at "{repo}"',
    fed: (r) => assert.deepEqual([r.sent.get("PG-136")?.tool, r.sent.get("PG-136")?.args["path"]], ["write_file", `${r.repolink}/src/app.ts`]),
    expected: "deny", source: "C002-REQ-401", afterText: '"{repo}/src/app.ts" is unchanged', after: (r) => assert.equal(r.appTs, FIXTURE_APP_TS),
  },
  {
    corpus: "path", id: "PG-135", corpusExpect: "allow", mechanism: "copilot-hooks",
    fedAs: 'hook input with the "cwd" "{repolink}", the "tool_name" "Write" and "{repolink}/.sdd/a.md" as "tool_input.path"',
    fed: (r) => {
      const c = r.sent.get("PG-135");
      assert.deepEqual([c?.args["cwd"], c?.tool, toolInput(c)["path"]], [r.repolink, "Write", `${r.repolink}/.sdd/a.md`]);
    },
    expected: "allow", source: "corpus", afterText: "the hook command exits with code 0",
    after: (r) => assert.equal(entry(r.report, "PG-135").detail, "exit 0, no output", "exit 0 with empty standard output"),
  },
];

/** False (and the test skipped) when the row's mechanism cannot run here: no tarball, or OpenCode not in native-permissions. */
function rowRunnable(t: TestContext, m: RowMechanism): boolean {
  if (m === "sdd-mcp-server") return haveTarball(t);
  if (m === "opencode-permissions") {
    if (RECORD_MODE !== "native-permissions") {
      t.skip(`not applicable: a @mode-native row, and the S-07 record fixes ${RECORD_MODE} (docs/spikes/S-07-opencode.md)`);
      return false;
    }
    if (!ADAPTERS["opencode-permissions"]) {
      t.skip("no opencode-permissions replay adapter registered (C002-T-042)");
      return false;
    }
  }
  return true;
}

for (const row of TS_661) {
  test(`C002-TS-661 — ${row.id} (corpus ${row.corpusExpect}) against ${row.mechanism}: fed as ${row.fedAs}; ${row.expected} (${row.source}); ${row.afterText}`, async (t) => {
    if (!rowRunnable(t, row.mechanism)) return;
    const r = await rowReplay(row.mechanism);
    assert.deepEqual(r.problems, [], "the report validates and lists every case once");
    row.fed(r);
    assert.ok(!notApplicable(r.report, row.id), `${row.id} is a replayed case`);
    const e = entry(r.report, row.id);
    assert.deepEqual([e.expected, e.expected_source, e.actual], [row.expected, row.source, row.expected], e.detail ?? "");
    const { path, shell } = loadCorpora();
    const c = (row.corpus === "path" ? path.corpus.cases : shell.cases).find((x) => x.id === row.id)!;
    assert.equal(c.expect, row.corpusExpect, `tests/guards/${row.corpus === "path" ? "path-corpus.json" : "bash-corpus.json"} still records ${row.corpusExpect} for ${row.id}`);
    assert.deepEqual(r.digestsAfter, r.digestsBefore, "the corpus files read back unchanged");
    row.after(r);
  });
}

test("C002-TS-662 — PG-048, a write the guard allows and the file system refuses with ERR-MCP-003, counts as allow on the sdd MCP server", async (t) => {
  if (!haveTarball(t)) return;
  const r = await rowReplay("sdd-mcp-server");
  const c = loadCorpora().path.corpus.cases.find((x) => x.id === "PG-048")!;
  assert.deepEqual([c.tool, c.agent, c.path, c.expect], ["Write", "architect:sdd-spec-writer", "{repo}/.sdd/004-x/", "allow"]);
  assert.deepEqual([r.sent.get("PG-048")?.tool, r.sent.get("PG-048")?.args["path"]], ["write_file", `${r.repo}/.sdd/004-x/`]);
  const e = entry(r.report, "PG-048");
  // The server answers with a text-only error result (C002-IF-002 §6.1, revised for defect D-017).
  const res = r.sent.get("PG-048")?.response?.result as { isError?: boolean; content?: { type: string; text: string }[] } | undefined;
  assert.ok(res, JSON.stringify(r.sent.get("PG-048")));
  assert.equal(res.isError, true, JSON.stringify(res));
  assert.equal(res.content?.length, 1, JSON.stringify(res));
  assert.ok(res.content[0]!.text.startsWith("ERR-MCP-003: "), JSON.stringify(res));
  assert.equal(Object.prototype.hasOwnProperty.call(res, "structuredContent"), false, JSON.stringify(res));
  assert.match(e.detail ?? "", /^ERR-MCP-003: could not write /, "the server's error result with ERR-MCP-003, named in detail");
  assert.deepEqual([e.expected, e.expected_source, e.actual], ["allow", "corpus", "allow"]);
  assert.equal(r.report.differing, 0, "PG-048 is not among the differing decisions (nor is any other case of the run)");
});

// --- C002-TC-681 (C002-TS-681; C002-T-065): the platform rule on fx-corpus-platforms ---------------------
// The corpora of the commit under test with three path cases limited by `platforms` to `posix` (PG-900,
// category outside; PG-901, category memory; PG-902, category symlink with requires file-symlink), in a
// temporary corpus folder; replay host win32 (REF-WIN). PG-900 and PG-902 are not applicable by the
// platform rule (before C002-REQ-633 for PG-902), PG-901 keeps the memory row's deny, PG-163 is replayed.
const PLATFORM_CASES = (path: Corpus) => {
  const of = (id: string) => path.cases.find((c) => c.id === id)!;
  return [
    { ...of("PG-049"), id: "PG-900", platforms: ["posix"] },
    { ...of("PG-205"), id: "PG-901", platforms: ["posix"] },
    { ...of("PG-163"), id: "PG-902", platforms: ["posix"] },
  ];
};
const platformRuns = new Map<RowMechanism, Promise<{ report: ReplayReport; problems: string[]; before: string[]; after: string[] }>>();
function platformReplay(m: RowMechanism) {
  let r = platformRuns.get(m);
  if (r) return r;
  r = (async () => {
    const dir = mkdtempSync(join(tmpdir(), "sdd-tc681-"));
    try {
      const p = JSON.parse(readFileSync(DEFAULT_PATH_CORPUS, "utf8")) as Corpus;
      p.cases = [...p.cases, ...PLATFORM_CASES(p)] as Corpus["cases"];
      writeFileSync(join(dir, "path-corpus.json"), JSON.stringify(p, null, 2));
      writeFileSync(join(dir, "bash-corpus.json"), readFileSync(DEFAULT_SHELL_CORPUS));
      const files = [join(dir, "path-corpus.json"), join(dir, "bash-corpus.json")];
      const before = files.map(digest);
      const adapter: ReplayAdapter =
        m === "sdd-mcp-server" ? createMcpServerAdapter() : m === "copilot-hooks" ? createCopilotHooksAdapter() : await ADAPTERS["opencode-permissions"]!({ mode: "native-permissions" });
      const { report, problems } = await runReplay(adapter, { pathCorpus: files[0], shellCorpus: files[1] });
      return { report, problems, before, after: files.map(digest) };
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  })();
  platformRuns.set(m, r);
  return r;
}

for (const m of ["opencode-permissions", "sdd-mcp-server", "copilot-hooks"] as const) {
  test(`C002-TS-681 — ${m}: PG-900 and PG-902 not applicable (platforms), PG-901 replayed deny (C002-REQ-625), PG-163 replayed`, async (t) => {
    if (!rowRunnable(t, m)) return;
    const { report, problems, before, after } = await platformReplay(m);
    assert.equal(report.replay_host.platform, "win32", "replayed on REF-WIN");
    assert.deepEqual(problems, [], "the report validates against the release-record schema and lists every case once");
    const platformEntries = report.not_applicable.filter((n) => n.rule === "platforms").map((n) => n.id).sort();
    assert.deepEqual(platformEntries, ["PG-900", "PG-902"], "no other platforms entry");
    for (const id of ["PG-900", "PG-902"]) assert.ok(!report.cases.some((c) => c.id === id), `${id} is not among the cases`);
    const e901 = entry(report, "PG-901");
    assert.deepEqual([e901.expected, e901.expected_source], ["deny", "C002-REQ-625"]);
    entry(report, "PG-163");
    const identity = [...loadCorpora().path.corpus.cases, ...loadCorpora().shell.cases].filter((c) => c.category === "identity").map((c) => c.id).sort();
    const ruled = report.not_applicable.filter((n) => n.rule === "C002-REQ-626").map((n) => n.id).sort();
    assert.deepEqual(ruled, m === "opencode-permissions" ? [] : identity);
    assert.deepEqual(after, before, "the fixture's corpus files read back unchanged");
  });
}
