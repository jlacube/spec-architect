// YAML frontmatter splitting and the text normalisation of the approval hash (C001-IF-13 §2).
import { parse as parseYaml } from "yaml";

export interface SplitDocument {
  /** All lines of the document after CRLF/CR → LF, without a leading BOM. */
  lines: string[];
  /** Parsed frontmatter mapping, or null when there is none or it is invalid. */
  data: Record<string, unknown> | null;
  /** Frontmatter source between the fences, or null when there is none. */
  raw: string | null;
  /** 1-based line of the first body line (1 when there is no frontmatter). */
  bodyStartLine: number;
  /** YAML parse error, when the frontmatter fences exist but the content is invalid. */
  error?: string;
}

export function toLines(text: string): string[] {
  return text.replace(/^﻿/, "").replace(/\r\n?/g, "\n").split("\n");
}

/** Index of the closing `---` line when `lines` opens with a frontmatter fence, else -1. */
function frontmatterEnd(lines: readonly string[]): number {
  if (lines[0] !== "---") return -1;
  for (let i = 1; i < lines.length; i++) if (lines[i] === "---") return i;
  return -1;
}

export function splitFrontmatter(text: string): SplitDocument {
  const lines = toLines(text);
  const end = frontmatterEnd(lines);
  if (end < 0) return { lines, data: null, raw: null, bodyStartLine: 1 };
  const raw = lines.slice(1, end).join("\n");
  const doc: SplitDocument = { lines, data: null, raw, bodyStartLine: end + 2 };
  try {
    const parsed: unknown = parseYaml(raw);
    if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) doc.data = parsed as Record<string, unknown>;
    else if (parsed !== null && parsed !== undefined) doc.error = "frontmatter is not a mapping";
  } catch (e) {
    doc.error = e instanceof Error ? e.message : String(e);
  }
  return doc;
}

/**
 * C001-IF-13 §2 step 2: LF line endings, frontmatter removed (when the text starts with a `---`
 * line and a closing `---` line exists), trailing spaces and tabs stripped from every line.
 */
export function normalizeForHash(text: string): string {
  let lines = toLines(text);
  const end = frontmatterEnd(lines);
  if (end >= 0) lines = lines.slice(end + 1);
  return lines.map((l) => l.replace(/[ \t]+$/, "")).join("\n");
}
