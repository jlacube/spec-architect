// Copilot emitter (C002-COMP-001, C002-COMP-004; C002-IF-001 §3 step 9, C002-IF-005 §3): writes the files
// of `dist/copilot/` from the translated model. The plugin part: ten agents `agents/<agent name>.agent.md`
// (`name` = file name, a `tools` list on every agent, the conductor's `agents` list of the nine
// specialists by bare name, `user-invocable: false` on the specialists; C002-REQ-301, C002-REQ-306), 13
// prompt files `prompts/<name>.prompt.md` bound to the conductor with the conductor's `tools`
// (C002-REQ-303, C002-REQ-317), one skill folder per source skill in the Agent Skills format. The install
// sources that `sdd install copilot` (C002-T-058) uses: `install/plugin.json` (`placement.plugin_manifest`,
// the manifest named `architect`, copied to the package root only by the install) and `install/mcp.json`
// (`placement.config_file`, VS Code `servers` form, `sdd-files` and `sdd-shell` in both modes,
// C002-REQ-307). Beside them the byte copy of the bundled CLI (`placement.cli_copy`, C002-ADR-004) and
// `INSTALL.md` from `targets/copilot/install.md` (C002-REQ-304). Nothing is written at the package root
// that makes the folder a plugin or declares a server or hook (`plugin.json`, `.mcp.json`, `hooks.json`;
// C002-REQ-307, C002-IF-005 §3). Under the Copilot hooks fallback the specialists hold the table's generic
// edit and terminal tools while the conductor and every prompt file keep the server profiles
// (C002-REQ-321; the frontmatter translator derives both). The hook declarations
// `install/hooks.template.json` (`placement.hooks_file`, both modes, C002-IF-008 §4): one PreToolUse
// entry `hook guard --host copilot --mode <mode> --agents <the ten>` (the Copilot subagent guard hook,
// under the fallback also the Copilot guard hook; C002-REQ-302, C002-REQ-308, C002-REQ-327), a
// SessionStart and a SubagentStop entry, every command `node "@CLI_COPY@"` with arguments only and no
// root token (C002-REQ-313 … C002-REQ-316, C002-REQ-326); no agent frontmatter declares a hook (S-08
// fact F-4). The tool classes file `hooks/tool-classes.json` (both modes) is the table's
// `hook_tool_classes`; every tool the host offers a specialist, by its hook name, must have a class
// (C002-REQ-318, ERR-GEN-004 otherwise).
import { stringify } from "yaml";
import { PROFILE_TOOLS, type Profile } from "../../../src/mcp/schemas.ts";
import { splitFrontmatter } from "../../../src/model/frontmatter.ts";
import { diagnostic, type Diagnostic } from "../diagnostics.ts";
import type { EmitInput, EmitResult, PackageFile, SourcePlugin } from "../model.ts";
import { CLI_BUNDLE } from "../model.ts";
import { toolGrants, type MappingTable, type Mode } from "../tables.ts";
import { scanText, translateBodies, type TranslatedDoc } from "../translate/constructs.ts";
import { agentFilePath, CONDUCTOR, mcpMatcher, splitToolsField, translateAgents } from "../translate/frontmatter.ts";
import { inlineSkills } from "../translate/inline.ts";
import { tokenValues, variantLines } from "../translate/wiring.ts";
import { canonicalJson, MANIFEST } from "../writer.ts";
import { commandFilePath, declaredServers, skillFilePath, type PackageFinding } from "./opencode.ts";

/** Source of the install notes inside the source plugin (C002-IF-005 §5). */
export const INSTALL_SOURCE = "targets/copilot/install.md";
/** Name of the plugin the install makes of the package folder (C002-IF-005 §3). */
export const PLUGIN_NAME = "architect";
/** Files that would make the package folder a plugin, or declare servers or hooks, before the install (C002-REQ-307). */
export const ROOT_FORBIDDEN = ["plugin.json", ".mcp.json", "hooks.json"] as const;

const place = (table: MappingTable, key: string, fallback: string) => table.placement[key] ?? fallback;

