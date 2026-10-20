// Routing case of the Copilot CLI runner (C002-T-045 step 4, the smoke run; C002-TS-615 routing family,
// whose release rows run in C002-T-054): the conductor, started non-interactively as
// `--agent architect:sdd-conductor` with `--no-ask-user`, routes an audit of change 001 to sdd-auditor.
// Expected: the session completes, the agent start is reported as `architect:sdd-auditor`, that agent
// runs `sdd lint` through the sdd MCP server's command tool, and no agent start is reported by a bare
// Architect agent name. Copilot CLI row (host field): the results read Copilot CLI's own tool names.
import { checker } from "../../harness/assert.mjs";
import { git, sdd } from "../../harness/workspaces.mjs";

const startsOf = (transcript) => transcript.filter((r) => r.type === "sdk" && r.message.type === "system" && r.message.subtype === "task_started").map((r) => r.message);

export default {
  id: "ROUTE-auditor-copilot-cli",
  title: "The conductor routes an audit to sdd-auditor on Copilot CLI (routing smoke)",
  host: "copilot-cli",
  agent: "architect:sdd-conductor",
  fixture: (root) => {
    git(root, "init", "-q");
    sdd(root, "init");
    sdd(root, "change", "new", "Coupon codes");
  },
  allowTools: ["Write", "Edit", "Bash"],
  maxTurns: 12,
  maxBudgetUsd: 0.5,
  prompt: "Dispatch the sdd-auditor agent to audit change 001 (CHG-001), then report the lint counts it returns. Do not run the sdd commands yourself.",
  assert({ transcript, end_reason }) {
    const { failures, check } = checker();
    check(end_reason === "completed", `end reason ${end_reason}`);
    const flags = transcript.find((r) => r.type === "harness" && r.event === "start")?.flags ?? [];
    check(flags.includes("--no-ask-user"), "the session was not started with --no-ask-user");
    check(flags[flags.indexOf("--agent") + 1] === "architect:sdd-conductor", `--agent ${flags[flags.indexOf("--agent") + 1]}`);
    const starts = startsOf(transcript);
    check(starts.some((s) => s.subagent_type === "architect:sdd-auditor"), `no agent start architect:sdd-auditor (starts: ${starts.map((s) => s.subagent_type).join(", ") || "none"})`);
    for (const s of starts) check(!/^sdd-/.test(String(s.subagent_type)), `agent start reported by a bare name: ${s.subagent_type}`);
    const auditorCalls = transcript
      .filter((r) => r.type === "sdk" && r.message.type === "assistant" && r.message.agent === "architect:sdd-auditor")
      .flatMap((r) => (r.message.message?.content ?? []).filter((b) => b.type === "tool_use"));
    check(auditorCalls.some((b) => b.host_tool === "sdd-shell-run_command" && /\blint\b/.test(String(b.input?.command ?? ""))), `sdd-auditor ran no sdd lint through sdd-shell (calls: ${auditorCalls.map((b) => b.host_tool).join(", ") || "none"})`);
    return failures;
  },
};
