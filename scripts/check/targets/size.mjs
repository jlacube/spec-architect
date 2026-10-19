// TGT-SIZE-001: inlining budgets of C002-NFR-104 on the generated agents — each inlined skill at most
// 24,000 characters and all inlined skills of one agent at most 64,000, references excluded (only the
// `## Skill: <name>` sections of the agent body count; C002-REQ-110, C002-TS-116). One finding per budget
// exceeded, naming the target, the agent, the budget, the measured size and the skills concerned.
import { listField } from "../../generate/translate/frontmatter.ts";
import { skillHeading } from "../../generate/translate/inline.ts";
import { agentPath, finding, text } from "./lib.mjs";

export const PER_SKILL = 24000;
export const PER_AGENT = 64000;

const fmt = (n) => n.toLocaleString("en-US");

/** Size in characters (code points) of each inlined skill section of an agent text, in source order. */
export function inlinedSizes(agentText, skills) {
  const lines = agentText.split("\n");
  const starts = [];
  let from = 0;
  for (const s of skills) {
    const i = lines.findIndex((l, k) => k >= from && l === skillHeading(s));
    if (i < 0) continue;
    starts.push({ skill: s, line: i });
    from = i + 1;
  }
  return starts.map((s, k) => {
    const end = k + 1 < starts.length ? starts[k + 1].line : lines.length;
    const body = lines.slice(s.line + 1, end).join("\n").replace(/^\s+|\s+$/g, "");
    return { skill: s.skill, size: [...body].length };
  });
}

export default {
  code: "TGT-SIZE-001",
  check(ctx) {
    const out = [];
    for (const a of ctx.source.agents) {
      const p = agentPath(ctx, a.name);
      const t = text(ctx, p);
      if (t === undefined) continue; // TGT-LAYOUT-001
      const sizes = inlinedSizes(t, listField(a.data?.skills));
      for (const s of sizes)
        if (s.size > PER_SKILL) out.push(finding(this.code, p, null, `${ctx.target}: agent ${a.name}: inlined skill ${s.skill} is ${fmt(s.size)} characters, over the per-skill budget of ${fmt(PER_SKILL)}`));
      const total = sizes.reduce((n, s) => n + s.size, 0);
      if (total > PER_AGENT)
        out.push(finding(this.code, p, null, `${ctx.target}: agent ${a.name}: inlined skills total ${fmt(total)} characters, over the per-agent budget of ${fmt(PER_AGENT)} (${sizes.map((s) => `${s.skill} ${fmt(s.size)}`).join(", ")})`));
    }
    return out;
  },
};
