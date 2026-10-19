// Replay adapter of the mechanism `copilot-hooks` (C002-T-041, C002-IF-009 §2): every case is decided by
// the PreToolUse command of the Copilot package generated for the hooks fallback
// (`sdd hook guard --host copilot --mode copilot-hooks --agents …`, C002-IF-008 §2, §4). The adapter
// generates that package (`--mode copilot=copilot-hooks`), installs it with its own CLI copy
// (`sdd install copilot --package <package>`, C002-T-058) into a throwaway repository of its run
// folder, takes the command of the installed `<package>/hooks.json` (the same as the workspace file
// `.github/hooks/architect-guard.json`) and runs it directly, as written, once per case, with a
// Copilot-shaped hook input of the S-08 record on standard input:
//
//   agent_type   the playing generated agent as VS Code reports it (`sdd-spec-writer`)
//   cwd          the case's own working folder (`{repo}` when it has none); the path as written
//   tool_name    the hook tool of the class the case maps to in the package's classes file:
//                write (Write, Edit, MultiEdit, NotebookEdit) → its first `write` entry (`Write`, the
//                path at its first `paths` pointer); terminal (Bash, PowerShell) → its first
//                `terminal` entry (`Bash`, the command at its `command` pointer); read_only (Read, Glob,
//                Grep) → the case's tool when listed, else the first `read_only` entry (`Glob`)
//   raw stdin    the case's standard input unchanged
//   C002-REQ-630 the input of the case's tool with the field the case leaves out also left out or empty
//
// Before each case the package's classes file is rewritten (the per-case copy of §2.2 "Copilot classes
// copy per case", critic CR-46) so that every terminal entry names the dialect of the case's tool
// (`bash` for a case that is not a shell corpus case), every other entry kept: each case is decided in
// its own dialect. The hook runs without `--classes` and reads that file, its default. The decision is read per
// §2.3: exit 2 with the deny decision on standard output is `deny`, exit 0 with empty standard output
// `allow`, anything else `error`. The hook runs in the sandbox of ./package.ts.
import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Mode } from "../../../scripts/generate/tables.ts";
import { preToolUse, splitHookCommand } from "../../fixtures/pkg-cp.ts";
import type { Dialect } from "../../guards/fixture.ts";
import type { Actual, AdapterDecision, ReplayAdapter, ReplayFixture, ReplayInput } from "../adapter.ts";
import { clip, createSandbox, generatedPackage, type Grants, packageGrants, type Sandbox } from "./package.ts";

const MODE: Mode = "copilot-hooks";
const HOOK_TIMEOUT_MS = 60_000;

interface Classes {
  write: { tool: string; paths: string[]; always_deny?: boolean }[];
  terminal: { tool: string; command: string; dialect?: string }[];
  read_only: string[];
}

/** Sets `value` at a JSON pointer without `*` segments, creating objects on the way. */
function setAt(doc: Record<string, unknown>, ptr: string, value: unknown): void {
  const segs = ptr.split("/").slice(1).map((s) => s.replace(/~1/g, "/").replace(/~0/g, "~"));
  let node = doc;
  for (const s of segs.slice(0, -1)) {
    if (node[s] === null || typeof node[s] !== "object") node[s] = {};
    node = node[s] as Record<string, unknown>;
  }
  if (segs.length > 0) node[segs[segs.length - 1]!] = value;
}

export type CorpusClass = "write" | "terminal" | "read_only";

/** The class a corpus tool maps to (C002-IF-009 §2.2 table). */
export function classOfCorpusTool(input: ReplayInput): CorpusClass {
  const t = input.tool;
  if (t === "Read" || t === "Glob" || t === "Grep") return "read_only";
  if (t === "Bash" || t === "PowerShell") return "terminal";
  if (input.corpus === "shell" && t === null) return "terminal";
  return "write";
}

