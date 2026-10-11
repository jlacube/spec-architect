// C001-TC-133 — verifies C001-TS-133 (C001-AC-127.1, C001-REQ-127): G0 enforcement. The constitution is a
// draft; asked to start ideation, the conductor dispatches no specialist and names the unapproved
// constitution and /architect:gate constitution. The /architect:ideate command arrives in
// C001-T-033; until then the request is made in words.
import { checker, dispatches, finalReply, toolCalls } from "../harness/assert.mjs";
import { constitution } from "../cap02/drafting.mjs";
import { git, sdd } from "../harness/workspaces.mjs";

export default {
  id: "TS-133",
  title: "G0 enforcement",
  agent: "architect:sdd-conductor",
  fixture: (root) => {
    git(root, "init", "-q");
    sdd(root, "init");
    constitution(root, "draft");
    sdd(root, "change", "new", "Coupon codes");
    sdd(root, "status", "--write");
  },
  maxTurns: 14,
  prompt: "Start the ideation of change 001.",
  assert({ transcript }) {
    const { failures, check } = checker();
    check(dispatches(transcript).length === 0, "a specialist was dispatched");
    check(toolCalls(transcript).every((c) => c.name !== "Write" && c.name !== "Edit"), "files were written");
    const reply = finalReply(transcript);
    check(/_constitution\/constitution\.md/.test(reply), "reply does not name _constitution/constitution.md");
    check(/\/architect:gate constitution/.test(reply), "reply does not suggest /architect:gate constitution");
    return failures;
  },
};
