// C001-TC-215 — verifies C001-TS-215 (C001-AC-213.2, C001-REQ-213): a blocking question interrupts
// unattended mode. In unattended spec drafting of a brownfield change, the cartographer (stand-in)
// hands back a blocking question; the conductor asks it before dispatching any further author.
import { checker, dispatches } from "../harness/assert.mjs";
import { architectWithStubs } from "../harness/overlay.mjs";
import { write } from "../harness/workspaces.mjs";
import { specStart } from "./drafting.mjs";

const HANDBACK = `Digest: checkout totals are computed in src/checkout (stand-in evidence). Written: none.

\`\`\`json questions
${JSON.stringify({ questions: [{ id: "Q-currency-01", topic: "currency", question: "Do coupons apply to orders in every currency or only in EUR?", why_it_matters: "The checkout converts currencies after discounts; the answer changes the requirement and the rounding rules.", blocking: true, material: false, options: [{ label: "EUR only", rationale: "Matches the only currency of the current campaigns.", recommended: true }, { label: "Every currency", rationale: "Needs a rounding rule per currency." }] }] }, null, 2)}
\`\`\`
`;

export default {
  id: "TS-215",
  title: "Blocking question interrupts unattended mode",
  agent: "architect:sdd-conductor",
  plugins: [architectWithStubs],
  fixture: (root) => {
    specStart({ brownfield: true, kind: "brownfield" })(root);
    write(root, ".eval/handbacks/sdd-cartographer.md", HANDBACK);
  },
  env: { CLAUDE_CODE_ENABLE_TODO_TOOLS: "1" },
  allowTools: ["Agent", "Write", "Edit", "Bash"],
  maxTurns: 22,
  prompt: "Draft the spec of CHG-001 unattended, I'll review at the gate.",
  assert({ transcript }) {
    const { failures, check } = checker();
    const d = dispatches(transcript);
    const carto = d.find((x) => x.type.endsWith("sdd-cartographer"));
    check(carto, `cartographer not dispatched (dispatched: ${d.map((x) => x.type).join(", ") || "none"})`);
    const asked = transcript.find((r) => r.type === "harness" && r.event === "answer" && r.questions.some((q) => /currenc|EUR/i.test(q.question)));
    check(asked, "the blocking currency question was not asked");
    if (carto && asked) {
      const later = d.filter((x) => x.message !== carto.message && x.t > carto.t);
      for (const x of later) check(x.t > asked.t, `${x.type} dispatched before the blocking question was asked`);
    }
    return failures;
  },
};
