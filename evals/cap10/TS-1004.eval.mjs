// C001-TC-1004 — verifies C001-TS-1004 (C001-AC-1003.1, C001-REQ-1003): ripwire budget flag per verb
// family. A scripted survey asks for every verb of the Examples table; each ripwire command line carries
// the family's flag within budget, and list verbs carry neither --token-budget nor --top-k.
import { checker, toolCalls } from "../harness/assert.mjs";
import { brief, cartoRun, EVIDENCE, intelCalls } from "./carto.mjs";

const ROWS = [
  { verb: "--for=", test: (c) => /--for=/.test(c), flag: "--token-budget=", max: 4000 },
  { verb: "(default map)", test: (c) => !/--(for|pack-task|pack-signatures|callers|uses|impact|expand|test-gate|situ|hotspots|quality-panel|quality-delta|version|doctor)\b/.test(c), flag: "--max-tokens=", max: 4000 },
  { verb: "--pack-signatures", test: (c) => /--pack-signatures/.test(c), flag: "--max-tokens=", max: 4000 },
  { verb: "--callers=", test: (c) => /--callers=/.test(c), flag: "--limit=", max: 50 },
  { verb: "--impact=", test: (c) => /--impact=/.test(c), flag: "--limit=", max: 50 },
  { verb: "--test-gate", test: (c) => /--test-gate/.test(c), flag: "--limit=", max: 50 },
  { verb: "--hotspots", test: (c) => /--hotspots/.test(c), flag: "--limit=", max: 50 },
];

const TASK = "Survey the repository with ripwire, one query per item: (1) the ranked map of the repository; (2) the signatures pack; (3) the task lens for \"add partial refunds to captured payments\"; (4) the callers of createIntent; (5) the impact of capture; (6) the test gate for src/checkout/payments.ts; (7) the hotspots. Record what each query shows as evidence.";

export default {
  id: "TS-1004",
  title: "ripwire budget flag per verb family",
  ...cartoRun("cfg-full", brief(TASK, `\`${EVIDENCE}/ripwire-survey.md\`.`)),
  assert({ transcript }) {
    const { failures, check } = checker();
    const cmds = intelCalls(toolCalls, transcript).filter((c) => c.name === "Bash" && /\bripwire\b/.test(c.cmd)).map((c) => c.cmd);
    for (const r of ROWS) {
      const lines = cmds.filter(r.test);
      check(lines.length > 0, `${r.verb}: not run (ripwire commands: ${cmds.join(" | ")})`);
      for (const l of lines) {
        const v = Number(new RegExp(`${r.flag}(\\d+)`).exec(l)?.[1]);
        check(v > 0 && v <= r.max, `${r.verb}: ${r.flag} missing or above ${r.max}: ${l}`);
        if (r.flag === "--limit=") check(!/--token-budget=|--top-k=/.test(l), `${r.verb}: forbidden flag: ${l}`);
      }
    }
    return failures;
  },
};
