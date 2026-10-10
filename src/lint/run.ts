// Runs lint rules over the selected changes and assembles the report of C001-IF-11 §1.
import type { Finding, LintChange, LintContext, LintRule, Phase, Statement, WorkspaceFacts } from "./types.ts";

export interface LintReport {
  tool: string;
  scope: { changes: string[]; phase: Phase | null; quick: boolean; file?: string };
  summary: { error: number; warn: number; info: number };
  findings: Finding[];
}

function inScope(path: string, ctx: LintContext): boolean {
  if (ctx.file !== undefined) return path === ctx.file;
  if (ctx.phase === null) return true;
  return ctx.changes.some((c) => path.startsWith(`${c.folder}/${ctx.phase}/`));
}

export function buildContext(root: string, changes: LintChange[], phase: Phase | null, file: string | undefined, workspace: WorkspaceFacts): LintContext {
  const ctx: LintContext = { root, changes, phase, statements: [], workspace };
  if (file !== undefined) ctx.file = file;
  const statements: Statement[] = [];
  for (const c of changes) {
    for (const n of c.graph.nodes) {
      if (n.type !== "REQ") continue;
      const f = n.fields.find((x) => x.name === "Statement");
      if (!f) continue;
      const path = `${c.folder}/${n.file}`;
      if (inScope(path, ctx)) statements.push({ id: n.id, path, line: f.line, text: f.value });
    }
  }
  ctx.statements = statements;
  return ctx;
}

const ORDER: Record<string, number> = { error: 0, warn: 1, info: 2 };

export function runLint(ctx: LintContext, rules: readonly LintRule[], tool: string): LintReport {
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
  findings.sort(
    (a, b) =>
      (ORDER[a.severity] ?? 3) - (ORDER[b.severity] ?? 3) ||
      a.path.localeCompare(b.path) ||
      (a.line ?? 0) - (b.line ?? 0) ||
      a.code.localeCompare(b.code),
  );
  const summary = { error: 0, warn: 0, info: 0 };
  for (const f of findings) summary[f.severity]++;
  const scope: LintReport["scope"] = { changes: ctx.changes.map((c) => `CHG-${c.change}`), phase: ctx.phase, quick: ctx.file !== undefined };
  if (ctx.file !== undefined) scope.file = ctx.file;
  return { tool, scope, summary, findings };
}
