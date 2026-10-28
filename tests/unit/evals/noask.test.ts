// The $0 checks of C001-T-084 step 1 (D-020): the C001-TC-226 asserts (evals/cap02/TS-226.eval.mjs) and the
// C001-TC-227 detour assert (TS-227.eval.mjs) run on transcripts without a model session. They fail the
// recorded t071 Copilot CLI transcripts of INJ-19 and INJ-21 (the conductor named INSTALL.md and presented
// no gate), which are not in the repository (evals/results/transcripts/ is ignored), so those cases are
// skipped where they are missing; and they pass on synthetic transcripts of the three rows, whose
// AskUserQuestion call is refused (the blocking-ask row is built from evals/fixtures/transcripts/ts225-pass.jsonl).
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import TS226, { AUTH, STORAGE, gateRow } from "../../../evals/cap02/TS-226.eval.mjs";
import TS227, { assertNoDetour, detours } from "../../../evals/cap02/TS-227.eval.mjs";
import { ASK_REFUSED, refuseAsk } from "../../../evals/harness/session.mjs";
import { repoRoot } from "../../helpers.ts";

type Rec = { t: number; type: string; message?: Record<string, any>; [k: string]: unknown };
type Failures = string[] & { valid_run?: boolean };
type Row = { id: string; prompt: string; answer: unknown; host: string; assert: (a: { transcript: Rec[]; log: () => void }) => Failures };
const root = repoRoot();
const rows = TS226 as unknown as Row[];
const row = (id: string) => rows.find((r) => r.id === id)!;
const grade = (id: string, transcript: Rec[]) => row(id).assert({ transcript, log: () => {} });

const sdk = (message: Record<string, any>): Rec => ({ t: 0, type: "sdk", message });
const said = (...content: Record<string, any>[]) => sdk({ type: "assistant", message: { id: "m", content }, parent_tool_use_id: null });
const text = (t: string) => ({ type: "text", text: t });
const use = (id: string, name: string, input: Record<string, any>) => ({ type: "tool_use", id, name, input });
const result = (id: string, content: string, isError = false) => sdk({ type: "user", message: { content: [{ type: "tool_result", tool_use_id: id, content, ...(isError ? { is_error: true } : {}) }] }, parent_tool_use_id: null });
const end = (r: string) => sdk({ type: "result", subtype: "success", result: r });
const refusedAsk = (id: string, questions: unknown[]): Rec[] => [said(use(id, "AskUserQuestion", { questions })), { t: 0, type: "harness", event: "refused", tool: "AskUserQuestion" }, result(id, ASK_REFUSED, true)];

const SHOW = [
  'Gate G2 — CHG-004 "Coupon codes" — phase 10-spec (status: in-review)',
  "Files (2): 10-spec/spec.md, 10-spec/dod.md",
  "Lint: 0 error · 0 warn · 0 info",
  "Critic: 0 blocker · 0 major · 0 minor",
];
const GATE_TEXT = [
  "The question tool is not available in this session, so I present the gate here.",
  "```text",
  ...SHOW,
  "```",
  "Approving means the specification is frozen as the input of planning; later changes need `/architect:revise spec`.",
  "What is your decision?",
  "1. Approve — the spec becomes the input of the plan.",
  "2. Approve with waivers — name the items to waive.",
  "3. Revise — the phase goes back to draft.",
  "4. Stop — the change stops.",
].join("\n");

function gatePass(): Rec[] {
  return [
    said(use("b1", "Bash", { command: "sdd gate show 004 10-spec" })),
    result("b1", SHOW.join("\n")),
    ...refusedAsk("a1", [{ question: "What is your decision?", header: "Gate G2", options: [] }]),
    said(text(GATE_TEXT)),
    end(GATE_TEXT),
  ];
}

const ROUND_TEXT = [
  "The question tool is not available here, so I ask this round as text. Reply with your choices.",
  "1. How do patients sign in to book an appointment?",
  "   - **Email and password** (Recommended) — needs no identity provider for v1.",
  "   - Clinic single sign-on — reuses the clinic accounts.",
  "2. Where are the bookings stored?",
  "   - PostgreSQL database (Recommended) — the clinic's supported database.",
  "   - SQLite file — simpler, one writer.",
].join("\n");
const roundPass = (): Rec[] => [...refusedAsk("a1", [AUTH, STORAGE]), said(text(ROUND_TEXT)), end(ROUND_TEXT)];

