// PLG-EVAL-001: the `claude plugin eval` suite (plugins/architect/evals/<case>/prompt.md + graders/*.md)
// has ≥ 40 prompts, ≥ 3 that must route to each of the ten agents and ≥ 1 per agent that must not
// (C001-REQ-1116; owned by C001-T-063). A grader of type tool_used with an input_match naming
// `architect:<agent>` is a must-route; one with `negate: true` (or type tool_not_used) is a must-not.
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { files, finding, frontmatter, read, rel } from "./lib.mjs";

export default {
  code: "PLG-EVAL-001",
  owner: "C001-T-063",
  check(ctx) {
    const dir = join(ctx.plugin, "evals");
    const cases = existsSync(dir) ? readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory() && existsSync(join(dir, e.name, "prompt.md"))) : [];
    const out = [];
    if (cases.length < 40) out.push(finding(this.code, rel(ctx, dir), null, `${cases.length} prompts, at least 40 required`));
    const agents = readdirSync(join(ctx.plugin, "agents")).filter((n) => /^sdd-.+\.md$/.test(n)).map((n) => n.slice(0, -3));
    const must = new Map(agents.map((a) => [a, 0]));
    const mustNot = new Map(agents.map((a) => [a, 0]));
    for (const c of cases)
      for (const g of files(join(dir, c.name, "graders"), (r) => r.endsWith(".md"))) {
        const fm = frontmatter(read(g)).data;
        const negative = fm.negate === true || fm.type === "tool_not_used";
        for (const a of agents)
          if (new RegExp(`architect:${a}\\b`).test(String(fm.input_match ?? ""))) (negative ? mustNot : must).set(a, (negative ? mustNot : must).get(a) + 1);
      }
    for (const a of agents) {
      if (must.get(a) < 3) out.push(finding(this.code, rel(ctx, dir), null, `${a}: ${must.get(a)} must-route prompts, at least 3`));
      if (mustNot.get(a) < 1) out.push(finding(this.code, rel(ctx, dir), null, `${a}: no must-not-route prompt`));
    }
    return out;
  },
};
