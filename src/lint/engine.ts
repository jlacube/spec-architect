// Lint engine (C001-COMP-04): gathers the workspace into a LintContext, runs the pure rules in
// scope and assembles the report of C001-IF-11 §1.
//
// Scope (C001-REQ-701): a named change; or every non-archived change plus the workspace root files
// (SDD.md, registry.json, _living/) when none is named; optionally restricted to one phase, where
// cross-phase rules still see the whole graph and only findings under that phase are kept.
// Quick mode (C001-REQ-705): only `file` rules, on one file, without the workspace-wide gathering.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { CliError, usage } from "../cli/errors.ts";
import { isInside, normalisePath, relativePath } from "../io/paths.ts";
import { parseBlocks } from "../model/blocks.ts";
import { splitFrontmatter } from "../model/frontmatter.ts";
import { buildChangeGraph, parseArtifact, type ChangeGraph } from "../model/graph.ts";
import { loadLedger } from "../workspace/ledger.ts";
import { rebuildRegistry, registryDrift } from "../workspace/status.ts";
import { gatherSpecFacts } from "./spec-facts.ts";
import type { Finding, LintChange, LintContext, LintRule, Located, Phase, Statement, TextFile, WorkspaceFacts } from "./types.ts";

export interface LintReport {
  tool: string;
  scope: { changes: string[]; phase: Phase | null; quick: boolean; file?: string };
  summary: { error: number; warn: number; info: number };
  findings: Finding[];
}

export interface LintOptions {
  /** Change number to lint (`sdd lint <NNN>`). */
  change?: string;
  phase?: Phase | null;
  /** `--quick --file`: absolute or cwd-relative path of the one file to lint. */
  file?: string;
  cwd: string;
  rules: readonly LintRule[];
  tool: string;
  trace?: (event: string, data: Record<string, string | number>) => void;
}

interface Folder {
  name: string;
  dir: string;
  archived: boolean;
}

function changeFolders(sdd: string): Folder[] {
  const out: Folder[] = [];
  for (const [base, archived] of [[sdd, false], [join(sdd, "_archive"), true]] as const) {
    if (!existsSync(base)) continue;
    for (const name of readdirSync(base).sort()) {
      const dir = join(base, name);
      if (/^\d{3}-/.test(name) && statSync(dir).isDirectory()) out.push({ name, dir, archived });
    }
  }
  return out;
}

function changeStatus(dir: string): { status: string; profile: "lite" | "full" } {
  const p = join(dir, "change.md");
  const fm = existsSync(p) ? (splitFrontmatter(readFileSync(p, "utf8")).data ?? {}) : {};
  return { status: typeof fm["status"] === "string" ? fm["status"] : "active", profile: fm["profile"] === "lite" ? "lite" : "full" };
}

function textFile(abs: string, path: string): TextFile {
  const text = readFileSync(abs, "utf8");
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  if (!path.endsWith(".md")) return { path, lines, inFence: () => false };
  const blocks = parseBlocks(lines, 1);
  return { path, lines, inFence: (l) => blocks.inFence(l) };
}

function filesOf(dir: string): string[] {
  const out: string[] = [];
  const walk = (d: string) => {
    for (const name of readdirSync(d).sort()) {
      const p = join(d, name);
      if (statSync(p).isDirectory()) walk(p);
      else if (name.endsWith(".md")) out.push(p);
    }
  };
  walk(dir);
  return out;
}

function addDefinitions(map: Map<string, Located[]>, graph: ChangeGraph, folderRel: string): void {
  for (const n of graph.nodes) map.set(n.id, [...(map.get(n.id) ?? []), { path: `${folderRel}/${n.file}`, line: n.line }]);
}

function inScope(path: string, ctx: LintContext): boolean {
  if (ctx.file !== undefined) return path === ctx.file;
  if (ctx.phase === null) return true;
  return ctx.changes.some((c) => path.startsWith(`${c.folder}/${ctx.phase}/`));
}

function statements(changes: LintChange[]): Statement[] {
  const out: Statement[] = [];
  for (const c of changes)
    for (const n of c.graph.nodes) {
      if (n.type !== "REQ") continue;
      const f = n.fields.find((x) => x.name === "Statement");
      if (f) out.push({ id: n.id, path: `${c.folder}/${n.file}`, line: f.line, text: f.value });
    }
  return out;
}