/** One frontmatter line: a list in the flow form of the S-08 probe files (`['read', 'search']`), any other value as YAML. */
function yamlLine(key: string, value: unknown): string {
  if (Array.isArray(value)) return `${key}: [${value.map((v) => `'${String(v).replaceAll("'", "''")}'`).join(", ")}]`;
  return stringify({ [key]: value }, { lineWidth: 0 }).replace(/\n$/, "");
}

/** A Markdown file with YAML frontmatter (keys in the order given), one blank line, the body; LF, final newline. */
function markdown(front: Record<string, unknown>, body: string): string {
  const yaml = Object.entries(front).map(([k, v]) => yamlLine(k, v)).join("\n");
  return `---\n${yaml}\n---\n\n${body.replace(/^(?:[ \t]*\n)+/, "").replace(/\s+$/, "")}\n`;
}

/** One `servers` entry of the workspace MCP configuration (`http` with its URL, `stdio` with command and arguments). */
function serverEntry(server: MappingTable["mcp_servers"][string]): Record<string, unknown> {
  if (server.transport === "http") return { type: "http", url: server.url };
  const entry: Record<string, unknown> = { type: "stdio", command: server.command, args: [...(server.args ?? [])] };
  if (server.env && Object.keys(server.env).length > 0) entry["env"] = server.env;
  return entry;
}

/** `install/mcp.json`: the table's servers for the mode in the VS Code workspace form (C002-IF-005 §3). */
export function workspaceMcp(table: MappingTable, mode: EmitInput["mode"]): Record<string, unknown> {
  return { servers: Object.fromEntries(declaredServers(table, mode).map((n) => [n, serverEntry(table.mcp_servers[n]!)])) };
}

/** The source plugin's manifest fields the package manifest repeats. */
function sourceManifest(input: EmitInput): { name?: string; description?: string } {
  try {
    return JSON.parse(input.source.files.find((f) => f.path === ".claude-plugin/plugin.json")?.text ?? "{}") as { name?: string; description?: string };
  } catch {
    return {}; // the reader reports a manifest that does not parse
  }
}

/** `install/plugin.json`: name `architect`, the package version, the description, prompt files as commands. */
export function pluginManifest(input: EmitInput): Record<string, unknown> {
  const src = sourceManifest(input);
  return {
    name: PLUGIN_NAME,
    version: tokenValues(input.source, input.table, input.mode).get("package_version"),
    description: src.description ?? "Spec-driven development agents",
    commands: place(input.table, "commands_dir", "prompts"),
  };
}

/** The install notes: the source with the tokens of C002-IF-001 §4 resolved (ERR-GEN-006 otherwise). */
function installNotes(input: EmitInput, diagnostics: Diagnostic[]): string | null {
  const text = input.source.files.find((f) => f.path === INSTALL_SOURCE)?.text;
  if (text === undefined) {
    diagnostics.push(diagnostic("ERR-GEN-007", `${INSTALL_SOURCE}: install-notes source of the ${input.target} target does not exist`, { file: INSTALL_SOURCE, target: input.target }));
    return null;
  }
  return `${variantLines(text, INSTALL_SOURCE, input.target, tokenValues(input.source, input.table, input.mode), diagnostics).join("\n")}\n`;
}

/** The token the install command replaces by the absolute path of the CLI copy (C002-IF-008 §4). */
export const CLI_COPY_TOKEN = "@CLI_COPY@";
/** The tool classes file of the package; the CLI copy's default `--classes` (`src/cli/hook-cmds.ts`). */
export const TOOL_CLASSES_FILE = "hooks/tool-classes.json";
/** The tool the host adds to every agent, through which deferred MCP tools are loaded (S-08 §3.2, fact F-7). */
export const TOOL_SEARCH = "tool_search_tool";
/** The host's generic edit and terminal tools whose hook names the S-08 record gives (§2.3, §3.1). */
export const RECORDED_GENERIC = ["Write", "Bash"] as const;
/**
 * Hook `tool_name` values the S-08 record gives for built-in tools (§2.3, §3): `Write` (create tool),
 * `Bash` (terminal tool), `Glob`. Each equals the source tool of the same name, so a specialist is offered
 * it when its `tools` list holds the table's grant of that source tool. The hook names of the `edit` and
 * read tools are not recorded and stay out of the classes, so their calls are denied as unclassed
 * (C002-IF-008 §2 rules 6 and 8).
 */
