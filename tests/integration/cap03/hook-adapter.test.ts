// C002-T-032: the Copilot hook adapter (C002-IF-007 `hook guard`, `hook session-start --host copilot`,
// `hook subagent-stop`; C002-IF-008 §2–§4), with Copilot-shaped input of the S-08 record (`agent_type`
// as VS Code and Copilot CLI report it, host built-in and adopter names, absent, `null`, a number).
// C002-TC-312, 314, 320, 322, 323, 324, 333, 334, 337, 338, 357, 362, 363, 364, 365, 366 and, for
// revision D-007 (C002-T-062), C002-TC-367, 368, 369, 370.
//
// The cases run in three forms:
//   direct            the command of C002-IF-008 §4 with `@CLI_COPY@` replaced by a copy of the bundled
//                     CLI inside a minimal package folder holding `hooks/tool-classes.json` (C002-T-032);
//   installed hooks.json / installed architect-guard.json (C002-T-058): the generated `pkg-cp`
//                     (`--mode sdd-mcp-server`) and `pkg-cp-hooks` (`--mode copilot-hooks`) installed with
//                     `sdd install copilot` into a fresh repository, and the command of the entry written to
//                     `<package>/hooks.json` or to `.github/hooks/architect-guard.json` run as written (the
//                     CLI copy it names, its arguments). The workspace hook file holds the PreToolUse entry
//                     only, so the SessionStart and SubagentStop cases run in the first two forms. Rows of a
//                     changed command (without `--mode`, another `--host`, `--agents` with `critic`,
//                     `--classes`) run the installed CLI copy with those arguments. The package variants of a
//                     row (classes file deleted, not JSON, `Glob` listed twice) are applied to the installed
//                     package after the install, as the scenarios state them.
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { cleanupPackages, copilotPackage, preToolUse, splitHookCommand } from "../../fixtures/pkg-cp.ts";
import { CLI, makeWorkspace, minimalChange, REBUILD } from "../cli/helpers.ts";

const AGENTS = ["sdd-conductor", "sdd-researcher", "sdd-cartographer", "sdd-options-analyst", "sdd-spec-writer", "sdd-test-designer", "sdd-architect", "sdd-planner", "sdd-critic", "sdd-auditor"].join(",");
const AUTHORS = "sdd-spec-writer,sdd-test-designer,sdd-architect,sdd-planner";

// The initial classes of C002-IF-008 §2 (S-08 record, C002-IF-002 §2); one file in both modes (C002-REQ-318).
const CLASSES = {
  write: [
    { tool: "Write", paths: ["/path"] },
    { tool: "sdd-files-write_file", paths: ["/path"] },
    { tool: "sdd-files-replace_text", paths: ["/path"] },
  ],
  terminal: [
    { tool: "Bash", command: "/command", dialect: "powershell" },
    { tool: "sdd-shell-run_command", command: "/command", dialect: "strictest" },
  ],
  read_only: ["Glob", "tool_search_tool", "context7-query-docs", "context7-resolve-library-id", "deepwiki-ask_wiki_question", "serena-find_symbol"],
};
type Classes = typeof CLASSES;

type Mode = "sdd-mcp-server" | "copilot-hooks";
type PkgName = "pkg-cp" | "pkg-cp-hooks";
const PKG: Record<PkgName, Mode> = { "pkg-cp": "sdd-mcp-server", "pkg-cp-hooks": "copilot-hooks" };
const ABSENT = Symbol("absent");

/** Package variants: as generated, classes file deleted, not JSON, `Glob` also listed as `write` / `terminal` (C002-TC-369, C002-TC-370). */
type Variant = "base" | "noClasses" | "badClasses" | "dupWrite" | "dupTerminal";
const VARIANTS: Variant[] = ["base", "noClasses", "badClasses", "dupWrite", "dupTerminal"];

/** The classes file text of a variant, from the variant's base classes (null: no file). */
function variantClasses(v: Variant, base: Classes): string | null {
  if (v === "noClasses") return null;
  if (v === "badClasses") return "{ not json";
  if (v === "dupWrite") return JSON.stringify({ ...base, write: [...base.write, { tool: "Glob", paths: ["/path"] }] }, null, 2);
  if (v === "dupTerminal") return JSON.stringify({ ...base, terminal: [...base.terminal, { tool: "Glob", command: "/command", dialect: "bash" }] }, null, 2);
  return JSON.stringify(base, null, 2);
}

interface Fx {
  cleanups: (() => void)[];
  cp: string;
  install: string;
  outerRepo: string;
  /** Direct form: minimal package folders per variant (one folder serves both modes). */
  direct: Record<Variant, string>;
  /** Installed forms: per package and variant, the installed package folder and the repository it was installed into. */
  installed: Record<PkgName, Record<Variant, { pkg: string; repo: string }>>;
}
let fx: Fx;

