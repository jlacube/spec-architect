// C001-TC-1123 / C001-TS-1123 (C001-AC-1122.1, C001-REQ-1122): a command and an agent sharing 14
// identical consecutive lines is PLG-DUP-001 naming both files.
import { test } from "node:test";
import assert from "node:assert/strict";
import { appendFileSync } from "node:fs";
import { join } from "node:path";
import { pluginCopy } from "./structure.ts";

test("duplicated procedure", () => {
  const p = pluginCopy();
  try {
    assert.deepEqual(p.findings("PLG-DUP-001"), [], "the shipped plugin is clean");
    const block = "\n" + Array.from({ length: 14 }, (_, i) => `${i + 1}. Shared procedure step number ${i + 1}.`).join("\n") + "\n";
    appendFileSync(join(p.plugin, "commands", "specify.md"), block);
    appendFileSync(join(p.plugin, "agents", "sdd-conductor.md"), block);
    const f = p.findings("PLG-DUP-001");
    assert.equal(f.length, 1, JSON.stringify(f));
    assert.equal(f[0].path, "plugins/architect/commands/specify.md");
    assert.match(f[0].message, /14 consecutive lines with plugins\/architect\/agents\/sdd-conductor\.md/);
  } finally {
    p.cleanup();
  }
});
