// Replay recomputation of the release check (C002-IF-009 §2.1, §5; C002-REQ-617, C002-REQ-627,
// C002-REQ-634). For each replay report of a mechanism in use: every case of the corpora of the release
// commit exactly once, the not-applicable list exactly the cases that §2.1 excludes for the mechanism,
// every replayed case with the expected decision and `expected_source` that §2.1 gives for the mechanism
// and the report's replay host (ERR-REL-012), the host capabilities that the corpora's cases require
// (ERR-REL-012, `replay host lacks <capability>`), and 0 differing decisions (ERR-REL-001). The rules are
// those of the corpus replay suite (tests/replay/expect.ts, C002-T-063), imported, never copied.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expectationOf, type AnyCase, type CorpusName, type Mechanism, type Platform } from "../../tests/replay/expect.ts";
import { refusal, type Refusal } from "./errors.ts";

/** The corpora of the release commit (C002-IF-009 §2; tests/guards/). */
export const CORPUS_FILES: Record<CorpusName, string> = { path: "tests/guards/path-corpus.json", shell: "tests/guards/bash-corpus.json" };

export interface Corpus {
  name: CorpusName;
  file: string;
  sha256: string;
  cases: AnyCase[];
}

/** Reads both corpora under `root`; null for a corpus that is missing or does not parse. */
export function loadCorpora(root: string): Record<CorpusName, Corpus | null> {
  const load = (name: CorpusName): Corpus | null => {
    try {
      const bytes = readFileSync(join(root, ...CORPUS_FILES[name].split("/")));
      const cases = (JSON.parse(bytes.toString("utf8")) as { cases?: unknown }).cases;
      if (!Array.isArray(cases)) return null;
      return { name, file: CORPUS_FILES[name], sha256: createHash("sha256").update(bytes).digest("hex"), cases: cases as AnyCase[] };
    } catch {
      return null;
    }
  };
  return { path: load("path"), shell: load("shell") };
}

interface ReportEntry {
  id?: unknown;
  corpus?: unknown;
  expected?: unknown;
  expected_source?: unknown;
  actual?: unknown;
}

/** The parts of a replay report that the release check reads (`$defs/replayReport`). */
export interface ParsedReport {
  mechanism: string;
  host_versions?: Record<string, string>;
  corpora: Record<CorpusName, { file?: unknown; sha256?: unknown }>;
  replay_host: { platform: Platform; capabilities: string[] };
  cases: ReportEntry[];
  not_applicable: ReportEntry[];
  applicable: number;
  differing: number;
}

/** The report when it has the shape the check reads, else null (ERR-REL-009, unreadable). */
export function parseReport(text: string): ParsedReport | null {
  let r: unknown;
  try {
    r = JSON.parse(text);
  } catch {
    return null;
  }
  const o = r as Record<string, unknown>;
  if (o === null || typeof o !== "object" || Array.isArray(o)) return null;
  const host = o["replay_host"] as Record<string, unknown> | undefined;
  const corpora = o["corpora"] as Record<string, unknown> | undefined;
  if (!Array.isArray(o["cases"]) || !Array.isArray(o["not_applicable"])) return null;
  if (!host || typeof host !== "object" || (host["platform"] !== "win32" && host["platform"] !== "posix") || !Array.isArray(host["capabilities"])) return null;
  if (!corpora || typeof corpora !== "object" || typeof corpora["path"] !== "object" || typeof corpora["shell"] !== "object") return null;
  if (typeof o["mechanism"] !== "string") return null;
  return o as unknown as ParsedReport;
}

export interface ReplayResult {
  refusals: Refusal[];
  applicable: number;
  notApplicable: string[];
  differing: number;
}

const ids = (list: string[]) => list.join(", ");

/**
 * Checks one report of `mechanism` against the corpora. `path` is the report's repository-relative
 * path with `/` separators, as the messages print it.
 */
