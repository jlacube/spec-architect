// `sdd hook post-write` (C001-REQ-705, C001-IF-07 §2, §4): after Write or Edit of a file below `.sdd/`,
// a quick lint of that file. Findings (at most 15, most severe first, CLI human format) go back to the
// model as PostToolUse `additionalContext`; no findings, or a file outside `.sdd/`, means no output.
import { normalisePath, pathKey } from "../io/paths.ts";
import { lintWorkspace } from "../lint/engine.ts";
import type { Finding, LintRule } from "../lint/types.ts";
import { formatFinding } from "../cli/output.ts";
import { findWorkspace } from "../workspace/find.ts";
import type { HookInput } from "./input.ts";

export const MAX_FINDINGS = 15;
const RANK: Record<string, number> = { error: 0, warn: 1, info: 2 };

/** The PostToolUse JSON document to print, or null for no output. */
export function postWriteFeedback(input: HookInput | null, rules: readonly LintRule[], tool: string): string | null {
  if (input === null || typeof input.cwd !== "string" || input.cwd === "") return null;
  const ti = input.tool_input ?? {};
  const raw = typeof ti["file_path"] === "string" ? ti["file_path"] : null;
  if (raw === null) return null;
  const file = normalisePath(raw, { cwd: input.cwd });
  const root = findWorkspace(normalisePath(input.cwd));
  if (root === null) return null;
  const sdd = pathKey(normalisePath(".sdd", { cwd: root }));
  if (!pathKey(file).startsWith(sdd + "/")) return null;
  let findings: Finding[];
  try {
    findings = lintWorkspace(root, { file, cwd: input.cwd, rules, tool, phase: null }).findings;
  } catch {
    return null; // feedback is best effort; the write itself already succeeded
  }
  if (findings.length === 0) return null;
  const sorted = [...findings].sort((a, b) => (RANK[a.severity] ?? 3) - (RANK[b.severity] ?? 3));
  const lines = sorted.slice(0, MAX_FINDINGS).map(formatFinding);
  if (sorted.length > MAX_FINDINGS) lines.push(`… ${sorted.length - MAX_FINDINGS} more: run sdd lint --quick --file ${raw}`);
  const context = [`sdd quick lint of ${raw}: ${findings.length} finding(s)`, ...lines].join("\n");
  return JSON.stringify({ hookSpecificOutput: { hookEventName: "PostToolUse", additionalContext: context } });
}
