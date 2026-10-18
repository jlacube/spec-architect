// OpenCode emitter (C002-COMP-001, C002-COMP-003; C002-IF-001 §3 step 9, C002-IF-005 §2): writes the files
// of `dist/opencode/` from the translated model. Ten agents under `placement.agents_dir`, the conductor
// primary and the nine specialists subagents (C002-REQ-201, C002-REQ-202); 13 commands named after
// `placement.command_file` (`architect-<name>.md`, C002-REQ-216) and bound to the conductor
// (C002-REQ-203); one skill folder per source skill with its resources; `opencode.json` with the MCP
// servers of the table for the mode, Serena launched read-only on per-user data (C002-REQ-114), the
// top-level `tools` entry that switches the Architect servers off for every other agent, and one
// `agent` entry per Architect agent whose `tools` map starts with the catch-all `"*": false`
// (C002-IF-001 §6.1, closed tool set); `INSTALL.md` from `targets/opencode/install.md` with the tokens of
// C002-IF-001 §4 resolved (C002-REQ-204). Every field comes from the mapping table. The `permission`
// block of each agent entry holds the agent-start rule `task` (C002-REQ-107) and the rules of
// ./opencode-permissions.ts (`edit`, `bash`, `question`, …; C002-REQ-206 … C002-REQ-209, C002-REQ-217);
// the quick-lint plugin of ./opencode-quicklint.ts is written under native permission enforcement when
// the table sets `post_write_feedback` (C002-REQ-215).
import { stringify } from "yaml";
import { diagnostic, type Diagnostic } from "../diagnostics.ts";
import type { EmitInput, EmitResult } from "../model.ts";
import type { MappingTable, Mode } from "../tables.ts";
import { scanText, translateBodies, type TranslatedDoc } from "../translate/constructs.ts";
import { agentFilePath, CONDUCTOR, translateAgents, type TranslatedAgent } from "../translate/frontmatter.ts";
import { inlineSkills } from "../translate/inline.ts";
import { tokenValues, variantLines } from "../translate/wiring.ts";
import { canonicalJson, MANIFEST } from "../writer.ts";
import { agentPermission, permissionTableDiagnostics } from "./opencode-permissions.ts";
import { emitsQuickLint, QUICK_LINT_PLUGIN, quickLintPlugin } from "./opencode-quicklint.ts";

/** Source of the install notes inside the source plugin (C002-IF-005 §5). */
export const INSTALL_SOURCE = "targets/opencode/install.md";
const CONFIG_SCHEMA = "https://opencode.ai/config.json";

const place = (table: MappingTable, key: string, fallback: string) => table.placement[key] ?? fallback;
const join = (dir: string, name: string) => (dir === "" ? name : `${dir}/${name}`);

/** Package path of a command file (`.opencode/commands/architect-<name>.md`). */
export function commandFilePath(table: MappingTable, name: string): string {
  return join(place(table, "commands_dir", ""), place(table, "command_file", "{name}.md").replaceAll("{name}", name));
}

/** Package path of a file of a skill folder (`.opencode/skills/<skill>/<rest>`). */
export function skillFilePath(table: MappingTable, skill: string, rest: string): string {
  return join(place(table, "skills_dir", ""), `${skill}/${rest}`);
}

/** A Markdown file with YAML frontmatter (keys in the order given), one blank line, the body; LF, final newline. */
function markdown(front: Record<string, unknown>, body: string): string {
  const yaml = stringify(front, { lineWidth: 0 });
  return `---\n${yaml}---\n\n${body.replace(/^(?:[ \t]*\n)+/, "").replace(/\s+$/, "")}\n`;
}

/** One `mcp` entry of `opencode.json` from a table server (`remote` for http, `local` for stdio). */
function mcpEntry(server: MappingTable["mcp_servers"][string]): Record<string, unknown> {
  if (server.transport === "http") return { type: "remote", url: server.url };
  const entry: Record<string, unknown> = { type: "local", command: [server.command, ...(server.args ?? [])] };
  if (server.env && Object.keys(server.env).length > 0) entry["environment"] = server.env;
  return entry;
}

/** The MCP servers the table declares for a mode, by name. */
export function declaredServers(table: MappingTable, mode: Mode): string[] {
  return Object.keys(table.mcp_servers)
    .filter((n) => table.mcp_servers[n]!.modes.includes(mode))
    .sort();
}

