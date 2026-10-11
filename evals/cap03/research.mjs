// Shared setup of the researcher scenarios (C001-TS-301 … 307, C001-TS-209): the researcher runs as a
// subagent (through the eval relay) on a full-profile change in ideation, with a brief like the
// conductor's.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { constitution } from "../cap02/drafting.mjs";
import { architectWithStubs, dispatchPrompt } from "../harness/overlay.mjs";
import { dispatches } from "../harness/assert.mjs";
import { edit, git, sdd } from "../harness/workspaces.mjs";

export const CHANGE = ".sdd/001-booking-service";
export const RESEARCH = `${CHANGE}/00-ideation/research`;

export const MCP = [
  "mcp__plugin_architect_context7__resolve-library-id",
  "mcp__plugin_architect_context7__query-docs",
  "mcp__plugin_architect_deepwiki__read_wiki_structure",
  "mcp__plugin_architect_deepwiki__read_wiki_contents",
  "mcp__plugin_architect_deepwiki__ask_wiki_question",
];

export function ideationWorkspace(root) {
  git(root, "init", "-q");
  sdd(root, "init");
  constitution(root, "approved");
  sdd(root, "change", "new", "Booking service");
  edit(root, `${CHANGE}/change.md`, (t) => t.replace(/^( {2}00-ideation: \{ status: )not-started/m, "$1draft"));
  sdd(root, "status", "--write");
}

/** A research brief for `question` (C001-REQ-214 fields). */
export function brief(question, extra = "") {
  return `Brief — researcher: one research question.
- Change: CHG-001 "Booking service" · profile full · kind greenfield
- Phase / step: 00-ideation · step 3 — Research and discovery
- Task: answer the question below for the booking service ideation. ${extra}
- Question: ${question}
- Inputs: none beyond the question.
- IDs to use: allocate the note number with \`sdd id next R --change 001\` if needed; the note is R-001.
- Outputs: \`${RESEARCH}/R-001-<slug>.md\` (research-note headings of the research-protocol skill).
- Quality bar: research-protocol, sdd-conventions.
- Return contract: digest (at most 15 lines), the note path, and a questions block only for what P-01 alone can decide.`;
}

/** Researcher tools plus Agent for the relay (subagent tool calls go through the same approval). */
export const RESEARCHER_TOOLS = ["Agent", "Write", "WebSearch", "WebFetch", "ToolSearch", ...MCP];

/**
 * The researcher runs as a subagent (as in real use, so its skills are preloaded), dispatched by
 * the eval relay with the brief verbatim.
 */
export const researcherRun = (question, extra) => ({
  agent: "architect:eval-dispatcher",
  plugins: [architectWithStubs],
  fixture: ideationWorkspace,
  allowTools: RESEARCHER_TOOLS,
  maxTurns: 30,
  prompt: dispatchPrompt("sdd-researcher", brief(question, extra)),
});

/**
 * Removes what Claude Code adds around a subagent's report in the Agent tool result: the
 * "[Subagent hand-back]" frame line, the `agentId:` line and the `<usage>…</usage>` block.
 */
export function unwrap(text) {
  return String(text)
    .replace(/<usage>[\s\S]*?<\/usage>/g, "")
    .split(/\r?\n/)
    .filter((l) => !/^\[Subagent hand-back\]/.test(l) && !/^agentId:\s/.test(l))
    .join("\n")
    .trim();
}

/** The researcher's hand-back: the result of the relay's Agent call (not the relay's own reply). */
export function handback(transcript) {
  const call = dispatches(transcript).find((d) => d.type.endsWith("sdd-researcher"));
  if (!call) return "";
  for (const r of transcript) {
    if (r.type !== "sdk" || r.message.type !== "user") continue;
    for (const b of r.message.message?.content ?? [])
      if (b.type === "tool_result" && b.tool_use_id === call.id) return unwrap(typeof b.content === "string" ? b.content : (b.content ?? []).filter((c) => c.type === "text").map((c) => c.text).join("\n"));
  }
  return "";
}

/** Text of the notes written under the research folder, keyed by file name. */
export function notes(root) {
  const dir = join(root, ...RESEARCH.split("/"));
  try {
    return Object.fromEntries(readdirSync(dir).filter((f) => f.endsWith(".md")).map((f) => [f, readFileSync(join(dir, f), "utf8")]));
  } catch {
    return {};
  }
}

/** The body of a `## <name>` section. */
export function section(text, name) {
  const m = new RegExp(`^## ${name}\\s*\\n([\\s\\S]*?)(?=^## |(?![\\s\\S]))`, "m").exec(text);
  return m ? m[1] : "";
}
