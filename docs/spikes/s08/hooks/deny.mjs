// S-08 agent-scoped hook of probe-hooked: records the call, then denies it (JSON deny and exit 2).
import { logHook } from "./log.mjs";

logHook("agent-scoped:probe-hooked:PreToolUse");
const reason = "S-08 probe: agent-scoped PreToolUse hook of probe-hooked denies every tool call";
process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: reason }, permissionDecision: "deny", permissionDecisionReason: reason }));
process.stderr.write(reason + "\n");
process.exit(2);
