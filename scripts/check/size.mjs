// PLG-SIZE-001: preloaded skill budgets of C001-NFR-105 — at most 24,000 characters per SKILL.md body
// and 64,000 per agent (the bodies of the skills in its `skills` field; references excluded).
import { existsSync } from "node:fs";
import { join } from "node:path";
import { files, finding, frontmatter, read, rel } from "./lib.mjs";

export const PER_SKILL = 24000;
export const PER_AGENT = 64000;

export default {
  code: "PLG-SIZE-001",
  check(ctx) {
    const out = [];
    const size = new Map();
    for (const p of files(join(ctx.plugin, "skills"), (r) => /^[^/]+\/SKILL\.md$/.test(r))) {
      const name = p.split(/[\\/]/).at(-2);
      const n = [...frontmatter(read(p)).body].length;
      size.set(name, n);
      if (n > PER_SKILL) out.push(finding(this.code, rel(ctx, p), null, `${n} characters, budget ${PER_SKILL}`));
    }
    for (const p of files(join(ctx.plugin, "agents"), (r) => r.endsWith(".md"))) {
      const skills = String(frontmatter(read(p)).data.skills ?? "").split(",").map((s) => s.trim()).filter(Boolean);
      const total = skills.reduce((sum, s) => sum + (size.get(s) ?? 0), 0);
      for (const s of skills) if (!size.has(s) && !existsSync(join(ctx.plugin, "skills", s))) out.push(finding(this.code, rel(ctx, p), null, `preloads unknown skill ${s}`));
      if (total > PER_AGENT) out.push(finding(this.code, rel(ctx, p), null, `preloaded skills total ${total} characters, budget ${PER_AGENT}`));
    }
    return out;
  },
};
