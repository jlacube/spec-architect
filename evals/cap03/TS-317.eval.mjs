// C001-TC-317 — verifies C001-TS-317 (C001-AC-315.2, C001-REQ-315): two active changes, no --change.
// Changes 003 and 004 are active (001 and 002 stopped); the conductor asks which change to use
// before dispatching the researcher.
import { checker, dispatches } from "../harness/assert.mjs";
import { architectWithStubs } from "../harness/overlay.mjs";
import { changesFixture } from "./adhoc.mjs";

export default {
  id: "TS-317",
  title: "Two active changes, no --change",
  agent: "architect:sdd-conductor",
  plugins: [architectWithStubs],
  fixture: changesFixture({ stopped: ["001", "002"] }),
  allowTools: ["Agent", "Write", "Edit", "Bash"],
  maxTurns: 10,
  prompt: '/architect:research "Which cron expression libraries support time zones?"',
  assert({ transcript }) {
    const { failures, check } = checker();
    const asked = transcript.find((r) => r.type === "harness" && r.event === "answer" && r.questions.some((q) => /003|004|change/i.test(`${q.question} ${q.options.map((o) => o.label).join(" ")}`)));
    check(asked, "the conductor did not ask which change to use");
    const first = dispatches(transcript).find((d) => d.type.endsWith("sdd-researcher"));
    if (first && asked) check(first.t > asked.t, "the researcher was dispatched before the question");
    return failures;
  },
};
