// C002-TC-936 — verifies C002-TS-710 (C002-AC-522.1, C002-REQ-522; C002-T-084): a remote server whose tools
// the researcher is not offered. The row's `mcpOverrides` turns the server off (`false`) or gives DeepWiki
// the unresolvable URL of cfg-deepwiki-down, with which the host lists no DeepWiki tool (C002-IF-006 §2.1
// Blocked endpoint). Then the row is `untested`, its Fix holds the `not offered` fix of C002-IF-006 §2.1
// step 3, the session holds no call of a tool of that server, and its row of `toolchain.md` states
// detected "no" and the fallback in use. The Given line on the researcher's tool list (deferred tools
// included) is checked first (`offered`, doctor-cases.mjs): a session that offered the server's tools
// fails its set-up (`valid_run` false), not the doctor. Scenario Outline, one case per Examples row:
//   TS-710-claude-code-context7-off   Claude Code, context7 false                 (C002-T-084 step 8)
//   TS-710-claude-code-deepwiki-off   Claude Code, deepwiki false                 (C002-T-084 step 8)
//   TS-710-opencode-context7-off      OpenCode, context7 false                    (CHG-003)
//   TS-710-opencode-deepwiki-off      OpenCode, deepwiki false                    (CHG-003)
//   TS-710-claude-code-deepwiki-down  Claude Code, the URL of cfg-deepwiki-down   (C002-T-084 step 8)
//   TS-710-opencode-deepwiki-down     OpenCode, the URL of cfg-deepwiki-down      (CHG-003)
import { checker } from "../../harness/assert.mjs";
import { doctorCase, offered, REMOTE, remoteCalls, remoteFix, tableRows, toolchainRows } from "./doctor-cases.mjs";

/** The DeepWiki URL of machine configuration cfg-deepwiki-down (evals/harness/machines.mjs). */
export const DEEPWIKI_DOWN = "https://deepwiki-unreachable.invalid/mcp";

function row(host, rowName, override, extra = {}) {
  const { server } = REMOTE[rowName];
  const id = `TS-710-${host}-${server}-${override === false ? "off" : "down"}`;
  return {
    id,
    title: `${rowName} not offered to the researcher on ${host} (${override === false ? "false" : "cfg-deepwiki-down URL"}) (TS-710)`,
    ...doctorCase(host, "cfg-full", extra),
    mcpOverrides: { [server]: override },
    assert({ transcript, root }) {
      const { failures, check } = checker();
      const given = offered(transcript, root, server);
      if (given !== false) {
        failures.push(`${id}: set-up: the session's sdd-researcher ${given === true ? `was offered the ${rowName} tools` : `was not shown to hold no ${rowName} tool`} (Given not met)`);
        failures.valid_run = false;
        return failures;
      }
      const r = tableRows(transcript).find((x) => x.tool === rowName);
      check(r?.status === "untested", `${id}: ${rowName} status "${r?.status}", expected untested`);
      const want = remoteFix(rowName, "not offered").replace(/https:\S+$/, "");
      check(String(r?.fix ?? "").includes(want), `${id}: ${rowName} Fix "${r?.fix}", expected it to contain "${want}"`);
      const calls = remoteCalls(transcript).filter((c) => c.server === server);
      check(calls.length === 0, `${id}: ${calls.length} call(s) of a ${rowName} tool (${calls.map((c) => `${c.name} by ${c.by}`).join(", ")}), expected none`);
      const t = toolchainRows(root);
      if (t.problem) check(false, `${id}: ${t.problem}`);
      else {
        const tr = t.rows.find((x) => x.tool === rowName);
        check(/^no\b/i.test(tr?.detected ?? ""), `${id}: toolchain.md ${rowName} detected "${tr?.detected}", expected no`);
        check(Boolean(tr?.fallback) && !/^[—–-]*$/.test(tr.fallback), `${id}: toolchain.md ${rowName} fallback "${tr?.fallback}", expected the fallback in use`);
      }
      return failures;
    },
  };
}

const OC = { targetPackage: { target: "opencode" } };
export default [
  row("claude-code", "Context7", false),
  row("claude-code", "DeepWiki", false),
  row("opencode", "Context7", false, OC),
  row("opencode", "DeepWiki", false, OC),
  row("claude-code", "DeepWiki", DEEPWIKI_DOWN),
  row("opencode", "DeepWiki", DEEPWIKI_DOWN, OC),
];
