// Shared helpers of the plugin structure checks (C001-IF-08 §3, C001-T-061).
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";

export const REPO = join(fileURLToPath(new URL(".", import.meta.url)), "..", "..");

/** Check context: repository root, plugin root and the CHG-001 interfaces folder. */
export function context(overrides = {}) {
  const repo = overrides.repo ?? REPO;
  return {
    repo,
    plugin: overrides.plugin ?? join(repo, "plugins", "architect"),
    interfaces: overrides.interfaces ?? join(repo, ".sdd", "001-architect-agent-suite", "10-spec", "50-interfaces"),
    tasks: overrides.tasks ?? join(repo, ".sdd", "001-architect-agent-suite", "20-plan", "50-tasks"),
  };
}

/** Files below `dir` (recursive), optionally filtered by `test(relPath)`. Paths use `/`. */
export function files(dir, test = () => true) {
  const out = [];
  const walk = (d) => {
    if (!existsSync(d)) return;
    for (const name of readdirSync(d).sort()) {
      const p = join(d, name);
      if (statSync(p).isDirectory()) walk(p);
      else if (test(relative(dir, p).split(sep).join("/"))) out.push(p);
    }
  };
  walk(dir);
  return out;
}

export const rel = (ctx, p) => relative(ctx.repo, p).split(sep).join("/");
export const read = (p) => readFileSync(p, "utf8");

/** Frontmatter (YAML object) and body of a Markdown text. */
export function frontmatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text);
  if (!m) return { data: {}, body: text, bodyLine: 1 };
  return { data: YAML.parse(m[1]) ?? {}, body: text.slice(m[0].length), bodyLine: m[0].split("\n").length };
}

/**
 * Lines of a Markdown text with, for each, whether it is inside a fenced block and the heading path
 * (texts of the enclosing headings).
 */
export function mdLines(text) {
  const out = [];
  const stack = [];
  let fence = null;
  text.split("\n").forEach((line, i) => {
    const f = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(line);
    if (f && (fence === null || (f[1][0] === fence.ch && f[1].length >= fence.len && f[2].trim() === ""))) {
      fence = fence === null ? { ch: f[1][0], len: f[1].length, info: f[2].trim() } : null;
      out.push({ n: i + 1, line, fenced: true, info: fence?.info ?? "", headings: stack.map((h) => h.text) });
      return;
    }
    if (fence === null) {
      const h = /^(#{1,6})\s+(.*?)\s*#*\s*$/.exec(line);
      if (h) {
        while (stack.length > 0 && stack[stack.length - 1].level >= h[1].length) stack.pop();
        stack.push({ level: h[1].length, text: h[2] });
      }
    }
    out.push({ n: i + 1, line, fenced: fence !== null, info: fence?.info ?? "", headings: stack.map((s) => s.text) });
  });
  return out;
}

/** Status of a CHG-001 task (`C001-T-062`), or null when its file is missing. */
export function taskStatus(ctx, id) {
  const f = existsSync(ctx.tasks) ? readdirSync(ctx.tasks).find((n) => n.startsWith(id.replace(/^C001-/, "") + "-")) : undefined;
  return f ? String(frontmatter(read(join(ctx.tasks, f))).data.status ?? "todo") : null;
}

/** Splits an agent `tools` list on commas, keeping `Agent(a, b)` together. */
export function splitTools(s) {
  const out = [];
  let depth = 0;
  let cur = "";
  for (const ch of String(s)) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      out.push(cur.trim());
      cur = "";
    } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out.map((x) => x.replace(/`/g, "").replace(/\s*,\s*/g, ", "));
}

export const finding = (code, path, line, message) => ({ code, path, line, message });
