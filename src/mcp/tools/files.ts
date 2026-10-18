// The write tools of the `files` profile (C002-IF-002 §5.1; C002-REQ-401 … C002-REQ-404):
// `write_file` creates or replaces a whole file, `replace_text` replaces one exact span of an existing
// file. Each call is (1) validated against its input schema (ERR-MCP-001) before any guard or I/O call,
// (2) decided by the path guard core for an Architect agent with the memory folder off (GUARD-PATH-001;
// an exception is ERR-MCP-002), (3) for `replace_text` checked for exactly one occurrence of the span
// (ERR-MCP-004, ERR-MCP-005), (4) written atomically through a temporary file in the target folder
// and a rename (ERR-MCP-003: the temporary file is removed and the file keeps its previous content),
// and (5) quick-linted in process: the result carries the findings (C002-REQ-408), or
// `findings_unavailable` with WARN-MCP-001 when the lint fails; the write stands (C002-REQ-409).
import { existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { dirname } from "node:path";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { formatFinding } from "../../cli/output.ts";
import { decidePath, RULE } from "../../hooks/guard-path.ts";
import { MAX_FINDINGS } from "../../hooks/post-write.ts";
import { writeFileAtomic } from "../../io/atomic.ts";
import { normalisePath } from "../../io/paths.ts";
import { lintWorkspace } from "../../lint/engine.ts";
import { RULES } from "../../lint/rules/index.ts";
import { TOOL } from "../../version.ts";
import type { ToolContext, ToolHandler } from "../handlers.ts";
import { errorResult } from "../results.ts";
import type { ToolName } from "../schemas.ts";

/** The caller identity the server presents to the path guard core (C002-IF-002 §5.1 step 2). */
export const AGENT_TYPE = "architect:sdd-mcp-server";

type WriteTool = Extract<ToolName, "write_file" | "replace_text">;

function reason(e: unknown): string {
  const cause = e instanceof Error && e.cause !== undefined ? e.cause : e;
  return cause instanceof Error ? cause.message : String(cause);
}

/** Test fault (C002-TS-402): `SDD_TEST_FAULT=mcp-guard-throw` makes the path guard core throw. */
function guardFault(): boolean {
  return /(?:^|,)mcp-guard-throw(?:,|$)/.test(process.env["SDD_TEST_FAULT"] ?? "");
}

/** Test fault (C002-TS-413): `SDD_TEST_FAULT=mcp-lint-throw` makes the quick-lint check throw. */
function lintFault(): boolean {
  return /(?:^|,)mcp-lint-throw(?:,|$)/.test(process.env["SDD_TEST_FAULT"] ?? "");
}

const RANK: Record<string, number> = { error: 0, warn: 1, info: 2 };

type Lint ={ findings: { total: number; lines: string[] } } | { findings_unavailable: { code: "WARN-MCP-001"; reason: string } };

/**
 * Step 5 of §5.1: the quick lint of the written file in process, with the rules loaded once per process
 * (C002-REQ-408). The findings follow C001-IF-07 §4: at most 15, errors before warnings before info, in
 * the CLI human format, then a "… <n> more" line. Any fault leaves the write in place and gives
 * WARN-MCP-001 (C002-REQ-409).
 */
function quickLint(tool: WriteTool, path: string, ctx: ToolContext): Lint {
  try {
    if (lintFault()) throw new Error("SDD_TEST_FAULT: quick-lint failure");
    const findings = lintWorkspace(ctx.root, { file: path, cwd: ctx.root, rules: RULES, tool: TOOL, phase: null }).findings;
    const sorted = [...findings].sort((a, b) => (RANK[a.severity] ?? 3) - (RANK[b.severity] ?? 3));
    const lines = sorted.slice(0, MAX_FINDINGS).map(formatFinding);
    if (sorted.length > MAX_FINDINGS) lines.push(`… ${sorted.length - MAX_FINDINGS} more: run sdd lint --quick --file ${path}`);
    ctx.debug("quick-lint", { tool, path, findings: findings.length });
    return { findings: { total: findings.length, lines } };
  } catch (e) {
    ctx.debug("quick-lint", { tool, path, code: "WARN-MCP-001", reason: reason(e) });
    return { findings_unavailable: { code: "WARN-MCP-001", reason: `the quick-lint check failed: ${reason(e)}` } };
  }
}

function success(tool: WriteTool, path: string, bytes: number, extra: Record<string, unknown>, ctx: ToolContext): CallToolResult {
  const lint = quickLint(tool, path, ctx);
  const block =
    "findings" in lint
      ? [`sdd quick lint of ${path}: ${lint.findings.total} finding(s)`, ...lint.findings.lines].join("\n")
      : `quick-lint findings unavailable: ${lint.findings_unavailable.reason}`;
  const text = `wrote ${path} (${bytes} bytes)\n${block}`;
  return { content: [{ type: "text", text }], structuredContent: { status: "written", tool, path, bytes, ...extra, ...lint } };
}

/**
 * Steps 1 and 2 of §5.1: argument validation, then the guard decision. Returns the normalised absolute
 * target, or the error result that ends the call.
 */
function admit(tool: WriteTool, args: Record<string, unknown>, ctx: ToolContext): { path: string } | { error: CallToolResult } {
  const problems = ctx.schemas.validateInput(tool, args);
  if (problems.length > 0) {
    ctx.debug("invalid-arguments", { tool, code: "ERR-MCP-001" });
    return { error: errorResult(tool, "failed", "ERR-MCP-001", `invalid arguments for ${tool}: ${problems.join("; ")}`) };
  }
  const raw = args["path"] as string;
  const path = normalisePath(raw, { cwd: ctx.root });
  let decision: ReturnType<typeof decidePath>;
  try {
    if (guardFault()) throw new Error("SDD_TEST_FAULT: path guard core failure");
    decision = decidePath(
      { hook_event_name: "PreToolUse", tool_name: "Write", tool_input: { file_path: raw }, cwd: ctx.root, agent_type: AGENT_TYPE },
      { memoryFolder: false },
    );
  } catch (e) {
    ctx.debug("guard-path", { tool, path, code: "ERR-MCP-002", reason: reason(e) });
    return { error: errorResult(tool, "failed", "ERR-MCP-002", `internal fault in ${tool}: the path guard core failed: ${reason(e)}; the call was refused`, { path }) };
  }
  if (!decision.allow) {
    ctx.debug("guard-path", { tool, path, decision: "deny", code: RULE });
    return { error: errorResult(tool, "refused", RULE, decision.message, { path }) };
  }
  ctx.debug("guard-path", { tool, path, decision: "allow" });
  return { path };
}

/** Step 4 of §5.1: missing parent folders, then the temporary file and the rename; null on success. */
function writeAtomic(tool: WriteTool, path: string, bytes: Uint8Array, ctx: ToolContext): CallToolResult | null {
  try {
    mkdirSync(dirname(path), { recursive: true });
    writeFileAtomic(path, bytes);
    return null;
  } catch (e) {
    ctx.debug("write-failed", { tool, path, code: "ERR-MCP-003", reason: reason(e) });
    return errorResult(tool, "failed", "ERR-MCP-003", `could not write ${path}: ${reason(e)}; previous content kept`, { path });
  }
}

function isFile(path: string): boolean {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

/** Number of (possibly overlapping) occurrences of `needle` in `hay`: a span is unique only when it is 1. */
function occurrences(hay: Buffer, needle: Buffer): number {
  let n = 0;
  for (let i = hay.indexOf(needle); i >= 0; i = hay.indexOf(needle, i + 1)) n++;
  return n;
}

/** Wraps a handler so that any unexpected exception is ERR-MCP-002 and nothing is reported as written. */
function guarded(tool: WriteTool, fn: ToolHandler): ToolHandler {
  return async (args, ctx) => {
    try {
      return await fn(args, ctx);
    } catch (e) {
      ctx.debug("internal-fault", { tool, code: "ERR-MCP-002", reason: reason(e) });
      return errorResult(tool, "failed", "ERR-MCP-002", `internal fault in ${tool}: ${reason(e)}; the call was refused`);
    }
  };
}

export const writeFile: ToolHandler = guarded("write_file", async (args, ctx) => {
  const admitted = admit("write_file", args, ctx);
  if ("error" in admitted) return admitted.error;
  const { path } = admitted;
  // UTF-8 without BOM, line endings unchanged (sdd-mcp-tools.schema.json, writeFileInput.content).
  const bytes = Buffer.from((args["content"] as string).replace(/^﻿/, ""), "utf8");
  const created = !existsSync(path);
  const failed = writeAtomic("write_file", path, bytes, ctx);
  if (failed) return failed;
  return success("write_file", path, bytes.length, { created }, ctx);
});

export const replaceText: ToolHandler = guarded("replace_text", async (args, ctx) => {
  const admitted = admit("replace_text", args, ctx);
  if ("error" in admitted) return admitted.error;
  const { path } = admitted;
  if (!isFile(path)) {
    ctx.debug("replace-missing", { tool: "replace_text", path, code: "ERR-MCP-005" });
    return errorResult("replace_text", "refused", "ERR-MCP-005", `${path} does not exist; replace_text edits existing files`, { path });
  }
  let before: Buffer;
  try {
    before = readFileSync(path);
  } catch (e) {
    return errorResult("replace_text", "failed", "ERR-MCP-003", `could not write ${path}: ${reason(e)}; previous content kept`, { path });
  }
  // The span is matched on the file's bytes, so every byte outside it is kept as it is.
  const old = Buffer.from(args["old_text"] as string, "utf8");
  const n = occurrences(before, old);
  if (n !== 1) {
    ctx.debug("replace-span", { tool: "replace_text", path, occurrences: n, code: "ERR-MCP-004" });
    return errorResult("replace_text", "refused", "ERR-MCP-004", `the text to replace occurs ${n} times in ${path}; it must occur exactly once`, { path, occurrences: n });
  }
  const at = before.indexOf(old);
  const after = Buffer.concat([before.subarray(0, at), Buffer.from(args["new_text"] as string, "utf8"), before.subarray(at + old.length)]);
  const failed = writeAtomic("replace_text", path, after, ctx);
  if (failed) return failed;
  return success("replace_text", path, after.length, { occurrences: 1 }, ctx);
});
