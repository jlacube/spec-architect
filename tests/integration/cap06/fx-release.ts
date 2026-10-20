// fx-release (test plan §3, C002-T-047): the release-check fixture. A package variant is a copy of the
// source plugin with its version and the target's table (enforcement mode, tested versions) set, generated
// into its own dist/ with the target zip, as `npm run package` does (C002-T-034). An evidence root holds
// what the release check reads per Examples row: the corpora of the release commit, the record schema
// copy, the manual VS Code checklist, the spike records, the replay reports (clean by default, built from
// the rules of tests/replay/expect.ts), the injection summary and the checklist record. C002-T-064: an
// evidence root may add cases to its path corpus and replace the checklist (the step indexes of
// C002-TC-668 and C002-TC-669); its clean reports then cite and replay the root's corpora. C002-T-065:
// the cases PG-900 (category outside) and PG-901 (category memory), both limited by `platforms` to
// `posix` (C002-TC-637, C002-TC-682, C002-TC-683): the clean reports list PG-900 under not_applicable
// with the rule `platforms` and replay PG-901 with deny (C002-REQ-625); and fx-release-no-platforms
// (`noPlatforms`), whose corpora hold no `platforms` list (C002-TC-683).
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { stringify } from "yaml";
import { main as generate } from "../../../scripts/generate/main.ts";
import type { Mode, Target } from "../../../scripts/generate/tables.ts";
import { zipDir } from "../../../scripts/package.mjs";
import { MECHANISMS_OF_MODE } from "../../../scripts/release/check.ts";
import { readChecklistSteps } from "../../../scripts/release/evidence.ts";
import { CORPUS_FILES, loadCorpora } from "../../../scripts/release/replay.ts";
import { callerOf, expectationOf, type AnyCase, type Mechanism } from "../../replay/expect.ts";
import { repoRoot } from "../../helpers.ts";

export const ROOT = repoRoot();
export const FX_VERSION = "0.3.0";
export const RECORD_NAME = `vscode-2026-11-20-${FX_VERSION}.md`;
export const RECORD_PATH = `docs/checklists/records/${RECORD_NAME}`;
export const TODAY = "2026-11-21";
export const REAL_TESTED: Record<Target, Record<string, string>> = {
  opencode: { opencode: "1.18.31" },
  copilot: { vscode: "1.142.0-insider", "copilot-chat": "0.35.3" },
};
export const COPILOT_CLI = "1.0.98";

type Json = Record<string, unknown>;

/** Base folder of one test file's fixtures; removed by `cleanup`. */
const BASE = mkdtempSync(join(tmpdir(), "sdd-fx-release-"));
export function cleanup(): void {
  rmSync(BASE, { recursive: true, force: true });
}

export interface Variant {
  target: Target;
  mode: Mode;
  tested?: Record<string, string>;
}
export interface Package {
  source: string;
  dist: string;
  tested: Record<string, string>;
}

const variants = new Map<string, Package>();
let serial = 0;

/** The package variant, built once per process: source copy, dist/<target>/ and dist/architect-<target>-0.3.0.zip. */
export function packageVariant(v: Variant): Package {
  const tested = v.tested ?? REAL_TESTED[v.target];
  const key = JSON.stringify([v.target, v.mode, tested]);
  const known = variants.get(key);
  if (known) return known;
  const dir = join(BASE, `pkg-${++serial}`);
  const source = join(dir, "plugins", "architect");
  cpSync(join(ROOT, "plugins", "architect"), source, { recursive: true });
  const manifest = join(source, ".claude-plugin", "plugin.json");
  writeFileSync(manifest, JSON.stringify({ ...(JSON.parse(readFileSync(manifest, "utf8")) as Json), version: FX_VERSION }, null, 2) + "\n");
  const tableFile = join(source, "targets", `${v.target}.json`);
  const table = JSON.parse(readFileSync(tableFile, "utf8")) as { enforcement_mode: string; host: { tested_versions: Record<string, string> } };
  table.enforcement_mode = v.mode;
  table.host.tested_versions = tested;
  writeFileSync(tableFile, JSON.stringify(table, null, 2) + "\n");
  const dist = join(dir, "dist");
  const err: string[] = [];
  const code = generate(["--target", v.target, "--source", source, "--out", dist, "--quiet"], { stdout: () => undefined, stderr: (l) => void err.push(l) });
  if (code !== 0) throw new Error(`fx-release: generating ${key} failed (${code}): ${err.join("\n")}`);
  zipDir(join(dist, v.target), join(dist, `architect-${v.target}-${FX_VERSION}.zip`));
  const pkg = { source, dist, tested };
  variants.set(key, pkg);
  return pkg;
}

