// C001-NFR-302 — deterministic generation: `sdd trace --write` and `sdd status --write` run twice on
// unchanged fx-large inputs give byte-identical outputs, generated_at aside.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { generateLarge } from "../fixtures/gen-large.mjs";
import { runBundled } from "./cli/helpers.ts";

function files(root: string): Map<string, string> {
  const out = new Map<string, string>();
  const walk = (d: string) => {
    for (const n of readdirSync(d)) {
      const p = join(d, n);
      if (statSync(p).isDirectory()) walk(p);
      else out.set(relative(root, p), readFileSync(p, "utf8").replace(/"generated_at": "[^"]*"/g, '"generated_at": ""'));
    }
  };
  walk(join(root, ".sdd"));
  return out;
}

test("trace --write and status --write are byte-identical across two runs on fx-large", () => {
  const root = realpathSync.native(mkdtempSync(join(tmpdir(), "sdd-determinism-")));
  try {
    assert.equal(generateLarge(root), 500);
    const run = () => {
      for (const nnn of ["001", "010", "020"]) assert.equal(runBundled(["trace", nnn, "--write"], { cwd: root }).code, 0);
      assert.equal(runBundled(["status", "--write"], { cwd: root }).code, 0);
      return files(root);
    };
    const first = run();
    const second = run();
    assert.ok(first.has(join(".sdd", "010-change-010", "trace.json")));
    assert.ok(first.has(join(".sdd", "registry.json")));
    assert.deepEqual([...second.keys()].sort(), [...first.keys()].sort());
    for (const [path, text] of first) assert.equal(second.get(path), text, path);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
