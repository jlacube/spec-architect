// CLI lines in the templates of `architect-sdd` (C002-IF-003 §1, C002-REQ-518, C002-REQ-519, C002-T-022).
// translateCliLines: on every line, each invocation of the CLI through its plugin path — the word `node`
// followed by `<plugin-root>/scripts/sdd.mjs` or `${CLAUDE_PLUGIN_ROOT}/scripts/sdd.mjs`, quoted or not —
// becomes the bare word `sdd`; nothing else changes, so line numbers stay.
// scanCliPaths: after the translation, any remaining plugin path of the CLI (`${CLAUDE_PLUGIN_ROOT}`,
// any `<…>/scripts/sdd.mjs`, or `scripts/sdd.mjs` after a variable) is an ERR-BLD-002 finding naming
// the template, the line and the construct.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// `[ \t]` rather than `\s`: an invocation never spans two lines.
const INVOCATION = /\bnode[ \t]+(["']?)(?:<plugin-root>|\$\{CLAUDE_PLUGIN_ROOT\})\/scripts\/sdd\.mjs\1/g;

/** The text with every plugin-path invocation of the CLI replaced by `sdd`. */
export function translateCliLines(text) {
  return text.replace(INVOCATION, "sdd");
}

/** Constructs of ERR-BLD-002, in reporting order; a later match overlapping an earlier one is not reported again. */
const CONSTRUCTS = [
  /\$\{CLAUDE_PLUGIN_ROOT\}/g,
  /<[^<>\s]+>[\\/]scripts[\\/]sdd\.mjs/g,
  /(?:\$\{[A-Za-z_]\w*\}|\$env:[A-Za-z_]\w*|\$[A-Za-z_]\w*|%[A-Za-z_]\w*%)[\\/]scripts[\\/]sdd\.mjs/g,
];

/** `{ line, construct }` for each plugin path of the CLI left in `text` (lines from 1). */
export function scanCliPaths(text) {
  const out = [];
  text.split("\n").forEach((line, i) => {
    const found = [];
    for (const re of CONSTRUCTS) {
      for (const m of line.matchAll(re)) {
        const start = m.index;
        const end = start + m[0].length;
        if (!found.some((f) => start < f.end && end > f.start)) found.push({ start, end, construct: m[0] });
      }
    }
    for (const f of found.sort((a, b) => a.start - b.start)) out.push({ line: i + 1, construct: f.construct });
  });
  return out;
}

/** ERR-BLD-002 message (errors.md), prefixed with its code. */
export function errBld002(template, line, construct) {
  return `ERR-BLD-002: build failed: template ${template}:${line}: plugin path of the CLI "${construct}"`;
}

/** Files under `dir`, relative with `/` separators, in code-point order. */
function filesUnder(dir, rel = "") {
  return readdirSync(dir, { withFileTypes: true })
    .flatMap((e) => (e.isDirectory() ? filesUnder(join(dir, e.name), `${rel}${e.name}/`) : [`${rel}${e.name}`]))
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

/**
 * Translates every staged template under `templatesDir` in place (only changed files are rewritten, so
 * the others stay byte-identical), then scans them all. Returns the ERR-BLD-002 messages, empty when clean.
 */
export function translateAndScanTemplates(templatesDir) {
  const files = filesUnder(templatesDir);
  for (const rel of files) {
    const p = join(templatesDir, ...rel.split("/"));
    const text = readFileSync(p, "utf8");
    const translated = translateCliLines(text);
    if (translated !== text) writeFileSync(p, translated);
  }
  // The scan runs after the translation (C002-T-022 step 2).
  return files.flatMap((rel) => scanCliPaths(readFileSync(join(templatesDir, ...rel.split("/")), "utf8")).map((f) => errBld002(rel, f.line, f.construct)));
}
