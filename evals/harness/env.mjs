// Child-process environment and Claude Code binary for eval runs (C001-T-029).
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

/**
 * Billing route of an eval session (CHG-002 D-003, eval auth switch):
 * - `api-key` (default): Claude Code's stored login, today the prepaid API key (`primaryApiKey`);
 * - `subscription`: the P-01's Claude subscription, through a long-lived OAuth token created with
 *   `claude setup-token`. The child gets its own empty config folder, so it cannot see the stored key.
 */
export const AUTH_MODES = ["api-key", "subscription"];

/**
 * The SDK's `apiKeySource` values each mode accepts (init message of the session). The field names
 * the API key in use: with `CLAUDE_CODE_OAUTH_TOKEN` and the isolated config folder there is none, so
 * Claude Code 2.1.299 reports "none" (smoke run of 2026-10-18); any source that names a key
 * ("/login managed key", "ANTHROPIC_API_KEY", "apiKeyHelper", "user", "project", "org", "temporary")
 * is refused in subscription mode.
 */
export const ACCEPTED_KEY_SOURCES = { "api-key": null, subscription: ["oauth", "none"] };

const evalHome = () => join(homedir(), ".architect-evals");

/** The mode from `--auth`, else `EVAL_AUTH`, else `api-key`. */
export function resolveAuth(mode = process.env.EVAL_AUTH) {
  const m = mode ?? "api-key";
  if (!AUTH_MODES.includes(m)) throw new Error(`unknown eval auth mode ${m}; use ${AUTH_MODES.join(" or ")}`);
  return m;
}

/** Environment variables that select the billing route of a child Claude Code process. */
export function authEnv(mode = resolveAuth()) {
  if (resolveAuth(mode) === "api-key") return {};
  // Notepad saves `claude-oauth-token` as `claude-oauth-token.txt`; both names are accepted.
  const defaults = [join(evalHome(), "claude-oauth-token"), join(evalHome(), "claude-oauth-token.txt")];
  const tokenFile = process.env.EVAL_CLAUDE_OAUTH_TOKEN_FILE ?? defaults.find((f) => existsSync(f)) ?? defaults[0];
  const token = (process.env.EVAL_CLAUDE_OAUTH_TOKEN ?? (existsSync(tokenFile) ? readFileSync(tokenFile, "utf8") : "")).trim();
  if (!token) {
    throw new Error(
      `subscription mode needs an OAuth token: run \`claude setup-token\` and save the token to ${tokenFile} ` +
        "(or set EVAL_CLAUDE_OAUTH_TOKEN_FILE / EVAL_CLAUDE_OAUTH_TOKEN); keep it outside the repository",
    );
  }
  const configDir = process.env.EVAL_CLAUDE_CONFIG_DIR ?? join(evalHome(), "claude-config");
  mkdirSync(configDir, { recursive: true });
  return { CLAUDE_CONFIG_DIR: configDir, CLAUDE_CODE_OAUTH_TOKEN: token };
}

// The parent session's CLAUDE… and ANTHROPIC… variables would redirect the child (spike S-04).
export function childEnv(extra = {}, auth = resolveAuth()) {
  const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^(CLAUDE|ANTHROPIC)/.test(k)));
  return { ...env, ...authEnv(auth), ...extra };
}

/** Throws when a session's `apiKeySource` does not match the mode (subscription must never fall back to a key). */
export function checkKeySource(mode, apiKeySource) {
  const accepted = ACCEPTED_KEY_SOURCES[resolveAuth(mode)];
  if (accepted && !accepted.includes(apiKeySource)) {
    throw new Error(`eval auth ${mode}: Claude Code authenticated with "${apiKeySource}", not the subscription; session stopped before any turn was billed to that source`);
  }
}

/**
 * Checks, before any session, the environment a host needs (C002-T-044): `CLAUDE_CODE_EXECPATH` for the
 * Claude Code host only; the OpenCode host needs its pinned binary and key file, which its driver checks
 * at session start (opencode/driver.mjs). Throws with the fix.
 */
export function checkHostEnv(host) {
  if (host === "claude-code") claudeExecutable();
}

/** Desktop-bundled Claude Code (≥ 2.1.295, C001-REQ-1123); the SDK's own binary is not installed. Claude Code host only. */
export function claudeExecutable() {
  const path = process.env.CLAUDE_CODE_EXECPATH;
  if (!path) throw new Error("CLAUDE_CODE_EXECPATH is not set: run evals from the Claude desktop app or set it to a Claude Code ≥ 2.1.295 binary");
  return path;
}
