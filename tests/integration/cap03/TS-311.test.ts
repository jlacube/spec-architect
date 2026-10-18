// C001-TC-311 — verifies C001-TS-311 (C001-AC-310.2, C001-REQ-310): the corrected OA tables of the
// approved CHG-001 ideation have no arithmetic error.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseBlocks } from "../../../src/model/blocks.ts";
import { toLines } from "../../../src/model/frontmatter.ts";
import { weightedErrors } from "../../../src/lint/rules/oa-001.ts";
import { tables } from "../../../src/lint/spec.ts";
import { repoRoot } from "../../helpers.ts";
import { specFile } from "../../helpers/spec-file.ts";

const lines = toLines(readFileSync(specFile("001", "00-ideation/ideation.md"), "utf8"));
const doc = { lines, blocks: parseBlocks(lines, 1) };

test("no LINT-OA-001 on the approved CHG-001 ideation", () => {
  const scoreTables = tables(doc, "ideation.md").filter((t) => (t.header[t.header.length - 1] ?? "").startsWith("weighted"));
  assert.ok(scoreTables.length >= 12, `score tables checked: ${scoreTables.length}`);
  assert.deepEqual(weightedErrors(doc, "ideation.md"), []);
});

test("changing one score in a CHG-001 table is caught", () => {
  const at = lines.findIndex((l) => l.startsWith("| B. Single `sdd-conductor`"));
  const changed = [...lines];
  changed[at] = changed[at]!.replace("| 5 | 2 |", "| 4 | 2 |");
  const errors = weightedErrors({ lines: changed, blocks: parseBlocks(changed, 1) }, "ideation.md");
  assert.equal(errors.length, 1);
  assert.equal(errors[0]?.stated, 3.9);
  assert.ok(Math.abs((errors[0]?.computed ?? 0) - 3.6) < 1e-9);
});
