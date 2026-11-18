// Checks of the kind round (C005-TS-158 … 163, 173, 174; C005-REQ-123, C005-REQ-124).
import { answerPositions, changeNewCalls, firstChangeNewAt, isKindQuestion, isProfileQuestion, pick } from "./new-change.mjs";

/** Question calls that ask for the kind, as indexes into `calls`. */
export const kindCalls = (calls) => calls.map((c, i) => (c.questions.some(isKindQuestion) ? i : -1)).filter((i) => i >= 0);

/** A reply function: the profile `lite`, and for the kind question the `n`-th entry of `kinds` (free text or a kind). */
export function liteThen(kinds) {
  let kindRound = 0;
  // The case object lives across the runs of a scenario: newChangeCase calls reset() in each run's fixture
  // (a counter kept from run 1 made runs 2 and 3 answer the last kind first, milestone run of 2026-11-18).
  const reply = (q) => {
    if (isProfileQuestion(q)) return pick(q, /\blite\b/i);
    if (isKindQuestion(q)) {
      const a = kinds[Math.min(kindRound, kinds.length - 1)];
      kindRound += 1;
      return ["greenfield", "brownfield", "mixed"].includes(a) ? pick(q, new RegExp(`\\b${a}\\b`, "i")) : a;
    }
    return q.options[0].label;
  };
  reply.reset = () => {
    kindRound = 0;
  };
  return reply;
}

/** The kind call at index `k` of kindCalls comes before any sdd change new call, with no folder `.sdd/002-*` then. */
export function kindCallBeforeCreate({ transcript, calls, check }, k, nnn = "002") {
  const kc = kindCalls(calls);
  check(kc.length > k, `expected at least ${k + 1} question call(s) asking for the kind, got ${kc.length}`);
  if (kc.length <= k) return;
  const i = kc[k];
  const at = answerPositions(transcript)[i] ?? -1;
  const create = firstChangeNewAt(transcript);
  check(create < 0 || at < create, `the kind call ${k + 1} comes after an sdd change new call`);
  check(!calls[i].folders.some((d) => d.startsWith(`${nnn}-`)), `a folder .sdd/${nnn}-* existed before the answer to kind call ${k + 1}`);
}

/** Exactly one `sdd change new` call, with `--profile <p>` and `--kind <k>`. */
export function createdWith({ transcript, check }, profile, kind) {
  const runs = changeNewCalls(transcript);
  check(runs.length === 1, `expected exactly one sdd change new call, got ${runs.length}`);
  const cmd = String(runs[0]?.input?.command ?? "");
  check(new RegExp(`--profile[ =]["']?${profile}\\b`).test(cmd), `no --profile ${profile}: ${cmd}`);
  check(new RegExp(`--kind[ =]["']?${kind}\\b`).test(cmd), `no --kind ${kind}: ${cmd}`);
}
