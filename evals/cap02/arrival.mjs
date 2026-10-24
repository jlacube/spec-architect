// The arrival-to-ask check of C001-AC-221.1 (C001-REQ-221; C001-IF-05 `questions.md` §2; D-019 item 1), shared
// by C001-TC-225 (TS-225.eval.mjs, attended drafting) and C001-TC-215 (TS-215.eval.mjs, unattended drafting).
// Every term is read from the session transcript as the note under C001-AC-221.1 defines it:
//   - hand-back: per Agent call from the conductor, the text of the last assistant message with non-empty text
//     whose `parent_tool_use_id` is that call; when there is none, the call's tool result unless it is a
//     launch notice (C001-TS-224 note). The blocking question is a question with "blocking": true in a
//     questions block of the cartographer's hand-back;
//   - arrives: for an asynchronous Agent call (its tool result is a launch notice) the `task_notification`
//     system message whose `tool_use_id` is that call; for a synchronous call its tool result;
//   - still running: at least one Agent call to the spec-writer before the arrival, and none of those calls
//     arrived before it;
//   - carries: the question text of one AskUserQuestion question contains at least half of the distinct
//     words of five or more letters of the blocking question's text (case-insensitive);
//   - the conductor's turn ends: the first `result` message after the arrival.
// Pass: an AskUserQuestion call that carries the blocking question after the arrival and before the turn
// ends, with no Agent call between the arrival and it. When the Given does not hold (the cartographer is not
// dispatched, its hand-back holds no blocking question, or the spec-writer is not still running at the
// arrival), the run is "Given not met" with `valid_run` false, distinct from a conductor failure; the runner
// that owns the release runs replaces it once (C001-AC-221.1 note).
// Order is the order of the transcript's records (several calls of one assistant message share one `t`).
import { questionsBlocks } from "../harness/questions.mjs";

/** A tool result that only says the agent was started in the background (C001-TS-224 note). */
export const isLaunchNotice = (text) => /Async agent launched|working in the background/i.test(String(text));

const textOf = (content) => (typeof content === "string" ? content : (content ?? []).filter((b) => b?.type === "text").map((b) => b.text).join(""));
const is = (type, agent) => type === agent || type.endsWith(`:${agent}`);

/** Distinct words of five or more letters of a text, lowercased. */
export const longWords = (s) => [...new Set(String(s ?? "").toLowerCase().match(/[a-z]{5,}/g) ?? [])];
/** Whether the asked text carries the blocking question (C001-AC-221.1 note, "carries"). */
export function carries(asked, blockingText) {
  const w = longWords(blockingText);
  const a = String(asked ?? "").toLowerCase();
  return w.length > 0 && w.filter((x) => a.includes(x)).length * 2 >= w.length;
}

/**
 * The conductor's Agent calls, AskUserQuestion calls and result messages of a transcript, with their record
 * index: `{ agents: [{ id, type, i, arrival, handback }], asks: [{ i, questions }], results: [i] }`.
 * `arrival` is the record index of the call's arrival (null while it has not arrived); `handback` its text or null.
 */
export function timeline(transcript) {
  const agents = [];
  const asks = [];
  const results = [];
  const toolResults = new Map();
  const notifications = new Map();
  const lastText = new Map();
  transcript.forEach((r, i) => {
    const m = r?.type === "sdk" ? r.message : null;
    if (!m) return;
    if (m.type === "result") results.push(i);
    if (m.type === "system" && m.subtype === "task_notification" && m.tool_use_id && !notifications.has(m.tool_use_id)) notifications.set(m.tool_use_id, i);
    if (m.type === "assistant") {
      if (m.parent_tool_use_id) {
        const t = textOf(m.message?.content);
        if (t.trim()) lastText.set(m.parent_tool_use_id, t);
        return;
      }
      for (const b of m.message?.content ?? []) {
        if (b?.type !== "tool_use") continue;
        if (b.name === "Agent" || b.name === "Task") agents.push({ id: b.id, type: String(b.input?.subagent_type ?? ""), i });
        if (b.name === "AskUserQuestion") asks.push({ i, questions: Array.isArray(b.input?.questions) ? b.input.questions : [] });
      }
    }
    if (m.type === "user" && !m.parent_tool_use_id)
      for (const b of m.message?.content ?? []) if (b?.type === "tool_result" && !toolResults.has(b.tool_use_id)) toolResults.set(b.tool_use_id, { i, text: textOf(b.content) });
  });
  for (const a of agents) {
    const res = toolResults.get(a.id);
    const async = res !== undefined && isLaunchNotice(res.text);
    a.arrival = async ? (notifications.get(a.id) ?? null) : (res?.i ?? null);
    a.handback = lastText.get(a.id) ?? (res && res.text.trim() && !async ? res.text : null);
  }
  return { agents, asks, results };
}

