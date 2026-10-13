// `sdd serena-launch <plugin-data-dir> -- <serena arguments>` (C001-REQ-1013, C001-IF-14 §4, defect D-010):
// the plugin's MCP entry for Serena. The configuration of `sdd serena-config` is written first, so that
// Serena never creates `.serena/` in a repository; then `serena` runs with the given arguments and the
// standard streams of this process (the MCP channel), and its exit code is returned. Nothing is printed
// on standard output, which belongs to the MCP protocol.
import { spawnSync } from "node:child_process";
import { writeSerenaConfig } from "./serena-config.ts";

export interface LaunchResult {
  code: number;
  /** Set when Serena could not be started at all. */
  error?: string;
}

export function serenaLaunch(dataDir: string, args: readonly string[], command = "serena"): LaunchResult {
  writeSerenaConfig(dataDir);
  const r = spawnSync(command, [...args], { stdio: "inherit", windowsHide: true });
  if (r.error) return { code: 1, error: `${command} could not be started: ${r.error.message}` };
  return { code: r.status ?? 1 };
}
