// C001-TC-1117 / C001-TS-1117 (C001-AC-1116.1, C001-REQ-1116): eval inventory. The delegation suite
// (`claude plugin eval` case files under plugins/architect/evals/, read by evals/delegation/suite.mjs) has at
// least 40 prompts, and each of the ten agents has at least 3 must-route prompts and at least 1
// must-not-route prompt; PLG-EVAL-001 reports nothing. The case files are also checked against the case
// format of `claude plugin eval` (Claude Code 2.1.299), and every case's graders are scored on a
// synthetic correct route and a synthetic misroute with the deterministic grader of evals/harness/cases.mjs.
// No model session runs.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { counts, suite } from "../../../evals/delegation/suite.mjs";
import { grade } from "../../../evals/harness/cases.mjs";
import { EVAL_DIR_NAME, HINT, IMPLICIT, IMPLICIT_DIR_NAME, writeSuite } from "../../../evals/delegation/gen-suite.mjs";
import { files } from "../../../scripts/check/lib.mjs";
import { pluginCopy } from "./structure.ts";
import { repoRoot } from "../../helpers.ts";

type Rec = Record<string, any>;
const AGENTS = ["sdd-conductor", "sdd-researcher", "sdd-cartographer", "sdd-options-analyst", "sdd-spec-writer", "sdd-test-designer", "sdd-architect", "sdd-planner", "sdd-critic", "sdd-auditor"];
const PLUGIN = join(repoRoot(), "plugins", "architect");
const cases: Rec[] = suite(join(PLUGIN, "evals"), PLUGIN);

test("the suite has at least 40 prompts", () => {
  assert.ok(cases.length >= 40, `${cases.length} prompts`);
  for (const c of cases) assert.ok(c.prompt.length > 20, `${c.name}: prompt`);
});

test("each of the ten agents has at least 3 must-route prompts and at least 1 must-not-route prompt", () => {
  const n: Record<string, { must: number; mustNot: number }> = counts(cases, AGENTS);
  assert.deepEqual(Object.keys(n).sort(), [...AGENTS].sort());
  for (const a of AGENTS) {
    const { must, mustNot } = n[a]!;
    assert.ok(must >= 3, `${a}: ${must} must-route`);
    assert.ok(mustNot >= 1, `${a}: ${mustNot} must-not-route`);
  }
});

test("PLG-EVAL-001 reports nothing on the plugin and reports a short or invalid suite", () => {
  const p = pluginCopy();
  try {
    assert.deepEqual(p.findings("PLG-EVAL-001"), []);
    rmSync(join(p.plugin, "evals", "offtopic-01"), { recursive: true });
    rmSync(join(p.plugin, "evals", "offtopic-02"), { recursive: true });
    rmSync(join(p.plugin, "evals", "notroute-critic-01"), { recursive: true });
    rmSync(join(p.plugin, "evals", "route-architect-01"), { recursive: true });
    writeFileSync(join(p.plugin, "evals", "route-critic-01", "graders", "legacy.md"), "---\ntype: tool_used\ntool: Agent\nnegate: true\n---\n");
    const msgs = p.findings("PLG-EVAL-001").map((f: Rec) => f.message);
    assert.ok(msgs.some((m: string) => /^38 prompts, at least 40/.test(m)), msgs.join("\n"));
    assert.ok(msgs.includes("sdd-architect: 2 must-route prompts, at least 3"), msgs.join("\n"));
    assert.ok(msgs.includes("sdd-critic: no must-not-route prompt"), msgs.join("\n"));
    assert.ok(msgs.some((m: string) => /negate \/ tool_not_used is not a claude plugin eval grader/.test(m)), msgs.join("\n"));
  } finally {
    p.cleanup();
  }
});

