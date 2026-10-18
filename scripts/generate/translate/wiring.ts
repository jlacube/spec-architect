// Wiring variants (C002-COMP-001, C002-COMP-002; C002-IF-001 §3 steps 2 and 3, §4): each wiring anchor of
// an agent, command or skill body is replaced by the target's variant kept under
// `plugins/architect/targets/<target>/wiring/` (C002-REQ-111, C002-REQ-113). An anchor is a section (a
// heading and its content, up to the next heading of the same or a higher level) or a block of lines
// matched exactly after trailing-space removal. The tokens of §4 are resolved in the variant text
// (ERR-GEN-006). A variant whose anchor is not in its source file is ERR-GEN-005; the coverage check then
// reports every wiring anchor that no variant of this target replaced as ERR-GEN-002 with file, line and
// target (C002-REQ-112): each "Claude Code wiring" heading, each line a `variant_required` detector
// matches, and each anchor that a variants entry of any generated target's table names. The table's
// variant rules of §5 (text file present, unique ids, no overlapping anchors) are ERR-GEN-004.
// The source files are only read; their text is never changed (C002-CON-10).
import { VERSION } from "../../../src/version.ts";
import { diagnostic, type Diagnostic } from "../diagnostics.ts";
import type { EmitInput, SourceDoc, SourceFile, SourcePlugin } from "../model.ts";
import type { MappingTable, Mode, Target } from "../tables.ts";

/** The heading of the wiring sections of the source plugin (C002-IF-001 §3 step 3). */
export const WIRING_SECTION = "Claude Code wiring";

export type Variant = MappingTable["variants"][number];

/** One body line after the variant pass: its text and where it comes from. */
export interface WiredLine {
  text: string;
  /** 1-based line of the source file; for a variant line, the first line of the anchor it replaces. */
  line: number;
  /** File and line that diagnostics name: the source file, or the variant file for a variant line. */
  origin: { file: string; line: number };
  /** Id of the variant the line comes from. */
  variant?: string;
}

export interface WiringResult {
  /** Body lines per source path (agents, commands, skills and their Markdown resources). */
  bodies: Map<string, WiredLine[]>;
  diagnostics: Diagnostic[];
}

/** A source file the variant pass works on: its lines and the first body line. */
interface BodyFile {
  path: string;
  lines: string[];
  bodyStart: number;
}

/** A wiring anchor found in a source file: lines [start, end] (1-based, inclusive). */
interface Range {
  start: number;
  end: number;
}

/** Glossary names of the enforcement modes (token `{{enforcement_mode}}`). */
const MODE_NAME: Record<Mode, string> = {
  "native-permissions": "native permission enforcement",
  "sdd-mcp-server": "sdd MCP server enforcement",
  "copilot-hooks": "Copilot hooks fallback",
};

