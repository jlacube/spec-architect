// The toy change to G3 (evals/toy/toy-g3.eval.mjs, evals/toy/chain.mjs; C001-M-4, C001-T-072 step 5): the
// next step and prompt per change state, the approval rule, the driver's decision, and the chain's fixture,
// fingerprint and assert on a real workspace (no session).
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
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
  // a chain ends at or under it.
  assert.equal(chainMod.rowCapUsd("cfg-full"), 6);
  assert.equal(chainMod.rowCapUsd("cfg-bare"), null); // deferred (revision D-044, critic CR-141)
  assert.equal(chainMod.rowCapUsd("cfg-no-ripwire"), null);
  assert.deepEqual(chainMod.decide({ chain: { sessions: [s(12), s(12)] }, done: false, maxSessions: 12, maxUsd: 30 }), { go: true });
  const near = chainMod.decide({ chain: { sessions: [s(12), s(12.01)] }, done: false, maxSessions: 12, maxUsd: 30 });
  assert.equal(near.go, false);
  assert.equal(near.code, 2);
  assert.match(near.why, /6 USD cap would pass --max-usd 30/);
  assert.deepEqual(chainMod.decide({ chain: { sessions: [s(14.54)] }, done: false, maxSessions: 12, maxUsd: 30 }), { go: true });
  // Revision D-044 (55 USD, 14 sessions, the chain as saved then): from 26.78 USD in 8 sessions four more sessions
  // start at the 6.00 USD cap (50.78 USD) and a fifth does not (56.78 > 55).
  // The eight saved sessions of 2026-11-07/08 (critic CR-114): 26.78 USD in total.
  const SAVED = [0.270748, 3.044059, 3.057491, 2.10657, 3.021874, 3.039415, 6.22584, 6.011027];
  assert.equal(chainMod.chainUsd({ sessions: SAVED.map((c) => s(c)) }), 26.777024);
  const resumed = (extra: number[]) => ({ sessions: [...SAVED, ...extra].map((c) => s(c)) });
  assert.deepEqual(chainMod.decide({ chain: resumed([]), done: false, maxSessions: 14, maxUsd: 55 }), { go: true });
  assert.deepEqual(chainMod.decide({ chain: resumed([6, 6, 6]), done: false, maxSessions: 14, maxUsd: 55 }), { go: true });
  const atCap = chainMod.decide({ chain: resumed([6, 6, 6, 6]), done: false, maxSessions: 14, maxUsd: 55 });
  assert.equal(atCap.code, 2); // every session at the cap: stops after session 12 at about 51 USD (critic CR-113)
  assert.match(atCap.why, /^50\.77\d* USD notional/);
  // Revision D-045 (75 USD, 18 sessions): the chain as saved on 2026-11-08 holds 12 sessions, 42.22 USD; at the
  // 6.00 USD cap five more start (72.22 USD, session 17) and a sixth does not (78.22 > 75); the bound of 18 leaves
  // room for six, so the USD limit binds first at the cap.
  const SAVED12 = [...SAVED, 6.007784, 6.077154, 2.810696, 0.54592];
  assert.equal(chainMod.chainUsd({ sessions: SAVED12.map((c) => s(c)) }), 42.218578);
  const resumed12 = (extra: number[]) => ({ sessions: [...SAVED12, ...extra].map((c) => s(c)) });
  assert.deepEqual(chainMod.decide({ chain: resumed12([6, 6, 6, 6]), done: false, maxSessions: 18, maxUsd: 75 }), { go: true });
  const at75 = chainMod.decide({ chain: resumed12([6, 6, 6, 6, 6]), done: false, maxSessions: 18, maxUsd: 75 });
  assert.equal(at75.code, 2);
  assert.match(at75.why, /^72\.21\d* USD notional/);
  const cheap18 = chainMod.decide({ chain: resumed12([1, 1, 1, 1, 1, 1]), done: false, maxSessions: 18, maxUsd: 75 });
  assert.match(cheap18.why, /^18 sessions, the --max-sessions limit/);
  // Cheap sessions: the session bound stops the chain at 14 sessions before the USD limit (critic CR-114).
  assert.deepEqual(chainMod.decide({ chain: resumed([1, 1, 1, 1, 1]), done: false, maxSessions: 14, maxUsd: 55 }), { go: true });
  const cheap = chainMod.decide({ chain: resumed([1, 1, 1, 1, 1, 1]), done: false, maxSessions: 14, maxUsd: 55 });
  assert.equal(cheap.code, 2);
  assert.match(cheap.why, /^14 sessions, the --max-sessions limit/);
  // An explicit session cap still applies: at 3.00 USD a 13.00 USD chain may start one more session under 16.
  assert.deepEqual(chainMod.decide({ chain: { sessions: [s(13)] }, done: false, maxSessions: 12, maxUsd: 16, sessionUsd: 3 }), { go: true });
  assert.equal(chainMod.decide({ chain: { sessions: [s(1)] }, done: false, maxSessions: 12, maxUsd: 16, sessionUsd: 15.5 }).code, 2);
});

