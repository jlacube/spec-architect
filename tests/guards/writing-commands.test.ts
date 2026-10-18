// C002-TC-636 (C002-T-009, C002-REQ-521, C002-REQ-607): the writing-command table of
// src/cli/writing-commands.ts is the single list of writing sdd subcommands. It equals the rows of
// C002-IF-008 §1.2 in both directions (read through the spec-file locator of C002-T-006), every entry
// names a `COMMANDS` row whose `writes` property it sets, and the shell corpus holds, for every row the
// --cwd rule covers, a case without --cwd, one with --cwd outside the root (deny) and one inside (allow).
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { splitCells } from "../../src/model/blocks.ts";
import { COMMANDS } from "../../src/cli/commands.ts";
import { WRITING_COMMANDS, type WritingCommand } from "../../src/cli/writing-commands.ts";
import { decideBash } from "../../src/hooks/guard-bash.ts";
import { parseHookInput } from "../../src/hooks/input.ts";
import { specFile } from "../helpers/spec-file.ts";
import { runInProcess } from "../integration/cli/helpers.ts";
import { loadBashCorpus } from "./fixture.ts";

// Writing subcommands not registered in `COMMANDS` yet, with the task that registers each; that task
// removes its entry here.
const PENDING_COMMANDS: Record<string, string> = {
  "install copilot": "C002-T-058",
  "hook subagent-stop": "C002-T-032",
};

interface SpecRow {
  name: string;
  when: WritingCommand["when"];
  guard: WritingCommand["guard"];
}

