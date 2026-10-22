// Living-spec file edits for `sdd archive` (C001-IF-03 §10): frontmatter `capability`, `inventory_only`,
// `updated`; sections Purpose … Evidence (inventory), Requirements (entries with their ACs and
// scenarios), History (table ID, Event, Change, Date, Note). All edits work on text, fence-aware.
import { parseBlocks } from "../model/blocks.ts";
import { setTopLevel } from "../workspace/change-md.ts";

const HISTORY_HEADER = ["| ID | Event | Change | Date | Note |", "|---|---|---|---|---|"];

export function newLivingFile(slug: string, date: string): string {
  return [
    "---",
    `capability: ${slug}`,
    "inventory_only: false",
    `updated: ${date}`,
    "---",
    `# CAP-${slug} — Living specification`,
    "",
    "## Requirements",
    "",
    "## History",
    "",
    ...HISTORY_HEADER,
    "",
  ].join("\n");
}

const lines = (text: string) => text.split("\n");
const blocks = (ls: string[]) => parseBlocks(ls, 1);

/** 1-based [start, end] of the level-3 entry headed by `id`, or null. */
export function findEntry(text: string, id: string): { start: number; end: number; title: string } | null {
  const ls = lines(text);
  const b = blocks(ls);
  const h = b.headings.find((x) => x.level === 3 && (x.text === id || x.text.startsWith(`${id} — `) || x.text.startsWith(`${id} `)));
  if (!h) return null;
  let end = b.sectionEnd(h.line);
  while (end > h.line && ls[end - 1]!.trim() === "") end--;
  return { start: h.line, end, title: h.text.slice(id.length).replace(/^\s*—\s*/, "").trim() };
}

function section(ls: string[], name: string): { line: number; end: number } | null {
  const b = blocks(ls);
  const h = b.headings.find((x) => x.level === 2 && x.text.trim().toLowerCase() === name.toLowerCase());
  return h ? { line: h.line, end: b.sectionEnd(h.line) } : null;
}

/** Ensures `## Requirements` and `## History` (with its table header) exist. */
function ensureSections(text: string): string {
  const ls = lines(text);
  if (!section(ls, "History")) {
    while (ls.length > 0 && ls[ls.length - 1] === "") ls.pop();
    ls.push("", "## History", "", ...HISTORY_HEADER, "");
  }
  if (!section(ls, "Requirements")) {
    const h = section(ls, "History")!;
    ls.splice(h.line - 1, 0, "## Requirements", "");
  }
  const h = section(ls, "History")!;
  if (!ls.slice(h.line, h.end).some((l) => /^\|\s*ID\s*\|/.test(l))) ls.splice(h.line, 0, "", ...HISTORY_HEADER);
  return ls.join("\n");
}

/** Sets `inventory_only: false` and `updated`, adding a frontmatter block when there is none. */
export function markUpdated(text: string, slug: string, date: string): string {
  let t = text.startsWith("---\n") ? text : `---\ncapability: ${slug}\n---\n${text}`;
  t = setTopLevel(t, "inventory_only", "false");
  t = setTopLevel(t, "updated", date);
  return ensureSections(t);
}

/** Appends an entry at the end of the Requirements section. */
export function appendEntry(text: string, entry: string[]): string {
  const ls = lines(ensureSections(text));
  const s = section(ls, "Requirements")!;
  let at = s.end; // last line of the section (1-based)
  while (at > s.line && ls[at - 1]!.trim() === "") at--;
  ls.splice(at, 0, "", ...entry, "");
  return tidy(ls);
}

export function replaceRange(text: string, start: number, end: number, entry: string[]): string {
  const ls = lines(text);
  ls.splice(start - 1, end - start + 1, ...entry);
  return tidy(ls);
}

export function deleteRange(text: string, start: number, end: number): string {
  const ls = lines(text);
  ls.splice(start - 1, end - start + 1);
  return tidy(ls);
}

/** Appends a History row (cells: ID, Event, Change, Date, Note). */
export function addHistory(text: string, cells: [string, string, string, string, string]): string {
  const ls = lines(ensureSections(text));
  const s = section(ls, "History")!;
  let last = s.line;
  for (let i = s.line; i <= s.end; i++) if (ls[i - 1]!.startsWith("|")) last = i;
  ls.splice(last, 0, `| ${cells.map((c) => c.replace(/\|/g, "\\|")).join(" | ")} |`);
  return tidy(ls);
}

/** The change and the date of the `- **Source:** <change>, archived <date>` line of an entry, or null. */
export function entrySource(text: string, id: string): { change: string; date: string } | null {
  const e = findEntry(text, id);
  if (!e) return null;
  for (const l of lines(text).slice(e.start, e.end)) {
    const m = /^- \*\*Source:\*\*\s*(\S+), archived (\d{4}-\d{2}-\d{2})\s*$/.exec(l);
    if (m) return { change: m[1]!, date: m[2]! };
  }
  return null;
}

/** History rows (cells ID, Event, Change, Date, Note), header and separator left out. */
export function historyCells(text: string): string[][] {
  const ls = lines(text);
  const s = section(ls, "History");
  if (!s) return [];
  return blocks(ls)
    .tableRows.filter((r) => r.line > s.line && r.line <= s.end && r.cells[0] !== "ID")
    .map((r) => r.cells);
}

/** Whether the History table has a row with these ID, Event and Change cells (Date and Note are not compared). */
export function hasHistory(text: string, id: string, event: string | RegExp, change: string): boolean {
  return historyCells(text).some((c) => c[0] === id && c[2] === change && (typeof event === "string" ? c[1] === event : event.test(c[1] ?? "")));
}

/** Collapses runs of blank lines (outside fences) and ends the file with one newline. */
function tidy(ls: string[]): string {
  const b = blocks(ls);
  const out: string[] = [];
  ls.forEach((l, i) => {
    if (l.trim() === "" && out.length > 0 && out[out.length - 1]!.trim() === "" && !b.inFence(i + 1)) return;
    out.push(l);
  });
  while (out.length > 0 && out[out.length - 1]!.trim() === "") out.pop();
  return out.join("\n") + "\n";
}
