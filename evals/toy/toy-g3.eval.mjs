// Toy change to G3 on a machine configuration (C001-M-4 exit item, closed by C001-T-072 step 5): a tiny
// brownfield change on a copy of fx-brownfield-ts taken by the real conductor and specialists from
// `/architect:new` through ideation (G1), specification (G2) and planning (G3, plan approved), on cfg-full and
// on cfg-bare (evals/harness/machines.mjs). P-01's part is scripted: every interview question gets its first
// option (the recommended one, interview-protocol), every gate question "Approve".
//
// A chain of sessions, one row per configuration. Each session (one run of the row) continues the chain: the
// fixture restores the workspace the previous session of the chain left (`stateDir`), or builds the starting
// workspace when the chain has none; the prompt is the command a user would type next for the change's state
// (`nextStep`); the assert checks the session's rules, saves the workspace for the next session and, once G3 is
// approved, checks the end state and writes the chain's evidence file. A session that ends at its spend or turn
// cap leaves its work in the workspace and the next session resumes the phase, as `/architect:ideate`,
// `/architect:specify` and `/architect:plan` do ("Run or resume"). evals/toy/chain.mjs runs the sessions of a
// chain one after the other through run.mjs.
//
// A session passes when it keeps the rules (no `sdd gate approve` without P-01's Approve to a gate question
// asked before it in the session; nothing written outside `.sdd/`) and moves the change on (the `.sdd/` tree
// changed); the last one also when the end state holds (`finalProblems`).
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { constitution } from "../cap02/drafting.mjs";
import { isGate } from "../cap08/gate.mjs";
import { toolCalls, writesOutside } from "../harness/assert.mjs";
import { ROOT } from "../harness/fixtures.mjs";
import { machine } from "../harness/machines.mjs";
import { CLI, git, sdd, write } from "../harness/workspaces.mjs";

export const CONFIGS = ["cfg-full", "cfg-bare"];
export const TITLE = "Warn on zero-total invoices";
export const IDEA =
  "When issueInvoice (src/billing/invoice.ts) issues an invoice for a captured intent whose amount is 0 cents, it logs one warning that names the intent ID. Nothing else changes.";
export const NNN = "001";
export const PHASES = ["00-ideation", "10-spec", "20-plan"];
const START = { "00-ideation": "ideate", "10-spec": "specify", "20-plan": "plan" };
/** Lite-profile files each phase leaves (phase-ideation, phase-spec, phase-plan). */
export const LITE_FILES = ["00-ideation/ideation.md", "10-spec/spec.md", "10-spec/dod.md", "20-plan/plan.md", "20-plan/handoff.md"];

const SERENA = ["find_symbol", "get_symbols_overview", "find_referencing_symbols", "find_declaration", "find_implementations"].map((t) => `mcp__plugin_architect_serena__${t}`);
const RESEARCH = [
  "mcp__plugin_architect_context7__resolve-library-id",
  "mcp__plugin_architect_context7__query-docs",
  "mcp__plugin_architect_deepwiki__read_wiki_structure",
  "mcp__plugin_architect_deepwiki__read_wiki_contents",
  "mcp__plugin_architect_deepwiki__ask_wiki_question",
];
/** The conductor's tools that ask for approval, and its specialists' (subagent calls go through the same approval). */
export const TOY_TOOLS = ["Agent", "Write", "Edit", "Bash", "Skill", "WebSearch", "WebFetch", "ToolSearch", "LSP", ...SERENA, ...RESEARCH];

/** The toolchain record of each configuration (the doctor's table, C001-REQ-115), as `/architect:doctor` writes it there. */
export function toolchainFor(cfg) {
  const row = (tool, yes, version, where, fallback) => `| ${tool} | ${yes ? "yes" : "no"} | ${yes ? version : "—"} | ${yes ? where : "—"} | ${fallback} |`;
  const full = cfg === "cfg-full";
  return [
    "# Toolchain",
    "",
    "| Tool | Detected | Version | Path or endpoint | Fallback in use |",
    "|---|---|---|---|---|",
    row("ripwire", full, "0.6.5", "PATH", full ? "—" : "Serena, then grep/glob"),
    row("Serena", full, "1.7.0", "MCP", full ? "—" : "grep/glob"),
    row("ast-grep", full, "0.42.3", "PATH", full ? "—" : "grep"),
    "",
  ].join("\n");
}

