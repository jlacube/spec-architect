// C001-TC-226 — verifies C001-TS-226 (C001-AC-222.1, C001-REQ-222; C001-IF-05 `questions.md` §3; D-020): the gate,
// an interview round and a blocking ask as plain text when the question tool is refused. One scenario per
// Examples row, Claude Code only (the Copilot CLI behaviour is evidenced by INJ-19 and INJ-21 at Copilot CLI
// 0.0.3 in C002-T-071). The harness refuses every AskUserQuestion call (`refuseAsk`, session.mjs).
// Terms, read from the session transcript as the scenario's note defines them: a turn ends at a `result`
// message; the reply that ends it is the conductor's last assistant text message before that `result`.
//   - gate: the first turn. The reply carries every line of the output of the session's last
//     `sdd gate show` call (white space collapsed), a sentence beginning "Approving means", the four choices
//     "Approve", "Approve with waivers", "Revise", "Stop", and no "(Recommended)";
//   - interview round: the first turn. The reply carries Q-auth-01 and Q-storage-01 (the "carries" rule of the
//     C001-AC-221.1 note), each with its two option labels, the first labelled "(Recommended)", the second not;
//   - blocking ask: the first turn that ends after the arrival of the cartographer's hand-back with a
//     "blocking": true question (hand-back and arrival per the C001-AC-221.1 note, arrival.mjs), with no Agent
//     call between the arrival and the reply; the reply carries the blocking question and its option labels,
//     the recommended one labelled "(Recommended)". "Given not met" (valid_run false) when the cartographer
//     is not dispatched or its hand-back holds no blocking question.
// Every row: the transcript has no `sdd gate approve` call. The same session is graded by C001-TC-227
// (TS-227.eval.mjs, no detour up to the end of the checked turn); its failures are prefixed "C001-TC-227:".
// The answer rules of C001-IF-05 §3 item 2 (second message) are verified by review, not here.
import { approvals, readyForG2 } from "../cap08/gate.mjs";
import { architectReal, architectWithStubs } from "../harness/overlay.mjs";
import { refuseAsk } from "../harness/session.mjs";
import { edit, git, sdd, write } from "../harness/workspaces.mjs";
import { blockingQuestions, carries, timeline } from "./arrival.mjs";
import { constitution } from "./drafting.mjs";
import { q } from "./interview.mjs";
import { twoCheckoutSpecStart } from "./TS-223.eval.mjs";
import { assertNoDetour, conductorTexts } from "./TS-227.eval.mjs";

