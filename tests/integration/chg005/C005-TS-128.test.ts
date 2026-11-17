// C005-TC-028 — verifies C005-TS-128 (C005-AC-109.1, C005-REQ-109): sdd init without --force keeps an existing
// SDD.md sentence.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { makeWorkspace, runBundled } from "../cli/helpers.ts";
import { implementingSection, OLD_SENTENCE } from "./sddmd-section.ts";

test("sdd init without --force: the 0.1.0 section stays byte-identical", () => {
  const ws = makeWorkspace({ "README.md": "x\n" });
  try {
    assert.equal(runBundled(["init"], { cwd: ws.root }).code, 0);
    const p = join(ws.root, ".sdd", "SDD.md");
    const now = readFileSync(p, "utf8");
    writeFileSync(p, now.split(implementingSection(now)).join(`## If you are implementing a change\n${OLD_SENTENCE}\n`));
    const before = implementingSection(readFileSync(p, "utf8"));
    runBundled(["init"], { cwd: ws.root });
    assert.equal(implementingSection(readFileSync(p, "utf8")), before);
  } finally {
    ws.cleanup();
  }
});