/** The chain's starting workspace: fx-brownfield-ts under git, `sdd init`, the constitution approved (G0), the toolchain of `cfg`; no change yet. */
export function startWorkspace(cfg) {
  return (root) => {
    cpSync(join(ROOT, "tests", "fixtures", "fx-brownfield-ts"), root, { recursive: true });
    git(root, "init", "-q");
    // The author of the conductor's gate records (P-01 of the eval).
    git(root, "config", "user.name", "P-01 (eval)");
    git(root, "config", "user.email", "p01@example.invalid");
    sdd(root, "init");
    constitution(root, "approved");
    write(root, ".sdd/_constitution/toolchain.md", toolchainFor(cfg));
    sdd(root, "status", "--write");
    git(root, "add", "-A");
    git(root, "commit", "-q", "-m", "fixture");
  };
}

/** Folder that holds the chain of `cfg`: `workspace/` (the last session's workspace) and `chain.json` (one entry per session). */
export function stateDir(cfg, base = process.env.SDD_EVAL_TOY_STATE ?? join(tmpdir(), "sdd-eval-toy-g3")) {
  return join(base, cfg);
}

/** The change of `sdd status --json` (CHG-001), or null. */
export function changeOf(status) {
  return (status?.changes ?? []).find((c) => c.id === `CHG-${NNN}`) ?? null;
}

/**
 * The next step of the chain for a status document: `{ done: true }` once 20-plan is approved, else
 * `{ command, phase }`: `new` without the change; for the first phase not approved, its gate when it is
 * `in-review`, else its phase command (start or resume).
 */
export function nextStep(status) {
  const c = changeOf(status);
  if (!c) return { command: "new", phase: null };
  for (const phase of PHASES) {
    const s = c.phases?.[phase]?.status ?? "not-started";
    if (s === "approved") continue;
    return { command: s === "in-review" ? "gate" : START[phase], phase };
  }
  return { done: true };
}

/** The prompt of a step (what P-01 types). The idea goes with `new` and with every ideation session. */
export function promptOf(step) {
  if (step.done) throw new Error("the chain is complete: G3 is approved");
  if (step.command === "new") return `/architect:new "${TITLE}" --kind brownfield\n\nThe idea: ${IDEA}`;
  const idea = step.phase === "00-ideation" ? `\n\nThe idea: ${IDEA}` : "";
  return `/architect:${step.command} ${NNN}${idea}`;
}

export const statusOf = (root) => JSON.parse(sdd(root, "status", "--json"));

/** Files under `dir` (relative, `/` separators), sorted. */
export function filesUnder(dir, base = dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .flatMap((n) => {
      const p = join(dir, n);
      return statSync(p).isDirectory() ? filesUnder(p, base) : [relative(base, p).split("\\").join("/")];
    })
    .sort();
}

/** Hash of the `.sdd/` tree (paths and contents); the registry's and SDD.md's generated timestamps do not count. */
export function sddFingerprint(root) {
  const h = createHash("sha256");
  const sddDir = join(root, ".sdd");
  for (const f of filesUnder(sddDir)) {
    const text = readFileSync(join(sddDir, f), "utf8").replace(/"?generated_at"?:\s*"[^"]*"/g, "").replace(/generated \d{4}-\d\d-\d\dT[\d:.]+Z/g, "");
    h.update(`${f}\0${text}\0`);
  }
  return h.digest("hex");
}

/** Text of a tool_result block's content. */
const textOf = (content) => (typeof content === "string" ? content : (content ?? []).filter((b) => b?.type === "text").map((b) => b.text).join(""));

/**
 * `sdd gate approve` calls of the session without P-01's approval: each must come after a harness answer
 * record in which a gate question (Approve … Stop) was answered Approve or Approve with waivers, and use no
 * answer twice. Returns one problem per call without one.
 */
export function approvalProblems(transcript) {
  const problems = [];
  let approvals = 0;
  transcript.forEach((r) => {
    if (r?.type === "harness" && r.event === "answer") {
      for (const q of r.questions ?? []) if (isGate(q) && /^Approve\b/.test(String(r.answers?.[q.question] ?? ""))) approvals += 1;
    }
    if (r?.type === "sdk" && r.message?.type === "assistant") {
      for (const b of r.message.message?.content ?? []) {
        if (b?.type !== "tool_use" || b.name !== "Bash" || !/\bgate\s+approve\b/.test(String(b.input?.command ?? ""))) continue;
        if (approvals > 0) approvals -= 1;
        else problems.push(`sdd gate approve without P-01's Approve to a gate question before it: ${String(b.input.command).slice(0, 160)}`);
      }
    }
  });
  return problems;
}

