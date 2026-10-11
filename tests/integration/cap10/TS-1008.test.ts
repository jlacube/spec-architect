// C001-TC-1008 / C001-TS-1008 (C001-AC-1007.1, C001-REQ-1007): the cartographer and the architect get
// Serena tools only by explicit name, among the five read tools, plus ToolSearch.
import { test } from "node:test";
import assert from "node:assert/strict";
import { agentTools, SERENA_TOOLS } from "../plugin-files.ts";

for (const name of ["sdd-cartographer", "sdd-architect"]) {
  test(`${name}: Serena grants by explicit read-only name, ToolSearch present`, () => {
    const tools = agentTools().get(name)!;
    const serena = tools.filter((t) => t.startsWith("mcp__plugin_architect_serena"));
    assert.ok(serena.length > 0);
    for (const t of serena) assert.ok(SERENA_TOOLS.includes(t), t);
    assert.ok(!tools.includes("mcp__plugin_architect_serena"), "no bare server pattern");
    assert.ok(tools.includes("ToolSearch"));
  });
}
