import { test } from "node:test";
import assert from "node:assert/strict";
import { findIds, formatId, parseId } from "../../../src/model/ids.ts";

test("parseId splits full IDs, including AC sub-numbers", () => {
  assert.deepEqual(parseId("C004-REQ-012"), { change: "004", type: "REQ", seq: "012" });
  assert.deepEqual(parseId("C004-AC-012.1"), { change: "004", type: "AC", seq: "012", sub: "1" });
  assert.equal(parseId("C004-FOO-012"), null);
  assert.equal(parseId("REQ-012"), null);
  assert.equal(formatId({ change: "004", type: "AC", seq: "012", sub: "1" }), "C004-AC-012.1");
});

test("findIds resolves short forms to the enclosing change (C001-REQ-112)", () => {
  const hits = findIds("See REQ-012, AC-012.1 and TS-401; also C001-US-101.", "004");
  assert.deepEqual(hits.map((h) => [h.id, h.short, h.raw]), [
    ["C004-REQ-012", true, "REQ-012"],
    ["C004-AC-012.1", true, "AC-012.1"],
    ["C004-TS-401", true, "TS-401"],
    ["C001-US-101", false, "C001-US-101"],
  ]);
});

test("findIds leaves short forms unresolved outside a change folder", () => {
  assert.deepEqual(findIds("REQ-012", null), []);
  assert.deepEqual(findIds("C002-T-001", null).map((h) => h.id), ["C002-T-001"]);
});

test("findIds ignores labels that are not workspace IDs", () => {
  const text = "IDEA-P-09, OQ-04, Spec-Q3, CR-2, P-01, D-S01-1, S-01, ERR-CLI-004, DOD-G-01, LINT-ARCH-001, TS-1011b, AC-504";
  assert.deepEqual(findIds(text, "001").map((h) => h.raw), []);
});

test("short forms narrower than C001-IF-04 §1 widths are citation labels", () => {
  assert.deepEqual(findIds("OA-01, OA-005, M-3, M-03, NG-07, REQ-12", "001").map((h) => h.id), ["C001-OA-005", "C001-M-03", "C001-NG-07"]);
  assert.deepEqual(findIds("C001-M-1", null).map((h) => h.id), ["C001-M-1"]);
});

test("findIds reports 0-based columns of each occurrence", () => {
  assert.deepEqual(findIds("x C001-T-010 y T-011", "001").map((h) => h.column), [2, 15]);
});
