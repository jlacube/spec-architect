// Body-construct translator (C002-COMP-001; C002-IF-001 §2, §3 steps 6 and 8): every Claude Code construct
// of an agent, command or skill body, and of the text fields of their frontmatter, is replaced by the
// target's `constructs` entry (C002-REQ-103) — template paths become `sdd template show` (C002-REQ-115),
// `${CLAUDE_PLUGIN_DATA}` becomes `--user-data` (C002-REQ-116), AskUserQuestion becomes the host question
// tool (C002-REQ-118), MCP tool names take the body form `mcp_tool_names.target_pattern` (C002-TS-134).
// The result is then scanned with every detector; a construct without an entry, or left where its
// `accepted_in` does not allow it, is ERR-GEN-001 naming file, line, construct and target (C002-REQ-104,
// C002-INV-12). Every diagnostic of the run is collected, not only the first.
//
// Detectors come from the table. The glossary detectors below stand in for a construct the table does
// not declare at all, so that a construct without a table entry still stops generation.
//
// Wiring anchors (`variant_required` constructs: CLI invocation lines, the Claude Code host probe, other
// `${CLAUDE_PLUGIN_ROOT}` uses; "Claude Code wiring" sections; the anchors of the tables' `variants`) are
// replaced by the variant pass (./wiring.ts), which runs first (§3 step 2) and owns their coverage check
// (§3 step 3, ERR-GEN-002). The constructs then apply to the variant text as to any body line; an anchor
// construct left after the pass is a leak (ERR-GEN-001). A diagnostic on a variant line names the variant
// file and its line.
import { diagnostic, type Diagnostic } from "../diagnostics.ts";
import type { EmitInput, SourceDoc, SourceFile } from "../model.ts";
import type { Construct, Context, MappingTable, Mode, Target } from "../tables.ts";
import { fieldLine } from "./frontmatter.ts";
import { applyVariants, type WiredLine } from "./wiring.ts";

/** Detector of a glossary construct, used when the table has no construct of that id. */
interface GlossaryDetector {
  id: string;
  kind: Construct["kind"];
  detect: string;
  /** An anchor of the variant pass (`variant_required` on both targets). */
  anchor?: true;
}

export const GLOSSARY: readonly GlossaryDetector[] = [
  { id: "guard-line", kind: "guard-line", detect: "^This command runs in the `architect:sdd-conductor` main session\\." },
  { id: "cli-invocation", kind: "cli-invocation", detect: "\\$\\{CLAUDE_PLUGIN_ROOT\\}/scripts/sdd\\.mjs", anchor: true },
  { id: "claude-host", kind: "other", detect: "\\bclaude --version\\b", anchor: true },
  { id: "plugin-root-templates", kind: "plugin-root", detect: "\\$\\{CLAUDE_PLUGIN_ROOT\\}/templates/" },
  // Every `${PLUGIN_ROOT}` spelling is a leak, `/templates/` and `/scripts/sdd.mjs` included; only the
  // `${CLAUDE_PLUGIN_ROOT}` spellings of those two are owned by other constructs (C002-IF-001 §2, D-013 item 1).
  { id: "plugin-root", kind: "plugin-root", detect: "\\$\\{PLUGIN_ROOT\\}|\\$\\{CLAUDE_PLUGIN_ROOT\\}(?!/templates/|/scripts/sdd\\.mjs)", anchor: true },
  { id: "plugin-data", kind: "plugin-data", detect: "\\$\\{CLAUDE_PLUGIN_DATA\\}" },
  { id: "arguments", kind: "arguments", detect: "\\$ARGUMENTS\\b" },
  { id: "command-reference", kind: "command-reference", detect: "/architect:(?=[a-z])" },
  // The Claude Code way to start the conductor, in its description: each target names its own (C002-T-037).
  { id: "conductor-start", kind: "other", detect: "\\(claude --agent (?:architect:)?sdd-conductor\\)" },
  // The doctor's host list in its description names Claude Code: each target names its own host and rows
  // (C002-IF-001 §2 "Frontmatter text", decided for defect D-010 item 4).
  { id: "doctor-description", kind: "other", detect: "\\(node, git, Claude Code, ripwire, Serena, ast-grep, Context7, DeepWiki\\)" },
  { id: "agent-reference", kind: "agent-reference", detect: "\\barchitect:(?=sdd-)" },
  { id: "ask-user-question", kind: "question-tool-name", detect: "\\bAskUserQuestion\\b" },
  { id: "task-tools", kind: "task-tool-name", detect: "\\bTask(?:Create|Update|List)\\b" },
  { id: "tool-search", kind: "other", detect: "\\bToolSearch\\b" },
  { id: "mcp-tool-name", kind: "mcp-tool-name", detect: "\\bmcp__plugin_architect_[a-z0-9]+__[A-Za-z0-9_-]+" },
  { id: "bash-prose", kind: "tool-name", detect: "\\bBash\\b" },
  // The Glob tool named in a body is a wiring anchor on every target (C002-IF-001 §2 row "`Glob` in prose",
  // defect D-020 item 1): the whole, case-sensitive word only, so `Global` and the host tool `glob` are no anchor.
  { id: "glob-prose", kind: "tool-name", detect: "\\bGlob\\b", anchor: true },
];