test("PLG-EVAL-001 (D-016): conductor must-route cases declare the hand-over and no-subagent checks, must-not-route cases the hand-over check", () => {
  const p = pluginCopy();
  try {
    const ev = join(p.plugin, "evals");
    rmSync(join(ev, "route-conductor-01", "graders", "no-architect-subagent.md"));
    rmSync(join(ev, "notroute-conductor-01", "graders", "no-hand-over-to-conductor.md"));
    // The hand-over without "claude" is not the literal of D-016: no longer a conductor must-route.
    writeFileSync(join(ev, "route-conductor-02", "graders", "hands-over-to-conductor.md"), "---\ntype: regex\ntarget: last_message\nmatch: contains\n---\n\n--agent architect:sdd-conductor\n");
    const f = p.findings("PLG-EVAL-001").map((x: Rec) => `${x.path} — ${x.message}`);
    assert.ok(f.some((m: string) => /route-conductor-01 — sdd-conductor must-route case without the check that no Architect subagent starts/.test(m)), f.join("\n"));
    assert.ok(f.some((m: string) => /notroute-conductor-01 — sdd-conductor must-not-route case without the hand-over check/.test(m)), f.join("\n"));
    assert.ok(f.includes("plugins/architect/evals — sdd-conductor: 2 must-route prompts, at least 3"), f.join("\n"));
  } finally {
    p.cleanup();
  }
});

test("every routing case keeps the plugin commands (Skill) out of the routing decision", () => {
  for (const c of cases) assert.deepEqual(c.options.disallowed_tools, ["Skill"], c.name);
  for (const c of cases) assert.deepEqual(c.problems, [], c.name);
});

// The case format of `claude plugin eval` (Claude Code 2.1.299): prompt.md frontmatter keys, the strict
// grader schemas, and execution.env limited to EVAL_* keys.
const PROMPT_KEYS = new Set(["schema_version", "name", "description", "tags", "plugins", "runs", "expected_outcome", "model", "max_turns", "timeout_seconds", "allowed_tools", "disallowed_tools", "artifact_publish", "growthbook_overrides", "append_system_prompt", "env"]);
const GRADER_KEYS: Record<string, Set<string>> = {
  tool_used: new Set(["type", "name", "tool", "input_match", "min", "max", "weight", "arm"]),
  regex: new Set(["type", "name", "target", "match", "flags", "weight", "arm"]),
};

test("every case file is in the claude plugin eval case format", () => {
  for (const c of cases) {
    for (const k of Object.keys(c.options)) assert.ok(PROMPT_KEYS.has(k), `${c.name}: prompt.md key ${k}`);
    for (const k of Object.keys(c.options.env ?? {})) assert.match(k, /^EVAL_/, `${c.name}: env key ${k}`);
    assert.ok(Number.isInteger(c.options.runs) && c.options.runs >= 3, `${c.name}: runs ${c.options.runs} (milestone tier: 3)`);
    assert.ok(c.options.max_turns > 0 && c.options.timeout_seconds > 0, `${c.name}: turn and time limits`);
    assert.ok(c.graders.length >= 1, `${c.name}: graders`);
    for (const g of c.graders) {
      const keys = GRADER_KEYS[g.type];
      assert.ok(keys, `${c.name}/${g.name}: grader type ${g.type}`);
      for (const k of Object.keys(g)) if (k !== "criteria" && k !== "name") assert.ok(keys.has(k), `${c.name}/${g.name}: key ${k}`);
      if (g.type === "tool_used") {
        assert.doesNotThrow(() => new RegExp(g.input_match), `${c.name}/${g.name}: input_match`);
        // Tools follow graders: a tool that must be called is granted; a "must not" sets min 0, max 0, arm both.
        if ((g.min ?? 1) >= 1) assert.ok((c.options.allowed_tools ?? []).includes(g.tool), `${c.name}: ${g.tool} not in allowed_tools`);
        if (g.max === 0) assert.deepEqual([g.min, g.arm], [0, "both"], `${c.name}/${g.name}: must-not form`);
      } else assert.doesNotThrow(() => new RegExp(g.criteria), `${c.name}/${g.name}: pattern`);
    }
  }
});

// Synthetic sessions in the SDK transcript shape (evals/harness/assert.mjs).
const dispatch = (agents: string[], reply = "Done."): Rec[] => [
  { t: 1, type: "sdk", message: { type: "assistant", message: { id: "m1", content: agents.map((a, i) => ({ type: "tool_use", id: `a${i}`, name: "Agent", input: { description: "x", subagent_type: `architect:${a}`, prompt: "brief" } })) }, parent_tool_use_id: null } },
  { t: 2, type: "sdk", message: { type: "result", subtype: "success", result: reply } },
];
const passes = (c: Rec, transcript: Rec[]) => grade(c.graders, { transcript, created: [] }).every((g: Rec) => g.passed);
const HANDOVER = "The Architect workflow runs in its own main session: start `claude --agent architect:sdd-conductor` and run /architect:new there.";

