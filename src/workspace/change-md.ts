// Targeted edits of change.md (C001-IF-03 §2): phase fields, top-level keys, the waivers list and
// the Gate log table. Every edit touches only its own lines, so the rest of the file stays
// byte-identical.
import { parse as parseYaml } from "yaml";

export const GATES: Record<string, string> = { "00-ideation": "G1 (ideation)", "10-spec": "G2 (spec)", "20-plan": "G3 (plan)" };

function frontmatterEnd(lines: string[]): number {
  if (lines[0] !== "---") throw new Error("change.md has no frontmatter");
  const end = lines.indexOf("---", 1);
  if (end < 0) throw new Error("change.md frontmatter is not closed");
  return end;
}

/** YAML scalar for a flow map: plain when safe, double-quoted otherwise. */
function scalar(v: string | null): string {
  if (v === null) return "null";
  return plainSafe(v) ? v : JSON.stringify(v);
}

/** True when a string reads back as the same string without quotes (not a keyword or a number). */
function plainSafe(v: string): boolean {
  if (!/^[\w.@-]+$/.test(v) || /^(true|false|null|yes|no|on|off|~)$/i.test(v)) return false;
  // Dates stay plain (the core schema reads them as strings); other number-like values are quoted.
  return /^\d{4}-\d{2}-\d{2}$/.test(v) || !/^[-+]?(\d[\d_]*\.?\d*([eE][-+]?\d+)?|\.\d+([eE][-+]?\d+)?|0x[\da-fA-F]+|0o[0-7]+)$/.test(v);
}

/**
 * Sets fields of one phase entry. The entry is rewritten in flow form
 * (`  10-spec: { status: approved, approved_hash: "…", … }`) keeping its indentation and the
 * order of existing keys; a block-form entry is replaced by the flow form.
 */
export function setPhase(text: string, phase: string, fields: Record<string, string | null>): string {
  const lines = text.split("\n");
  const end = frontmatterEnd(lines);
  const at = lines.findIndex((l, i) => i > 0 && i < end && new RegExp(`^(\\s+)${phase}:`).test(l));
  if (at < 0) throw new Error(`change.md has no phase ${phase}`);
  const indent = /^(\s*)/.exec(lines[at]!)![1]!;
  let last = at;
  let current: Record<string, unknown> = {};
  const inline = lines[at]!.slice(lines[at]!.indexOf(":") + 1).replace(/\s+#.*$/, "").trim();
  if (inline.startsWith("{")) current = (parseYaml(inline) ?? {}) as Record<string, unknown>;
  else {
    while (last + 1 < end && /^(\s*)/.exec(lines[last + 1]!)![1]!.length > indent.length) last++;
    current = (parseYaml(lines.slice(at + 1, last + 1).map((l) => l.slice(indent.length + 2)).join("\n")) ?? {}) as Record<string, unknown>;
  }
  const merged: Record<string, unknown> = { ...current, ...fields };
  const body = Object.entries(merged)
    .map(([k, v]) => `${k}: ${v === null || v === undefined ? "null" : typeof v === "string" ? scalar(v) : String(v instanceof Date ? v.toISOString().slice(0, 10) : v)}`)
    .join(", ");
  lines.splice(at, last - at + 1, `${indent}${phase}: { ${body} }`);
  return lines.join("\n");
}

/** Sets only the `status` value of a phase (flow or block form). */
export function setPhaseStatus(text: string, phase: string, status: string): string {
  const lines = text.split("\n");
  const end = frontmatterEnd(lines);
  const at = lines.findIndex((l, i) => i > 0 && i < end && new RegExp(`^\\s+${phase}:`).test(l));
  if (at < 0) throw new Error(`change.md has no phase ${phase}`);
  if (lines[at]!.includes("{")) {
    lines[at] = lines[at]!.replace(/(\bstatus:\s*)[\w-]+/, `$1${status}`);
    return lines.join("\n");
  }
  const indent = /^(\s*)/.exec(lines[at]!)![1]!.length;
  for (let i = at + 1; i < end; i++) {
    if (/^(\s*)/.exec(lines[i]!)![1]!.length <= indent) break;
    if (/^\s+status:/.test(lines[i]!)) {
      lines[i] = lines[i]!.replace(/(status:\s*)[\w-]+/, `$1${status}`);
      return lines.join("\n");
    }
  }
  throw new Error(`change.md phase ${phase} has no status`);
}

/** Replaces a top-level key (and any indented lines under it) with `key: <yaml>` lines. */
export function setTopLevel(text: string, key: string, yaml: string): string {
  const lines = text.split("\n");
  const end = frontmatterEnd(lines);
  const at = lines.findIndex((l, i) => i > 0 && i < end && l.startsWith(`${key}:`));
  const parts = yaml.split("\n");
  const value = yaml.startsWith("\n") ? [`${key}:`, ...parts.slice(1)] : [`${key}: ${parts[0]}`, ...parts.slice(1)];
  if (at < 0) {
    lines.splice(end, 0, ...value);
    return lines.join("\n");
  }
  let last = at;
  while (last + 1 < end && /^\s+\S/.test(lines[last + 1]!)) last++;
  lines.splice(at, last - at + 1, ...value);
  return lines.join("\n");
}

export interface Waiver {
  item: string;
  gate: string;
  date: string;
  note: string;
}

/** The waivers list in block form, one flow map per waiver. */
export function waiversYaml(waivers: Waiver[]): string {
  if (waivers.length === 0) return "[]";
  return "\n" + waivers.map((w) => `  - { item: ${scalar(w.item)}, gate: ${w.gate}, date: ${w.date}, note: ${JSON.stringify(w.note)} }`).join("\n");
}

/** Appends a row to the `## Gate log` table, creating the section or table when absent. */
export function appendGateLog(text: string, cells: string[]): string {
  const row = `| ${cells.map((c) => c.replace(/\|/g, "\\|").replace(/\n/g, " ")).join(" | ")} |`;
  const header = "| Date | Gate | Decision | Words of approver | Waivers | Usage |\n|---|---|---|---|---|---|";
  const lines = text.split("\n");
  const at = lines.findIndex((l) => /^##\s+Gate log\s*$/.test(l));
  if (at < 0) return text.replace(/\n*$/, "\n") + `\n## Gate log\n${header}\n${row}\n`;
  let i = at + 1;
  while (i < lines.length && !lines[i]!.trimStart().startsWith("|") && !/^#{1,2}\s/.test(lines[i]!)) i++;
  if (i >= lines.length || !lines[i]!.trimStart().startsWith("|")) {
    lines.splice(at + 1, 0, ...header.split("\n"), row);
    return lines.join("\n");
  }
  while (i < lines.length && lines[i]!.trimStart().startsWith("|")) i++;
  lines.splice(i, 0, row);
  return lines.join("\n");
}

/** A value in YAML flow style (maps, sequences, scalars); strings with special characters quoted. */
export function flow(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (Array.isArray(value)) return `[${value.map(flow).join(", ")}]`;
  if (typeof value === "object") return `{ ${Object.entries(value as Record<string, unknown>).map(([k, v]) => `${k}: ${flow(v)}`).join(", ")} }`;
  if (typeof value === "string") return plainSafe(value) ? value : JSON.stringify(value);
  return String(value);
}

/** A list in block form, one flow map per item (`[]` when empty). */
export function listYaml(items: unknown[]): string {
  return items.length === 0 ? "[]" : "\n" + items.map((i) => `  - ${flow(i)}`).join("\n");
}
