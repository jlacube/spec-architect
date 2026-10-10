import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeForHash, splitFrontmatter } from "../../../src/model/frontmatter.ts";

test("splitFrontmatter parses YAML and reports the first body line", () => {
  const text = "---\nid: C001-T-010\nstatus: todo\nreport: { commit: null, completed_at: 2026-10-10 }\n---\n# Title\n";
  const fm = splitFrontmatter(text);
  assert.equal(fm.error, undefined);
  assert.deepEqual(fm.data, { id: "C001-T-010", status: "todo", report: { commit: null, completed_at: "2026-10-10" } });
  assert.equal(fm.bodyStartLine, 6);
  assert.deepEqual(fm.lines.slice(fm.bodyStartLine - 1), ["# Title", ""]);
});

test("splitFrontmatter without frontmatter starts the body at line 1", () => {
  const fm = splitFrontmatter("# Only body\r\ntext");
  assert.equal(fm.data, null);
  assert.equal(fm.bodyStartLine, 1);
  assert.deepEqual(fm.lines, ["# Only body", "text"]);
});

test("splitFrontmatter reports invalid YAML without throwing", () => {
  const fm = splitFrontmatter("---\nid: [unclosed\n---\nbody\n");
  assert.equal(fm.data, null);
  assert.match(fm.error ?? "", /./);
  assert.equal(fm.bodyStartLine, 4);
});

test("an unterminated frontmatter fence is treated as body", () => {
  const fm = splitFrontmatter("---\nid: x\nno closing fence\n");
  assert.equal(fm.data, null);
  assert.equal(fm.bodyStartLine, 1);
});

test("normalizeForHash follows C001-IF-13 §2 step 2", () => {
  assert.equal(normalizeForHash("---\nstatus: draft\n---\nA  \r\nB\t\rC\n"), "A\nB\nC\n");
  assert.equal(normalizeForHash("no frontmatter \n"), "no frontmatter\n");
  assert.equal(normalizeForHash("keeps no final newline"), "keeps no final newline");
});