// --- evidence ------------------------------------------------------------------------------------

export interface ReportCaseJson {
  id: string;
  corpus: "path" | "shell";
  category: string;
  fed_as: { tool: string; caller: string; malformed: boolean };
  expected: string;
  expected_source: string;
  actual: string;
  detail?: string;
}
export interface ReportJson {
  mechanism: Mechanism;
  target: Target;
  package_version: string;
  host_versions?: Record<string, string>;
  corpora: Json;
  replay_host: { platform: "win32" | "posix"; capabilities: string[] };
  cases: ReportCaseJson[];
  not_applicable: { id: string; corpus: "path" | "shell"; category: string; rule: string }[];
  applicable: number;
  differing: number;
}

const corpora = loadCorpora(ROOT);

/**
 * The fx-release cases of the platform rule (C002-TS-637, C002-TS-682, C002-TS-683; defect D-018 item 2,
 * critic CR-66): PG-900, category outside, falls to the last row of C002-IF-009 §2.1 and is not applicable
 * on the win32 replay host (rule `platforms`); PG-901, category memory, is limited the same way but keeps
 * the memory row's deny (C002-REQ-625) on every host.
 */
export const PG_900: AnyCase = { id: "PG-900", category: "outside", tool: "Write", agent: "architect:sdd-spec-writer", path: "{repo}/src/posix-only.ts", expect: "deny", platforms: ["posix"] } as unknown as AnyCase;
export const PG_901: AnyCase = { id: "PG-901", category: "memory", tool: "Write", agent: "architect:sdd-cartographer", path: "{repo}/.claude/agent-memory/architect-sdd-cartographer/POSIX.md", expect: "allow", platforms: ["posix"] } as unknown as AnyCase;

/**
 * A clean replay report of `mechanism`: every case with the expectation of §2.1, actual = expected, host
 * win32 with file-symlink; the identity cases and the cases of the platform rule under not_applicable with
 * their rule. `cs`: the corpora the report cites (default: the repository's).
 */
export function cleanReport(target: Target, mechanism: Mechanism, tested: Record<string, string>, cs: ReturnType<typeof loadCorpora> = corpora): ReportJson {
  const report: ReportJson = {
    mechanism,
    target,
    package_version: FX_VERSION,
    corpora: {},
    replay_host: { platform: "win32", capabilities: ["file-symlink"] },
    cases: [],
    not_applicable: [],
    applicable: 0,
    differing: 0,
  };
  if (mechanism === "opencode-permissions") report.host_versions = { opencode: tested["opencode"] ?? "" };
  for (const name of ["path", "shell"] as const) {
    const corpus = cs[name];
    if (corpus === null) throw new Error(`fx-release: corpus ${name} unreadable`);
    report.corpora[name] = { file: corpus.file, cases: corpus.cases.length, sha256: corpus.sha256 };
    for (const c of corpus.cases as AnyCase[]) {
      const exp = expectationOf(c, mechanism, "win32", name);
      if (!exp.applicable) report.not_applicable.push({ id: c.id, corpus: name, category: c.category, rule: exp.rule });
      else report.cases.push({ id: c.id, corpus: name, category: c.category, fed_as: { tool: c.tool ?? "write", caller: callerOf(c, mechanism), malformed: exp.malformed }, expected: exp.expected, expected_source: exp.source, actual: exp.expected });
    }
  }
  return recount(report);
}

/** Sets `applicable` and `differing` from the cases. */
export function recount(r: ReportJson): ReportJson {
  r.applicable = r.cases.length;
  r.differing = r.cases.filter((c) => c.actual !== c.expected).length;
  return r;
}

export function caseOf(r: ReportJson, id: string): ReportCaseJson {
  const c = r.cases.find((x) => x.id === id);
  if (!c) throw new Error(`fx-release: ${id} is not a replayed case of the ${r.mechanism} report`);
  return c;
}

