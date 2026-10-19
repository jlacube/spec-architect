// C002-TC-663 — verifies C002-TS-663 (C002-AC-606.1, C002-REQ-606; C002-T-041, C002-IF-009 §2.2 "Copilot
// hook tool names" and "Copilot classes copy per case"): the hook `tool_name` and `tool_input` fields the
// Copilot-hooks replay adapter feeds for each corpus tool, read from the classes file of the generated
// hooks-fallback package (pkg-cp-hooks). One corpus case per corpus tool of the Examples is fed through the
// installed PreToolUse command (tests/replay/adapters/copilot-hooks.ts); each case runs against a copy of
// the classes file rewritten for it, whose terminal entries carry the case's dialect. The shell-corpus
// cases of non-shell tools (BG-268 … BG-270, the §2.2 row of the command text) are fed the same way.
// An integration case, not in tests/unit/replay/ (critic CR-34).
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { cleanupPackages, copilotPackage } from "../../fixtures/pkg-cp.ts";
import type { BashCase, Corpus } from "../../guards/fixture.ts";
import { type CopilotHooksAdapter, createCopilotHooksAdapter } from "../../replay/adapters/copilot-hooks.ts";
import type { ReplayReport } from "../../replay/report.ts";
import { DEFAULT_PATH_CORPUS, DEFAULT_SHELL_CORPUS, runReplay } from "../../replay/suite.ts";

type Kind = "write" | "terminal" | "read_only";

/** The Examples of C002-TS-663: corpus tool, hook tool, the corpus case fed, and the input row. */
const ROWS: { corpusTool: string; hookTool: string; id: string; kind: Kind }[] = [
  { corpusTool: "Write", hookTool: "Write", id: "PG-001", kind: "write" },
  { corpusTool: "Edit", hookTool: "Write", id: "PG-003", kind: "write" },
  { corpusTool: "MultiEdit", hookTool: "Write", id: "PG-041", kind: "write" },
  { corpusTool: "NotebookEdit", hookTool: "Write", id: "PG-042", kind: "write" },
  { corpusTool: "Bash", hookTool: "Bash", id: "BG-001", kind: "terminal" },
  { corpusTool: "PowerShell", hookTool: "Bash", id: "BG-237", kind: "terminal" },
  { corpusTool: "Read", hookTool: "Glob", id: "PG-241", kind: "read_only" },
  { corpusTool: "Grep", hookTool: "Glob", id: "PG-244", kind: "read_only" },
  { corpusTool: "Glob", hookTool: "Glob", id: "PG-242", kind: "read_only" },
];
/** Shell-corpus cases of non-shell tools: the command text in place of the path (§2.2). */
const SHELL_TOOL_ROWS: { corpusTool: string; hookTool: string; id: string; kind: Kind }[] = [
  { corpusTool: "Write", hookTool: "Write", id: "BG-268", kind: "write" },
  { corpusTool: "Read", hookTool: "Glob", id: "BG-269", kind: "read_only" },
  { corpusTool: "Grep", hookTool: "Glob", id: "BG-270", kind: "read_only" },
];

interface Classes {
  write: { tool: string; paths: string[]; always_deny?: boolean }[];
  terminal: { tool: string; command: string; dialect?: string }[];
  read_only: string[];
}

let dir: string;
let classes: Classes;
let adapter: CopilotHooksAdapter;
let report: ReplayReport;
let problems: string[];
/** The value each case carries, resolved against the replay fixture (path, or command text). */
const fedValue = new Map<string, string>();
const corpusTool = new Map<string, string>();

before(async () => {
  classes = JSON.parse(readFileSync(join(copilotPackage("copilot-hooks"), "hooks", "tool-classes.json"), "utf8")) as Classes;
  dir = mkdtempSync(join(tmpdir(), "sdd-tc663-"));
  const ids = [...ROWS, ...SHELL_TOOL_ROWS].map((r) => r.id);
  const p = JSON.parse(readFileSync(DEFAULT_PATH_CORPUS, "utf8")) as Corpus;
  p.cases = p.cases.filter((c) => ids.includes(c.id));
  const s = JSON.parse(readFileSync(DEFAULT_SHELL_CORPUS, "utf8")) as { cases: BashCase[] };
  s.cases = s.cases.filter((c) => ids.includes(c.id));
  assert.equal(p.cases.length + s.cases.length, ids.length, "every named case is in the corpora");
  writeFileSync(join(dir, "path-corpus.json"), JSON.stringify(p));
  writeFileSync(join(dir, "bash-corpus.json"), JSON.stringify(s));
  adapter = createCopilotHooksAdapter();
  ({ report, problems } = await runReplay(adapter, {
    pathCorpus: join(dir, "path-corpus.json"),
    shellCorpus: join(dir, "bash-corpus.json"),
    afterRun: (fx) => {
      for (const c of p.cases) {
        fedValue.set(c.id, fx.resolvePath(c.path as string));
        corpusTool.set(c.id, c.tool as string);
      }
      for (const c of s.cases) {
        fedValue.set(c.id, fx.resolveShell(c.command as string));
        corpusTool.set(c.id, c.tool as string);
      }
    },
  }));
});

