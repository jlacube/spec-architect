// `sdd guard-path` (C001-IF-07 §2, C001-REQ-1103, C001-REQ-1104): the PreToolUse hook on Write, Edit and
// NotebookEdit. An Architect agent (`agent_type` = `architect:sdd-*`, spike S-04) may write only below
// the `.sdd/` folder of the repository in `cwd` or its own memory folder
// `.claude/agent-memory/architect-<agent>/` (D-007); every other caller is allowed at once.
//
// A target is allowed only when all three readings of it lie below the same allowed folder:
// - lexical: `..`, separators, case (Windows), drive letter and `\\?\` normalised (normalisePath);
// - real: the longest existing prefix resolved through the file system (links, junctions, 8.3 names);
// - physical: `..` applied after following links, as POSIX does.
// The allowed folder must not be (or lie behind) a link, nor the target be an existing hard-linked file.
// Ambiguous Windows names (trailing dot or space, colons, device names, drive-relative paths) are denied. When in doubt the guard denies (fail closed).
import { statSync } from "node:fs";
import { ambiguousWindowsPath, normalisePath, pathKey, physicalPath, realPath } from "../io/paths.ts";
import { findWorkspace } from "../workspace/find.ts";
import { isArchitectAgent, type HookInput } from "./input.ts";

export const RULE = "GUARD-PATH-001";
const WRITE_TOOLS = new Set(["Write", "Edit", "MultiEdit", "NotebookEdit"]);

export type PathDecision = { allow: true } | { allow: false; message: string };

/** True when `target` lies strictly below `dir` (both normalised; Windows keys case-folded). */
function below(dir: string, target: string): boolean {
  const d = pathKey(dir);
  return pathKey(target).startsWith(d.endsWith("/") ? d : d + "/");
}

/** Hard-link count of an existing file; 0 when the path does not exist or is not a file. */
function hardLinkCount(p: string): number {
  try {
    const s = statSync(p);
    return s.isFile() ? s.nlink : 0;
  } catch {
    return 0;
  }
}

function deny(tool: string, target: string, reason: string, allowed: string[]): PathDecision {
  return {
    allow: false,
    message: `${RULE}: ${tool} on ${target} denied — ${reason}. Allowed: files under ${allowed.map((a) => a + "/").join(" and ")} (Architect agents write only inside .sdd/ and their own memory folder).`,
  };
}

export function decidePath(input: HookInput | null): PathDecision {
  if (input === null) return deny("tool call", "(unknown target)", "the hook input is not a JSON object", [".sdd"]);
  if (!isArchitectAgent(input)) return { allow: true };
  const tool = typeof input.tool_name === "string" ? input.tool_name : "tool call";
  if (!WRITE_TOOLS.has(tool)) return { allow: true };
  const cwd = input.cwd;
  if (typeof cwd !== "string" || cwd === "") return deny(tool, "(unknown target)", "the hook input has no cwd", [".sdd"]);
  // The repository is the first folder with `.sdd/` from `cwd` upward (a Bash `cd` may move `cwd`).
  const repo = normalisePath(findWorkspace(normalisePath(cwd)) ?? cwd);
  // The two allowed folders, relative to the repository: `.sdd` and the caller's own memory folder,
  // where Claude Code saves `memory: project` (`architect:sdd-x` → `.claude/agent-memory/architect-sdd-x`).
  const rels = [".sdd", `.claude/agent-memory/${input.agent_type!.replace(":", "-")}`];
  const allowed = rels.map((r) => normalisePath(r, { cwd: repo }));
  const ti = input.tool_input ?? {};
  const raw = typeof ti["file_path"] === "string" ? ti["file_path"] : ti["notebook_path"];
  if (typeof raw !== "string" || raw.trim() === "") return deny(tool, "(no path)", "the tool input names no file", allowed);
  if (raw.includes("\0")) return deny(tool, JSON.stringify(raw), "the path contains a NUL character", allowed);
  const ambiguous = ambiguousWindowsPath(raw);
  if (ambiguous) return deny(tool, raw, `ambiguous path (${ambiguous})`, allowed);

  const lexical = normalisePath(raw, { cwd });
  const i = allowed.findIndex((a) => below(a, lexical));
  if (i < 0) return deny(tool, lexical, "the path is outside .sdd/", allowed);
  const name = rels[i]!;
  // The allowed folder must be the folder itself, not a link (or a path through a link) to elsewhere.
  const realRoot = realPath(allowed[i]!);
  if (pathKey(realRoot) !== pathKey(normalisePath(name, { cwd: realPath(repo) }))) {
    return deny(tool, lexical, `${name}/ is (or lies behind) a link to ${realRoot}`, allowed);
  }
  const real = realPath(lexical);
  if (!below(realRoot, real)) return deny(tool, lexical, `the path resolves to ${real}, outside ${name}/`, allowed);
  const physical = physicalPath(raw, cwd);
  if (!below(realRoot, physical)) return deny(tool, lexical, `the path resolves to ${physical}, outside ${name}/`, allowed);
  // A hard link shares its content with a file that may lie outside the allowed folder.
  const links = hardLinkCount(real);
  if (links > 1) return deny(tool, lexical, `the file has ${links} hard links and may be shared with a file outside ${name}/`, allowed);
  return { allow: true };
}
