// Critic report findings (C001-IF-11 §2): `### CR-<n> — <title>` sections with Severity and Status
// fields. Used by the gate summary and the blocker refusal (C001-REQ-808).
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parseBlocks } from "../model/blocks.ts";
import { toLines } from "../model/frontmatter.ts";

export interface CriticFinding {
  id: string;
  title: string;
  severity: string;
  /** `open`, `resolved` or `waived` (the first word of the Status field; `open` when absent). */
  status: string;
  file: string;
  line: number;
}

/** The critic report of a phase: `90-critic-report.md`, or `critic-report.md` (ideation). */
export function criticReportPath(changeDir: string, phase: string): string | null {
  for (const name of ["90-critic-report.md", "critic-report.md"]) {
    const p = join(changeDir, phase, name);
    if (existsSync(p)) return p;
  }
  return null;
}

export function criticFindings(changeDir: string, phase: string): CriticFinding[] {
  const path = criticReportPath(changeDir, phase);
  if (!path) return [];
  const lines = toLines(readFileSync(path, "utf8"));
  const blocks = parseBlocks(lines, 1);
  const file = `${phase}/${path.slice(path.lastIndexOf(path.includes("\\") ? "\\" : "/") + 1)}`;
  const out: CriticFinding[] = [];
  for (const h of blocks.headings) {
    const m = /^(CR-\d+)\s*[—–-]\s*(.*)$/.exec(h.text);
    if (!m) continue;
    const end = blocks.sectionEnd(h.line);
    const field = (name: string) => blocks.fields.find((f) => f.line > h.line && f.line <= end && f.name === name)?.value ?? "";
    const status = (/^(open|resolved|waived)\b/i.exec(field("Status").replace(/[*_`]/g, "").trim())?.[1] ?? "open").toLowerCase();
    out.push({ id: m[1]!, title: m[2]!.trim(), severity: field("Severity").replace(/[*_`]/g, "").trim().toLowerCase(), status, file, line: h.line });
  }
  return out;
}
