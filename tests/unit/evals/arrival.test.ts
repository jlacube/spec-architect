// The parse check of C001-T-083 step 4 (D-019 item 1): the arrival-to-ask assertions of C001-TC-225
// (evals/cap02/TS-225.eval.mjs) and the revised C001-TC-215 (TS-215.eval.mjs), on the terms of the C001-AC-221.1
// note, run on transcripts without a model session. They pass on the synthetic passing transcripts
// (evals/fixtures/transcripts/), report "Given not met" (valid_run false) or a conductor failure on edited
// copies of them, and fail on the recorded t082-d018 traces (the observed failures; those sessions count as no
// runs, CHG-002 D-033). The recorded transcripts are not in the repository (evals/results/transcripts/ is
// ignored), so that case is skipped where they are missing.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import TS215 from "../../../evals/cap02/TS-215.eval.mjs";
import TS225 from "../../../evals/cap02/TS-225.eval.mjs";
import { askOnArrival, carries } from "../../../evals/cap02/arrival.mjs";
import { repoRoot } from "../../helpers.ts";

type Rec = { t: number; type: string; message?: Record<string, any>; [k: string]: unknown };
type Failures = string[] & { valid_run?: boolean };
const root = repoRoot();
const load = (p: string): Rec[] => {
  const text = readFileSync(p, "utf8");
  return p.endsWith(".jsonl") ? text.split("\n").filter(Boolean).map((l) => JSON.parse(l) as Rec) : (JSON.parse(text) as Rec[]);
};
const synthetic = (name: string) => load(join(root, "evals", "fixtures", "transcripts", name));
const quiet = () => {};
const run = (scenario: { assert: (a: { transcript: Rec[]; log: () => void }) => unknown }, transcript: Rec[]) => scenario.assert({ transcript, log: quiet }) as Failures;

const idx = (t: Rec[], f: (r: Rec) => boolean) => {
  const i = t.findIndex(f);
  assert.ok(i >= 0);
  return i;
};
const isNote = (id: string) => (r: Rec) => r.message?.["subtype"] === "task_notification" && r.message?.["tool_use_id"] === id;
const isAsk = (r: Rec) => (r.message?.["message"]?.content ?? []).some((b: { name?: string }) => b.name === "AskUserQuestion");
const agentCall = (id: string, type: string): Rec => ({ t: 0, type: "sdk", message: { type: "assistant", message: { id: `m-${id}`, content: [{ type: "tool_use", id, name: "Agent", input: { subagent_type: type, prompt: "x" } }] }, parent_tool_use_id: null } });

for (const [name, scenario] of [["ts225-pass.jsonl", TS225], ["ts215-pass.jsonl", TS215]] as const) {
  test(`C001-TC-${scenario.id.slice(3)} parse check: ${name} passes`, () => {
    const f = run(scenario, synthetic(name));
    assert.deepEqual([...f], []);
    assert.notEqual(f.valid_run, false);
  });
}

test("the attended and unattended cases use the requests of C001-TS-225 and C001-TS-215", () => {
  assert.equal(TS225.prompt, "Draft the spec of CHG-001.");
  assert.equal(TS215.prompt, "Draft the spec of CHG-001 unattended, I'll review at the gate.");
});

test("an Agent call between the arrival and the ask fails the run (a conductor failure, valid run)", () => {
  const t = synthetic("ts225-pass.jsonl");
  t.splice(idx(t, isAsk), 0, agentCall("toolu_x", "architect:sdd-test-designer"));
  const f = run(TS225, t);
  assert.deepEqual([...f], ["architect:sdd-test-designer dispatched between the arrival of the blocking question Q-scope-01 and the AskUserQuestion call that carries it"]);
  assert.notEqual(f.valid_run, false);
});

test("a turn that ends before the ask fails the run; an ask in a later turn does not count", () => {
  const t = synthetic("ts215-pass.jsonl");
  t.splice(idx(t, isAsk), 0, { t: 0, type: "sdk", message: { type: "result", subtype: "success", result: "waiting for the spec writer" } });
  const f = run(TS215, t);
  assert.equal(f.length, 1);
  assert.match(f[0]!, /^the blocking question Q-scope-01 was not asked between its arrival and the end of the conductor's turn/);
  assert.notEqual(f.valid_run, false);
});

test("an ask that does not carry the blocking question fails the run", () => {
  const t = synthetic("ts225-pass.jsonl");
  const ask = t[idx(t, isAsk)]!.message!["message"].content.find((b: { name?: string }) => b.name === "AskUserQuestion");
  ask.input.questions[0].question = "Shall I continue with the stories now?";
  assert.match(run(TS225, t)[0]!, /was not asked/);
});

test("Given not met: the spec-writer handed back before the cartographer's hand-back arrived", () => {
  const t = synthetic("ts225-pass.jsonl");
  const [note] = t.splice(idx(t, isNote("toolu_writer")), 1);
  t.splice(idx(t, isNote("toolu_carto")), 0, note!);
  const f = run(TS225, t);
  assert.deepEqual([...f], ["Given not met: the spec-writer had handed back before the cartographer's hand-back arrived"]);
  assert.equal(f.valid_run, false);
});

test("Given not met: no blocking question in the cartographer's hand-back, or no cartographer", () => {
  const t = synthetic("ts215-pass.jsonl").map((r) => JSON.parse(JSON.stringify(r).replace(/\\"blocking\\": true/g, '\\"blocking\\": false')) as Rec);
  const f = run(TS215, t);
  assert.equal(f.length, 1);
  assert.match(f[0]!, /^Given not met: no cartographer hand-back holds a blocking question/);
  assert.equal(f.valid_run, false);
  const none = synthetic("ts215-pass.jsonl").filter((r) => !JSON.stringify(r).includes("toolu_carto"));
  assert.match(askOnArrival(none).failures[0] ?? "", /^Given not met: the cartographer was not dispatched/);
});

test("carries: at least half of the distinct words of five or more letters", () => {
  const q = "Which checkout does the coupon discount apply to?"; // which, checkout, coupon, discount, apply → 5 words
  assert.ok(carries("Does the discount apply to the web checkout?", q)); // checkout, discount, apply: 3 of 5
  assert.ok(!carries("Which checkout?", q)); // 2 of 5
});

// The recorded t082-d018 traces (the observed failures of D-019): every TS-215 / TS-223 / TS-224 trace in which
// the cartographer's blocking question arrived while the spec-writer ran is a conductor failure.
const results = join(root, "evals", "results");
const recorded = readdirSync(results)
  .filter((n) => n.startsWith("t082-d018-") && n.endsWith(".json"))
  .flatMap((n) => (JSON.parse(readFileSync(join(results, n), "utf8")).records as { transcript: string }[]).map((r) => r.transcript));
const present = recorded.filter((p) => existsSync(join(root, p)));
test("the assertions fail on the recorded t082-d018 traces", { skip: present.length === 0 ? "recorded transcripts not present (evals/results/transcripts/ is not in the repository)" : false }, () => {
  for (const p of present) {
    const t = load(join(root, p));
    for (const scenario of [TS215, TS225]) assert.ok(run(scenario, t).length > 0, `${scenario.id} on ${p}`);
  }
  const ts215 = present.find((p) => p.includes("TS-215-2026-10-24T12-26-47-550Z"));
  if (ts215) {
    const f = run(TS215, load(join(root, ts215)));
    assert.deepEqual([...f], ["the blocking question Q-scope-01 was not asked between its arrival and the end of the conductor's turn (a result message; asked after the arrival: none)"]);
    assert.notEqual(f.valid_run, false, "the Given held: a conductor failure, not Given not met");
  }
});