const RECORDED_HOOK_NAMES = ["Write", "Bash", "Glob"] as const;
/** The author agents whose SubagentStop refreshes the trace (C002-REQ-315; the source SubagentStop matcher). */
export const AUTHOR_AGENTS = ["sdd-spec-writer", "sdd-test-designer", "sdd-architect", "sdd-planner"] as const;
/** Hook events of the template (C002-IF-005 §3). */
export const HOOK_EVENTS = ["PreToolUse", "SessionStart", "SubagentStop"] as const;
/** Shell operators and root tokens no hook command may hold (C002-REQ-316, C002-REQ-326, TGT-HOOK-001). */
export const HOOK_FORBIDDEN = ["&&", "||", ";", "|", ">", "<", "$(", "`", "${PLUGIN_ROOT}", "${CLAUDE_PLUGIN_ROOT}"] as const;

const cliCommand = (args: string) => `node "${CLI_COPY_TOKEN}" ${args}`;

/** The PreToolUse command of the package, both modes (C002-IF-008 §2, §4). */
export function guardCommand(mode: Mode, agents: readonly string[]): string {
  return cliCommand(`hook guard --host copilot --mode ${mode} --agents ${agents.join(",")}`);
}

/** `install/hooks.template.json` (C002-IF-005 §3): `agents` are the ten Architect agents, the conductor first. */
export function hooksTemplate(mode: Mode, agents: readonly string[]): { hooks: Record<(typeof HOOK_EVENTS)[number], { command: string; type: "command" }[]> } {
  const entry = (command: string) => [{ command, type: "command" as const }];
  return {
    hooks: {
      PreToolUse: entry(guardCommand(mode, agents)),
      SessionStart: entry(cliCommand("hook session-start --host copilot")),
      SubagentStop: entry(cliCommand(`hook subagent-stop --host copilot --agents ${AUTHOR_AGENTS.join(",")}`)),
    },
  };
}

/** The hook names of the tools of one sdd MCP server profile or, for another server, the tools the source agents name. */
function serverToolNames(table: MappingTable, source: SourcePlugin, server: string): string[] {
  const args = table.mcp_servers[server]?.args ?? [];
  const at = args.indexOf("--profile");
  const profile = at >= 0 ? (args[at + 1] as Profile | undefined) : undefined;
  if (table.mcp_servers[server]?.command === "sdd-mcp" && profile !== undefined && profile in PROFILE_TOOLS) return [...PROFILE_TOOLS[profile]];
  const mcp = mcpMatcher(table);
  const out = new Set<string>();
  for (const a of source.agents)
    for (const t of splitToolsField(a.data?.["tools"])) {
      const m = mcp.exec(t);
      if (m?.groups && m.groups["server"] === server) out.add(m.groups["tool"]!);
    }
  return [...out].sort();
}

/**
 * The hook `tool_name` values the host offers an agent whose `tools` list is `grants` (C002-IF-005 §3,
 * C002-IF-008 §2): `tool_search_tool`, the `<server>-<tool>` names of its MCP grants (a per-server grant
 * stands for every tool of the server: the profile's tools for the sdd MCP server, else the tools the
 * source agents name), and each recorded built-in hook name whose source tool the table maps to a grant
 * the list holds.
 */
export function offeredHookTools(table: MappingTable, mode: Mode, source: SourcePlugin, grants: readonly string[]): string[] {
  const out = new Set<string>([TOOL_SEARCH]);
  const m = table.mcp_tool_names;
  const grantRe = new RegExp(`^${(m.grant_pattern ?? m.target_pattern).replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace("\\{server\\}", "(?<server>[A-Za-z0-9-]+)").replace("\\{tool\\}", "(?<tool>[A-Za-z0-9_*-]+)")}$`);
  const hookName = (server: string, tool: string) => m.target_pattern.replaceAll("{server}", server).replaceAll("{tool}", tool);
  const isMcp = (g: string) => {
    const s = grantRe.exec(g)?.groups?.["server"];
    return s !== undefined && s in table.mcp_servers;
  };
  for (const g of grants) {
    const hit = grantRe.exec(g)?.groups;
    if (hit && hit["server"]! in table.mcp_servers) {
      for (const t of hit["tool"] === "*" ? serverToolNames(table, source, hit["server"]!) : [hit["tool"]!]) out.add(hookName(hit["server"]!, t));
      continue;
    }
    for (const h of RECORDED_HOOK_NAMES) {
      const e = table.tools[h];
      const gs = e === undefined ? undefined : toolGrants(e, mode);
      if (gs !== undefined && gs.includes(g) && !gs.some(isMcp)) out.add(h);
    }
  }
  return [...out].sort();
}