const HEADING = /^(#{1,6})[ \t]+(.*?)[ \t]*#*[ \t]*$/;
const FENCE = /^[ \t]*(```|~~~)/;
const TOKEN = /\{\{([^{}]*)\}\}/g;

/** Every body file of the source plugin, in reading order. */
function bodyFiles(source: SourcePlugin): BodyFile[] {
  const fromDoc = (d: SourceDoc): BodyFile => ({ path: d.path, lines: d.lines, bodyStart: d.bodyStartLine });
  const fromFile = (f: SourceFile): BodyFile => ({ path: f.path, lines: f.text.split("\n"), bodyStart: 1 });
  return [
    ...source.agents.map(fromDoc),
    ...source.commands.map(fromDoc),
    ...source.skills.flatMap((s) => [fromDoc(s.doc), ...s.resources.filter((r) => r.path.endsWith(".md")).map(fromFile)]),
  ];
}

/** Headings of a body outside fenced code: 1-based line, level and text. */
function headings(f: BodyFile): { line: number; level: number; text: string }[] {
  const out: { line: number; level: number; text: string }[] = [];
  let fence: string | null = null;
  for (let i = f.bodyStart - 1; i < f.lines.length; i++) {
    const l = f.lines[i]!;
    const fm = FENCE.exec(l);
    if (fm) {
      if (fence === null) fence = fm[1]!;
      else if (fm[1] === fence) fence = null;
      continue;
    }
    if (fence !== null) continue;
    const h = HEADING.exec(l);
    if (h) out.push({ line: i + 1, level: h[1]!.length, text: h[2]! });
  }
  return out;
}

/** The section of heading `text`: the heading to the line before the next heading of the same or a higher level, trailing blank lines left out. */
function findSection(f: BodyFile, text: string): Range | null {
  const hs = headings(f);
  const i = hs.findIndex((h) => h.text === text);
  if (i < 0) return null;
  const h = hs[i]!;
  const next = hs.slice(i + 1).find((n) => n.level <= h.level);
  let end = next ? next.line - 1 : f.lines.length;
  while (end > h.line && (f.lines[end - 1] ?? "").trim() === "") end--;
  return { start: h.line, end };
}

/** The first block of body lines equal to `block` after trailing-space removal. */
function findLines(f: BodyFile, block: readonly string[]): Range | null {
  const want = block.map((l) => l.trimEnd());
  for (let i = f.bodyStart - 1; i + want.length <= f.lines.length; i++)
    if (want.every((w, k) => (f.lines[i + k] ?? "").trimEnd() === w)) return { start: i + 1, end: i + want.length };
  return null;
}

function findAnchor(f: BodyFile, v: Variant): Range | null {
  return "section" in v.anchor ? findSection(f, v.anchor.section) : findLines(f, v.anchor.lines);
}

/** Label of an anchor in ERR-GEN-002 (`<section or line>` of the catalogue). */
const lineLabel = (text: string) => {
  const t = text.trim();
  return `line "${t.length > 80 ? `${t.slice(0, 77)}...` : t}"`;
};
const anchorLabel = (f: BodyFile, v: Variant, r: Range) => ("section" in v.anchor ? `section "${v.anchor.section}"` : lineLabel(f.lines[r.start - 1] ?? ""));

/** Path of a variant's text file inside the source plugin. */
export const variantPath = (target: Target, v: Pick<Variant, "text_file">) => `targets/${target}/wiring/${v.text_file}`;

/** Version of the source plugin (`.claude-plugin/plugin.json`), which is also the `architect-sdd` version (C002-INV-11). */
function packageVersion(source: SourcePlugin): string {
  const manifest = source.files.find((f) => f.path === ".claude-plugin/plugin.json");
  try {
    const v = (JSON.parse(manifest?.text ?? "{}") as { version?: unknown }).version;
    if (typeof v === "string" && v !== "") return v;
  } catch {
    // The reader reports a manifest that does not parse; the CLI version stands in.
  }
  return VERSION;
}

/** The values of the tokens of C002-IF-001 §4 for one target and mode. */
export function tokenValues(source: SourcePlugin, table: MappingTable, mode: Mode): Map<string, string> {
  const call = (server: string, tool: string) => table.mcp_tool_names.target_pattern.replaceAll("{server}", server).replaceAll("{tool}", tool);
  const values = new Map<string, string>([
    ["host_name", table.host.name],
    ["package_version", packageVersion(source)],
    ["enforcement_mode", MODE_NAME[mode]],
    ["server_files", call("sdd-files", "write_file")],
    ["server_shell", call("sdd-shell", "run_command")],
  ]);
  for (const [part, v] of Object.entries(table.host.tested_versions)) values.set(`tested_version:${part}`, v);
  return values;
}

/** Variant text lines with the tokens resolved; ERR-GEN-006 for each token without a value. Also used for the install notes (C002-IF-005 §5). */
export function variantLines(text: string, file: string, target: Target, tokens: Map<string, string>, diagnostics: Diagnostic[]): string[] {
  const lines = text.replace(/\n+$/, "").split("\n");
  return lines.map((l, i) =>
    l.replace(TOKEN, (token: string, name: string) => {
      const value = tokens.get(name.trim());
      if (value !== undefined) return value;
      diagnostics.push(diagnostic("ERR-GEN-006", `${file}:${i + 1}: unknown token "${token}"`, { file, line: i + 1, target, construct: token }));
      return token;
    }),
  );
}

/** Lines matched by a `variant_required` detector of the table (with the glossary stand-ins the table lacks). */
export type AnchorDetector = { id: string; re: RegExp };

/**
 * §3 steps 2 and 3 for one target: the variant pass over every body of the source plugin and the coverage
 * check of its wiring anchors. `peers` are the tables of every target of the run (this one included or
 * not); a variant any of them declares names an anchor required for every target.
 */
export function applyVariants(
  input: Pick<EmitInput, "source" | "table" | "target" | "mode"> & { peers?: readonly MappingTable[] },
  anchorDetectors: readonly AnchorDetector[],
): WiringResult {
  const { source, table, target, mode } = input;
  const diagnostics: Diagnostic[] = [];
  const tableFile = `targets/${target}.json`;
  const files = bodyFiles(source);
  const byPath = new Map(files.map((f) => [f.path, f]));
  const texts = new Map(source.files.map((f) => [f.path, f.text]));
  const tokens = tokenValues(source, table, mode);

  // §5: unique ids, text files present.
  const seen = new Set<string>();
  table.variants.forEach((v, i) => {
    if (seen.has(v.id)) diagnostics.push(diagnostic("ERR-GEN-004", `${tableFile}: /variants/${i}/id: variant id "${v.id}" is not unique`, { file: tableFile, target }));
    seen.add(v.id);
    if (!texts.has(variantPath(target, v)))
      diagnostics.push(diagnostic("ERR-GEN-004", `${tableFile}: /variants/${i}/text_file: ${variantPath(target, v)} does not exist`, { file: tableFile, target }));
  });

  // Step 2: locate this target's anchors (ERR-GEN-005 when stale), refuse overlaps.
  const placed = new Map<string, { v: Variant; r: Range }[]>();
  for (const v of table.variants) {
    const f = byPath.get(v.file);
    const r = f ? findAnchor(f, v) : null;
    if (!f || !r) {
      diagnostics.push(diagnostic("ERR-GEN-005", `${v.file}: anchor of variant "${v.id}" not found for ${target}`, { file: v.file, target, construct: v.id }));
      continue;
    }
    const list = placed.get(v.file) ?? [];
    const clash = list.find((p) => p.r.start <= r.end && r.start <= p.r.end);
    if (clash) {
      diagnostics.push(diagnostic("ERR-GEN-004", `${tableFile}: variants "${clash.v.id}" and "${v.id}" overlap in ${v.file} (lines ${r.start}–${r.end})`, { file: tableFile, target }));
      continue;
    }
    list.push({ v, r });
    placed.set(v.file, list);
  }

  // Step 3: coverage of every wiring anchor by this target's variants.
  const peers = [table, ...(input.peers ?? []).filter((p) => p !== table)];
  const reported = new Set<string>();
  for (const f of files) {
    const mine = placed.get(f.path) ?? [];
    const covered = (line: number) => mine.some((p) => p.r.start <= line && line <= p.r.end);
    const missing = (line: number, label: string) => {
      const key = `${f.path}\0${line}`;
      if (covered(line) || reported.has(key)) return;
      reported.add(key);
      diagnostics.push(diagnostic("ERR-GEN-002", `${f.path}:${line}: ${label} has no ${target} wiring variant`, { file: f.path, line, target }));
    };
    for (const h of headings(f)) if (h.text === WIRING_SECTION) missing(h.line, `section "${WIRING_SECTION}"`);
    for (let i = f.bodyStart - 1; i < f.lines.length; i++) {
      const text = f.lines[i]!;
      for (const d of anchorDetectors) {
        d.re.lastIndex = 0;
        if (d.re.test(text)) missing(i + 1, lineLabel(text));
      }
    }
    for (const p of peers)
      for (const v of p.variants) {
        if (v.file !== f.path) continue;
        const r = findAnchor(f, v);
        if (r) missing(r.start, anchorLabel(f, v, r));
      }
  }

  // The wired bodies: each placed anchor replaced by its variant text.
  const bodies = new Map<string, WiredLine[]>();
  for (const f of files) {
    const mine = [...(placed.get(f.path) ?? [])].sort((a, b) => a.r.start - b.r.start);
    const out: WiredLine[] = [];
    let i = f.bodyStart;
    for (const { v, r } of mine) {
      for (; i < r.start; i++) out.push({ text: f.lines[i - 1]!, line: i, origin: { file: f.path, line: i } });
      const file = variantPath(target, v);
      const text = texts.get(file);
      if (text !== undefined)
        variantLines(text, file, target, tokens, diagnostics).forEach((t, k) => out.push({ text: t, line: r.start, origin: { file, line: k + 1 }, variant: v.id }));
      i = r.end + 1;
    }
    for (; i <= f.lines.length; i++) out.push({ text: f.lines[i - 1]!, line: i, origin: { file: f.path, line: i } });
    bodies.set(f.path, out);
  }
  return { bodies, diagnostics };
}
