// C001-TC-1112 — verifies C001-TS-1112 (C001-AC-1111.1, C001-REQ-1111): doctor outcome, one scenario per
// Examples row: DeepWiki unreachable endpoint → completed with warnings; Serena and ast-grep missing
// (cfg-bare) → completed with warnings; node 18 on PATH → failed: node ≥ 20 required.
// Row deepwiki-down, changed expectation of C002-TS-626 (C002-REQ-504, C002-REQ-522; defect D-057,
// C002-T-084): the unresolvable endpoint of cfg-deepwiki-down leaves the host with no DeepWiki tool to
// offer the researcher, so the DeepWiki row is `untested` with the `not offered` fix of C002-IF-006 §2.1
// (before: `unreachable`); the outcome stays "completed with warnings".
import { checker } from "../harness/assert.mjs";
import { remoteFix } from "../targets/doctor/doctor-cases.mjs";
import { doctorRows, doctorRun, outcome } from "./doctor.mjs";

const NOT_OFFERED = remoteFix("DeepWiki", "not offered").replace(/https:\S+$/, "");

const EXAMPLES = [
  { id: "deepwiki-down", cfg: "cfg-deepwiki-down", expect: "completed with warnings", row: ["DeepWiki", "untested"], fix: NOT_OFFERED },
  { id: "bare", cfg: "cfg-bare", expect: "completed with warnings", row: ["Serena", "missing"] },
  { id: "node18", cfg: "cfg-node18", expect: "failed: node ≥ 20 required", row: ["node", "error"] },
];

export default EXAMPLES.map(({ id, cfg, expect, row, fix }) => ({
  id: `TS-1112-${id}`,
  title: `Doctor outcome (${cfg} → ${expect})`,
  ...doctorRun(cfg),
  assert({ transcript }) {
    const { failures, check } = checker();
    check(outcome(transcript) === expect, `outcome "${outcome(transcript)}", expected "${expect}"`);
    const r = doctorRows(transcript).find((x) => x.tool === row[0]);
    check(r?.status === row[1], `${row[0]} status "${r?.status}", expected ${row[1]}`);
    if (fix) check(String(r?.fix ?? "").replace(/[`*]/g, "").includes(fix), `${row[0]} Fix "${r?.fix}", expected it to contain "${fix}"`);
    return failures;
  },
}));
