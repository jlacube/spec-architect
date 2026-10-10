// C001-TC-113 — verifies C001-TS-113 (C001-AC-108.2, C001-REQ-108): slug rules.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { makeWorkspace, runBundled } from "../cli/helpers.ts";

function initialised(extra: Record<string, string> = {}) {
  const ws = makeWorkspace({ "README.md": "x\n", ...extra });
  assert.equal(runBundled(["init"], { cwd: ws.root }).code, 0);
  return ws;
}

const SLUGS: [string, string][] = [
  ["Payment Retries!", "payment-retries"],
  ["Ünïcode & spaces   here", "unicode-spaces-here"],
  ["A very long title that keeps going well beyond forty chars", "a-very-long-title-that-keeps-going-well"],
];

for (const [title, slug] of SLUGS) {
  test(`C001-TS-113: "${title}" → ${slug}`, () => {
    const ws = initialised();
    try {
      const r = runBundled(["change", "new", title], { cwd: ws.root });
      assert.equal(r.code, 0, r.stderr);
      const created = readdirSync(join(ws.root, ".sdd")).filter((n) => /^\d{3}-/.test(n));
      assert.equal(created.length, 1);
      assert.ok(created[0]!.endsWith(slug), created[0]);
    } finally {
      ws.cleanup();
    }
  });
}
