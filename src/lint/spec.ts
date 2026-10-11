// Parsing helpers over the gathered spec facts, shared by the spec-phase rules (C001-T-020): ID
// lists with ranges, DoD rows, coverage tables, gherkin scenarios and multi-line fields. Pure.
import { findIds, formatId, parseId } from "../model/ids.ts";
import type { GraphNode } from "../model/graph.ts";
import type { LintChange, SpecDoc } from "./types.ts";

/** The parsed files of the change's 10-spec phase. */
export function specDocs(c: LintChange): [string, SpecDoc][] {
  return [...c.spec.docs].filter(([p]) => p.startsWith("10-spec/"));
}

/**
 * Full IDs named in a cell, expanding the list forms of the spec: `C001-NFR-101, 102, 103` and
 * ranges `C001-REQ-101 … 127` (or `...`); a bare number continues the type of the ID before it.
 */
export function expandIds(text: string, change: string): Set<string> {
  const out = new Set<string>();
  const hits = findIds(text, change);
  hits.forEach((h, i) => {
    out.add(h.id);
    const p = parseId(h.id);
    if (!p || p.sub !== undefined) return;
    const width = p.seq.length;
    let last = Number(p.seq);
    const end = hits[i + 1]?.column ?? text.length;
    const tail = text.slice(h.column + h.raw.length, end);
    for (const m of tail.matchAll(/(…|\.\.\.)\s*(\d+)(?![\w-])|,\s*(\d+)(?![\w.-])/g)) {
      const n = Number(m[2] ?? m[3]);
      const from = m[2] !== undefined ? last + 1 : n;
      for (let k = from; k <= n; k++) out.add(formatId({ ...p, seq: String(k).padStart(width, "0") }));
      last = n;
    }
  });
  return out;
}

export interface TableRow {
  path: string;
  line: number;
  /** Cells by lower-cased header name. */
  cells: Map<string, string>;
  raw: string[];
}

export interface Table {
  headerLine: number;
  /** Lower-cased header cells. */
  header: string[];
  rows: TableRow[];
  /** Last line of the table. */
  endLine: number;
}

/** Every table in `doc`; a row whose previous line is not a table line starts a new table. */
export function tables(doc: SpecDoc, path: string): Table[] {
  const out: Table[] = [];
  let cur: Table | null = null;
  for (const r of doc.blocks.tableRows) {
    if (cur === null || !(doc.lines[r.line - 2] ?? "").trimStart().startsWith("|")) {
      cur = { headerLine: r.line, header: r.cells.map((c) => c.toLowerCase()), rows: [], endLine: r.line };
      out.push(cur);
      continue;
    }
    const header = cur.header;
    cur.rows.push({ path, line: r.line, cells: new Map(header.map((h, i) => [h, r.cells[i] ?? ""] as const)), raw: r.cells });
    cur.endLine = r.line;
  }
  return out;
}

export interface DodRow {
  id: string;
  path: string;
  line: number;
  evidence: string;
  covers: string;
}

/** Feature DoD rows of the change (C001-REQ-419): tables whose first cell is a DOD ID. */
export function dodRows(c: LintChange): DodRow[] {
  const out: DodRow[] = [];
  for (const [path, doc] of specDocs(c)) {
    if (!/(^|\/)(70-dod|dod)\.md$/.test(path)) continue;
    for (const t of tables(doc, path)) {
      const evidence = t.header.find((h) => h.startsWith("evidence"));
      const covers = t.header.find((h) => h.startsWith("covers"));
      for (const r of t.rows) {
        const id = findIds(r.raw[0] ?? "", c.change).find((h) => h.id.includes("-DOD-"))?.id;
        if (!id) continue;
        out.push({ id, path, line: r.line, evidence: evidence ? (r.cells.get(evidence) ?? "") : "", covers: covers ? (r.cells.get(covers) ?? "") : "" });
      }
    }
  }
  return out;
}

export const COVERAGE_COLUMNS = ["happy", "alternate", "boundary", "error", "authorization", "concurrency/idempotency", "abuse"];

export interface CoverageTable {
  path: string;
  line: number;
  rows: TableRow[];
  /** True when a non-empty paragraph follows the table directly (per-column n/a reasons). */
  note: boolean;
}

/** Coverage tables (C001-IF-03 §7): tables whose header starts with REQ and names `happy`. */
export function coverageTables(c: LintChange): CoverageTable[] {
  const out: CoverageTable[] = [];
  for (const [path, doc] of specDocs(c))
    for (const t of tables(doc, path)) {
      if (t.header[0] !== "req" || !t.header.includes("happy")) continue;
      let i = t.endLine; // 0-based index of the line after the table
      while (i < doc.lines.length && (doc.lines[i] ?? "").trim() === "") i++;
      const next = doc.lines[i] ?? "";
      const note = next.trim() !== "" && !/^#{1,6}\s/.test(next) && !next.trimStart().startsWith("|");
      out.push({ path, line: t.headerLine, rows: t.rows, note });
    }
  return out;
}

export interface Scenario {
  id: string | null;
  path: string;
  line: number;
  outline: boolean;
  given: number;
  when: number;
  then: number;
}