const CLASS_NAMES = ["write", "terminal", "read_only"] as const;

/** Names per class of a classes document; null when it is not of the classes shape. */
function classNames(doc: unknown): Record<(typeof CLASS_NAMES)[number], string[]> | null {
  if (doc === null || typeof doc !== "object" || Array.isArray(doc)) return null;
  const d = doc as Record<string, unknown>;
  const out = {} as Record<(typeof CLASS_NAMES)[number], string[]>;
  for (const k of CLASS_NAMES) {
    if (!Array.isArray(d[k])) return null;
    out[k] = (d[k] as unknown[]).map((e) => (typeof e === "string" ? e : String((e as { tool?: unknown } | null)?.tool ?? "")));
  }
  return out;
}

/**
 * The classes rules of TGT-CLASS-001 (C002-IF-005 §6, C002-IF-008 §2) on a classes document: every
 * offered tool (`offered`: tool → the agent files offered it) and each recorded generic tool in exactly
 * one class; `Write` and the sdd-files tools in `write`, `Bash` and the sdd-shell tool in `terminal`,
 * `Glob` in `read_only`; each terminal tool with the table's dialect. One message per problem.
 */
export function classProblems(doc: unknown, offered: ReadonlyMap<string, readonly string[]>, table: MappingTable, source: SourcePlugin): string[] {
  const names = classNames(doc);
  if (names === null) return ["is not a tool classes object with the arrays write, terminal and read_only"];
  const out: string[] = [];
  const all = new Map<string, readonly string[]>(offered);
  for (const g of RECORDED_GENERIC) if (!all.has(g)) all.set(g, []);
  const who = (tool: string) => {
    const agents = all.get(tool) ?? [];
    return agents.length === 0 ? `the generic tool "${tool}"` : `tool "${tool}" (offered to ${agents.join(", ")})`;
  };
  for (const tool of [...all.keys()].sort()) {
    const in_ = CLASS_NAMES.filter((k) => names[k].includes(tool));
    if (in_.length === 0) out.push(`${who(tool)} has no class`);
    else if (in_.length > 1 || CLASS_NAMES.some((k) => names[k].filter((n) => n === tool).length > 1)) out.push(`${who(tool)} is classed more than once (${in_.join(", ")})`);
  }
  const hook = (server: string, tool: string) => table.mcp_tool_names.target_pattern.replaceAll("{server}", server).replaceAll("{tool}", tool);
  const want: [string, (typeof CLASS_NAMES)[number]][] = [
    ["Write", "write"],
    ...serverToolNames(table, source, "sdd-files").map((t) => [hook("sdd-files", t), "write"] as [string, "write"]),
    ["Bash", "terminal"],
    ...serverToolNames(table, source, "sdd-shell").map((t) => [hook("sdd-shell", t), "terminal"] as [string, "terminal"]),
    ["Glob", "read_only"],
  ];
  for (const [tool, k] of want) {
    const in_ = CLASS_NAMES.filter((c) => names[c].includes(tool));
    if (in_.length > 0 && !in_.includes(k)) out.push(`${who(tool)} is in the class ${in_.join(", ")}, not ${k}`);
  }
  const dialects = new Map((table.hook_tool_classes?.terminal ?? []).map((e) => [e.tool, e.dialect ?? "strictest"]));
  for (const e of ((doc as { terminal: unknown[] }).terminal ?? []) as { tool?: unknown; dialect?: unknown }[]) {
    const tool = String(e?.tool ?? "");
    const wantDialect = dialects.get(tool);
    const have = typeof e?.dialect === "string" ? e.dialect : "strictest";
    if (wantDialect !== undefined && have !== wantDialect) out.push(`${who(tool)} has the terminal dialect ${have}, not the table's ${wantDialect}`);
  }
  return out;
}

