// C001-TC-216 — verifies C001-TS-216 (C001-AC-214.1, C001-REQ-214): dispatch brief fields. At the spec
// start of CHG-004 the conductor's brief to the spec-writer names the change, the phase, input paths
// under .sdd/004-, the IDs to use, the output paths, the skills and the return contract.
import { checker, dispatches } from "../harness/assert.mjs";
import { architectWithStubs } from "../harness/overlay.mjs";
import { specStart } from "./drafting.mjs";

export default {
  id: "TS-216",
  title: "Dispatch brief fields",
  agent: "architect:sdd-conductor",
  plugins: [architectWithStubs],
  fixture: specStart({ nnn: 4 }),
  env: { CLAUDE_CODE_ENABLE_TODO_TOOLS: "1" },
  allowTools: ["Agent", "Write", "Edit", "Bash"],
  maxTurns: 10,
  prompt: "Start the spec phase of CHG-004.",
  assert({ transcript }) {
    const { failures, check } = checker();
    const brief = dispatches(transcript).find((d) => /spec-writer/.test(d.type));
    check(brief, `no spec-writer dispatch (dispatched: ${dispatches(transcript).map((d) => d.type).join(", ") || "none"})`);
    const p = (brief?.prompt ?? "").split(String.fromCharCode(92)).join("/");
    check(/CHG-004/.test(p), "brief lacks CHG-004");
    check(/10-spec/.test(p), "brief lacks 10-spec");
    check(/\.sdd\/004-/.test(p), "brief lacks an input path under .sdd/004-");
    check(/\b(REQ|US|CAP)\b|ID/.test(p) && /sdd id next|C004-|block/i.test(p), "brief lacks the IDs to use");
    check(/output|write/i.test(p) && /10-spec\/[\w./-]+\.md/.test(p), "brief lacks output paths");
    check(/user-stories|ears-requirements|sdd-conventions|nfr-catalogue/.test(p), "brief names no skill");
    check(/return|hand-back|digest/i.test(p) && /questions/i.test(p), "brief lacks the return contract");
    return failures;
  },
};
