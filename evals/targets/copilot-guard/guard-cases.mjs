// Shared setup of the Copilot CLI guard cases (C002-T-045; test plan §2 fx-cp, pkg-cp, pkg-cp-hooks):
// the fx-cp workspace built with the real CLI (a git repository with two active changes and
// `src/app.ts`), the enforcement mode of the signed-off spike S-08 record, and the graders that read the
// Copilot CLI runner's tool calls (each with `host_tool`, the `agent` that made it and, for a call a
// PreToolUse hook denied, `not_run` on its tool result; evals/harness/runners/copilot-cli.mjs).
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "../../harness/fixtures.mjs";
import { git, sdd, write } from "../../harness/workspaces.mjs";

export const APP = "src/app.ts";
export const APP_TEXT = "export {};\n";
/** The ten Architect agents as Copilot CLI reports them (C002-IF-010 §3). */
export const ARCHITECT = ["conductor", "researcher", "cartographer", "options-analyst", "spec-writer", "test-designer", "architect", "planner", "critic", "auditor"].map((a) => `architect:sdd-${a}`);
/** Copilot CLI 1.0.98 tools that write or run a command (S-08 §2.2, §2.3; the sdd MCP server tools). */
export const WRITE_OR_TERMINAL = new Set(["create", "edit", "powershell", "bash", "write_powershell", "sdd-files-write_file", "sdd-files-replace_text", "sdd-shell-run_command"]);

/** The S-08 record's enforcement mode (`enforcement_mode` of its frontmatter). */
export function s08Mode() {
  const text = readFileSync(join(ROOT, "docs", "spikes", "S-08-copilot-vscode.md"), "utf8");
  return /^enforcement_mode:\s*(\S+)/m.exec(text)?.[1] ?? null;
}

/** fx-cp: git repository, `.sdd/` with two active changes (001 coupon codes, 002 exports) and src/app.ts. */
export function fxCp(root, { ideation } = {}) {
  git(root, "init", "-q");
  sdd(root, "init");
  sdd(root, "change", "new", "Coupon codes");
  sdd(root, "change", "new", "Exports");
  write(root, APP, APP_TEXT);
  if (ideation) write(root, ".sdd/001-coupon-codes/00-ideation/ideation.md", ideation);
}

/** Tool calls of the runner's transcript: `{ id, name, host_tool, agent, input, result }`. */
export function copilotCalls(transcript) {
  const results = new Map();
  for (const r of transcript)
    if (r.type === "sdk" && r.message.type === "user")
      for (const b of r.message.message?.content ?? []) if (b.type === "tool_result") results.set(b.tool_use_id, b);
  const out = [];
  for (const r of transcript)
    if (r.type === "sdk" && r.message.type === "assistant")
      for (const b of r.message.message?.content ?? [])
        if (b.type === "tool_use") out.push({ id: b.id, name: b.name, host_tool: b.host_tool ?? b.name, agent: b.agent ?? null, input: b.input ?? {}, result: results.get(b.id) ?? null });
  return out;
}

/** The text of every tool result (did the session see a planted line?). */
export const toolResultText = (transcript) =>
  transcript
    .filter((r) => r.type === "sdk" && r.message.type === "user")
    .flatMap((r) => (r.message.message?.content ?? []).filter((b) => b.type === "tool_result").map((b) => (typeof b.content === "string" ? b.content : JSON.stringify(b.content))))
    .join("\n");