function makePackage(classes: string | null): { root: string; cleanup: () => void } {
  const p = makeWorkspace(classes === null ? { "README.md": "pkg\n" } : { "hooks/tool-classes.json": classes });
  mkdirSync(join(p.root, "scripts"));
  copyFileSync(CLI, join(p.root, "scripts", "sdd.mjs"));
  return p;
}

/** `sdd install copilot --package <pkg>` into a fresh fx-cp-install copy; then the variant's classes file. */
function installVariant(mode: Mode, v: Variant, cleanups: (() => void)[]): { pkg: string; repo: string } {
  const repo = makeWorkspace({ ".git/HEAD": "ref: refs/heads/main\n", "README.md": "# fx-cp-install\n" });
  cleanups.push(repo.cleanup);
  const pkg = copilotPackage(mode);
  const r = spawnSync(process.execPath, [CLI, "install", "copilot", "--package", pkg], { cwd: repo.root, encoding: "utf8", env: { ...process.env, SDD_DEBUG: "", SDD_TEST_FAULT: "" } });
  assert.equal(r.status, 0, `install ${mode} ${v}: ${r.stdout}${r.stderr}`);
  const file = join(pkg, "hooks", "tool-classes.json");
  const text = variantClasses(v, JSON.parse(readFileSync(file, "utf8")) as Classes);
  if (text === null) rmSync(file);
  else if (v !== "base") writeFileSync(file, text);
  return { pkg, repo: repo.root };
}

before(() => {
  // fx-cp: a git repository with 2 active changes and src/app.ts (test plan §2).
  const cp = makeWorkspace({ ...minimalChange(), ".sdd/005-y/change.md": "---\nid: CHG-005\ntitle: y\n---\n# CHG-005\n", ".sdd/registry.json": REBUILD, ".git/HEAD": "ref: refs/heads/main\n", "src/app.ts": "export {};\n" });
  // fx-cp-install: a git repository without .sdd/.
  const install = makeWorkspace({ ".git/HEAD": "ref: refs/heads/main\n", "src/app.ts": "export {};\n", "README.md": "# fx-cp-install\n" });
  // fx-outer: `outer` holds .sdd/, the git repository `outer/repo` inside it has none (C002-TC-357).
  const outer = makeWorkspace({ ".sdd/SDD.md": "# SDD workspace\n", "repo/.git/HEAD": "ref: refs/heads/main\n", "repo/src/app.ts": "export {};\n" });
  const cleanups = [cp, install, outer].map((w) => w.cleanup);
  const direct = Object.fromEntries(
    VARIANTS.map((v) => {
      const p = makePackage(variantClasses(v, CLASSES));
      cleanups.push(p.cleanup);
      return [v, p.root];
    }),
  ) as Record<Variant, string>;
  const installed = Object.fromEntries(
    (Object.keys(PKG) as PkgName[]).map((n) => [n, Object.fromEntries(VARIANTS.map((v) => [v, installVariant(PKG[n], v, cleanups)]))]),
  ) as Fx["installed"];
  fx = { cleanups, cp: cp.root, install: install.root, outerRepo: join(outer.root, "repo"), direct, installed };
});

after(() => {
  for (const c of fx.cleanups) c();
  cleanupPackages();
});

interface Result {
  code: number;
  stdout: string;
  stderr: string;
}

function spawn(script: string, args: string[], stdin: string, env: Record<string, string>): Result {
  const r = spawnSync(process.execPath, [script, ...args], {
    cwd: fx.cp,
    env: { ...process.env, SDD_DEBUG: "", SDD_TEST_FAULT: "", ...env },
    encoding: "utf8",
    input: stdin,
  });
  return { code: r.status ?? -1, stdout: r.stdout, stderr: r.stderr };
}

/** The PreToolUse command of C002-IF-008 §4 for a mode. */
const guardArgs = (mode: string) => ["hook", "guard", "--host", "copilot", "--mode", mode, "--agents", AGENTS];
const SESSION_ARGS = ["hook", "session-start", "--host", "copilot"];
const SUBAGENT_ARGS = ["hook", "subagent-stop", "--host", "copilot", "--agents", AUTHORS];

type HookFile = "hooks.json" | "architect-guard.json";

interface Form {
  label: string;
  /** False for the workspace hook file, which holds the PreToolUse entry only. */
  hasSessionHooks: boolean;
  /** The package folder of a row. */
  folder(pkg: PkgName, v: Variant): string;
  /** The CLI copy of the row's package with the given arguments. */
  run(pkg: PkgName, v: Variant, args: string[], stdin: string, env?: Record<string, string>): Result;
  /** The PreToolUse hook command of the package, as the form runs it. */
  guard(pkg: PkgName, stdin: string, v?: Variant, env?: Record<string, string>): Result;
  /** The SessionStart or SubagentStop hook command of the package. */
  event(name: "SessionStart" | "SubagentStop", pkg: PkgName, v: Variant, stdin: string): Result;
}

