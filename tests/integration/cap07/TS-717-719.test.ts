// C001-TC-717, 718, 719 — verify C001-TS-717 (TR-12, C001-REQ-717), C001-TS-718 (TR-13,
// C001-REQ-718) and C001-TS-719 (LINT-TXT-001, C001-REQ-719).
import { test } from "node:test";
import assert from "node:assert/strict";
import { makeWorkspace, REBUILD, runBundled } from "../cli/helpers.ts";
import { changeMd } from "../workspace-fixtures.ts";

interface Finding { code: string; path: string; line?: number; ids?: string[]; message: string }
const lint = (cwd: string) => JSON.parse(runBundled(["lint", "--json"], { cwd }).stdout) as { findings: Finding[] };

test("C001-TS-717: a story listing an undefined, untombstoned REQ is reported as TR-12 with file and line", () => {
  const ws = makeWorkspace({
    ".sdd/SDD.md": "# SDD\n",
    ".sdd/004-x/change.md": changeMd({ nnn: "004", phase: "10-spec" }),
    ".sdd/004-x/ids.json": JSON.stringify({ change: "CHG-004", allocated: {}, blocks: [], tombstones: [{ id: "C004-REQ-020", reason: "merged", date: "2026-10-01" }] }),
    ".sdd/004-x/10-spec/20-capabilities/CAP-01-a/stories.md":
      "---\nid: C004-CAP-01\n---\n# Stories\n\n### C004-US-101 — S\n- **I want** x\n- **Requirements:** C004-REQ-077, C004-REQ-020\n",
    ".sdd/registry.json": REBUILD,
  });
  try {
    const tr12 = lint(ws.root).findings.filter((f) => f.code === "TR-12");
    assert.equal(tr12.length, 1);
    assert.deepEqual(tr12[0]?.ids, ["C004-REQ-077"]);
    assert.equal(tr12[0]?.path, ".sdd/004-x/10-spec/20-capabilities/CAP-01-a/stories.md");
    assert.equal(tr12[0]?.line, 8);
  } finally {
    ws.cleanup();
  }
});

test("C001-TS-718: an ID defined as a heading in two files is reported as TR-13 listing both locations", () => {
  const req = "### C004-REQ-012 — Twice\n- **Statement:** THE x SHALL y.\n";
  const ws = makeWorkspace({
    ".sdd/SDD.md": "# SDD\n",
    ".sdd/004-x/change.md": changeMd({ nnn: "004" }),
    ".sdd/004-x/10-spec/20-capabilities/CAP-01-a/requirements.md": "---\nid: C004-CAP-01\n---\n" + req,
    ".sdd/004-x/10-spec/20-capabilities/CAP-02-b/requirements.md": "---\nid: C004-CAP-02\n---\n\n" + req,
    ".sdd/registry.json": REBUILD,
  });
  try {
    const tr13 = lint(ws.root).findings.filter((f) => f.code === "TR-13");
    assert.equal(tr13.length, 1);
    assert.match(tr13[0]!.message, /C004-REQ-012 is defined 2 times: \.sdd\/004-x\/10-spec\/20-capabilities\/CAP-01-a\/requirements\.md:4, \.sdd\/004-x\/10-spec\/20-capabilities\/CAP-02-b\/requirements\.md:5/);
  } finally {
    ws.cleanup();
  }
});

test("C001-TS-718: a tombstoned ID defined again is reported as TR-13", () => {
  const ws = makeWorkspace({
    ".sdd/SDD.md": "# SDD\n",
    ".sdd/004-x/change.md": changeMd({ nnn: "004" }),
    ".sdd/004-x/ids.json": JSON.stringify({ change: "CHG-004", allocated: {}, blocks: [], tombstones: [{ id: "C004-REQ-012", reason: "x", date: "2026-10-01" }] }),
    ".sdd/004-x/10-spec/20-capabilities/CAP-01-a/requirements.md": "---\nid: C004-CAP-01\n---\n### C004-REQ-012 — Back\n- **Statement:** THE x SHALL y.\n",
    ".sdd/registry.json": REBUILD,
  });
  try {
    const tr13 = lint(ws.root).findings.filter((f) => f.code === "TR-13");
    assert.equal(tr13.length, 1);
    assert.match(tr13[0]!.message, /C004-REQ-012 is tombstoned but defined again/);
  } finally {
    ws.cleanup();
  }
});

const LINES: [string, boolean][] = [
  ["Threshold: TBD", true],
  ["Supports JSON, YAML, etc.", true],
  ["Run `grep TODO src/`", false],
  ['The message reads "TODO list empty"', false],
];

for (const [line, contains] of LINES) {
  test(`C001-TS-719: "${line}" ${contains ? "contains" : "does not contain"} LINT-TXT-001`, () => {
    const ws = makeWorkspace({
      ".sdd/SDD.md": "# SDD\n",
      ".sdd/004-x/change.md": changeMd({ nnn: "004" }),
      ".sdd/004-x/10-spec/10-context/scope.md": `---\nid: C004-SPEC-CTX-03\n---\n# Scope\n\n${line}\n`,
      ".sdd/registry.json": REBUILD,
    });
    try {
      const txt = lint(ws.root).findings.filter((f) => f.code === "LINT-TXT-001");
      assert.equal(txt.length, contains ? 1 : 0, JSON.stringify(txt));
      if (contains) assert.equal(txt[0]?.line, 6);
    } finally {
      ws.cleanup();
    }
  });
}
