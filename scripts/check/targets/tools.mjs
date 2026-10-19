// TGT-TOOLS-001: each agent's and prompt file's tool grants equal the grants the table derives from the
// source `tools` field, server profiles included (C002-REQ-108, C002-REQ-117, C002-REQ-603); on OpenCode
// each Architect agent's `tools` map starts with the catch-all `"*": false` (C002-IF-005 §2, C002-TS-640).
// The finding names the file and each tool granted or missing.
import { CONDUCTOR, grantFindings, translateAgents } from "../../generate/translate/frontmatter.ts";
import { agentPath, commandPath, configPath, doc, finding, json } from "./lib.mjs";

/** The frontmatter the translator derives for each source agent, by name. */
export function expectedAgents(ctx) {
  return new Map(translateAgents(ctx.emitInput).agents.map((a) => [a.frontmatter.name, a.frontmatter]));
}

export default {
  code: "TGT-TOOLS-001",
  check(ctx) {
    const out = [];
    const expected = expectedAgents(ctx);
    const push = (fs) => out.push(...fs.map((f) => finding(this.code, f.file, null, f.message)));
    if (ctx.target === "opencode") {
      const config = configPath(ctx);
      const j = json(ctx, config);
      if (j === undefined || j.error) return out; // TGT-LAYOUT-001 / TGT-MCP-001 report it
      const agents = j.value?.agent ?? {};
      for (const [name, fm] of expected) {
        const tools = agents[name]?.tools;
        if (tools === null || typeof tools !== "object" || Array.isArray(tools)) {
          out.push(finding(this.code, config, null, `${config}: agent "${name}" has no tools map`));
          continue;
        }
        const keys = Object.keys(tools);
        if (!keys.includes("*")) out.push(finding(this.code, config, null, `${config}: the tools map of "${name}" has no catch-all entry "*": false`));
        else if (tools["*"] !== false) out.push(finding(this.code, config, null, `${config}: the tools map of "${name}" holds the catch-all entry "*": ${JSON.stringify(tools["*"])}, not false`));
        else if (keys[0] !== "*") out.push(finding(this.code, config, null, `${config}: the tools map of "${name}" holds the catch-all entry "*": false after "${keys[0]}"; it must come first`));
        const granted = keys.filter((k) => k !== "*" && tools[k] === true);
        push(grantFindings(fm, granted, config));
      }
      return out;
    }
    // Copilot: the tools list of each agent file and of each prompt file (the conductor's grants).
    for (const [name, fm] of expected) {
      const p = agentPath(ctx, name);
      const tools = doc(ctx, p)?.data?.tools;
      if (Array.isArray(tools)) push(grantFindings(fm, tools.map(String), p)); // a missing list is TGT-GRANT-001's
    }
    const conductor = expected.get(CONDUCTOR);
    if (conductor !== undefined)
      for (const c of ctx.source.commands) {
        const p = commandPath(ctx, c.name);
        const tools = doc(ctx, p)?.data?.tools;
        if (!Array.isArray(tools)) {
          if (doc(ctx, p) !== undefined) out.push(finding(this.code, p, null, `${p}: has no tools list; a prompt file grants the conductor's tools`));
          continue;
        }
        const granted = tools.map(String);
        for (const t of granted) if (!conductor.tools.includes(t)) out.push(finding(this.code, p, null, `${p}: grants "${t}", which the conductor's source tools field does not derive`));
        for (const t of conductor.tools) if (!granted.includes(t)) out.push(finding(this.code, p, null, `${p}: lacks "${t}", which the conductor's source tools field derives`));
      }
    return out;
  },
};
