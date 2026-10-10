import { test } from "node:test";
import assert from "node:assert/strict";
import { parseBlocks, splitCells } from "../../../src/model/blocks.ts";

const doc = [
  "# Title",
  "## Section",
  "### C001-REQ-101 — First",
  "- **Pattern:** ubiquitous",
  "- **Statement:** THE sdd CLI SHALL do one thing.",
  "```gherkin",
  "# not a heading inside a fence",
  "Scenario: C001-TS-101 — x",
  "```",
  "| Code | Text |",
  "|---|---|",
  "| A | escaped \\| pipe |",
  "#### C001-AC-101.1 — Sub",
  "## Next section",
];

test("headings outside fences carry their level and 1-based line", () => {
  const b = parseBlocks(doc, 1);
  assert.deepEqual(b.headings.map((h) => [h.level, h.line, h.text]), [
    [1, 1, "Title"], [2, 2, "Section"], [3, 3, "C001-REQ-101 — First"], [4, 13, "C001-AC-101.1 — Sub"], [2, 14, "Next section"],
  ]);
});

test("fences, tables and field bullets are found with exact lines", () => {
  const b = parseBlocks(doc, 1);
  assert.deepEqual(b.fences, [{ start: 6, end: 9, info: "gherkin" }]);
  assert.equal(b.inFence(7), true);
  assert.equal(b.inFence(10), false);
  assert.deepEqual(b.tableRows.map((r) => [r.line, r.cells]), [[10, ["Code", "Text"]], [12, ["A", "escaped | pipe"]]]);
  assert.deepEqual(b.fields.map((f) => [f.line, f.name, f.value]), [[4, "Pattern", "ubiquitous"], [5, "Statement", "THE sdd CLI SHALL do one thing."]]);
});

test("line numbers honour the body offset after frontmatter", () => {
  const b = parseBlocks(["### C001-US-101 — Story"], 8);
  assert.equal(b.headings[0]?.line, 8);
});

test("sectionEnd stops before the next heading of the same or higher level", () => {
  const b = parseBlocks(doc, 1);
  assert.equal(b.sectionEnd(3), 13); // a #### sub-heading stays inside the ### block (C001-IF-13 §2 step 5)
  assert.equal(b.sectionEnd(13), 13);
  assert.equal(b.sectionEnd(2), 13);
});

test("splitCells keeps empty cells and trims", () => {
  assert.deepEqual(splitCells("| a |  | c |"), ["a", "", "c"]);
});
