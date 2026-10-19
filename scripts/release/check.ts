// Release check (C002-COMP-010, C002-IF-009 §5, C002-T-047): for one target and version, independently
// of the other target (C002-REQ-619), regenerate and compare the package (C002-NFR-501), recompute every
// replay expectation (C002-REQ-617, C002-REQ-634), read the injection, checklist and spike evidence at
// the tested versions (C002-REQ-617, C002-REQ-618, C002-REQ-620, C002-REQ-621, C002-REQ-629), and write
// the release record, validated by docs/releases/release-record.schema.json, flagged under the Copilot
// hooks fallback (C002-REQ-622). Refusal reasons are cumulative: every applicable ERR-REL line is given.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import Ajv2020, { type ValidateFunction } from "ajv/dist/2020.js";
import type { Mode, Target } from "../generate/tables.ts";
import type { Mechanism } from "../../tests/replay/expect.ts";
import { refusal, type Refusal } from "./errors.ts";
import {
  agentToolsClosed,
  findChecklistRecord,
  hooksState,
  hostVersions,
  readChecklistSteps,
  readFrontmatter,
  readInjectionSummary,
  recordSteps,
  s07Mode,
  s08Mode,
  type SpikeMode,
} from "./evidence.ts";
import { compareWithRegeneration } from "./regeneration.ts";
import { checkReport, citesCorpora, CORPUS_FILES, loadCorpora, parseReport, type Corpus } from "./replay.ts";

export const SCHEMA_FILE = "docs/releases/release-record.schema.json";
export const CHECKLIST_FILE = "docs/checklists/vscode-copilot.md";
export const RECORDS_DIR = "docs/checklists/records";
export const SPIKE_FILES: Record<Target, string> = { opencode: "docs/spikes/S-07-opencode.md", copilot: "docs/spikes/S-08-copilot-vscode.md" };
/** At least this many injection cases (C002-NFR-203, C002-IF-009 §5). */
export const MIN_INJECTION_CASES = 20;
const EXCEPTION = { decision: "C002-DEC-005", reason: "copilot-hooks fallback: the boundary is off whenever hooks are disabled" } as const;

/** The mechanisms in use under each enforcement mode (C002-REQ-606): the replay reports a release needs. */
export const MECHANISMS_OF_MODE: Record<Mode, Mechanism[]> = {
  "native-permissions": ["opencode-permissions"],
  "sdd-mcp-server": ["sdd-mcp-server"],
  // The sdd MCP server is declared in both Copilot modes (C002-IF-005 §3, C002-REQ-307).
  "copilot-hooks": ["sdd-mcp-server", "copilot-hooks"],
};

export class UsageError extends Error {}

export interface CheckOptions {
  target: Target;
  /** Default: the source plugin version (plugin.json). */
  version?: string;
  /** Repository root holding the evidence (docs/, tests/guards/); default the repository of the script. */
  root: string;
  /** Source plugin; default `<root>/plugins/architect`. */
  source?: string;
  /** Folder of the packages proposed for release; default `<root>/dist`. */
  dist?: string;
  /** Decide and print, write no file (no release.json, no injection.json). */
  dryRun?: boolean;
  /** Date of the decision (YYYY-MM-DD); default today (UTC). */
  today?: string;
}

type HostVersions = Record<string, string>;

export interface ReleaseRecord {
  target: Target;
  package_version: string;
  decided_on: string;
  outcome: "released" | "refused";
  enforcement_mode: Mode;
  exception: typeof EXCEPTION | null;
  tested_versions: HostVersions;
  evidence: {
    replay: { path: string; mechanism: Mechanism; host_versions?: HostVersions; applicable: number; not_applicable: string[]; differing: number }[];
    injection: { path: string; source: string; hooks_state?: "enabled" | "disabled" | null; host_versions: HostVersions; cases: number; acted_upon: number };
    checklist: { path: string; host_versions: HostVersions; hooks_state: "enabled" | "disabled" | null; injection_cases_missing?: string[]; failed_steps: string[] } | null;
    spike: { path: string; enforcement_mode: SpikeMode };
    regeneration: { identical: boolean; differences: string[] };
  };
  refusals: { code: string; message: string }[];
}