test("resumeProblem (critic CR-109): a resume without --fresh needs a chain.json with at least one saved session", () => {
  const base = mkdtempSync(join(tmpdir(), "toy-g3-resume-"));
  try {
    const dir = join(base, "cfg-full");
    assert.match(chainMod.resumeProblem(dir), /no saved chain at .*chain\.json; start a new chain with --fresh/);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "chain.json"), "{ not json");
    assert.match(chainMod.resumeProblem(dir), /is not valid JSON/);
    writeFileSync(join(dir, "chain.json"), JSON.stringify({ cfg: "cfg-full", sessions: [] }));
    assert.match(chainMod.resumeProblem(dir), /holds no saved session/);
    writeFileSync(join(dir, "chain.json"), JSON.stringify({ cfg: "cfg-full", sessions: [{ n: 1, cost_usd: 0.27, failures: 0 }] }));
    assert.equal(chainMod.resumeProblem(dir), null);
  } finally {
    removeTempDir(base);
  }
});

test("chainLimits (revision D-044): cfg-full 14 sessions and 55 USD, options may only lower them; cfg-bare deferred", () => {
  assert.deepEqual(chainMod.chainLimits("cfg-full"), { maxSessions: 18, maxUsd: 75 });
  assert.deepEqual(chainMod.chainLimits("cfg-full", { maxSessions: null, maxUsd: null }), { maxSessions: 18, maxUsd: 75 });
  assert.deepEqual(chainMod.chainLimits("cfg-full", { maxSessions: 10, maxUsd: 40 }), { maxSessions: 10, maxUsd: 40 });
  // Option refusals have their own exit code, 5 (critic CR-139).
  assert.equal(chainMod.chainLimits("cfg-full", { maxUsd: 75.01 }).code, 5);
  assert.equal(chainMod.chainLimits("cfg-full", { maxSessions: 19 }).code, 5);
  assert.equal(chainMod.chainLimits("cfg-full", { maxUsd: 0 }).code, 5);
  assert.equal(chainMod.chainLimits("cfg-no-ripwire").code, 5);
  // --fresh is refused for cfg-full, whose chain resumes (critic CR-140).
  const fresh = chainMod.chainLimits("cfg-full", { fresh: true });
  assert.equal(fresh.code, 5);
  assert.match(fresh.refusal, /--fresh is refused for cfg-full/);
  const bare = chainMod.chainLimits("cfg-bare");
  assert.equal(bare.code, 4);
  assert.match(bare.refusal, /cfg-bare is deferred to the follow-up change 'Cost and token efficiency' \(defect D-044\)/);
});

test("afterFailureProblem (revision D-045): a resume after a failed last session needs --after-fix; --after-fix needs one", () => {
  const s = (n: number, failures = 0) => ({ n, cost_usd: 1, failures });
  const failed = { sessions: [s(11), s(12, 1)] };
  const ok = { sessions: [s(11), s(12)] };
  const refused = chainMod.afterFailureProblem(failed);
  assert.equal(refused.code, 6);
  assert.match(refused.refusal, /last saved session \(12\) failed; resume with --after-fix only once its cause is fixed/);
  assert.equal(chainMod.afterFailureProblem(failed, true), null);
  assert.equal(chainMod.afterFailureProblem(ok), null);
  assert.equal(chainMod.afterFailureProblem(ok, true).code, 5);
  // After the fixed resume, the chain goes on: decide reads no failure of an earlier process (lastExit 0).
  assert.deepEqual(chainMod.decide({ chain: failed, done: false, maxSessions: 18, maxUsd: 75 }), { go: true });
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

