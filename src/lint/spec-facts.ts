// Spec facts the requirement-quality rules need beyond the graph (C001-CON-13: the engine reads,
// the rules stay pure): change kind, personas, system names, sections and the parsed 10-spec files.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parseBlocks } from "../model/blocks.ts";
import { toLines } from "../model/frontmatter.ts";
import type { ChangeGraph } from "../model/graph.ts";
import type { SpecDoc, SpecFacts } from "./types.ts";

const PERSONA_HEADING = /^(P-\d{2,})\b/;
const SEPARATOR = /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/;

function readLines(abs: string): { lines: string[]; first: number } | null {
  if (!existsSync(abs)) return null;
  return { lines: toLines(readFileSync(abs, "utf8")), first: 1 };
}

/** First cells of the table rows under every heading named "System names" (header rows skipped). */
function systemNames(lines: string[], first: number): string[] {
  const b = parseBlocks(lines, first);
  const out: string[] = [];
  for (const h of b.headings) {
    if (!/system names/i.test(h.text)) continue;
    const end = b.sectionEnd(h.line);
    for (const row of b.tableRows) {
      if (row.line <= h.line || row.line > end) continue;
      if (SEPARATOR.test((lines[row.line - first + 1] ?? "").trim())) continue;
      const name = (row.cells[0] ?? "").replace(/`/g, "").trim();
      if (name !== "" && name !== "—") out.push(name);
    }
  }
  return out;
}

const SECTION_TYPES = new Set(["US", "REQ", "NFR"]);

export function gatherSpecFacts(sddDir: string, graph: ChangeGraph): SpecFacts {
  const fm = graph.files.find((f) => f.path === "change.md")?.frontmatter ?? {};
  const personas = new Set<string>();
  const systems: string[] = [];
  const sections = new Map<string, { line: number; lines: string[] }>();
  const docs = new Map<string, SpecDoc>();

  for (const f of graph.files) {
    if (f.generated || !f.path.endsWith(".md") || !f.path.startsWith("10-spec/")) continue;
    const src = readLines(join(graph.dir, ...f.path.split("/")));
    if (!src) continue;
    const b = parseBlocks(src.lines, src.first);
    docs.set(f.path, { lines: src.lines, blocks: b });
    for (const h of b.headings) {
      const m = PERSONA_HEADING.exec(h.text);
      if (m?.[1]) personas.add(m[1]);
    }
    systems.push(...systemNames(src.lines, src.first));
    for (const n of graph.nodes) {
      if (!SECTION_TYPES.has(n.type) || n.form !== "heading" || n.file !== f.path) continue;
      const end = b.sectionEnd(n.line);
      sections.set(n.id, { line: n.line, lines: src.lines.slice(n.line - src.first, end - src.first + 1) });
    }
  }
  const constitution = readLines(join(sddDir, "_constitution", "glossary.md"));
  if (constitution) systems.push(...systemNames(constitution.lines, constitution.first));
  for (const n of graph.nodes) if (n.type === "COMP" && n.title !== "") systems.push(n.title);

  return { kind: typeof fm["kind"] === "string" ? fm["kind"] : "greenfield", personas, systems, sections, docs };
}
