// Generator diagnostics (C002-COMP-001): the ERR-GEN codes of C002-SPEC-ERRORS §1, their fixes and
// both print forms of C002-IF-004 §Output — the human line `<code>: <message>. Fix: <fix>` and the
// `--json` record, whose message holds the text without the code.
import type { Target } from "./tables.ts";

export type GenCode =
  | "ERR-GEN-001"
  | "ERR-GEN-002"
  | "ERR-GEN-003"
  | "ERR-GEN-004"
  | "ERR-GEN-005"
  | "ERR-GEN-006"
  | "ERR-GEN-007"
  | "ERR-GEN-008"
  | "ERR-GEN-009"
  | "ERR-GEN-010";

export interface Diagnostic {
  severity: "error";
  code: GenCode;
  /** Source-plugin-relative, `/`-separated path of the file concerned, when there is one. */
  file?: string;
  /** 1-based line in `file`, when known. */
  line?: number;
  /** The target the diagnostic belongs to; absent when it concerns the run as a whole. */
  target?: Target;
  /** The construct, tool or field concerned (ERR-GEN-001 …). */
  construct?: string;
  /** The Message cell of the catalogue, placeholders filled, without the code. */
  message: string;
  fix: string;
}

/** Fix column of the catalogue; `<target>` is replaced by the diagnostic's target. */
const FIX: Record<GenCode, string> = {
  "ERR-GEN-001": "Add the entry to `plugins/architect/targets/<target>.json`, or remove the construct from the source",
  "ERR-GEN-002": "Add the variant file under `plugins/architect/targets/<target>/wiring/` and its `variants` entry",
  "ERR-GEN-003": "Set one of the three tiers in the source agent",
  "ERR-GEN-004": "Correct the table entry at the pointer",
  "ERR-GEN-005": "Update the anchor to the current source text, or remove the entry",
  "ERR-GEN-006": "Use a token of C002-IF-001 §4",
  "ERR-GEN-007": "Fix the source file",
  "ERR-GEN-008": "Choose an output folder outside `plugins/architect/`",
  "ERR-GEN-009": "Use a mode of C002-IF-001 (`native-permissions`, `sdd-mcp-server` for opencode; `sdd-mcp-server`, `copilot-hooks` for copilot)",
  "ERR-GEN-010": "Check disk space and permissions, then run again",
};

/** Builds a diagnostic with the catalogue's fix. */
export function diagnostic(code: GenCode, message: string, at: { file?: string; line?: number; target?: Target; construct?: string } = {}): Diagnostic {
  const d: Diagnostic = { severity: "error", code, message, fix: FIX[code].replaceAll("<target>", at.target ?? "<target>") };
  if (at.file !== undefined) d.file = at.file;
  if (at.line !== undefined) d.line = at.line;
  if (at.target !== undefined) d.target = at.target;
  if (at.construct !== undefined) d.construct = at.construct;
  return d;
}

/** Human print form: `<code>: <message>. Fix: <fix>` (C002-SPEC-ERRORS print form, defect D-008). */
export function formatDiagnostic(d: Diagnostic): string {
  return `${d.code}: ${d.message}. Fix: ${d.fix}`;
}

const cmp = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

/** Print order of C002-IF-004 §Output: by source file, line and target (run-wide diagnostics first). */
export function sortDiagnostics(list: readonly Diagnostic[]): Diagnostic[] {
  return [...list].sort(
    (a, b) =>
      cmp(a.file ?? "", b.file ?? "") ||
      (a.line ?? 0) - (b.line ?? 0) ||
      cmp(a.target ?? "", b.target ?? "") ||
      cmp(a.code, b.code) ||
      cmp(a.message, b.message),
  );
}
