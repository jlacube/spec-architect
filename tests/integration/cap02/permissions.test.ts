// C002-T-030 — the OpenCode permission rules (C002-IF-001 §6.3, C002-IF-005 §2) and the quick-lint plugin
// on fx-dist: `dist/opencode/` generated into a temporary folder for each enforcement mode
// (`--mode opencode=<mode>`) and read back from disk; the rules also generated from the fixture tables of
// both modes. Expected values come from the mapping tables and from the guard's exported allowlist data,
// never from a copy (C002-CAP-01 acceptance, verification note; C002-CON-06).
//   C002-TC-208 (C002-TS-208)  @mode-native: edit rules allow .sdd/ only, for each of the ten agents
//   C002-TC-210 (C002-TS-210)  no top-level permission key, agent entries for the ten only
//   C002-TC-212 (C002-TS-212)  @mode-server: edit and bash denied to each of the ten agents
//   C002-TC-214 (C002-TS-214)  @mode-server: sdd-files and sdd-shell declared, no other sdd-mcp entry
//   C002-TC-224 (C002-TS-224)  @mode-server, fx-dist-bad: the sdd-shell entry removed is reported (TGT-MCP-001)
//   C002-TC-228 (C002-TS-228)  question: allow for the conductor, deny for every specialist, in both modes
// Beside them: the bash rules of native enforcement (C002-REQ-207), the table checks (ERR-GEN-004) and
// the quick-lint plugin (C002-REQ-215). Carried: C002-TC-229 (TGT-PERM-001, C002-T-035); C002-TC-207,
// 209, 211, 213, 222, 223 need an OpenCode host (tests/replay/scenarios/opencode-host.test.ts, C002-T-042);
// C002-TC-230 is an eval (C002-T-044, C002-T-056).
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { emitOpenCode, openCodePackageFindings } from "../../../scripts/generate/emit/opencode.ts";
import { agentPermission, bashRules, editRules, GLOB_GAPS, globGaps, permissionTableDiagnostics, SDD_PATTERN } from "../../../scripts/generate/emit/opencode-permissions.ts";
import { emitsQuickLint, QUICK_LINT_PLUGIN, quickLintPlugin } from "../../../scripts/generate/emit/opencode-quicklint.ts";
import { main } from "../../../scripts/generate/main.ts";
import { readSource } from "../../../scripts/generate/reader.ts";
import { loadTable, loadTargetTable, type MappingTable, type Mode } from "../../../scripts/generate/tables.ts";
import { CONDUCTOR, translateAgents } from "../../../scripts/generate/translate/frontmatter.ts";
import { WRITING_COMMANDS } from "../../../src/cli/writing-commands.ts";
import { decideBash, GIT_OUTPUT_OPTIONS, GIT_READ, RIPWIRE_FLAG_VERBS, RIPWIRE_VALUE_VERBS, VERSION_PROBES } from "../../../src/hooks/guard-bash.ts";
import { repoRoot } from "../../helpers.ts";

const root = repoRoot();
const read = readSource(join(root, "plugins", "architect"));
assert.deepEqual(read.diagnostics, []);
const source = read.source;
const table = loadTargetTable(root, "opencode");
const copilot = loadTargetTable(root, "copilot");
const MODES: Mode[] = ["native-permissions", "sdd-mcp-server"];
const fixtureTable = (mode: Mode): MappingTable => loadTable(join(root, "tests", "fixtures", "targets", `opencode-${mode}.json`));
const agentNames = source.agents.map((a) => a.name).sort();
const specialists = agentNames.filter((n) => n !== CONDUCTOR);
const CONFIG = table.placement["config_file"]!;

type Permission = Record<string, unknown>;
interface Config {
  mcp: Record<string, { type: string; command?: string[] }>;
  agent: Record<string, { tools: Record<string, boolean>; permission: Permission }>;
  permission?: unknown;
}

function readTree(dir: string): Map<string, string> {
  const out = new Map<string, string>();
  const walk = (abs: string, rel: string) => {
    for (const name of readdirSync(abs).sort()) {
      const p = join(abs, name);
      const r = rel === "" ? name : `${rel}/${name}`;
      if (statSync(p).isDirectory()) walk(p, r);
      else out.set(r, readFileSync(p, "utf8"));
    }
  };
  walk(dir, "");
  return out;
}