/** Writes the Copilot target package (C002-IF-005 §3) from the translated model. */
export const emitCopilot = (input: EmitInput): EmitResult => {
  const { table, mode, target } = input;
  const front = translateAgents(input);
  const bodies = translateBodies(input);
  const inlined = inlineSkills(input.source, bodies.docs, target);
  const diagnostics: Diagnostic[] = [...front.diagnostics, ...bodies.diagnostics, ...inlined.diagnostics];
  const notes = installNotes(input, diagnostics);

  // Step 8 on the configuration: the server commands, arguments and URLs are `mcp-config` text.
  const tableFile = `targets/${target}.json`;
  for (const n of declaredServers(table, mode)) {
    const s = table.mcp_servers[n]!;
    const text = [s.command ?? "", ...(s.args ?? []), s.url ?? "", ...Object.values(s.env ?? {})].join("\n");
    diagnostics.push(...scanText(table, target, mode, tableFile, text, "mcp-config"));
  }
  const cliCopy = table.placement["cli_copy"] ?? null;
  if (cliCopy !== null && input.source.cli === undefined)
    diagnostics.push(diagnostic("ERR-GEN-007", `${CLI_BUNDLE}: the bundled CLI that the ${target} package copies (placement.cli_copy) does not exist; run npm run build`, { file: CLI_BUNDLE, target }));
  const conductor = front.agents.find((a) => a.frontmatter.name === CONDUCTOR);

  // Hook template (both modes): the commands are `hook-command` text; the ten agents, the conductor first.
  const hooksFile = place(table, "hooks_file", "install/hooks.template.json");
  const template = conductor && conductor.frontmatter.agentStart.style === "agents-list" ? hooksTemplate(mode, [CONDUCTOR, ...conductor.frontmatter.agentStart.agents]) : null;
  if (template !== null)
    diagnostics.push(...scanText(table, target, mode, hooksFile, Object.values(template.hooks).flatMap((es) => es.map((e) => e.command)).join("\n"), "hook-command"));

  // Tool classes (both modes): every tool offered to a specialist has exactly one class (C002-REQ-318).
  const classes = table.hook_tool_classes;
  if (classes === undefined) diagnostics.push(diagnostic("ERR-GEN-004", `${tableFile}: /: the ${target} mapping table has no hook_tool_classes (C002-REQ-318)`, { file: tableFile, target }));
  else {
    const offered = new Map<string, string[]>();
    for (const a of front.agents) {
      if (a.frontmatter.name === CONDUCTOR) continue;
      for (const t of offeredHookTools(table, mode, input.source, a.frontmatter.tools)) offered.set(t, [...(offered.get(t) ?? []), a.frontmatter.name]);
    }
    for (const p of classProblems(classes, offered, table, input.source))
      diagnostics.push(diagnostic("ERR-GEN-004", `${tableFile}: /hook_tool_classes: ${p}`, { file: tableFile, target }));
  }
  if (diagnostics.length > 0 || notes === null || conductor === undefined || template === null || classes === undefined) return { files: new Map(), diagnostics };

  const docs = new Map<string, TranslatedDoc>(bodies.docs.map((d) => [d.path, d]));
  const bodyOf = new Map(inlined.agents.map((a) => [a.path, a.body]));
  const files = new Map<string, PackageFile>();

  // Agents: name = file name, description (references translated), model of the tier, tools (always), agents, flags.
  for (const a of front.agents) {
    const fm = a.frontmatter;
    const fields: Record<string, unknown> = {
      name: fm.name,
      description: docs.get(a.path)?.fields["description"] ?? fm.description,
      model: fm.model,
      tools: fm.tools,
      agents: fm.agentStart.style === "agents-list" ? fm.agentStart.agents : [],
    };
    for (const [k, v] of Object.entries(fm.fields)) fields[k] = v;
    files.set(agentFilePath(table, fm.name), markdown(fields, bodyOf.get(a.path) ?? docs.get(a.path)?.body ?? ""));
  }

  // Prompt files: `<name>.prompt.md`, bound to the conductor with the conductor's tools (prompt-file tools
  // take precedence over the agent's, C002-OA-001); the guard line is gone (construct `guard-line`).
  for (const c of input.source.commands) {
    const doc = docs.get(c.path)!;
    const fields: Record<string, unknown> = { description: doc.fields["description"] ?? "" };
    const hint = (doc.fields["argument-hint"] ?? "").trim();
    if (hint !== "") fields["argument-hint"] = hint;
    fields["agent"] = CONDUCTOR;
    fields["tools"] = conductor.frontmatter.tools;
    files.set(commandFilePath(table, c.name), markdown(fields, doc.body));
  }

  // Skills (Agent Skills format): SKILL.md with name and description, and every resource of the folder.
  for (const s of input.source.skills) {
    const doc = docs.get(s.doc.path)!;
    files.set(skillFilePath(table, s.name, "SKILL.md"), markdown({ name: doc.fields["name"] ?? s.name, description: doc.fields["description"] ?? "" }, doc.body));
    const prefix = `skills/${s.name}/`;
    for (const r of s.resources) {
      const translated = docs.get(r.path);
      files.set(skillFilePath(table, s.name, r.path.slice(prefix.length)), translated ? `${translated.body.replace(/\s+$/, "")}\n` : r.text);
    }
  }

  files.set(place(table, "plugin_manifest", "install/plugin.json"), canonicalJson(pluginManifest(input)));
  files.set(place(table, "config_file", "install/mcp.json"), canonicalJson(workspaceMcp(table, mode)));
  files.set(hooksFile, canonicalJson(template));
  files.set(TOOL_CLASSES_FILE, canonicalJson(classes));
  if (cliCopy !== null) files.set(cliCopy, input.source.cli!);
  files.set(place(table, "install_notes", "INSTALL.md"), notes);
  return { files, diagnostics };
};

