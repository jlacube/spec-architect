// Scripted end-to-end flow of C001-TC-1102 in an isolated Claude profile (C001-TS-1102 steps 2–7, the machine
// form of the timed part; docs/test-responsibilities.md §2). It does not replace P-01's timed run (C001-NFR-602
// measures a person reading the README); it gives the machine time of each step and proves the flow.
//
//   node scripts/manual/isolated-profile-e2e.mjs <new empty folder> [--claude <claude.exe>] [--repo <path>]
//        [--max-usd 5] [--idea "Coupon codes"]
//
// The profile is the one of scripts/manual/isolated-profile-check.mjs: every CLAUDE* / ANTHROPIC* variable
// removed, CLAUDE_CONFIG_DIR, HOME, USERPROFILE and APPDATA pointing into the folder. The sign-in step (0) is
// replaced by the eval subscription token (CLAUDE_CODE_OAUTH_TOKEN from %USERPROFILE%\.architect-evals, read
// from the real profile before the switch, never printed or written). Steps:
//   2–4  claude plugin marketplace add <repo>, plugin install architect@architect-local, plugin list;
//   5    a toy folder under git, one Agent SDK session with agent architect:sdd-conductor and the profile's
//        user settings (the installed plugin; no --plugin-dir);
//   6    /architect:init (every question: the first option, which the interview protocol recommends), then
//        /architect:gate constitution (the gate question: Approve);
//   7    /architect:new "<idea>" (first options), then /architect:ideate; the run stops at the first
//        AskUserQuestion of the ideate step (the timer stops there in the manual form).
// The session is stopped at --max-usd (notional, the SDK's estimate). The transcript (JSONL) and a summary
// (summary.json) go to the folder; the summary is printed. Exit 0 when step 7 reached its first question.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, appendFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const args = process.argv.slice(2);
const opt = (name, dflt) => {
  const i = args.indexOf(name);
  return i >= 0 ? args.splice(i, 2)[1] : dflt;
};
const claude = opt("--claude") ?? process.env.CLAUDE_CODE_EXECPATH;
const repo = resolve(opt("--repo") ?? join(fileURLToPath(new URL(".", import.meta.url)), "..", ".."));
const maxUsd = Number(opt("--max-usd", "5"));
const idea = opt("--idea", "Coupon codes");
const root = args[0] && resolve(args[0]);
if (!root || !claude || !(maxUsd > 0)) {
  console.error("usage: node scripts/manual/isolated-profile-e2e.mjs <new empty folder> [--claude <claude.exe>] [--repo <path>] [--max-usd 5] [--idea TEXT]");
  process.exit(2);
}
if (existsSync(root) && readdirSync(root).length > 0) {
  console.error(`${root} is not empty: give a new folder`);
  process.exit(2);
}

// The eval token, read from the real profile before the switch (never printed or written).
const tokenFile = [join(homedir(), ".architect-evals", "claude-oauth-token"), join(homedir(), ".architect-evals", "claude-oauth-token.txt")].find((f) => existsSync(f));
const token = tokenFile ? readFileSync(tokenFile, "utf8").trim() : "";
if (!token) {
  console.error("no eval subscription token in %USERPROFILE%\\.architect-evals (claude-oauth-token)");
  process.exit(2);
}

const toy = join(root, "runs", "tc1102", "toy");
mkdirSync(join(root, "AppData", "Roaming"), { recursive: true });
mkdirSync(toy, { recursive: true });
const profile = {
  CLAUDE_CONFIG_DIR: join(root, ".claude"),
  HOME: root,
  USERPROFILE: root,
  APPDATA: join(root, "AppData", "Roaming"),
};
const baseEnv = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^(CLAUDE|ANTHROPIC)/i.test(k)));
const cliEnv = { ...baseEnv, ...profile };
const sessionEnv = { ...cliEnv, CLAUDE_CODE_OAUTH_TOKEN: token };

