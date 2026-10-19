// C002-T-038 — doctor host rows, version checks and the toolchain record per host (C002-IF-006;
// C002-REQ-504 … C002-REQ-510, C002-REQ-327): the doctor command and the toolchain record of the
// generated OpenCode and Copilot packages, in each enforcement mode, read back from disk; and the
// Claude Code doctor, whose text does not change (C002-REQ-506, C002-GOAL-05, C002-CON-10; C001-TS-1116
// stays green). Expected values come from the mapping tables and the source plugin, never from a copy.
// The agent behaviour of these texts is graded by the doctor evals under evals/targets/doctor/
// (C002-TC-506 … C002-TC-515, C002-TC-526, C002-TC-639).
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { cpSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { main } from "../../../scripts/generate/main.ts";
import { loadTargetTable, type MappingTable, type Mode, type Target } from "../../../scripts/generate/tables.ts";
import { hostVersionArg } from "../../../scripts/generate/translate/wiring.ts";
import { repoRoot } from "../../helpers.ts";

const root = repoRoot();
const PLUGIN = join(root, "plugins", "architect");
const VERSION = (JSON.parse(readFileSync(join(PLUGIN, ".claude-plugin", "plugin.json"), "utf8")) as { version: string }).version;
const tables: Record<Target, MappingTable> = { opencode: loadTargetTable(root, "opencode"), copilot: loadTargetTable(root, "copilot") };
const MODES: Record<Target, Mode[]> = { opencode: ["native-permissions", "sdd-mcp-server"], copilot: ["sdd-mcp-server", "copilot-hooks"] };
const MODE_NAME: Record<Mode, string> = {
  "native-permissions": "native permission enforcement",
  "sdd-mcp-server": "sdd MCP server enforcement",
  "copilot-hooks": "Copilot hooks fallback",
};
const TOOLS = ["ripwire", "Serena", "ast-grep", "Context7", "DeepWiki"];

/** C002-IF-006 §1: the rows of the doctor table and of toolchain.md, in order. */
function rowsOf(t: Target): string[] {
  const rows = ["node", "git", tables[t].host.name, ...TOOLS, "sdd CLI"];
  return t === "copilot" ? [...rows, "Copilot hooks"] : rows;
}

/** The host-version argument the Copilot doctor uses: the Insiders build while the tested VS Code version is one (C002-IF-007). */
function hostArg(t: Target): string {
  if (t === "opencode") return "opencode";
  return tables.copilot.host.tested_versions["vscode"]!.endsWith("-insider") ? "vscode-insiders" : "vscode";
}

function readTree(dir: string): Map<string, string> {
  const out = new Map<string, string>();
  const walk = (abs: string, rel: string) => {
    for (const name of readdirSync(abs).sort()) {
      const p = join(abs, name);
      const r = rel === "" ? name : `${rel}/${name}`;
      if (statSync(p).isDirectory()) walk(p, r);
      else out.set(r, readFileSync(p, "utf8").replace(/\r\n/g, "\n"));
    }
  };
  walk(dir, "");
  return out;
}

const packages = new Map<string, Map<string, string>>();
/** fx-dist: the package of `t` generated for `mode`, read back from disk (built once per pair). */
function fxDist(t: Target, mode: Mode): Map<string, string> {
  const key = `${t}/${mode}`;
  const hit = packages.get(key);
  if (hit) return hit;
  const base = mkdtempSync(join(tmpdir(), "sdd-fx-doctor-"));
  try {
    const err: string[] = [];
    const code = main(["--target", t, "--mode", `${t}=${mode}`, "--out", join(base, "dist"), "--quiet"], { cwd: root, stdout: () => {}, stderr: (l) => err.push(l) });
    assert.equal(code, 0, err.join("\n"));
    const files = readTree(join(base, "dist", t));
    packages.set(key, files);
    return files;
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
}

const file = (files: Map<string, string>, p: string) => {
  const text = files.get(p);
  assert.ok(text !== undefined, `${p} exists`);
  return text;
};
/** The body of a generated file, after its frontmatter (the command description is not a wiring anchor). */
const bodyOf = (text: string) => (text.startsWith("---\n") ? text.slice(text.indexOf("\n---\n", 4) + 5) : text);
/** Text with runs of white space as one space (wrapped lines compare as one line). */
const flat = (text: string) => text.replace(/\s+/g, " ");
const doctorPath = (t: Target) => `${tables[t].placement["commands_dir"]}/${tables[t].placement["command_file"]!.replace("{name}", "doctor")}`;
const agentPath = (t: Target, name: string) => `${tables[t].placement["agents_dir"]}/${tables[t].placement["agent_file"]!.replace("{name}", name)}`;
const skillPath = (t: Target, name: string) => `${tables[t].placement["skills_dir"]}/${name}/SKILL.md`;

/** The tool names a comma list names after `marker` (up to the next period that ends the list). */
function listAfter(text: string, marker: string): string[] {
  const i = text.indexOf(marker);
  assert.ok(i >= 0, `"${marker}" in the text`);
  const rest = text.slice(i + marker.length).replace(/\s+/g, " ");
  const end = rest.search(/(, in that order| —|\.\s|:\s*$)/);
  return rest
    .slice(0, end < 0 ? undefined : end)
    .replace(/\band\b/g, ",")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** The remedies table rows of a doctor body: tool → [detection, fix]. */
function remedies(body: string): Map<string, [string, string]> {
  const lines = body.split("\n");
  const head = lines.findIndex((l) => /^\| Tool \| Detection \|/.test(l));
  assert.ok(head >= 0, "remedies table");
  const out = new Map<string, [string, string]>();
  for (let i = head + 2; i < lines.length && lines[i]!.startsWith("|"); i++) {
    const [tool, detection, fix] = lines[i]!.split(" | ").map((c) => c.replace(/^\|\s*|\s*\|$/g, "").trim());
    out.set(tool!, [detection!, fix!]);
  }
  return out;
}

/** The outcome lines of step 4: the backticked `Doctor: …` lines. */
const outcomes = (body: string) => [...body.matchAll(/^\s+- `(Doctor: [^`]+)`/gm)].map((m) => m[1]);

// --- Claude Code: the source doctor text does not change (C002-REQ-506, C002-CON-10) ---
test("C002-REQ-506: the Claude Code doctor command is byte-unchanged — eight rows, the minimum-version row, three outcome lines", () => {
  const text = readFileSync(join(PLUGIN, "commands", "doctor.md"), "utf8").replace(/\r\n/g, "\n");
  // SHA-256 of commands/doctor.md at C002-T-037 (CHG-001 text; LF line endings).
  assert.equal(createHash("sha256").update(text).digest("hex"), "29573c31c4feb4f25f9aa452f3a24ce78d1a180113032aac8d668e6b463ffaf9");
  assert.ok(text.includes("one row each for node, git, Claude Code, ripwire, Serena, ast-grep,\n   Context7, DeepWiki with detected"), "the eight rows of today");
  const r = remedies(text);
  assert.deepEqual(r.get("Claude Code")?.[0], "`claude --version` ≥ 2.1.295");
  assert.ok(r.get("Claude Code")![1].startsWith("`claude update`"));
  assert.ok(!r.has("sdd CLI") && !r.has("Copilot hooks"), "no generated-target rows");
  assert.ok(text.includes("- Claude Code: `error` below 2.1.295 (`claude --version`)."));
  assert.deepEqual(outcomes(text), ["Doctor: failed: node ≥ 20 required", "Doctor: completed with warnings", "Doctor: completed"]);
  assert.ok(!text.includes("untested") && !text.includes("host-version"));
});

for (const t of ["opencode", "copilot"] as const) {
  const host = tables[t].host;
  const arg = hostArg(t);
  for (const mode of MODES[t]) {
    const where = `${t} [${mode}]`;

    test(`C002-REQ-504 ${where}: the doctor probes and reports node, git, ${host.name}, the five tools, the sdd CLI${t === "copilot" ? " and Copilot hooks" : ""}, in order; no Claude Code row`, () => {
      const body = bodyOf(file(fxDist(t, mode), doctorPath(t)));
      const expected = rowsOf(t);
      // Step 2 (probe) and step 3 (report) name the same rows in the same order.
      const probe = listAfter(body, "one row each for ");
      assert.deepEqual(probe.slice(0, expected.length), expected, "probe rows");
      assert.deepEqual(listAfter(body, "the order above: "), expected, "report rows");
      assert.ok(flat(body).includes("Status: `ok`, `missing`, `unreachable` (remote servers), `error`"));
      assert.ok(flat(body).includes("`untested` (a host version other than the tested one)"), "status untested (C002-REQ-508)");
      assert.ok(!body.includes("Claude Code") && !body.includes("claude --version"), "no Claude Code row or probe (C002-REQ-506)");
      assert.ok(body.includes("`node --version`"), "node probe of the generated targets (C002-IF-006 §2)");
      assert.ok(body.includes("sdd serena-config --user-data"), "Serena step with the per-user data folder (C002-IF-006 §4)");
    });

    test(`C002-REQ-508 ${where}: the host row is read through \`sdd host-version ${arg}\` and compared with the tested version(s) of the table`, () => {
      const body = bodyOf(file(fxDist(t, mode), doctorPath(t)));
      assert.ok(body.includes(`\`sdd host-version ${arg}\``));
      for (const other of ["opencode", "vscode", "vscode-insiders"].filter((a) => a !== arg)) assert.ok(!body.includes(`sdd host-version ${other}\``), `no probe of ${other}`);
      assert.ok(!/`(opencode|code|code-insiders) --version`/.test(body), "the host itself is never probed (C002-IF-006 §2)");
      const row = remedies(body).get(host.name);
      assert.ok(row, "remedies row of the host");
      if (t === "opencode") {
        const v = host.tested_versions["opencode"]!;
        assert.equal(row[0], `\`sdd host-version opencode\` = ${v}`);
        assert.equal(row[1], `tested version: ${v}`);
        assert.ok(body.includes(`\`ok\` when \`sdd host-version opencode\` prints \`opencode ${v}\`; \`untested\` when it prints another version`));
        assert.ok(body.includes("`missing` when it prints `opencode missing`"));
      } else {
        const [vs, chat] = [host.tested_versions["vscode"]!, host.tested_versions["copilot-chat"]!];
        assert.equal(row[1], `tested versions: VS Code ${vs}, GitHub Copilot Chat ${chat}`);
        assert.ok(body.includes("Version shows both parts, `VS Code <vscode>, GitHub Copilot Chat <copilot-chat>`"), "both versions in the Version column (C002-REQ-504)");
        assert.ok(body.includes(`\`ok\` when VS Code is ${vs} and GitHub Copilot Chat is ${chat}; \`untested\` when either differs`));
        assert.ok(body.includes("`missing` when it prints `vscode missing`"));
      }
    });

    test(`C002-REQ-509 ${where}: the sdd CLI row is an exact major.minor.patch check with the install command for ${VERSION}`, () => {
      const body = bodyOf(file(fxDist(t, mode), doctorPath(t)));
      const row = remedies(body).get("sdd CLI");
      assert.ok(row, "remedies row of the sdd CLI");
      assert.equal(row[1], `\`npm install -g architect-sdd@${VERSION}\``);
      assert.ok(row[0].startsWith(`\`sdd --version\` = ${VERSION}`));
      assert.ok(body.includes(`\`ok\` when the major, minor and patch numbers that \`sdd --version\` prints all equal those of ${VERSION}; \`error\` when any of the three differs, older or newer`));
      assert.ok(body.includes("`missing` when `sdd --version` does not run or is not found"));
    });

    test(`C002-REQ-505 ${where}: four outcome lines; an unreachable sdd CLI fails the run, untested and error are warnings`, () => {
      const body = bodyOf(file(fxDist(t, mode), doctorPath(t)));
      assert.deepEqual(outcomes(body), ["Doctor: failed: node ≥ 20 required", "Doctor: failed: sdd CLI not reachable", "Doctor: completed with warnings", "Doctor: completed"]);
      assert.ok(body.includes("when both failure conditions hold,\n   the node line"), "node line first (C002-IF-006 §3)");
      assert.ok(body.includes("any other row not `ok` (`untested` and `error` included)"));
    });

    test(`C002-IF-006 §2 ${where}: a probe refused for a .cmd shim is \`error\` with the native-install fix; ast-grep's names a native installer`, () => {
      const body = bodyOf(file(fxDist(t, mode), doctorPath(t)));
      assert.ok(body.includes("refused with ERR-MCP-006 because only a `.cmd` or `.bat` shim was found"));
      assert.ok(body.includes("status `error`, version `—`, its fallback, and the Fix `install a native executable of <tool>`"));
      assert.ok(body.includes(`this package uses ${MODE_NAME[mode]}`), "the package's own mode is named");
      assert.ok(body.includes("A probe refused because the executable is not found: `missing`."));
      const native = remedies(body).get("ast-grep (native executable)");
      assert.ok(native && /^`pip install ast-grep-cli`/.test(native[1]), "native ast-grep installer");
      assert.ok(!native[1].startsWith("`npm install"), "not the npm shim install");
      assert.ok(remedies(body).get("ast-grep")?.[1] === "`npm install -g @ast-grep/cli`", "the plain ast-grep row is kept");
    });

    if (t === "copilot")
      test(`C002-REQ-510, C002-IF-006 §2 ${where}: the Copilot hooks row in this mode — \`ok\` for hooks enabled with the caveat Version text, \`error\` for disabled and unknown`, () => {
        const body = bodyOf(file(fxDist(t, mode), doctorPath(t)));
        assert.ok(body.includes("Copilot hooks, in both enforcement modes (the subagent guard hook is a PreToolUse hook in both)"));
        // P-01 "ok + caveat" (D-012), the Version text names what is not read (critic CR-45).
        assert.ok(body.includes("- `hooks enabled`: `ok`, Version `chat.useHooks on; profile and .code-workspace settings, Workspace Trust and organisation policy not read, confirmed by the manual VS Code checklist`, Fix empty;"));
        assert.ok(body.includes("- `hooks disabled (chat.useHooks)`: `error`, Version `disabled (chat.useHooks)`, Fix `enable chat.useHooks and trust the workspace`;"));
        assert.ok(body.includes("- `hooks unknown`, or no `hooks` line: `error`, Version `cannot be read`, Fix `check chat.useHooks and Workspace Trust by hand`."));
        assert.ok(!body.includes("Workspace Trust and policy cannot be read"), "the earlier error text for hooks enabled is gone");
        const row = remedies(body).get("Copilot hooks");
        assert.ok(row, "remedies row");
        assert.ok(row[0].includes("`chat.useHooks` on; profile and `.code-workspace` settings, Workspace Trust and organisation policy not read"), row[0]);
        assert.ok(row[1].includes("`enable chat.useHooks and trust the workspace`") && row[1].includes("`check chat.useHooks and Workspace Trust by hand`"));
      });

    test(`C002-REQ-507 ${where}: the toolchain record has the doctor table's rows, in the skill and in the cartographer that inlines it`, () => {
      const files = fxDist(t, mode);
      const expected = rowsOf(t);
      for (const p of [skillPath(t, "code-discovery"), agentPath(t, "sdd-cartographer")]) {
        const text = file(files, p);
        const i = text.indexOf("**Toolchain record**");
        assert.ok(i >= 0, `${p}: toolchain record`);
        const part = text.slice(i, text.indexOf("\n- **", i + 1));
        assert.deepEqual(listAfter(part, "one row per"), expected, `${p}: rows`);
        assert.ok(part.includes("detected (yes/no), version, path or endpoint, fallback in use"));
        assert.ok(part.includes(`\`sdd host-version ${arg}\``) && part.includes("`sdd --version`"));
        assert.ok(!part.includes("Claude Code"));
      }
    });
  }
}