/** Words of a diagnostic per construct kind (`<kind> "<construct>"` of ERR-GEN-001). */
const KIND_LABEL: Record<Construct["kind"], string> = {
  "tool-name": "tool name",
  "mcp-tool-name": "MCP tool name",
  "model-name": "model name",
  "plugin-root": "plugin root variable",
  "plugin-data": "plugin data variable",
  arguments: "arguments variable",
  "agent-reference": "agent reference",
  "command-reference": "command reference",
  "guard-line": "guard line",
  "question-tool-name": "question tool name",
  "cli-invocation": "CLI invocation",
  "task-tool-name": "task tool name",
  other: "construct",
};

/** Frontmatter fields the structural translator (C002-T-026) owns; every other text field is translated here. */
const STRUCTURAL_FIELDS = new Set(["tools"]);

export type DocRole = "agent" | "command" | "skill" | "resource";

export interface TranslatedDoc {
  /** Source path relative to the plugin folder. */
  path: string;
  role: DocRole;
  /** Translated text fields of the frontmatter (description, argument-hint, …), in source order. */
  fields: Record<string, string>;
  /** Translated body (LF); a dropped line is gone. */
  body: string;
  /** 1-based source line of each body line, for later passes and checks. */
  sourceLines: number[];
}

export interface BodiesResult {
  docs: TranslatedDoc[];
  diagnostics: Diagnostic[];
}

export interface ConstructOptions {
  /**
   * `applied` (default): the variant pass runs first and an anchor construct left is a leak. `pending`: no
   * variant pass; anchors are left as they are and not reported (the body-construct pass alone).
   */
  variantAnchors?: "pending" | "applied";
}

/** One active detector: the table's construct, or the glossary stand-in for a construct the table lacks. */
interface Detector {
  id: string;
  kind: Construct["kind"];
  re: RegExp;
  contexts: readonly Context[];
  accepted: readonly Context[];
  action: Construct["action"] | null;
}

function detectors(table: MappingTable): Detector[] {
  const own: Detector[] = table.constructs.map((c) => ({
    id: c.id,
    kind: c.kind,
    re: new RegExp(c.detect, "gu"),
    contexts: c.contexts,
    accepted: c.accepted_in ?? [],
    action: c.action,
  }));
  const ids = new Set(own.map((d) => d.id));
  const standIns: Detector[] = GLOSSARY.filter((g) => !ids.has(g.id)).map((g) => ({
    id: g.id,
    kind: g.kind,
    re: new RegExp(g.detect, "gu"),
    contexts: [],
    accepted: [],
    action: g.anchor ? { variant_required: true } : null,
  }));
  return [...own, ...standIns];
}

const isAnchor = (d: Detector) => d.action !== null && "variant_required" in d.action;
const bare = (match: string) => match.replace(/^`+|`+$/g, "");