/** Bash calls by any agent that ran ripwire, and Serena tool calls (the code-intelligence layers used). */
export function layersUsed(transcript) {
  const calls = toolCalls(transcript);
  return {
    ripwire: calls.filter((c) => c.name === "Bash" && /\bripwire\b/.test(String(c.input?.command ?? ""))).length,
    serena: calls.filter((c) => c.name.startsWith("mcp__plugin_architect_serena__")).length,
    agents: calls.filter((c) => c.name === "Agent" && !c.agent).map((c) => String(c.input?.subagent_type ?? "?").replace(/^architect:/, "")),
  };
}

/** Paths outside `.sdd/` that differ from the fixture commit (tracked changes and untracked files). */
export function changedOutsideSdd(root) {
  const r = spawnSync("git", ["status", "--porcelain", "--untracked-files=all", "--", ".", ":(exclude).sdd", ":(exclude).claude", ":(exclude).serena"], { cwd: root, encoding: "utf8" });
  if (r.status !== 0) return [`git status failed: ${(r.stderr ?? "").trim()}`];
  return r.stdout.split(/\r?\n/).filter(Boolean).map((l) => l.slice(3));
}

/** Output and exit code of an sdd command in `root`. */
function sddRun(root, ...args) {
  const r = spawnSync(process.execPath, [CLI, ...args], { cwd: root, encoding: "utf8" });
  return { code: r.status, out: `${r.stdout ?? ""}${r.stderr ?? ""}`.trim() };
}