/** The rows of the C002-IF-008 §1.2 table, one per subcommand named in its first cell. */
function specRows(): SpecRow[] {
  const text = readFileSync(specFile("002", "10-spec/50-interfaces/hooks-contract-delta.md"), "utf8").replace(/\r\n/g, "\n");
  const start = text.indexOf("### §1.2 Writing sdd subcommands");
  assert.ok(start >= 0, "C002-IF-008 has a §1.2");
  const section = text.slice(start, text.indexOf("\n## ", start));
  const lines = section.split("\n").filter((l) => l.startsWith("| `"));
  const rows: SpecRow[] = [];
  for (const line of lines) {
    const [first, , decision] = splitCells(line) as [string, string, string];
    const lead = first.split("(")[0]!;
    const guard: SpecRow["guard"] = decision.startsWith("§1.1") ? "serena" : decision.startsWith("deny") ? "deny" : "cwd";
    if (guard === "cwd") assert.match(decision, /^allow; `--cwd` as below/, line);
    for (const m of lead.matchAll(/`([^`]+)`/g)) {
      const spelled = m[1]!;
      if (spelled.endsWith(" --write")) rows.push({ name: spelled.slice(0, -" --write".length), when: "with-write", guard });
      else rows.push({ name: spelled, when: /without `--dry-run`/.test(first) ? "unless-dry-run" : "always", guard });
    }
  }
  return rows;
}

const key = (r: SpecRow | WritingCommand) => `${r.name} | ${r.when} | ${r.guard}`;

test("C002-TC-636: the writing-command table equals the rows of C002-IF-008 §1.2, in both directions", () => {
  const spec = specRows().map(key);
  const table = WRITING_COMMANDS.map(key);
  assert.ok(spec.length >= 20, `the §1.2 table was read (${spec.length} rows)`);
  assert.deepEqual(spec.filter((s) => !table.includes(s)), [], "rows of C002-IF-008 §1.2 missing from src/cli/writing-commands.ts");
  assert.deepEqual(table.filter((s) => !spec.includes(s)), [], "rows of src/cli/writing-commands.ts missing from C002-IF-008 §1.2");
  assert.equal(new Set(table).size, table.length, "a row is listed twice");
});

test("every writing-command entry names a COMMANDS row, which takes its writes property from the table", () => {
  const names = COMMANDS.map((c) => c.name);
  for (const [name, task] of Object.entries(PENDING_COMMANDS)) {
    assert.ok(WRITING_COMMANDS.some((w) => w.name === name), `${name} is pending (${task}) but not in the table`);
    assert.equal(names.includes(name), false, `${name} is in COMMANDS: remove it from PENDING_COMMANDS (${task})`);
  }
  for (const w of WRITING_COMMANDS) if (PENDING_COMMANDS[w.name] === undefined) assert.ok(names.includes(w.name), `${w.name} is not a COMMANDS row`);
  for (const c of COMMANDS) assert.equal(c.writes, WRITING_COMMANDS.find((w) => w.name === c.name)?.when ?? null, c.name);
  assert.equal(COMMANDS.find((c) => c.name === "lint")?.writes, null);
  assert.equal(COMMANDS.find((c) => c.name === "status")?.writes, "with-write");
});

test("C002-TS-636: the shell corpus holds, per writing subcommand under the --cwd rule, a case, one with --cwd outside (deny) and one inside (allow); install copilot is denied in each", () => {
  const cases = loadBashCorpus().filter((c) => typeof c.command === "string" && c.stdin === undefined);
  const runs = (command: string, w: WritingCommand) => {
    const words = command.split(" ");
    const at = words[0] === "sdd" ? 1 : 2;
    const sub = w.name.split(" ");
    if (!sub.every((s, i) => words[at + i] === s)) return false;
    return w.when === "with-write" ? words.includes("--write") : w.when === "unless-dry-run" ? !words.includes("--dry-run") : true;
  };
  const missing: string[] = [];
  for (const w of WRITING_COMMANDS.filter((x) => x.guard === "cwd")) {
    const mine = cases.filter((c) => runs(c.command as string, w));
    if (!mine.some((c) => !(c.command as string).includes("--cwd") && c.expect === "allow")) missing.push(`${w.name}: no case without --cwd`);
    if (!mine.some((c) => (c.command as string).includes("--cwd {repo}/../") && c.expect === "deny" && c.rule === "GUARD-BASH-001")) missing.push(`${w.name}: no --cwd outside case`);
    if (!mine.some((c) => (c.command as string).endsWith("--cwd {repo}/pkg") && c.expect === "allow")) missing.push(`${w.name}: no --cwd inside case`);
  }
  // A row denied in every form (C002-REQ-325, C002-T-059): a case that runs it and one with --cwd outside the root, both denied.
  for (const w of WRITING_COMMANDS.filter((x) => x.guard === "deny")) {
    const mine = cases.filter((c) => runs(c.command as string, w));
    if (!mine.some((c) => !(c.command as string).includes("--cwd") && c.expect === "deny" && c.rule === "GUARD-BASH-001")) missing.push(`${w.name}: no case without --cwd`);
    if (!mine.some((c) => (c.command as string).includes("--cwd {repo}/../") && c.expect === "deny" && c.rule === "GUARD-BASH-001")) missing.push(`${w.name}: no --cwd outside case`);
    if (mine.some((c) => c.expect !== "deny")) missing.push(`${w.name}: a case is not denied`);
  }
  assert.deepEqual(missing, []);
  // BG-019 stays allow: a subcommand that writes no file keeps --cwd unrestricted.
  assert.equal(loadBashCorpus().find((c) => c.id === "BG-019")?.expect, "allow");
});

test("`sdd --cwd <dir> status --write` is a usage error of the CLI, not a bypass of the --cwd rule", () => {
  const dir = realpathSync.native(mkdtempSync(join(tmpdir(), "sdd-wcmd-")));
  try {
    mkdirSync(join(dir, ".sdd"));
    const r = runInProcess(["--cwd", dir, "status", "--write"], { cwd: dir });
    assert.equal(r.code, 2);
    assert.match(r.stderr, /^ERR-CLI-003: Usage error: `unknown command --cwd`/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("the deny names the subcommand and the resolved folder; letter case and drive spelling follow the platform", () => {
  const repo = realpathSync.native(mkdtempSync(join(tmpdir(), "sdd-wcmd-"))).split("\\").join("/");
  try {
    mkdirSync(join(repo, ".git"));
    const decide = (tool: string, command: string) =>
      decideBash(parseHookInput(JSON.stringify({ session_id: "s", hook_event_name: "PreToolUse", cwd: repo, agent_type: "architect:sdd-conductor", tool_name: tool, tool_input: { command } })));
    const d = decide("Bash", `sdd change stop 001 --reason x --cwd ${repo}/../other-repo`);
    assert.equal(d.allow, false);
    if (!d.allow) {
      assert.ok(d.message.startsWith("GUARD-BASH-001: "), d.message);
      assert.ok(d.message.includes(`sdd change stop with --cwd outside the repository (`), d.message);
      assert.ok(d.message.includes("; --cwd of a writing subcommand only with a folder inside the repository)"), d.message);
    }
    const u = decide("Bash", "sdd init --cwd ~/x");
    assert.ok(!u.allow && u.message.includes("sdd init with a --cwd the guard cannot resolve (~/x)"), JSON.stringify(u));
    if (process.platform === "win32") {
      const upper = repo[0]!.toLowerCase() + repo.slice(1).toUpperCase();
      assert.deepEqual(decide("PowerShell", `sdd change new "Export" --profile lite --cwd ${upper}/pkg`), { allow: true });
      assert.deepEqual(decide("Bash", `sdd trace 001 --write --cwd ${repo.split("/").join("\\")}\\pkg`.split("\\").join("\\\\")), { allow: true });
    }
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});
