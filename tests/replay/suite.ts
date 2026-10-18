// Corpus replay suite (C002-COMP-008, C002-T-040): loads the path and shell corpora, builds the replay
// fixture, assigns every case its expectation for the mechanism (./expect.ts, C002-IF-009 §2.1), feeds
// each replayed case to the adapter (§2.2) and assembles the replay report (./report.ts).
//
// The replay fixture is the path corpus fixture (tests/guards/fixture.ts) plus the folder links the
// shell corpus uses ({repo}/link-out, {repo}-link), without the corpus fixture's memory folders under
// .claude/agent-memory/: the generated agents have none (C002-DEC-009), and a denied memory write
// leaves no file behind (C002-TS-638).
import { readFileSync, symlinkSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { type BashCase, buildFixture, type Corpus, type CorpusCase, dialectOf } from "../guards/fixture.ts";
import { repoRoot } from "../helpers.ts";
import type { ReplayAdapter, ReplayFixture, ReplayInput, Target } from "./adapter.ts";
import { type AnyCase, CONDUCTOR, ADOPTER_AGENT, callerOf, type CorpusName, expectationOf, type Platform } from "./expect.ts";
import { completenessProblems, corpusRef, type NotApplicable, type ReplayReport, type ReportCase, sourceVersion, validateReport } from "./report.ts";

export const DEFAULT_PATH_CORPUS = join(repoRoot(), "tests", "guards", "path-corpus.json");
export const DEFAULT_SHELL_CORPUS = join(repoRoot(), "tests", "guards", "bash-corpus.json");

export interface Corpora {
  path: { file: string; corpus: Corpus };
  shell: { file: string; cases: BashCase[] };
}

export function loadCorpora(pathFile = DEFAULT_PATH_CORPUS, shellFile = DEFAULT_SHELL_CORPUS): Corpora {
  return {
    path: { file: pathFile, corpus: JSON.parse(readFileSync(pathFile, "utf8")) as Corpus },
    shell: { file: shellFile, cases: (JSON.parse(readFileSync(shellFile, "utf8")) as { cases: BashCase[] }).cases },
  };
}

const MEMORY = /^\.claude\/agent-memory\//;
const WIN = process.platform === "win32";

/** The replay fixture; `denyCapabilities` stubs the capability probe to absent (C002-TS-650). */
export function buildReplayFixture(spec: Corpus["fixture"], denyCapabilities: readonly string[] = []): ReplayFixture {
  const keep = <T>(o: Record<string, T>) => Object.fromEntries(Object.entries(o).filter(([k]) => !MEMORY.test(k)));
  const fx = buildFixture({ ...spec, files: keep(spec.files), junctions: keep(spec.junctions), hardlinks: keep(spec.hardlinks), fileSymlinks: keep(spec.fileSymlinks) });
  const linkType = WIN ? "junction" : "dir";
  const shellOutside = `${fx.base}/shell-outside`;
  mkdirSync(shellOutside, { recursive: true });
  symlinkSync(shellOutside, `${fx.repo}/link-out`, linkType);
  symlinkSync(fx.repo, `${fx.repo}-link`, linkType);
  for (const c of denyCapabilities) fx.capabilities.delete(c);
  const sdd = join(repoRoot(), "plugins", "architect", "scripts", "sdd.mjs").split("\\").join("/");
  return {
    base: fx.base,
    repo: fx.repo,
    capabilities: fx.capabilities,
    resolvePath: fx.resolve,
    resolveShell: (s) => s.split("{sdd}").join(sdd).split("{repo}").join(fx.repo),
    cleanup: fx.cleanup,
  };
}

export interface ReplayOptions {
  /** Default: the adapter's target. */
  target?: Target;
  /** Default: the source plugin version. */
  version?: string;
  pathCorpus?: string;
  shellCorpus?: string;
  /** Host capabilities treated as absent although the fixture could provide them. */
  denyCapabilities?: readonly string[];
  /** Called with the fixture after the last case, before it is removed. */
  afterRun?(fx: ReplayFixture): void;
}

export interface ReplayResult {
  report: ReplayReport;
  /** Cases left out of the report: no expectation on this platform (C002-IF-009 §2.1; ERR-REL-012). */
  omitted: string[];
  /** Schema and completeness problems of the report (none expected). */
  problems: string[];
}

function inputOf(corpus: CorpusName, c: AnyCase, fx: ReplayFixture, caller: string, malformed: ReplayInput["malformed"]): ReplayInput {
  const resolve = corpus === "path" ? fx.resolvePath : fx.resolveShell;
  const cwd = c.cwd === undefined ? fx.repo : c.cwd === null || c.cwd === "" ? c.cwd : resolve(c.cwd);
  const input: ReplayInput = { id: c.id, corpus, category: c.category, case: c, tool: c.tool, caller, cwd, dialect: dialectOf(c), malformed, resolve };
  if (c.env !== undefined) input.env = c.env;
  if (c.stdin !== undefined) input.stdin = c.stdin;
  if (corpus === "path") {
    const p = (c as CorpusCase).path;
    input.path = typeof p === "string" ? resolve(p) : p;
    const field = (c as CorpusCase).field;
    if (field !== undefined) input.field = field;
  } else {
    const cmd = (c as BashCase).command;
    input.command = typeof cmd === "string" ? resolve(cmd) : cmd;
  }
  return input;
}

/** Replays both corpora against one adapter and returns its report (not yet written). */
export async function runReplay(adapter: ReplayAdapter, options: ReplayOptions = {}): Promise<ReplayResult> {
  const corpora = loadCorpora(options.pathCorpus, options.shellCorpus);
  const platform: Platform = WIN ? "win32" : "posix";
  const mechanism = adapter.mechanism;
  const fx = buildReplayFixture(corpora.path.corpus.fixture, options.denyCapabilities);
  const cases: ReportCase[] = [];
  const notApplicable: NotApplicable[] = [];
  const omitted: string[] = [];
  try {
    await adapter.setup(fx);
    try {
      const all: [CorpusName, AnyCase][] = [
        ...corpora.path.corpus.cases.map((c) => ["path", c] as [CorpusName, AnyCase]),
        ...corpora.shell.cases.map((c) => ["shell", c] as [CorpusName, AnyCase]),
      ];
      for (const [corpus, c] of all) {
        const e = expectationOf(c, mechanism, platform);
        if (!e.applicable) {
          notApplicable.push({ id: c.id, corpus, category: c.category, rule: e.rule });
          continue;
        }
        if ("omitted" in e) {
          omitted.push(`${c.id}: ${e.omitted}`);
          continue;
        }
        let caller = callerOf(c, mechanism);
        if (caller !== ADOPTER_AGENT && caller !== CONDUCTOR && c.tool !== null && adapter.grants && !adapter.grants(caller, c.tool)) caller = CONDUCTOR;
        const malformed = e.source === "C002-REQ-630" ? "missing-field" : c.stdin !== undefined ? "raw-stdin" : false;
        const input = inputOf(corpus, c, fx, caller, malformed);
        const entry: ReportCase = {
          id: c.id,
          corpus,
          category: c.category,
          fed_as: { tool: c.tool ?? "write", caller, malformed: malformed !== false },
          expected: e.expected,
          expected_source: e.source,
          actual: "error",
        };
        if (corpus === "shell") entry.fed_as.dialect = input.dialect;
        // C002-REQ-633: a case requiring a capability the host lacks is an error, never fed otherwise.
        if (c.requires !== undefined && !fx.capabilities.has(c.requires)) {
          entry.detail = `replay host lacks ${c.requires}`;
        } else {
          try {
            const d = await adapter.decide(input);
            entry.actual = d.actual;
            entry.fed_as.tool = d.tool;
            if (d.dialect) entry.fed_as.dialect = d.dialect;
            if (d.detail !== undefined) entry.detail = d.detail;
          } catch (err) {
            entry.detail = `no decision: ${err instanceof Error ? err.message : String(err)}`;
          }
        }
        cases.push(entry);
      }
    } finally {
      await adapter.teardown();
    }
    options.afterRun?.(fx);
  } finally {
    fx.cleanup();
  }
  const hostVersions = adapter.hostVersions?.();
  const report: ReplayReport = {
    mechanism,
    target: options.target ?? adapter.target,
    package_version: options.version ?? sourceVersion(),
    ...(hostVersions ? { host_versions: hostVersions } : {}),
    corpora: {
      path: corpusRef(corpora.path.file, corpora.path.corpus.cases.length),
      shell: corpusRef(corpora.shell.file, corpora.shell.cases.length),
    },
    replay_host: { platform, capabilities: [...fx.capabilities].sort() },
    cases,
    not_applicable: notApplicable,
    applicable: cases.length,
    differing: cases.filter((c) => c.actual !== c.expected).length,
  };
  const ids = { path: corpora.path.corpus.cases.map((c) => c.id), shell: corpora.shell.cases.map((c) => c.id) };
  const omittedIds = new Set(omitted.map((o) => o.split(":")[0]!));
  const problems = [
    ...validateReport(report).map((p) => `schema: ${p}`),
    ...completenessProblems(report, { path: ids.path.filter((i) => !omittedIds.has(i)), shell: ids.shell.filter((i) => !omittedIds.has(i)) }),
  ];
  return { report, omitted, problems };
}