/** The Copilot hook input of one replayed case (C002-IF-009 §2.2), as standard-input text, and its hook tool. */
export function hookInputOf(input: ReplayInput, classes: Classes): { stdin: string; tool: string } {
  const cls = classOfCorpusTool(input);
  const write = classes.write.find((e) => e.always_deny !== true) ?? classes.write[0]!;
  const terminal = classes.terminal[0]!;
  const tool = cls === "write" ? write.tool : cls === "terminal" ? terminal.tool : input.tool !== null && classes.read_only.includes(input.tool) ? input.tool : classes.read_only[0]!;
  if (input.malformed === "raw-stdin") return { stdin: input.stdin ?? "", tool };
  const doc: Record<string, unknown> = {
    hook_event_name: "PreToolUse",
    session_id: "replay-session",
    timestamp: new Date().toISOString(),
  };
  if (input.cwd !== null) doc["cwd"] = input.cwd;
  if (input.tool !== null) doc["tool_name"] = tool;
  const value = input.corpus === "shell" ? input.command : input.path;
  let toolInput: Record<string, unknown> | undefined = {};
  if (cls === "write") {
    if (value === null || value === undefined) toolInput = undefined;
    else {
      setAt(toolInput, write.paths[0]!, value);
      toolInput["file_text"] = `replay ${input.id}\n`;
    }
  } else if (cls === "terminal") {
    setAt(toolInput, terminal.command, input.corpus === "path" ? `git status -- ${typeof value === "string" ? value : String(value)}` : value);
    toolInput["description"] = `replay ${input.id}`;
  } else {
    toolInput = { pattern: value };
  }
  if (toolInput !== undefined) doc["tool_input"] = toolInput;
  doc["agent_id"] = `replay-${input.id}`;
  doc["agent_type"] = input.caller;
  doc["parent_agent_id"] = "replay-parent";
  return { stdin: JSON.stringify(doc), tool };
}

/** The decision of one hook run (C002-IF-009 §2.3). */
export function readHookDecision(r: { status: number | null; stdout: string; stderr: string; error?: Error }): { actual: Actual; detail: string } {
  const err = r.stderr.trim();
  if (r.error) return { actual: "error", detail: clip(`no decision: ${r.error.message}`) };
  if (r.status === 0 && r.stdout === "") return { actual: "allow", detail: "exit 0, no output" };
  if (r.status === 2) {
    try {
      const d = JSON.parse(r.stdout) as { permissionDecision?: string; hookSpecificOutput?: { permissionDecision?: string } };
      if (d.permissionDecision === "deny" && d.hookSpecificOutput?.permissionDecision === "deny") return { actual: "deny", detail: clip(err) };
    } catch {
      // not the deny decision
    }
    return { actual: "error", detail: clip(`no decision: exit 2 without the deny decision: ${r.stdout.trim()} ${err}`) };
  }
  return { actual: "error", detail: clip(`no decision: exit ${r.status}: ${r.stdout.trim()} ${err}`) };
}

export interface CopilotHooksAdapter extends ReplayAdapter {
  /** The installed PreToolUse command, split (set up only). */
  readonly command: () => { script: string; args: string[] } | undefined;
  /** Every hook input sent, in order, with the dialects of the classes file's terminal entries when it ran. */
  readonly calls: { id: string; tool: string; stdin: string; dialect: Dialect; terminalDialects: string[] }[];
}

