// Child-process environment and Claude Code binary for eval runs (C001-T-029).

// The parent session's CLAUDE… and ANTHROPIC… variables would redirect the child (spike S-04).
export function childEnv(extra = {}) {
  const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^(CLAUDE|ANTHROPIC)/.test(k)));
  return { ...env, ...extra };
}

/** Desktop-bundled Claude Code (≥ 2.1.295, C001-REQ-1123); the SDK's own binary is not installed. */
export function claudeExecutable() {
  const path = process.env.CLAUDE_CODE_EXECPATH;
  if (!path) throw new Error("CLAUDE_CODE_EXECPATH is not set: run evals from the Claude desktop app or set it to a Claude Code ≥ 2.1.295 binary");
  return path;
}