// --- {{host_version_arg}}: the Copilot doctor reads the VS Code build of the tested version ---
test("C002-IF-007: the Copilot doctor probes `vscode-insiders` while the tested VS Code version is an Insiders build, else `vscode`", () => {
  const cp = tables.copilot;
  assert.equal(hostVersionArg(tables.opencode), "opencode");
  assert.equal(hostVersionArg(cp), cp.host.tested_versions["vscode"]!.endsWith("-insider") ? "vscode-insiders" : "vscode");
  assert.equal(hostVersionArg({ target: "copilot", host: { ...cp.host, tested_versions: { vscode: "1.142.0-insider", "copilot-chat": "0.35.3" } } }), "vscode-insiders");
  assert.equal(hostVersionArg({ target: "copilot", host: { ...cp.host, tested_versions: { vscode: "1.105.1", "copilot-chat": "0.32.4" } } }), "vscode");
  // End to end: a copy of the source plugin whose Copilot table records the stable fixture versions of C002-TS-513.
  const base = mkdtempSync(join(tmpdir(), "sdd-fx-doctor-stable-"));
  try {
    const src = join(base, "src", "plugins", "architect");
    cpSync(PLUGIN, src, { recursive: true });
    const tablePath = join(src, "targets", "copilot.json");
    const data = JSON.parse(readFileSync(tablePath, "utf8")) as MappingTable;
    data.host.tested_versions = { vscode: "1.105.1", "copilot-chat": "0.32.4" };
    writeFileSync(tablePath, JSON.stringify(data, null, 2) + "\n");
    const err: string[] = [];
    const code = main(["--source", src, "--target", "copilot", "--out", join(base, "dist"), "--quiet"], { cwd: root, stdout: () => {}, stderr: (l) => err.push(l) });
    assert.equal(code, 0, err.join("\n"));
    const body = bodyOf(readTree(join(base, "dist", "copilot")).get(doctorPath("copilot"))!);
    assert.ok(body.includes("`sdd host-version vscode`") && !body.includes("vscode-insiders"));
    assert.equal(remedies(body).get(cp.host.name)?.[1], "tested versions: VS Code 1.105.1, GitHub Copilot Chat 0.32.4");
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});
