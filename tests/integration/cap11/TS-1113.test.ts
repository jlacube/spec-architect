// C001-TC-1113 — verifies C001-TS-1113 (C001-AC-1112.1, C001-REQ-1112): MIT license.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { repoRoot } from "../../helpers.ts";

const root = repoRoot();
const pluginRoot = join(root, "plugins", "architect");
const manifest = JSON.parse(readFileSync(join(pluginRoot, ".claude-plugin", "plugin.json"), "utf8")) as {
  license?: string;
  author?: { name?: string };
};
const holder = manifest.author?.name ?? "";

test("plugin.json declares license MIT and names the copyright holder", () => {
  assert.equal(manifest.license, "MIT");
  assert.ok(holder.trim().length > 0 && !holder.includes("<"), "author.name must be a real holder name");
});

for (const [label, dir] of [["repository root", root], ["plugin root", pluginRoot]] as const) {
  test(`LICENSE in ${label} contains "MIT License", "2026" and the holder name`, () => {
    const text = readFileSync(join(dir, "LICENSE"), "utf8");
    assert.match(text, /MIT License/);
    assert.match(text, /2026/);
    assert.ok(text.includes(holder), `LICENSE must name ${holder}`);
  });
}
