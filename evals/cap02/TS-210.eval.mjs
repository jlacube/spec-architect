// C001-TC-210 — verifies C001-TS-210 (C001-AC-209.1, C001-REQ-209): merging questions from two
// specialists. The researcher and the cartographer ask the same "auth" question (non-blocking and
// blocking); the options-analyst asks a non-blocking "storage" question. Round 1 holds one "auth"
// question, marked blocking, ordered before the "storage" question.
import { optionProblems } from "../harness/assert.mjs";
import { interviewFixture, PROMPT, q, readLog, roundChecks, roundSection } from "./interview.mjs";

const AUTH_OPTIONS = [
  { label: "Clinic accounts", rationale: "Reuses the patient portal login.", recommended: true },
  { label: "Magic links", rationale: "No password, but depends on email delivery." },
];

const handbacks = {
  "sdd-researcher": [q("Q-auth-01", "auth", "How do patients sign in to book an appointment?", { options: AUTH_OPTIONS })],
  "sdd-cartographer": [q("Q-auth-02", "auth", "Which sign-in method must patients use before booking?", { blocking: true, options: AUTH_OPTIONS })],
  "sdd-options-analyst": [q("Q-storage-01", "storage", "Where are uploaded referral letters stored?")],
};

const isAuth = (x) => /sign[ -]?in|log[ -]?in|auth/i.test(`${x.header} ${x.question}`);
const isStorage = (x) => /stor|referral|letter/i.test(`${x.header} ${x.question}`);

export default {
  id: "TS-210",
  title: "Merging questions from two specialists",
  agent: "architect:sdd-conductor",
  fixture: interviewFixture(handbacks),
  allowTools: ["Write", "Edit"],
  maxTurns: 24,
  prompt: PROMPT,
  assert({ transcript, root }) {
    const { failures, check, calls } = roundChecks(transcript, optionProblems);
    const all = calls.flatMap((c) => c.questions);
    check(all.filter(isAuth).length === 1, `expected one auth question, got ${all.filter(isAuth).length}`);
    const round1 = calls[0]?.questions ?? [];
    const ia = round1.findIndex(isAuth);
    const is = round1.findIndex(isStorage);
    check(ia >= 0, "round 1 has no auth question");
    if (is >= 0) check(ia < is, "auth is not ordered before storage in round 1");
    else check(calls.findIndex((c) => c.questions.some(isStorage)) > 0, "storage question not asked after the auth question");
    const r1 = roundSection(readLog(root), 1) ?? "";
    check(/Q-auth-0[12]/.test(r1), "round 1 log has no auth question");
    const authEntry = r1.slice(r1.search(/### Q-auth/)).split(/\n### /)[0];
    check(/blocking:?\**\s*yes|blocking:\s*true/i.test(authEntry), `auth entry not marked blocking:\n${authEntry}`);
    return failures;
  },
};
