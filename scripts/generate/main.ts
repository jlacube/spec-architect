// Generator entry (C002-IF-004, C002-COMP-001, C002-ADR-003): options, the generation pipeline (tables,
// source reader, emitters, writer), the print forms and the exit codes. Bundled and run by
// scripts/generate.mjs; tests import `main` directly.
//   node scripts/generate.mjs [--target opencode|copilot]… [--source <plugin-dir>] [--out <dir>]
//                             [--mode <target>=<mode>]… [--json] [--quiet]
import { readdirSync } from "node:fs";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import { parseArgs } from "node:util";
import { VERSION } from "../../src/version.ts";
import { diagnostic, formatDiagnostic, sortDiagnostics, type Diagnostic } from "./diagnostics.ts";
import { TARGET_MODES, type Emitter, type TargetPackage } from "./model.ts";
import { readSource } from "./reader.ts";
import { loadTable, TableError, type MappingTable, type Mode, type Target } from "./tables.ts";
import { mergeTierDiagnostics, translateAgents } from "./translate/frontmatter.ts";
import { discard, fsOps, publish, targetDir, type WriteOps } from "./writer.ts";

const USAGE =
  "usage: node scripts/generate.mjs [--target opencode|copilot]… [--source <plugin-dir>] [--out <dir>] [--mode <target>=<mode>]… [--json] [--quiet]";
const SCHEMA_FILE = "mapping-table.schema.json";

/**
 * Until the emitters of C002-T-029 (OpenCode) and C002-T-031 (Copilot) exist, a package holds its manifest
 * only; the frontmatter translation (C002-IF-001 §3 step 4) already runs, so its diagnostics stop the run.
 */
const noFiles: Emitter = (input) => ({ files: new Map(), diagnostics: translateAgents(input).diagnostics });
export const EMITTERS: Record<Target, Emitter> = { opencode: noFiles, copilot: noFiles };

export interface MainOptions {
  /** Folder that relative `--source` and `--out` resolve against; default the process's working folder. */
  cwd?: string;
  stdout?: (line: string) => void;
  stderr?: (line: string) => void;
  /** Emitters per target (tests plant diagnostics or files); default EMITTERS. */
  emitters?: Partial<Record<Target, Emitter>>;
  /** File system operations of the writer (tests plant a write error); default the real ones. */
  ops?: WriteOps;
}

/** Exit codes of C002-IF-004. */
export const EXIT = { ok: 0, diagnostics: 1, usage: 2, write: 3 } as const;

interface TargetReport {
  target: Target;
  mode: Mode | null;
  mode_source: "table" | "override" | null;
  written: boolean;
  errors: number;
  files: number;
  out: string;
}

const byteOrder = (a: string, b: string) => Buffer.compare(Buffer.from(a, "utf8"), Buffer.from(b, "utf8"));

/** True when `child` is `parent` or lies inside it. */
function inside(parent: string, child: string): boolean {
  const r = relative(parent, child);
  return r === "" || (!r.startsWith("..") && !isAbsolute(r));
}

/** Target names of the tables under `<source>/targets/` (every `*.json` but the schema copy). */
function tableNames(source: string): string[] {
  try {
    return readdirSync(join(source, "targets"))
      .filter((n) => n.endsWith(".json") && n !== SCHEMA_FILE)
      .map((n) => n.slice(0, -".json".length))
      .sort(byteOrder);
  } catch {
    return [];
  }
}

