// C002-TC-401, C002-TC-403, C002-TC-404, C002-TC-405 and the C002-TS-402 rows (C002-T-017): the write
// tools of the sdd MCP server's `files` profile (C002-IF-002 §5.1; C002-REQ-401 … C002-REQ-404). The
// server runs as a child process in the `fx-srv` fixture of the CAP-04 acceptance file, bundled from the
// sources (the packed-tarball run of C002-TC-401 comes with C002-T-022). Every success's structuredContent is
// checked against sdd-mcp-tools.schema.json; an error result is text only (C002-IF-002 §6.1, revised for
// defect D-017; C002-T-064): its code, message, path and count are read from the text.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, readdirSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import { repoRoot } from "../../helpers.ts";
import { errorText, McpSession, serverWorkspace, type ErrorText } from "./client.ts";

const schema = JSON.parse(readFileSync(join(repoRoot(), "src", "mcp", "tools.schema.json"), "utf8")) as object;
const validateResult = new Ajv2020({ allErrors: true, strict: false }).compile(schema);
const WIN = process.platform === "win32";

interface Fx {
  root: string;
  /** Absolute path of a repository-relative path, with forward slashes. */
  abs(rel: string): string;
  read(rel: string): string;
}

/** `fx-srv`: `.sdd/002-x/a.md` ("status: draft"), `src/app.ts` and the link `.sdd/link-to-src` → `src/`. */
function fxSrv(): Fx & { cleanup: () => void } {
  const ws = serverWorkspace();
  const root = ws.root.replace(/\\/g, "/");
  writeFileSync(join(ws.root, "src", "app.ts"), "export const app = 1;\n");
  symlinkSync(join(ws.root, "src"), join(ws.root, ".sdd", "link-to-src"), "junction");
  return {
    root,
    abs: (rel) => `${root}/${rel}`,
    read: (rel) => readFileSync(join(ws.root, ...rel.split("/")), "utf8"),
    cleanup: ws.cleanup,
  };
}

interface ToolResult {
  content: { type: string; text: string }[];
  structuredContent: Record<string, unknown>;
  isError?: boolean;
  /** For an error result: what its text gives (no structuredContent, C002-IF-002 §6.1). */
  error?: ErrorText;
}

async function withServer(fn: (call: (name: string, args: Record<string, unknown>) => Promise<ToolResult>, fx: Fx, s: McpSession) => Promise<void>, env: Record<string, string> = {}): Promise<void> {
  const fx = fxSrv();
  const s = await McpSession.start(["--profile", "files"], { cwd: fx.root, env });
  try {
    await s.initialize();
    const call = async (name: string, args: Record<string, unknown>): Promise<ToolResult> => {
      const r = await s.request("tools/call", { name, arguments: args });
      assert.ok(r.result !== undefined && r.error === undefined, JSON.stringify(r));
      const res = r.result as unknown as ToolResult;
      assert.equal(res.content.length, 1);
      if (res.isError === true) return { ...res, error: errorText(res) };
      // The output schema describes the success output only (C002-IF-002 §4).
      assert.ok(validateResult(res.structuredContent), `structuredContent does not match the schema: ${JSON.stringify(validateResult.errors)} in ${JSON.stringify(res)}`);
      assert.equal(res.structuredContent["status"], "written", JSON.stringify(res));
      return res;
    };
    await fn(call, fx, s);
  } finally {
    s.kill();
    await s.exited;
    fx.cleanup();
  }
}

function assertRefused(r: ToolResult, code: string): void {
  assert.equal(r.isError, true, JSON.stringify(r));
  assert.ok(r.error, JSON.stringify(r));
  assert.equal("structuredContent" in r, false, JSON.stringify(r));
  assert.equal(r.error.code, code, JSON.stringify(r));
  assert.ok(r.error.text.startsWith(`${code}: `), r.error.text);
}

