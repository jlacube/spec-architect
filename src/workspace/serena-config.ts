// Serena's configuration in the plugin data folder (C001-REQ-1013, C001-IF-14 §4): `sdd serena-config
// <plugin-data-dir>` creates or updates `<dir>/serena/serena_config.yml` so that Serena keeps project data
// inside the data folder (never `.serena/` in the repository) and opens no dashboard. Other keys of an
// existing file are kept; running it twice changes nothing.
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { writeTextAtomic } from "../io/atomic.ts";

export interface SerenaConfigResult {
  path: string;
  /** created, updated (keys changed) or unchanged */
  outcome: "created" | "updated" | "unchanged";
}

/** The values the plugin requires, with forward slashes in the project folder path. */
export function requiredSettings(dataDir: string): Record<string, string> {
  const projects = join(dataDir, "serena", "projects").split("\\").join("/");
  return {
    web_dashboard: "false",
    web_dashboard_open_on_launch: "false",
    project_serena_folder_location: `"${projects}/$projectFolderName/.serena"`,
  };
}

/** Sets `key: value` on its top-level line, or appends the line when the key is absent. */
function setKey(text: string, key: string, value: string): string {
  const re = new RegExp(`^${key}:.*$`, "m");
  const line = `${key}: ${value}`;
  if (re.test(text)) return text.replace(re, line);
  return `${text.replace(/\n*$/, "\n")}${line}\n`;
}

export function writeSerenaConfig(dataDir: string): SerenaConfigResult {
  const dir = join(dataDir, "serena");
  const path = join(dir, "serena_config.yml");
  const existed = existsSync(path);
  const before = existed ? readFileSync(path, "utf8") : "";
  let text = before;
  for (const [k, v] of Object.entries(requiredSettings(dataDir))) text = setKey(text, k, v);
  // Serena refuses to start without a `projects` key; an empty list registers nothing.
  if (!/^projects:/m.test(text)) text = setKey(text, "projects", "[]");
  if (existed && text === before) return { path, outcome: "unchanged" };
  mkdirSync(dir, { recursive: true });
  writeTextAtomic(path, text);
  return { path, outcome: existed ? "updated" : "created" };
}