/** Problems of the end state: G1, G2 and G3 approved, none stale, the lite files present, `sdd lint 001` without errors, three approvals in the gate log. */
export function finalProblems(root) {
  const problems = [];
  const stale = sddRun(root, "stale", "check", NNN);
  if (stale.code !== 0) problems.push(`sdd stale check ${NNN} exit ${stale.code}: ${stale.out.slice(0, 300)}`);
  const c = changeOf(statusOf(root));
  for (const phase of PHASES) {
    const p = c?.phases?.[phase];
    if (p?.status !== "approved" || !p.approved_hash) problems.push(`${phase} is ${p?.status ?? "missing"}${p?.approved_hash ? "" : ", no approved hash"}`);
  }
  const dir = c ? join(root, ".sdd", c.slug) : null;
  if (c && c.profile !== "lite") problems.push(`profile ${c.profile}, not lite (the toy change's recommended profile)`);
  for (const f of c?.profile === "lite" ? LITE_FILES : []) if (!existsSync(join(dir, ...f.split("/")))) problems.push(`no ${f}`);
  const lint = sddRun(root, "lint", NNN, "--json");
  try {
    const errors = (JSON.parse(lint.out).findings ?? []).filter((f) => f.severity === "error");
    if (errors.length > 0) problems.push(`sdd lint ${NNN}: ${errors.length} error(s): ${errors.map((f) => f.rule ?? f.code).join(", ")}`);
  } catch {
    if (lint.code !== 0) problems.push(`sdd lint ${NNN} exit ${lint.code}: ${lint.out.slice(0, 300)}`);
  }
  const log = dir && existsSync(join(dir, "change.md")) ? readFileSync(join(dir, "change.md"), "utf8").split(/^## Gate log/m)[1] ?? "" : "";
  for (const g of ["G1", "G2", "G3"]) if (!new RegExp(`\\|[^\\n]*\\b${g}\\b[^\\n]*\\bapprove`, "i").test(log)) problems.push(`no ${g} approval in the gate log of change.md`);
  return problems;
}

const readJson = (p, fallback) => {
  try {
    return JSON.parse(readFileSync(p, "utf8"));
  } catch {
    return fallback;
  }
};

/** Replaces the saved workspace of the chain with `root`. */
export function saveWorkspace(root, dir) {
  const ws = join(dir, "workspace");
  rmSync(ws, { recursive: true, force: true, maxRetries: 20, retryDelay: 250 });
  mkdirSync(dir, { recursive: true });
  cpSync(root, ws, { recursive: true });
}

// Per session: the fingerprint and step taken when its fixture was built (keyed by the workspace root).
const starts = new Map();

/** The row of configuration `cfg`. `base` overrides the state folder (tests). */
export function toyRow(cfg, { base } = {}) {
  const dir = () => stateDir(cfg, base);
  return {
    id: `toy-g3-${cfg}`,
    title: `Toy change to G3 on ${cfg} (C001-M-4)`,
    agent: "architect:sdd-conductor",
    // The machine overlay and PATH are built when a session starts (cfg-full needs the ripwire install).
    plugins: [() => machine(cfg).plugins[0]()],
    get env() {
      return { ...machine(cfg).env, CLAUDE_CODE_ENABLE_TODO_TOOLS: "1" };
    },
    allowTools: TOY_TOOLS,
    maxTurns: 30,
    // Serena connects a few seconds after session start; a subagent's tool set is fixed when it starts.
    startDelayMs: 15000,
    answer: (q) => (isGate(q) ? "Approve" : q.options?.[0]?.label ?? ""),
    fixture(root) {
      const saved = join(dir(), "workspace");
      if (existsSync(join(saved, ".sdd"))) cpSync(saved, root, { recursive: true });
      else startWorkspace(cfg)(root);
      const step = nextStep(statusOf(root));
      if (step.done) throw new Error(`toy-g3-${cfg}: the chain in ${dir()} is complete (G3 approved); remove it to start a new chain`);
      starts.set(root, { fingerprint: sddFingerprint(root), step });
    },
    prompt: (root) => promptOf(starts.get(root)?.step ?? nextStep(statusOf(root))),
    assert({ transcript, root, result, log = console.log }) {
      const start = starts.get(root) ?? { fingerprint: null, step: null };
      starts.delete(root);
      const failures = [...approvalProblems(transcript)];
      for (const p of writesOutside(transcript, root, ".sdd")) failures.push(`written outside .sdd/: ${p}`);
      for (const p of changedOutsideSdd(root)) failures.push(`changed outside .sdd/: ${p}`);
      const after = nextStep(statusOf(root));
      const moved = sddFingerprint(root) !== start.fingerprint;
      if (!moved) failures.push(`no progress: the .sdd/ tree is unchanged after ${start.step?.command ?? "?"} ${start.step?.phase ?? ""}`.trim());
      const final = after.done ? finalProblems(root) : [];
      failures.push(...final);
      saveWorkspace(root, dir());
      const chainFile = join(dir(), "chain.json");
      const chain = readJson(chainFile, { cfg, sessions: [] });
      const c = changeOf(statusOf(root));
      const entry = {
        n: chain.sessions.length + 1,
        at: new Date().toISOString(),
        step: start.step,
        prompt: promptOf(start.step ?? { command: "new" }).split("\n")[0],
        end: result?.subtype ?? null,
        cost_usd: typeof result?.total_cost_usd === "number" ? Math.round(result.total_cost_usd * 1e6) / 1e6 : null,
        phases: Object.fromEntries(PHASES.map((p) => [p, c?.phases?.[p]?.status ?? null])),
        profile: c?.profile ?? null,
        layers: layersUsed(transcript),
        failures: failures.length,
      };
      chain.sessions.push(entry);
      writeFileSync(chainFile, JSON.stringify(chain, null, 2) + "\n");
      log(`  toy-g3-${cfg} session ${entry.n}: ${entry.prompt} → ${PHASES.map((p) => `${p} ${entry.phases[p]}`).join(", ")} · end ${entry.end} · ${entry.cost_usd ?? "?"} USD · agents ${entry.layers.agents.join(", ") || "none"} · ripwire ${entry.layers.ripwire}, serena ${entry.layers.serena}`);
      if (after.done) {
        const total = chain.sessions.reduce((s, x) => s + (x.cost_usd ?? 0), 0);
        const evidence = {
          cfg,
          completed: final.length === 0,
          problems: final,
          sessions: chain.sessions,
          total_cost_usd: Math.round(total * 1e6) / 1e6,
          change: c,
          files: filesUnder(join(root, ".sdd", c?.slug ?? "-")),
          gate_log: (readFileSync(join(root, ".sdd", c.slug, "change.md"), "utf8").split(/^## Gate log/m)[1] ?? "").trim(),
        };
        const out = join(ROOT, "evals", "results", `toy-g3-${cfg}-chain-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
        writeFileSync(out, JSON.stringify(evidence, null, 2) + "\n");
        log(`  toy-g3-${cfg}: G3 approved after ${chain.sessions.length} session(s), ${evidence.total_cost_usd} USD notional; ${final.length === 0 ? "end state holds" : `end-state problems: ${final.join("; ")}`}; evidence ${relative(ROOT, out)}`);
      }
      return failures;
    },
  };
}

export default CONFIGS.map((cfg) => toyRow(cfg));

