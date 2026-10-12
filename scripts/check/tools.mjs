// PLG-TOOLS-001: each agent's `tools` equals its row of C001-IF-09 (C001-NFR-204, C001-REQ-217, 218,
// 1007–1009, 1109) — least privilege, compared as sets.
import { existsSync } from "node:fs";
import { join } from "node:path";
import { finding, frontmatter, read, rel, splitTools } from "./lib.mjs";

export function if09Rows(ctx) {
  return read(join(ctx.interfaces, "agents.md"))
    .split("\n")
    .filter((l) => /^\| A\d \|/.test(l))
    .map((l) => l.split("|").map((c) => c.trim()))
    .map((c) => ({ name: c[2].replace(/`/g, ""), tools: splitTools(c[5]) }));
}

export default {
  code: "PLG-TOOLS-001",
  check(ctx) {
    const out = [];
    for (const row of if09Rows(ctx)) {
      const p = join(ctx.plugin, "agents", `${row.name}.md`);
      if (!existsSync(p)) {
        out.push(finding(this.code, rel(ctx, p), null, `agent ${row.name} of C001-IF-09 is missing`));
        continue;
      }
      const have = new Set(splitTools(frontmatter(read(p)).data.tools ?? ""));
      const want = new Set(row.tools);
      const extra = [...have].filter((t) => !want.has(t));
      const missing = [...want].filter((t) => !have.has(t));
      if (extra.length) out.push(finding(this.code, rel(ctx, p), null, `tools not in C001-IF-09: ${extra.join(", ")}`));
      if (missing.length) out.push(finding(this.code, rel(ctx, p), null, `tools of C001-IF-09 missing: ${missing.join(", ")}`));
    }
    return out;
  },
};