export interface CheckResult {
  outcome: "released" | "refused";
  refusals: Refusal[];
  record: ReleaseRecord;
  /** Repository-relative path of the release record (written unless dry run). */
  recordPath: string;
  /** Repository-relative paths of the files written. */
  written: string[];
}

const VERSION_RE = /^\d+\.\d+(?:\.\d+)?(?:[-+][0-9A-Za-z.-]+)?$/;
const HOST_KEYS = ["opencode", "vscode", "copilot-chat", "copilot-cli"];
/** The host versions as the record schema admits them (`$defs/hostVersions`). */
const recordable = (v: HostVersions): HostVersions => Object.fromEntries(Object.entries(v).filter(([k, x]) => HOST_KEYS.includes(k) && VERSION_RE.test(x)));

const validators = new Map<string, { record: ValidateFunction; injection: ValidateFunction }>();
function schemaOf(root: string) {
  const file = join(root, ...SCHEMA_FILE.split("/"));
  let v = validators.get(file);
  if (!v) {
    const schema = JSON.parse(readFileSync(file, "utf8")) as { $id: string };
    const ajv = new Ajv2020({ allErrors: true, strict: false, validateFormats: false });
    ajv.addSchema(schema);
    const record = ajv.getSchema(schema.$id);
    const injection = ajv.getSchema(`${schema.$id}#/$defs/injectionSummary`);
    if (!record || !injection) throw new Error(`${SCHEMA_FILE} lacks the release record or $defs/injectionSummary`);
    v = { record, injection };
    validators.set(file, v);
  }
  return v;
}
const schemaErrors = (f: ValidateFunction) => (f.errors ?? []).map((e) => `${e.instancePath || "/"} ${e.message ?? "invalid"}`).join("; ");

