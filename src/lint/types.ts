// Lint contracts shared by the CLI front-end and the rules. The rule framework itself (fixtures,
// generic rules, per-rule modules) is built in C001-T-018; this is the minimum the CLI needs.
import type { ChangeGraph } from "../model/graph.ts";
import type { JsonDiff } from "../workspace/status.ts";

export type Severity = "error" | "warn" | "info";
export type Phase = "00-ideation" | "10-spec" | "20-plan";
export const PHASES: readonly Phase[] = ["00-ideation", "10-spec", "20-plan"];

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
  graph: ChangeGraph;
}

/** A requirement's Statement field, located for reporting. */
export interface Statement {
  id: string;
  path: string;
  line: number;
  text: string;
}

export interface LintContext {
  /** Repository root (absolute). */
  root: string;
  changes: LintChange[];
  phase: Phase | null;
  /** `--quick --file`: the single file in scope, relative to the repository root. */
  file?: string;
  /** Requirement statements in scope. */
  statements: Statement[];
  /** Workspace-level data gathered by the engine, so rules stay pure (C001-CON-13). */
  workspace: WorkspaceFacts;
}

export interface WorkspaceFacts {
  /** Root entries of `.sdd/`. */
  entries: { name: string; isDirectory: boolean }[];
  /** Differences between the stored registry.json and the rebuild (generated_at ignored). */
  registryDrift: JsonDiff[];
}

export interface LintRule {
  code: string;
  severity: Severity;
  fix: string;
  check(ctx: LintContext): RuleFinding[];
}
