// S-07 throwaway probe plugin (copied to <workspace>/.opencode/plugins/probe.js). Never shipped.
// - registers a plugin tool `plugin_tool` (agent_tools_closed: must stay unavailable to a closed agent)
// - tool.execute.after: appends a marker to the output of edit/write (post_write_feedback_channel)
// - logs tool.execute.before inputs (agent identity check, C002-R-001 C-06)
import fs from "node:fs";
import { tool } from "@opencode-ai/plugin";

const LOG = process.env.S07_PLUGIN_LOG ?? "plugin.jsonl";
const log = (e) => fs.appendFileSync(LOG, JSON.stringify({ t: new Date().toISOString(), ...e }) + "\n");

export const ProbePlugin = async () => ({
  tool: {
    plugin_tool: tool({
      description: "Probe plugin tool",
      args: { q: tool.schema.string().optional() },
      async execute(args) {
        log({ kind: "PLUGIN_TOOL_CALLED", args });
        return "plugin tool ran";
      },
    }),
  },
  "tool.execute.before": async (input, output) => {
    log({ kind: "before", input, args: output.args });
  },
  "tool.execute.after": async (input, output) => {
    log({ kind: "after", tool: input.tool, sessionID: input.sessionID });
    if (input.tool === "edit" || input.tool === "write") {
      output.output = `${output.output ?? ""}\nS07-POST-WRITE-FEEDBACK: lint says 0 findings`;
    }
  },
});
