// Corpus replay suite (C002-COMP-008, C002-T-040): the replay report of C002-IF-009 §2
// (`$defs/replayReport` of docs/releases/release-record.schema.json, the in-repository copy of the
// contract, C002-ADR-002), its validation, its completeness and where it is written.
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import Ajv2020, { type ValidateFunction } from "ajv/dist/2020.js";
import { repoRoot } from "../helpers.ts";
import type { Actual, Target } from "./adapter.ts";
import type { CorpusName, Decision, ExpectedSource, Mechanism, NotApplicableRule, Platform } from "./expect.ts";
import type { Dialect } from "../guards/fixture.ts";

export interface CorpusRef {
  file: string;
  cases: number;
  sha256: string;
}

export interface ReportCase {
  id: string;
  corpus: CorpusName;
  category: string;
  fed_as: { tool: string; caller: string; dialect?: Dialect; malformed: boolean };
  expected: Decision;
  expected_source: ExpectedSource;
  actual: Actual;
  detail?: string;
}

export interface NotApplicable {
  id: string;
  corpus: CorpusName;
  category: string;
  /** C002-REQ-626 (identity row) or `platforms` (the platform rule; C002-IF-009 §2.1, defect D-018 item 2). */
  rule: NotApplicableRule;
}

export interface ReplayReport {
  mechanism: Mechanism;
  target: Target;
  package_version: string;
  host_versions?: Record<string, string>;
  corpora: { path: CorpusRef; shell: CorpusRef };
  replay_host: { platform: Platform; capabilities: string[] };
  cases: ReportCase[];
  not_applicable: NotApplicable[];
  applicable: number;
  differing: number;
}

export const SCHEMA_FILE = "docs/releases/release-record.schema.json";

/** File (repository-relative with `/` when inside the repository), case count and SHA-256 of a corpus. */
export function corpusRef(file: string, cases: number): CorpusRef {
  const root = repoRoot().split("\\").join("/");
  const f = file.split("\\").join("/");
  const rel = f.toLowerCase().startsWith(root.toLowerCase() + "/") ? f.slice(root.length + 1) : f;
  return { file: rel, cases, sha256: createHash("sha256").update(readFileSync(file)).digest("hex") };
}

/** The source plugin version (C002-ADR-004), the default package version of a report. */
export function sourceVersion(): string {
  return (JSON.parse(readFileSync(join(repoRoot(), "plugins", "architect", ".claude-plugin", "plugin.json"), "utf8")) as { version: string }).version;
}

let validator: ValidateFunction | undefined;

/** Schema problems of a report against `$defs/replayReport` (empty when it validates). */
export function validateReport(report: unknown): string[] {
  if (!validator) {
    const schema = JSON.parse(readFileSync(join(repoRoot(), ...SCHEMA_FILE.split("/")), "utf8")) as { $id: string };
    const ajv = new Ajv2020({ allErrors: true, strict: false, validateFormats: false });
    ajv.addSchema(schema);
    validator = ajv.getSchema(`${schema.$id}#/$defs/replayReport`);
    if (!validator) throw new Error(`${SCHEMA_FILE} has no $defs/replayReport`);
  }
  if (validator(report)) return [];
  return (validator.errors ?? []).map((e) => `${e.instancePath || "/"} ${e.message ?? "invalid"}`);
}

/** Completeness (C002-REQ-627, C002-INV-14): every case ID of the corpora exactly once, under cases or not_applicable. */
export function completenessProblems(report: ReplayReport, ids: { path: string[]; shell: string[] }): string[] {
  const problems: string[] = [];
  const seen = new Map<string, number>();
  for (const e of [...report.cases, ...report.not_applicable]) seen.set(`${e.corpus}:${e.id}`, (seen.get(`${e.corpus}:${e.id}`) ?? 0) + 1);
  for (const corpus of ["path", "shell"] as const) {
    for (const id of ids[corpus]) {
      const n = seen.get(`${corpus}:${id}`) ?? 0;
      if (n !== 1) problems.push(`${id}: listed ${n} times`);
      seen.delete(`${corpus}:${id}`);
    }
  }
  for (const k of seen.keys()) problems.push(`${k.split(":")[1]}: not a case of the ${k.split(":")[0]} corpus`);
  if (report.applicable !== report.cases.length) problems.push(`applicable ${report.applicable} is not the ${report.cases.length} replayed cases`);
  const differing = report.cases.filter((c) => c.actual !== c.expected).length;
  if (report.differing !== differing) problems.push(`differing ${report.differing} is not the ${differing} differing cases`);
  return problems;
}

/** `docs/releases/<target>/<version>/replay-<mechanism>.json` (C002-IF-009 §1). */
export function releaseReportPath(target: Target, version: string, mechanism: Mechanism): string {
  return join(repoRoot(), "docs", "releases", target, version, `replay-${mechanism}.json`);
}

export function writeReport(report: ReplayReport, file: string): void {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(report, null, 2) + "\n");
}