export interface ChecklistOptions {
  /** Frontmatter fields set or removed (undefined removes) after the defaults. */
  fields?: Record<string, unknown>;
  /** Injection steps: all passed, absent, not-applicable, or one failed. */
  injection?: "passed" | "absent" | "not-applicable" | { failed: string };
  /** Step IDs recorded as failed. */
  failed?: string[];
  host_versions?: Record<string, string>;
}

const CHECKLIST_STEPS = readChecklistSteps(join(ROOT, "docs", "checklists", "vscode-copilot.md")) ?? [];

/** Checklist record frontmatter for the package's mode: hooks enabled with on, trusted, none; every step of the mode passed. */
export function checklistRecord(mode: Mode, tested: Record<string, string>, o: ChecklistOptions = {}): string {
  const injection = o.injection ?? (mode === "copilot-hooks" ? "passed" : "not-applicable");
  const steps: Json[] = [];
  for (const s of CHECKLIST_STEPS) {
    if (s.kind === "injection") {
      if (injection === "absent") continue;
      const failed = typeof injection === "object" && injection.failed === s.injectionCase;
      steps.push({ id: s.id, result: failed ? "failed" : injection === "not-applicable" ? "not-applicable" : "passed", injection_case: s.injectionCase });
      continue;
    }
    const applies = s.mode === "both" || s.mode === mode;
    steps.push({ id: s.id, result: o.failed?.includes(s.id) ? "failed" : applies ? "passed" : "not-applicable" });
  }
  const fm: Json = {
    checklist: "docs/checklists/vscode-copilot.md",
    date: "2026-11-20",
    package_version: FX_VERSION,
    host_versions: o.host_versions ?? { vscode: tested["vscode"], "copilot-chat": tested["copilot-chat"] },
    session_type: "Local",
    enforcement_mode: mode,
    hooks_state: "enabled",
    hooks_sources: { use_hooks: "on", workspace_trust: "trusted", policy: "none" },
    executed_by: "P-01",
    steps,
  };
  for (const [k, v] of Object.entries(o.fields ?? {})) {
    if (v === undefined) delete fm[k];
    else fm[k] = v;
  }
  return `---\n${stringify(fm)}---\n\n# Checklist record (fx-release)\n`;
}

export function s07Record(mode: Mode, tested: Record<string, string>, outcomes: Record<string, unknown> = {}): string {
  const o: Json = { edit_rules_match_path_corpus: mode === "native-permissions", bash_rules_match_shell_corpus: mode === "native-permissions", question_answerable_by_script: true, post_write_feedback_channel: true, agent_tools_closed: true, ...outcomes };
  for (const [k, v] of Object.entries(o)) if (v === undefined) delete o[k];
  const fm = { spike: "S-07", target: "opencode", date: "2026-10-18", host_versions: { opencode: tested["opencode"], "opencode-sdk": tested["opencode"] }, outcomes: o, cmd_shims: [], enforcement_mode: mode };
  return `---\n${stringify(fm)}---\n\n# S-07 (fx-release)\n`;
}

/** S-08 frontmatter; the outcomes default to those that give `mode` by the S-08 rule. */
export function s08Record(mode: Mode, tested: Record<string, string>, outcomes?: Record<string, unknown>): string {
  const o: Json = outcomes ?? (mode === "copilot-hooks" ? { subagent_tool_list_confined: false, guard_hooks_block_subagent_calls: true } : { subagent_tool_list_confined: true });
  const fm = {
    spike: "S-08",
    target: "copilot",
    date: "2026-10-17",
    host_versions: { "vscode-insiders": tested["vscode"], vscode: "1.108.0", copilot: "1.388.0", "copilot-chat": tested["copilot-chat"], "copilot-cli": COPILOT_CLI },
    outcomes: { ...o, agent_hooks_block_subagent_calls: false, copilot_cli_loads_package: true, terminal_dialect: "powershell" },
    cmd_shims: [],
    enforcement_mode: mode === "copilot-hooks" ? "copilot-hooks" : "sdd-mcp-server",
  };
  return `---\n${stringify(fm)}---\n\n# S-08 (fx-release)\n`;
}

/** An injection summary of `n` cases (INJ-01 …), those of `acted` acted upon. */
export function injectionSummary(target: Target, source: string, host_versions: Record<string, string>, n = 20, acted: string[] = []): Json {
  const cases = Array.from({ length: n }, (_, i) => `INJ-${String(i + 1).padStart(2, "0")}`).map((id) => ({ id, acted_upon: acted.includes(id) }));
  return { target, tier: "dev", source, host_versions, cases };
}

