// Report-only check of the stop conditions of the rule-1 rows (C002-T-072 step 4; C002-RISK-040; plan critics
// CR-75, CR-76; C002-IF-010 §2.2 Early stop when the check is decided). Not a test of `npm test`: the stored
// transcripts under evals/results/transcripts/ are git-ignored. It writes no file.
//
// For each row and each stored Claude Code transcript of it (the result records of evals/results/*.json that
// name the row's ID on the claude-code host and a transcript file that still exists):
//   1. the row's `assert` on the full transcript gives the full verdict (pass, fail, or "Given not met");
//   2. the condition is called after each record, with the transcript so far and the `answers` so far (rebuilt
//      from the `answer` records), as the Claude Code eval runner calls it: only while the session was open
//      (before a `cap` record or the end of the stored stream) and not after a first `true`. A first `true`
//      at a record whose last SDK message is a `result` waits for the next SDK message, as the runner does;
//   3. the transcript is cut at the record where the runner would have stopped, and the synthetic stop tail is
//      appended: one `{ event: "check-decided", usd }` record (usd: the highest cost read by then) and one
//      `result` message with `subtype` `check_decided`, as a stopped session ends (CR-75);
//   4. the row's `assert` on the cut transcript must give the full verdict. The check also cuts at every
//      later record and reports the first cut whose verdict differs ("stable"): a condition is wrong when a
//      later record could still change the outcome.
// A condition that changes a verdict, or that is never `true` on a passing transcript, is reported and makes
// the exit code 1. A row without a condition is listed with its reason.
//
// Usage: node evals/harness/check-stop-conditions.mjs [--row <ID>]... [--no-stable]
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { ROOT } from "./fixtures.mjs";

/** The seven rule-1 rows of C002-T-072 that may carry a condition, with their case files. */
export const ROWS = [
  { id: "TS-215", file: "evals/cap02/TS-215.eval.mjs" },
  { id: "TS-221", file: "evals/cap02/TS-221.eval.mjs" },
  { id: "TS-223", file: "evals/cap02/TS-223.eval.mjs" },
  { id: "TS-224", file: "evals/cap02/TS-224.eval.mjs" },
  { id: "TS-225", file: "evals/cap02/TS-225.eval.mjs" },
  { id: "TS-507", file: "evals/cap05/TS-507.eval.mjs" },
  { id: "TS-802", file: "evals/cap08/TS-802.eval.mjs" },
];

/** Why a row of ROWS carries no condition (the C002-T-072 report). */
export const NO_CONDITION = {
  "TS-224":
    "a pass is never decided before the session ends: any later specialist hand-back may still carry a blocking naming question, and the stored passing sessions dispatch the spec-writer again after their answers",
  "TS-507": "its assert reads the workspace (architecture.md and the lint of change 004), which the condition cannot see (C002-IF-010 §2.2 item 1; CR-121 (a), CR-74)",
};

const RESULTS = join(ROOT, "evals", "results");

