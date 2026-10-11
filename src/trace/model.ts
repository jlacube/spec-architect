// Trace model of one change (C001-COMP-04): the typed graph of C001-IF-12 and the relations the
// traceability matrices read. Built from the workspace graph and the lint's spec facts, so trace and
// lint agree on what a link is.
import { basename, dirname } from "node:path";
import { findIds } from "../model/ids.ts";
import { buildChangeGraph, type GraphNode } from "../model/graph.ts";
import { splitFrontmatter } from "../model/frontmatter.ts";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { gatherSpecFacts } from "../lint/spec-facts.ts";
import type { LintChange } from "../lint/types.ts";

export type Relation =
  | "story-of" | "acceptance-of" | "scenario-of" | "implements" | "satisfies" | "verified-by" | "depends-on" | "realizes"
  | "serves" | "covers" | "mitigates" | "traces-to" | "supersedes" | "references";

/** Graph edge kinds (field names) mapped to the relations of C001-IF-12; other kinds are `references`. */
const RELATIONS: Record<string, Relation> = {
  stories: "story-of",
  requirements: "traces-to",
  traces_to: "traces-to",
  acceptance: "acceptance-of",
  scenario: "scenario-of",
  implements: "implements",
  satisfies_ac: "satisfies",
  verified_by: "verified-by",
  depends_on: "depends-on",
  realizes: "realizes",
  serves: "serves",
  dod: "covers",
  risk_refs: "mitigates",
  supersedes: "supersedes",
};

export interface TraceNode {
  id: string;
  type: string;
  file: string;
  line: number;
  title: string;
  status?: string;
  content_hash: string;
}

export interface TraceEdge {
  from: string;
  to: string;
  relation: Relation;
}

export interface TraceDocument {
  change: string;
  generated_at: string;
  nodes: TraceNode[];
  edges: TraceEdge[];
}

/** Natural order of IDs: change, type, then numeric sequence and sub-number. */
export function compareIds(a: string, b: string): number {
  const pa = /^C(\d{3})-([A-Z]+)-(\d+)(?:\.(\d+))?$/.exec(a);
  const pb = /^C(\d{3})-([A-Z]+)-(\d+)(?:\.(\d+))?$/.exec(b);
  if (!pa || !pb) return a.localeCompare(b);
  return pa[1]!.localeCompare(pb[1]!) || pa[2]!.localeCompare(pb[2]!) || Number(pa[3]) - Number(pb[3]) || Number(pa[4] ?? 0) - Number(pb[4] ?? 0);
}

export interface TraceModel {
  /** The change as the lint sees it (graph and spec facts). */
  lint: LintChange;
  doc: Omit<TraceDocument, "generated_at">;
  /** Heading-defined node of an ID. */
  node(id: string): GraphNode | undefined;
  /** IDs of the given type in a node's field. */
  field(id: string, field: string, type: string): string[];
  /** Scenarios defined under an acceptance criterion. */
  scenariosOf(ac: string): string[];
  /** Phase statuses from change.md (`not-started` when absent). */
  phaseStatus(phase: string): string;
}

export function buildTrace(changeDir: string): TraceModel {
  const graph = buildChangeGraph(changeDir);
  const sddDir = dirname(changeDir);
  const spec = gatherSpecFacts(sddDir, graph);
  const fm = graph.files.find((f) => f.path === "change.md")?.frontmatter ?? {};
  const profile = fm["profile"] === "lite" ? "lite" : "full";
  const lint: LintChange = { change: graph.change, folder: `.sdd/${basename(changeDir)}`, profile, graph, spec };

  const defined = new Set(graph.nodes.map((n) => n.id));
  const nodes: TraceNode[] = [];
  const seen = new Set<string>();
  for (const n of graph.nodes) {
    if (seen.has(n.id)) continue;
    seen.add(n.id);
    const node: TraceNode = { id: n.id, type: n.type, file: n.file, line: n.line, title: n.title, content_hash: n.contentHash };
    if (n.form === "frontmatter") {
      const status = graph.files.find((f) => f.path === n.file)?.frontmatter?.["status"];
      if (typeof status === "string") node.status = status;
    }
    nodes.push(node);
  }
  nodes.sort((a, b) => compareIds(a.id, b.id));

  // Edges between defined IDs; references in code spans or quotes are examples, not links.
  const keys = new Set<string>();
  const edges: TraceEdge[] = [];
  for (const e of graph.edges) {
    if (e.context !== "text" || !defined.has(e.from) || !defined.has(e.to) || e.from === e.to) continue;
    const relation = RELATIONS[e.kind] ?? "references";
    const key = `${e.from} ${e.to} ${relation}`;
    if (keys.has(key)) continue;
    keys.add(key);
    edges.push({ from: e.from, to: e.to, relation });
  }
  edges.sort((a, b) => compareIds(a.from, b.from) || compareIds(a.to, b.to) || a.relation.localeCompare(b.relation));

  const headings = new Map<string, GraphNode>();
  for (const n of graph.nodes) if (n.form === "heading" && !headings.has(n.id)) headings.set(n.id, n);
  const scenarios = new Map<string, string[]>();
  for (const e of graph.edges) if (e.kind === "scenario") scenarios.set(e.from, [...(scenarios.get(e.from) ?? []), e.to]);

  const changeMd = join(changeDir, "change.md");
  const phases = (existsSync(changeMd) ? (splitFrontmatter(readFileSync(changeMd, "utf8")).data?.["phases"] ?? {}) : {}) as Record<string, { status?: unknown }>;

  return {
    lint,
    doc: { change: `CHG-${graph.change}`, nodes, edges },
    node: (id) => headings.get(id),
    field: (id, name, type) =>
      findIds(headings.get(id)?.fields.find((f) => f.name === name)?.value ?? "", graph.change)
        .map((h) => h.id)
        .filter((x) => x.includes(`-${type}-`)),
    scenariosOf: (ac) => [...new Set(scenarios.get(ac) ?? [])],
    phaseStatus: (phase) => (typeof phases[phase]?.status === "string" ? (phases[phase]!.status as string) : "not-started"),
  };
}
