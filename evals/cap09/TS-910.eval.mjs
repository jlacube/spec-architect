// C001-TC-910 — verifies C001-TS-910 (C001-AC-909.1, C001-REQ-909): open defect at orientation.
// The workspace is built with the real CLI: change 004 with C004-REQ-012 in 10-spec and defect D-001.
import { checker, firstReply } from "../harness/assert.mjs";
import { git, sdd, write } from "../harness/workspaces.mjs";

const REQ = [
  "---", "id: C004-CAP-01", "artifact: spec/requirements", "change: CHG-004", "phase: 10-spec", "status: approved", "---", "",
  "# Payments — requirements", "",
  "### C004-REQ-012 — Card expiry check",
  "- **Pattern:** event-driven",
  "- **Statement:** WHEN a card is submitted, THE payment service SHALL reject a card whose expiry date is before the current local date.",
  "",
].join("\n");

export default {
  id: "TS-910",
  title: "Open defect at orientation",
  agent: "architect:sdd-conductor",
  fixture: (root) => {
    git(root, "init", "-q");
    sdd(root, "init");
    for (let i = 1; i <= 4; i++) sdd(root, "change", "new", ["Onboarding", "Search", "Exports", "Card payments"][i - 1]);
    write(root, ".sdd/004-card-payments/10-spec/20-capabilities/CAP-01-payments/requirements.md", REQ);
    sdd(root, "defect", "add", "--ref", "C004-REQ-012", "--summary", "PSP returns expiry in UTC; REQ assumes local date", "--by", "p02");
  },
  maxTurns: 16,
  prompt: "hi",
  assert({ transcript }) {
    const { failures, check } = checker();
    const reply = firstReply(transcript);
    check(/D-001/.test(reply) && /C004-REQ-012|REQ-012/.test(reply), `first reply does not list D-001 with C004-REQ-012: ${reply.slice(0, 200)}`);
    check(/\/architect:revise\s+spec\b[^\n]*\b004\b/.test(reply), "first reply does not propose /architect:revise spec 004");
    return failures;
  },
};
