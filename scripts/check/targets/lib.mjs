// Shared helpers of the target structure checks (C002-COMP-007, C002-IF-005 §6, C002-T-035). A check
// works on a target context: one generated package read from its own folder (never the repository's
// dist/), the source plugin it was generated from and that plugin's mapping table. Contract values come
// from the mapping tables and the source plugin only; no check reads a change folder of the SDD
// workspace (C002-REQ-605).
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { readSource } from "../../generate/reader.ts";
import { loadTable, TARGETS } from "../../generate/tables.ts";
import { splitFrontmatter } from "../../../src/model/frontmatter.ts";

export { TARGETS };

/** Reads one file, recording its path in `log` (the file-access log of C002-TS-607). */
function readLogged(log, p) {
  log.push(p);
  return readFileSync(p);
}

/** Every file under `dir` (relative, `/`-separated) with its bytes. */
export function readTree(dir, log = []) {
  const out = new Map();
  const walk = (abs, rel) => {
    for (const name of readdirSync(abs).sort()) {
      const p = join(abs, name);
      const r = rel === "" ? name : `${rel}/${name}`;
      if (statSync(p).isDirectory()) walk(p, r);
      else out.set(r, readLogged(log, p));
    }
  };
  walk(dir, "");
  return out;
}

/** The source plugin and its mapping tables (every target), read once. */
export function sourceContext(plugin, log = []) {
  const read = readSource(plugin);
  const tables = {};
  for (const t of TARGETS) {
    const p = join(plugin, "targets", `${t}.json`);
    log.push(p);
    tables[t] = loadTable(p, `targets/${t}.json`);
  }
  return { plugin, source: read.source, sourceDiagnostics: read.diagnostics, tables, log };
}

/**
 * Target context: `files` holds the package's paths and contents (Buffer or string). `mode` is the
 * enforcement mode the package was generated for.
 */
export function targetContext(src, target, mode, files) {
  const table = src.tables[target];
  const peers = TARGETS.map((t) => src.tables[t]);
  return {
    target,
    mode,
    table,
    peers,
    source: src.source,
    files,
    emitInput: { source: src.source, table, target, mode, peers },
  };
}

/** Text of a package file, or undefined when it is missing. */
export const text = (ctx, p) => {
  const b = ctx.files.get(p);
  return b === undefined ? undefined : b.toString("utf8");
};

/** Frontmatter mapping (or null), lines and first body line of a package Markdown file. */
export function doc(ctx, p) {
  const t = text(ctx, p);
  return t === undefined ? undefined : splitFrontmatter(t);
}

/** JSON of a package file; undefined when missing, `{ error }` when it does not parse. */
export function json(ctx, p) {
  const t = text(ctx, p);
  if (t === undefined) return undefined;
  try {
    return { value: JSON.parse(t) };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

export const place = (ctx, key, fallback) => ctx.table.placement[key] ?? fallback;
export const join2 = (dir, name) => (dir === "" || dir == null ? name : `${dir}/${name}`);
/** Package path of an agent, command (prompt) file. */
export const agentPath = (ctx, name) => join2(place(ctx, "agents_dir", ""), place(ctx, "agent_file", "{name}.md").replaceAll("{name}", name));
export const commandPath = (ctx, name) => join2(place(ctx, "commands_dir", ""), place(ctx, "command_file", "{name}.md").replaceAll("{name}", name));
export const configPath = (ctx) => place(ctx, "config_file", ctx.target === "opencode" ? "opencode.json" : "install/mcp.json");

/** One target structure finding (C001-IF-08 §3 format, with the target added by the runner). */
export const finding = (code, path, line, message) => ({ code, path, line, message });
