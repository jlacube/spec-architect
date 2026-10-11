// Shared setup of the options-analyst scenarios (C001-TS-309, 312): the analyst runs as a subagent
// through the eval relay on a full-profile change in ideation.
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { architectWithStubs, dispatchPrompt } from "../harness/overlay.mjs";
import { CLI } from "../harness/workspaces.mjs";
import { CHANGE, ideationWorkspace } from "./research.mjs";

export const OPTIONS = `${CHANGE}/00-ideation/options`;

export function analysisBrief(decision, extra = "") {
  return `Brief — options-analyst: one decision.
- Change: CHG-001 "Booking service" (clinic patients book, move and cancel appointments online) · profile full · kind greenfield
- Phase / step: 00-ideation · step 5 — Decide
- Task: analyse the decision below. ${extra}
- Decision: ${decision}
- Inputs: none beyond this brief.
- IDs to use: the analysis is C001-OA-001.
- Outputs: \`${OPTIONS}/OA-001-<slug>.md\` (headings of the options-analysis skill).
- Quality bar: options-analysis, sdd-conventions.
- Return contract: digest (at most 15 lines), the OA path, and a questions block only for what P-01 alone can decide.`;
}

export const analystRun = (decision, extra) => ({
  agent: "architect:eval-dispatcher",
  plugins: [architectWithStubs],
  fixture: ideationWorkspace,
  allowTools: ["Agent", "Write", "WebSearch", "WebFetch"],
  maxTurns: 24,
  prompt: dispatchPrompt("sdd-options-analyst", analysisBrief(decision, extra)),
});

/** The OA files written: `{ name: text }`. */
export function analyses(root) {
  const dir = join(root, ...OPTIONS.split("/"));
  try {
    return Object.fromEntries(readdirSync(dir).filter((f) => /^OA-.*\.md$/.test(f)).map((f) => [f, readFileSync(join(dir, f), "utf8")]));
  } catch {
    return {};
  }
}

/** Lint findings (JSON) of change 001 for one rule code. */
export function lintFindings(root, code) {
  let out;
  try {
    out = execFileSync(process.execPath, [CLI, "lint", "001", "--json"], { cwd: root, encoding: "utf8" });
  } catch (e) {
    out = e.stdout ?? "";
  }
  return (JSON.parse(out || "{}").findings ?? []).filter((f) => f.code === code);
}

/** Rows of the first Markdown table in `text`: arrays of trimmed cells (header and separator excluded). */
export function tableRows(text) {
  const lines = text.split(/\r?\n/).filter((l) => /^\s*\|/.test(l));
  return lines.slice(2).map((l) => l.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim()));
}

export function section(text, name) {
  const m = new RegExp(`^## ${name}\\s*\\n([\\s\\S]*?)(?=^## |(?![\\s\\S]))`, "m").exec(text);
  return m ? m[1] : "";
}