export function lintWorkspace(root: string, options: LintOptions): LintReport {
  const trace = options.trace ?? (() => {});
  const sdd = join(root, ".sdd");
  const folders = changeFolders(sdd);
  const phase = options.phase ?? null;
  let file: string | undefined;
  let selected = folders.filter((f) => !f.archived && changeStatus(f.dir).status !== "archived");

  if (options.file !== undefined) {
    const abs = normalisePath(options.file, { cwd: options.cwd });
    if (!isInside(sdd, abs)) throw usage("lint", "--file must be inside .sdd/");
    if (!existsSync(abs)) throw usage("lint", `--file does not exist: ${options.file}`);
    file = relativePath(root, abs);
    const name = /^\.sdd\/(\d{3}-[^/]+)\//.exec(file)?.[1];
    selected = folders.filter((f) => !f.archived && f.name === name);
  }
  if (options.change !== undefined) {
    const match = folders.filter((f) => !f.archived && f.name.startsWith(options.change + "-"));
    if (match.length !== 1) throw new CliError("ERR-CLI-002", { NNN: options.change });
    selected = match;
  }
  const quick = file !== undefined;
  const workspaceScope = options.change === undefined && !quick;
  const rules = options.rules.filter((r) => (quick ? r.scope === "file" : r.scope !== "workspace" || workspaceScope));

  const changes: LintChange[] = selected.map((f) => {
    const graph = buildChangeGraph(f.dir);
    trace("graph", { change: graph.change, files: graph.files.length, nodes: graph.nodes.length, edges: graph.edges.length });
    return { change: graph.change, folder: `.sdd/${f.name}`, profile: changeStatus(f.dir).profile, graph, spec: gatherSpecFacts(sdd, graph) };
  });

  // Workspace-wide definitions, tombstones and living files (not needed in quick mode).
  const definitions = new Map<string, Located[]>();
  const activeDefinitions = new Map<string, Located[]>();
  const tombstones = new Set<string>();
  const living: WorkspaceFacts["living"] = [];
  if (!quick) {
    const graphs = new Map(changes.map((c) => [c.folder, c.graph]));
    for (const f of folders) {
      const rel = f.archived ? `.sdd/_archive/${f.name}` : `.sdd/${f.name}`;
      const g = graphs.get(rel) ?? buildChangeGraph(f.dir);
      addDefinitions(definitions, g, rel);
      if (!f.archived && changeStatus(f.dir).status !== "archived") addDefinitions(activeDefinitions, g, rel);
      for (const t of loadLedger(f.dir).tombstones) tombstones.add(t.id);
    }
    const livingDir = join(sdd, "_living");
    if (existsSync(livingDir)) {
      for (const abs of filesOf(livingDir)) {
        const rel = relativePath(root, abs);
        const parsed = parseArtifact(abs, rel.replace(/^\.sdd\//, ""));
        living.push({ path: rel, inventoryOnly: parsed.file.frontmatter?.["inventory_only"] === true, nodes: parsed.nodes });
        for (const n of parsed.nodes) {
          const loc = { path: rel, line: n.line };
          definitions.set(n.id, [...(definitions.get(n.id) ?? []), loc]);
          activeDefinitions.set(n.id, [...(activeDefinitions.get(n.id) ?? []), loc]);
        }
      }
    }
  }

  // Texts and references in scope.
  const texts: TextFile[] = [];
  const references: LintContext["references"] = [];
  for (const c of changes) {
    for (const f of c.graph.files) {
      const path = `${c.folder}/${f.path}`;
      if (file !== undefined && path !== file) continue;
      if (!f.generated) texts.push(textFile(join(root, ...path.split("/")), path));
    }
    for (const e of c.graph.edges) references.push({ ...e, path: `${c.folder}/${e.file}` });
  }
  if (workspaceScope) {
    for (const name of ["SDD.md", "registry.json"]) if (existsSync(join(sdd, name))) texts.push(textFile(join(sdd, name), `.sdd/${name}`));
    for (const l of living) texts.push(textFile(join(root, ...l.path.split("/")), l.path));
  }

  const workspace: WorkspaceFacts = { entries: [], registryDrift: [], living };
  if (workspaceScope) {
    workspace.entries = readdirSync(sdd, { withFileTypes: true }).map((e) => ({ name: e.name, isDirectory: e.isDirectory() }));
    const regPath = join(sdd, "registry.json");
    let stored: unknown = null;
    if (existsSync(regPath)) {
      try {
        stored = JSON.parse(readFileSync(regPath, "utf8")) as unknown;
      } catch {
        stored = { invalid_json: true };
      }
    }
    workspace.registryDrift = registryDrift(stored, rebuildRegistry(sdd));
  }

  const ctx: LintContext = {
    root, changes, phase, statements: [], texts, definitions, activeDefinitions, tombstones, references, workspace,
  };
  if (file !== undefined) ctx.file = file;
  ctx.statements = statements(changes).filter((s) => inScope(s.path, ctx));

  const findings: Finding[] = [];
  for (const rule of rules) {
    for (const f of rule.check(ctx)) {
      if (!inScope(f.path, ctx)) continue;
      const finding: Finding = { code: rule.code, severity: rule.severity, path: f.path, message: f.message, fix: rule.fix };
      if (f.line !== undefined) finding.line = f.line;
      if (f.ids !== undefined) finding.ids = f.ids;
      findings.push(finding);
    }
  }
  const order: Record<string, number> = { error: 0, warn: 1, info: 2 };
  findings.sort(
    (a, b) => (order[a.severity] ?? 3) - (order[b.severity] ?? 3) || a.path.localeCompare(b.path) || (a.line ?? 0) - (b.line ?? 0) || a.code.localeCompare(b.code),
  );
  const summary = { error: 0, warn: 0, info: 0 };
  for (const f of findings) summary[f.severity]++;
  trace("lint", { rules: rules.length, error: summary.error, warn: summary.warn, info: summary.info });
  const scope: LintReport["scope"] = { changes: changes.map((c) => `CHG-${c.change}`), phase, quick };
  if (file !== undefined) scope.file = file;
  return { tool: options.tool, scope, summary, findings };
}
