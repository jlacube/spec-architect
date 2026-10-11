// C001-TC-1109 / C001-TS-1109 (C001-AC-1108.1, C001-REQ-1108): the plugin's .mcp.json declares
// context7 and deepwiki as remote servers and serena as a local command server.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mcpConfig } from "../plugin-files.ts";

test(".mcp.json content", () => {
  const s = mcpConfig();
  assert.equal(s["context7"]?.url, "https://mcp.context7.com/mcp");
  assert.equal(s["deepwiki"]?.url, "https://mcp.deepwiki.com/mcp");
  assert.equal(s["serena"]?.command, "serena");
  assert.equal(s["serena"]?.url, undefined);
  assert.deepEqual(Object.keys(s).sort(), ["context7", "deepwiki", "serena"]);
});
