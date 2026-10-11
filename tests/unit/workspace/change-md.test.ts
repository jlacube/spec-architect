// Targeted change.md edits: only the edited lines change, and values read back as written.
import { test } from "node:test";
import assert from "node:assert/strict";
import { parse } from "yaml";
import { appendGateLog, flow, listYaml, setPhase, setPhaseStatus, setTopLevel } from "../../../src/workspace/change-md.ts";

const DOC = [
  "---", "id: CHG-004", "status: active", "phases:",
  "  00-ideation: { status: approved, approved_hash: \"sha256:aa\", approved_at: 2026-10-10, approved_by: p01 }",
  "  10-spec:", "    status: draft", "    approved_hash: null",
  "  20-plan: { status: not-started }",
  "defects: []", "waivers: []", "---", "# CHG-004", "", "## Gate log",
  "| Date | Gate | Decision | Words of approver | Waivers | Usage |", "|---|---|---|---|---|---|",
  "| 2026-10-10 | G1 (ideation) | **Approved** | \"ok\" | none | unavailable |", "", "## Notes", "Text.", "",
].join("\n");

const fm = (text: string) => parse(text.split("\n---\n")[0]!.slice(4)) as Record<string, unknown>;

test("setPhase rewrites one entry in flow form, from flow or block form", () => {
  const out = setPhase(DOC, "10-spec", { status: "approved", approved_hash: "sha256:bb", approved_at: "2026-10-11", approved_by: "p01" });
  assert.match(out, /^ {2}10-spec: \{ status: approved, approved_hash: "sha256:bb", approved_at: 2026-10-11, approved_by: p01 \}$/m);
  assert.deepEqual((fm(out)["phases"] as Record<string, unknown>)["00-ideation"], (fm(DOC)["phases"] as Record<string, unknown>)["00-ideation"]);
  assert.equal(out.split("\n").length, DOC.split("\n").length - 2);
});

test("setPhaseStatus edits only the status value", () => {
  const out = setPhaseStatus(setPhaseStatus(DOC, "00-ideation", "stale"), "10-spec", "in-revision");
  const diff = out.split("\n").filter((l, i) => l !== DOC.split("\n")[i]);
  assert.deepEqual(diff, ["  00-ideation: { status: stale, approved_hash: \"sha256:aa\", approved_at: 2026-10-10, approved_by: p01 }", "    status: in-revision"]);
});

test("setTopLevel replaces a key and its block; listYaml and flow read back exactly", () => {
  const defects = [{ id: "D-001", ref: "C004-REQ-012", summary: "a: b, \"c\"", commit: "12e4567", n: "1234567", date: "2026-10-11", resolution: null, history: [{ x: "true" }] }];
  const out = setTopLevel(DOC, "defects", listYaml(defects));
  assert.deepEqual(fm(out)["defects"], defects);
  const back = setTopLevel(out, "defects", "[]");
  assert.equal(back, DOC);
  assert.equal(flow({ a: "x y" }), '{ a: "x y" }');
});

test("appendGateLog adds a row after the last row of the Gate log table", () => {
  const out = appendGateLog(DOC, ["2026-10-11", "G2 (spec)", "**Approved**", '"a | b"', "none", "unavailable"]);
  const lines = out.split("\n");
  const at = lines.indexOf("| 2026-10-11 | G2 (spec) | **Approved** | \"a \\| b\" | none | unavailable |");
  assert.equal(lines[at - 1], "| 2026-10-10 | G1 (ideation) | **Approved** | \"ok\" | none | unavailable |");
  assert.equal(lines[at + 1], "");
  assert.match(appendGateLog("---\nid: x\n---\n# X\n", ["d", "g", "x", "n", "w", "u"]), /## Gate log\n\| Date \|.*\n\|---.*\n\| d \| g \| x \| n \| w \| u \|\n$/);
});
