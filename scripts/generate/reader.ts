// Source reader (C002-COMP-001): loads the source plugin once into the neutral model. It only reads
// (readFileSync, readdirSync, statSync); no source file is ever opened for writing (C002-REQ-102,
// C002-INV-03). Frontmatter is split by the CLI's own parser (src/model/frontmatter.ts, C002-ADR-003).
// A file that cannot be read or whose frontmatter or JSON does not parse is ERR-GEN-007.
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { splitFrontmatter, toLines } from "../../src/model/frontmatter.ts";
import { diagnostic, type Diagnostic } from "./diagnostics.ts";
import type { SourceDoc, SourceFile, SourcePlugin, SourceSkill } from "./model.ts";

/** The parts of the plugin the generator reads; everything else (scripts/, templates/, …) is not input. */
const SOURCE_PARTS = [".claude-plugin", ".mcp.json", "agents", "commands", "hooks", "skills", "targets"] as const;

const byteOrder = (a: string, b: string) => Buffer.compare(Buffer.from(a, "utf8"), Buffer.from(b, "utf8"));
const sha256 = (text: string) => createHash("sha256").update(text, "utf8").digest("hex");
const reason = (e: unknown) => (e instanceof Error ? ((e as NodeJS.ErrnoException).code ?? e.message) : String(e));

/** `sha256:<hex>` over `<path>\t<sha256 of the LF text>\n` of every file, in byte order of path. */
export function sourceDigest(files: readonly SourceFile[]): string {
  const sorted = [...files].sort((a, b) => byteOrder(a.path, b.path));
  return `sha256:${sha256(sorted.map((f) => `${f.path}\t${sha256(f.text)}\n`).join(""))}`;
}

export interface ReadResult {
  source: SourcePlugin;
  diagnostics: Diagnostic[];
}

/** Reads the source plugin at `root` into the neutral model. */
export function readSource(root: string): ReadResult {
  const diagnostics: Diagnostic[] = [];
  const texts = new Map<string, string>();

  /** Relative paths of every file under `rel` (a file or a folder); [] when it does not exist. */
  const walk = (rel: string): string[] => {
    const abs = join(root, ...rel.split("/"));
    let isDir: boolean;
    try {
      isDir = statSync(abs).isDirectory();
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") return [];
      diagnostics.push(diagnostic("ERR-GEN-007", `${rel}: ${reason(e)}`, { file: rel }));
      return [];
    }
    if (!isDir) return [rel];
    try {
      return readdirSync(abs).flatMap((name) => walk(`${rel}/${name}`));
    } catch (e) {
      diagnostics.push(diagnostic("ERR-GEN-007", `${rel}: ${reason(e)}`, { file: rel }));
      return [];
    }
  };

  for (const rel of SOURCE_PARTS.flatMap(walk).sort(byteOrder)) {
    try {
      texts.set(rel, toLines(readFileSync(join(root, ...rel.split("/")), "utf8")).join("\n"));
    } catch (e) {
      diagnostics.push(diagnostic("ERR-GEN-007", `${rel}: ${reason(e)}`, { file: rel }));
    }
  }

  const doc = (path: string, name: string): SourceDoc => {
    const text = texts.get(path) ?? "";
    const split = splitFrontmatter(text);
    if (split.error !== undefined) diagnostics.push(diagnostic("ERR-GEN-007", `${path}: frontmatter does not parse: ${split.error}`, { file: path, line: 2 }));
    return { path, text, name, data: split.data, lines: split.lines, bodyStartLine: split.bodyStartLine };
  };
  const json = (path: string): unknown => {
    const text = texts.get(path);
    if (text === undefined) return null;
    try {
      return JSON.parse(text) as unknown;
    } catch (e) {
      diagnostics.push(diagnostic("ERR-GEN-007", `${path}: ${reason(e)}`, { file: path }));
      return null;
    }
  };
  const paths = [...texts.keys()];
  const markdownIn = (folder: string) => paths.filter((p) => p.startsWith(`${folder}/`) && p.endsWith(".md") && p.split("/").length === 2);

  const agents = markdownIn("agents").map((p) => doc(p, p.slice("agents/".length, -".md".length)));
  const commands = markdownIn("commands").map((p) => doc(p, p.slice("commands/".length, -".md".length)));
  const skills: SourceSkill[] = paths
    .filter((p) => /^skills\/[^/]+\/SKILL\.md$/.test(p))
    .map((p) => {
      const name = p.split("/")[1]!;
      const resources = paths.filter((r) => r.startsWith(`skills/${name}/`) && r !== p).map((r) => ({ path: r, text: texts.get(r)! }));
      return { name, doc: doc(p, name), resources };
    });
  const mcp = json(".mcp.json") as { mcpServers?: Record<string, unknown> } | null;
  const files = paths.map((path) => ({ path, text: texts.get(path)! }));

  return {
    source: {
      agents,
      commands,
      skills,
      hooks: json("hooks/hooks.json"),
      mcpServers: mcp?.mcpServers ?? {},
      files,
      digest: sourceDigest(files),
    },
    diagnostics,
  };
}