/** Runs the generator; returns the exit code. */
export function main(argv: readonly string[], options: MainOptions = {}): number {
  const cwd = options.cwd ?? process.cwd();
  const stdout = options.stdout ?? ((l: string) => void process.stdout.write(l + "\n"));
  const stderr = options.stderr ?? ((l: string) => void process.stderr.write(l + "\n"));
  const ops = options.ops ?? fsOps;
  const usage = (message: string) => {
    stderr(`generate: ${message}`);
    stderr(USAGE);
    return EXIT.usage;
  };

  // --- Options (exit 2 on a usage error) ---
  let values: { target?: string[]; source?: string; out?: string; mode?: string[]; json?: boolean; quiet?: boolean };
  try {
    ({ values } = parseArgs({
      args: [...argv],
      options: {
        target: { type: "string", multiple: true },
        source: { type: "string" },
        out: { type: "string" },
        mode: { type: "string", multiple: true },
        json: { type: "boolean" },
        quiet: { type: "boolean" },
      },
      strict: true,
      allowPositionals: false,
    }));
  } catch (e) {
    return usage(e instanceof Error ? e.message : String(e));
  }
  const source = resolve(cwd, values.source ?? join("plugins", "architect"));
  const out = resolve(cwd, values.out ?? "dist");
  const display = (p: string) => (inside(cwd, p) ? relative(cwd, p) || "." : p).split(sep).join("/");

  const available = tableNames(source);
  if (available.length === 0) return usage(`no mapping table under ${display(join(source, "targets"))}/`);
  const unknown = (values.target ?? []).filter((t) => !available.includes(t));
  if (unknown.length > 0) return usage(`unknown target ${unknown.map((t) => `"${t}"`).join(", ")}; targets: ${available.join(", ")}`);
  // Names are checked against the tables present; a table whose `target` is not a known target fails its schema (ERR-GEN-004).
  const selected = [...new Set(values.target ?? available)].sort(byteOrder) as Target[];

  const overrides = new Map<Target, string>();
  for (const m of values.mode ?? []) {
    const match = /^([^=]+)=(.+)$/.exec(m);
    if (!match) return usage(`--mode "${m}" is not of the form <target>=<mode>`);
    const [, t, mode] = match as unknown as [string, Target, string];
    if (!available.includes(t)) return usage(`unknown target "${t}" in --mode; targets: ${available.join(", ")}`);
    if (!selected.includes(t)) return usage(`--mode names target "${t}", which is not selected`);
    overrides.set(t, mode);
  }

  const report = (diagnostics: Diagnostic[], written: Map<Target, number> | null, modes: Map<Target, { mode: Mode; source: "table" | "override" }>) => {
    const sorted = sortDiagnostics(diagnostics);
    const targets: TargetReport[] = selected.map((t) => ({
      target: t,
      mode: modes.get(t)?.mode ?? null,
      mode_source: modes.get(t)?.source ?? null,
      written: written !== null,
      errors: sorted.filter((d) => d.target === t).length,
      files: written?.get(t) ?? 0,
      out: display(targetDir(out, t)),
    }));
    if (values.json) {
      const diag = sorted.map((d) => ({
        severity: d.severity,
        code: d.code,
        file: d.file ?? null,
        line: d.line ?? null,
        target: d.target ?? null,
        construct: d.construct ?? null,
        message: d.message,
        fix: d.fix,
      }));
      stdout(JSON.stringify({ targets, diagnostics: diag }, null, 2));
      return;
    }
    for (const d of sorted) stderr(formatDiagnostic(d));
    if (values.quiet) return;
    for (const r of targets)
      stdout(r.written ? `${r.target}: written ${r.out}/ (${r.files} files, mode ${r.mode})` : `${r.target}: not written (${r.errors} errors)`);
  };

  // ERR-GEN-008: nothing is written or removed, since every path under <out> lies inside the source (C002-REQ-102).
  if (inside(source, out)) {
    report([diagnostic("ERR-GEN-008", `output folder ${display(out)} lies inside the source plugin ${display(source)}`)], null, new Map());
    return EXIT.diagnostics;
  }

  try {
    const diagnostics: Diagnostic[] = [];
    const tables = new Map<Target, MappingTable>();
    const modes = new Map<Target, { mode: Mode; source: "table" | "override" }>();
    for (const t of selected) {
      const file = `targets/${t}.json`;
      try {
        tables.set(t, loadTable(join(source, "targets", `${t}.json`), file));
      } catch (e) {
        if (!(e instanceof TableError)) throw e;
        for (const m of e.messages) diagnostics.push(diagnostic("ERR-GEN-004", m, { file, target: t }));
      }
      const override = overrides.get(t);
      const own = TARGET_MODES[t] as readonly string[] | undefined;
      if (override !== undefined) {
        if (own !== undefined && !own.includes(override)) diagnostics.push(diagnostic("ERR-GEN-009", `mode "${override}" is not an enforcement mode of ${t}`, { target: t }));
        else modes.set(t, { mode: override as Mode, source: "override" });
      } else {
        const table = tables.get(t);
        if (table) modes.set(t, { mode: table.enforcement_mode, source: "table" });
      }
    }

    const read = readSource(source);
    diagnostics.push(...read.diagnostics);

    const packages: TargetPackage[] = [];
    for (const t of selected) {
      const table = tables.get(t);
      const mode = modes.get(t);
      if (!table || !mode) continue;
      const emit = options.emitters?.[t] ?? EMITTERS[t] ?? noFiles;
      const result = emit({ source: read.source, table, target: t, mode: mode.mode });
      diagnostics.push(...result.diagnostics.map((d) => (d.target === undefined ? { ...d, target: t } : d)));
      packages.push({ target: t, mode: mode.mode, modeSource: mode.source, table, files: result.files });
    }

    // C002-INV-02: a run with any diagnostic keeps no selected package, an earlier one included.
    if (diagnostics.length > 0) {
      discard(out, selected, ops);
      report(mergeTierDiagnostics(diagnostics), null, modes);
      return EXIT.diagnostics;
    }

    const published = publish(out, packages, read.source.digest, VERSION, ops, display);
    if (!published.ok) {
      report([published.diagnostic], null, modes);
      return EXIT.write;
    }
    report([], new Map(Object.entries(published.files) as [Target, number][]), modes);
    return EXIT.ok;
  } catch (e) {
    discard(out, selected, ops);
    stderr(`generate: internal error: ${e instanceof Error ? (e.stack ?? e.message) : String(e)}; no target package was kept`);
    return EXIT.write;
  }
}