/** Questions with "blocking": true in the questions blocks of a hand-back. */
export const blockingQuestions = (text) =>
  questionsBlocks(text ?? "")
    .flatMap((b) => (Array.isArray(b.questions) ? b.questions : []))
    .filter((q) => q && q.blocking === true);

/**
 * The C001-AC-221.1 check on one transcript: `{ failures, validRun, report }`. `failures` is empty on a pass;
 * a "Given not met" run has one failure starting with "Given not met:" and `validRun` false.
 */
export function askOnArrival(transcript) {
  const failures = [];
  const { agents, asks, results } = timeline(transcript);
  const types = agents.map((a) => a.type).join(", ") || "none";
  const notMet = (why) => ({ failures: [`Given not met: ${why}`], validRun: false, report: `Given not met (${why})` });

  const cartos = agents.filter((a) => is(a.type, "sdd-cartographer"));
  if (cartos.length === 0) return notMet(`the cartographer was not dispatched (dispatched: ${types})`);
  const carto = cartos.find((a) => a.arrival !== null && blockingQuestions(a.handback).length > 0);
  if (!carto) {
    const last = cartos.at(-1);
    return notMet(`no cartographer hand-back holds a blocking question (hand-back: ${last.handback ? JSON.stringify(last.handback.slice(-300)) : last.arrival === null ? "not arrived" : "none"})`);
  }
  const at = carto.arrival;
  const writers = agents.filter((a) => is(a.type, "sdd-spec-writer") && a.i < at);
  if (writers.length === 0) return notMet("the spec-writer was not dispatched before the cartographer's hand-back arrived");
  if (writers.some((w) => w.arrival !== null && w.arrival < at)) return notMet("the spec-writer had handed back before the cartographer's hand-back arrived");

  const blocking = blockingQuestions(carto.handback);
  const end = results.find((i) => i > at) ?? transcript.length;
  const ask = asks.find((a) => a.i > at && a.i < end && a.questions.some((q) => blocking.some((b) => carries(q?.question, b.question))));
  const ids = blocking.map((q) => q.id ?? q.question).join(", ");
  const asked = asks.filter((a) => a.i > at).flatMap((a) => a.questions.map((q) => q?.question)).join(" | ") || "none";
  if (!ask) failures.push(`the blocking question ${ids} was not asked between its arrival and the end of the conductor's turn (${end < transcript.length ? "a result message" : "the transcript end"}; asked after the arrival: ${asked})`);
  const between = agents.filter((a) => a.i > at && a.i < (ask ? ask.i : end));
  for (const a of between) failures.push(`${a.type} dispatched between the arrival of the blocking question ${ids} and ${ask ? "the AskUserQuestion call that carries it" : "the end of the turn"}`);
  const report = `cartographer hand-back with ${ids} arrived at record ${at}; spec-writer still running; turn ended at record ${end}; ${ask ? `asked at record ${ask.i}` : "not asked"}`;
  return { failures, validRun: true, report };
}

/** The `assert` of TS-215 and TS-225: the failures, marked `valid_run: false` for a "Given not met" run. */
export function assertAskOnArrival(id, { transcript, log = console.log }) {
  const { failures, validRun, report } = askOnArrival(transcript);
  log(`  ${id}: ${report}`);
  if (!validRun) failures.valid_run = false;
  return failures;
}