// C002-TS-401 — write decisions.
const ROWS: { path: (fx: Fx) => string; ok: boolean; state: "x" | "unchanged" | "absent"; check: (fx: Fx) => string; skip?: boolean }[] = [
  { path: (fx) => fx.abs(".sdd/002-x/b.md"), ok: true, state: "x", check: (fx) => fx.abs(".sdd/002-x/b.md") },
  { path: (fx) => `${fx.root.toUpperCase()}/.SDD/002-x/c.md`, ok: true, state: "x", check: (fx) => fx.abs(".sdd/002-x/c.md"), skip: !WIN },
  { path: (fx) => fx.abs("src/app.ts"), ok: false, state: "unchanged", check: (fx) => fx.abs("src/app.ts") },
  { path: (fx) => fx.abs(".sdd/../src/app.ts"), ok: false, state: "unchanged", check: (fx) => fx.abs("src/app.ts") },
  { path: (fx) => fx.abs(".sdd/link-to-src/app.ts"), ok: false, state: "unchanged", check: (fx) => fx.abs("src/app.ts") },
  { path: (fx) => fx.abs(".claude/agent-memory/architect-sdd-cartographer/MEMORY.md"), ok: false, state: "absent", check: (fx) => fx.abs(".claude/agent-memory/architect-sdd-cartographer/MEMORY.md") },
  { path: () => (WIN ? "D:/other/.sdd/a.md" : "/other/.sdd/a.md"), ok: false, state: "absent", check: () => (WIN ? "D:/other/.sdd/a.md" : "/other/.sdd/a.md") },
];

test("C002-TS-401: write_file decisions — inside .sdd/ written, everything else GUARD-PATH-001 and untouched", async () => {
  await withServer(async (call, fx) => {
    for (const row of ROWS) {
      if (row.skip) continue;
      const path = row.path(fx);
      const target = row.check(fx);
      const before = existsSync(target) ? readFileSync(target, "utf8") : null;
      const r = await call("write_file", { path, content: "x" });
      if (row.ok) {
        assert.equal(r.isError, undefined, `${path}: ${JSON.stringify(r)}`);
        assert.equal(r.structuredContent["status"], "written");
        assert.equal(r.structuredContent["created"], true);
        assert.equal(r.structuredContent["bytes"], 1);
        assert.match(r.content[0]!.text, /^wrote .+ \(1 bytes\)\n/);
      } else {
        assertRefused(r, "GUARD-PATH-001");
        assert.equal(r.error!.status, "refused");
        assert.match(r.error!.message, /^GUARD-PATH-001: Write on .+ denied — .+ Allowed: files under .+\/\.sdd\/ \(Architect agents write only inside \.sdd\/\)\.$/);
      }
      if (row.state === "x") assert.equal(readFileSync(target, "utf8"), "x", path);
      else if (row.state === "unchanged") assert.equal(readFileSync(target, "utf8"), before, path);
      else assert.equal(existsSync(target), false, path);
    }
  });
});

test("C002-TS-401: a relative path resolves against the root; missing parent folders in .sdd/ are created; content kept byte for byte", async () => {
  await withServer(async (call, fx) => {
    const content = "line 1\r\nline 2\nü\n";
    const r = await call("write_file", { path: ".sdd/002-x/10-spec/new/d.md", content });
    assert.equal(r.isError, undefined, JSON.stringify(r));
    assert.equal(r.structuredContent["path"], fx.abs(".sdd/002-x/10-spec/new/d.md").replace(/^([a-z]):/, (_m, d: string) => d.toUpperCase() + ":"));
    assert.equal(r.structuredContent["bytes"], Buffer.byteLength(content));
    assert.equal(fx.read(".sdd/002-x/10-spec/new/d.md"), content);
    // Replacing an existing file: created is false.
    const again = await call("write_file", { path: ".sdd/002-x/a.md", content: "\uFEFFstatus: approved\n" });
    assert.equal(again.structuredContent["created"], false);
    assert.equal(fx.read(".sdd/002-x/a.md"), "status: approved\n", "written without BOM");
    // The .sdd folder itself is no file under .sdd/.
    assertRefused(await call("write_file", { path: ".sdd", content: "x" }), "GUARD-PATH-001");
    // replace_text is decided by the same guard.
    assertRefused(await call("replace_text", { path: "src/app.ts", old_text: "app", new_text: "pwned" }), "GUARD-PATH-001");
    assert.equal(fx.read("src/app.ts"), "export const app = 1;\n");
  });
});

