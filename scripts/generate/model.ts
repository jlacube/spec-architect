// The neutral model of the source plugin (C002-COMP-001, C002-REQ-102): what the source reader loads
// once, read-only, and every translator and emitter works from. It holds no host-specific form.
import type { MappingTable, Mode, Target } from "./tables.ts";
import type { Diagnostic } from "./diagnostics.ts";

/** One text file of the source plugin: path relative to the plugin folder (`/`-separated), LF text. */
export interface SourceFile {
  path: string;
  text: string;
}

/** A Markdown file with YAML frontmatter (agent, command, SKILL.md). */
export interface SourceDoc extends SourceFile {
  /** File name without `.md` (agents, commands) or the skill folder name (skills). */
  name: string;
  /** Parsed frontmatter mapping; null when the file has none. */
  data: Record<string, unknown> | null;
  /** All lines of the file (LF), so that diagnostics can name a line. */
  lines: string[];
  /** 1-based line of the first body line. */
  bodyStartLine: number;
}

export interface SourceSkill {
  name: string;
  /** `skills/<name>/SKILL.md`. */
  doc: SourceDoc;
  /** Every other file of the skill folder (references, schemas), sorted by path. */
  resources: SourceFile[];
}

export interface SourcePlugin {
  agents: SourceDoc[];
  commands: SourceDoc[];
  skills: SourceSkill[];
  /** Parsed `hooks/hooks.json`, or null when the plugin has none. */
  hooks: unknown;
  /** `mcpServers` of `.mcp.json` (empty when the plugin has none). */
  mcpServers: Record<string, unknown>;
  /** Every file the reader read, sorted by path in byte order; the input of `source_digest`. */
  files: SourceFile[];
  /** `sha256:<hex>` over the sorted file list and contents (C002-IF-004 manifest). */
  digest: string;
}

/** The enforcement modes each target has (C002-IF-001; ERR-GEN-009). */
export const TARGET_MODES: Record<Target, readonly Mode[]> = {
  opencode: ["native-permissions", "sdd-mcp-server"],
  copilot: ["sdd-mcp-server", "copilot-hooks"],
};

/** What an emitter is given for one target. */
export interface EmitInput {
  source: SourcePlugin;
  table: MappingTable;
  target: Target;
  mode: Mode;
  /**
   * The tables of every target of the run: a variant one of them declares names a wiring anchor required
   * for every target (C002-IF-001 §3 step 3). Absent: this table alone.
   */
  peers?: readonly MappingTable[];
}

/** An emitter's result: package-relative `/`-separated paths and their text, plus its diagnostics. */
export interface EmitResult {
  files: Map<string, string>;
  diagnostics: Diagnostic[];
}

export type Emitter = (input: EmitInput) => EmitResult;

/** One package ready for the writer. */
export interface TargetPackage {
  target: Target;
  mode: Mode;
  modeSource: "table" | "override";
  table: MappingTable;
  files: Map<string, string>;
}