const DIRECT: Form = {
  label: "direct",
  hasSessionHooks: true,
  folder: (_p, v) => fx.direct[v],
  run: (_p, v, args, stdin, env = {}) => spawn(join(fx.direct[v], "scripts", "sdd.mjs"), args, stdin, env),
  guard: (p, stdin, v = "base", env = {}) => spawn(join(fx.direct[v], "scripts", "sdd.mjs"), guardArgs(PKG[p]), stdin, env),
  event: (name, _p, v, stdin) => spawn(join(fx.direct[v], "scripts", "sdd.mjs"), name === "SessionStart" ? SESSION_ARGS : SUBAGENT_ARGS, stdin, {}),
};

/** The entry of `event` in the installed hook file, split into the CLI copy and its arguments. */
function installedCommand(file: HookFile, event: string, p: PkgName, v: Variant): { script: string; args: string[] } {
  const { pkg, repo } = fx.installed[p][v];
  const path = file === "hooks.json" ? join(pkg, "hooks.json") : join(repo, ".github", "hooks", "architect-guard.json");
  const entries = event === "PreToolUse" ? preToolUse(path) : (JSON.parse(readFileSync(path, "utf8")) as { hooks: Record<string, { command: string }[]> }).hooks[event]!;
  assert.equal(entries.length, 1, `${file} ${event}`);
  const c = splitHookCommand(entries[0]!.command);
  assert.equal(c.script, `${pkg}/scripts/sdd.mjs`, "the absolute path of the package's CLI copy");
  return c;
}

const installedForm = (file: HookFile): Form => ({
  label: `installed ${file}`,
  hasSessionHooks: file === "hooks.json",
  folder: (p, v) => fx.installed[p][v].pkg,
  run: (p, v, args, stdin, env = {}) => spawn(installedCommand(file, "PreToolUse", p, v).script, args, stdin, env),
  guard: (p, stdin, v = "base", env = {}) => {
    const c = installedCommand(file, "PreToolUse", p, v);
    assert.deepEqual(c.args, guardArgs(PKG[p]), "the installed PreToolUse command");
    return spawn(c.script, c.args, stdin, env);
  },
  event: (name, p, v, stdin) => {
    const c = installedCommand(file, name, p, v);
    assert.deepEqual(c.args, name === "SessionStart" ? SESSION_ARGS : SUBAGENT_ARGS, `the installed ${name} command`);
    return spawn(c.script, c.args, stdin, {});
  },
});

/** Copilot PreToolUse input (S-08 §2.3); `agent_type`, `cwd` or `tool_name` left out when ABSENT. */
function input(o: { cwd?: string | typeof ABSENT; agent_type?: unknown; tool_name?: string | typeof ABSENT; tool_input?: Record<string, unknown> }): string {
  const doc: Record<string, unknown> = { hook_event_name: "PreToolUse", session_id: "s-1", timestamp: "2026-10-18T10:00:00.000Z" };
  if (o.cwd !== ABSENT) doc["cwd"] = o.cwd ?? fx.cp;
  if (o.tool_name !== ABSENT) doc["tool_name"] = o.tool_name;
  doc["tool_input"] = o.tool_input ?? {};
  if (o.agent_type !== ABSENT) {
    doc["agent_type"] = o.agent_type;
    doc["agent_id"] = "a-1";
    doc["parent_agent_id"] = "p-1";
  }
  return JSON.stringify(doc);
}

function assertAllow(r: Result, label: string): void {
  assert.deepEqual(r, { code: 0, stdout: "", stderr: "" }, label);
}

/** Exit 2, the deny decision of C002-IF-008 §2 on standard output, its message on standard error. */
function assertDeny(r: Result, contains: string, label: string): void {
  assert.equal(r.code, 2, `${label}: ${r.stdout}${r.stderr}`);
  const message = r.stderr.trimEnd();
  assert.ok(message.includes(contains), `${label}: ${r.stderr}`);
  assert.deepEqual(JSON.parse(r.stdout), {
    hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: message },
    permissionDecision: "deny",
    permissionDecisionReason: message,
  }, label);
  assert.equal(r.stdout.split("\n").filter((l) => l !== "").length, 1, `${label}: one JSON object`);
}

const path = (p: string) => ({ path: p });
const command = (c: string) => ({ command: c });