export interface Evidence {
  variant: Variant;
  /** Replay report per mechanism in use; a mechanism mapped to null has no report. */
  reports?: Partial<Record<Mechanism, ReportJson | null>>;
  /** Changes applied to the clean reports. */
  mutate?: Partial<Record<Mechanism, (r: ReportJson) => void>>;
  /** Injection summary; null for none. Default: 20 clean cases of the target's runner. */
  injection?: Json | null;
  /** Checklist record text (Copilot); null for none. Default: every step of the mode passed, hooks enabled. */
  checklist?: string | null;
  s07?: string | null;
  s08?: string | null;
  /** An existing evidence root to add this target's evidence to (C002-TS-622). */
  into?: string;
  /** Cases appended to the root's path corpus (C002-TC-637: PG-900, PG-901); the clean reports cite that corpus. */
  pathCases?: AnyCase[];
  /** fx-release-no-platforms (C002-TC-683): the root's corpora hold no `platforms` list. */
  noPlatforms?: boolean;
  /** The text of `docs/checklists/vscode-copilot.md` in the root (C002-TC-668, C002-TC-669); null for none. */
  checklistFile?: string | null;
}

/** An evidence root for one Examples row, with the package variant it is checked against. */
export function evidenceRoot(e: Evidence): { root: string; pkg: Package } {
  const { target, mode } = e.variant;
  const pkg = packageVariant(e.variant);
  const root = e.into ?? join(BASE, `root-${++serial}`);
  const put = (rel: string, data: string | Json) => {
    const file = join(root, ...rel.split("/"));
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, typeof data === "string" ? data : JSON.stringify(data, null, 2) + "\n");
  };
  for (const f of Object.values(CORPUS_FILES)) put(f, readFileSync(join(ROOT, ...f.split("/")), "utf8"));
  if (e.pathCases?.length || e.noPlatforms) {
    const corpus = JSON.parse(readFileSync(join(ROOT, ...CORPUS_FILES.path.split("/")), "utf8")) as { cases: AnyCase[] };
    corpus.cases.push(...(e.pathCases ?? []));
    if (e.noPlatforms) for (const c of corpus.cases) delete (c as { platforms?: unknown }).platforms;
    put(CORPUS_FILES.path, corpus as unknown as Json);
  }
  const rootCorpora = loadCorpora(root);
  put("docs/releases/release-record.schema.json", readFileSync(join(ROOT, "docs", "releases", "release-record.schema.json"), "utf8"));
  const checklistText = e.checklistFile === undefined ? readFileSync(join(ROOT, "docs", "checklists", "vscode-copilot.md"), "utf8") : e.checklistFile;
  if (checklistText !== null) put("docs/checklists/vscode-copilot.md", checklistText);
  if (target === "opencode") {
    const s07 = e.s07 === undefined ? s07Record(mode, pkg.tested) : e.s07;
    if (s07 !== null) put("docs/spikes/S-07-opencode.md", s07);
  } else {
    const s08 = e.s08 === undefined ? s08Record(mode, pkg.tested) : e.s08;
    if (s08 !== null) put("docs/spikes/S-08-copilot-vscode.md", s08);
  }
  const dir = `docs/releases/${target}/${FX_VERSION}`;
  for (const m of MECHANISMS_OF_MODE[mode]) {
    const given = e.reports?.[m];
    if (given === null) continue;
    const r = given ?? cleanReport(target, m, pkg.tested, rootCorpora);
    e.mutate?.[m]?.(r);
    put(`${dir}/replay-${m}.json`, r as unknown as Json);
  }
  const injection =
    e.injection === undefined
      ? target === "opencode"
        ? injectionSummary("opencode", "opencode-runner", { opencode: pkg.tested["opencode"] ?? "" })
        : injectionSummary("copilot", "copilot-cli-runner", { "copilot-cli": COPILOT_CLI })
      : e.injection;
  if (injection !== null) put(`${dir}/injection.json`, injection);
  if (target === "copilot") {
    const record = e.checklist === undefined ? checklistRecord(mode, pkg.tested) : e.checklist;
    if (record !== null) put(RECORD_PATH, record);
  }
  return { root, pkg };
}
