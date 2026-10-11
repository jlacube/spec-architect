// C001-TC-920 / C001-TS-920 (C001-AC-919.1, C001-REQ-919): glossary-delta terms are added to the project
// glossary; an existing term takes the delta's definition.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { runBundled } from "../cli/helpers.ts";
import { archiveWorkspace } from "./archive-fixture.ts";

const GLOSSARY = ["---", "id: GLOSSARY", "artifact: constitution/glossary", "updated: 2026-09-01", "---", "# Glossary", "", "## Domain terms", "| Term | Definition |", "|---|---|", "| Checkout | The old definition |", "| Cart | Items chosen |", ""].join("\n");

test("glossary merge", () => {
  const ws = archiveWorkspace({
    reqs: [{ cap: "billing", id: "C004-REQ-012", title: "Card payments", delta: "ADDED" }],
    glossary: { terms: [["payment intent", "A request to collect money"], ["checkout", "The new definition"]], systems: [["billing service", "C004-COMP-01"]] },
    constitutionGlossary: GLOSSARY,
  });
  try {
    const r = runBundled(["archive", "004"], { cwd: ws.root });
    assert.equal(r.code, 0, r.stderr);
    const text = readFileSync(join(ws.root, ".sdd", "_constitution", "glossary.md"), "utf8");
    assert.match(text, /^\| payment intent \| A request to collect money \|$/m);
    assert.match(text, /^\| checkout \| The new definition \|$/m);
    assert.doesNotMatch(text, /The old definition/);
    assert.match(text, /^\| Cart \| Items chosen \|$/m);
    assert.match(text, /## System names[^\n]*\n\| Name \| Component \|\n\|---\|---\|\n\| billing service \| C004-COMP-01 \|/);
  } finally {
    ws.cleanup();
  }
});