const t0 = Date.now();
const steps = [];
const git = (a, cwd) => spawnSync("git", a, { cwd, encoding: "utf8" }).stdout?.trim() ?? "";
const commit = git(["-C", repo, "rev-parse", "--short", "HEAD"]);
const dirtyPlugin = git(["-C", repo, "status", "--porcelain", "--", "plugins/architect", ".claude-plugin"]) !== "";
console.log(`repository ${repo} at ${commit}${dirtyPlugin ? " (plugin files modified)" : " (plugin files clean)"}; profile ${root}`);

const cli = (label, argv) => {
  const s = Date.now();
  const r = spawnSync(claude, argv, { cwd: toy, env: cliEnv, encoding: "utf8", timeout: 120_000 });
  const out = `${r.stdout ?? ""}${r.stderr ?? ""}`.trim();
  steps.push({ step: label, ms: Date.now() - s, exit: r.status });
  console.log(`\n> claude ${argv.join(" ")}   (exit ${r.status}, ${Date.now() - s} ms)\n${out.split(/\r?\n/).slice(0, 8).join("\n")}`);
  return { exit: r.status, out };
};
const version = cli("version", ["--version"]);
const add = cli("2 marketplace add", ["plugin", "marketplace", "add", repo]);
const install = cli("3 install", ["plugin", "install", "architect@architect-local"]);
const list = cli("4 list", ["plugin", "list"]);
const installed = add.exit === 0 && install.exit === 0 && /architect@architect-local/.test(list.out);
if (!installed) {
  console.log("\nE2E: FAIL (plugin not installed)");
  process.exit(1);
}

// Step 5: the toy repository.
git(["init", "-q"], toy);
git(["config", "user.name", "P-01 (tc1102 scripted)"], toy);
git(["config", "user.email", "p01@example.invalid"], toy);

const prompts = [
  { step: "6a init", text: "/architect:init" },
  { step: "6b gate constitution", text: "/architect:gate constitution" },
  { step: "7a new", text: `/architect:new "${idea}"` },
  { step: "7b ideate", text: "/architect:ideate" },
];
const transcriptFile = join(root, "transcript.jsonl");
const log = (rec) => appendFileSync(transcriptFile, `${JSON.stringify({ t: Date.now() - t0, ...rec })}\n`);
const answers = [];
let current = -1;
let stepStart = 0;
let firstIdeateQuestion = null;
let stopReason = null;
let lastCost = 0;
let initInfo = null;
const abortController = new AbortController();
const stop = (why) => {
  if (!stopReason) stopReason = why;
  if (!abortController.signal.aborted) abortController.abort();
};

let wake = () => {};
async function* input() {
  for (let i = 0; i < prompts.length; i++) {
    if (i > 0) await new Promise((r) => (wake = r));
    if (abortController.signal.aborted) return;
    current = i;
    stepStart = Date.now();
    log({ type: "driver", event: "prompt", step: prompts[i].step, text: prompts[i].text });
    console.log(`\n[${prompts[i].step}] ${prompts[i].text}`);
    yield { type: "user", message: { role: "user", content: prompts[i].text }, parent_tool_use_id: null, session_id: "" };
  }
  await new Promise((r) => (wake = r)); // keep the input open until the last result
}

const choose = (q) => {
  const labels = (q.options ?? []).map((o) => o.label);
  return labels.find((l) => /^approve\b/i.test(l) && !/note|condition/i.test(l)) && /gate|approv/i.test(`${q.header ?? ""} ${q.question}`)
    ? labels.find((l) => /^approve\b/i.test(l))
    : labels[0] ?? "";
};

