// PLG-DUP-001: no command body shares more than 10 consecutive identical non-blank lines with an
// agent body (C001-REQ-1122) — procedures live in skills, once.
import { join } from "node:path";
import { files, finding, frontmatter, read, rel } from "./lib.mjs";

/** Longest run of consecutive identical non-blank lines shared by two texts. */
export function sharedRun(a, b) {
  const la = a.split("\n").map((l) => l.trim()).filter(Boolean);
  const lb = b.split("\n").map((l) => l.trim()).filter(Boolean);
  let best = 0;
  const prev = new Array(lb.length + 1).fill(0);
  for (let i = 1; i <= la.length; i++) {
    let diag = 0;
    for (let j = 1; j <= lb.length; j++) {
      const up = prev[j];
      prev[j] = la[i - 1] === lb[j - 1] ? diag + 1 : 0;
      if (prev[j] > best) best = prev[j];
      diag = up;
    }
  }
  return best;
}

export default {
  code: "PLG-DUP-001",
  check(ctx) {
    const body = (p) => frontmatter(read(p)).body;
    const commands = files(join(ctx.plugin, "commands"), (r) => r.endsWith(".md"));
    const agents = files(join(ctx.plugin, "agents"), (r) => r.endsWith(".md"));
    const out = [];
    for (const c of commands)
      for (const a of agents) {
        const n = sharedRun(body(c), body(a));
        if (n > 10) out.push(finding(this.code, rel(ctx, c), null, `shares ${n} consecutive lines with ${rel(ctx, a)}`));
      }
    return out;
  },
};
