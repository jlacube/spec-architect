// C002-TC-665 (C002-T-064; C002-IF-002 §4, §6.1, revised for defect D-017): an error result of the sdd
// MCP server carries its code and message in its text only — a tool result (no JSON-RPC error) with
// `isError` true, exactly one text item, the code once in that text, and no `structuredContent` key. The
// server is the one of the packed tarball (fx-tgz, installed into a temporary prefix), run in the
// `fx-srv` fixture with a PATH that holds no `ast-grep` file. The `GUARD-*` rows compare the text with the
// deny message the guard core returns for the same call.
import { after, test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { cleanupFxTgz, fxTgz } from "../../fixtures/fx-tgz.ts";
import { decideBash } from "../../../src/hooks/guard-bash.ts";
import { decidePath } from "../../../src/hooks/guard-path.ts";
import { AGENT_TYPE } from "../../../src/mcp/tools/files.ts";
import { McpSession, serverWorkspace } from "./client.ts";

after(() => cleanupFxTgz());

/** The spelling of the PATH variable in this process's environment ("Path" on most Windows hosts). */
const PATH_KEY = Object.keys(process.env).find((k) => k.toUpperCase() === "PATH") ?? "PATH";

interface Row {
  instance: "sdd-files" | "sdd-shell";
  call: string;
  name: "write_file" | "replace_text" | "run_command";
  args: Record<string, unknown>;
  code: string;
  /** Checks the text; `root` is the fixture root (forward slashes). */
  text: (text: string, root: string) => void;
}

const guardPath = (root: string, path: string): string => {
  const d = decidePath({ hook_event_name: "PreToolUse", tool_name: "Write", tool_input: { file_path: path }, cwd: root, agent_type: AGENT_TYPE }, { memoryFolder: false });
  assert.equal(d.allow, false);
  return (d as { message: string }).message;
};
const guardBash = (root: string, command: string): string => {
  const d = decideBash({ hook_event_name: "PreToolUse", tool_name: "Bash", tool_input: { command }, cwd: root, agent_type: AGENT_TYPE }, { expands: false });
  assert.equal(d.allow, false);
  return (d as { message: string }).message;
};

const ROWS: Row[] = [
  {
    instance: "sdd-files",
    call: 'the whole-file write tool with the path "C:/repo/src/app.ts" and the content "x"',
    name: "write_file",
    args: { path: "C:/repo/src/app.ts", content: "x" },
    code: "GUARD-PATH-001",
    text: (t, root) => {
      assert.ok(t.startsWith("GUARD-PATH-001: "), t);
      assert.equal(t, guardPath(root, "C:/repo/src/app.ts"));
    },
  },
  {
    instance: "sdd-files",
    call: 'the whole-file write tool with the path ".sdd/002-x/b.md" and no "content"',
    name: "write_file",
    args: { path: ".sdd/002-x/b.md" },
    code: "ERR-MCP-001",
    text: (t) => assert.ok(t.startsWith("ERR-MCP-001: invalid arguments for write_file: "), t),
  },
  {
    instance: "sdd-files",
    call: 'the span-replace tool on ".sdd/002-x/a.md" to replace "approved" with "x"',
    name: "replace_text",
    args: { path: ".sdd/002-x/a.md", old_text: "approved", new_text: "x" },
    code: "ERR-MCP-004",
    text: (t) => {
      assert.ok(t.startsWith("ERR-MCP-004: the text to replace occurs 0 times in "), t);
      assert.ok(t.endsWith("; it must occur exactly once"), t);
    },
  },
  {
    instance: "sdd-files",
    call: 'the span-replace tool on ".sdd/002-x/none.md" to replace "a" with "b"',
    name: "replace_text",
    args: { path: ".sdd/002-x/none.md", old_text: "a", new_text: "b" },
    code: "ERR-MCP-005",
    text: (t) => {
      assert.ok(t.startsWith("ERR-MCP-005: "), t);
      assert.ok(t.endsWith(" does not exist; replace_text edits existing files"), t);
    },
  },
  {
    instance: "sdd-shell",
    call: 'the command tool with "npm install"',
    name: "run_command",
    args: { command: "npm install" },
    code: "GUARD-BASH-001",
    text: (t, root) => {
      assert.ok(t.startsWith("GUARD-BASH-001: "), t);
      assert.equal(t, guardBash(root, "npm install"));
    },
  },
  {
    instance: "sdd-shell",
    call: 'the command tool with "echo x > src/marker.txt"',
    name: "run_command",
    args: { command: "echo x > src/marker.txt" },
    code: "GUARD-BASH-002",
    text: (t, root) => {
      assert.ok(t.startsWith("GUARD-BASH-002: "), t);
      assert.equal(t, guardBash(root, "echo x > src/marker.txt"));
    },
  },
  {
    instance: "sdd-shell",
    call: 'the command tool with "ast-grep --version"',
    name: "run_command",
    args: { command: "ast-grep --version" },
    code: "ERR-MCP-006",
    text: (t) => assert.equal(t, 'ERR-MCP-006: could not start "ast-grep": not found on PATH'),
  },
];

for (const row of ROWS) {
  test(`C002-TS-665 ${row.instance}: ${row.call} → a text-only error result with ${row.code}`, async () => {
    const fx = fxTgz();
    const ws = serverWorkspace();
    writeFileSync(join(ws.root, "src", "app.ts"), "export const app = 1;\n");
    const root = ws.root.replace(/\\/g, "/");
    // A PATH that holds no file named "ast-grep" with any extension: one empty folder.
    const empty = realpathSync.native(mkdtempSync(join(tmpdir(), "sdd-path-empty-")));
    const profile = row.instance === "sdd-files" ? "files" : "shell";
    const s = await McpSession.start(["--profile", profile], { cwd: root, env: { [PATH_KEY]: empty }, serverFile: join(fx.pkgDir, "scripts", "sdd-mcp.mjs") });
    try {
      await s.initialize();
      const m = await s.request("tools/call", { name: row.name, arguments: row.args });
      assert.equal(m.error, undefined, `a JSON-RPC error: ${JSON.stringify(m)}`);
      const r = m.result as { isError?: boolean; content?: { type: string; text: string }[] };
      assert.equal(r.isError, true, JSON.stringify(r));
      assert.equal(r.content?.length, 1, JSON.stringify(r));
      assert.equal(r.content[0]!.type, "text");
      const text = r.content[0]!.text;
      row.text(text, root);
      assert.equal(text.split(row.code).length - 1, 1, `the code occurs more than once: ${text}`);
      assert.equal(Object.prototype.hasOwnProperty.call(r, "structuredContent"), false, JSON.stringify(r));
    } finally {
      s.kill();
      await s.exited;
      ws.cleanup();
      rmSync(empty, { recursive: true, force: true });
    }
  });
}