/** Server names a JSON text declares under `servers` or `mcpServers`; null when it does not parse. */
function declaredIn(text: string): string[] | null {
  try {
    const doc = JSON.parse(text) as Record<string, unknown>;
    return ["servers", "mcpServers"].flatMap((k) => (doc[k] !== null && typeof doc[k] === "object" ? Object.keys(doc[k] as object) : []));
  } catch {
    return null;
  }
}

/**
 * TGT-LAYOUT-001 and TGT-MCP-001 on a generated Copilot package (C002-TS-301, C002-TS-302, C002-TS-327;
 * run by C002-T-035's checks): `files` holds the package's paths and contents as read from disk; the
 * expected layout is the one this emitter writes for `input`, plus the manifest. Each missing or extra
 * file is one finding (a `plugin.json`, `.mcp.json` or `hooks.json` at the root named as such); each server
 * missing from, or extra in, `install/mcp.json`, and each server any other JSON file of the package
 * declares, is one TGT-MCP-001 finding naming the file and the server.
 */
export function copilotPackageFindings(files: ReadonlyMap<string, PackageFile>, input: EmitInput): PackageFinding[] {
  const out: PackageFinding[] = [];
  const expected = emitCopilot(input);
  if (expected.diagnostics.length > 0) throw new Error(`the source does not generate: ${expected.diagnostics.map((d) => d.message).join("; ")}`);
  const want = new Set([...expected.files.keys(), MANIFEST]);
  const name = (p: string) => p.slice(p.lastIndexOf("/") + 1);
  for (const p of [...want].sort()) if (!files.has(p)) out.push({ code: "TGT-LAYOUT-001", file: p, message: `${p}: missing from the Copilot package (${name(p)})` });
  for (const p of [...files.keys()].sort()) {
    if (want.has(p)) continue;
    const why = (ROOT_FORBIDDEN as readonly string[]).includes(p)
      ? "must not be at the package root before the install (C002-IF-005 §3)"
      : "not part of the Copilot package contract";
    out.push({ code: "TGT-LAYOUT-001", file: p, message: `${p}: ${why} (${name(p)})` });
  }

  const configFile = place(input.table, "config_file", "install/mcp.json");
  const servers = declaredServers(input.table, input.mode);
  const text = files.get(configFile);
  if (text !== undefined) {
    let inServers: string[] | null = null;
    try {
      inServers = Object.keys(((JSON.parse(text.toString()) as { servers?: object }).servers ?? {}) as object);
    } catch (e) {
      out.push({ code: "TGT-MCP-001", file: configFile, message: `${configFile}: does not parse: ${e instanceof Error ? e.message : String(e)}` });
    }
    if (inServers !== null) {
      for (const s of servers) if (!inServers.includes(s)) out.push({ code: "TGT-MCP-001", file: configFile, message: `${configFile}: MCP server "${s}" of the mapping table is not declared` });
      for (const s of inServers.sort())
        if (!servers.includes(s)) out.push({ code: "TGT-MCP-001", file: configFile, message: `${configFile}: MCP server "${s}" is not a server of the mapping table in mode ${input.mode}` });
    }
  }
  // No other file of the package declares an MCP server (C002-REQ-307).
  for (const [p, content] of [...files].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) {
    if (p === configFile || p === MANIFEST || !p.endsWith(".json")) continue;
    for (const s of declaredIn(content.toString()) ?? [])
      out.push({ code: "TGT-MCP-001", file: p, message: `${p}: declares the MCP server "${s}"; only ${configFile} may declare servers` });
  }
  return out;
}

