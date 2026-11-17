// Source-text checks of the plugin for C005-TS-129 … 133 (C005-IF-003 §5, §6): the README hand-off step names
// the version of plugin.json, and no file of the plugin holds a plugin-path form of the CLI.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

/** The two plugin-path forms of C005-IF-003 §6. `${CLAUDE_PLUGIN_ROOT}/scripts/sdd.mjs` is not one of them. */
export const PLUGIN_PATH_FORMS = ["<plugin-root>", "<plugin>/scripts/sdd.mjs"];

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? files(p) : [p];
  });
}

/** Every occurrence of a plugin-path form under `pluginDir`, the bundle included, as `<file>:<line>: <form>`. */
export function scanPluginPaths(pluginDir: string): string[] {
  const out: string[] = [];
  for (const p of files(pluginDir)) {
    const rel = relative(pluginDir, p).split("\\").join("/");
    readFileSync(p, "utf8")
      .split("\n")
      .forEach((line, i) => {
        for (const form of PLUGIN_PATH_FORMS) if (line.includes(form)) out.push(`${rel}:${i + 1}: ${form}`);
      });
  }
  return out;
}

/**
 * The README hand-off step of `pluginDir`: null when it names `npm install -g architect-sdd@<version of
 * plugin.json>` followed by `sdd task set <task-ID> --status done --commit <sha>`; else the failure message.
 */
export function readmeVersionProblem(pluginDir: string): string | null {
  const version = (JSON.parse(readFileSync(join(pluginDir, ".claude-plugin", "plugin.json"), "utf8")) as { version: string }).version;
  const text = readFileSync(join(pluginDir, "README.md"), "utf8");
  const at = text.indexOf("20-plan/handoff.md` to whoever implements it");
  if (at < 0) return "README.md: no hand-off step found";
  const step = text.slice(at, text.indexOf("\n7. ", at) >= 0 ? text.indexOf("\n7. ", at) : undefined);
  const named = /npm install -g architect-sdd@(\d+\.\d+\.\d+)/.exec(step)?.[1];
  if (named === undefined) return "README.md: the hand-off step has no install line";
  if (named !== version) return `README.md: the hand-off step names architect-sdd@${named}, plugin.json gives ${version}`;
  const task = step.indexOf("sdd task set <task-ID> --status done --commit <sha>");
  if (task < step.indexOf("npm install -g")) return "README.md: the hand-off step has no sdd task set command after the install line";
  return null;
}