export function createCopilotHooksAdapter(): CopilotHooksAdapter {
  const calls: CopilotHooksAdapter["calls"] = [];
  let sandbox: Sandbox | undefined;
  let fixture: ReplayFixture | undefined;
  let hook: { script: string; args: string[] } | undefined;
  let classesFile: string | undefined;
  let classes: Classes | undefined;
  let grants: Grants = () => true;

  /** Rewrites the package's classes file for one case, every terminal entry in `dialect`; returns the terminal dialects read back. */
  function classesFor(dialect: Dialect): string[] {
    writeFileSync(classesFile!, JSON.stringify({ ...classes!, terminal: classes!.terminal.map((e) => ({ ...e, dialect })) }, null, 2) + "\n");
    return (JSON.parse(readFileSync(classesFile!, "utf8")) as Classes).terminal.map((e) => String(e.dialect));
  }

  return {
    mechanism: "copilot-hooks",
    target: "copilot",
    name: "copilot-hooks",
    calls,
    command: () => hook,
    grants: (agent, corpusTool) => grants(agent, corpusTool),
    async setup(fx) {
      fixture = fx;
      calls.length = 0;
      hook = undefined;
      sandbox = createSandbox("sdd-cp-hooks-run-");
      try {
        const generated = generatedPackage("copilot", MODE);
        grants = packageGrants("copilot", MODE, generated);
        // The install writes into the package (hooks.json, plugin.json): a copy of the run folder.
        const pkg = join(sandbox.runDir, "pkg-cp-hooks").split("\\").join("/");
        cpSync(generated, pkg, { recursive: true });
        const repo = join(sandbox.runDir, "install-repo");
        mkdirSync(join(repo, ".git"), { recursive: true });
        writeFileSync(join(repo, ".git", "HEAD"), "ref: refs/heads/main\n");
        writeFileSync(join(repo, "README.md"), "# replay install repository\n");
        const r = spawnSync(process.execPath, [join(pkg, "scripts", "sdd.mjs"), "install", "copilot", "--package", pkg], { cwd: repo, env: sandbox.env(), encoding: "utf8", windowsHide: true });
        if (r.status !== 0) throw new Error(`sdd install copilot --package ${pkg} failed (exit ${r.status}): ${r.stdout}${r.stderr}`);
        const pluginLevel = preToolUse(join(pkg, "hooks.json"));
        const workspace = preToolUse(join(repo, ".github", "hooks", "architect-guard.json"));
        if (pluginLevel.length !== 1 || workspace.length !== 1 || pluginLevel[0]!.command !== workspace[0]!.command)
          throw new Error(`the installed hooks files do not hold one and the same PreToolUse command: ${JSON.stringify(pluginLevel)} / ${JSON.stringify(workspace)}`);
        hook = splitHookCommand(pluginLevel[0]!.command);
        const mode = hook.args[hook.args.indexOf("--mode") + 1];
        if (mode !== MODE) throw new Error(`the installed PreToolUse command is not the hooks fallback's (--mode ${mode}): ${pluginLevel[0]!.command}`);
        classesFile = join(pkg, "hooks", "tool-classes.json");
        classes = JSON.parse(readFileSync(classesFile, "utf8")) as Classes;
        if (classes.write.length === 0 || classes.terminal.length === 0 || classes.read_only.length === 0) throw new Error(`${classesFile} lacks a write, terminal or read_only entry`);
      } catch (e) {
        await this.teardown();
        throw e;
      }
    },
    async decide(input: ReplayInput): Promise<AdapterDecision> {
      if (!fixture || !hook || !classes || !sandbox) throw new Error("the copilot-hooks adapter is not set up");
      const dialect: Dialect = input.corpus === "shell" ? input.dialect : "bash";
      const terminalDialects = classesFor(dialect);
      const { stdin, tool } = hookInputOf(input, classes);
      calls.push({ id: input.id, tool, stdin, dialect, terminalDialects });
      const stub = input.env === undefined ? undefined : Object.fromEntries(Object.entries(input.env).map(([k, v]) => [k, v === null ? null : input.resolve(v)]));
      const r = spawnSync(process.execPath, [hook.script, ...hook.args], { cwd: fixture.repo, env: sandbox.env(stub), input: stdin, encoding: "utf8", timeout: HOOK_TIMEOUT_MS, windowsHide: true });
      const d = readHookDecision({ status: r.status, stdout: r.stdout ?? "", stderr: r.stderr ?? "", ...(r.error ? { error: r.error } : {}) });
      return { actual: d.actual, tool, ...(input.corpus === "shell" ? { dialect } : {}), detail: d.detail };
    },
    async teardown() {
      // `hook` stays readable after the run (command()); setup replaces it.
      sandbox?.cleanup();
      sandbox = undefined;
    },
  };
}