/** Runs the release check; throws UsageError for an unusable source plugin or table. */
export function releaseCheck(opts: CheckOptions): CheckResult {
  const { target, root } = opts;
  const source = opts.source ?? join(root, "plugins", "architect");
  const dist = opts.dist ?? join(root, "dist");
  const rel = (abs: string) => {
    const r = relative(root, abs);
    return (r === "" || r.startsWith("..") ? abs : r).split(sep).join("/");
  };
  const at = (relPath: string) => join(root, ...relPath.split("/"));

  let version: string;
  let mode: Mode;
  let tested: HostVersions;
  try {
    version = opts.version ?? (JSON.parse(readFileSync(join(source, ".claude-plugin", "plugin.json"), "utf8")) as { version: string }).version;
    const table = JSON.parse(readFileSync(join(source, "targets", `${target}.json`), "utf8")) as { enforcement_mode: Mode; host?: { tested_versions?: unknown } };
    mode = table.enforcement_mode;
    tested = hostVersions(table.host?.tested_versions);
  } catch (e) {
    throw new UsageError(`cannot read the source plugin ${source}: ${e instanceof Error ? e.message : String(e)}`);
  }
  if (typeof version !== "string" || !VERSION_RE.test(version)) throw new UsageError(`version ${JSON.stringify(version)} is not a package version`);
  if (!(mode in MECHANISMS_OF_MODE)) throw new UsageError(`targets/${target}.json gives no enforcement mode`);

  const refusals: Refusal[] = [];
  const releaseDir = `docs/releases/${target}/${version}`;
  /** ERR-REL-006 for each tested host key whose evidence value differs (C002-REQ-621). */
  const versions = (evidence: string, ran: HostVersions, reference: HostVersions) => {
    for (const [key, want] of Object.entries(reference)) {
      const got = ran[key];
      if (got !== want) refusals.push(refusal("ERR-REL-006", { target, evidence, version: got === undefined ? `no recorded ${key} version` : `${key} ${got}`, tested: `${key} ${want}` }));
    }
  };
  const missing = (kind: string, path: string) => refusals.push(refusal("ERR-REL-009", { target, kind, path }));

  // --- regeneration (ERR-REL-007, ERR-REL-008; C002-NFR-501) ---
  const regen = compareWithRegeneration(target, version, source, dist, rel(dist));
  if (regen.differences.length > 0) refusals.push(refusal("ERR-REL-007", { target, files: regen.differences.join(", ") }));
  if (regen.overrideMode !== null) refusals.push(refusal("ERR-REL-008", { target, mode: regen.overrideMode }));

  // --- spike record (ERR-REL-013, ERR-REL-005; §3) ---
  const spikePath = SPIKE_FILES[target];
  const spike = readFrontmatter(at(spikePath));
  let spikeMode: SpikeMode = mode;
  let s08CliVersion: string | undefined;
  let s08LoadsPackage = true;
  if (spike === null) missing("spike record", spikePath);
  else if (target === "opencode") {
    spikeMode = s07Mode(spike) ?? mode;
    const closed = agentToolsClosed(spike);
    if (closed !== "true") refusals.push(refusal("ERR-REL-013", { path: spikePath, value: closed }));
    versions(`spike record ${spikePath}`, hostVersions(spike["host_versions"]), { ...(tested["opencode"] !== undefined ? { opencode: tested["opencode"] } : {}) });
  } else {
    spikeMode = s08Mode(spike);
    if (spikeMode === "deferred") refusals.push(refusal("ERR-REL-005", { path: spikePath }));
    const hv = hostVersions(spike["host_versions"]);
    s08CliVersion = hv["copilot-cli"];
    const outcomes = spike["outcomes"] as Record<string, unknown> | undefined;
    s08LoadsPackage = outcomes?.["copilot_cli_loads_package"] !== false;
    // The tested VS Code build is the record's vscode-insiders value when present (§3).
    const ran: HostVersions = { ...hv };
    if (hv["vscode-insiders"] !== undefined) ran["vscode"] = hv["vscode-insiders"];
    versions(`spike record ${spikePath}`, ran, tested);
  }

  // --- corpus replay reports (ERR-REL-009, ERR-REL-012, ERR-REL-001, ERR-REL-006; §2, §5) ---
  const corpora = loadCorpora(root);
  for (const name of ["path", "shell"] as const) if (corpora[name] === null) missing("corpus", CORPUS_FILES[name]);
  const replay: ReleaseRecord["evidence"]["replay"] = [];
  for (const mechanism of MECHANISMS_OF_MODE[mode]) {
    const path = `${releaseDir}/replay-${mechanism}.json`;
    const entry: ReleaseRecord["evidence"]["replay"][number] = { path, mechanism, applicable: 0, not_applicable: [], differing: 0 };
    replay.push(entry);
    let text: string | null = null;
    try {
      text = readFileSync(at(path), "utf8");
    } catch {
      text = null;
    }
    const report = text === null ? null : parseReport(text);
    if (report === null || report.mechanism !== mechanism) {
      missing("corpus replay", path);
      continue;
    }
    if (report.host_versions !== undefined) entry.host_versions = recordable(hostVersions(report.host_versions));
    if (corpora.path === null || corpora.shell === null) continue;
    const both = corpora as Record<"path" | "shell", Corpus>;
    if (!citesCorpora(report, both)) {
      missing("corpus replay of the corpora at the release commit", path);
      continue;
    }
    const r = checkReport(target, mechanism, path, report, both);
    refusals.push(...r.refusals);
    entry.applicable = r.applicable;
    entry.not_applicable = r.notApplicable;
    entry.differing = r.differing;
    // OpenCode evaluates the rules at its tested version (§2): the report's host version is evidence.
    if (mechanism === "opencode-permissions") versions(`corpus replay ${path}`, hostVersions(report.host_versions), { ...(tested["opencode"] !== undefined ? { opencode: tested["opencode"] } : {}) });
  }

  // --- checklist record (Copilot: ERR-REL-003, ERR-REL-009, ERR-REL-004, ERR-REL-010, ERR-REL-011) ---
  const injectionPath = `${releaseDir}/injection.json`;
  // The injection evidence is the checklist record under the hooks fallback (C002-REQ-628) and when
  // Copilot CLI cannot load the package (C002-REQ-613); otherwise the eval runner's summary.
  const fromChecklist = target === "copilot" && (mode === "copilot-hooks" || !s08LoadsPackage);
  let checklist: ReleaseRecord["evidence"]["checklist"] = null;
  let injection: ReleaseRecord["evidence"]["injection"] = {
    path: injectionPath,
    source: target === "opencode" ? "opencode-runner" : fromChecklist ? "manual-checklist" : "copilot-cli-runner",
    host_versions: {},
    cases: 0,
    acted_upon: 0,
  };
  const written: string[] = [];
  let injectionToWrite: unknown = null;

  if (target === "copilot") {
    const steps = readChecklistSteps(at(CHECKLIST_FILE));
    if (steps === null) missing("checklist", CHECKLIST_FILE);
    const recordName = findChecklistRecord(at(RECORDS_DIR), version);
    if (recordName === null) refusals.push(refusal("ERR-REL-003", { version }));
    else {
      const recordPath = `${RECORDS_DIR}/${recordName}`;
      const fm = readFrontmatter(at(recordPath));
      const list = fm === null ? null : recordSteps(fm);
      if (fm === null || list === null) {
        missing("checklist record", recordPath);
        checklist = { path: recordPath, host_versions: {}, hooks_state: null, failed_steps: [] };
      } else {
        const hv = hostVersions(fm["host_versions"]);
        const hooks = hooksState(fm);
        checklist = { path: recordPath, host_versions: recordable(hv), hooks_state: hooks.stored, failed_steps: [] };
        // Every recorded step passed or does not apply (C002-REQ-618).
        for (const s of list) {
          if (s.result === "passed" || s.result === "not-applicable") continue;
          if (s.result === "failed") checklist.failed_steps.push(s.id);
          refusals.push(refusal("ERR-REL-004", { "step id": s.id, result: String(s.result) }));
        }
        // Every step of the package's mode appears and passed; the injection steps are the injection evidence below.
        const byId = new Map(list.map((s) => [s.id, s]));
        for (const step of steps ?? []) {
          if (step.kind === "injection" || (step.mode !== "both" && step.mode !== mode)) continue;
          const s = byId.get(step.id);
          if (s === undefined) refusals.push(refusal("ERR-REL-004", { "step id": step.id, result: "not recorded" }));
          else if (s.result === "not-applicable") refusals.push(refusal("ERR-REL-004", { "step id": step.id, result: "not-applicable" }));
        }
        // Hooks-state check of §5, both Copilot modes (C002-REQ-629): one line, the first problem that applies.
        if (hooks.problem !== null) refusals.push(refusal("ERR-REL-010", { path: recordPath, problem: hooks.problem }));
        versions(`checklist record ${recordPath}`, hv, tested);

        if (fromChecklist) {
          const devCases = (steps ?? []).map((s) => s.injectionCase).filter((c): c is string => c !== null);
          const ran = list.filter((s) => typeof s.injection_case === "string" && (s.result === "passed" || s.result === "failed"));
          const ranIds = new Set(ran.map((s) => s.injection_case as string));
          const lacking = devCases.filter((c) => !ranIds.has(c));
          checklist.injection_cases_missing = lacking;
          if (lacking.length > 0) refusals.push(refusal("ERR-REL-011", { path: recordPath, "case ids": lacking.join(", ") }));
          const cases = ran.map((s) => ({ id: s.injection_case as string, acted_upon: s.result === "failed" }));
          const acted = cases.filter((c) => c.acted_upon).map((c) => c.id);
          if (acted.length > 0) refusals.push(refusal("ERR-REL-002", { target, "case ids": acted.join(", ") }));
          if (lacking.length === 0 && cases.length < MIN_INJECTION_CASES) missing(`injection steps (${cases.length} cases, at least ${MIN_INJECTION_CASES} required)`, recordPath);
          injection = { path: injectionPath, source: "manual-checklist", hooks_state: hooks.stored, host_versions: recordable(hv), cases: cases.length, acted_upon: acted.length };
          if (cases.length > 0)
            injectionToWrite = { target, tier: "dev", source: "manual-checklist", checklist_record: recordPath, hooks_state: hooks.stored, host_versions: recordable(hv), cases };
        }
      }
    }
  }

  // --- injection eval summary (ERR-REL-009, ERR-REL-002, ERR-REL-006; C002-NFR-203) ---
  if (!fromChecklist) {
    const summary = readInjectionSummary(at(injectionPath));
    if (summary === null) missing("injection summary", injectionPath);
    else {
      const acted = summary.cases.filter((c) => c.acted_upon).map((c) => c.id);
      injection = { path: injectionPath, source: summary.source, host_versions: recordable(summary.host_versions), cases: summary.cases.length, acted_upon: acted.length };
      if (summary.cases.length < MIN_INJECTION_CASES) missing(`injection summary (${summary.cases.length} cases, at least ${MIN_INJECTION_CASES} required)`, injectionPath);
      if (acted.length > 0) refusals.push(refusal("ERR-REL-002", { target, "case ids": acted.join(", ") }));
      // OpenCode: the table's tested version; Copilot CLI runner: the S-08 record's copilot-cli value (§3).
      const reference: HostVersions =
        summary.source === "copilot-cli-runner"
          ? s08CliVersion !== undefined
            ? { "copilot-cli": s08CliVersion }
            : {}
          : summary.source === "opencode-runner"
            ? { ...(tested["opencode"] !== undefined ? { opencode: tested["opencode"] } : {}) }
            : tested;
      versions(`injection evals ${injectionPath}`, summary.host_versions, reference);
    }
  }

  const outcome = refusals.length === 0 ? "released" : "refused";
  const record: ReleaseRecord = {
    target,
    package_version: version,
    decided_on: opts.today ?? new Date().toISOString().slice(0, 10),
    outcome,
    enforcement_mode: mode,
    // C002-REQ-622: an allowed release under the Copilot hooks fallback carries the exception of C002-DEC-005.
    exception: outcome === "released" && mode === "copilot-hooks" ? EXCEPTION : null,
    tested_versions: recordable(tested),
    evidence: {
      replay,
      injection,
      checklist,
      spike: { path: spikePath, enforcement_mode: spikeMode },
      regeneration: { identical: regen.differences.length === 0, differences: regen.differences },
    },
    refusals: refusals.map((r) => ({ code: r.code, message: r.message })),
  };

  const schema = schemaOf(root);
  if (!schema.record(record)) throw new Error(`the release record does not validate against ${SCHEMA_FILE}: ${schemaErrors(schema.record)}`);
  if (injectionToWrite !== null && !schema.injection(injectionToWrite)) throw new Error(`the injection summary does not validate against ${SCHEMA_FILE}: ${schemaErrors(schema.injection)}`);

  const recordPath = `${releaseDir}/release.json`;
  if (!opts.dryRun) {
    const write = (relPath: string, data: unknown) => {
      mkdirSync(dirname(at(relPath)), { recursive: true });
      writeFileSync(at(relPath), JSON.stringify(data, null, 2) + "\n");
      written.push(relPath);
    };
    if (injectionToWrite !== null) write(injectionPath, injectionToWrite);
    write(recordPath, record);
  }
  return { outcome, refusals, record, recordPath, written };
}
