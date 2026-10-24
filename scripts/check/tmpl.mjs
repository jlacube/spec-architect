// PLG-TMPL-001: no agent, command or skill body names a plugin file to read (C001-REQ-1124; C001-IF-08 §3
// rule table and §4, D-019 item 2). A body is the text after the frontmatter of `agents/*.md`,
// `commands/*.md` and `skills/<name>/SKILL.md`; `hooks/hooks.json` and `.mcp.json` are not bodies. One error,
// with file and line, for each body line that contains any of:
//   - a `${CLAUDE_PLUGIN_ROOT}/` path other than `${CLAUDE_PLUGIN_ROOT}/scripts/sdd.mjs`;
//   - a path containing `references/`;
//   - a relative link target (Markdown inline or reference-style link, outside fenced blocks) that
//     resolves to a file of the plugin.
// A body names templates through `sdd template show <profile>/<path>` (C001-IF-08 §4 item 1), which is
// not a finding.
import { existsSync, statSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { files, finding, frontmatter, mdLines, read, rel } from "./lib.mjs";

const ROOT_PATH = /\$\{?CLAUDE_PLUGIN_ROOT\}?\/([^\s"'`)\]]*)/g;
const CLI = /^scripts\/sdd\.mjs$/;
const REFERENCES = /references\//;
const INLINE_LINK = /\[[^\]]*\]\(\s*<?([^)\s>]+)>?(?:\s+["'][^)]*["'])?\s*\)/g;
const REF_LINK = /^\s{0,3}\[[^\]]+\]:\s*<?(\S+?)>?(?:\s|$)/;

/** The body files of the plugin: agents, commands and skill entry files. */
export function bodyFiles(plugin) {
  return files(plugin, (r) => /^(agents|commands)\/[^/]+\.md$/.test(r) || /^skills\/[^/]+\/SKILL\.md$/.test(r));
}

/** Whether a link target is relative (not a URL, an anchor or an absolute path). */
const isRelative = (target) => !/^[a-z][a-z0-9+.-]*:/i.test(target) && !target.startsWith("#") && !target.startsWith("/") && !isAbsolute(target);

/** Whether a relative link target of `file` resolves to a file inside `plugin`. */
function linksIntoPlugin(plugin, file, target) {
  let path = target.replace(/[#?].*$/, "");
  try {
    path = decodeURIComponent(path);
  } catch {
    // keep the raw target
  }
  if (!path) return false;
  const abs = resolve(dirname(file), path);
  const r = relative(plugin, abs);
  if (r === "" || r.startsWith("..") || isAbsolute(r)) return false;
  return existsSync(abs) && statSync(abs).isFile();
}

/** The reason a body line names a plugin file, or null. */
export function lineProblem(plugin, file, line, fenced) {
  for (const m of line.matchAll(ROOT_PATH)) if (!CLI.test(m[1])) return `names the plugin file "\${CLAUDE_PLUGIN_ROOT}/${m[1]}"; name templates as \`sdd template show <profile>/<path>\` and keep other content in a skill body`;
  if (REFERENCES.test(line)) return 'names a "references/" path; put the content in the skill body';
  if (!fenced) {
    const targets = [...line.matchAll(INLINE_LINK)].map((m) => m[1]);
    const ref = REF_LINK.exec(line);
    if (ref) targets.push(ref[1]);
    for (const t of targets) if (isRelative(t) && linksIntoPlugin(plugin, file, t)) return `links the plugin file "${t}"; refer to a skill by name instead`;
  }
  return null;
}

export default {
  code: "PLG-TMPL-001",
  check(ctx) {
    const out = [];
    for (const p of bodyFiles(ctx.plugin)) {
      const text = read(p);
      const { bodyLine } = frontmatter(text);
      for (const l of mdLines(text)) {
        if (l.n < bodyLine) continue;
        const problem = lineProblem(ctx.plugin, p, l.line, l.fenced);
        if (problem) out.push(finding(this.code, rel(ctx, p), l.n, problem));
      }
    }
    return out;
  },
};
