// C002-TC-410 … C002-TC-413 (C002-T-018): the quick-lint findings of a written `.sdd/` file come with
// the write result of the sdd MCP server (C002-IF-002 §5.1 step 5, §6; C002-REQ-408), at most 15 in the
// post-write feedback format of C001-IF-07 §4; when the lint cannot run, the write stands and the result
// carries `findings_unavailable` with WARN-MCP-001 (C002-REQ-409). The server runs as a child process in
// the `fx-srv` fixture; every structuredContent is checked against sdd-mcp-tools.schema.json.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import { repoRoot } from "../../helpers.ts";
import { McpSession, serverWorkspace } from "./client.ts";

const schema = JSON.parse(readFileSync(join(repoRoot(), "src", "mcp", "tools.schema.json"), "utf8")) as object;
const validateResult = new Ajv2020({ allErrors: true, strict: false }).compile(schema);

const REQ_FILE = ".sdd/002-x/10-spec/20-capabilities/CAP-01-x/requirements.md";

interface ToolResult {
  content: { type: string; text: string }[];
  structuredContent: Record<string, unknown>;
  isError?: boolean;
}

interface Findings {
  total: number;
  lines: string[];
}

type Call = (name: string, args: Record<string, unknown>) => Promise<ToolResult>;

async function withServer(fn: (call: Call, root: string) => Promise<void>, env: Record<string, string> = {}): Promise<void> {
  const ws = serverWorkspace();
  const root = ws.root.replace(/\\/g, "/");
  const s = await McpSession.start(["--profile", "files"], { cwd: root, env });
  try {
    await s.initialize();
    const call: Call = async (name, args) => {
      const r = await s.request("tools/call", { name, arguments: args });
      assert.ok(r.result !== undefined && r.error === undefined, JSON.stringify(r));
      const res = r.result as unknown as ToolResult;
      assert.ok(validateResult(res.structuredContent), `structuredContent does not match the schema: ${JSON.stringify(validateResult.errors)} in ${JSON.stringify(res)}`);
      return res;
    };
    await fn(call, root);
  } finally {
    s.kill();
    await s.exited;
    ws.cleanup();
  }
}

function requirement(n: number, statement: string): string {
  const id = `C002-REQ-${String(n).padStart(3, "0")}`;
  return (
    `### ${id} — Thing ${n}\n- **Pattern:** ubiquitous\n- **Statement:** ${statement}\n- **Rationale:** r\n` +
    `- **Stories:** C002-US-001\n- **Priority:** Must\n- **Acceptance:** ${id.replace("REQ", "AC")}.1\n\n`
  );
}

function requirementsFile(...sections: string[]): string {
  return "---\nid: C002-CAP-01\nartifact: spec/requirements\n---\n\n" + sections.join("");
}

/** The written result: status written, the findings block in the text, the findings in structuredContent. */
function assertWritten(r: ToolResult, root: string): Findings {
  assert.equal(r.isError, undefined, JSON.stringify(r));
  assert.equal(r.structuredContent["status"], "written");
  assert.equal(r.content.length, 1);
  const findings = r.structuredContent["findings"] as Findings | undefined;
  assert.ok(findings, JSON.stringify(r));
  assert.equal(r.structuredContent["findings_unavailable"], undefined);
  const path = r.structuredContent["path"] as string;
  assert.ok(path.toLowerCase().startsWith(root.toLowerCase() + "/.sdd/"), path);
  assert.equal(r.content[0]!.text, [`wrote ${path} (${r.structuredContent["bytes"] as number} bytes)`, `sdd quick lint of ${path}: ${findings.total} finding(s)`, ...findings.lines].join("\n"));
  return findings;
}

test("C002-TS-410: a requirement with two SHALL → written, with a LINT-EARS-002 finding in the C001-IF-07 §4 format", async () => {
  await withServer(async (call, root) => {
    const content = requirementsFile(requirement(1, "THE sdd CLI SHALL write the file and SHALL print its path."));
    const r = await call("write_file", { path: REQ_FILE, content });
    const f = assertWritten(r, root);
    assert.equal(readFileSync(join(root, ...REQ_FILE.split("/")), "utf8"), content);
    const line = f.lines.find((l) => l.includes("LINT-EARS-002"));
    assert.ok(line, JSON.stringify(f));
    assert.match(line, new RegExp(`^error LINT-EARS-002 ${REQ_FILE.replace(/\./g, "\\.")}:8 \\[C002-REQ-001\\] — Requirement contains 2 SHALL keywords\\. Fix: .+$`));
    assert.equal(f.total, f.lines.length);
  });
});

