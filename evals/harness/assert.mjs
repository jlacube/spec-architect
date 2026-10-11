// Transcript assertions for agent-behaviour evals (C001-T-029). Evals assert tool calls, files and
// lint results, never free text alone (test plan §4). A transcript is the array recorded by
// runSession: `{ t, type: "sdk", message }` and `{ t, type: "harness", event, … }` records.
import { isAbsolute, relative, resolve } from "node:path";

const sdkMessages = (transcript) => transcript.filter((r) => r.type === "sdk").map((r) => r.message);

/**
 * Every tool call, in order: `{ id, name, input, agent, t, message }`; `agent` is null on the main
 * thread; `message` is the assistant message ID (calls of one turn share it).
 */
export function toolCalls(transcript, name) {
  const out = [];
  for (const r of transcript) {
    if (r.type !== "sdk" || r.message.type !== "assistant") continue;
    for (const block of r.message.message?.content ?? [])
      if (block.type === "tool_use" && (name === undefined || block.name === name))
        out.push({ id: block.id, name: block.name, input: block.input, agent: r.message.parent_tool_use_id ?? null, t: r.t, message: r.message.message?.id ?? null });
  }
  return out;
}

/** AskUserQuestion calls answered by the harness: `{ questions, answers }` per call. */
export function askUserQuestions(transcript) {
  return transcript.filter((r) => r.type === "harness" && r.event === "answer").map((r) => ({ questions: r.questions, answers: r.answers }));
}

const WRITE_TOOLS = new Set(["Write", "Edit", "MultiEdit", "NotebookEdit"]);

/** Paths written by Write/Edit-like tools that resolve outside `root` (or outside `allowed` under it). */
export function writesOutside(transcript, root, allowed = ".") {
  const base = resolve(root, allowed);
  return toolCalls(transcript)
    .filter((c) => WRITE_TOOLS.has(c.name))
    .map((c) => String(c.input?.file_path ?? c.input?.notebook_path ?? ""))
    .filter((p) => {
      const rel = relative(base, resolve(root, p));
      return rel.startsWith("..") || isAbsolute(rel);
    });
}

function texts(transcript) {
  return sdkMessages(transcript)
    .filter((m) => m.type === "assistant" && !m.parent_tool_use_id)
    .map((m) => (m.message?.content ?? []).filter((b) => b.type === "text").map((b) => b.text).join(""))
    .filter((s) => s.trim() !== "");
}

/** The main thread's first text reply. */
export function firstReply(transcript) {
  return texts(transcript)[0] ?? "";
}

/**
 * The final result text of the session. Background subagents can make the session produce more
 * than one result message (one per turn); the last one is the session's answer.
 */
export function finalReply(transcript) {
  return sdkMessages(transcript).filter((m) => m.type === "result").at(-1)?.result ?? "";
}

/**
 * Option format of C001-REQ-206 / C001-TS-207 for one AskUserQuestion question: two or three
 * options, a non-empty description on each, and exactly the first labelled "(Recommended)".
 * Returns the list of problems (empty when well formed).
 */
export function optionProblems(question) {
  const options = question.options ?? [];
  const problems = [];
  if (options.length < 2 || options.length > 3) problems.push(`${options.length} options`);
  options.forEach((o, i) => {
    if (!String(o.description ?? "").trim()) problems.push(`option ${i + 1} has no description`);
    const recommended = /\(Recommended\)\s*$/.test(String(o.label ?? ""));
    if (i === 0 && !recommended) problems.push("first option is not labelled (Recommended)");
    if (i > 0 && recommended) problems.push(`option ${i + 1} is also labelled (Recommended)`);
  });
  return problems;
}

/** Collects failed checks; `check(cond, message)` records a failure when `cond` is false. */
export function checker() {
  const failures = [];
  return {
    failures,
    check(cond, message) {
      if (!cond) failures.push(message);
      return Boolean(cond);
    },
  };
}

/** Main-thread Agent (or legacy Task) calls: `{ …call, type, prompt }` with the subagent type and brief. */
export function dispatches(transcript) {
  return toolCalls(transcript)
    .filter((c) => (c.name === "Agent" || c.name === "Task") && c.agent === null)
    .map((c) => ({ ...c, type: String(c.input?.subagent_type ?? ""), prompt: String(c.input?.prompt ?? "") }));
}