export function checkReport(target: string, mechanism: Mechanism, path: string, report: ParsedReport, corpora: Record<CorpusName, Corpus>): ReplayResult {
  const refusals: Refusal[] = [];
  const problem = (p: string, cases: string[]) => {
    if (cases.length > 0) refusals.push(refusal("ERR-REL-012", { target, path, mechanism, problem: p, "case ids": ids(cases) }));
  };
  const platform = report.replay_host.platform;
  const capabilities = new Set(report.replay_host.capabilities.filter((c): c is string => typeof c === "string"));

  const key = (corpus: unknown, id: unknown) => `${String(corpus)}\u0000${String(id)}`;
  const replayed = new Map<string, ReportEntry[]>();
  const excluded = new Map<string, ReportEntry[]>();
  for (const e of report.cases) replayed.set(key(e.corpus, e.id), [...(replayed.get(key(e.corpus, e.id)) ?? []), e]);
  for (const e of report.not_applicable) excluded.set(key(e.corpus, e.id), [...(excluded.get(key(e.corpus, e.id)) ?? []), e]);

  const omitted: string[] = [];
  const duplicated: string[] = [];
  const naWithoutRule: string[] = [];
  const excludedReplayed: string[] = [];
  const otherExpectations: string[] = [];
  const lacking = new Map<string, string[]>();
  const known = new Set<string>();

  for (const name of ["path", "shell"] as const) {
    for (const c of corpora[name].cases) {
      const k = key(name, c.id);
      known.add(k);
      if (typeof c.requires === "string" && !capabilities.has(c.requires)) lacking.set(c.requires, [...(lacking.get(c.requires) ?? []), c.id]);
      const asCase = replayed.get(k) ?? [];
      const asNa = excluded.get(k) ?? [];
      if (asCase.length + asNa.length > 1) {
        duplicated.push(c.id);
        continue;
      }
      const exp = expectationOf(c, mechanism, platform, name);
      if (!exp.applicable) {
        if (asCase.length === 1) excludedReplayed.push(c.id);
        else if (asNa.length === 0) omitted.push(c.id);
        continue;
      }
      if (asNa.length === 1) {
        naWithoutRule.push(c.id);
        continue;
      }
      const entry = asCase[0];
      if (entry === undefined) {
        omitted.push(c.id);
        continue;
      }
      // A case limited by `platforms` to other platforms has no expectation on this host (§2.1).
      if ("omitted" in exp || entry.expected !== exp.expected || entry.expected_source !== exp.source) otherExpectations.push(c.id);
    }
  }
  // Entries that are no case of the corpora carry an expectation that §2.1 does not give.
  for (const e of report.cases) if (!known.has(key(e.corpus, e.id))) otherExpectations.push(String(e.id));
  for (const e of report.not_applicable) if (!known.has(key(e.corpus, e.id))) naWithoutRule.push(String(e.id));

  problem("omits cases", omitted);
  problem("lists cases more than once", duplicated);
  problem("lists cases as not applicable without a rule", naWithoutRule);
  problem("replays cases that its mechanism excludes", excludedReplayed);
  problem("records expectations other than C002-IF-009 §2.1", otherExpectations);
  for (const [capability, cases] of lacking) problem(`replay host lacks ${capability}`, cases);

  // ERR-REL-001: every replayed case whose actual decision differs from its expected one, an error included.
  const differing = report.cases.filter((e) => e.actual !== e.expected).map((e) => String(e.id));
  if (differing.length > 0) refusals.push(refusal("ERR-REL-001", { target, "case ids": ids(differing), mechanism }));
  else if (typeof report.differing === "number" && report.differing > 0)
    refusals.push(refusal("ERR-REL-001", { target, "case ids": `${report.differing} cases (the report's differing count)`, mechanism }));

  return {
    refusals,
    applicable: report.cases.length,
    notApplicable: report.not_applicable.map((e) => String(e.id)),
    differing: Math.max(differing.length, typeof report.differing === "number" ? report.differing : 0),
  };
}

/** True when the report cites the corpora of the release commit (file and SHA-256). */
export function citesCorpora(report: ParsedReport, corpora: Record<CorpusName, Corpus>): boolean {
  return (["path", "shell"] as const).every((n) => report.corpora[n]?.file === corpora[n].file && report.corpora[n]?.sha256 === corpora[n].sha256);
}