test("C002-TS-410: replace_text results carry the findings of the edited file too", async () => {
  await withServer(async (call, root) => {
    await call("write_file", { path: REQ_FILE, content: requirementsFile(requirement(1, "THE sdd CLI SHALL write the file.")) });
    const r = await call("replace_text", { path: REQ_FILE, old_text: "write the file.", new_text: "write the file and SHALL print its path." });
    const f = assertWritten(r, root);
    assert.ok(f.lines.some((l) => l.startsWith("error LINT-EARS-002 ")), JSON.stringify(f));
  });
});

test("C002-TS-411: 20 findings → written, 15 finding lines, errors before warnings, then the '… 5 more' line", async () => {
  await withServer(async (call, root) => {
    // Ten components without requirements (TR-10, warn) come first in the file, ten two-SHALL requirements (LINT-EARS-002, error) after.
    const comps = Array.from({ length: 10 }, (_, i) => `### C002-COMP-0${String(i + 10)} — Component ${i}\n- **Name:** c${i}\n- **Responsibility:** r\n- **Owned data:** none\n- **Interfaces:** none\n- **Depends on:** none\n- **Status:** new\n- **Realizes:** —\n\n`);
    const reqs = Array.from({ length: 10 }, (_, i) => requirement(i + 1, "THE sdd CLI SHALL write the file and SHALL print its path."));
    const r = await call("write_file", { path: REQ_FILE, content: requirementsFile(...comps, ...reqs) });
    const f = assertWritten(r, root);
    assert.equal(f.total, 20, JSON.stringify(f));
    assert.equal(f.lines.length, 16, JSON.stringify(f));
    const findingLines = f.lines.slice(0, 15);
    const severities = findingLines.map((l) => l.split(" ")[0]);
    assert.deepEqual(severities, [...Array(10).fill("error"), ...Array(5).fill("warn")], JSON.stringify(f));
    assert.equal(f.lines[15], `… 5 more: run sdd lint --quick --file ${r.structuredContent["path"] as string}`);
  });
});

test("C002-TS-412: a clean requirements file → written, no finding line", async () => {
  await withServer(async (call, root) => {
    const r = await call("write_file", { path: REQ_FILE, content: requirementsFile(requirement(1, "THE sdd CLI SHALL write the file.")) });
    const f = assertWritten(r, root);
    assert.deepEqual(f, { total: 0, lines: [] });
  });
});

test('C002-TS-413: the quick lint throws → written with WARN-MCP-001; .sdd/002-x/a.md holds "status: in-review"', async () => {
  await withServer(
    async (call, root) => {
      const r = await call("write_file", { path: ".sdd/002-x/a.md", content: "status: in-review" });
      assert.equal(r.isError, undefined, JSON.stringify(r));
      assert.equal(r.structuredContent["status"], "written");
      assert.equal(r.structuredContent["findings"], undefined);
      const na = r.structuredContent["findings_unavailable"] as { code: string; reason: string };
      assert.equal(na.code, "WARN-MCP-001");
      assert.match(na.reason, /quick-lint check failed: .+/);
      assert.equal(r.content[0]!.text, `wrote ${r.structuredContent["path"] as string} (17 bytes)\nquick-lint findings unavailable: ${na.reason}`);
      assert.equal(readFileSync(join(root, ".sdd", "002-x", "a.md"), "utf8"), "status: in-review");
      // replace_text also keeps its edit.
      const e = await call("replace_text", { path: ".sdd/002-x/a.md", old_text: "in-review", new_text: "approved" });
      assert.equal((e.structuredContent["findings_unavailable"] as { code: string }).code, "WARN-MCP-001");
      assert.equal(readFileSync(join(root, ".sdd", "002-x", "a.md"), "utf8"), "status: approved");
    },
    { SDD_TEST_FAULT: "mcp-lint-throw" },
  );
});
