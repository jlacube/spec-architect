// PLG-VAR-001: the wiring variants of the generated targets stay out of the files Claude Code loads
// (C002-REQ-113, C002-IF-005 §6; C002-TS-121, C002-TS-122). No agent file (`agents/*.md`), command file
// (`commands/*.md`) or `SKILL.md` holds a host-only name of a generated target (`ask_user`,
// `tool_search_tool`, `sdd-files`, `sdd-shell`, a token of C002-IF-001 §4 such as `{{host_name}}`) or a
// variant-only line: a line of 40 or more characters of a wiring variant file under `targets/` that is
// not in the source text its anchor replaces. The finding names the file, the line and the name or the
// variant file found. Variants are read from the mapping tables of the plugin, never from a change folder.
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { files, finding, read, rel } from "./lib.mjs";

// The tokens of C002-IF-001 §4 (scripts/generate/translate/wiring.ts › tokenValues); other `{{…}}` text,
// such as the `{{SEQ}}` placeholder of a file-name pattern, is not a target token.
const TOKENS = /\{\{\s*(?:host_name|package_version|enforcement_mode|server_files|server_shell|tested_version:[\w.-]+)\s*\}\}/;
const HOST_ONLY = [/\bask_user\b/, /\btool_search_tool\b/, /\bsdd-files\b/, /\bsdd-shell\b/, TOKENS];
export const MIN_LINE = 40;

const HEADING = /^(#{1,6})[ \t]+(.*?)[ \t]*#*[ \t]*$/;
const FENCE = /^[ \t]*(```|~~~)/;

/** Lines of the section headed `text` (the heading to the next heading of the same or a higher level). */
function section(lines, text) {
  let fence = null;
  let start = -1;
  let level = 0;
  for (let i = 0; i < lines.length; i++) {
    const f = FENCE.exec(lines[i]);
    if (f) {
      fence = fence === null ? f[1] : f[1] === fence ? null : fence;
      continue;
    }
    if (fence !== null) continue;
    const h = HEADING.exec(lines[i]);
    if (!h) continue;
    if (start >= 0 && h[1].length <= level) return lines.slice(start, i);
    if (start < 0 && h[2] === text) {
      start = i;
      level = h[1].length;
    }
  }
  return start >= 0 ? lines.slice(start) : [];
}

/** The source lines a variant's anchor replaces (empty when the anchor is not found: ERR-GEN-005 is the generator's). */
function anchorText(plugin, v) {
  const p = join(plugin, v.file);
  if (!existsSync(p)) return [];
  const lines = read(p).replace(/\r\n?/g, "\n").split("\n");
  if (v.anchor?.section !== undefined) return section(lines, v.anchor.section);
  return Array.isArray(v.anchor?.lines) ? v.anchor.lines : [];
}

/** Variant-only lines of every table of the plugin: trimmed line → variant file (plugin-relative). */
export function variantOnlyLines(plugin) {
  const out = new Map();
  const dir = join(plugin, "targets");
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir).filter((n) => n.endsWith(".json") && n !== "mapping-table.schema.json").sort()) {
    const target = name.slice(0, -".json".length);
    let table;
    try {
      table = JSON.parse(read(join(dir, name)));
    } catch {
      continue; // the generator reports a table that does not parse (ERR-GEN-004)
    }
    for (const v of Array.isArray(table.variants) ? table.variants : []) {
      const file = `targets/${target}/wiring/${v.text_file}`;
      const p = join(plugin, file);
      if (!existsSync(p)) continue;
      const source = new Set(anchorText(plugin, v).map((l) => l.trim()));
      for (const l of read(p).replace(/\r\n?/g, "\n").split("\n")) {
        const t = l.trim();
        if ([...t].length >= MIN_LINE && !source.has(t) && !out.has(t)) out.set(t, file);
      }
    }
  }
  return out;
}

export default {
  code: "PLG-VAR-001",
  check(ctx) {
    const out = [];
    const only = variantOnlyLines(ctx.plugin);
    const targets = [
      ...files(join(ctx.plugin, "agents"), (r) => /^[^/]+\.md$/.test(r)),
      ...files(join(ctx.plugin, "commands"), (r) => /^[^/]+\.md$/.test(r)),
      ...files(join(ctx.plugin, "skills"), (r) => /^[^/]+\/SKILL\.md$/.test(r)),
    ];
    for (const p of targets)
      read(p)
        .replace(/\r\n?/g, "\n")
        .split("\n")
        .forEach((line, i) => {
          for (const re of HOST_ONLY) {
            const m = re.exec(line);
            if (m) out.push(finding(this.code, rel(ctx, p), i + 1, `host-only name "${m[0]}" of a generated target in a file Claude Code loads`));
          }
          const v = only.get(line.trim());
          if (v !== undefined) out.push(finding(this.code, rel(ctx, p), i + 1, `line of the wiring variant ${v} in a file Claude Code loads; variants stay under targets/`));
        });
    return out;
  },
};
