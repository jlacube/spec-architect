// S-08 probe hook helper: appends one JSON line (event, argv tag, stdin payload) to logs/hooks.jsonl.
import { appendFileSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const logs = join(dirname(fileURLToPath(import.meta.url)), "..", "logs");

export function logHook(tag) {
  let raw = "";
  try {
    raw = readFileSync(0, "utf8");
  } catch {
    raw = "";
  }
  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    payload = { unparsed: raw };
  }
  mkdirSync(logs, { recursive: true });
  appendFileSync(join(logs, "hooks.jsonl"), JSON.stringify({ at: new Date().toISOString(), tag, env_plugin_root: process.env.PLUGIN_ROOT ?? process.env.CLAUDE_PLUGIN_ROOT ?? null, payload }) + "\n");
  return payload;
}