interface Ctx {
  table: MappingTable;
  target: Target;
  mode: Mode;
  dets: Detector[];
  anchors: "pending" | "applied";
  diagnostics: Diagnostic[];
  /** `<file>\0<line>\0<id>\0<match>` of each construct already reported, so the scan does not repeat it. */
  reported: Set<string>;
  /** Body lines after the variant pass, per source path; absent when the pass did not run. */
  wired?: Map<string, WiredLine[]>;
}

function unmapped(ctx: Ctx, file: string, line: number, d: Detector, match: string, why?: string): void {
  const key = `${file}\0${line}\0${d.id}\0${match}`;
  if (ctx.reported.has(key)) return;
  ctx.reported.add(key);
  const construct = bare(match);
  // A construct of kind `other` has no kind word of its own: its id names it (`construct doctor-description`, C002-TS-658).
  const kind = d.kind === "other" ? `${KIND_LABEL.other} ${d.id}` : KIND_LABEL[d.kind];
  ctx.diagnostics.push(
    diagnostic("ERR-GEN-001", `${file}:${line}: ${kind} "${construct}" ${why ?? `has no entry in the ${ctx.target} mapping table`}`, {
      file,
      line,
      target: ctx.target,
      construct,
    }),
  );
}

/** Replacement text of one match, or null with a diagnostic when the table cannot translate it. */
function replacement(ctx: Ctx, file: string, line: number, d: Detector, match: string): string | null {
  const action = d.action as { replace: string | { by_mode: Partial<Record<Mode, string>> } };
  const text = typeof action.replace === "string" ? action.replace : action.replace.by_mode[ctx.mode];
  if (text === undefined) {
    unmapped(ctx, file, line, d, match, `has no entry for mode ${ctx.mode} in the ${ctx.target} mapping table`);
    return null;
  }
  if (d.kind !== "mcp-tool-name") return text;
  // MCP tool name: `mcp__plugin_architect_<server>__<tool>` → the body form, for a server the table declares in this mode.
  const m = /^mcp__plugin_architect_([a-z0-9]+)__([A-Za-z0-9_-]+)$/.exec(match);
  const server = m ? ctx.table.mcp_servers[m[1]!] : undefined;
  if (!m || !server || !server.modes.includes(ctx.mode)) {
    unmapped(ctx, file, line, d, match, `names a server that the ${ctx.target} mapping table does not declare in mode ${ctx.mode}`);
    return null;
  }
  return text.replaceAll("{server}", m[1]!).replaceAll("{tool}", m[2]!);
}

/** §3 step 6 on one line: constructs in array order; null when a `drop_line` construct removes it. */
function translateLine(ctx: Ctx, file: string, line: number, text: string, context: Context): string | null {
  let out = text;
  for (const d of ctx.dets) {
    if (d.action === null || !d.contexts.includes(context) || isAnchor(d)) continue;
    d.re.lastIndex = 0;
    if (!d.re.test(out)) continue;
    if ("drop_line" in d.action) return null;
    d.re.lastIndex = 0;
    out = out.replace(d.re, (match) => replacement(ctx, file, line, d, match) ?? match);
  }
  return out;
}

/** §3 step 8 on one translated line: every detector match outside `accepted_in` is ERR-GEN-001. */
function scanLine(ctx: Ctx, file: string, line: number, text: string, context: Context, coveredAnchors = false): void {
  for (const d of ctx.dets) {
    // An anchor left on a source body line is the coverage check's ERR-GEN-002, not a second report here.
    if (isAnchor(d) && (ctx.anchors === "pending" || coveredAnchors)) continue;
    if (d.accepted.includes(context)) continue;
    d.re.lastIndex = 0;
    for (const m of text.matchAll(d.re)) unmapped(ctx, file, line, d, m[0]);
  }
}

/** Body lines of a file as the variant pass left them, or as in the source when it did not run. */
function bodyLines(ctx: Ctx, path: string, firstLine: number, lines: readonly string[]): WiredLine[] {
  return ctx.wired?.get(path) ?? lines.map((text, i) => ({ text, line: firstLine + i, origin: { file: path, line: firstLine + i } }));
}

