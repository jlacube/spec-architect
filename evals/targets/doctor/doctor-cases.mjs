// Shared setup of the CHG-002 doctor cases (C002-T-038; C002-IF-006): the doctor command per host on a
// machine configuration (evals/harness/machines.mjs, tests/fixtures/cfg-README.md), with a workspace whose
// constitution is approved so toolchain.md can be written, and graders that read the doctor table, its
// outcome line and the toolchain record per host.
//
// Hosts. `claude-code` rows run on the existing harness (`run.mjs <files> --only <ids> --auth
// subscription`, C002-T-038 step 4). `opencode` rows are run by C002-T-056 through the OpenCode runner
// of C002-T-044 (`run.mjs --host opencode`), `copilot-cli` rows by C002-T-045; the `host` field
// selects them and the fields below follow the existing case API (agent, prompt, env, fixture,
// allowTools in Claude Code names, assert). Fields the generated-target runners read in addition:
//   targetPackage  { target, mode, tested_versions?, version? } — the package to generate for the
//                  session: `mode` is the enforcement mode (`--mode <target>=<mode>`); `tested_versions`
//                  and `version` replace `host.tested_versions` and the package version in a copy of the
//                  mapping table and plugin manifest (the fixture of C002-TS-513 and C002-TS-515);
//   mcpOverrides   { <server>: <url> } — a remote MCP server URL replaced in the generated config
//                  (the cfg-deepwiki-down row of C002-TS-509 on OpenCode).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { finalReply } from "../../harness/assert.mjs";
import { ROOT } from "../../harness/fixtures.mjs";
import { machine } from "../../harness/machines.mjs";
import { MCP, SERENA, workspace } from "../../cap11/doctor.mjs";

const TOOLS5 = ["ripwire", "Serena", "ast-grep", "Context7", "DeepWiki"];

/** Per host: the main-thread agent, the doctor prompt and the rows of C002-IF-006 §1, in order. */
export const HOSTS = {
  "claude-code": { agent: "architect:sdd-conductor", prompt: "/architect:doctor", host: "Claude Code", rows: ["node", "git", "Claude Code", ...TOOLS5] },
  opencode: { agent: "sdd-conductor", prompt: "/architect-doctor", host: "OpenCode", rows: ["node", "git", "OpenCode", ...TOOLS5, "sdd CLI"] },
  // Copilot CLI: the doctor prompt file of the Copilot package (prompts/doctor.prompt.md); C002-T-045
  // confirms how Copilot CLI 1.0.98 invokes a plugin prompt and adapts `prompt` if needed.
  "copilot-cli": {
    agent: "architect:sdd-conductor",
    prompt: "/doctor",
    host: "VS Code with GitHub Copilot Chat",
    rows: ["node", "git", "VS Code with GitHub Copilot Chat", ...TOOLS5, "sdd CLI", "Copilot hooks"],
  },
};