const { query } = await import(pathToFileURL(join(repo, "evals", "node_modules", "@anthropic-ai", "claude-agent-sdk", "sdk.mjs")).href);
const q = query({
  prompt: input(),
  options: {
    cwd: toy,
    env: sessionEnv,
    abortController,
    pathToClaudeCodeExecutable: claude,
    settingSources: ["user", "project"],
    systemPrompt: { type: "preset", preset: "claude_code" },
    agent: "architect:sdd-conductor",
    maxTurns: 200,
    canUseTool: async (toolName, inp) => {
      if (toolName === "AskUserQuestion") {
        if (prompts[current]?.step === "7b ideate") {
          firstIdeateQuestion = { ms: Date.now() - stepStart, totalMs: Date.now() - t0, questions: inp.questions };
          log({ type: "driver", event: "first-ideate-question", questions: inp.questions });
          stop("first ideate question reached");
          return { behavior: "deny", message: "the scripted run stops here" };
        }
        const given = {};
        for (const qq of inp.questions ?? []) given[qq.question] = choose(qq);
        answers.push({ step: prompts[current]?.step, answers: given });
        log({ type: "driver", event: "answer", step: prompts[current]?.step, answers: given });
        return { behavior: "allow", updatedInput: { questions: inp.questions, answers: given } };
      }
      return { behavior: "allow", updatedInput: inp };
    },
  },
});
const wall = setTimeout(() => stop("wall time 40 min"), 40 * 60_000);
try {
  for await (const m of q) {
    log({ type: "sdk", message: m });
    if (m.type === "system" && m.subtype === "init") {
      initInfo = { version: m.claude_code_version, apiKeySource: m.apiKeySource, agents: m.agents?.filter((a) => a.startsWith("architect:")).length, plugins: m.plugins?.map((p) => p.name), model: m.model };
      if (!["oauth", "none"].includes(m.apiKeySource)) stop(`unexpected key source ${m.apiKeySource}`);
    }
    if (m.type === "result") {
      lastCost = m.total_cost_usd ?? lastCost;
      steps.push({ step: prompts[current]?.step, ms: Date.now() - stepStart, result: m.subtype, cost_usd: lastCost });
      console.log(`  -> ${m.subtype}, ${Math.round((Date.now() - stepStart) / 1000)} s, running cost ${lastCost.toFixed(2)} USD notional`);
      if (lastCost >= maxUsd) stop(`cost cap ${maxUsd} USD`);
      else if (current >= prompts.length - 1) stop("ideate ended without a question");
      else wake();
    }
    if (m.type === "assistant" && m.message?.usage) {
      // nothing: the cost is read from results
    }
  }
} catch (e) {
  if (!abortController.signal.aborted) stopReason = stopReason ?? `error: ${e instanceof Error ? e.message : String(e)}`;
} finally {
  clearTimeout(wall);
  wake();
}

const sdd = (a) => spawnSync(process.execPath, [join(repo, "plugins", "architect", "scripts", "sdd.mjs"), ...a], { cwd: toy, encoding: "utf8" });
let status = null;
try {
  status = JSON.parse(sdd(["status", "--json"]).stdout);
} catch {}
const summary = {
  date: new Date().toISOString(),
  repo_commit: commit,
  dirty_plugin: dirtyPlugin,
  claude_version: version.out,
  node: process.version,
  profile: root,
  init: initInfo,
  steps,
  answers,
  first_ideate_question: firstIdeateQuestion && { ms_in_step: firstIdeateQuestion.ms, total_ms: firstIdeateQuestion.totalMs, headers: firstIdeateQuestion.questions?.map((x) => x.header ?? x.question) },
  stop_reason: stopReason,
  cost_usd_notional: lastCost,
  total_ms: Date.now() - t0,
  sdd_status: status && { constitution: status.constitution, changes: status.changes?.map((c) => ({ id: c.id, title: c.title, profile: c.profile, phases: Object.fromEntries(Object.entries(c.phases ?? {}).map(([k, v]) => [k, v.status])) })) },
  pass: Boolean(firstIdeateQuestion),
};
writeFileSync(join(root, "summary.json"), JSON.stringify(summary, null, 2));
console.log(`\n${JSON.stringify(summary, null, 2)}\nE2E: ${summary.pass ? "PASS" : "FAIL"}`);
process.exit(summary.pass ? 0 : 1);