after(() => {
  rmSync(dir, { recursive: true, force: true });
  cleanupPackages();
});

test("C002-TS-663 — the classes file of pkg-cp-hooks lists Write, Bash and Glob first in their classes and names neither Edit, Read nor Grep", () => {
  assert.equal(classes.write.find((e) => e.always_deny !== true)?.tool, "Write");
  assert.equal(classes.terminal[0]?.tool, "Bash");
  assert.equal(classes.read_only[0], "Glob");
  const names = [...classes.write.map((e) => e.tool), ...classes.terminal.map((e) => e.tool), ...classes.read_only];
  for (const n of ["Edit", "Read", "Grep", "MultiEdit", "NotebookEdit", "PowerShell"]) assert.ok(!names.includes(n), `${n} is not a hook tool of the classes file`);
  assert.equal(classes.terminal[0]?.dialect, "powershell", "the shipped terminal dialect (S-08 terminal_dialect)");
  assert.deepEqual(problems, [], "the replay report validates and lists every case once");
  assert.equal(report.mechanism, "copilot-hooks");
  assert.equal(report.differing, 0, report.cases.filter((c) => c.actual !== c.expected).map((c) => `${c.id}: ${c.detail ?? ""}`).join("; "));
});

function sent(id: string): { input: Record<string, unknown>; tool: string; dialect: string; terminalDialects: string[] } {
  const c = adapter.calls.find((x) => x.id === id);
  assert.ok(c, `${id} was fed to the hook command`);
  return { input: JSON.parse(c.stdin) as Record<string, unknown>, tool: c.tool, dialect: c.dialect, terminalDialects: c.terminalDialects };
}

function assertInput(row: { corpusTool: string; hookTool: string; id: string; kind: Kind }): void {
  const { input, tool, dialect, terminalDialects } = sent(row.id);
  assert.equal(corpusTool.get(row.id), row.corpusTool, `${row.id} is a case of the corpus tool ${row.corpusTool}`);
  assert.equal(input["tool_name"], row.hookTool);
  assert.equal(tool, row.hookTool);
  assert.equal(report.cases.find((c) => c.id === row.id)?.fed_as.tool, row.hookTool, "the report records the hook tool");
  const ti = input["tool_input"] as Record<string, unknown>;
  const value = fedValue.get(row.id)!;
  if (row.kind === "write") {
    assert.equal(ti["path"], value, "the case's path (or command text) as tool_input.path");
    assert.equal(typeof ti["file_text"], "string");
    assert.match(ti["file_text"] as string, /^[^\r\n]+\n$/, "a one-line tool_input.file_text");
  } else if (row.kind === "terminal") {
    assert.equal(ti["command"], value, "the case's command as tool_input.command");
    assert.equal(typeof ti["description"], "string");
    assert.ok((ti["description"] as string).length > 0, "a tool_input.description");
  } else {
    assert.deepEqual(Object.keys(ti), ["pattern"]);
    assert.equal(ti["pattern"], value, "the case's path (or command text) as tool_input.pattern");
  }
  // Classes copy per case: every terminal entry carries the case's dialect when its hook runs.
  const expectedDialect = row.corpusTool === "PowerShell" ? "powershell" : "bash";
  assert.equal(dialect, expectedDialect);
  assert.deepEqual(terminalDialects, classes.terminal.map(() => expectedDialect), "the per-case classes copy names the case's dialect in every terminal entry");
}

for (const row of ROWS)
  test(`C002-TS-663 — corpus tool ${row.corpusTool} (${row.id}) is fed as the hook tool ${row.hookTool}`, () => assertInput(row));

for (const row of SHELL_TOOL_ROWS)
  test(`C002-TS-663 — shell-corpus case of the tool ${row.corpusTool} (${row.id}) is fed as the hook tool ${row.hookTool} with its command text`, () => assertInput(row));

test("C002-TS-663 — the classes copy follows the dialect of each case in turn", () => {
  // BG-001 (Bash) and BG-237 (PowerShell) run in their own dialects, one after the other in the shell corpus order.
  assert.deepEqual(sent("BG-001").terminalDialects[0], "bash");
  assert.deepEqual(sent("BG-237").terminalDialects[0], "powershell");
  const order = adapter.calls.map((c) => c.id);
  assert.ok(order.indexOf("BG-001") < order.indexOf("BG-237") && order.indexOf("BG-237") < order.indexOf("BG-268"), order.join(", "));
  assert.equal(sent("BG-268").terminalDialects[0], "bash", "the case after a PowerShell case is decided in bash again");
});
