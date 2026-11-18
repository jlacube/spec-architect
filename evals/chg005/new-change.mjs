// Create-change cases of flow F5 (C005-TS-101 … 107, 158 … 163, 173, 174; C005-T-010, C005-T-011): the
// conductor as main agent on a case workspace with an initialised `.sdd/`, an approved constitution, one
// archived change 001 and no active change, and a small order module in `src/`. `newChangeCase` builds a
// scenario whose answerer records, at each question call, the change folders that exist then.
import { existsSync, readdirSync, readFileSync, renameSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { constitution } from "../cap02/drafting.mjs";
import { askUserQuestions, checker, toolCalls } from "../harness/assert.mjs";
import { edit, git, sdd, write } from "../harness/workspaces.mjs";

export const KINDS = ["greenfield", "brownfield", "mixed"];

/** The case workspace of C005-TS-101; `code: false` gives the repository without code of C005-TS-160 (no change at all). */
export function caseWorkspace({ code = true, archived = true } = {}) {
  return (root) => {
    git(root, "init", "-q");
    sdd(root, "init");
    constitution(root, "approved");
    if (code) {
      write(root, "src/orders.ts", "export interface Order { id: string; total: number; createdAt: string }\n\nexport function listOrders(): Order[] {\n  return [];\n}\n");
      write(root, "package.json", '{ "name": "shop", "version": "1.0.0", "type": "module" }\n');
    }
    if (archived) {
      sdd(root, "change", "new", "Coupon codes", "--profile", "lite", "--kind", "brownfield");
      const from = join(root, ".sdd", "001-coupon-codes");
      edit(root, ".sdd/001-coupon-codes/change.md", (t) => t.replace(/^status: active$/m, "status: archived"));
      mkdirSync(join(root, ".sdd", "_archive"), { recursive: true });
      renameSync(from, join(root, ".sdd", "_archive", "001-coupon-codes"));
    }
    sdd(root, "status", "--write");
    git(root, "add", "-A");
    git(root, "commit", "-q", "-m", "fixture");
  };
}

const text = (q) => `${q.header ?? ""} ${q.question ?? ""} ${(q.options ?? []).map((o) => `${o.label} ${o.description ?? ""}`).join(" ")}`;
export const isProfileQuestion = (q) => (q.options ?? []).some((o) => /\blite\b/i.test(o.label)) && (q.options ?? []).some((o) => /\bfull\b/i.test(o.label));
export const isKindQuestion = (q) => KINDS.every((k) => (q.options ?? []).some((o) => new RegExp(`\\b${k}\\b`, "i").test(o.label)));
export const hasEstimate = (q) => /stor/i.test(text(q)) && /requirement/i.test(text(q)) && /module/i.test(text(q)) && /\d/.test(text(q));

/** `sdd change new` calls (Bash), in order. */
export const changeNewCalls = (transcript) => {
  // A call that a PreToolUse hook refused (for example GUARD-BASH-002 on a chained command) never ran; it is
  // not counted. Its tool result starts with the hook error.
  const refused = new Set();
  for (const r of transcript) {
    if (r.type !== "sdk" || r.message.type !== "user" || !Array.isArray(r.message.message?.content)) continue;
    for (const b of r.message.message.content) {
      if (b.type !== "tool_result") continue;
      const text = Array.isArray(b.content) ? b.content.map((c) => c.text ?? "").join("") : String(b.content ?? "");
      if (/PreToolUse:Bash hook error|GUARD-BASH-\d+/.test(text)) refused.add(b.tool_use_id);
    }
  }
  return toolCalls(transcript, "Bash").filter((c) => /\bchange\s+new\b/.test(String(c.input?.command ?? "")) && !refused.has(c.id));
};

/** Index in the transcript of a record, to order question calls and Bash calls. */
const position = (transcript, pred) => transcript.findIndex(pred);
export const firstChangeNewAt = (transcript) =>
  position(transcript, (r) => r.type === "sdk" && r.message.type === "assistant" && (r.message.message?.content ?? []).some((b) => b.type === "tool_use" && b.name === "Bash" && /\bchange\s+new\b/.test(String(b.input?.command ?? ""))));
/** Transcript positions of the harness answer records (one per question call). */
export const answerPositions = (transcript) => transcript.map((r, i) => (r.type === "harness" && r.event === "answer" ? i : -1)).filter((i) => i >= 0);

export function changeMd(root, nnn) {
  const dir = existsSync(join(root, ".sdd")) ? readdirSync(join(root, ".sdd")).find((d) => d.startsWith(`${nnn}-`)) : undefined;
  return dir ? readFileSync(join(root, ".sdd", dir, "change.md"), "utf8") : "";
}

/**
 * A create-change scenario. `reply(question, call, n)` answers each question (n: the question call, from 0);
 * the default answers every question with its first option. `check(ctx)` adds the case's checks; ctx holds
 * `transcript`, `root`, `calls` (per question call: its questions and the change folders before the answer),
 * `check` and the helpers above.
 */
export function newChangeCase({ id, title, prompt, fixture = caseWorkspace(), reply, check: caseCheck, maxTurns = 20 }) {
  let root = null;
  let calls = [];
  let current = null;
  const folders = () => (existsSync(join(root, ".sdd")) ? readdirSync(join(root, ".sdd")).filter((d) => /^\d{3}-/.test(d)) : []);
  return {
    id,
    title,
    agent: "architect:sdd-conductor",
    fixture: (r) => {
      root = r;
      calls = [];
      current = null;
      reply?.reset?.();
      fixture(r);
    },
    allowTools: ["Write", "Edit", "Bash", "Read", "Glob", "Grep"],
    maxTurns,
    prompt,
    answer: (question, call) => {
      if (current !== call) {
        current = call;
        calls.push({ questions: call.questions ?? [], folders: folders() });
      }
      return reply ? reply(question, call, calls.length - 1) : question.options[0].label;
    },
    assert({ transcript, root: r }) {
      const { failures, check } = checker();
      caseCheck({ transcript, root: r, calls, check, asked: askUserQuestions(transcript) });
      return failures;
    },
  };
}

/** Option label of a question that matches `re`, else the free text `re` stands for. */
export const pick = (question, re) => (question.options ?? []).find((o) => re.test(o.label))?.label ?? String(re.source);

/** Checks shared by the cases that expect the new-change round before any `sdd change new` call. */
export function roundBeforeCreate({ transcript, calls, check }, nnn = "002") {
  const first = calls.findIndex((c) => c.questions.some(isProfileQuestion));
  check(first >= 0, "no question call proposes lite or full");
  if (first < 0) return null;
  const call = calls[first];
  const profile = call.questions.find(isProfileQuestion);
  check(hasEstimate(profile), `the profile question gives no estimate of stories, requirements and modules: ${text(profile).slice(0, 200)}`);
  const at = answerPositions(transcript)[first] ?? -1;
  const create = firstChangeNewAt(transcript);
  check(create < 0 || at < create, "an sdd change new call comes before the profile question");
  check(!call.folders.some((d) => d.startsWith(`${nnn}-`)), `a folder .sdd/${nnn}-* existed before the answer: ${call.folders.join(", ")}`);
  return { first, call, profile };
}