function translateText(ctx: Ctx, lines: readonly WiredLine[], context: Context): { lines: string[]; sourceLines: number[] } {
  const out: string[] = [];
  const sourceLines: number[] = [];
  for (const l of lines) {
    const { file, line } = l.origin;
    const t = translateLine(ctx, file, line, l.text, context);
    if (t === null) continue;
    scanLine(ctx, file, line, t, context, ctx.wired !== undefined && l.variant === undefined);
    out.push(t);
    sourceLines.push(l.line);
  }
  return { lines: out, sourceLines };
}

function translateDoc(ctx: Ctx, doc: SourceDoc, role: DocRole): TranslatedDoc {
  const fields: Record<string, string> = {};
  for (const [key, value] of Object.entries(doc.data ?? {})) {
    if (STRUCTURAL_FIELDS.has(key) || typeof value !== "string") continue;
    const line = fieldLine(doc, key) ?? 1;
    // A folded or multi-line value is one text; its diagnostics name the field's first line.
    fields[key] = value
      .split("\n")
      .map((part) => {
        const t = translateLine(ctx, doc.path, line, part, "frontmatter") ?? "";
        scanLine(ctx, doc.path, line, t, "frontmatter");
        return t;
      })
      .join("\n");
  }
  const body = translateText(ctx, bodyLines(ctx, doc.path, doc.bodyStartLine, doc.lines.slice(doc.bodyStartLine - 1)), "body");
  return { path: doc.path, role, fields, body: body.lines.join("\n"), sourceLines: body.sourceLines };
}

function translateResource(ctx: Ctx, file: SourceFile): TranslatedDoc {
  const body = translateText(ctx, bodyLines(ctx, file.path, 1, file.text.split("\n")), "body");
  return { path: file.path, role: "resource", fields: {}, body: body.lines.join("\n"), sourceLines: body.sourceLines };
}

/**
 * Translates every agent, command and skill body (and the Markdown resources of the skills) of the source
 * plugin for one target: the variant pass and its coverage check (C002-IF-001 §3 steps 2 and 3), then
 * the constructs and the leak scan (steps 6 and 8). `input.peers` holds the tables of every target of
 * the run (C002-IF-001 §3 step 3).
 */
export function translateBodies(input: Pick<EmitInput, "source" | "table" | "target" | "mode" | "peers">, options: ConstructOptions = {}): BodiesResult {
  const dets = detectors(input.table);
  const anchors = options.variantAnchors ?? "applied";
  const ctx: Ctx = { table: input.table, target: input.target, mode: input.mode, dets, anchors, diagnostics: [], reported: new Set() };
  if (anchors === "applied") {
    const wiring = applyVariants(
      input,
      dets.filter((d) => isAnchor(d) && (d.contexts.length === 0 || d.contexts.includes("body"))).map((d) => ({ id: d.id, re: d.re })),
    );
    ctx.wired = wiring.bodies;
    ctx.diagnostics.push(...wiring.diagnostics);
  }
  const docs: TranslatedDoc[] = [];
  for (const a of input.source.agents) docs.push(translateDoc(ctx, a, "agent"));
  for (const c of input.source.commands) docs.push(translateDoc(ctx, c, "command"));
  for (const s of input.source.skills) {
    docs.push(translateDoc(ctx, s.doc, "skill"));
    for (const r of s.resources) if (r.path.endsWith(".md")) docs.push(translateResource(ctx, r));
  }
  return { docs, diagnostics: ctx.diagnostics };
}

/**
 * The leak scan alone (§3 step 8) on a text of a given context, for the target structure check
 * (C002-T-035) and tests: ERR-GEN-001 diagnostics for every construct left outside `accepted_in`.
 */
export function scanText(
  table: MappingTable,
  target: Target,
  mode: Mode,
  file: string,
  text: string,
  context: Context = "body",
  options: ConstructOptions = {},
): Diagnostic[] {
  const ctx: Ctx = { table, target, mode, dets: detectors(table), anchors: options.variantAnchors ?? "applied", diagnostics: [], reported: new Set() };
  text.split("\n").forEach((l, i) => scanLine(ctx, file, i + 1, l, context));
  return ctx.diagnostics;
}