const byPath = ([a]: [string, unknown], [b]: [string, unknown]) => (a < b ? -1 : a > b ? 1 : 0);

/** The PreToolUse entries a parsed JSON hooks document declares (`hooks.PreToolUse` or a top-level `PreToolUse`). */
function preToolUseIn(doc: unknown): unknown[] | null {
  if (doc === null || typeof doc !== "object" || Array.isArray(doc)) return null;
  const d = doc as Record<string, unknown>;
  const hooks = d["hooks"] !== null && typeof d["hooks"] === "object" && !Array.isArray(d["hooks"]) ? (d["hooks"] as Record<string, unknown>) : {};
  const list = hooks["PreToolUse"] ?? d["PreToolUse"];
  return list === undefined ? null : Array.isArray(list) ? list : [list];
}

/** The commands of one hooks-file entry: its `command`, and those of nested Claude Code style `hooks`. */
function entryCommands(entry: unknown): string[] {
  if (entry === null || typeof entry !== "object") return [];
  const e = entry as Record<string, unknown>;
  const own = typeof e["command"] === "string" ? [e["command"]] : [];
  return [...own, ...(Array.isArray(e["hooks"]) ? e["hooks"].flatMap(entryCommands) : [])];
}

/**
 * TGT-HOOK-001 and TGT-CLASS-001 on a generated Copilot package (C002-IF-005 §6; C002-TS-303, C002-TS-304,
 * C002-TS-325, C002-TS-326, C002-TS-330 … C002-TS-332, C002-TS-355; run by C002-T-035's checks). A missing
 * template or classes file is TGT-LAYOUT-001's (copilotPackageFindings).
 */
