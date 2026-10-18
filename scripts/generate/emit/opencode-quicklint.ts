// OpenCode quick-lint plugin (C002-COMP-001, C002-COMP-003; C002-REQ-215, C002-IF-005 §2): after a
// `write` or `edit` call on a file under `.sdd/`, the plugin runs `sdd lint --quick --file <path>` and
// appends the findings to the tool result the agent sees (OpenCode `tool.execute.after`, which may set
// `output.output`: spike S-07 §6, `post_write_feedback_channel: true`). The format follows the Claude Code
// post-write hook (C001-IF-07 §4): a header line, at most 15 findings in the CLI human format, then
// `… <n> more: run sdd lint --quick --file <path>`; a clean file adds nothing. The path comes from the
// call's `filePath` argument, which `tool.execute.before` sees (`output.args`); the hook input names no
// agent (C002-R-001 C-06), so the feedback reaches every agent that writes under `.sdd/`, of which the
// Architect agents are the only ones the package lets write there. Best effort: a failed lint run adds
// nothing, and the write itself already happened.
//
// Emitted only under native permission enforcement and when the table sets `post_write_feedback`;
// under sdd MCP server enforcement the `sdd-files` write tools return the findings (C002-REQ-408).
import type { MappingTable, Mode } from "../tables.ts";

/** Package path of the plugin (C002-IF-005 §2). */
export const QUICK_LINT_PLUGIN = ".opencode/plugins/architect-quick-lint.js";

/** True when the package carries the quick-lint plugin (C002-REQ-215). */
export function emitsQuickLint(table: MappingTable, mode: Mode): boolean {
  return mode === "native-permissions" && table.post_write_feedback === true;
}

/** The plugin module's text: an ES module whose one export is the OpenCode plugin function. */
export function quickLintPlugin(): string {
  return `// Architect quick lint (generated; C002-REQ-215): after write or edit of a file under .sdd/, the
// findings of \`sdd lint --quick --file <path>\` are appended to the tool result.
import { spawnSync } from "node:child_process";
import { isAbsolute, relative, resolve, sep } from "node:path";

const MAX_FINDINGS = 15;
const RANK = { error: 0, warn: 1, info: 2 };
const WRITE_TOOLS = new Set(["write", "edit"]);
const WINDOWS = process.platform === "win32";

/** True when \`file\` lies under \`<directory>/.sdd/\` (any letter case on Windows). */
function underSdd(directory, file) {
  const rel = relative(directory, file).split(sep).join("/");
  if (rel === "" || rel.startsWith("../") || isAbsolute(rel)) return false;
  return (WINDOWS ? rel.toLowerCase() : rel).startsWith(".sdd/");
}

/** Finding lines of the quick lint, or null when the run failed. */
function quickLint(directory, file) {
  // npm installs sdd as sdd.cmd on Windows, which runs only through the shell; quote every word there.
  const args = ["lint", "--quick", "--file", file, "--quiet"];
  const run = spawnSync("sdd",WINDOWS ? args.map((a) => \`"\${a}"\`) : args, { cwd: directory, encoding: "utf8", shell: WINDOWS, windowsHide: true });
  if (run.error || typeof run.stdout !== "string" || (run.status !== 0 && run.status !== 1)) return null;
  const lines = run.stdout.split(/\\r?\\n/).filter((l) => l.trim() !== "");
  // Most severe first (C001-IF-07 §4): each finding line starts with its severity.
  const rank = (l) => RANK[l.split(" ")[0]] ?? 3;
  return lines.map((l, i) => [l, i]).sort((a, b) => rank(a[0]) - rank(b[0]) || a[1] - b[1]).map(([l]) => l);
}

export const ArchitectQuickLint = async ({ directory }) => {
  const paths = new Map();
  return {
    "tool.execute.before": async (input, output) => {
      const path = output?.args?.filePath;
      if (WRITE_TOOLS.has(input.tool) && typeof path === "string") paths.set(input.callID, path);
    },
    "tool.execute.after": async (input, output) => {
      const raw = paths.get(input.callID);
      paths.delete(input.callID);
      if (raw === undefined) return;
      const file = resolve(directory, raw);
      if (!underSdd(directory, file)) return;
      let lines;
      try {
        lines = quickLint(directory, file);
      } catch {
        return;
      }
      if (lines === null || lines.length === 0) return;
      const shown = lines.slice(0, MAX_FINDINGS);
      if (lines.length > MAX_FINDINGS) shown.push(\`… \${lines.length - MAX_FINDINGS} more: run sdd lint --quick --file \${raw}\`);
      const text = [\`sdd quick lint of \${raw}: \${lines.length} finding(s)\`, ...shown].join("\\n");
      output.output = \`\${output.output ?? ""}\\n\${text}\`;
    },
  };
};
`;
}