// C002-TS-402 — faults during a write call: an error result naming the fault; a.md keeps "status: draft".
for (const [fault, env, args, code] of [
  ['the call has no "content" argument', {}, { path: ".sdd/002-x/a.md" }, "ERR-MCP-001"],
  ["the path guard core throws an exception", { SDD_TEST_FAULT: "mcp-guard-throw" }, { path: ".sdd/002-x/a.md", content: "status: approved" }, "ERR-MCP-002"],
  ["the file system reports an I/O error during the write", { SDD_TEST_FAULT: "atomic-write-fail-at=1" }, { path: ".sdd/002-x/a.md", content: "status: approved" }, "ERR-MCP-003"],
] as const) {
  test(`C002-TS-402: ${fault} → failed with ${code}; .sdd/002-x/a.md still holds "status: draft"`, async () => {
    await withServer(async (call, fx) => {
      const r = await call("write_file", { ...args });
      assertRefused(r, code);
      assert.equal(r.error!.status, "failed");
      assert.equal(fx.read(".sdd/002-x/a.md"), "status: draft\n");
      assert.deepEqual(readdirSync(join(fx.root, ".sdd", "002-x")), ["a.md"], "no temporary file is left");
      if (code === "ERR-MCP-001") assert.match(r.error!.message, /^invalid arguments for write_file: .*content/);
      if (code === "ERR-MCP-002") assert.match(r.error!.message, /^internal fault in write_file: .+; the call was refused$/);
      if (code === "ERR-MCP-003") assert.match(r.error!.message, /^could not write .+\/\.sdd\/002-x\/a\.md: .+; previous content kept$/);
    }, env);
  });
}

test("C002-TS-402: arguments outside the input schema → ERR-MCP-001 before any guard or I/O call", async () => {
  await withServer(async (call, fx) => {
    for (const [tool, args] of [
      ["write_file", { path: ".sdd/002-x/a.md", content: "status: approved", mode: "0777" }],
      ["write_file", { path: "", content: "x" }],
      ["write_file", { path: ".sdd/002-x/a.md", content: 42 }],
      ["replace_text", { path: ".sdd/002-x/a.md", old_text: "", new_text: "x" }],
      ["replace_text", { path: ".sdd/002-x/a.md", old_text: "draft" }],
    ] as const) {
      const r = await call(tool, { ...args });
      assertRefused(r, "ERR-MCP-001");
      assert.equal(r.error!.status, "failed");
    }
    assert.equal(fx.read(".sdd/002-x/a.md"), "status: draft\n");
  });
});

test("C002-TS-403: the files profile holds one whole-file write tool and one span-replace tool, no other write tool", async () => {
  const fx = fxSrv();
  const s = await McpSession.start(["--profile", "files"], { cwd: fx.root });
  try {
    await s.initialize();
    const r = await s.request("tools/list");
    const tools = (r.result?.["tools"] ?? []) as { name: string; inputSchema: { required?: string[] } }[];
    assert.deepEqual(tools.map((t) => t.name), ["write_file", "replace_text"]);
    assert.deepEqual(tools[0]!.inputSchema.required, ["path", "content"]);
    assert.deepEqual(tools[1]!.inputSchema.required, ["path", "old_text", "new_text"]);
  } finally {
    s.kill();
    await s.exited;
    fx.cleanup();
  }
});

test('C002-TS-404: replace_text "draft" → "in-review" on .sdd/002-x/a.md; nothing else changes', async () => {
  await withServer(async (call, fx) => {
    const r = await call("replace_text", { path: ".sdd/002-x/a.md", old_text: "draft", new_text: "in-review" });
    assert.equal(r.isError, undefined, JSON.stringify(r));
    assert.equal(r.structuredContent["occurrences"], 1);
    assert.equal(r.structuredContent["bytes"], Buffer.byteLength("status: in-review\n"));
    assert.equal(fx.read(".sdd/002-x/a.md"), "status: in-review\n");
    assert.deepEqual(readdirSync(join(fx.root, ".sdd", "002-x")), ["a.md"]);
  });
});