const ALL_ROWS = [...new Set(Object.values(HOSTS).flatMap((h) => h.rows))];
const clean = (s) => String(s ?? "").replace(/[`*]/g, "").trim();
const same = (a, b) => clean(a).toLowerCase() === b.toLowerCase();

/** Doctor table rows of the reply, every host's row names: `{ tool, status, version, fallback, fix }`. */
export function tableRows(transcript) {
  const rows = [];
  for (const line of finalReply(transcript).split(/\r?\n/)) {
    if (!/^\s*\|/.test(line)) continue;
    const c = line.trim().replace(/^\||\|$/g, "").split("|").map((x) => x.trim());
    const tool = ALL_ROWS.find((t) => same(c[0], t));
    if (tool) rows.push({ tool, status: clean(c[1]).toLowerCase(), version: c[2] ?? "", fallback: c[3] ?? "", fix: clean(c.slice(4).join(" | ")) });
  }
  return rows;
}

/** The header cells of the doctor table (the first table row whose first cell is "Tool"). */
export function tableHeader(transcript) {
  const line = finalReply(transcript)
    .split(/\r?\n/)
    .find((l) => /^\s*\|\s*\**Tool\**\s*\|/i.test(l));
  return line ? line.trim().replace(/^\||\|$/g, "").split("|").map(clean) : null;
}

/** The outcome line of the reply (the last `Doctor: …` line). */
export function outcomeOf(transcript) {
  const all = [...finalReply(transcript).matchAll(/Doctor:\s*(completed with warnings|completed|failed: node ≥ 20 required|failed: sdd CLI not reachable)/g)];
  return all.length > 0 ? all[all.length - 1][1] : null;
}

/** An empty Fix cell: nothing, or a dash. */
export const emptyFix = (fix) => /^[\s—–-]*$/.test(clean(fix));

/**
 * Rows of `.sdd/_constitution/toolchain.md`: `{ tool, detected, version, path, fallback }` by its header
 * (Detected, Version, Path or endpoint, Fallback), or `{ problem }` when the file or a column is missing.
 */
export function toolchainRows(root) {
  const file = join(root, ".sdd", "_constitution", "toolchain.md");
  if (!existsSync(file)) return { problem: `${file} not written` };
  const lines = readFileSync(file, "utf8").split(/\r?\n/).filter((l) => /^\s*\|/.test(l));
  const cells = (l) => l.trim().replace(/^\||\|$/g, "").split("|").map((x) => x.trim());
  const head = lines.map(cells).find((c) => c.some((x) => /detected/i.test(x)));
  if (!head) return { problem: "toolchain.md: no table with a Detected column" };
  const col = (re) => head.findIndex((x) => re.test(clean(x)));
  const idx = { detected: col(/detected/i), version: col(/version/i), path: col(/path|endpoint/i), fallback: col(/fallback/i) };
  const missing = Object.entries(idx).filter(([, i]) => i < 0).map(([k]) => k);
  if (missing.length > 0) return { problem: `toolchain.md: no column for ${missing.join(", ")} (header ${JSON.stringify(head)})` };
  const rows = [];
  for (const c of lines.map(cells)) {
    if (c.some((x) => /^detected$/i.test(clean(x)))) continue; // a header row ("Node | Detected | …")
    const tool = ALL_ROWS.find((t) => same(c[0], t));
    if (tool) rows.push({ tool, detected: clean(c[idx.detected]), version: clean(c[idx.version]), path: clean(c[idx.path]), fallback: clean(c[idx.fallback]) });
  }
  return { rows };
}

/**
 * A folder of version shims for one case (sh scripts for Git Bash and `.cmd` files for Windows):
 * `opencode` and `claude` print the given version for `--version`; `sdd` prints the given version for
 * `--version` and runs the real CLI of this repository for every other command; `code` ({ vscode,
 * chat }) answers `--version` and `--list-extensions --show-versions`; `astGrepCmdOnly` writes
 * an `ast-grep.cmd` and no native `ast-grep` (C002-TS-639).
 */
export function shims(name, { opencode, sdd, claude, code, astGrepCmdOnly = false } = {}) {
  const dir = join(tmpdir(), "sdd-eval-shims", name);
  mkdirSync(dir, { recursive: true });
  const cli = join(ROOT, "plugins", "architect", "scripts", "sdd.mjs");
  const sh = (file, body) => writeFileSync(join(dir, file), `#!/bin/sh\n# Version shim of ${name} (evals/targets/doctor/doctor-cases.mjs).\n${body}`, { mode: 0o755 });
  const cmd = (file, body) => writeFileSync(join(dir, file), `@echo off\r\nrem Version shim of ${name} (evals/targets/doctor/doctor-cases.mjs).\r\n${body.split("\n").join("\r\n")}`);
  const versionOnly = (tool, v) => {
    sh(tool, `case "$1" in\n  --version|-v) echo "${v}"; exit 0 ;;\nesac\necho "${tool} shim: only --version is supported" >&2\nexit 1\n`);
    cmd(`${tool}.cmd`, `if "%~1"=="--version" (\n  echo ${v}\n  exit /b 0\n)\necho ${tool} shim: only --version is supported 1>&2\nexit /b 1\n`);
  };
  if (opencode) versionOnly("opencode", opencode);
  if (claude) versionOnly("claude", `${claude} (Claude Code)`);
  if (sdd) {
    sh("sdd", `case "$1" in\n  --version) echo "${sdd}"; exit 0 ;;\nesac\nexec node "${cli.split("\\").join("/")}" "$@"\n`);
    cmd("sdd.cmd", `if "%~1"=="--version" (\n  echo ${sdd}\n  exit /b 0\n)\nnode "${cli}" %*\nexit /b %ERRORLEVEL%\n`);
  }
  if (code) {
    // VS Code (`code`): the version lines and the extension list, shaped like the real CLI (cfg-hosts).
    const ext = ["GitHub.copilot@1.388.0", ...(code.chat ? [`GitHub.copilot-chat@${code.chat}`] : [])];
    sh("code", `case "$1" in\n  --version) printf '${code.vscode}\\n0123456789abcdef0123456789abcdef01234567\\nx64\\n'; exit 0 ;;\n  --list-extensions) printf '${ext.join("\\n")}\\n'; exit 0 ;;\nesac\necho "code shim: unsupported arguments" >&2\nexit 1\n`);
    cmd("code.cmd", `if "%~1"=="--version" (\n  echo ${code.vscode}\n  echo 0123456789abcdef0123456789abcdef01234567\n  echo x64\n  exit /b 0\n)\nif "%~1"=="--list-extensions" (\n${ext.map((e) => `  echo ${e}`).join("\n")}\n  exit /b 0\n)\necho code shim: unsupported arguments 1>&2\nexit /b 1\n`);
  }
  if (astGrepCmdOnly) cmd("ast-grep.cmd", `if "%~1"=="--version" (\n  echo ast-grep 0.42.3\n  exit /b 0\n)\nexit /b 1\n`);
  return dir;
}

/**
 * Scenario fields of a doctor run on `host` and machine configuration `cfg`: `prepend` adds shim
 * folders before the configuration's PATH, `without` drops tools from it (`ast-grep`), `env` adds
 * variables, `extra` overrides any field.
 */
export function doctorCase(host, cfg, { prepend = [], without = [], env = {}, ...extra } = {}) {
  const h = HOSTS[host];
  const m = machine(cfg, { prepend, without });
  const base = {
    agent: h.agent,
    env: { ...m.env, ...env },
    fixture: workspace,
    allowTools: ["Agent", "Write", "Edit", "Bash", "ToolSearch", "LSP", ...SERENA, ...MCP],
    maxTurns: 30,
    maxBudgetUsd: 0.5,
    prompt: h.prompt,
  };
  if (host === "claude-code") return { ...base, plugins: m.plugins, startDelayMs: 15000, ...extra };
  return { ...base, host, ...extra };
}
