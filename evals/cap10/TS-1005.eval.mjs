// C001-TC-1005 — verifies C001-TS-1005 (C001-AC-1004.1, C001-REQ-1004): unindexed language disclosed. The
// repository holds 12 .proto files, so ripwire's map header reports unindexed="proto:12"; every
// evidence entry derived from the map discloses "unindexed: proto (12 files)".
import { checker } from "../harness/assert.mjs";
import { write } from "../harness/workspaces.mjs";
import { brief, brownfield, cartoRun, EVIDENCE, evidence, read } from "./carto.mjs";

function protos(root) {
  for (let i = 1; i <= 12; i++) write(root, `proto/m${i}.proto`, `syntax = "proto3";\nmessage M${i} { string id = 1; }\n`);
}

export default {
  id: "TS-1005",
  title: "Unindexed language disclosed",
  ...cartoRun("cfg-full", brief("Give an overview of the main modules from ripwire's ranked map of the repository (one evidence entry per main module).", `\`${EVIDENCE}/modules-overview.md\`.`), brownfield({ extra: protos })),
  assert({ root }) {
    const { failures, check } = checker();
    const entries = evidence(read(root, `${EVIDENCE}/modules-overview.md`)).filter((e) => e.layer === "ripwire");
    check(entries.length > 0, "no ripwire evidence entry");
    for (const e of entries) check(/unindexed:\s*proto \(12 files\)/.test(e.disclosures), `${e.id}: disclosures "${e.disclosures}"`);
    return failures;
  },
};
