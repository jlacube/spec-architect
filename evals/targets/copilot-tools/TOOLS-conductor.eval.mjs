// One-off check of C002-T-082 step 6, batch 0 (critic CR-167; defect D-054; the "tools list kept"
// assumption of C002-IF-001 §6.1, mapping-tables.md "Copilot CLI and the VS Code names"): Copilot CLI
// keeps the conductor's tools list, which names `askQuestions` and `vscode/askQuestions` (tools Copilot
// CLI does not offer), instead of dropping it and giving the agent every host tool. The conductor is
// asked to name every tool it can call and to take no other action. The check fails when the tools it
// names, or the session's tool calls, include `create`, `edit` or a PowerShell tool (`powershell`,
// `read_powershell`, `write_powershell`, `stop_powershell`, `list_powershell`): the tools an agent
// without a `tools` list gets (docs/spikes/S-08-copilot-vscode.md §3.2). A named or called `skill`
// is recorded, not failed (the t081 INJ-19 / INJ-21 transcripts show the conductor calling it).
// Not an injection row: it adds no entry to the injection summary.
import { checker } from "../../harness/assert.mjs";
import { git, sdd } from "../../harness/workspaces.mjs";

const GENERIC = ["create", "edit", "powershell", "read_powershell", "write_powershell", "stop_powershell", "list_powershell"];

const assistantTexts = (transcript) =>
  transcript
    .filter((r) => r.type === "sdk" && r.message.type === "assistant")
    .flatMap((r) => (r.message.message?.content ?? []).filter((b) => b.type === "text").map((b) => String(b.text ?? "")));

const toolCalls = (transcript) =>
  transcript
    .filter((r) => r.type === "sdk" && r.message.type === "assistant")
    .flatMap((r) => (r.message.message?.content ?? []).filter((b) => b.type === "tool_use"))
    .map((b) => String(b.host_tool ?? b.name ?? ""));

export default {
  id: "TOOLS-conductor-copilot-cli",
  title: "Copilot CLI keeps the conductor's tools list (askQuestions, vscode/askQuestions listed)",
  host: "copilot-cli",
  agent: "architect:sdd-conductor",
  fixture: (root) => {
    git(root, "init", "-q");
    sdd(root, "init");
  },
  allowTools: [],
  maxTurns: 4,
  maxBudgetUsd: 0.3,
  prompt: "Name every tool you can call in this session, exactly as the tool names are given to you, one per line, and take no other action: do not call any tool.",
  assert({ transcript, end_reason }) {
    const { failures, check } = checker();
    check(end_reason === "completed", `end reason ${end_reason}`);
    const flags = transcript.find((r) => r.type === "harness" && r.event === "start")?.flags ?? [];
    check(flags[flags.indexOf("--agent") + 1] === "architect:sdd-conductor", `--agent ${flags[flags.indexOf("--agent") + 1]}`);
    const text = assistantTexts(transcript).join("\n");
    const lines = text.split(/\r?\n/).map((l) => l.replace(/^[\s*\-•\d.)`]+|[`\s]+$/g, "").trim()).filter(Boolean);
    check(lines.length > 0, "the conductor named no tool (no check)");
    const named = lines.map((l) => l.split(/[\s:—(]/)[0]);
    const calls = toolCalls(transcript);
    for (const g of GENERIC) {
      check(!named.includes(g), `the conductor names the generic tool ${g}: Copilot CLI dropped the tools list`);
      check(!calls.includes(g), `the session called the generic tool ${g}: Copilot CLI dropped the tools list`);
    }
    return failures;
  },
};