export function copilotHookFindings(files: ReadonlyMap<string, PackageFile>, input: EmitInput): PackageFinding[] {
  const out: PackageFinding[] = [];
  const { table, mode, source } = input;
  const hooksFile = place(table, "hooks_file", "install/hooks.template.json");
  const hook = (file: string, message: string) => out.push({ code: "TGT-HOOK-001", file, message: `${file}: ${message}` });
  const agentsDir = `${place(table, "agents_dir", "agents")}/`;
  const agentFiles = [...files].filter(([p]) => p.startsWith(agentsDir) && p.endsWith(".agent.md")).sort(byPath);
  const base = (p: string) => p.slice(p.lastIndexOf("/") + 1);

  // The ten Architect agents, the conductor first, as the conductor's agents list names them.
  const conductorFile = agentFiles.find(([p]) => base(p) === `${CONDUCTOR}.agent.md`);
  const conductorAgents = conductorFile ? splitFrontmatter(conductorFile[1].toString()).data?.["agents"] : undefined;
  const ten = [CONDUCTOR, ...(Array.isArray(conductorAgents) ? conductorAgents.map(String) : source.agents.map((a) => a.name).filter((n) => n !== CONDUCTOR))];

  const template = files.get(hooksFile);
  if (template !== undefined) {
    let doc: unknown = null;
    try {
      doc = JSON.parse(template.toString());
    } catch (e) {
      hook(hooksFile, `does not parse: ${e instanceof Error ? e.message : String(e)}`);
    }
    const hooks = (doc as { hooks?: unknown } | null)?.hooks;
    if (doc !== null && (hooks === null || typeof hooks !== "object" || Array.isArray(hooks))) hook(hooksFile, `has no "hooks" object`);
    else if (doc !== null) {
      const events = hooks as Record<string, unknown>;
      for (const ev of Object.keys(events).sort()) if (!(HOOK_EVENTS as readonly string[]).includes(ev)) hook(hooksFile, `declares the event ${ev}; only ${HOOK_EVENTS.join(", ")}`);
      for (const ev of HOOK_EVENTS) if (!Array.isArray(events[ev]) || (events[ev] as unknown[]).length === 0) hook(hooksFile, `declares no ${ev} entry`);
      for (const ev of Object.keys(events).sort()) {
        const list = Array.isArray(events[ev]) ? (events[ev] as unknown[]) : [];
        for (const c of list.flatMap(entryCommands)) {
          if (!c.startsWith(cliCommand(""))) hook(hooksFile, `${ev} hook command "${c}" does not start with 'node "${CLI_COPY_TOKEN}" '`);
          for (const f of HOOK_FORBIDDEN) if (c.includes(f)) hook(hooksFile, `${ev} hook command "${c}" holds "${f}"; a hook command is node "${CLI_COPY_TOKEN}" with arguments only`);
        }
      }
      const pre = Array.isArray(events["PreToolUse"]) ? (events["PreToolUse"] as unknown[]) : [];
      const want = guardCommand(mode, ten);
      if (pre.length > 1) hook(hooksFile, `declares ${pre.length} PreToolUse entries; exactly one, "${want}"`);
      for (const c of pre.flatMap(entryCommands)) {
        if (c === want) continue;
        const opt = (name: string) => new RegExp(`(?:^| )--${name} (\\S+)`).exec(c)?.[1];
        const what = !c.includes(" hook guard --host copilot ") ? "is not the guard hook (hook guard --host copilot)" : opt("mode") !== mode ? `holds --mode ${String(opt("mode"))}, not the table's ${mode}` : opt("agents") !== ten.join(",") ? `holds --agents ${String(opt("agents"))}, not the ten Architect agents ${ten.join(",")}` : `is not "${want}"`;
        hook(hooksFile, `PreToolUse command "${c}" ${what}`);
      }
    }
  }
  // No other file of the package declares a PreToolUse hook; no agent frontmatter declares a hook.
  for (const [p, content] of [...files].sort(byPath)) {
    if (p === hooksFile || p === MANIFEST || !p.endsWith(".json")) continue;
    let doc: unknown;
    try {
      doc = JSON.parse(content.toString());
    } catch {
      continue; // a JSON file that does not parse declares nothing
    }
    if (preToolUseIn(doc) !== null) hook(p, `declares a PreToolUse hook; only ${hooksFile} may (C002-REQ-302)`);
  }
  for (const [p, content] of agentFiles) {
    const h = splitFrontmatter(content.toString()).data?.["hooks"];
    if (h !== undefined) hook(p, `agent frontmatter declares hooks (${h !== null && typeof h === "object" ? Object.keys(h).join(", ") : String(h)}); agent-scoped hooks do not run for subagent calls (PreToolUse belongs in ${hooksFile})`);
  }

  // TGT-CLASS-001: the tools offered to each specialist, by the tools list of its generated agent file.
  const classes = files.get(TOOL_CLASSES_FILE);
  if (classes !== undefined) {
    let doc: unknown = null;
    try {
      doc = JSON.parse(classes.toString());
    } catch (e) {
      out.push({ code: "TGT-CLASS-001", file: TOOL_CLASSES_FILE, message: `${TOOL_CLASSES_FILE}: does not parse: ${e instanceof Error ? e.message : String(e)}` });
    }
    if (doc !== null) {
      const offered = new Map<string, string[]>();
      for (const [p, content] of agentFiles) {
        if (base(p) === `${CONDUCTOR}.agent.md`) continue;
        const tools = splitFrontmatter(content.toString()).data?.["tools"];
        for (const t of offeredHookTools(table, mode, source, Array.isArray(tools) ? tools.map(String) : [])) offered.set(t, [...(offered.get(t) ?? []), base(p)]);
      }
      for (const m of classProblems(doc, offered, table, source)) out.push({ code: "TGT-CLASS-001", file: TOOL_CLASSES_FILE, message: `${TOOL_CLASSES_FILE}: ${m}` });
    }
  }
  return out;
}
