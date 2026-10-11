// C001-TC-1112 — verifies C001-TS-1112 (C001-AC-1111.1, C001-REQ-1111): doctor outcome, one scenario per
// Examples row: DeepWiki unreachable → completed with warnings; Serena and ast-grep missing (cfg-bare) →
// completed with warnings; node 18 on PATH → failed: node ≥ 20 required.
import { checker } from "../harness/assert.mjs";
import { doctorRows, doctorRun, outcome } from "./doctor.mjs";

const EXAMPLES = [
  { id: "deepwiki-down", cfg: "cfg-deepwiki-down", expect: "completed with warnings", row: ["DeepWiki", "unreachable"] },
  { id: "bare", cfg: "cfg-bare", expect: "completed with warnings", row: ["Serena", "missing"] },
  { id: "node18", cfg: "cfg-node18", expect: "failed: node ≥ 20 required", row: ["node", "error"] },
];

export default EXAMPLES.map(({ id, cfg, expect, row }) => ({
  id: `TS-1112-${id}`,
  title: `Doctor outcome (${cfg} → ${expect})`,
  ...doctorRun(cfg),
  assert({ transcript }) {
    const { failures, check } = checker();
    check(outcome(transcript) === expect, `outcome "${outcome(transcript)}", expected "${expect}"`);
    const r = doctorRows(transcript).find((x) => x.tool === row[0]);
    check(r?.status === row[1], `${row[0]} status "${r?.status}", expected ${row[1]}`);
    return failures;
  },
}));
