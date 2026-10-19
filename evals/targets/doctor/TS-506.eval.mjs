// C002-TC-506 — verifies C002-TS-506 (C002-AC-504.1, C002-REQ-504; C002-T-038): the doctor table on
// cfg-full has the columns Tool, Status, Version, Fallback and Fix and the host's rows of C002-IF-006 §1,
// in order. Scenario Outline, one case per Examples row:
//   TS-506-claude-code  Claude Code: node, git, Claude Code, ripwire, Serena, ast-grep, Context7, DeepWiki
//                       (C002-T-038 step 4: `run.mjs <this file> --only TS-506-claude-code --auth subscription`)
//   TS-506-opencode     OpenCode: the same with OpenCode for Claude Code, then sdd CLI (carried to C002-T-056)
import { checker } from "../../harness/assert.mjs";
import { doctorCase, HOSTS, tableHeader, tableRows } from "./doctor-cases.mjs";

const COLUMNS = ["Tool", "Status", "Version", "Fallback", "Fix"];

function row(host, extra = {}) {
  return {
    id: `TS-506-${host}`,
    title: `Doctor table on ${HOSTS[host].host} (TS-506)`,
    ...doctorCase(host, "cfg-full", extra),
    assert({ transcript }) {
      const { failures, check } = checker();
      const head = tableHeader(transcript);
      check(JSON.stringify(head) === JSON.stringify(COLUMNS), `TS-506 ${host}: columns ${JSON.stringify(head)}, expected ${JSON.stringify(COLUMNS)}`);
      const names = tableRows(transcript).map((r) => r.tool);
      check(JSON.stringify(names) === JSON.stringify(HOSTS[host].rows), `TS-506 ${host}: rows ${JSON.stringify(names)}, expected ${JSON.stringify(HOSTS[host].rows)}`);
      return failures;
    },
  };
}

export default [row("claude-code"), row("opencode", { targetPackage: { target: "opencode" } })];
