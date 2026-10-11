// C001-TC-807 — verifies C001-TS-807 (C001-AC-806.2, C001-REQ-806): hash invariance.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { phaseHash } from "../../../src/gate/hash.ts";
import { runInProcess } from "../cli/helpers.ts";
import { approvedChange, DIR, REQ } from "./gate-fixture.ts";

const edit = (root: string, rel: string, f: (s: string) => string) => {
  const p = join(root, ...rel.split("/"));
  writeFileSync(p, f(readFileSync(p, "utf8")));
};

const rows: [name: string, apply: (root: string) => void, same: boolean][] = [
  ["convert LF to CRLF", (r) => edit(r, REQ, (s) => s.replace(/\n/g, "\r\n")), true],
  ["add trailing spaces to 3 lines", (r) => edit(r, REQ, (s) => s.split("\n").map((l, i) => (i >= 5 && i < 8 ? l + "  \t" : l)).join("\n")), true],
  ['change frontmatter "status" field', (r) => edit(r, REQ, (s) => s.replace("artifact: spec/requirements", "artifact: spec/requirements\nstatus: approved")), true],
  ["regenerate 80-traceability.md", (r) => runInProcess(["trace", "004", "--write"], { cwd: r }), true],
  ["change one word in a requirement statement", (r) => edit(r, REQ, (s) => s.replace("do one thing", "do two things")), false],
];

for (const [name, apply, same] of rows) {
  test(`${name}: recomputed hash is ${same ? "identical" : "different"}`, () => {
    const ws = approvedChange(["10-spec"]);
    try {
      const before = phaseHash(ws.dir, "10-spec").hash;
      apply(ws.root);
      const after = phaseHash(join(ws.root, ...DIR.split("/")), "10-spec").hash;
      assert.equal(after === before, same);
    } finally {
      ws.cleanup();
    }
  });
}
