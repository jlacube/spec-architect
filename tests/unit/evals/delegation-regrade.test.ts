// C001-T-063: re-grade of timed-out routing runs (evals/delegation/suite.mjs regradeTimeouts). A run that
// `claude plugin eval` fails only because it timed out (the session was still waiting for its subagent) is
// graded again from its kept trace with the case's own deterministic graders; the raw verdict is kept.
import { test } from "node:test";
import assert from "node:assert/strict";
import { regradeTimeouts, traceTranscript } from "../../../evals/delegation/suite.mjs";

type Rec = Record<string, any>;

const route = (agent: string) => `"subagent_type"\\s*:\\s*"architect:${agent}"`;
const CASES = [
  {
    name: "route-critic-01",
    graders: [
      { name: "routes-to-critic", type: "tool_used", tool: "Agent", input_match: route("sdd-critic"), min: 1 },
      { name: "no-other-architect-agent", type: "tool_used", tool: "Agent", input_match: `"subagent_type"\\s*:\\s*"architect:(?!sdd-critic")`, min: 0, max: 0 },
    ],
  },
];

/** A kept trace: SDK messages, one JSON object per line; the session dispatched `agents` and never finished. */
const trace = (agents: string[]) =>
  [
    { type: "system", subtype: "init" },
    { type: "assistant", parent_tool_use_id: null, message: { content: agents.map((a, i) => ({ type: "tool_use", id: `t${i}`, name: "Agent", input: { description: "x", subagent_type: `architect:${a}`, prompt: "brief" } })) } },
    // The subagent's own messages carry parent_tool_use_id; it was still working at the time limit.
    { type: "assistant", parent_tool_use_id: "t0", message: { content: [{ type: "tool_use", id: "s1", name: "Read", input: { file_path: "x" } }] } },
  ]
    .map((m) => JSON.stringify(m))
    .join("\n") + "\nnot json\n";

const rec = (run: number, pass: boolean, failures: string[], tracePath: string | null): Rec => ({ case: "route-critic-01", run, pass, failures, trace: tracePath, metrics: {} });

test("traceTranscript wraps each JSON line as an sdk record and skips unparsable lines", () => {
  const t = traceTranscript(trace(["sdd-critic"]));
  assert.equal(t.length, 3);
  assert.deepEqual(t.map((r: Rec) => r.type), ["sdk", "sdk", "sdk"]);
  assert.equal(t[1]!.message.type, "assistant");
});

test("timed-out runs are re-graded from their traces; raw verdicts and other runs are unchanged", () => {
  const traces: Record<string, string> = { right: trace(["sdd-critic"]), wrong: trace(["sdd-planner"]), two: trace(["sdd-critic", "sdd-auditor"]) };
  const records = [
    rec(1, true, [], "right"), // passed: not re-graded
    rec(2, false, ["timed out after 120s"], "right"), // routed correctly, then timed out → re-graded pass
    rec(3, false, ["timed out after 120s"], "wrong"), // routed to another agent → re-graded fail
    rec(4, false, ["timed out after 120s"], "two"), // routed to the critic and to another agent → fail
    rec(5, false, ["timed out after 120s"], null), // no trace kept → fail, stated
    rec(6, false, ["routes-to-critic: Agent called 0x (expected 1..∞)"], "right"), // a real miss: not re-graded
  ];
  const raw = JSON.parse(JSON.stringify(records));
  const doc: Rec = { runs: records.length, passed: 1, records };
  regradeTimeouts(doc, CASES, (r: Rec) => (r.trace ? traces[r.trace]! : null));

  assert.deepEqual(doc.records.map((r: Rec) => [r.pass, r.failures]), raw.map((r: Rec) => [r.pass, r.failures]), "raw verdicts kept");
  assert.equal(doc.records[0].regraded, undefined);
  assert.equal(doc.records[5].regraded, undefined, "a failure that is not a timeout is not re-graded");
  assert.deepEqual(doc.records[1].regraded, { pass: true, failures: [], reason: "timed out; re-graded from the kept trace" });
  assert.equal(doc.records[2].regraded.pass, false);
  assert.match(doc.records[2].regraded.failures.join("; "), /routes-to-critic: Agent called 0x/);
  assert.equal(doc.records[3].regraded.pass, false);
  assert.match(doc.records[3].regraded.failures.join("; "), /no-other-architect-agent: Agent called 1x/);
  assert.deepEqual(doc.records[4].regraded, { pass: false, failures: ["timed out and no trace was kept"], reason: "timed out; not re-gradable" });
  assert.deepEqual(doc.regraded, { passed: 2, runs: 6, regraded: 4 }, "raw 1 pass + 1 re-graded pass");
  assert.equal(doc.passed, 1, "the raw count is unchanged");
});

test("a timed-out run of a case the suite does not hold is not re-gradable", () => {
  const doc: Rec = { runs: 1, passed: 0, records: [{ ...rec(1, false, ["timed out after 120s"], "x"), case: "gone-01" }] };
  regradeTimeouts(doc, CASES, () => trace(["sdd-critic"]));
  assert.equal(doc.records[0].regraded.pass, false);
  assert.deepEqual(doc.records[0].regraded.failures, ["no case gone-01 in the suite"]);
  assert.deepEqual(doc.regraded, { passed: 0, runs: 1, regraded: 1 });
});
