// TGT-AGENT-001: only the conductor holds an agent-start grant, admitting exactly the nine specialists
// (C002-REQ-107). TGT-MODE-001: conductor primary, specialists subagent (the table's `primary_flags` and
// `subagent_flags`); every command or prompt file bound to the conductor (C002-REQ-202, C002-REQ-203,
// C002-REQ-303). TGT-MEM-001: no agent has a `memory` field (C002-REQ-106).
import { isDeepStrictEqual } from "node:util";
import { CONDUCTOR } from "../../generate/translate/frontmatter.ts";
import { agentPath, commandPath, configPath, doc, finding, json } from "./lib.mjs";

const specialistsOf = (ctx) => ctx.source.agents.map((a) => a.name).filter((n) => n !== CONDUCTOR).sort();
const list = (v) => (Array.isArray(v) ? v.map(String) : typeof v === "string" ? v.split(",").map((s) => s.trim()).filter(Boolean) : []);

export const agent001 = {
  code: "TGT-AGENT-001",
  check(ctx) {
    const out = [];
    const nine = specialistsOf(ctx);
    const startTools = ctx.table.agent_start.tools ?? [];
    const say = (p, m) => out.push(finding(this.code, p, null, `${p}: ${m}`));
    if (ctx.target === "opencode") {
      const config = configPath(ctx);
      const j = json(ctx, config);
      if (j === undefined || j.error) return out;
      const entries = j.value?.agent ?? {};
      const want = { "*": "deny", ...Object.fromEntries(nine.map((n) => [n, "allow"])) };
      for (const name of [CONDUCTOR, ...nine]) {
        const e = entries[name];
        if (e === undefined) continue; // TGT-PERM-001
        const task = e.permission?.task;
        if (name === CONDUCTOR) {
          if (!isDeepStrictEqual(task, want)) say(config, `the conductor's task rule is ${JSON.stringify(task ?? null)}; it must deny "*" and allow exactly the nine specialists`);
        } else {
          if (task !== "deny") say(config, `agent "${name}" has the task rule ${JSON.stringify(task ?? null)}; only the conductor may start agents ("deny")`);
          for (const t of startTools) if (e.tools?.[t] === true) say(config, `agent "${name}" is granted the agent-start tool "${t}"`);
        }
      }
      return out;
    }
    for (const name of [CONDUCTOR, ...nine]) {
      const p = agentPath(ctx, name);
      const d = doc(ctx, p);
      if (d === undefined) continue;
      const agents = list(d.data?.agents).sort();
      const tools = list(d.data?.tools);
      if (name === CONDUCTOR) {
        if (!isDeepStrictEqual(agents, nine)) say(p, `the conductor's agents list is ${JSON.stringify(agents)}; it must name exactly the nine specialists`);
      } else {
        if (agents.length > 0) say(p, `agent "${name}" lists agents ${JSON.stringify(agents)}; only the conductor may start agents`);
        for (const t of startTools) if (tools.includes(t)) say(p, `agent "${name}" is granted the agent-start tool "${t}"`);
      }
    }
    return out;
  },
};

export const mode001 = {
  code: "TGT-MODE-001",
  check(ctx) {
    const out = [];
    const say = (p, m) => out.push(finding(this.code, p, null, `${p}: ${m}`));
    const primary = ctx.table.agent_fields.primary_flags ?? {};
    const subagent = ctx.table.agent_fields.subagent_flags ?? {};
    for (const a of ctx.source.agents) {
      const p = agentPath(ctx, a.name);
      const data = doc(ctx, p)?.data;
      if (data === undefined) continue;
      const isConductor = a.name === CONDUCTOR;
      const want = isConductor ? primary : subagent;
      for (const [k, v] of Object.entries(want)) if (!isDeepStrictEqual(data?.[k], v)) say(p, `${isConductor ? "the conductor" : `the specialist "${a.name}"`} has ${k}: ${JSON.stringify(data?.[k] ?? null)}, not ${JSON.stringify(v)} (${isConductor ? "primary" : "subagent"})`);
      const other = isConductor ? subagent : primary;
      for (const [k, v] of Object.entries(other)) if (!Object.hasOwn(want, k) && isDeepStrictEqual(data?.[k], v)) say(p, `${isConductor ? "the conductor" : `the specialist "${a.name}"`} has ${k}: ${JSON.stringify(v)} of a ${isConductor ? "subagent" : "primary agent"}`);
    }
    for (const c of ctx.source.commands) {
      const p = commandPath(ctx, c.name);
      const d = doc(ctx, p);
      if (d === undefined) continue;
      if (d.data?.agent !== CONDUCTOR) say(p, `is bound to ${JSON.stringify(d.data?.agent ?? null)}, not ${CONDUCTOR}`);
    }
    return out;
  },
};

export const mem001 = {
  code: "TGT-MEM-001",
  check(ctx) {
    const out = [];
    for (const a of ctx.source.agents) {
      const p = agentPath(ctx, a.name);
      const data = doc(ctx, p)?.data;
      if (data && Object.hasOwn(data, "memory")) out.push(finding(this.code, p, null, `${p}: agent "${a.name}" has a memory field`));
    }
    if (ctx.target === "opencode") {
      const config = configPath(ctx);
      const entries = json(ctx, config)?.value?.agent ?? {};
      for (const [n, e] of Object.entries(entries)) if (e && typeof e === "object" && Object.hasOwn(e, "memory")) out.push(finding(this.code, config, null, `${config}: agent "${n}" has a memory field`));
    }
    return out;
  },
};
