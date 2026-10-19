// TGT-GRANT-001: under sdd MCP server enforcement no agent or prompt file grants a generic edit or terminal
// tool, by name or through a tool set that contains one, and every Copilot agent has a `tools` list (an
// agent without one gets every tool of the host, S-08 §3.2); under the Copilot hooks fallback the
// conductor and every prompt file grant none either (C002-REQ-209, C002-REQ-306, C002-REQ-321,
// C002-REQ-604). The finding names the file and the tool, or the missing list.
import { toolGrants } from "../../generate/tables.ts";
import { CONDUCTOR } from "../../generate/translate/frontmatter.ts";
import { agentPath, commandPath, configPath, doc, finding, json } from "./lib.mjs";

/** The mode in which each target grants the generic tools (the one without server profiles). */
const GENERIC_MODE = { opencode: "native-permissions", copilot: "copilot-hooks" };

/** Host built-in edit and terminal tools beside the table's own generic grants. */
const BUILT_IN = {
  opencode: ["write", "edit", "bash", "patch", "multiedit"],
  // VS Code tool reference names and the Copilot CLI tool names (create, edit, shell, powershell; S-08 §3.2).
  copilot: ["create", "edit", "execute", "createFile", "createDirectory", "editFiles", "editNotebook", "shell", "powershell", "bash", "runInTerminal", "terminal", "runTask", "createAndRunTask", "runCommand"],
};

/** Tool sets of the host and the generic tools each contains (a grant `<set>` or `<set>/*` holds them all). */
const TOOL_SETS = {
  opencode: {},
  copilot: {
    edit: ["create", "edit", "createFile", "createDirectory", "editFiles", "editNotebook"],
    execute: ["shell", "powershell", "runInTerminal", "runTask", "createAndRunTask"],
    new: ["createFile", "createDirectory"],
    runCommands: ["runInTerminal"],
    runTasks: ["runTask", "createAndRunTask"],
    vscode: ["runCommand"],
  },
};

/** The generic edit and terminal tools of the target: the table's grants of Write, Edit and Bash in its generic mode, and the built-ins. */
export function genericTools(ctx) {
  const out = new Set(BUILT_IN[ctx.target]);
  for (const t of ["Write", "Edit", "Bash"]) {
    const e = ctx.table.tools[t];
    for (const g of (e && toolGrants(e, GENERIC_MODE[ctx.target])) ?? []) out.add(g);
  }
  return out;
}

const globRe = (pattern) => new RegExp(`^${pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*")}$`);

/** Why a grant is generic, or null: the tool by name, a tool set holding one, or a pattern matching one. */
export function genericGrant(ctx, generic, grant) {
  if (generic.has(grant)) return `grants the generic edit or terminal tool "${grant}"`;
  const sets = TOOL_SETS[ctx.target];
  const [set, member] = [grant.split("/")[0], grant.includes("/") ? grant.slice(grant.indexOf("/") + 1) : undefined];
  if (Object.hasOwn(sets, set)) {
    if (member === undefined || member === "*") return `grants the tool set "${grant}", which contains the generic tool${sets[set].length > 1 ? "s" : ""} ${sets[set].map((t) => `"${t}"`).join(", ")}`;
    if (generic.has(member) || sets[set].includes(member)) return `grants "${grant}", the generic tool "${member}" of the tool set "${set}"`;
  }
  if (grant.includes("*")) {
    const hit = [...generic].filter((g) => globRe(grant).test(g));
    if (hit.length > 0) return `grants the pattern "${grant}", which matches the generic tool${hit.length > 1 ? "s" : ""} ${hit.map((t) => `"${t}"`).join(", ")}`;
  }
  return null;
}

export default {
  code: "TGT-GRANT-001",
  check(ctx) {
    const out = [];
    const generic = genericTools(ctx);
    const server = ctx.mode === "sdd-mcp-server";
    const report = (p, grants, who) => {
      for (const g of grants) {
        const why = genericGrant(ctx, generic, g);
        if (why) out.push(finding(this.code, p, null, `${p}: ${why}${who}`));
      }
    };
    const names = ctx.source.agents.map((a) => a.name).sort();
    if (ctx.target === "opencode") {
      if (!server) return out; // native permission enforcement grants the generic tools under permission rules
      const config = configPath(ctx);
      const j = json(ctx, config);
      if (j === undefined || j.error) return out;
      for (const name of names) {
        const tools = j.value?.agent?.[name]?.tools;
        if (tools && typeof tools === "object") report(config, Object.keys(tools).filter((k) => k !== "*" && tools[k] === true), ` to "${name}" under sdd MCP server enforcement`);
      }
      return out;
    }
    for (const name of names) {
      const p = agentPath(ctx, name);
      const d = doc(ctx, p);
      if (d === undefined) continue; // TGT-LAYOUT-001
      const tools = d.data?.tools;
      if (!Array.isArray(tools)) {
        out.push(finding(this.code, p, null, `${p}: has no "tools" list in its frontmatter; an agent without one gets every tool of the host, edit and terminal tools included`));
        continue;
      }
      if (server || name === CONDUCTOR) report(p, tools.map(String), server ? " under sdd MCP server enforcement" : " under the Copilot hooks fallback (the conductor keeps the server profiles)");
    }
    for (const c of ctx.source.commands) {
      const p = commandPath(ctx, c.name);
      const tools = doc(ctx, p)?.data?.tools;
      if (Array.isArray(tools)) report(p, tools.map(String), server ? " under sdd MCP server enforcement" : " under the Copilot hooks fallback (prompt files keep the server profiles)");
    }
    return out;
  },
};
