// C001-TC-1009 / C001-TS-1009 (C001-AC-1008.1, C001-REQ-1008): no agent other than the cartographer and
// the architect is granted a Serena tool.
import { test } from "node:test";
import assert from "node:assert/strict";
import { agentTools } from "../plugin-files.ts";

test("the other eight agents have no Serena tools", () => {
  const others = [...agentTools()].filter(([n]) => n !== "sdd-cartographer" && n !== "sdd-architect");
  assert.equal(others.length, 8);
  for (const [name, tools] of others) assert.deepEqual(tools.filter((t) => t.startsWith("mcp__plugin_architect_serena")), [], name);
});
