// The toy change to G3 (evals/toy/toy-g3.eval.mjs, evals/toy/chain.mjs; C001-M-4, C001-T-072 step 5): the
// next step and prompt per change state, the approval rule, the driver's decision, and the chain's fixture,
// fingerprint and assert on a real workspace (no session).
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { repoRoot } from "../../helpers.ts";
import { removeTempDir } from "../../fixtures/temp-dir.ts";

const toy = await import(pathToFileURL(join(repoRoot(), "evals", "toy", "toy-g3.eval.mjs")).href);
const chainMod = await import(pathToFileURL(join(repoRoot(), "evals", "toy", "chain.mjs")).href);

const status = (phases: Record<string, string> | null) => ({
  changes: phases ? [{ id: "CHG-001", slug: "001-x", profile: "lite", phases: Object.fromEntries(Object.entries(phases).map(([k, v]) => [k, { status: v }])) }] : [],
});

test("nextStep: new, then each phase's command, its gate when in review, done after G3", () => {
  assert.deepEqual(toy.nextStep(status(null)), { command: "new", phase: null });
  const cases: [Record<string, string>, unknown][] = [
    [{ "00-ideation": "not-started", "10-spec": "not-started", "20-plan": "not-started" }, { command: "ideate", phase: "00-ideation" }],
    [{ "00-ideation": "draft", "10-spec": "not-started", "20-plan": "not-started" }, { command: "ideate", phase: "00-ideation" }],
    [{ "00-ideation": "in-review", "10-spec": "not-started", "20-plan": "not-started" }, { command: "gate", phase: "00-ideation" }],
    [{ "00-ideation": "approved", "10-spec": "not-started", "20-plan": "not-started" }, { command: "specify", phase: "10-spec" }],
    [{ "00-ideation": "approved", "10-spec": "in-revision", "20-plan": "not-started" }, { command: "specify", phase: "10-spec" }],
    [{ "00-ideation": "approved", "10-spec": "approved", "20-plan": "draft" }, { command: "plan", phase: "20-plan" }],
    [{ "00-ideation": "approved", "10-spec": "approved", "20-plan": "in-review" }, { command: "gate", phase: "20-plan" }],
    [{ "00-ideation": "approved", "10-spec": "approved", "20-plan": "approved" }, { done: true }],
  ];
  for (const [phases, want] of cases) assert.deepEqual(toy.nextStep(status(phases)), want, JSON.stringify(phases));
});

test("promptOf: the command P-01 types, with the idea for new and ideation", () => {
  assert.match(toy.promptOf({ command: "new", phase: null }), /^\/architect:new "Warn on zero-total invoices" --kind brownfield\n\nThe idea: .*issueInvoice/);
  assert.match(toy.promptOf({ command: "ideate", phase: "00-ideation" }), /^\/architect:ideate 001\n\nThe idea: /);
  assert.match(toy.promptOf({ command: "gate", phase: "00-ideation" }), /^\/architect:gate 001\n\nThe idea: /);
  assert.equal(toy.promptOf({ command: "specify", phase: "10-spec" }), "/architect:specify 001");
  assert.equal(toy.promptOf({ command: "gate", phase: "20-plan" }), "/architect:gate 001");
  assert.throws(() => toy.promptOf({ done: true }), /complete/);
});

const GATE = { question: "Gate G1 of CHG-001: your decision?", options: ["Approve", "Approve with waivers", "Revise", "Stop"].map((label) => ({ label })) };
const answer = (label: string, q = GATE) => ({ type: "harness", event: "answer", questions: [q], answers: { [q.question]: label } });
const bash = (command: string) => ({ type: "sdk", message: { type: "assistant", message: { content: [{ type: "tool_use", id: command, name: "Bash", input: { command } }] } } });
const APPROVE = 'node sdd.mjs gate approve 001 00-ideation --note "Approve"';