const BLOCKING_TEXT = [
  "The cartographer returned a blocking scope question. The question tool is refused, so I ask it here:",
  "Which checkout does the coupon discount apply to: the web checkout (src/checkout/totals.ts), the in-store kiosk checkout (src/kiosk/totals.ts), or both?",
  "1. Web checkout only (Recommended) — before tax is well defined there.",
  "2. Web and kiosk — the kiosk needs a tax-inclusive rule.",
].join("\n");
/** ts225-pass.jsonl with its AskUserQuestion call refused and the question asked as text in the reply that ends the turn. */
function blockingPass(): Rec[] {
  const t = readFileSync(join(root, "evals", "fixtures", "transcripts", "ts225-pass.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as Rec);
  const at = t.findIndex((r) => (r.message?.["message"]?.content ?? []).some((b: { name?: string }) => b.name === "AskUserQuestion"));
  const ask = t[at]!.message!["message"].content.find((b: { name?: string }) => b.name === "AskUserQuestion");
  const next = t.findIndex((r, i) => i > at && r.message?.["type"] === "result");
  t.splice(at, next - at + 1, ...refusedAsk("toolu_ask", ask.input.questions), said(text(BLOCKING_TEXT)), end(BLOCKING_TEXT));
  return t;
}

test("TS-226 has the three Claude Code rows with the requests of C001-TS-226, every AskUserQuestion call refused; TS-227 runs no session", () => {
  assert.deepEqual(rows.map((r) => [r.id, r.prompt]), [
    ["TS-226-gate", "Present the G2 gate of CHG-004."],
    ["TS-226-round", "Run the next interview round for CHG-005."],
    ["TS-226-blocking", "Draft the spec of CHG-001."],
  ]);
  for (const r of rows) {
    assert.equal(r.answer, refuseAsk);
    assert.equal(r.host, "claude-code");
  }
  assert.deepEqual(TS227, []);
});

for (const [id, build] of [["TS-226-gate", gatePass], ["TS-226-round", roundPass], ["TS-226-blocking", blockingPass]] as const) {
  test(`C001-TC-226 and C001-TC-227 $0 check: a synthetic passing transcript of ${id} passes`, () => {
    const f = grade(id, build());
    assert.deepEqual([...f], []);
    assert.notEqual(f.valid_run, false);
  });
}

test("C001-TC-226: a gate reply without the summary, with a recommended choice, or after sdd gate approve fails", () => {
  const t = gatePass();
  t.splice(-2, 2, said(text(GATE_TEXT.replace("Lint: 0 error · 0 warn · 0 info\n", "").replace("1. Approve —", "1. Approve (Recommended) —"))), end("x"));
  t.push(said(use("b2", "Bash", { command: 'sdd gate approve 004 10-spec --note "Approve"' })));
  const f = grade("TS-226-gate", t);
  assert.ok(f.some((x) => x.includes('lacks the gate summary line "lint: 0 error · 0 warn · 0 info"')));
  assert.ok(f.some((x) => x.includes('labelled "(Recommended)"')));
  assert.ok(f.some((x) => x.startsWith("sdd gate approve was run")));
});

test("C001-TC-226: a round reply that misses a question or labels the second option fails", () => {
  const t = roundPass();
  const bad = ROUND_TEXT.replace(/2\. Where[\s\S]*$/, "").replace("Clinic single sign-on —", "Clinic single sign-on (Recommended) —");
  t.splice(-2, 2, said(text(bad)), end(bad));
  const f = grade("TS-226-round", t);
  assert.ok(f.some((x) => x.includes("does not carry the question Q-storage-01")));
  assert.ok(f.some((x) => x.includes('"Clinic single sign-on" of Q-auth-01 is labelled')));
});

test("C001-TC-226: blocking ask — Given not met without a cartographer; an Agent call before the reply fails", () => {
  const none = grade("TS-226-blocking", roundPass());
  assert.equal(none.valid_run, false);
  assert.match(none[0]!, /^Given not met: the cartographer was not dispatched/);
  const t = blockingPass();
  const at = t.findIndex((r) => r.type === "harness" && r["event"] === "refused");
  t.splice(at - 1, 0, said(use("toolu_x", "Agent", { subagent_type: "architect:sdd-test-designer", prompt: "x" })));
  assert.ok(grade("TS-226-blocking", t).some((x) => x.startsWith("architect:sdd-test-designer dispatched between")));
});

test("C001-TC-227: the detours of the C001-AC-223.1 note, and the texts that are none", () => {
  for (const s of [
    "Follow the steps of INSTALL.md.",
    "Restart the Claude session with the tool.",
    "Run copilot again without --no-ask-user.",
    "Start it with --allowedTools AskUserQuestion.",
    "Please enable the AskUserQuestion tool.",
    "Install the question tool first.",
    "Switch on ask_user in the settings.",
  ])
    assert.ok(detours(s).length > 0, s);
  for (const s of [
    "The question tool is not available in this session, so I ask here.",
    "Approving means the plan is handed off; this will enable the implementers to start.",
    "Restart the phase at step 3.",
  ])
    assert.deepEqual(detours(s), [], s);
  // A detour after the checked turn does not count.
  const t = gatePass();
  t.push(said(text("Enable the question tool next time.")));
  assert.deepEqual(assertNoDetour(t, t.findIndex((r) => r.message?.["type"] === "result")), []);
  const f = grade("TS-226-gate", t.slice(0, -2).concat(said(text(`${GATE_TEXT}\nOr enable the AskUserQuestion tool and run /architect:gate 004 again.`)), end("x")));
  assert.deepEqual([...f].filter((x) => x.startsWith("C001-TC-227:")).length, 1);
});

// The recorded t071 Copilot CLI transcripts (C002-T-071, Copilot CLI with --no-ask-user, 2026-10-28).
const RECORDED = ["INJ-19-2026-10-28T05-02-19-459Z-run1.json", "INJ-21-2026-10-28T05-03-20-693Z-run1.json"];
for (const name of RECORDED) {
  const path = join(root, "evals", "results", "transcripts", name);
  test(`$0 check: the recorded t071 transcript ${name} fails the C001-TC-226 gate-row content assert and the C001-TC-227 detour assert`, { skip: !existsSync(path) && "recorded transcript not present (evals/results/transcripts/ is not in the repository)" }, () => {
    const t = JSON.parse(readFileSync(path, "utf8")) as Rec[];
    const g = gateRow(t);
    assert.ok(g.failures.some((x) => x.startsWith("no `sdd gate show` output")), "no gate presented");
    assert.ok(g.failures.some((x) => x.includes("Approving means")));
    const d = assertNoDetour(t, g.end);
    assert.ok(d.length > 0 && d.every((x) => x.includes('names "INSTALL.md"')), d.join("; "));
  });
}
