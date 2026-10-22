// Test fixture stub-exe (C002-T-065; test plan §2): native recording stubs for the executable-lookup
// cases (C002-TC-675, C002-TC-684 … C002-TC-687). tests/fixtures/stub-exe/recording-stub.cs is compiled
// once per source hash with the .NET Framework compiler csc.exe (as evals/harness/machines.mjs compiles
// the cfg-node18 node shim) into a temporary folder, then copied under the names a row needs. Each copy
// appends its starts to `<name>.stub.log` beside it. The helper also writes recording `.cmd` stubs, which
// append to `<name>.cmd.log`. Windows only: `STUB_EXE_SKIP` is a skip reason elsewhere or without csc.exe
// (on REF-WIN, Windows 11, csc.exe is present and nothing skips).
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, linkSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { repoRoot } from "../helpers.ts";

const SOURCE = join(repoRoot(), "tests", "fixtures", "stub-exe", "recording-stub.cs");
const CSC = join(process.env["SystemRoot"] ?? "C:\\Windows", "Microsoft.NET", "Framework64", "v4.0.30319", "csc.exe");

/** A skip reason for node:test, or false when the stubs can be built (Windows with csc.exe). */
export const STUB_EXE_SKIP: string | false =
  process.platform !== "win32" ? "stub-exe: Windows only" : existsSync(CSC) ? false : `stub-exe: no .NET Framework compiler at ${CSC}`;

let compiled: string | null = null;

/** The compiled stub (`recording-stub.exe` in a temporary folder keyed by the source hash). */
export function stubBinary(): string {
  if (compiled !== null) return compiled;
  const hash = createHash("sha256").update(readFileSync(SOURCE)).digest("hex").slice(0, 10);
  const dir = join(tmpdir(), "sdd-stub-exe", hash);
  const exe = join(dir, "recording-stub.exe");
  if (!existsSync(exe)) {
    mkdirSync(dir, { recursive: true });
    const tmp = join(dir, `recording-stub-${process.pid}.exe`);
    const r = spawnSync(CSC, ["/nologo", "/target:exe", `/out:${tmp}`, SOURCE], { encoding: "utf8", windowsHide: true });
    if (r.status !== 0 || !existsSync(tmp)) throw new Error(`stub-exe: compiling ${SOURCE} failed: ${(r.stdout ?? "") + (r.stderr ?? "") || r.error?.message}`);
    try {
      copyFileSync(tmp, exe);
    } catch {
      // Another test file compiled it at the same time; its copy is the same program.
    }
  }
  compiled = existsSync(exe) ? exe : join(dir, `recording-stub-${process.pid}.exe`);
  return compiled;
}

export interface StubConfig {
  /** Text printed for the arguments joined by one space. */
  on?: Record<string, string>;
  /** Text printed for any other arguments. */
  print?: string;
  /** Environment variables recorded with each start. */
  env?: string[];
  exit?: number;
  /** Start one never-ending child copy and never end. */
  neverEnding?: boolean;
}

/** Copies the stub into `dir` as `<name>.exe` with its configuration; returns its path. */
export function plantExe(dir: string, name: string, config: StubConfig = {}): string {
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `${name}.exe`);
  copyFileSync(stubBinary(), file);
  const esc = (t: string) => t.replace(/\r?\n/g, "\\n");
  const lines = [
    ...(config.env ?? []).map((e) => `env ${e}`),
    ...Object.entries(config.on ?? {}).map(([args, text]) => `on ${args}\t${esc(text)}`),
    ...(config.print !== undefined ? [`default ${esc(config.print)}`] : []),
    ...(config.exit !== undefined ? [`exit ${config.exit}`] : []),
    ...(config.neverEnding ? ["never-ending"] : []),
  ];
  writeFileSync(join(dir, `${name}.stub.txt`), lines.join("\n") + "\n");
  return file;
}

export interface StubStart {
  path: string;
  args: string[];
  cwd: string;
  env: Record<string, string | null>;
  pid: number;
  child: number;
}

/** The starts recorded by the stub `<dir>/<name>.exe`. */
export function exeStarts(dir: string, name: string): StubStart[] {
  const log = join(dir, `${name}.stub.log`);
  if (!existsSync(log)) return [];
  return readFileSync(log, "utf8")
    .split("\n")
    .filter((l) => l.trim() !== "")
    .map((l) => JSON.parse(l) as StubStart);
}

/**
 * Writes the recording shim `<dir>/<name>.cmd`: each start appends `start <arguments>` to
 * `<name>.cmd.log` beside it, then the shim prints `print` (one line per text line), or runs `body`
 * (batch lines) when given.
 */
export function plantCmd(dir: string, name: string, opts: { print?: string; body?: string[] } = {}): string {
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `${name}.cmd`);
  const out = opts.body ?? (opts.print ?? "").split("\n").filter((l) => l !== "").map((l) => `echo ${l}`);
  writeFileSync(file, ["@echo off", `>>"%~dp0${name}.cmd.log" echo start %*`, ...out, ""].join("\r\n"));
  return file;
}

/** The starts recorded by the shim `<dir>/<name>.cmd`. */
export function cmdStarts(dir: string, name: string): string[] {
  const log = join(dir, `${name}.cmd.log`);
  if (!existsSync(log)) return [];
  return readFileSync(log, "utf8").split(/\r?\n/).filter((l) => l.trim() !== "");
}

/**
 * A copy of this process's environment with PATH set to `path`: every other letter case of the key
 * (`Path`) is present with the value `undefined`, so the result can also be laid over `process.env` and
 * a child receives one PATH only (spawn leaves `undefined` values out).
 */
export function envWithPath(path: string, extra: Record<string, string | undefined> = {}): Record<string, string | undefined> {
  const env: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(process.env)) env[k] = k.toUpperCase() === "PATH" ? undefined : v;
  return { ...env, SDD_DEBUG: undefined, SDD_TEST_FAULT: undefined, ...extra, PATH: path };
}

let nodeDir: string | null = null;

/**
 * A folder that holds the real `node.exe` (a copy on Windows; elsewhere a hard link, or a copy across
 * volumes) and nothing else: the folder of the test runner's Node.js may also hold npm-installed shims
 * (`opencode.cmd`), which a row's "no other folder holds an opencode executable" leaves out. On Windows a
 * hard link to the running node.exe cannot be deleted under Node 20 (EPERM), so the folder (about 80 MB
 * per test process) was left in the temporary folder; a copy can be deleted once no child runs it.
 */
export function nodeOnlyDir(): string {
  if (nodeDir !== null) return nodeDir;
  const dir = join(tmpdir(), "sdd-stub-exe", `node-${createHash("sha256").update(process.execPath).digest("hex").slice(0, 10)}-${process.pid}`);
  const exe = join(dir, process.platform === "win32" ? "node.exe" : "node");
  if (!existsSync(exe)) {
    mkdirSync(dir, { recursive: true });
    try {
      if (process.platform === "win32") throw new Error("copy on Windows");
      linkSync(process.execPath, exe);
    } catch {
      copyFileSync(process.execPath, exe);
    }
  }
  process.once("exit", () => {
    try {
      rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
    } catch {
      // A child still holds the file; the temporary folder is left.
    }
  });
  nodeDir = dir;
  return dir;
}

/** The folder of the Node.js executable that runs the tests. */
export const NODE_DIR = dirname(process.execPath);