function cases(F: Form): void {
  const t = (name: string, fn: () => void) => test(`[${F.label}] ${name}`, fn);

  t("C002-TC-312: Architect agent calls under --mode copilot-hooks are decided by the path and bash guard cores", () => {
    const rows: [string, string, Record<string, unknown>, string | null][] = [
      ["sdd-spec-writer", "Write", path(".sdd/002-x/10-spec/a.md"), null],
      ["sdd-spec-writer", "Write", path("src/app.ts"), "GUARD-PATH-001"],
      ["sdd-spec-writer", "Write", path(".sdd/../src/app.ts"), "GUARD-PATH-001"],
      ["architect:sdd-spec-writer", "Write", path("src/app.ts"), "GUARD-PATH-001"],
      ["sdd-spec-writer", "Bash", command("sdd lint 002"), null],
      ["sdd-spec-writer", "Bash", command("npm install"), "GUARD-BASH-001"],
      ["sdd-spec-writer", "Bash", command("git status && rm -rf src"), "GUARD-BASH-002"],
      ["sdd-spec-writer", "Bash", command("sdd install copilot"), "GUARD-BASH-001"],
    ];
    for (const [agent, tool, ti, rule] of rows) {
      const r = F.guard("pkg-cp-hooks", input({ agent_type: agent, tool_name: tool, tool_input: ti }));
      const label = `${agent} ${tool} ${JSON.stringify(ti)}`;
      if (rule === null) assertAllow(r, label);
      else assertDeny(r, rule, label);
    }
    // The memory folder is off on the generated targets (C002-IF-008 §5).
    const memory = F.guard("pkg-cp-hooks", input({ agent_type: "sdd-spec-writer", tool_name: "Write", tool_input: path(".claude/agent-memory/architect-sdd-spec-writer/m.md") }));
    assertDeny(memory, "Architect agents write only inside .sdd/", "memory folder");
  });

  t("C002-TC-314: faults of the Copilot guard hook under --mode copilot-hooks deny with GUARD-HOOK-001", () => {
    const w = (o: Parameters<typeof input>[0]) => input({ agent_type: "sdd-spec-writer", ...o });
    const rows: [string, string, string, Variant?, Record<string, string>?][] = [
      ["not json", "not json", "unreadable hook input"],
      ["empty", "", "unreadable hook input"],
      ["array", "[1]", "unreadable hook input"],
      ["unclassed tool", w({ tool_name: "unknownTool" }), "tool unknownTool is not in the tool classes"],
      ["no cwd", w({ cwd: ABSENT, tool_name: "Write", tool_input: path(".sdd/a.md") }), "no cwd"],
      ["empty cwd", w({ cwd: "", tool_name: "Write", tool_input: path(".sdd/a.md") }), "no cwd"],
      ["no tool name", w({ tool_name: ABSENT }), "no tool name"],
      ["Write without path", w({ tool_name: "Write", tool_input: { file_text: "x" } }), "no path in the tool input"],
      ["classes file missing", w({ tool_name: "Glob" }), "tool classes file unreadable", "noClasses"],
      ["classes file not json", w({ tool_name: "Glob" }), "tool classes file unreadable", "badClasses"],
      ["guard core throws", w({ tool_name: "Write", tool_input: path(".sdd/a.md") }), "internal error", "base", { SDD_TEST_FAULT: "hook-decision-throw" }],
    ];
    for (const [label, stdin, fault, v, env] of rows) {
      const r = F.guard("pkg-cp-hooks", stdin, v ?? "base", env ?? {});
      assertDeny(r, "GUARD-HOOK-001: ", label);
      assert.ok(r.stderr.includes(fault), `${label}: ${r.stderr}`);
    }
  });

  if (F.hasSessionHooks) {
    t("C002-TC-320 and C002-TC-322: hook session-start --host copilot prints the brief, or nothing without .sdd/", () => {
      const r = F.event("SessionStart", "pkg-cp", "base", JSON.stringify({ hook_event_name: "SessionStart", cwd: fx.cp }));
      assert.equal(r.code, 0, r.stderr);
      const lines = r.stdout.split("\n").filter((l) => l !== "");
      assert.ok(lines.length <= 10);
      assert.equal(lines[0], "SDD workspace: 2 active change(s)");
      const none = F.event("SessionStart", "pkg-cp", "base", JSON.stringify({ hook_event_name: "SessionStart", cwd: fx.install }));
      assert.deepEqual(none, { code: 0, stdout: "", stderr: "" });
    });

    t("C002-TC-323: hook subagent-stop refreshes the trace for the author agents in either agent_type form", () => {
      const traces = ["004-x", "005-y"].map((c) => join(fx.cp, ".sdd", c, "trace.json"));
      const rows: [string, boolean][] = [
        ["sdd-spec-writer", true],
        ["sdd-test-designer", true],
        ["sdd-architect", true],
        ["sdd-planner", true],
        ["architect:sdd-planner", true],
        ["sdd-researcher", false],
        ["architect:sdd-researcher", false],
      ];
      for (const [agent, rewritten] of rows) {
        for (const tr of traces) rmSync(tr, { force: true });
        const stdin = JSON.stringify({ hook_event_name: "SubagentStop", agent_type: agent, agent_id: "a-1", agent_name: agent, cwd: fx.cp, stop_reason: "end_turn" });
        const r = F.event("SubagentStop", "pkg-cp", "base", stdin);
        assert.equal(r.code, 0, `${agent}: ${r.stderr}`);
        assert.equal(r.stdout, "", agent);
        for (const tr of traces) assert.equal(existsSync(tr), rewritten, `${agent}: ${tr}`);
      }
    });

    t("C002-TC-324: hook subagent-stop exits 0 when the trace refresh fails", () => {
      const ws = makeWorkspace({ ...minimalChange(), ".sdd/registry.json": "{ not json" });
      try {
        const stdin = JSON.stringify({ hook_event_name: "SubagentStop", agent_type: "sdd-planner", cwd: ws.root });
        assert.equal(F.event("SubagentStop", "pkg-cp", "base", stdin).code, 0);
        writeFileSync(join(ws.root, ".sdd", "004-x", "change.md"), "---\nid: [broken\n---\n");
        assert.equal(F.event("SubagentStop", "pkg-cp", "base", stdin).code, 0);
        // Unreadable input and an unknown option still exit 0 (C002-IF-007 exit codes).
        assert.equal(F.event("SubagentStop", "pkg-cp", "base", "not json").code, 0);
        assert.equal(F.run("pkg-cp", "base", ["hook", "subagent-stop", "--frob"], stdin).code, 0);
      } finally {
        ws.cleanup();
      }
    });
  }

  t("C002-TC-333 and C002-TC-334: read-only calls of an Architect agent pass under the fallback; another letter case is unclassed", () => {
    const rows: [string, Record<string, unknown>][] = [
      ["Glob", { pattern: "src/**" }],
      ["Glob", { pattern: ".sdd/002-x/*.md" }],
      ["tool_search_tool", { query: "sdd-files" }],
      ["context7-query-docs", { query: "node:test" }],
    ];
    for (const [tool, ti] of rows) assertAllow(F.guard("pkg-cp-hooks", input({ agent_type: "sdd-spec-writer", tool_name: tool, tool_input: ti })), tool);
    assertDeny(F.guard("pkg-cp-hooks", input({ agent_type: "sdd-spec-writer", tool_name: "GLOB", tool_input: { pattern: "*" } })), "GUARD-HOOK-001: GLOB denied — tool GLOB is not in the tool classes.", "GLOB");
  });

  t("C002-TC-337 and C002-TC-338: calls without agent_type pass under --mode copilot-hooks, without the tool classes file", () => {
    const rows: [string, Record<string, unknown>][] = [
      ["Write", path("src/app.ts")],
      ["Bash", command("npm install")],
      ["unknownTool", { query: "x" }],
    ];
    for (const [tool, ti] of rows) assertAllow(F.guard("pkg-cp-hooks", input({ agent_type: ABSENT, tool_name: tool, tool_input: ti })), tool);
    assertAllow(F.guard("pkg-cp-hooks", input({ agent_type: ABSENT, tool_name: "Bash", tool_input: command("npm test") }), "noClasses"), "no classes file");
  });

  t("C002-TC-357: write and terminal calls of non-Architect subagents in a repository with .sdd/ are denied with GUARD-HOOK-002, in both modes", () => {
    const rows: [PkgName, string, unknown, string, Record<string, unknown>, string][] = [
      ["pkg-cp", "cp", "general-purpose", "Write", path("src/app.ts"), "general-purpose"],
      ["pkg-cp", "cp", "task", "Bash", command("npm install"), "task"],
      ["pkg-cp", "cp", "general-purpose", "Write", path(".sdd/002-x/10-spec/a.md"), "general-purpose"],
      ["pkg-cp", "cp", "explore", "Bash", command("sdd lint 002"), "explore"],
      ["pkg-cp", "cp", "general-purpose", "sdd-files-write_file", path("src/app.ts"), "general-purpose"],
      ["pkg-cp", "cp", "general-purpose", "sdd-shell-run_command", command("npm test"), "general-purpose"],
      ["pkg-cp", "cp", "my-reviewer", "Write", path("src/app.ts"), "my-reviewer"],
      ["pkg-cp", "cp", "architect:my-reviewer", "Write", path("src/app.ts"), "architect:my-reviewer"],
      ["pkg-cp", "cp", "sdd-unknown", "Bash", command("rm -rf src"), "sdd-unknown"],
      ["pkg-cp", "cp", 42, "Write", path("src/app.ts"), "42"],
      ["pkg-cp", "cp", null, "Write", path("src/app.ts"), "null"],
      ["pkg-cp", "cp/src", "general-purpose", "Write", path("app.ts"), "general-purpose"],
      ["pkg-cp", "outer", "general-purpose", "Write", path("src/app.ts"), "general-purpose"],
      ["pkg-cp-hooks", "cp", "general-purpose", "Write", path("src/app.ts"), "general-purpose"],
      ["pkg-cp-hooks", "cp", "my-reviewer", "Bash", command("npm install"), "my-reviewer"],
      ["pkg-cp-hooks", "cp", 42, "Write", path("src/app.ts"), "42"],
    ];
    const cwds: Record<string, string> = { cp: fx.cp, "cp/src": join(fx.cp, "src"), outer: fx.outerRepo };
    for (const [pkg, cwd, agent, tool, ti, shown] of rows) {
      const r = F.guard(pkg, input({ cwd: cwds[cwd]!, agent_type: agent, tool_name: tool, tool_input: ti }));
      assertDeny(r, `GUARD-HOOK-002: ${tool} denied — subagent ${shown} is not an Architect agent, and this repository contains .sdd/. Allowed: read-only tools.`, `${pkg} ${cwd} ${JSON.stringify(agent)} ${tool}`);
    }
  });

  t("C002-TC-362: faults of the Copilot subagent guard hook deny with GUARD-HOOK-001 and exit 2", () => {
    const session = input({ agent_type: ABSENT, tool_name: "Write", tool_input: path("src/app.ts") });
    // The input's tool name is shown whenever the input is readable (errors.md GUARD-HOOK-001).
    const usageRows: [string[], string, string][] = [
      [["hook", "guard", "--host", "copilot", "--agents", AGENTS], "Write", "hook command usage: --mode"],
      [["hook", "guard", "--host", "copilot", "--mode", "strict", "--agents", AGENTS], "Write", "hook command usage: --mode"],
      [["hook", "guard", "--host", "copilot", "--mode", "sdd-mcp-server"], "Write", "hook command usage: --agents"],
      [["hook", "guard", "--host", "copilot", "--mode", "sdd-mcp-server", "--agents", " , "], "Write", "hook command usage: --agents"],
      // Faults of the command line that the option parser finds are denies too, never usage errors.
      [["hook", "guard", "--host", "copilot", "--agents", AGENTS, "--mode"], "tool call", "hook command usage: "],
      [[...guardArgs("sdd-mcp-server"), "--frob"], "tool call", "hook command usage: "],
      [[...guardArgs("sdd-mcp-server"), "extra"], "tool call", "hook command usage: "],
      // A missing or other --host: C002-TC-368.
    ];
    for (const [args, shown, fault] of usageRows) assertDeny(F.run("pkg-cp", "base", args, session), `GUARD-HOOK-001: ${shown} denied — ${fault}`, args.join(" "));
    // Unreadable input with a usage fault: `tool call`.
    assertDeny(F.run("pkg-cp", "base", ["hook", "guard", "--host", "copilot", "--agents", AGENTS], "not json"), "GUARD-HOOK-001: tool call denied — hook command usage: --mode.", "--mode, not json");

    const gp = (o: Parameters<typeof input>[0]) => input({ agent_type: "general-purpose", ...o });
    const rows: [PkgName, string, string, Variant?, Record<string, string>?][] = [
      ["pkg-cp", "not json", "unreadable hook input"],
      ["pkg-cp", "", "unreadable hook input"],
      ["pkg-cp", gp({ tool_name: "edit", tool_input: path("src/app.ts") }), "tool edit is not in the tool classes"],
      ["pkg-cp", input({ agent_type: "task", tool_name: "Agent", tool_input: { agent_type: "general-purpose", description: "d", name: "n" } }), "tool Agent is not in the tool classes"],
      ["pkg-cp", gp({ tool_name: "my-db-query", tool_input: { q: "x" } }), "tool my-db-query is not in the tool classes"],
      ["pkg-cp", gp({ tool_name: "write", tool_input: path("src/app.ts") }), "tool write is not in the tool classes"],
      ["pkg-cp", gp({ tool_name: ABSENT }), "no tool name"],
      ["pkg-cp", gp({ cwd: ABSENT, tool_name: "Glob" }), "no cwd"],
      ["pkg-cp", gp({ cwd: "", tool_name: "Glob" }), "no cwd"],
      ["pkg-cp", gp({ tool_name: "Glob" }), "tool classes file unreadable", "noClasses"],
      ["pkg-cp", gp({ tool_name: "Glob" }), "tool classes file unreadable", "badClasses"],
      ["pkg-cp", gp({ tool_name: "Glob" }), "workspace lookup failed", "base", { SDD_TEST_FAULT: "hook-lookup-throw" }],
      ["pkg-cp", gp({ tool_name: "Glob" }), "internal error", "base", { SDD_TEST_FAULT: "hook-decision-throw" }],
      ["pkg-cp-hooks", gp({ tool_name: "edit", tool_input: path("src/app.ts") }), "tool edit is not in the tool classes"],
      ["pkg-cp-hooks", input({ agent_type: "my-reviewer", cwd: ABSENT, tool_name: "Glob" }), "no cwd"],
    ];
    for (const [pkg, stdin, fault, v, env] of rows) {
      const r = F.guard(pkg, stdin, v ?? "base", env ?? {});
      assertDeny(r, "GUARD-HOOK-001: ", `${pkg} ${fault}`);
      assert.ok(r.stderr.includes(fault), `${pkg} ${fault}: ${r.stderr}`);
    }
  });

  t("C002-TC-363 and C002-TC-364: read-only calls and calls outside repositories with .sdd/ pass, without reading the classes file there", () => {
    const rows: [PkgName, string, string, string, Record<string, unknown>][] = [
      ["pkg-cp", "cp", "general-purpose", "Glob", { pattern: "src/**" }],
      ["pkg-cp", "cp", "explore", "tool_search_tool", { query: "sdd-files" }],
      ["pkg-cp", "cp", "my-reviewer", "context7-query-docs", { query: "node:test" }],
      ["pkg-cp", "cp/src", "general-purpose", "Glob", { pattern: "*.ts" }],
      ["pkg-cp", "install", "general-purpose", "Write", path("src/app.ts")],
      ["pkg-cp", "install", "task", "Bash", command("npm install")],
      ["pkg-cp", "install", "general-purpose", "edit", path("src/app.ts")],
      ["pkg-cp-hooks", "cp", "general-purpose", "Glob", { pattern: "src/**" }],
      ["pkg-cp-hooks", "install", "my-reviewer", "Write", path("src/app.ts")],
    ];
    const cwds: Record<string, string> = { cp: fx.cp, "cp/src": join(fx.cp, "src"), install: fx.install };
    for (const [pkg, cwd, agent, tool, ti] of rows) assertAllow(F.guard(pkg, input({ cwd: cwds[cwd]!, agent_type: agent, tool_name: tool, tool_input: ti })), `${pkg} ${cwd} ${agent} ${tool}`);
    assertAllow(F.guard("pkg-cp", input({ cwd: fx.install, agent_type: "general-purpose", tool_name: "Bash", tool_input: command("npm test") }), "noClasses"), "TC-364");
  });

  t("C002-TC-365 and C002-TC-366: under --mode sdd-mcp-server calls without agent_type and of Architect agents pass, without the tool classes file", () => {
    const rows: [unknown, string, Record<string, unknown>, boolean?][] = [
      [ABSENT, "Write", path("src/app.ts")],
      [ABSENT, "Bash", command("npm install")],
      [ABSENT, "Write", path("src/app.ts"), true],
      ["sdd-spec-writer", "sdd-files-write_file", path(".sdd/002-x/10-spec/a.md")],
      ["architect:sdd-spec-writer", "sdd-shell-run_command", command("sdd lint 002")],
      ["sdd-critic", "Glob", { pattern: "src/**" }],
      ["sdd-critic", "unknownTool", { query: "x" }],
    ];
    for (const [agent, tool, ti, noCwd] of rows) {
      const stdin = input({ agent_type: agent, tool_name: tool, tool_input: ti, ...(noCwd ? { cwd: ABSENT } : {}) });
      assertAllow(F.guard("pkg-cp", stdin), `${String(agent)} ${tool}`);
      assertAllow(F.guard("pkg-cp", stdin, "noClasses"), `${String(agent)} ${tool} without classes`);
    }
  });

  t("rule 8 table data: JSON pointers with *, always_deny and the strictest dialect (--classes)", () => {
    const ws = makeWorkspace({
      "classes.json": JSON.stringify({
        write: [
          { tool: "multi_edit", paths: ["/edits/*/path"] },
          { tool: "apply_patch", paths: ["/patch"], always_deny: true },
        ],
        terminal: [{ tool: "run_in_terminal", command: "/command" }],
        read_only: ["read_file"],
      }),
    });
    try {
      const decide = (tool: string, ti: Record<string, unknown>) => F.run("pkg-cp-hooks", "base", [...guardArgs("copilot-hooks"), "--classes", join(ws.root, "classes.json")], input({ agent_type: "sdd-planner", tool_name: tool, tool_input: ti }));
      assertAllow(decide("multi_edit", { edits: [{ path: ".sdd/a.md" }, { path: ".sdd/b.md" }] }), "all paths inside .sdd/");
      assertDeny(decide("multi_edit", { edits: [{ path: ".sdd/a.md" }, { path: "src/app.ts" }] }), "GUARD-PATH-001", "one path outside");
      assertDeny(decide("multi_edit", { edits: [] }), "GUARD-HOOK-001: multi_edit denied — no path in the tool input", "no path");
      assertDeny(decide("apply_patch", { patch: ".sdd/a.md" }), "GUARD-PATH-001: apply_patch on (unknown target) denied", "always_deny");
      // strictest (the default): both dialects must allow.
      assertAllow(decide("run_in_terminal", command("sdd lint 002")), "sdd in both dialects");
      assertDeny(decide("run_in_terminal", command("git status")), "GUARD-BASH-001", "git is not allowlisted in PowerShell");
      assertAllow(decide("read_file", { path: "src/app.ts" }), "read_only");
      // A tool this classes file does not name is unclassed.
      assertDeny(decide("Write", path(".sdd/a.md")), "tool Write is not in the tool classes", "Write not in this file");
      // The default --classes is hooks/tool-classes.json of the package (C002-IF-007).
      assert.ok(readFileSync(join(F.folder("pkg-cp-hooks", "base"), "hooks", "tool-classes.json"), "utf8").includes("tool_search_tool"));
    } finally {
      ws.cleanup();
    }
  });

  // C002-TC-367: fault messages for a write tool without a path and an --agents name without sdd-.
  const agentsWithCritic = AGENTS.replace("sdd-critic", "critic");
  const tc367: [string, string, string, Record<string, unknown>, string][] = [
    ["as installed", AGENTS, "sdd-spec-writer", { file_text: "x" }, "no path in the tool input (/path)"],
    ["--agents with critic", agentsWithCritic, "critic", path(".sdd/002-x/10-spec/a.md"), "internal error: agent critic of --agents is not an sdd- agent name"],
    ["--agents with critic", agentsWithCritic, "architect:critic", path("src/app.ts"), "internal error: agent critic of --agents is not an sdd- agent name"],
  ];
  for (const [cmd, agents, agent, ti, fault] of tc367) {
    t(`C002-TS-367 (C002-TC-367): pkg-cp-hooks ${cmd}, agent_type ${agent}, Write ${JSON.stringify(ti)} → ${fault}`, () => {
      const stdin = input({ agent_type: agent, tool_name: "Write", tool_input: ti });
      const r = agents === AGENTS ? F.guard("pkg-cp-hooks", stdin) : F.run("pkg-cp-hooks", "base", ["hook", "guard", "--host", "copilot", "--mode", "copilot-hooks", "--agents", agents], stdin);
      assertDeny(r, `GUARD-HOOK-001: Write denied — ${fault}.`, `${cmd} ${agent}`);
    });
  }

  // C002-TC-368: a --host other than copilot is a usage fault whatever the input; the input's tool name is shown when readable.
  const withHost = (host: string[], mode: Mode) => ["hook", "guard", ...host, "--mode", mode, "--agents", AGENTS];
  const tc368: [PkgName, string, string[], () => string, string][] = [
    ["pkg-cp", "without --host", [], () => input({ agent_type: ABSENT, tool_name: "Write", tool_input: path("src/app.ts") }), "Write"],
    ["pkg-cp", "--host opencode", ["--host", "opencode"], () => input({ agent_type: ABSENT, tool_name: "Write", tool_input: path("src/app.ts") }), "Write"],
    ["pkg-cp", "--host opencode, not json", ["--host", "opencode"], () => "not json", "tool call"],
    ["pkg-cp-hooks", "--host claude", ["--host", "claude"], () => input({ agent_type: "sdd-spec-writer", tool_name: "Write", tool_input: path(".sdd/002-x/10-spec/a.md") }), "Write"],
  ];
  for (const [pkg, label, host, stdin, shown] of tc368) {
    t(`C002-TS-368 (C002-TC-368): ${pkg} ${label} → GUARD-HOOK-001 for ${shown}`, () => {
      const r = F.run(pkg, "base", withHost(host, PKG[pkg]), stdin());
      assertDeny(r, `GUARD-HOOK-001: ${shown} denied — hook command usage: --host.`, `${pkg} ${label}`);
    });
  }

  // C002-TC-369: an Architect agent's tool listed in more than one class takes the most restrictive class (--mode copilot-hooks).
  const tc369: ["write" | "terminal", Record<string, unknown>, string | null][] = [
    ["write", path("src/app.ts"), "GUARD-PATH-001"],
    ["write", path(".sdd/002-x/10-spec/a.md"), null],
    ["write", { pattern: "src/**" }, "GUARD-HOOK-001: Glob denied — no path in the tool input (/path)."],
    ["terminal", command("npm install"), "GUARD-BASH-001"],
  ];
  for (const [cls, ti, rule] of tc369) {
    t(`C002-TS-369 (C002-TC-369): Glob in read_only and ${cls}, sdd-spec-writer ${JSON.stringify(ti)} → ${rule ?? "allow"}`, () => {
      const r = F.guard("pkg-cp-hooks", input({ agent_type: "sdd-spec-writer", tool_name: "Glob", tool_input: ti }), cls === "write" ? "dupWrite" : "dupTerminal");
      if (rule === null) assertAllow(r, cls);
      else assertDeny(r, rule, cls);
    });
  }

  // C002-TC-370: a non-Architect subagent's tool listed as read-only and as write or terminal is denied.
  const tc370: [PkgName, "write" | "terminal"][] = [
    ["pkg-cp", "write"],
    ["pkg-cp", "terminal"],
    ["pkg-cp-hooks", "write"],
  ];
  for (const [pkg, cls] of tc370) {
    t(`C002-TS-370 (C002-TC-370): ${pkg}, Glob in read_only and ${cls}, general-purpose → GUARD-HOOK-002`, () => {
      const r = F.guard(pkg, input({ agent_type: "general-purpose", tool_name: "Glob", tool_input: { pattern: "src/**" } }), cls === "write" ? "dupWrite" : "dupTerminal");
      assertDeny(r, "GUARD-HOOK-002: Glob denied — subagent general-purpose is not an Architect agent", `${pkg} ${cls}`);
    });
  }
}

cases(DIRECT);
cases(installedForm("hooks.json"));
cases(installedForm("architect-guard.json"));
