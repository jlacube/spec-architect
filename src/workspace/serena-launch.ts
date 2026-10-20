// `sdd serena-launch (<plugin-data-dir> | --user-data) [--read-only] -- <serena arguments>` (C001-REQ-1013,
// C001-IF-14 §4, defect D-010, C002-IF-007): the plugin's MCP entry for Serena. The configuration of
// `sdd serena-config` is written first, so that Serena never creates `.serena/` in a repository; then
// `serena` runs with the given arguments and the standard streams of this process (the MCP channel), and
// its exit code is returned. Nothing is printed on standard output, which belongs to the MCP protocol.
// `--read-only` adds the read-only mode file shipped beside the CLI (C002-REQ-114, C002-REQ-512): the
// same `<root>/scripts/sdd.mjs` and `<root>/serena/` shape in the plugin and in the npm package.
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { nativeExecutable, normalisePath } from "../io/paths.ts";
import { writeSerenaConfig } from "./serena-config.ts";

export interface LaunchResult {
  code: number;
  /** Set when Serena could not be started at all. */
  error?: string;
}

export interface LaunchOptions {
  /** Executable name (default `serena`). */
  command?: string;
  /** Environment of the child; absent: this process's environment. */
  env?: Readonly<Record<string, string | undefined>>;
  /** Mode file appended as `--mode <file>`. */
  modeFile?: string;
}

export type Spawner = (command: string, args: string[], env: Readonly<Record<string, string | undefined>> | undefined) => { status: number | null; error?: Error };

/**
 * Starts `command` by the absolute path of its first native match on the CLI's PATH (C002-IF-007 §Executable
 * lookup, C002-CON-17), never by its bare name, so a planted serena executable in the working folder or the repository
 * is never started; no native match is a start error without any process started.
 */
const defaultSpawner: Spawner = (command, args, env) => {
  const found = nativeExecutable(command);
  if ("error" in found) return { status: null, error: new Error(found.error) };
  return spawnSync(found.file, args, { stdio: "inherit", windowsHide: true, ...(env ? { env: { ...env } } : {}) });
};
let spawner: Spawner = defaultSpawner;

/** Replaces how Serena is started (tests); `null` restores the default. */
export function setSpawner(s: Spawner | null): void {
  spawner = s ?? defaultSpawner;
}

/** `<cli folder>/../serena/architect-read-only.yml`: the folder above the running bundle. */
export function readOnlyModeFile(cliDir: string = dirname(fileURLToPath(import.meta.url))): string {
  return normalisePath(join(cliDir, "..", "serena", "architect-read-only.yml"));
}

/** The arguments Serena receives: the given ones, then `--mode <file>` when a mode file is set. */
export function launchArgs(args: readonly string[], modeFile?: string): string[] {
  return modeFile === undefined ? [...args] : [...args, "--mode", modeFile];
}

export function serenaLaunch(dataDir: string, args: readonly string[], options: LaunchOptions = {}): LaunchResult {
  const command = options.command ?? "serena";
  writeSerenaConfig(dataDir);
  const r = spawner(command, launchArgs(args, options.modeFile), options.env);
  if (r.error) return { code: 1, error: `${command} could not be started: ${r.error.message}` };
  return { code: r.status ?? 1 };
}
