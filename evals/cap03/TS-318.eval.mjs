// C001-TC-318 — verifies C001-TS-318 (C001-AC-316.1, C001-REQ-316): decision artifact type, one scenario
// per Examples row. Change 004 is the only active change; the options-analyst runs as a stand-in
// until it is written. A DEC record is written in phases 00-ideation and 10-spec, an ADR in 20-plan.
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { checker } from "../harness/assert.mjs";
import { architectWithStubs } from "../harness/overlay.mjs";
import { changesFixture, folderOf } from "./adhoc.mjs";

function files(dir) {
  try {
    return readdirSync(dir).flatMap((n) => (statSync(join(dir, n)).isDirectory() ? files(join(dir, n)) : [join(dir, n)]));
  } catch {
    return [];
  }
}

const EXAMPLES = [
  { phase: "00-ideation", type: "DEC" },
  { phase: "10-spec", type: "DEC" },
  { phase: "20-plan", type: "ADR" },
];

export default EXAMPLES.map(({ phase, type }) => ({
  id: `TS-318-${phase}`,
  title: `Decision artifact type (${phase} → ${type})`,
  agent: "architect:sdd-conductor",
  plugins: [architectWithStubs],
  fixture: changesFixture({ stopped: ["001", "002", "003"], phase }),
  allowTools: ["Agent", "Write", "Edit", "Bash"],
  maxTurns: 18,
  prompt: '/architect:decide "Advisory locks or Redlock?"',
  assert({ root }) {
    const { failures, check } = checker();
    const all = files(join(root, ".sdd", folderOf(root, "004") ?? "-")).map((p) => p.slice(root.length + 1).replace(/\\/g, "/"));
    const records = all.filter((p) => new RegExp(`/${type}-[^/]*\\.md$`).test(p));
    check(records.length > 0, `no ${type} record written (files: ${all.filter((p) => /DEC-|ADR-/.test(p)).join(", ") || "none"})`);
    const other = type === "DEC" ? "ADR" : "DEC";
    check(!all.some((p) => new RegExp(`/${other}-[^/]*\\.md$`).test(p)), `a ${other} record was written instead`);
    return failures;
  },
}));