test("replace_text on a file that does not exist → refused with ERR-MCP-005 (C002-REQ-403)", async () => {
  await withServer(async (call, fx) => {
    const r = await call("replace_text", { path: ".sdd/002-x/none.md", old_text: "a", new_text: "b" });
    assertRefused(r, "ERR-MCP-005");
    assert.equal(r.error!.status, "refused");
    assert.match(r.error!.message, /\/\.sdd\/002-x\/none\.md does not exist; replace_text edits existing files$/);
    assert.equal(existsSync(join(fx.root, ".sdd", "002-x", "none.md")), false);
  });
});

// C002-TS-405 — occurrences of the span.
for (const [count, ok] of [
  [0, false],
  [2, false],
  [1, true],
] as const) {
  test(`C002-TS-405: "TS-101" ${count} time(s) in .sdd/002-x/b.md → ${ok ? "a success, changed" : `refused reporting ${count} occurrences, unchanged`}`, async () => {
    await withServer(async (call, fx) => {
      const before = `# b\n${Array.from({ length: count }, (_, i) => `- C002-TS-101 row ${i}\n`).join("")}end\n`;
      mkdirSync(join(fx.root, ".sdd", "002-x"), { recursive: true });
      writeFileSync(join(fx.root, ".sdd", "002-x", "b.md"), before);
      const r = await call("replace_text", { path: ".sdd/002-x/b.md", old_text: "TS-101", new_text: "TS-102" });
      if (ok) {
        assert.equal(r.isError, undefined, JSON.stringify(r));
        assert.equal(fx.read(".sdd/002-x/b.md"), before.replace("TS-101", "TS-102"));
      } else {
        assertRefused(r, "ERR-MCP-004");
        assert.equal(r.error!.status, "refused");
        assert.ok(r.error!.message.startsWith(`the text to replace occurs ${count} times in `), r.error!.message);
        assert.match(r.error!.message, new RegExp(`^the text to replace occurs ${count} times in .+/\\.sdd/002-x/b\\.md; it must occur exactly once$`));
        assert.equal(fx.read(".sdd/002-x/b.md"), before);
      }
    });
  });
}

test("C002-TS-405: overlapping occurrences count, so the span is ambiguous", async () => {
  await withServer(async (call, fx) => {
    writeFileSync(join(fx.root, ".sdd", "002-x", "b.md"), "aaa\n");
    const r = await call("replace_text", { path: ".sdd/002-x/b.md", old_text: "aa", new_text: "b" });
    assertRefused(r, "ERR-MCP-004");
    assert.match(r.error!.text, /^ERR-MCP-004: the text to replace occurs 2 times in .+\/\.sdd\/002-x\/b\.md; it must occur exactly once$/);
    assert.equal(fx.read(".sdd/002-x/b.md"), "aaa\n");
  });
});

test("C002-TS-414 (write tools): with SDD_DEBUG=1 each decision is logged with its code on standard error only", async () => {
  await withServer(
    async (call, _fx, s) => {
      await call("write_file", { path: ".sdd/002-x/b.md", content: "x" });
      await call("write_file", { path: "src/app.ts", content: "x" });
      await call("replace_text", { path: ".sdd/002-x/a.md", old_text: "nope", new_text: "x" });
      assert.equal(await s.close(), 0);
      for (const line of s.stdout.trimEnd().split("\n")) assert.equal((JSON.parse(line) as { jsonrpc: string }).jsonrpc, "2.0");
      assert.match(s.stderr, /guard-path tool=write_file path=\S+\/\.sdd\/002-x\/b\.md decision=allow/);
      assert.match(s.stderr, /guard-path tool=write_file path=\S+\/src\/app\.ts decision=deny code=GUARD-PATH-001/);
      assert.match(s.stderr, /replace-span tool=replace_text .*occurrences=0 code=ERR-MCP-004/);
      assert.ok(!s.stderr.includes("LISTEN-ATTEMPT"));
    },
    { SDD_DEBUG: "1" },
  );
});