/** Scenarios of the `gherkin` fences; `And`/`But` count as the keyword they continue. */
export function scenarios(c: LintChange): Scenario[] {
  const out: Scenario[] = [];
  for (const [path, doc] of specDocs(c))
    for (const f of doc.blocks.fences) {
      if (f.info.toLowerCase() !== "gherkin") continue;
      let cur: Scenario | null = null;
      let last: "given" | "when" | "then" | null = null;
      let inExamples = false;
      for (let l = f.start + 1; l < f.end; l++) {
        const text = (doc.lines[l - 1] ?? "").trim();
        const sm = /^Scenario( Outline)?:\s*(.*)$/.exec(text);
        if (sm) {
          const id = findIds(sm[2] ?? "", c.change).find((h) => h.id.includes("-TS-"))?.id ?? null;
          cur = { id, path, line: l, outline: sm[1] !== undefined, given: 0, when: 0, then: 0 };
          out.push(cur);
          last = null;
          inExamples = false;
          continue;
        }
        if (!cur) continue;
        if (/^Examples:/.test(text)) inExamples = true;
        if (inExamples) continue;
        const km = /^(Given|When|Then|And|But)\b/.exec(text);
        if (!km) continue;
        const k = km[1]!.toLowerCase();
        const key: "given" | "when" | "then" | null = k === "and" || k === "but" ? last : (k as "given" | "when" | "then");
        if (key) {
          cur[key]++;
          last = key;
        }
      }
    }
  return out;
}

/**
 * The text of a `- **Name:** value` field in a section, with its continuation lines (indented
 * lines up to the next top-level bullet or blank line). Null when the field is absent.
 */
export function fieldText(lines: readonly string[], name: string): string | null {
  const re = new RegExp(`^[-*] \\*\\*${name.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")}:\\*\\*\\s?(.*)$`);
  const at = lines.findIndex((l) => re.test(l));
  if (at < 0) return null;
  const parts = [re.exec(lines[at]!)?.[1] ?? ""];
  for (let i = at + 1; i < lines.length; i++) {
    const l = lines[i] ?? "";
    if (l.trim() === "" || !/^\s+/.test(l)) break;
    parts.push(l.trim());
  }
  return parts.join("\n").trim();
}

/** The capability of a requirement: its `CAP-<nn>-…` folder, else the Capability of its stories. */
export function capabilityOf(c: LintChange, n: GraphNode): string[] {
  const m = /(?:^|\/)CAP-(\d+)-[^/]*\//.exec(n.file);
  if (m?.[1]) return [formatId({ change: c.change, type: "CAP", seq: m[1] })];
  const stories = findIds(n.fields.find((f) => f.name === "Stories")?.value ?? "", c.change).map((h) => h.id);
  const caps = new Set<string>();
  for (const s of stories) {
    const sec = c.spec.sections.get(s);
    for (const l of sec?.lines ?? []) {
      const cm = /\*\*Capability:?\*\*(.*)/.exec(l);
      if (cm) for (const h of findIds(cm[1] ?? "", c.change)) if (h.id.includes("-CAP-")) caps.add(h.id);
    }
  }
  return [...caps];
}


const EVIDENCE_PATH = /[\w@-]+(?:\/[\w@.-]+)*\.[A-Za-z]\w*(?::\d+)?/;
const EVIDENCE_SYMBOL = /[A-Za-z_$][\w$.#:]*\(\)|›\s*`?[A-Za-z_$][\w$.#:]*/;
const EVIDENCE_LAYER = /\blayer:\s*(?:ripwire|serena|lsp|grep|ast-grep)\b/;

/** What a code-evidence citation lacks among file path, symbol and evidence layer (C001-IF-03 §11). */
export function evidenceGaps(text: string): string[] {
  const t = text.replace(/`/g, "");
  return [...(EVIDENCE_PATH.test(t) ? [] : ["file path"]), ...(EVIDENCE_SYMBOL.test(t) ? [] : ["symbol"]), ...(EVIDENCE_LAYER.test(t) ? [] : ["evidence layer"])];
}

export interface MermaidBlock {
  path: string;
  /** Line of the opening fence. */
  line: number;
  /** First keyword of the diagram (`flowchart`, `sequenceDiagram`, …). */
  kind: string;
  /** Diagram source lines. */
  lines: string[];
}

/** Mermaid fences of the given docs. */
export function mermaidBlocks(docs: [string, SpecDoc][]): MermaidBlock[] {
  const out: MermaidBlock[] = [];
  for (const [path, doc] of docs)
    for (const f of doc.blocks.fences) {
      if (f.info.toLowerCase() !== "mermaid") continue;
      const lines = doc.lines.slice(f.start, f.end - 1);
      const kind = lines.map((l) => l.trim()).find((l) => l !== "" && !l.startsWith("%%"))?.split(/\s+/)[0] ?? "";
      out.push({ path, line: f.start, kind, lines });
    }
  return out;
}

/** Text of the nearest heading above `line`, or "". */
export function headingAbove(doc: SpecDoc, line: number): string {
  let text = "";
  for (const h of doc.blocks.headings) if (h.line < line) text = h.text;
  return text;
}

/** Heading text without its section number ("8.2 F1 — …" → "F1 — …"), lower-cased. */
export function headingName(text: string): string {
  return text.replace(/^\d+(?:\.\d+)*\.?\s+/, "").trim().toLowerCase();
}

/** Lines (1-based numbers) of the section under the first heading whose name starts with `name`. */
export function sectionByName(doc: SpecDoc, name: string): { line: number; end: number } | null {
  const h = doc.blocks.headings.find((x) => headingName(x.text).startsWith(name.toLowerCase()));
  return h ? { line: h.line, end: doc.blocks.sectionEnd(h.line) } : null;
}