/** The `opencode.json` object of the package (C002-IF-005 §2). */
export function openCodeConfig(table: MappingTable, mode: Mode, agents: readonly TranslatedAgent[]): Record<string, unknown> {
  const servers = declaredServers(table, mode);
  const agent: Record<string, unknown> = {};
  for (const a of agents) {
    const tools: Record<string, boolean> = { "*": false };
    for (const t of a.frontmatter.tools) tools[t] = true;
    agent[a.frontmatter.name] = { tools, permission: agentPermission(table, mode, a) };
  }
  return {
    $schema: CONFIG_SCHEMA,
    mcp: Object.fromEntries(servers.map((n) => [n, mcpEntry(table.mcp_servers[n]!)])),
    tools: Object.fromEntries(servers.map((n) => [`${n}*`, false])),
    agent,
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

/** Writes the OpenCode target package (C002-IF-005 §2) from the translated model. */
export const emitOpenCode = (input: EmitInput): EmitResult => {
  const { table, mode, target } = input;
  const front = translateAgents(input);
  const bodies = translateBodies(input);
  const inlined = inlineSkills(input.source, bodies.docs, target);
  const diagnostics: Diagnostic[] = [...front.diagnostics, ...bodies.diagnostics, ...inlined.diagnostics, ...permissionTableDiagnostics(table, mode)];
  const notes = installNotes(input, diagnostics);

  // Step 8 on the configuration: the server commands, arguments and URLs are `mcp-config` text.
  const tableFile = `targets/${target}.json`;
  for (const n of declaredServers(table, mode)) {
    const s = table.mcp_servers[n]!;
    const text = [s.command ?? "", ...(s.args ?? []), s.url ?? "", ...Object.values(s.env ?? {})].join("\n");
    diagnostics.push(...scanText(table, target, mode, tableFile, text, "mcp-config"));
  }
  if (diagnostics.length > 0 || notes === null) return { files: new Map(), diagnostics };

  const docs = new Map<string, TranslatedDoc>(bodies.docs.map((d) => [d.path, d]));
  const bodyOf = new Map(inlined.agents.map((a) => [a.path, a.body]));
  const files = new Map<string, string>();

  // Agents: description (references translated), the mode flag, the tier's model; body with the inlined skills.
  for (const a of front.agents) {
    const fm = a.frontmatter;
    const fields: Record<string, unknown> = { description: docs.get(a.path)?.fields["description"] ?? fm.description };
    for (const [k, v] of Object.entries(fm.fields)) fields[k] = v;
    fields["model"] = fm.model;
    files.set(agentFilePath(table, fm.name), markdown(fields, bodyOf.get(a.path) ?? docs.get(a.path)?.body ?? ""));
  }

  // Commands: `architect-<name>.md`, bound to the conductor; the guard line is gone (construct `guard-line`).
  for (const c of input.source.commands) {
    const doc = docs.get(c.path)!;
    const hint = (doc.fields["argument-hint"] ?? "").trim();
    const description = (doc.fields["description"] ?? "") + (hint === "" ? "" : ` Arguments: ${hint}`);
    files.set(commandFilePath(table, c.name), markdown({ description, agent: CONDUCTOR }, doc.body));
  }

  // Skills: SKILL.md with its translated name and description, and every resource of the folder.
  for (const s of input.source.skills) {
    const doc = docs.get(s.doc.path)!;
    files.set(skillFilePath(table, s.name, "SKILL.md"), markdown({ name: doc.fields["name"] ?? s.name, description: doc.fields["description"] ?? "" }, doc.body));
    const prefix = `skills/${s.name}/`;
    for (const r of s.resources) {
      const translated = docs.get(r.path);
      files.set(skillFilePath(table, s.name, r.path.slice(prefix.length)), translated ? `${translated.body.replace(/\s+$/, "")}\n` : r.text);
    }
  }

  files.set(place(table, "config_file", "opencode.json"), canonicalJson(openCodeConfig(table, mode, front.agents)));
  if (emitsQuickLint(table, mode)) files.set(QUICK_LINT_PLUGIN, quickLintPlugin());
  files.set(place(table, "install_notes", "INSTALL.md"), notes);
  return { files, diagnostics };
};

/** One target structure finding on an OpenCode package (C002-IF-005 §6; run by C002-T-035's checks). */
export interface PackageFinding {
  code: "TGT-LAYOUT-001" | "TGT-MCP-001";
  file: string;
  message: string;
}

/**
 * TGT-LAYOUT-001 and TGT-MCP-001 on a generated OpenCode package (C002-TS-202, C002-TS-227): `files` holds
 * the package's paths and texts as read from disk; the expected layout is the one this emitter writes
 * for `input`, plus the manifest. Each missing or extra file and each server missing from, or extra
 * in, `opencode.json` is one finding naming the file and the server.
 */
export function openCodePackageFindings(files: ReadonlyMap<string, string>, input: EmitInput): PackageFinding[] {
  const out: PackageFinding[] = [];
  const expected = emitOpenCode(input);
  if (expected.diagnostics.length > 0) throw new Error(`the source does not generate: ${expected.diagnostics.map((d) => d.message).join("; ")}`);
  const want = new Set([...expected.files.keys(), MANIFEST]);
  const name = (p: string) => p.slice(p.lastIndexOf("/") + 1);
  for (const p of [...want].sort()) if (!files.has(p)) out.push({ code: "TGT-LAYOUT-001", file: p, message: `${p}: missing from the OpenCode package (${name(p)})` });
  for (const p of [...files.keys()].sort())
    if (!want.has(p)) out.push({ code: "TGT-LAYOUT-001", file: p, message: `${p}: not part of the OpenCode package contract (${name(p)})` });

  const configFile = place(input.table, "config_file", "opencode.json");
  const text = files.get(configFile);
  if (text !== undefined) {
    let mcp: Record<string, unknown> = {};
    try {
      mcp = ((JSON.parse(text) as { mcp?: Record<string, unknown> }).mcp ?? {}) as Record<string, unknown>;
    } catch (e) {
      out.push({ code: "TGT-MCP-001", file: configFile, message: `${configFile}: does not parse: ${e instanceof Error ? e.message : String(e)}` });
      return out;
    }
    const servers = declaredServers(input.table, input.mode);
    for (const s of servers) if (!(s in mcp)) out.push({ code: "TGT-MCP-001", file: configFile, message: `${configFile}: MCP server "${s}" of the mapping table is not declared` });
    for (const s of Object.keys(mcp).sort())
      if (!servers.includes(s)) out.push({ code: "TGT-MCP-001", file: configFile, message: `${configFile}: MCP server "${s}" is not a server of the mapping table in mode ${input.mode}` });
  }
  return out;
}
