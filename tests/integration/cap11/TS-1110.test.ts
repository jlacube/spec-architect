// C001-TC-1110 / C001-TS-1110 (C001-AC-1109.1, C001-REQ-1109): only the researcher is granted Context7
// and DeepWiki tools.
import { test } from "node:test";
import assert from "node:assert/strict";
import { agentTools } from "../plugin-files.ts";

test("research MCP scoping", () => {
  const tools = agentTools();
  assert.equal(tools.size, 10);
  const holders = [...tools].filter(([, t]) => t.some((x) => /^mcp__plugin_architect_(context7|deepwiki)/.test(x))).map(([n]) => n);
  assert.deepEqual(holders, ["sdd-researcher"]);
});