test("each case passes on its correct route and fails on a misroute", () => {
  for (const c of cases) {
    const main = c.must.filter((a: string) => a === "sdd-conductor");
    const sub = c.must.filter((a: string) => a !== "sdd-conductor");
    const right = dispatch(sub, main.length ? HANDOVER : "Done.");
    assert.ok(passes(c, right), `${c.name}: correct route graded as a failure`);
    for (const a of c.mustNot) assert.ok(!passes(c, dispatch([...sub, a], main.length ? HANDOVER : "Done.")), `${c.name}: a route to ${a} graded as a pass`);
    if (sub.length) assert.ok(!passes(c, dispatch([])), `${c.name}: no route graded as a pass`);
    if (main.length) {
      assert.ok(!passes(c, dispatch([], "Here is your ideation.")), `${c.name}: no hand-over graded as a pass`);
      assert.ok(!passes(c, dispatch([], "Restart with --agent architect:sdd-conductor.")), `${c.name}: a hand-over without the literal graded as a pass`);
      assert.ok(!passes(c, dispatch(["sdd-conductor"], HANDOVER)), `${c.name}: a conductor subagent graded as a pass`);
      assert.ok(!passes(c, dispatch(["sdd-researcher"], HANDOVER)), `${c.name}: a specialist subagent graded as a pass`);
    }
    if (c.mustNot.includes("sdd-conductor")) assert.ok(!passes(c, dispatch(sub, HANDOVER)), `${c.name}: a hand-over to the conductor graded as a pass`);
    if (sub.length === 1 && c.name.startsWith("route-")) {
      const other = AGENTS.find((a) => a !== sub[0] && a !== "sdd-conductor")!;
      assert.ok(!passes(c, dispatch([sub[0]!, other])), `${c.name}: an extra route to ${other} graded as a pass`);
    }
    if (c.name.startsWith("offtopic-")) assert.ok(!passes(c, dispatch(["sdd-researcher"])), `${c.name}: an Architect route graded as a pass`);
  }
});

test("the case files are what evals/delegation/gen-suite.mjs writes", () => {
  const tmp = mkdtempSync(join(tmpdir(), "sdd-gen-suite-"));
  try {
    writeSuite(tmp);
    for (const d of [EVAL_DIR_NAME, IMPLICIT_DIR_NAME]) {
      const want = files(join(tmp, d)).map((p: string) => [relative(join(tmp, d), p), readFileSync(p, "utf8")]);
      const have = files(join(PLUGIN, d)).filter((p: string) => !/[\/]results[\/]/.test(p)).map((p: string) => [relative(join(PLUGIN, d), p), readFileSync(p, "utf8")]);
      assert.deepEqual(have, want, `${d}/ differs from the generator: run node evals/delegation/gen-suite.mjs`);
    }
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test("every counted case ends with the neutral delegation hint, which names no agent", () => {
  assert.doesNotMatch(HINT, /sdd-|conductor|researcher|cartographer|analyst|writer|designer|architect:|planner|critic|auditor/);
  for (const c of cases) assert.ok(c.prompt.trimEnd().endsWith(HINT), `${c.name}: no hint`);
});

test("the implicit set: no hint, one run, must-route cases of five agents, outside the counted suite", () => {
  const implicit: Rec[] = suite(join(PLUGIN, IMPLICIT_DIR_NAME), PLUGIN);
  assert.equal(implicit.length, 5);
  assert.deepEqual(implicit.map((c) => c.name).sort(), IMPLICIT.map((n: string) => n.replace(/^route-/, "implicit-")).sort());
  for (const c of implicit) {
    assert.ok(!c.prompt.includes(HINT), `${c.name}: hint`);
    assert.equal(c.options.runs, 1, c.name);
    assert.ok((c.options.tags as string[]).includes("implicit"), c.name);
    assert.equal(c.must.length, 1, c.name);
    const twin = cases.find((x) => x.name === c.name.replace(/^implicit-/, "route-"))!;
    assert.equal(twin.prompt, `${c.prompt}\n\n${HINT}`, `${c.name}: the counted twin is the same prompt plus the hint`);
  }
  assert.equal(new Set(implicit.flatMap((c) => c.must)).size, 5, "five different agents");
  assert.ok(cases.every((c) => !c.name.startsWith("implicit-")), "no implicit case in the counted suite");
});
