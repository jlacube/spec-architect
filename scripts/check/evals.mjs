// PLG-EVAL-001: the `claude plugin eval` suite (plugins/architect/evals/<case>/prompt.md + graders/*.md)
// has ≥ 40 prompts, ≥ 3 that must route to each of the ten agents and ≥ 1 per agent that must not
// (C001-REQ-1116; owned by C001-T-063). Grader semantics are those of `claude plugin eval` (Claude Code
// 2.1.299; its tool_used schema is strict: tool, input_match, min, max, weight, arm):
// - must route: a `tool_used` grader with `min` ≥ 1 (default 1) whose `input_match` names
//   `architect:<agent>`;
// - must not route: a `tool_used` grader with `max: 0` whose `input_match` names `architect:<agent>`.
// An agent that is started as the main session and never as a subagent (its description says "do not
// invoke it as a subagent", C001-IF-09 A0, the conductor) is routed to by the hand-over (CHG-001 D-016):
// - must route: a `regex` grader (match contains) on the last reply whose pattern matches the literal
//   `claude --agent architect:<agent>`; the case must also declare a `tool_used` Agent grader with
//   `max: 0` that matches every Architect subagent (no Architect subagent starts);
// - must not route: as above (`max: 0` naming the agent), and the case must also declare a `regex`
//   grader with `match: not_contains` matching that literal (the reply does not hand over).
// `negate` and `tool_not_used` are not `claude plugin eval` grader fields; a grader using them is reported.
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { files, finding, frontmatter, read, rel } from "./lib.mjs";

/** The hand-over line of a main-session-only agent. */
export const handOver = (agent) => `claude --agent architect:${agent}`;

/** Whether a regex pattern matches the literal hand-over of `agent` (and not the bare `--agent` form). */
function matchesHandOver(pattern, agent) {
  try {
    const re = new RegExp(pattern);
    return re.test(handOver(agent)) && !re.test(`--agent architect:${agent}`);
  } catch {
    return false;
  }
}

/** Whether a tool_used Agent grader's input_match matches the subagent_type of every agent. */
function matchesEveryAgent(fm, agents) {
  try {
    const re = new RegExp(String(fm.input_match ?? ""));
    return fm.tool === "Agent" && agents.every((a) => re.test(JSON.stringify({ subagent_type: `architect:${a}` })));
  } catch {
    return false;
  }
}

/**
 * The routing expectations of one grader file: `{ must: [agent], mustNot: [agent], handOverAbsent: [agent],
 * noSubagent, invalid }`.
 */
export function graderRouting(text, agents, mainSessionOnly = new Set()) {
  const { data: fm, body } = frontmatter(text);
  const none = { must: [], mustNot: [], handOverAbsent: [], noSubagent: false, invalid: null };
  const names = (s) => agents.filter((a) => new RegExp(`architect:${a}\\b`).test(String(s ?? "")));
  if (fm.negate !== undefined || fm.type === "tool_not_used") return { ...none, invalid: "negate / tool_not_used is not a claude plugin eval grader; use tool_used with min: 0 and max: 0" };
  if (fm.type === "tool_used") {
    if (fm.max === 0) return { ...none, mustNot: names(fm.input_match), noSubagent: matchesEveryAgent(fm, agents) };
    return { ...none, must: (fm.min ?? 1) >= 1 ? names(fm.input_match) : [] };
  }
  if (fm.type === "regex") {
    const main = [...mainSessionOnly].filter((a) => matchesHandOver(body.trim(), a));
    const match = fm.match ?? "contains";
    if (match === "contains") return { ...none, must: main };
    if (match === "not_contains") return { ...none, handOverAbsent: main };
  }
  return none;
}

/** The routing expectations of one case (all its graders) and the findings of the D-016 per-case rules. */
export function caseRouting(graderTexts, agents, mainSessionOnly = new Set()) {
  const rs = graderTexts.map((t) => graderRouting(t, agents, mainSessionOnly));
  const must = [...new Set(rs.flatMap((r) => r.must))];
  const mustNot = [...new Set(rs.flatMap((r) => r.mustNot))];
  const problems = rs.map((r) => r.invalid).filter(Boolean);
  for (const a of mainSessionOnly) {
    if (must.includes(a) && !rs.some((r) => r.noSubagent)) problems.push(`${a} must-route case without the check that no Architect subagent starts (tool_used Agent, max: 0, matching every architect:sdd-* agent)`);
    if (mustNot.includes(a) && !rs.some((r) => r.handOverAbsent.includes(a))) problems.push(`${a} must-not-route case without the hand-over check (regex, match: not_contains, "${handOver(a)}")`);
  }
  return { must, mustNot, problems };
}

/** The ten agent names and the ones started only as the main session. */
export function pluginAgents(plugin) {
  const agentDir = join(plugin, "agents");
  const agents = readdirSync(agentDir).filter((n) => /^sdd-.+\.md$/.test(n)).map((n) => n.slice(0, -3));
  const mainSessionOnly = new Set(agents.filter((a) => /do not invoke it as a subagent/i.test(String(frontmatter(read(join(agentDir, `${a}.md`))).data.description ?? ""))));
  return { agents, mainSessionOnly };
}

export default {
  code: "PLG-EVAL-001",
  owner: "C001-T-063",
  check(ctx) {
    const dir = join(ctx.plugin, "evals");
    const cases = existsSync(dir) ? readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory() && existsSync(join(dir, e.name, "prompt.md"))) : [];
    const out = [];
    if (cases.length < 40) out.push(finding(this.code, rel(ctx, dir), null, `${cases.length} prompts, at least 40 required`));
    const { agents, mainSessionOnly } = pluginAgents(ctx.plugin);
    const must = new Map(agents.map((a) => [a, 0]));
    const mustNot = new Map(agents.map((a) => [a, 0]));
    for (const c of cases) {
      const r = caseRouting(files(join(dir, c.name, "graders"), (p) => p.endsWith(".md")).map((p) => read(p)), agents, mainSessionOnly);
      for (const p of r.problems) out.push(finding(this.code, rel(ctx, join(dir, c.name)), null, p));
      for (const a of r.must) must.set(a, must.get(a) + 1);
      for (const a of r.mustNot) mustNot.set(a, mustNot.get(a) + 1);
    }
    for (const a of agents) {
      if (must.get(a) < 3) out.push(finding(this.code, rel(ctx, dir), null, `${a}: ${must.get(a)} must-route prompts, at least 3`));
      if (mustNot.get(a) < 1) out.push(finding(this.code, rel(ctx, dir), null, `${a}: no must-not-route prompt`));
    }
    return out;
  },
};