test("approvalProblems: an approval needs P-01's Approve to a gate question before it, one per approval", () => {
  assert.deepEqual(toy.approvalProblems([answer("Approve"), bash(APPROVE)]), []);
  assert.deepEqual(toy.approvalProblems([answer("Approve with waivers"), bash(APPROVE)]), []);
  assert.equal(toy.approvalProblems([bash(APPROVE), answer("Approve")]).length, 1);
  assert.equal(toy.approvalProblems([answer("Revise"), bash(APPROVE)]).length, 1);
  assert.equal(toy.approvalProblems([answer("Approve"), bash(APPROVE), bash(APPROVE)]).length, 1);
  // An interview question answered with its first option is no gate answer.
  const round = { question: "Which profile?", options: [{ label: "Lite (Recommended)" }, { label: "Full" }] };
  assert.equal(toy.approvalProblems([answer("Lite (Recommended)", round), bash(APPROVE)]).length, 1);
  assert.deepEqual(toy.approvalProblems([bash("node sdd.mjs gate show 001 00-ideation")]), []);
});

test("the row's answer policy: Approve at a gate, the first option elsewhere", () => {
  const row = toy.toyRow("cfg-bare");
  assert.equal(row.answer(GATE), "Approve");
  assert.equal(row.answer({ question: "Profile?", options: [{ label: "Lite (Recommended)" }, { label: "Full" }] }), "Lite (Recommended)");
  assert.equal(row.agent, "architect:sdd-conductor");
  assert.ok(row.allowTools.includes("Agent") && row.allowTools.includes("WebSearch") && row.allowTools.includes("mcp__plugin_architect_serena__find_symbol"));
});

test("decide: done, failure and limits", () => {
  const s = (cost: number, failures = 0) => ({ cost_usd: cost, failures });
  assert.deepEqual(chainMod.decide({ chain: { sessions: [] }, done: false, maxSessions: 3, maxUsd: 10 }), { go: true });
  assert.equal(chainMod.decide({ chain: { sessions: [s(2)] }, done: false, lastExit: 1, maxSessions: 3, maxUsd: 10 }).code, 1);
  assert.equal(chainMod.decide({ chain: { sessions: [s(2), s(3)] }, done: true, maxSessions: 3, maxUsd: 10 }).code, 0);
  assert.equal(chainMod.decide({ chain: { sessions: [s(2), s(3, 1)] }, done: true, maxSessions: 3, maxUsd: 10 }).code, 1);
  assert.equal(chainMod.decide({ chain: { sessions: [s(1), s(1), s(1)] }, done: false, maxSessions: 3, maxUsd: 10 }).code, 2);
  assert.equal(chainMod.decide({ chain: { sessions: [s(6), s(4)] }, done: false, maxSessions: 5, maxUsd: 10 }).code, 2);
  assert.equal(chainMod.chainUsd({ sessions: [s(0.1), s(0.2), { cost_usd: null }] }), 0.3);
  // Critic CR-134, revision D-043: the next session counts at the row's 6.00 USD cap (the default), so no session
  // starts when the total plus that cap would pass --max-usd (24.00 + 6.00 = 30 starts; 24.01 + 6.00 does not), and
  // a chain ends at or under it. The cfg-full chain resumed from its saved 14.54 USD starts at least two more sessions.
  assert.equal(chainMod.DEFAULT_MAX_USD, 30);
  assert.equal(chainMod.rowCapUsd("cfg-full"), 6);
  assert.equal(chainMod.rowCapUsd("cfg-bare"), 6);
  assert.equal(chainMod.rowCapUsd("cfg-no-ripwire"), null);
  assert.deepEqual(chainMod.decide({ chain: { sessions: [s(12), s(12)] }, done: false, maxSessions: 12, maxUsd: 30 }), { go: true });
  const near = chainMod.decide({ chain: { sessions: [s(12), s(12.01)] }, done: false, maxSessions: 12, maxUsd: 30 });
  assert.equal(near.go, false);
  assert.equal(near.code, 2);
  assert.match(near.why, /6 USD cap would pass --max-usd 30/);
  assert.deepEqual(chainMod.decide({ chain: { sessions: [s(14.54)] }, done: false, maxSessions: 12, maxUsd: 30 }), { go: true });
  // An explicit session cap still applies: at 3.00 USD a 13.00 USD chain may start one more session under 16.
  assert.deepEqual(chainMod.decide({ chain: { sessions: [s(13)] }, done: false, maxSessions: 12, maxUsd: 16, sessionUsd: 3 }), { go: true });
  assert.equal(chainMod.decide({ chain: { sessions: [s(1)] }, done: false, maxSessions: 12, maxUsd: 16, sessionUsd: 15.5 }).code, 2);
});

