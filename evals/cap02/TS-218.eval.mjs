// C001-TC-218 — verifies C001-TS-218 (C001-AC-216.1, C001-REQ-216): ideation fan-out. At a brownfield
// ideation start the researcher, cartographer and options-analyst are dispatched in one assistant
// turn. Specialists not written yet run as stand-ins (harness/overlay.mjs).
import { checker, dispatches } from "../harness/assert.mjs";
import { architectWithStubs } from "../harness/overlay.mjs";
import { brownfieldIdeation, IDEA } from "./drafting.mjs";

export const FANOUT = ["researcher", "cartographer", "options-analyst"];

export const ideationStart = {
  agent: "architect:sdd-conductor",
  plugins: [architectWithStubs],
  fixture: brownfieldIdeation,
  env: { CLAUDE_CODE_ENABLE_TODO_TOOLS: "1" },
  allowTools: ["Agent", "Write", "Edit", "Bash"],
  maxTurns: 18,
  prompt: `Start the ideation of change 001. The idea: ${IDEA}`,
};

export default {
  id: "TS-218",
  title: "Ideation fan-out",
  ...ideationStart,
  assert({ transcript }) {
    const { failures, check } = checker();
    const d = dispatches(transcript);
    const turns = new Map();
    for (const x of d) turns.set(x.message, [...(turns.get(x.message) ?? []), x.type]);
    const together = [...turns.values()].some((types) => FANOUT.every((f) => types.some((t) => t.endsWith(`sdd-${f}`))));
    check(together, `the three were not dispatched in one turn: ${JSON.stringify([...turns.values()])}`);
    return failures;
  },
};