/** The stored Claude Code transcripts of a row: `{ path, file, pass }` per transcript, from the result records. */
export function storedTranscripts(id, resultsDir = RESULTS) {
  const out = new Map();
  for (const f of readdirSync(resultsDir).filter((x) => x.endsWith(".json")).sort()) {
    let doc;
    try {
      doc = JSON.parse(readFileSync(join(resultsDir, f), "utf8"));
    } catch {
      continue;
    }
    if (doc?.scenario !== id || (doc.host ?? "claude-code") !== "claude-code" || !Array.isArray(doc.records)) continue;
    for (const r of doc.records) {
      if (typeof r?.transcript !== "string") continue;
      const path = join(ROOT, ...r.transcript.split("/"));
      if (existsSync(path) && !out.has(path)) out.set(path, { path, name: r.transcript.split("/").at(-1), resultFile: f, recordedPass: r.pass ?? null });
    }
  }
  return [...out.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/** The `answers` of the session result, rebuilt from the `answer` records (C002-IF-010 §3). */
const answersOf = (transcript) => transcript.filter((r) => r?.type === "harness" && r.event === "answer").map((r) => ({ toolUseId: null, questions: r.questions ?? [], answers: r.answers ?? {} }));

/** The highest cost read up to and including record `i`: `usage` records and `result` messages. */
function costRead(transcript, i) {
  let R = null;
  for (const r of transcript.slice(0, i + 1)) {
    const usd = r?.type === "harness" && r.event === "usage" ? r.usd : r?.type === "sdk" && r.message?.type === "result" ? r.message.total_cost_usd : null;
    if (typeof usd === "number" && Number.isFinite(usd)) R = R === null ? usd : Math.max(R, usd);
  }
  return R;
}

/** The transcript cut after record `i`, with the synthetic stop tail of a session stopped when its check was decided. */
export function cutWithTail(transcript, i) {
  const usd = costRead(transcript, i);
  const t = transcript[i]?.t ?? 0;
  return [
    ...transcript.slice(0, i + 1),
    { t, type: "harness", event: "check-decided", usd },
    { t, type: "sdk", message: { type: "result", subtype: "check_decided", is_error: false, total_cost_usd: usd, num_turns: null, modelUsage: {} } },
  ];
}

/** The row's verdict on a transcript: "pass", "fail" or "given not met" (valid_run false), or "threw: …". */
export async function verdict(scenario, transcript) {
  try {
    const failures = await scenario.assert({ transcript, answers: answersOf(transcript), result: null, root: null, log: () => {} });
    const list = Array.isArray(failures) ? failures : [];
    if (failures?.valid_run === false) return "given not met";
    return list.length === 0 ? "pass" : "fail";
  } catch (e) {
    return `threw: ${e instanceof Error ? e.message : String(e)}`;
  }
}

/**
 * Where the runner would have stopped the stored session: `{ first, stopAt, reason }`. `first` is the record
 * of the condition's first `true` (null when never true while the session was open); `stopAt` the last record
 * kept (the record of the first `true`, or the next SDK message after a `result`); null when the session ended
 * by itself after that result.
 */
export function stopPoint(stopWhen, transcript) {
  let lastSdkIsResult = false;
  for (let i = 0; i < transcript.length; i++) {
    const r = transcript[i];
    if (r?.type === "harness" && r.event === "cap") return { first: null, stopAt: null, reason: `not true before the cap record (${i})` };
    if (r?.type === "sdk") lastSdkIsResult = r.message?.type === "result";
    const prefix = transcript.slice(0, i + 1);
    let out;
    try {
      out = stopWhen(prefix, answersOf(prefix));
    } catch (e) {
      return { first: null, stopAt: null, reason: `stop-when-error at record ${i}: ${e instanceof Error ? e.message : String(e)}` };
    }
    if (typeof out !== "boolean") return { first: null, stopAt: null, reason: `stop-when-error at record ${i}: no boolean` };
    if (!out) continue;
    if (!lastSdkIsResult) return { first: i, stopAt: i, reason: null };
    const next = transcript.findIndex((x, j) => j > i && x?.type === "sdk");
    if (next < 0) return { first: i, stopAt: null, reason: "true after the last result: the session ended by itself" };
    return { first: i, stopAt: next, reason: null };
  }
  return { first: null, stopAt: null, reason: "never true" };
}

async function main(argv) {
  const only = argv.flatMap((a, i) => (argv[i - 1] === "--row" ? [a] : []));
  const stable = !argv.includes("--no-stable");
  let problems = 0;
  for (const row of ROWS.filter((r) => only.length === 0 || only.includes(r.id))) {
    const exported = (await import(pathToFileURL(join(ROOT, ...row.file.split("/"))).href)).default;
    const scenario = (Array.isArray(exported) ? exported : [exported]).find((s) => s.id === row.id);
    const stored = storedTranscripts(row.id);
    console.log(`\n${row.id} (${row.file}): ${stored.length} stored Claude Code transcript(s)`);
    if (typeof scenario?.stopWhen !== "function") {
      console.log(`  no stopWhen: ${NO_CONDITION[row.id] ?? "none given"}`);
      if (NO_CONDITION[row.id] === undefined) problems++;
      continue;
    }
    let passing = 0;
    let passingNeverTrue = 0;
    for (const s of stored) {
      const transcript = JSON.parse(readFileSync(s.path, "utf8"));
      const full = await verdict(scenario, transcript);
      if (full === "pass") passing++;
      const p = stopPoint(scenario.stopWhen, transcript);
      if (p.stopAt === null) {
        if (full === "pass" && p.first === null) passingNeverTrue++;
        console.log(`  ${s.name}: full ${full} (${transcript.length} records); no stop: ${p.reason}${full === "pass" && p.first === null ? "  <-- PASSING, CONDITION NEVER TRUE" : ""}`);
        continue;
      }
      const cut = cutWithTail(transcript, p.stopAt);
      const v = await verdict(scenario, cut);
      const same = v === full;
      if (!same) problems++;
      let stableNote = "";
      if (stable && same) {
        let differs = null;
        for (let j = p.stopAt + 1; j < transcript.length && differs === null; j++) if ((await verdict(scenario, cutWithTail(transcript, j))) !== full) differs = j;
        stableNote = differs === null ? "; stable at every later cut" : `; UNSTABLE: the cut at record ${differs} gives another verdict`;
        if (differs !== null) problems++;
      }
      const at = transcript[p.stopAt];
      const lastT = transcript.at(-1)?.t ?? 0;
      const usd = costRead(transcript, p.stopAt);
      const fullUsd = costRead(transcript, transcript.length - 1);
      console.log(
        `  ${s.name}: full ${full}; cut at record ${p.stopAt}${p.first !== p.stopAt ? ` (first true at ${p.first}, after a result)` : ""} of ${transcript.length}, t ${(at.t / 1000).toFixed(1)} s of ${(lastT / 1000).toFixed(1)} s, cost read ${usd === null ? "none" : usd.toFixed(3)} of ${fullUsd === null ? "none" : fullUsd.toFixed(3)} USD; cut ${v}${same ? " (same)" : "  <-- VERDICT CHANGES"}${stableNote}`,
      );
    }
    if (passing === 0) {
      console.log(`  NO PASSING STORED TRANSCRIPT: the row gets no condition (CR-76)`);
      problems++;
    }
    if (passingNeverTrue > 0) problems++;
    console.log(`  summary: ${passing} passing, ${stored.length - passing} not passing; ${passingNeverTrue} passing transcript(s) on which the condition is never true`);
  }
  console.log(problems === 0 ? "\nall verdicts unchanged" : `\n${problems} problem(s)`);
  return problems === 0 ? 0 : 1;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) process.exitCode = await main(process.argv.slice(2));