test("toolchainFor: cfg-full detects all three tools, cfg-bare none", () => {
  assert.match(toy.toolchainFor("cfg-full"), /\| ripwire \| yes \| 0\.6\.5 \|[\s\S]*\| Serena \| yes \|[\s\S]*\| ast-grep \| yes \|/);
  assert.match(toy.toolchainFor("cfg-bare"), /\| ripwire \| no \|[\s\S]*\| Serena \| no \|[\s\S]*\| ast-grep \| no \|/);
});

test("the chain on a real workspace: start, no-progress session, saved state, restored on the next session", () => {
  const base = mkdtempSync(join(tmpdir(), "sdd-toy-g3-test-"));
  const roots: string[] = [];
  try {
    const row = toy.toyRow("cfg-bare", { base });
    const ws1 = mkdtempSync(join(tmpdir(), "sdd-toy-g3-ws-"));
    roots.push(ws1);
    row.fixture(ws1);
    assert.ok(existsSync(join(ws1, ".sdd", "_constitution", "constitution.md")));
    assert.match(readFileSync(join(ws1, ".sdd", "_constitution", "toolchain.md"), "utf8"), /\| ripwire \| no \|/);
    assert.match(row.prompt(ws1), /^\/architect:new /);
    // The fingerprint ignores the regenerated timestamps of `sdd status --write`.
    const before = toy.sddFingerprint(ws1);
    toy.statusOf(ws1);
    assert.equal(toy.sddFingerprint(ws1), before);
    assert.deepEqual(toy.changedOutsideSdd(ws1), []);
    // A session that changed nothing: one failure (no progress); the workspace and chain.json are saved.
    const lines: string[] = [];
    const f1 = row.assert({ transcript: [], root: ws1, result: { subtype: "success", total_cost_usd: 0.25 }, log: (l: string) => lines.push(l) });
    assert.equal(f1.length, 1);
    assert.match(f1[0], /no progress/);
    const dir = toy.stateDir("cfg-bare", base);
    const chain = JSON.parse(readFileSync(join(dir, "chain.json"), "utf8"));
    assert.equal(chain.sessions.length, 1);
    assert.equal(chain.sessions[0].cost_usd, 0.25);
    assert.equal(chain.sessions[0].step.command, "new");
    assert.match(lines[0] ?? "", /toy-g3-cfg-bare session 1/);
    // The next session starts from the saved workspace, here after a change was created there.
    execFileSync(process.execPath, [join(repoRoot(), "plugins", "architect", "scripts", "sdd.mjs"), "change", "new", toy.TITLE, "--profile", "lite", "--kind", "brownfield"], { cwd: join(dir, "workspace") });
    const ws2 = mkdtempSync(join(tmpdir(), "sdd-toy-g3-ws-"));
    roots.push(ws2);
    row.fixture(ws2);
    assert.equal(row.prompt(ws2).split("\n")[0], "/architect:ideate 001");
    // A file changed outside .sdd/ fails the session.
    writeFileSync(join(ws2, "src", "billing", "invoice.ts"), "// changed\n");
    const f2 = row.assert({ transcript: [], root: ws2, result: null, log: () => {} });
    assert.ok(f2.some((f: string) => /no progress/.test(f)));
    assert.ok(f2.some((f: string) => /changed outside \.sdd\/: src\/billing\/invoice\.ts/.test(f)), JSON.stringify(f2));
    assert.equal(JSON.parse(readFileSync(join(dir, "chain.json"), "utf8")).sessions.length, 2);
  } finally {
    for (const r of roots) removeTempDir(r);
    removeTempDir(base);
  }
});

