// Workspace model: every Markdown artifact of a change parsed into ID definitions (nodes) and
// references (typed edges). Definition forms follow C001-IF-04 §2; per-ID content blocks and
// hashes follow C001-IF-13 §2 step 5.
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join, relative, sep } from "node:path";
import { parseBlocks, type Blocks, type Field } from "./blocks.ts";
import { splitFrontmatter } from "./frontmatter.ts";
import { findIds, parseId, type IdType } from "./ids.ts";

export type DefinitionForm = "heading" | "scenario" | "table-row" | "bullet" | "frontmatter";

export interface GraphNode {
  id: string;
  type: IdType;
  /** Change-relative path with forward slashes. */
  file: string;
  line: number;
  title: string;
  form: DefinitionForm;
  /** `sha256:<hex>` of the normalised defining block. */
  contentHash: string;
  /** `- **Name:** value` bullets inside the defining block (heading definitions only). */
  fields: Field[];
}

export interface GraphEdge {
  /** Enclosing definition, or `file:<path>` when the reference is outside any definition. */
  from: string;
  to: string;
  /** Field or frontmatter key that holds the reference (`stories`, `implements`, …), `scenario`, or `mention`. */
  kind: string;
  raw: string;
  file: string;
  line: number;
  /**
   * Where the reference sits: `code` inside a fenced block or a backtick span, `quote` inside
   * double quotes, `text` otherwise. Example IDs in scenarios are `code` or `quote`.
   */
  context: "text" | "code" | "quote";
}

export interface ArtifactFile {
  path: string;
  /** Frontmatter `id` (artifact identity, e.g. `C001-SPEC-INDEX` or `C001-IF-14`). */
  artifactId: string | null;
  artifact: string | null;
  status: string | null;
  generated: boolean;
  frontmatter: Record<string, unknown> | null;
  frontmatterError?: string;
}

export interface ChangeGraph {
  /** Three-digit change number taken from the folder name. */
  change: string;
  dir: string;
  files: ArtifactFile[];
  nodes: GraphNode[];
  /** Definitions per ID; more than one entry is a duplicate definition. */
  byId: Map<string, GraphNode[]>;
  edges: GraphEdge[];
}

export interface Workspace {
  root: string;
  changes: ChangeGraph[];
}

/** Types whose definition is a table row whose first cell is the ID, with the defining files (C001-IF-04 §2). */
const TABLE_DEFINED: Partial<Record<IdType, readonly string[]>> = {
  GOAL: ["10-context/problem-and-goals.md"],
  SC: ["10-context/problem-and-goals.md"],
  AS: ["10-context/scope.md"],
  CON: ["10-context/scope.md", "60-architecture/constraints.md"],
  DOD: ["70-dod.md"],
  IF: ["50-interfaces/README.md"],
  M: ["10-strategy.md"],
  RISK: ["70-risks.md"],
  RB: ["75-rollout.md"],
  TC: ["60-test-plan.md"],
};
/**
 * Types defined by the frontmatter `id` of their own file. A capability's three files share its
 * `id`; only `stories.md` defines it (C001-IF-04 §2).
 */
const FRONTMATTER_DEFINED: ReadonlySet<IdType> = new Set(["T", "ADR", "OA", "DEC", "R", "CAP"]);
const definesByFrontmatter = (id: string, rel: string) => {
  const type = parseId(id)?.type;
  return type !== undefined && FRONTMATTER_DEFINED.has(type) && (type !== "CAP" || rel.endsWith("/stories.md"));
};

/** Context of the character at `column`: inside a backtick span, inside double quotes, or plain text. */
function inlineContext(text: string, column: number): "text" | "code" | "quote" {
  let code = false;
  let quote = false;
  for (let i = 0; i < column; i++) {
    const ch = text[i];
    if (ch === "`") code = !code;
    else if (ch === '"' && !code) quote = !quote;
  }
  return code ? "code" : quote ? "quote" : "text";
}

const sha256 = (text: string) => "sha256:" + createHash("sha256").update(text, "utf8").digest("hex");
const toPosix = (p: string) => p.split(sep).join("/");

