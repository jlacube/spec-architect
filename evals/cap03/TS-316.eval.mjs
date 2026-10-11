// C001-TC-316 — verifies C001-TS-316 (C001-AC-315.1, C001-REQ-315): research with an explicit change.
// The researcher runs as a stand-in until C001-T-035 (harness/overlay.mjs).
import { join } from "node:path";
import { checker } from "../harness/assert.mjs";
import { architectWithStubs } from "../harness/overlay.mjs";
import { changesFixture, filesUnder, folderOf } from "./adhoc.mjs";

export default {
  id: "TS-316",
  title: "Research with explicit change",
  agent: "architect:sdd-conductor",
  plugins: [architectWithStubs],
  fixture: changesFixture(),
  allowTools: ["Agent", "Write", "Edit", "Bash"],
  maxTurns: 16,
  prompt: '/architect:research "Is libsodium available in Node 20?" --change 003',
  assert({ root }) {
    const { failures, check } = checker();
    const notes = filesUnder(join(root, ".sdd", folderOf(root, "003") ?? "-", "00-ideation", "research"));
    check(notes.some((n) => /^R-.*\.md$/.test(n)), `no research note under .sdd/003-*/00-ideation/research/ (found: ${notes.join(", ") || "none"})`);
    return failures;
  },
};