/** fx-dist: `npm run package` for the OpenCode target with `--mode opencode=<mode>`, read back from disk. */
const packages = new Map<Mode, Map<string, string>>();
function fxDist(mode: Mode): Map<string, string> {
  const hit = packages.get(mode);
  if (hit) return hit;
  const base = mkdtempSync(join(tmpdir(), "sdd-fx-perm-"));
  try {
    const err: string[] = [];
    const code = main(["--target", "opencode", "--mode", `opencode=${mode}`, "--out", join(base, "dist"), "--quiet"], { cwd: root, stdout: () => {}, stderr: (l) => err.push(l) });
    assert.equal(code, 0, err.join("\n"));
    const files = readTree(join(base, "dist", "opencode"));
    packages.set(mode, files);
    return files;
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
}
const config = (files: Map<string, string>) => JSON.parse(files.get(CONFIG)!) as Config;
/** A rule map as an ordered list of [pattern, action] (JSON.parse keeps the file's key order). */
const ordered = (v: unknown) => Object.entries(v as Record<string, string>);
const tableRules = (t: MappingTable, key: "edit" | "bash"): [string, string][] => (t.permissions!["native-permissions"][key] as { pattern: string; action: string }[]).map((r) => [r.pattern, r.action]);

/** OpenCode's wildcard match (`*` crosses `/` and spaces; a trailing ` *` may match nothing), C002-R-001 C-01. */
function globMatch(pattern: string, text: string): boolean {
  let re = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replaceAll("*", ".*");
  if (re.endsWith(" .*")) re = `${re.slice(0, -3)}( .*)?`;
  return new RegExp(`^${re}$`, "s").test(text);
}
/** The decision of an ordered rule map on one command part: the last matching rule wins. */
function decide(rules: [string, string][], text: string): string | undefined {
  let out: string | undefined;
  for (const [p, a] of rules) if (globMatch(p, text)) out = a;
  return out;
}

test("C002-TC-208 (C002-TS-208) @mode-native: each of the ten Architect agents has edit rules that allow .sdd/ and deny every other path", () => {
  const c = config(fxDist("native-permissions"));
  assert.deepEqual(Object.keys(c.agent).sort(), agentNames);
  for (const name of agentNames) {
    const edit = ordered(c.agent[name]!.permission["edit"]);
    assert.deepEqual(edit, tableRules(table, "edit"), `${name}: the edit rules of the table`);
    assert.deepEqual(edit, [["*", "deny"], [SDD_PATTERN, "allow"]], `${name}: catch-all deny first, then .sdd/*`);
    assert.equal(decide(edit, ".sdd/002-x/10-spec/a.md"), "allow", name);
    for (const p of ["src/app.ts", "README.md", ".claude/agent-memory/architect-sdd-cartographer/MEMORY.md", "src/.sdd/a.md"]) assert.equal(decide(edit, p), "deny", `${name}: ${p}`);
    assert.equal(c.agent[name]!.permission["external_directory"], "deny", `${name}: a path outside the project is denied first`);
  }
});

test("C002-REQ-207 @mode-native: the bash rules are generated from the guard's allowlist data, in last-match-wins order", () => {
  const c = config(fxDist("native-permissions"));
  const generated: [string, string][] = bashRules().map((r) => [r.pattern, r.action]);
  assert.deepEqual(generated, tableRules(table, "bash"), "the table states the generated rules");
  assert.deepEqual(generated[0], ["*", "deny"], "the catch-all comes first");
  for (const name of agentNames) assert.deepEqual(ordered(c.agent[name]!.permission["bash"]), generated, `${name}: the generated rules, in order`);
  const allows = new Set(generated.filter(([, a]) => a === "allow").map(([p]) => p));
  for (const v of GIT_READ) assert.ok(allows.has(`git ${v} *`), `git ${v}`);
  for (const v of RIPWIRE_VALUE_VERBS) assert.ok(allows.has(`ripwire *${v}=*`), v);
  for (const v of RIPWIRE_FLAG_VERBS) assert.ok(allows.has(`ripwire *${v}*`), v);
  for (const p of VERSION_PROBES) assert.ok(allows.has(p.join(" ")), p.join(" "));
  assert.equal(generated.filter(([p]) => /sdd\.mjs|^node (?!-v$|--version$)/.test(p)).length, 0, "no rule for the script form node <path>/sdd.mjs");
  assert.equal(GIT_OUTPUT_OPTIONS.length, generated.filter(([p, a]) => a === "deny" && p.startsWith("git * ")).length, "one deny per git output option");
  for (const w of WRITING_COMMANDS.filter((x) => x.guard === "deny")) assert.ok(generated.some(([p, a]) => a === "deny" && p === `sdd ${w.name.split(" ")[0]} *`), w.name);
  assert.deepEqual(generated.at(-1), ["sdd *--cwd*", "deny"], "--cwd denied after every sdd allow");

  // The forms the generated agents send are allowed and agree with the guard; what the guard refuses and a glob can name is denied.
  const guard = (command: string) => decideBash({ hook_event_name: "PreToolUse", agent_type: "architect:sdd-planner", tool_name: "Bash", tool_input: { command }, cwd: root }).allow;
  for (const cmd of ["sdd lint 002", "git log --oneline -5", "node --version", "node -v", "ripwire --for=x --max-tokens=2000", "ast-grep run --pattern 'f($A)' --lang ts", "sdd serena-config --user-data", "sdd serena-launch --user-data --read-only -- start-mcp-server --context ide", "sdd serena-launch --user-data -- start-mcp-server"]) {
    assert.equal(decide(generated, cmd), "allow", cmd);
    assert.equal(guard(cmd), true, `the guard allows ${cmd}`);
  }
  for (const cmd of ["npm install", "rm -rf src", "Remove-Item -Recurse src", "git log -o out.txt", "git diff --output=x", "git log --ext-diff", "ast-grep run --pattern x --rewrite y", "ast-grep run --pattern x -U", "ast-grep run src", "sdd install copilot", "sdd trace 001 --write --cwd ../other-repo", "sdd serena-config ./data", "curl http://x"]) {
    assert.equal(decide(generated, cmd), "deny", cmd);
    assert.equal(guard(cmd), false, `the guard denies ${cmd}`);
  }
  // A listed glob gap (false deny): the script form, which the generated agents never send.
  assert.equal(decide(generated, "node scripts/sdd.mjs lint"), "deny");
  assert.equal(guard("node scripts/sdd.mjs lint"), true);
  assert.ok(GLOB_GAPS.some((g) => g.rule.startsWith("script form") && g.effect === "false deny"));
});

test("C002-TC-210 (C002-TS-210): opencode.json has no top-level permission key and agent entries for the ten Architect agents only", () => {
  for (const mode of MODES) {
    const c = config(fxDist(mode));
    assert.equal(c.permission, undefined, `${mode}: no top-level permission`);
    assert.deepEqual(Object.keys(c.agent).sort(), agentNames, `${mode}: the ten agents only`);
  }
});

test("C002-TC-212 (C002-TS-212) @mode-server: each of the ten Architect agents has edit and bash set to deny", () => {
  const c = config(fxDist("sdd-mcp-server"));
  for (const name of agentNames) {
    assert.equal(c.agent[name]!.permission["edit"], "deny", name);
    assert.equal(c.agent[name]!.permission["bash"], "deny", name);
    for (const t of ["write", "edit", "bash"]) assert.notEqual(c.agent[name]!.tools[t], true, `${name}: no built-in ${t} tool`);
  }
  assert.equal(table.permissions!["sdd-mcp-server"]["edit"], "deny");
  assert.equal(table.permissions!["sdd-mcp-server"]["bash"], "deny");
});

test("C002-TC-214 (C002-TS-214) @mode-server: opencode.json declares sdd-files and sdd-shell, one per server profile, and no other sdd-mcp entry", () => {
  const c = config(fxDist("sdd-mcp-server"));
  assert.deepEqual(c.mcp["sdd-files"], { type: "local", command: ["sdd-mcp", "--profile", "files"] });
  assert.deepEqual(c.mcp["sdd-shell"], { type: "local", command: ["sdd-mcp", "--profile", "shell"] });
  assert.deepEqual(Object.entries(c.mcp).filter(([, s]) => s.command?.[0] === "sdd-mcp").map(([n]) => n).sort(), ["sdd-files", "sdd-shell"]);
  const native = config(fxDist("native-permissions"));
  assert.ok(!("sdd-files" in native.mcp) && !("sdd-shell" in native.mcp), "native enforcement declares neither");
});

test("C002-TC-224 (C002-TS-224) @mode-server, fx-dist-bad: opencode.json without the sdd-shell entry is reported naming opencode.json and sdd-shell", () => {
  const files = new Map(fxDist("sdd-mcp-server"));
  const c = JSON.parse(files.get(CONFIG)!) as Config;
  delete c.mcp["sdd-shell"];
  files.set(CONFIG, JSON.stringify(c, null, 2) + "\n");
  const findings = openCodePackageFindings(files, { source, table, target: "opencode", mode: "sdd-mcp-server", peers: [table, copilot] });
  assert.equal(findings.length, 1, JSON.stringify(findings));
  assert.equal(findings[0]!.code, "TGT-MCP-001");
  assert.ok(findings[0]!.message.includes(CONFIG) && findings[0]!.message.includes("sdd-shell"), findings[0]!.message);
});

for (const mode of MODES) {
  test(`C002-TC-228 (C002-TS-228) [${mode}]: the conductor's permission holds question: allow, each of the nine specialists question: deny`, () => {
    const c = config(fxDist(mode));
    assert.equal(specialists.length, 9);
    assert.equal(c.agent[CONDUCTOR]!.permission["question"], "allow");
    for (const name of specialists) assert.equal(c.agent[name]!.permission["question"], "deny", name);
    // The rule follows the source tools (AskUserQuestion), not a list of names (C002-IF-001 §5).
    for (const a of source.agents) assert.equal(/\bAskUserQuestion\b/.test(String(a.data!["tools"])), a.name === CONDUCTOR, a.name);
    const q = table.permissions![mode as "native-permissions" | "sdd-mcp-server"]["question"];
    assert.ok(q === undefined || q === "deny", "the table's mode-wide question rule is deny or absent");
    // TGT-PERM-001 of the target structure check (C002-T-035) is carried with C002-TC-229.
  });
}

for (const mode of MODES) {
  test(`fixture tables [${mode}]: the rules generated from opencode-${mode}.json, with the per-agent question and task rules`, () => {
    const t = fixtureTable(mode);
    assert.deepEqual(permissionTableDiagnostics(t, mode), []);
    const front = translateAgents({ source, table: t, target: "opencode", mode });
    assert.deepEqual(front.diagnostics, []);
    for (const a of front.agents) {
      const p = agentPermission(t, mode, a);
      const fm = a.frontmatter;
      if (mode === "native-permissions") {
        assert.deepEqual([...(p["edit"] as Map<string, string>)], editRules().map((r) => [r.pattern, r.action]));
        assert.deepEqual([...(p["bash"] as Map<string, string>)], tableRules(t, "bash"));
      } else {
        assert.equal(p["edit"], "deny");
        assert.equal(p["bash"], "deny");
      }
      assert.equal(p["question"], fm.asks ? "allow" : "deny", fm.name);
      assert.equal(p["skill"], "deny");
      assert.equal(p["external_directory"], "deny");
      assert.deepEqual(p["task"], fm.agentStart.style === "permission-task" ? fm.agentStart.task : undefined);
      for (const w of ["webfetch", "websearch"]) assert.equal(p[w], fm.tools.includes(w) ? "allow" : undefined, `${fm.name}: ${w}`);
    }
  });
}

test("ERR-GEN-004: a table whose rules differ from the generated rules, or that allows question mode-wide, does not generate", () => {
  const native = structuredClone(fixtureTable("native-permissions"));
  const bash = native.permissions!["native-permissions"]["bash"] as { pattern: string; action: string }[];
  bash.push({ pattern: "npm *", action: "allow" });
  native.permissions!["native-permissions"]["question"] = "allow";
  const d = permissionTableDiagnostics(native, "native-permissions");
  assert.deepEqual(d.map((x) => x.code), ["ERR-GEN-004", "ERR-GEN-004"]);
  assert.match(d[0]!.message, /\/permissions\/native-permissions\/bash: differs from the rules generated from the guard allowlist/);
  assert.match(d[1]!.message, /\/permissions\/native-permissions\/question: must be "deny" or absent/);
  const r = emitOpenCode({ source, table: native, target: "opencode", mode: "native-permissions", peers: [native, copilot] });
  assert.equal(r.files.size, 0);

  const server = structuredClone(fixtureTable("sdd-mcp-server"));
  server.permissions!["sdd-mcp-server"]["bash"] = "allow";
  assert.match(permissionTableDiagnostics(server, "sdd-mcp-server")[0]!.message, /\/permissions\/sdd-mcp-server\/bash: must be "deny"/);
});

test("glob gaps: the native rules list the guard rules a glob cannot follow (C002-IF-001 §6.3); none under sdd MCP server enforcement", () => {
  assert.ok(GLOB_GAPS.length > 0);
  assert.equal(globGaps("native-permissions"), GLOB_GAPS);
  assert.deepEqual(globGaps("sdd-mcp-server"), []);
  for (const g of GLOB_GAPS) assert.ok(g.rule !== "" && g.gap !== "", JSON.stringify(g));
  for (const needle of ["links resolved", "redirection", "trailing ;", "pipe position", "script form", "--cwd", "ripwire", "PowerShell"])
    assert.ok(GLOB_GAPS.some((g) => g.rule.includes(needle)), needle);
});

test("C002-REQ-215: the quick-lint plugin is written under native enforcement when the table sets post_write_feedback, never under the server", () => {
  assert.equal(table.post_write_feedback, true, "S-07: post_write_feedback_channel true");
  const native = fxDist("native-permissions");
  assert.equal(native.get(QUICK_LINT_PLUGIN), quickLintPlugin());
  assert.ok(!fxDist("sdd-mcp-server").has(QUICK_LINT_PLUGIN), "the sdd-files tools return the findings instead (C002-REQ-408)");
  const off = { ...table, post_write_feedback: false };
  assert.equal(emitsQuickLint(off, "native-permissions"), false);
  const text = quickLintPlugin();
  assert.match(text, /"tool\.execute\.after"/);
  assert.match(text, /"lint", "--quick", "--file"/);
  assert.match(text, /^export const ArchitectQuickLint = async/m);
  assert.equal((text.match(/^export /gm) ?? []).length, 1, "one export: the plugin function");
});
