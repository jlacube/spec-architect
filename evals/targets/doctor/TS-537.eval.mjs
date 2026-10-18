// C002-TC-537 — verifies C002-TS-537 (C002-AC-517.1, C002-REQ-517, C002-REQ-623; C002-T-010): the Serena
// step of the Claude Code doctor and init commands passes the bash guard on the real host. On cfg-full,
// with CLAUDE_PLUGIN_DATA set by no test step (the harness strips CLAUDE… variables from the child), the
// conductor runs the command; the transcript must hold its `serena-config` command line with no
// GUARD-BASH-001/002 denial, serena/serena_config.yml must exist under the session's plugin data folder,
// and the repository must hold no serena/ folder. Examples rows: doctor on a copy of fx-bootstrap, init
// in an empty git repository. The log line names the spelling Claude Code passed to the guard (the
// C002-TS-537 assumption of C002-IF-008 §1.1: substituted path or the literal resolved from the hook's
// environment). C002-T-038 adds the other doctor cases beside this file; C002-T-048 re-runs it.
import { cpSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { checker, toolCalls } from "../../harness/assert.mjs";
import { ROOT } from "../../harness/fixtures.mjs";
import { git } from "../../harness/workspaces.mjs";
import { doctorRun, PLUGIN_DATA_FOLDERS, pluginData } from "../../cap11/doctor.mjs";

/** Text of every tool result, by tool_use_id. */
function toolResults(transcript) {
  const out = new Map();
  for (const r of transcript) {
    if (r.type !== "sdk" || r.message.type !== "user") continue;
    const content = r.message.message?.content;
    if (!Array.isArray(content)) continue;
    for (const b of content) {
      if (b.type !== "tool_result") continue;
      const text = typeof b.content === "string" ? b.content : (b.content ?? []).map((c) => c.text ?? "").join("");
      out.set(b.tool_use_id, (out.get(b.tool_use_id) ?? "") + text);
    }
  }
  return out;
}

const clearConfig = () => {
  for (const data of PLUGIN_DATA_FOLDERS) rmSync(join(data, "serena", "serena_config.yml"), { force: true });
};

function assertSerenaStep(command) {
  return ({ transcript, root, auth }) => {
    const { failures, check } = checker();
    const data = pluginData(auth);
    const results = toolResults(transcript);
    const calls = toolCalls(transcript).filter((c) => (c.name === "Bash" || c.name === "PowerShell") && /serena-config/.test(String(c.input?.command ?? "")));
    // The command line of the plugin command is the serena-config step alone; a line the agent chains
    // with other commands (`…; ls`) is denied by the compound rule (GUARD-BASH-002) whatever its Serena
    // part, so it is logged but does not decide the case.
    const step = calls.filter((c) => /^\s*(sdd|node\s+("[^"]*sdd\.mjs"|\S*sdd\.mjs))\s+serena-config\s+("[^"]*"|\S+)\s*$/.test(String(c.input.command)));
    check(step.length > 0, `TS-537 ${command}: no serena-config command line of commands/${command}.md in the transcript`);
    for (const c of calls) {
      const line = String(c.input.command);
      const spelling = line.includes("${CLAUDE_PLUGIN_DATA}") ? "literal ${CLAUDE_PLUGIN_DATA}" : line.toLowerCase().split("\\").join("/").includes(data.toLowerCase().split("\\").join("/")) ? "substituted plugin data path" : "other";
      const result = results.get(c.id) ?? "";
      const own = step.includes(c);
      console.log(`TS-537 ${command}: ${own ? "step" : "chained"} ${c.name} ${JSON.stringify(line)} (${spelling}) → ${JSON.stringify(result.slice(0, 200))}`);
      if (own) check(!/GUARD-BASH-00[12]/.test(result), `TS-537 ${command}: the guard denied ${JSON.stringify(line)}: ${result.slice(0, 300)}`);
    }
    check(existsSync(join(data, "serena", "serena_config.yml")), `TS-537 ${command}: ${join(data, "serena", "serena_config.yml")} not written`);
    check(!existsSync(join(root, "serena")), `TS-537 ${command}: the repository holds a serena/ folder`);
    return failures;
  };
}

export default [
  {
    id: "TS-537-doctor",
    title: "Serena step of /architect:doctor passes the bash guard on Claude Code (TS-537, doctor)",
    ...doctorRun("cfg-full"),
    fixture: (root) => {
      clearConfig();
      // A copy of fx-bootstrap as the repository (this repository's workspace, metrics/ excluded).
      cpSync(join(ROOT, ".sdd"), join(root, ".sdd"), { recursive: true, filter: (src) => !src.includes(join(".sdd", "metrics")) });
      git(root, "init", "-q");
    },
    assert: assertSerenaStep("doctor"),
  },
  {
    id: "TS-537-init",
    title: "Serena step of /architect:init passes the bash guard on Claude Code (TS-537, init)",
    ...doctorRun("cfg-full", { prompt: "/architect:init", maxTurns: 12 }),
    fixture: (root) => {
      clearConfig();
      git(root, "init", "-q");
    },
    assert: assertSerenaStep("init"),
  },
];