const textOf = (content) => (typeof content === "string" ? content : (content ?? []).filter((b) => b?.type === "text").map((b) => b.text).join(""));
/** Text without Markdown emphasis and code marks, white space collapsed, lowercased. */
const flat = (s) => String(s ?? "").replace(/[*_`]/g, "").replace(/\s+/g, " ").trim().toLowerCase();
const bare = (label) => String(label ?? "").replace(/\s*\(Recommended\)\s*$/i, "").trim();
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** Whether `label` is followed by "(Recommended)" in the flattened reply. */
const recommendedIn = (reply, label) => new RegExp(`${escape(flat(bare(label)))}\\s*[-:—]?\\s*\\(recommended\\)`).test(reply);

/** The reply that ends the turn ending at record `end`, after record `after`: `{ i, text }` or null. */
export function replyBefore(transcript, end, after = -1) {
  return conductorTexts(transcript, end).filter((m) => m.i > after).at(-1) ?? null;
}
/** Record index of the first `result` message after record `after` (the transcript length when none). */
const resultAfter = (transcript, after = -1) => timeline(transcript).results.find((i) => i > after) ?? transcript.length;

/** The output of the last `sdd gate show` Bash call before record `end` (any thread), or null. */
export function gateShowOutput(transcript, end = transcript.length) {
  const ids = new Set();
  let out = null;
  transcript.slice(0, end).forEach((r) => {
    const m = r?.type === "sdk" ? r.message : null;
    for (const b of Array.isArray(m?.message?.content) ? m.message.content : []) {
      if (m.type === "assistant" && b?.type === "tool_use" && b.name === "Bash" && /\bgate\s+show\b/.test(String(b.input?.command ?? ""))) ids.add(b.id);
      if (m.type === "user" && b?.type === "tool_result" && ids.has(b.tool_use_id)) out = textOf(b.content);
    }
  });
  return out;
}

const noApprove = (transcript) => approvals(transcript).map((c) => `sdd gate approve was run: ${c}`);
const tagged = (failures) => failures.map((f) => `C001-TC-227: ${f}`);

/** C001-TS-226 gate row on a transcript: `{ failures, end }` (the end of the checked turn). */
export function gateRow(transcript) {
  const failures = [];
  const end = resultAfter(transcript);
  const reply = replyBefore(transcript, end);
  if (!reply) return { failures: ["no conductor reply before the end of the first turn"], end };
  const r = flat(reply.text);
  const show = gateShowOutput(transcript, end);
  if (show === null) failures.push("no `sdd gate show` output in the first turn, so the reply carries no gate summary");
  else for (const line of show.split(/\r?\n/).map(flat).filter(Boolean)) if (!r.includes(line)) failures.push(`the reply lacks the gate summary line ${JSON.stringify(line)}`);
  if (!/(^|[.!?:]\s|\n)\s*[*_>-]*\s*Approving means/.test(reply.text)) failures.push('the reply has no sentence beginning "Approving means"');
  for (const c of ["approve", "approve with waivers", "revise", "stop"]) if (!new RegExp(`\\b${c}\\b`).test(r)) failures.push(`the reply lacks the choice "${c}"`);
  if (/\(recommended\)/.test(r)) failures.push('a gate choice is labelled "(Recommended)"');
  return { failures, end };
}

export const AUTH = q("Q-auth-01", "auth", "How do patients sign in to book an appointment?", {
  options: [
    { label: "Email and password", rationale: "Email and password needs no identity provider for v1.", recommended: true },
    { label: "Clinic single sign-on", rationale: "Single sign-on reuses the clinic accounts but needs its identity provider." },
  ],
});
export const STORAGE = q("Q-storage-01", "storage", "Where are the bookings stored?", {
  options: [
    { label: "PostgreSQL database", rationale: "PostgreSQL is the clinic's supported database.", recommended: true },
    { label: "SQLite file", rationale: "A SQLite file is simpler but has one writer." },
  ],
});

/** Whether the flattened reply carries question `qq` with its options, the recommended one labelled. */
function carriesQuestion(r, qq, what) {
  const failures = [];
  if (!carries(r, qq.question)) failures.push(`the reply does not carry ${what} ${qq.id ?? ""}: ${JSON.stringify(qq.question)}`);
  const options = qq.options ?? [];
  const rec = options.find((o) => o.recommended) ?? options[0];
  for (const o of options) if (!r.includes(flat(bare(o.label)))) failures.push(`the reply lacks the option "${bare(o.label)}" of ${qq.id ?? what}`);
  if (rec && !recommendedIn(r, rec.label)) failures.push(`the option "${bare(rec.label)}" of ${qq.id ?? what} is not labelled "(Recommended)"`);
  for (const o of options) if (o !== rec && recommendedIn(r, o.label)) failures.push(`the option "${bare(o.label)}" of ${qq.id ?? what} is labelled "(Recommended)"`);
  return failures;
}

/** C001-TS-226 interview-round row on a transcript: `{ failures, end }`. */
export function roundRow(transcript) {
  const end = resultAfter(transcript);
  const reply = replyBefore(transcript, end);
  if (!reply) return { failures: ["no conductor reply before the end of the first turn"], end };
  const r = flat(reply.text);
  return { failures: [AUTH, STORAGE].flatMap((qq) => carriesQuestion(r, qq, "the question")), end };
}

/** C001-TS-226 blocking-ask row on a transcript: `{ failures, end, validRun }`. */
export function blockingRow(transcript) {
  const { agents } = timeline(transcript);
  const notMet = (why) => ({ failures: [`Given not met: ${why}`], end: transcript.length, validRun: false });
  const cartos = agents.filter((a) => a.type.endsWith("sdd-cartographer"));
  if (cartos.length === 0) return notMet(`the cartographer was not dispatched (dispatched: ${agents.map((a) => a.type).join(", ") || "none"})`);
  const carto = cartos.find((a) => a.arrival !== null && blockingQuestions(a.handback).length > 0);
  if (!carto) return notMet("no cartographer hand-back holds a blocking question");
  const at = carto.arrival;
  const end = resultAfter(transcript, at);
  const reply = replyBefore(transcript, end, at);
  const failures = [];
  for (const a of agents.filter((x) => x.i > at && x.i < (reply ? reply.i : end))) failures.push(`${a.type} dispatched between the arrival of the blocking question and the reply that ends the turn`);
  if (!reply) return { failures: [...failures, "no conductor reply between the arrival of the blocking question and the end of the turn"], end, validRun: true };
  const r = flat(reply.text);
  const blocking = blockingQuestions(carto.handback);
  const asked = blocking.map((qq) => carriesQuestion(r, qq, "the blocking question"));
  if (!asked.some((f) => f.length === 0)) failures.push(...asked.flat());
  return { failures, end, validRun: true };
}

/** The assert of a row: the C001-TC-226 failures, then the C001-TC-227 failures (prefixed), with `valid_run`. */
function graded(row, id) {
  return ({ transcript, log = console.log }) => {
    const { failures, end, validRun = true } = row(transcript);
    const detour = tagged(assertNoDetour(transcript, end));
    const all = [...failures, ...noApprove(transcript), ...detour];
    log(`  ${id}: C001-TC-226 ${!validRun ? "Given not met" : failures.length === 0 && noApprove(transcript).length === 0 ? "pass" : "fail"} · C001-TC-227 ${detour.length === 0 ? "pass" : "fail"} (turn end at record ${end})`);
    if (!validRun) all.valid_run = false;
    return all;
  };
}

/** Change 005 "Booking service" in 00-ideation whose specialists returned Q-auth-01 and Q-storage-01. */
export function bookingIdeation(root) {
  git(root, "init", "-q");
  sdd(root, "init");
  constitution(root, "approved");
  for (let i = 1; i < 5; i++) sdd(root, "change", "new", `Earlier change ${i}`, "--profile", "lite");
  sdd(root, "change", "new", "Booking service");
  const dir = ".sdd/005-booking-service";
  edit(root, `${dir}/change.md`, (t) => t.replace(/^( {2}00-ideation: \{ status: )not-started/m, "$1draft"));
  write(root, `${dir}/00-ideation/ideation.md`, "# Booking service — ideation\n\nA service that lets clinic patients book, move and cancel appointments online.\n\nStep 2 (research and discovery) has finished; the specialists' hand-backs are in `handbacks.md`.\n");
  const block = (agent, questions) => `## ${agent}\n\nDigest: step finished. Written: none.\n\n\`\`\`json questions\n${JSON.stringify({ questions }, null, 2)}\n\`\`\`\n`;
  write(root, `${dir}/00-ideation/handbacks.md`, `# Hand-backs of ideation step 2 (research and discovery)\n\n${block("sdd-researcher", [AUTH])}\n${block("sdd-cartographer", [STORAGE])}`);
  sdd(root, "status", "--write");
  git(root, "add", "-A");
  git(root, "commit", "-q", "-m", "fixture");
}

/** Change 004 in 10-spec with status in-review, lint clean (the C001-TS-802 … 804 Given, phase set in review). */
export function g2InReview(root) {
  readyForG2(root);
  edit(root, ".sdd/004-coupon-codes/change.md", (t) => t.replace(/^( {2}10-spec: \{ status: )draft/m, "$1in-review"));
  sdd(root, "status", "--write");
  git(root, "add", "-A");
  git(root, "commit", "-q", "-m", "in review");
}

const common = { agent: "architect:sdd-conductor", host: "claude-code", answer: refuseAsk };

export default [
  {
    ...common,
    id: "TS-226-gate",
    title: "Gate G2 as plain text, question tool refused",
    plugins: [architectWithStubs],
    fixture: g2InReview,
    allowTools: ["Agent", "Write", "Edit", "Bash"],
    maxTurns: 24,
    prompt: "Present the G2 gate of CHG-004.",
    assert: graded(gateRow, "TS-226-gate"),
  },
  {
    ...common,
    id: "TS-226-round",
    title: "Interview round as plain text, question tool refused",
    fixture: bookingIdeation,
    allowTools: ["Write", "Edit", "Bash"],
    maxTurns: 16,
    prompt: "Run the next interview round for CHG-005.",
    assert: graded(roundRow, "TS-226-round"),
  },
  {
    ...common,
    id: "TS-226-blocking",
    title: "Blocking ask as plain text on arrival, question tool refused",
    plugins: [architectReal],
    fixture: twoCheckoutSpecStart(),
    env: { CLAUDE_CODE_ENABLE_TODO_TOOLS: "1" },
    allowTools: ["Agent", "Write", "Edit", "Bash"],
    maxTurns: 30,
    prompt: "Draft the spec of CHG-001.",
    assert: graded(blockingRow, "TS-226-blocking"),
  },
];
