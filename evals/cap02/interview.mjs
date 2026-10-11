// Shared Given for the interview scenarios of C001-T-031 (C001-TS-206…212, 222): a full-profile change
// in ideation whose current step has ended with specialists' hand-backs. The hand-backs are saved
// in the workspace (as the conductor would hold them) so the scenario controls exactly which
// questions blocks (C001-IF-05) the conductor receives; Agent is denied, so no specialist runs.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { askUserQuestions, checker } from "../harness/assert.mjs";
import { edit, git, sdd, write } from "../harness/workspaces.mjs";

export const CHANGE = ".sdd/001-booking-service";
export const LOG = `${CHANGE}/00-ideation/questions-log.md`;
export const HANDBACKS = `${CHANGE}/00-ideation/handbacks.md`;

/** A non-material question of C001-IF-05 with two options (recommended first). */
export function q(id, topic, question, { blocking = false, options } = {}) {
  return {
    id,
    topic,
    question,
    why_it_matters: `The answer about ${topic} shapes the requirements of the booking service.`,
    blocking,
    material: false,
    options: options ?? [
      { label: `Option A for ${topic}`, rationale: `Option A keeps ${topic} simple for v1.`, recommended: true },
      { label: `Option B for ${topic}`, rationale: `Option B covers more ${topic} cases at a higher cost.` },
    ],
  };
}

/** Hand-back text of one specialist: a digest and its questions block. */
function handback(agent, questions) {
  return `## ${agent}\n\nDigest: step finished; see the research and evidence notes of this step. Written: none.\n\n\`\`\`json questions\n${JSON.stringify({ questions }, null, 2)}\n\`\`\`\n`;
}

/**
 * Fixture builder: `handbacks` maps a specialist name to its questions; `rounds` is the number of
 * interview rounds already logged in this phase.
 */
export function interviewFixture(handbacks, { rounds = 0 } = {}) {
  return (root) => {
    git(root, "init", "-q");
    sdd(root, "init");
    sdd(root, "change", "new", "Booking service");
    edit(root, `${CHANGE}/change.md`, (t) => t.replace(/^( {2}00-ideation: \{ status: )not-started/m, "$1draft"));
    sdd(root, "status", "--write");
    write(root, `${CHANGE}/00-ideation/ideation.md`, "# Booking service — ideation\n\nA service that lets clinic patients book, move and cancel appointments online.\n");
    const body = Object.entries(handbacks).map(([agent, qs]) => handback(agent, qs)).join("\n");
    write(root, HANDBACKS, `# Hand-backs of ideation step 2 (research and discovery)\n\n${body}`);
    if (rounds > 0) {
      const sections = Array.from({ length: rounds }, (_, i) => `## Round ${i + 1} — 2026-10-0${i + 1}\n\n### Q-earlier-${String(i + 1).padStart(2, "0")} — An earlier question?\n- **Blocking:** no · **Material:** no\n- **Options:**\n  1. Yes (Recommended) — fits v1.\n  2. No — defers it.\n- **Answer:** Yes (Recommended)\n- **Extracted instructions:** none\n`);
      write(root, LOG, `# Questions log — ideation\n\n${sections.join("\n")}`);
    }
  };
}

export const PROMPT = `Ideation of CHG-001 is in progress. Step 2 (research and discovery) has finished and the specialists' final messages are saved in ${HANDBACKS}. Run the interview for their questions now, following the interview protocol, and log it. Specialists are not available in this session.`;

/** The questions-log text, or "" when absent. */
export function readLog(root) {
  try {
    return readFileSync(join(root, ...LOG.split("/")), "utf8");
  } catch {
    return "";
  }
}

/** The section of the log for round `n` (up to the next round heading). */
export function roundSection(log, n) {
  const m = new RegExp(`^## Round ${n}\\b[^\\n]*\\n([\\s\\S]*?)(?=^## Round \\d|(?![\\s\\S]))`, "m").exec(log);
  return m ? m[1] : null;
}

/** Common checks of every interview scenario: 1–4 questions per call and the C001-REQ-206 option format. */
export function roundChecks(transcript, optionProblems) {
  const { failures, check } = checker();
  const calls = askUserQuestions(transcript);
  check(calls.length > 0, "no AskUserQuestion call");
  for (const [i, c] of calls.entries()) check(c.questions.length >= 1 && c.questions.length <= 4, `call ${i + 1} has ${c.questions.length} questions`);
  for (const qq of calls.flatMap((c) => c.questions)) for (const p of optionProblems(qq)) check(false, `${qq.header}: ${p}`);
  return { failures, check, calls };
}
