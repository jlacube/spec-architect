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
// (`install/hooks.template.json`) and the tool classes file (`hooks/tool-classes.json`) are C002-T-033's.
import { stringify } from "yaml";
import { diagnostic, type Diagnostic } from "../diagnostics.ts";
import type { EmitInput, EmitResult, PackageFile } from "../model.ts";
import { CLI_BUNDLE } from "../model.ts";
import type { MappingTable } from "../tables.ts";
import { scanText, translateBodies, type TranslatedDoc } from "../translate/constructs.ts";
import { agentFilePath, CONDUCTOR, translateAgents } from "../translate/frontmatter.ts";
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
  if (diagnostics.length > 0 || notes === null || conductor === undefined) return { files: new Map(), diagnostics };

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
