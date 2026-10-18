// C002-TC-527, C002-TC-528 (C002-T-010, C002-REQ-517, C002-IF-008 §1.1): the bash guard's Serena rule
// beyond the shell corpus — the deny reasons, the letter-case row of C002-TS-527 (Windows), and the
// Serena step of the Claude Code doctor and init commands through the bundled CLI with
// CLAUDE_PLUGIN_DATA set or unset in the guard's own environment (C002-TS-528, C002-REQ-623).
import { after, test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { decideBash } from "../../src/hooks/guard-bash.ts";
import { parseHookInput } from "../../src/hooks/input.ts";
import { repoRoot } from "../helpers.ts";
import { runBundled } from "../integration/cli/helpers.ts";
import { withEnv } from "./fixture.ts";

const base = realpathSync.native(mkdtempSync(join(tmpdir(), "sdd-serena-guard-"))).split("\\").join("/");
const repo = `${base}/repo`;
mkdirSync(`${repo}/.git`, { recursive: true });
mkdirSync(`${repo}/.sdd`);
after(() => rmSync(base, { recursive: true, force: true }));

const DATA = `${base}/claude/plugins/data/architect-inline`;
const input = (tool: string, command: string, agent = "architect:sdd-conductor") =>
  JSON.stringify({ session_id: "s", hook_event_name: "PreToolUse", cwd: repo, agent_type: agent, tool_name: tool, tool_input: { command, description: "d" } });
const decide = (tool: string, command: string, env: Record<string, string | null> = { CLAUDE_PLUGIN_DATA: null }) =>
  withEnv(env, (s) => s, () => decideBash(parseHookInput(input(tool, command))));

/** The `sdd serena-config …` command line of a plugin command file (doctor step 1, init step 1). */
function serenaStep(file: string): string {
  const text = readFileSync(join(repoRoot(), "plugins", "architect", "commands", file), "utf8");
  const m = /`(sdd serena-config [^`]+)`/.exec(text);
  assert.ok(m, `${file} has a serena-config step`);
  return m[1]!;
}

test("the deny reasons name the subcommand and the resolved folder or the unresolved word", () => {
  const inside = decide("Bash", `sdd serena-config ${repo}/src`);
  assert.ok(!inside.allow && inside.message.startsWith("GUARD-BASH-001: "), JSON.stringify(inside));
  assert.ok(!inside.allow && inside.message.includes(`sdd serena-config with a data folder inside the repository (`), JSON.stringify(inside));
  const shape = decide("Bash", "sdd serena-launch --user-data --cwd . -- start-mcp-server");
  assert.ok(!shape.allow && shape.message.includes("sdd serena-launch with an argument the guard cannot resolve (--cwd)"), JSON.stringify(shape));
  const unset = decide("Bash", 'sdd serena-config "${CLAUDE_PLUGIN_DATA}"');
  assert.ok(!unset.allow && unset.message.includes("sdd serena-config with an argument the guard cannot resolve (${CLAUDE_PLUGIN_DATA}"), JSON.stringify(unset));
  assert.ok(!unset.allow && unset.message.includes("(serena-config and serena-launch only with --user-data or a data folder outside the repository; --cwd of"), JSON.stringify(unset));
});

test("C002-TS-527: letter case and drive spelling of a folder inside the root follow the platform", { skip: process.platform !== "win32" && "Windows letter case" }, () => {
  const upper = repo[0]!.toLowerCase() + repo.slice(1).toUpperCase();
  const d = decide("Bash", `sdd serena-config ${upper}/src`);
  assert.equal(d.allow, false, `${upper}/src`);
  assert.deepEqual(decide("Bash", `sdd serena-config ${upper}-data`), { allow: true });
});

test("C002-TS-528: the Serena step of the Claude Code doctor and init commands is allowed with CLAUDE_PLUGIN_DATA set", () => {
  const doctor = serenaStep("doctor.md");
  const init = serenaStep("init.md");
  assert.equal(doctor, 'sdd serena-config "${CLAUDE_PLUGIN_DATA}"');
  const script = doctor.replace(/^sdd /, 'node "${CLAUDE_PLUGIN_ROOT}/scripts/sdd.mjs" ');
  for (const command of new Set([doctor, init, script, script.replace('"${CLAUDE_PLUGIN_DATA}"', `"${DATA}"`)])) {
    const r = runBundled(["guard-bash"], { cwd: repo, env: { CLAUDE_PLUGIN_DATA: DATA }, stdin: input("Bash", command) });
    assert.deepEqual([r.code, r.stderr], [0, ""], command);
  }
});

test("the literal is denied through the bundled CLI when CLAUDE_PLUGIN_DATA is unset or names a folder inside the root", () => {
  const command = serenaStep("doctor.md");
  for (const value of [undefined, "", `${repo}/.data`]) {
    const r = runBundled(["guard-bash"], { cwd: repo, env: { CLAUDE_PLUGIN_DATA: value }, stdin: input("Bash", command) });
    assert.equal(r.code, 2, String(value));
    assert.match(r.stderr, /^GUARD-BASH-001: /, String(value));
  }
});
