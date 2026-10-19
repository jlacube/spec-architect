// TGT-PORT-001: no Claude Code construct (the detectors of C002-IF-001 §2, from the target's table)
// outside its `accepted_in` contexts, in agents, commands or prompt files, skills, the MCP configuration
// and the hook declarations (C002-REQ-602). On Copilot `${CLAUDE_PLUGIN_ROOT}` and `${PLUGIN_ROOT}` are
// accepted in no context, whatever the table says (C002-REQ-326). The copied `scripts/sdd.mjs` is not
// scanned (its templates are scanned by the build, ERR-BLD-002). Each finding names the file, the line
// and the construct.
import { scanText } from "../../generate/translate/constructs.ts";
import { configPath, finding, place, text } from "./lib.mjs";

const ROOT_TOKENS = ["${CLAUDE_PLUGIN_ROOT}", "${PLUGIN_ROOT}"];

/** The files to scan with the context of each of their lines. */
function scanned(ctx) {
  const out = [];
  const md = (dir) => [...ctx.files.keys()].filter((p) => p.startsWith(`${dir}/`) && p.endsWith(".md"));
  const dirs = [place(ctx, "agents_dir", ""), place(ctx, "commands_dir", ""), place(ctx, "skills_dir", "")];
  for (const p of [...new Set(dirs.flatMap(md))].sort()) {
    const lines = text(ctx, p).split("\n");
    // Frontmatter lines are the `frontmatter` context, the rest the `body` context.
    let end = -1;
    if (lines[0] === "---") end = lines.indexOf("---", 1);
    out.push({ path: p, lines: lines.map((l, i) => ({ n: i + 1, text: l, context: i <= end ? "frontmatter" : "body" })) });
  }
  const config = configPath(ctx);
  const ct = text(ctx, config);
  if (ct !== undefined) {
    const lines = ct.split("\n");
    // opencode.json: the `mcp` block is the configuration of the servers; the permission rules are not.
    let from = 0;
    let to = lines.length - 1;
    if (ctx.target === "opencode") {
      const start = lines.findIndex((l) => /^\s*"mcp": \{/.test(l));
      if (start >= 0) {
        const indent = /^\s*/.exec(lines[start])[0];
        const end = lines.findIndex((l, i) => i > start && l.startsWith(`${indent}}`));
        from = start;
        to = end >= 0 ? end : to;
      }
    }
    out.push({ path: config, lines: lines.map((l, i) => ({ n: i + 1, text: l, context: "mcp-config" })).filter((_, i) => i >= from && i <= to) });
  }
  const hooks = place(ctx, "hooks_file", null);
  const ht = hooks === null ? undefined : text(ctx, hooks);
  if (ht !== undefined) out.push({ path: hooks, lines: ht.split("\n").map((l, i) => ({ n: i + 1, text: l, context: "hook-command" })) });
  return out;
}

export default {
  code: "TGT-PORT-001",
  check(ctx) {
    const out = [];
    for (const f of scanned(ctx)) {
      const seen = new Set();
      // The table's detectors, one scan per run of lines of the same context (line numbers offset).
      const hitsAt = new Map();
      const add = (n, c) => hitsAt.set(n, [...(hitsAt.get(n) ?? []), c]);
      for (let i = 0; i < f.lines.length; ) {
        let j = i;
        while (j + 1 < f.lines.length && f.lines[j + 1].context === f.lines[i].context && f.lines[j + 1].n === f.lines[j].n + 1) j++;
        const run = f.lines.slice(i, j + 1);
        for (const d of scanText(ctx.table, ctx.target, ctx.mode, f.path, run.map((l) => l.text).join("\n"), run[0].context)) add(run[0].n + (d.line ?? 1) - 1, d.construct ?? "");
        i = j + 1;
      }
      for (const l of f.lines) {
        const hits = hitsAt.get(l.n) ?? [];
        if (ctx.target === "copilot") for (const t of ROOT_TOKENS) if (l.text.includes(t)) hits.push(t);
        for (const match of hits) {
          // A prefix detector (`architect:`, `/architect:`) is named with the word it starts (`architect:sdd-critic`).
          const at = l.text.indexOf(match);
          const c = at < 0 ? match : match + (/^[\w-]*/.exec(l.text.slice(at + match.length))?.[0] ?? "");
          // One finding per line and construct; a root token also matched by a table detector counts once.
          const key = `${l.n}\0${ROOT_TOKENS.find((t) => c.startsWith(t)) ?? c}`;
          if (seen.has(key)) continue;
          seen.add(key);
          out.push(finding(this.code, f.path, l.n, `Claude Code construct "${c}" in the ${l.context} context, where the ${ctx.target} target does not accept it`));
        }
      }
    }
    return out;
  },
};
