// C002-ADR-001 (C002-T-016): the schemas `tools/list` serves are the contract copy's `$defs` with every
// reference inlined. src/mcp/served-schemas.json must be what scripts/mcp-schemas.mjs writes from
// src/mcp/tools.schema.json, and each served schema must accept and reject what the contract does.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import { repoRoot } from "../../helpers.ts";
import { inlineDefs, servedSchemas, TOOLS } from "../../../scripts/mcp-schemas.mjs";
import { loadToolSchemas } from "../../../src/mcp/schemas.ts";

const root = repoRoot();
const contract = JSON.parse(readFileSync(join(root, "src", "mcp", "tools.schema.json"), "utf8")) as { $id: string; $defs: Record<string, unknown> };
const served = JSON.parse(readFileSync(join(root, "src", "mcp", "served-schemas.json"), "utf8")) as Record<string, { inputSchema: object; outputSchema: object }>;

test("src/mcp/served-schemas.json is up to date with the contract copy (run node scripts/mcp-schemas.mjs)", () => {
  assert.deepEqual(served, servedSchemas(contract));
});

test("served schemas hold no reference and are object schemas", () => {
  for (const [tool, s] of Object.entries(served)) {
    assert.ok(!JSON.stringify(s).includes('"$ref"'), tool);
    assert.equal((s.inputSchema as { type?: string }).type, "object", tool);
    assert.equal((s.outputSchema as { type?: string }).type, "object", tool);
  }
  assert.deepEqual(Object.keys(served).sort(), Object.keys(TOOLS).sort());
});

test("inlineDefs refuses references it cannot inline", () => {
  assert.throws(() => inlineDefs({ $ref: "other.json#/x" }, {}), /unsupported \$ref/);
  assert.throws(() => inlineDefs({ $ref: "#/$defs/a", description: "x" }, { a: {} }), /sibling/);
  assert.throws(() => inlineDefs({ $ref: "#/$defs/a" }, { a: { items: { $ref: "#/$defs/a" } } }), /cycle/);
  assert.throws(() => inlineDefs({ $ref: "#/$defs/missing" }, {}), /no such definition/);
});

const SAMPLES: Record<string, { valid: unknown[]; invalid: unknown[] }> = {
  writeFileInput: { valid: [{ path: "a.md", content: "" }], invalid: [{ path: "", content: "x" }, { path: "a.md" }, { path: "a.md", content: "x", extra: 1 }] },
  replaceTextInput: { valid: [{ path: "a.md", old_text: "a", new_text: "" }], invalid: [{ path: "a.md", old_text: "", new_text: "b" }] },
  runCommandInput: { valid: [{ command: "sdd status", dialect: "powershell", timeout_ms: 1000 }], invalid: [{ command: "x", timeout_ms: 999 }, { command: "x", dialect: "cmd" }, {}] },
  writeFileOutput: {
    valid: [{ status: "written", tool: "write_file", path: "/a", bytes: 1, created: true, findings: { total: 0, lines: [] } }],
    invalid: [{ status: "written", tool: "write_file", path: "/a", bytes: 1, created: true }],
  },
};

test("each served schema decides like the contract's definition", () => {
  const ajv = new Ajv2020({ strict: false });
  ajv.addSchema(contract);
  for (const [def, { valid, invalid }] of Object.entries(SAMPLES)) {
    const viaContract = ajv.getSchema(`${contract.$id}#/$defs/${def}`)!;
    const tool = Object.entries(TOOLS).find(([, t]) => t.input === def || t.output === def)!;
    const s = served[tool[0]]!;
    const viaServed = new Ajv2020({ strict: false }).compile(def.endsWith("Input") ? s.inputSchema : s.outputSchema);
    for (const v of valid) assert.ok(viaContract(v) && viaServed(v), `${def} accepts ${JSON.stringify(v)}`);
    for (const v of invalid) assert.ok(!viaContract(v) && !viaServed(v), `${def} rejects ${JSON.stringify(v)}`);
  }
});

test("loadToolSchemas compiles the profile's input schemas and reports Ajv details", () => {
  const files = loadToolSchemas("files");
  assert.deepEqual(files.tools.map((t) => t.name), ["write_file", "replace_text"]);
  assert.deepEqual(files.validateInput("write_file", { path: "a.md", content: "x" }), []);
  assert.deepEqual(files.validateInput("write_file", { path: "a.md" }), ["(arguments) must have required property 'content'"]);
  assert.deepEqual(files.validateInput("run_command", { command: "x" }), ["run_command is not a tool of the files profile"]);
  const shell = loadToolSchemas("shell");
  assert.deepEqual(shell.validateInput("run_command", { command: "x", timeout_ms: 5 }), ["/timeout_ms must be >= 1000"]);
});
