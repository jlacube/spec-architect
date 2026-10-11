// Hook input of C001-IF-07 §1: the JSON Claude Code passes on standard input, and the caller identity
// the guards use (spike S-04: `agent_type` is `architect:<agent>` for Architect agents).

export interface HookInput {
  hook_event_name?: string;
  tool_name?: string;
  tool_input?: Record<string, unknown>;
  cwd?: string;
  agent_type?: string;
  session_id?: string;
  transcript_path?: string;
}

/** Parses hook input; null when it is not a JSON object. */
export function parseHookInput(text: string): HookInput | null {
  try {
    const doc: unknown = JSON.parse(text);
    return doc !== null && typeof doc === "object" && !Array.isArray(doc) ? (doc as HookInput) : null;
  } catch {
    return null;
  }
}

/** True when the caller is an Architect agent (C001-IF-07 §2): `agent_type` starts with `architect:sdd-`. */
export function isArchitectAgent(input: HookInput): boolean {
  return typeof input.agent_type === "string" && input.agent_type.startsWith("architect:sdd-");
}
