// Eval-only plugin overlay (C001-T-032): a temporary copy of plugins/architect in which every
// specialist agent that does not exist yet is replaced by a cheap stand-in (haiku). Conductor
// scenarios that dispatch specialists can then run before the specialists are written; a stand-in
// does the brief in minimal form and can return a scripted hand-back from the workspace
// (`.eval/handbacks/<agent-name>.md`). Real agent files are always kept.
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { ROOT } from "./fixtures.mjs";

export const SPECIALISTS = ["researcher", "cartographer", "options-analyst", "spec-writer", "test-designer", "architect", "planner", "critic", "auditor"].map((n) => `sdd-${n}`);

function stub(name) {
  return `---
name: ${name}
description: Evaluation stand-in for the ${name} specialist of the Architect suite. Dispatched only by the sdd-conductor.
tools: Read, Glob, Grep, Write, Edit
model: haiku
---

You are an evaluation stand-in for the ${name} specialist. Do the brief in minimal form:

1. If the file \`.eval/handbacks/${name}.md\` exists in the working directory, read it.
2. Write each output file the brief names (only under \`.sdd/\`): every heading or section the
   brief or its quality bar requires, each with short but complete and plausible content (one to
   three lines or a small table; for an options analysis: criteria with weights summing to 100,
   four candidates scored 1–5 with weighted totals, a recommendation and rejected candidates).
   Never write "placeholder" or "TBD". Follow every marker instruction of the brief exactly (for
   example, mark a statement with \`[ASSUMPTION: <question-id>]\` when told to).
3. Your final message: if step 1 found the file, its content verbatim; otherwise
   "Digest: done (stand-in). Written: <paths>".
`;
}

/**
 * Main-thread agent for specialist scenarios: specialists are subagents in real use, and only
 * subagents get their `skills` preloaded, so a scenario dispatches the specialist through this
 * relay (`architect:eval-dispatcher`) instead of starting it as the main agent. The prompt's first
 * line is `Dispatch: <agent name>`; the rest is the brief.
 */
const DISPATCHER = `---
name: eval-dispatcher
description: Evaluation relay. Dispatches one Architect specialist with a given brief and relays its hand-back.
tools: Agent(${SPECIALISTS.map((n) => `architect:${n}`).join(", ")})
model: haiku
---

You are an evaluation relay. The first line of the user's message is \`Dispatch: <name>\`. Call
the Agent tool once: \`subagent_type\` \`architect:<name>\`, \`run_in_background\` false, a short
description, and as \`prompt\` everything after the first line, verbatim. When it returns, reply
with its final message verbatim and nothing else.
`;

/** Prompt for the relay: dispatch `agent` (e.g. "sdd-researcher") with `brief`. */
export const dispatchPrompt = (agent, brief) => `Dispatch: ${agent}\n${brief}`;

/**
 * Serena home for eval sessions (created once, kept across runs so the language servers Serena
 * fetches on first use are downloaded once). Its config keeps project data out of the fixture
 * repository and disables the web dashboard, as the doctor does for users (C001-REQ-1013).
 */
export function evalSerenaHome() {
  const home = join(tmpdir(), "sdd-eval-serena-home");
  const config = join(home, "serena_config.yml");
  if (!existsSync(config) || !/^projects:/m.test(readFileSync(config, "utf8"))) {
    mkdirSync(home, { recursive: true });
    const projects = join(home, "projects").split("\\").join("/");
    // Start from the user's Serena config (Serena requires its full key set, e.g. `projects`) and
    // change only the dashboard, the project-data location and the registered projects.
    const user = join(homedir(), ".serena", "serena_config.yml");
    const base = existsSync(user) ? readFileSync(user, "utf8") : "projects: []\n";
    const text = base
      .replace(/^web_dashboard:.*$/m, "web_dashboard: false")
      .replace(/^web_dashboard_open_on_launch:.*$/m, "web_dashboard_open_on_launch: false")
      .replace(/^project_serena_folder_location:.*$/m, `project_serena_folder_location: "${projects}/$projectFolderName/.serena"`)
      // `projects:` and its list items (written at column 0 or indented) → an empty list.
      .replace(/^projects:.*\n(?:(?:-|\s).*(?:\n|$))*/m, "projects: []\n");
    writeFileSync(config, /^projects:/m.test(text) ? text : `${text}\nprojects: []\n`);
  }
  return home;
}

const cache = new Map();

function build(omitServers) {
  const key = omitServers.join(",");
  if (cache.has(key) && existsSync(cache.get(key))) return cache.get(key);
  const dir = join(mkdtempSync(join(tmpdir(), "sdd-eval-plugin-")), "architect");
  cpSync(join(ROOT, "plugins", "architect"), dir, { recursive: true });
  mkdirSync(join(dir, "agents"), { recursive: true });
  for (const name of SPECIALISTS) {
    const file = join(dir, "agents", `${name}.md`);
    if (!existsSync(file)) writeFileSync(file, stub(name));
  }
  writeFileSync(join(dir, "agents", "eval-dispatcher.md"), DISPATCHER);
  const mcp = join(dir, ".mcp.json");
  if (existsSync(mcp)) {
    const config = JSON.parse(readFileSync(mcp, "utf8"));
    for (const s of omitServers) delete config.mcpServers?.[s];
    // Serena's home for evals: persistent, outside the fixture repository (C001-IF-14 §4).
    if (config.mcpServers?.serena?.env) config.mcpServers.serena.env.SERENA_HOME = evalSerenaHome();
    writeFileSync(mcp, JSON.stringify(config, null, 2) + "\n");
  }
  cache.set(key, dir);
  return dir;
}

/** Path of the overlay plugin (built once per process). */
export function architectWithStubs() {
  return build([]);
}

/** A plugin-path function for an overlay without the named MCP servers (degraded-mode scenarios). */
export function architectWithout(...servers) {
  return () => build(servers);
}
