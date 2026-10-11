// C001-TC-1006 / C001-TS-1006 (C001-AC-1005.1, C001-REQ-1005): ripwire is never registered as an MCP
// server.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mcpConfig } from "../plugin-files.ts";

test("no server runs ripwire or passes --mcp", () => {
  for (const [name, s] of Object.entries(mcpConfig())) {
    assert.ok(!/ripwire/i.test(s.command ?? ""), `${name}: command ${s.command}`);
    assert.ok(!(s.args ?? []).some((a) => a.includes("--mcp")), `${name}: args ${JSON.stringify(s.args)}`);
  }
});
