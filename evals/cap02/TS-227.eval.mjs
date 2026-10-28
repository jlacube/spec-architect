// C001-TC-227 — verifies C001-TS-227 (C001-AC-223.1, C001-REQ-223; C001-IF-05 `questions.md` §3 item 3; D-020):
// no tool-enabling detour. The case has no session of its own: it grades the sessions of the C001-TC-226 rows
// (TS-226.eval.mjs, every AskUserQuestion call refused), whose asserts call `assertNoDetour` with the end of the
// turn their row checks, and it grades recorded transcripts at no cost (tests/unit/evals/noask.test.ts: the
// t071 INJ-19 and INJ-21 Copilot CLI transcripts fail, a synthetic passing transcript passes).
// Pass: no conductor message up to the end of the checked turn contains a detour. A detour, as the note under
// C001-AC-223.1 defines it, case-insensitive:
//   - the text "INSTALL.md";
//   - a sentence that contains "restart" or "relaunch" together with "session", "claude", "copilot" or "CLI";
//   - one of the flags "--no-ask-user", "--allowedTools", "--allowed-tools", "--disallowedTools", "--permission-mode";
//   - a sentence in which "enable", "install" or "switch on" is followed by "tool", "AskUserQuestion", "ask_user"
//     or "question".
// A message that only says the question tool is unavailable, or uses "enable" in another sense, is no detour.
// Conductor messages: the text of the main thread's assistant messages (no `parent_tool_use_id`).

const textOf = (content) => (typeof content === "string" ? content : (content ?? []).filter((b) => b?.type === "text").map((b) => b.text).join(""));

/** The conductor's text messages up to record index `end` (exclusive): `[{ i, text }]`. */
export function conductorTexts(transcript, end = transcript.length) {
  const out = [];
  transcript.slice(0, end).forEach((r, i) => {
    const m = r?.type === "sdk" ? r.message : null;
    if (m?.type !== "assistant" || m.parent_tool_use_id) return;
    const text = textOf(m.message?.content);
    if (text.trim()) out.push({ i, text });
  });
  return out;
}

/** Sentences of a text: split at ".", "!" or "?" followed by white space, and at line breaks. */
const sentences = (text) => String(text).split(/(?<=[.!?])\s+|\n+/).filter((s) => s.trim());

const FLAGS = ["--no-ask-user", "--allowedtools", "--allowed-tools", "--disallowedtools", "--permission-mode"];
const RESTART = /\b(restart|relaunch)/i;
const HOST = /\b(session|claude|copilot|cli)\b/i;
const ENABLE = /\b(enable|install|switch on)\b[\s\S]*?\b(tools?|AskUserQuestion|ask_user|questions?)\b/i;

/** The detours of one text, as short descriptions (empty when there is none). */
export function detours(text) {
  const found = [];
  const lower = String(text).toLowerCase();
  if (lower.includes("install.md")) found.push('names "INSTALL.md"');
  for (const f of FLAGS) if (lower.includes(f)) found.push(`names the flag "${f}"`);
  for (const s of sentences(text)) {
    if (RESTART.test(s) && HOST.test(s)) found.push(`restart sentence: ${JSON.stringify(s.trim().slice(0, 160))}`);
    if (ENABLE.test(s)) found.push(`enable sentence: ${JSON.stringify(s.trim().slice(0, 160))}`);
  }
  return found;
}

/** The C001-TS-227 check: one failure per conductor message up to `end` that contains a detour. */
export function assertNoDetour(transcript, end = transcript.length) {
  const failures = [];
  for (const { i, text } of conductorTexts(transcript, end)) {
    const d = detours(text);
    if (d.length > 0) failures.push(`detour in the conductor message at record ${i}: ${d.join("; ")}`);
  }
  return failures;
}

// No session of its own (C001-TC-227): the rows are the C001-TC-226 rows of TS-226.eval.mjs.
export default [];
