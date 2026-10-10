// Line-based Markdown structure: ATX headings, fenced blocks, table rows and field bullets
// (`- **Name:** value`). Line numbers are 1-based positions in the original file.

export interface Heading {
  level: number;
  text: string;
  line: number;
}

export interface Fence {
  /** Line of the opening fence. */
  start: number;
  /** Line of the closing fence, or the last line when the fence is never closed. */
  end: number;
  info: string;
}

export interface TableRow {
  line: number;
  cells: string[];
}

export interface Field {
  line: number;
  name: string;
  value: string;
}

export interface Blocks {
  headings: Heading[];
  fences: Fence[];
  tableRows: TableRow[];
  fields: Field[];
  /** True when the line lies inside a fenced block (fence lines included). */
  inFence(line: number): boolean;
  /** Last line of the section opened by the heading on `line` (C001-IF-13 §2 step 5). */
  sectionEnd(line: number): number;
}

const FENCE = /^ {0,3}(`{3,}|~{3,})(.*)$/;
const HEADING = /^(#{1,6})[ \t]+(.*?)[ \t]*#*[ \t]*$/;
const FIELD = /^\s*[-*] \*\*([^*]+?):\*\*\s?(.*)$/;
const SEPARATOR = /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/;

/** Splits a Markdown table row into trimmed cells; `\|` is an escaped pipe. */
export function splitCells(row: string): string[] {
  let s = row.trim();
  if (s.startsWith("|")) s = s.slice(1);
  if (s.endsWith("|") && !s.endsWith("\\|")) s = s.slice(0, -1);
  const cells: string[] = [];
  let cur = "";
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === "\\" && s[i + 1] === "|") {
      cur += "|";
      i++;
    } else if (ch === "|") {
      cells.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  cells.push(cur.trim());
  return cells;
}

/**
 * Parses `lines`, where `lines[0]` is line `firstLine` of the file (the first body line when the
 * caller strips frontmatter).
 */
export function parseBlocks(lines: readonly string[], firstLine: number): Blocks {
  const headings: Heading[] = [];
  const fences: Fence[] = [];
  const tableRows: TableRow[] = [];
  const fields: Field[] = [];
  const lastLine = firstLine + lines.length - 1;
  let open: { start: number; marker: string; info: string } | null = null;

  lines.forEach((text, i) => {
    const line = firstLine + i;
    const fm = FENCE.exec(text);
    if (open) {
      const marker = fm?.[1];
      if (marker && marker[0] === open.marker[0] && marker.length >= open.marker.length && (fm?.[2] ?? "").trim() === "") {
        fences.push({ start: open.start, end: line, info: open.info });
        open = null;
      }
      return;
    }
    if (fm?.[1]) {
      open = { start: line, marker: fm[1], info: (fm[2] ?? "").trim() };
      return;
    }
    const hm = HEADING.exec(text);
    if (hm?.[1]) {
      headings.push({ level: hm[1].length, text: hm[2] ?? "", line });
      return;
    }
    if (text.trimStart().startsWith("|")) {
      if (!SEPARATOR.test(text.trim())) tableRows.push({ line, cells: splitCells(text) });
      return;
    }
    const fd = FIELD.exec(text);
    if (fd?.[1] !== undefined) fields.push({ line, name: fd[1].trim(), value: (fd[2] ?? "").trim() });
  });
  if (open) fences.push({ start: (open as { start: number }).start, end: lastLine, info: (open as { info: string }).info });

  const fenceAt = (line: number) => fences.some((f) => line >= f.start && line <= f.end);
  return {
    headings,
    fences,
    tableRows,
    fields,
    inFence: fenceAt,
    sectionEnd(line: number): number {
      const idx = headings.findIndex((h) => h.line === line);
      if (idx < 0) throw new Error(`no heading on line ${line}`);
      const level = headings[idx]!.level;
      const next = headings.slice(idx + 1).find((h) => h.level <= level);
      return next ? next.line - 1 : lastLine;
    },
  };
}
