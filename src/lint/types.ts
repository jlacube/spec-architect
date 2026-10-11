// Lint contracts: the context the engine gathers and the pure rules it runs (C001-CON-13).
import type { Blocks } from "../model/blocks.ts";
import type { ChangeGraph, GraphEdge, GraphNode } from "../model/graph.ts";
import type { JsonDiff } from "../workspace/status.ts";

export type Severity = "error" | "warn" | "info";
export type Phase = "00-ideation" | "10-spec" | "20-plan";
export const PHASES: readonly Phase[] = ["00-ideation", "10-spec", "20-plan"];

/**
 * Where a rule's inputs live: `file` rules need only one artifact (they also run in
 * `--quick --file` mode, C001-REQ-705); `change` rules need the whole workspace graph; `workspace`
 * rules check the workspace root and run only when no change is named.
 */
export type RuleScope = "file" | "change" | "workspace";

/** What a rule reports; the engine adds the rule's code, severity and fix. */
export interface RuleFinding {
  /** Path relative to the repository root, forward slashes. */
  path: string;
  line?: number;
  ids?: string[];
  message: string;
}

/** A finding as reported (C001-IF-11 §1). */
export interface Finding extends RuleFinding {
  code: string;
  severity: Severity;
  fix: string;
}

export interface LintChange {
  /** Three-digit change number. */
  change: string;
  /** Change folder relative to the repository root, e.g. `.sdd/004-x`. */
  folder: string;
  profile: "lite" | "full";
  graph: ChangeGraph;
  spec: SpecFacts;
}

/** Facts of a change's spec that the graph does not hold (C001-IF-04 §3; C001-REQ-402, 403, 404). */
export interface SpecFacts {
  /** `kind` of change.md (`greenfield` when absent). */
  kind: string;
  /** Persona IDs defined by `P-NN` headings in the change's 10-spec. */
  personas: ReadonlySet<string>;
  /** System names allowed after `THE`: "System names" tables (change and project glossary) and COMP titles. */
  systems: readonly string[];
  /** Lines of each heading-defined US, REQ, NFR and COMP section, by ID; `line` is the heading line. */
  sections: ReadonlyMap<string, { line: number; lines: string[] }>;
  /** Parsed Markdown files of every phase by change-relative path (lines are 1-based in `blocks`). */
  docs: ReadonlyMap<string, SpecDoc>;
  /** Files of `10-spec/50-interfaces/` by change-relative path; JSON/YAML contracts carry their text. */
  interfaces: ReadonlyMap<string, string | null>;
}

export interface SpecDoc {
  lines: string[];
  blocks: Blocks;
}

/** A requirement's Statement field, located for reporting. */
export interface Statement {
  id: string;
  path: string;
  line: number;
  text: string;
}

/** A Markdown or JSON artifact in scope, for text rules. */
export interface TextFile {
  /** Path relative to the repository root. */
  path: string;
  lines: string[];
  /** True when the 1-based line lies in a fenced code block. */
  inFence(line: number): boolean;
}

export interface Located {
  path: string;
  line: number;
}

export interface LivingFile {
  path: string;
  inventoryOnly: boolean;
  nodes: GraphNode[];
}

/** Workspace-level data gathered by the engine, so rules stay pure (C001-CON-13). */
export interface WorkspaceFacts {
  /** Root entries of `.sdd/`. */
  entries: { name: string; isDirectory: boolean }[];
  /** Differences between the stored registry.json and the rebuild (generated_at ignored). */
  registryDrift: JsonDiff[];
  living: LivingFile[];
}

export interface LintContext {
  /** Repository root (absolute). */
  root: string;
  /** Changes in scope. */
  changes: LintChange[];
  phase: Phase | null;
  /** `--quick --file`: the single file in scope, relative to the repository root. */
  file?: string;
  /** Requirement statements in scope. */
  statements: Statement[];
  /** Artifacts in scope for text rules. */
  texts: TextFile[];
  /** Every definition of the workspace (active and archived changes, `_living/`), by ID. */
  definitions: ReadonlyMap<string, Located[]>;
  /** Definitions that may not repeat (active changes and `_living/`), by ID (TR-13). */
  activeDefinitions: ReadonlyMap<string, Located[]>;
  /** Tombstoned IDs of every ledger. */
  tombstones: ReadonlySet<string>;
  /** References made by artifacts in scope (edges with their repository-relative path). */
  references: (GraphEdge & { path: string })[];
  workspace: WorkspaceFacts;
}

export interface LintRule {
  code: string;
  severity: Severity;
  fix: string;
  scope: RuleScope;
  check(ctx: LintContext): RuleFinding[];
}