function listMarkdown(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir).sort()) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...listMarkdown(p));
    else if (name.endsWith(".md")) out.push(p);
  }
  return out;
}

function str(v: unknown): string | null {
  return typeof v === "string" ? v : null;
}

interface Pending {
  node: GraphNode;
  /** First and last line of the block that encloses references made from this definition. */
  from: number;
  to: number;
}

function parseFile(path: string, rel: string, change: string, nodes: GraphNode[], edges: GraphEdge[]): ArtifactFile {
  const text = readFileSync(path, "utf8");
  const doc = splitFrontmatter(text);
  const fm = doc.data;
  const file: ArtifactFile = {
    path: rel,
    artifactId: str(fm?.["id"]),
    artifact: str(fm?.["artifact"]),
    status: str(fm?.["status"]),
    generated: fm?.["generated"] === true,
    frontmatter: fm,
  };
  if (doc.error) file.frontmatterError = doc.error;
  if (file.generated) return file;

  const body = doc.lines.slice(doc.bodyStartLine - 1);
  const blocks: Blocks = parseBlocks(body, doc.bodyStartLine);
  // Normalised lines (C001-IF-13 §2 step 2), indexed by 1-based file line.
  const norm = (line: number) => (doc.lines[line - 1] ?? "").replace(/[ \t]+$/, "");
  const blockText = (a: number, b: number) => {
    const out: string[] = [];
    for (let l = a; l <= b; l++) out.push(norm(l));
    return out.join("\n");
  };
  const lastLine = doc.lines.length;
  const defs: Pending[] = [];
  const add = (id: string, line: number, title: string, form: DefinitionForm, from: number, to: number, hashed: string) => {
    const parts = parseId(id);
    if (!parts) return;
    const fields = form === "heading" ? blocks.fields.filter((f) => f.line > from && f.line <= to) : [];
    defs.push({ node: { id, type: parts.type, file: rel, line, title, form, contentHash: sha256(hashed), fields }, from, to });
  };
  const fullId = (s: string) => (parseId(s) ? s : null);

  // Frontmatter-defined artifacts (tasks, ADRs, option analyses, capabilities).
  const fmId = file.artifactId ? fullId(file.artifactId) : null;
  if (fmId && definesByFrontmatter(fmId, rel)) {
    const whole = doc.lines.slice(doc.bodyStartLine - 1).map((l) => l.replace(/[ \t]+$/, "")).join("\n");
    add(fmId, 1, str(fm?.["title"]) ?? str(fm?.["capability"]) ?? "", "frontmatter", 1, lastLine, whole);
  }
  // Headings ### / #### whose text starts with a full ID.
  for (const h of blocks.headings) {
    if (h.level < 3 || h.level > 4) continue;
    const m = /^(\S+)(?:\s+—\s+(.*))?$/.exec(h.text);
    const id = m?.[1] ? fullId(m[1]) : null;
    if (!id) continue;
    const end = blocks.sectionEnd(h.line);
    add(id, h.line, m?.[2] ?? "", "heading", h.line, end, blockText(h.line, end));
  }
  // Gherkin scenario titles: the block is the enclosing fence.
  for (const f of blocks.fences) {
    for (let l = f.start; l <= f.end; l++) {
      const m = /Scenario(?: Outline)?: (C\d{3}-TS-\d+)(?:\s+—\s+(.*))?/.exec(doc.lines[l - 1] ?? "");
      if (m?.[1]) add(m[1], l, m[2]?.trim() ?? "", "scenario", l, l, blockText(f.start, f.end));
    }
  }
  // Table rows in the defining files of their type.
  for (const r of blocks.tableRows) {
    const id = r.cells[0] ? fullId(r.cells[0]) : null;
    if (!id) continue;
    const type = parseId(id)!.type;
    const allowed = TABLE_DEFINED[type];
    if (!allowed?.some((suffix) => rel.endsWith(suffix))) continue;
    if (type === "TC" && !/^C\d{3}-TS-\d+$/.test(r.cells[1] ?? "")) continue;
    add(id, r.line, r.cells[1] ?? "", "table-row", r.line, r.line, norm(r.line));
  }
  // Bullets: `**C001-INV-nn**` and `- C001-NG-nn:`.
  body.forEach((text, i) => {
    const line = doc.bodyStartLine + i;
    if (blocks.inFence(line)) return;
    const inv = /\*\*(C\d{3}-INV-\d+)\*\*\s*(.*)$/.exec(text);
    if (inv?.[1]) add(inv[1], line, inv[2] ?? "", "bullet", line, line, norm(line));
    const ng = /^- (C\d{3}-NG-\d+):\s*(.*)$/.exec(text);
    if (ng?.[1]) add(ng[1], line, ng[2] ?? "", "bullet", line, line, norm(line));
  });
  for (const d of defs) nodes.push(d.node);

  // References. The enclosing definition is the innermost block containing the line.
  const enclosing = (line: number) => {
    let best: Pending | null = null;
    for (const d of defs)
      if (d.node.form !== "scenario" && line >= d.from && line <= d.to && (!best || d.to - d.from < best.to - best.from)) best = d;
    return best ? best.node.id : `file:${rel}`;
  };
  const fieldAt = new Map(blocks.fields.map((f) => [f.line, f.name]));
  const definedAt = new Map<number, Set<string>>();
  for (const d of defs) definedAt.set(d.node.line, (definedAt.get(d.node.line) ?? new Set()).add(d.node.id));
  const kindOf = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

  // Frontmatter keys (implements, satisfies_ac, verified_by, depends_on, …).
  let key = "";
  for (let l = 2; l < doc.bodyStartLine - 1; l++) {
    const text = doc.lines[l - 1] ?? "";
    const km = /^([A-Za-z_][\w-]*):/.exec(text);
    if (km?.[1]) key = km[1];
    if (key === "id") continue;
    const from = fmId && definesByFrontmatter(fmId, rel) ? fmId : `file:${rel}`;
    for (const hit of findIds(text, change))
      edges.push({ from, to: hit.id, kind: kindOf(key), raw: hit.raw, file: rel, line: l, context: inlineContext(text, hit.column) });
  }
  body.forEach((text, i) => {
    const line = doc.bodyStartLine + i;
    const own = definedAt.get(line);
    const fenced = blocks.inFence(line);
    for (const hit of findIds(text, change)) {
      const context = fenced ? "code" : inlineContext(text, hit.column);
      if (own?.has(hit.id)) {
        // A scenario defined inside an acceptance criterion links the two.
        const d = defs.find((x) => x.node.id === hit.id && x.node.line === line);
        if (d?.node.form === "scenario") edges.push({ from: enclosing(line), to: hit.id, kind: "scenario", raw: hit.raw, file: rel, line, context: "text" });
        continue;
      }
      const field = fieldAt.get(line);
      edges.push({ from: enclosing(line), to: hit.id, kind: field ? kindOf(field) : "mention", raw: hit.raw, file: rel, line, context });
    }
  });
  return file;
}

/** Parses one change folder (`.sdd/NNN-slug`). */
export function buildChangeGraph(changeDir: string): ChangeGraph {
  const m = /^(\d{3})-/.exec(basename(changeDir));
  if (!m?.[1]) throw new Error(`not a change folder (expected NNN-slug): ${changeDir}`);
  const change = m[1];
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const files = listMarkdown(changeDir).map((p) => parseFile(p, toPosix(relative(changeDir, p)), change, nodes, edges));
  const byId = new Map<string, GraphNode[]>();
  for (const n of nodes) byId.set(n.id, [...(byId.get(n.id) ?? []), n]);
  return { change, dir: changeDir, files, nodes, byId, edges };
}

/** Loads every change folder (`NNN-slug`) directly under the workspace root (`.sdd/`). */
export function loadWorkspace(root: string): Workspace {
  const changes = readdirSync(root)
    .filter((name) => /^\d{3}-/.test(name) && statSync(join(root, name)).isDirectory())
    .sort()
    .map((name) => buildChangeGraph(join(root, name)));
  return { root, changes };
}
