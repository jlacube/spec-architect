// C001-TC-220 / C001-TS-220 (C001-AC-218.1, C001-REQ-218): no specialist can spawn agents.
import { test } from "node:test";
import assert from "node:assert/strict";
import { agentTools, SPECIALISTS } from "../plugin-files.ts";

test("no Agent tool in the nine specialists", () => {
  const tools = agentTools();
  for (const name of SPECIALISTS) {
    const t = tools.get(name);
    assert.ok(t, `${name} exists`);
    assert.deepEqual(t.filter((x) => x === "Agent" || x.startsWith("Agent(")), [], name);
  }
});
