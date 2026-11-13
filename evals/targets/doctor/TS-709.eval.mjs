// C002-TC-935 — verifies C002-TS-709 (C002-AC-522.1, C002-REQ-522; C002-T-084): a remote server probe call
// that fails. The row's `mcpOverrides` gives `deepwiki` the URL of the loopback stub MCP server
// (evals/harness/stub-mcp.mjs), which lists the DeepWiki tools and answers every tool call with the row's
// failure; the case starts the stub in its fixture and stops it in its assert. Then the DeepWiki row is
// `unreachable` with a Fix that starts "check network; endpoint ", the Context7 row is `ok`, and the
// DeepWiki row of `toolchain.md` states detected "no" and the fallback in use (C002-IF-006 §2.1).
// The Given line on the researcher's tool list (deferred tools included) is checked first (`offered`,
// doctor-cases.mjs): a session that did not offer the DeepWiki tools fails its set-up (`valid_run`
// false), not the doctor. Scenario Outline, one case per Examples row:
//   TS-709-claude-code-iserror  Claude Code, a tool result whose "isError" is true (C002-T-084 step 8)
//   TS-709-claude-code-32603    Claude Code, the JSON-RPC error -32603            (C002-T-084 step 8)
//   TS-709-opencode-iserror     OpenCode, a tool result whose "isError" is true   (CHG-003)
//   TS-709-opencode-32603       OpenCode, the JSON-RPC error -32603               (CHG-003)
import { checker } from "../../harness/assert.mjs";
import { listenStub, stubUrl } from "../../harness/stub-mcp.mjs";
import { workspace } from "../../cap11/doctor.mjs";
import { doctorCase, offered, remoteFix, tableRows, toolchainRows } from "./doctor-cases.mjs";

function row(host, failure, extra = {}) {
  const id = `TS-709-${host}-${failure === "isError" ? "iserror" : "32603"}`;
  let stub = null;
  return {
    id,
    title: `Remote probe call that fails on ${host} (${failure}) (TS-709)`,
    ...doctorCase(host, "cfg-full", extra),
    mcpOverrides: { deepwiki: stubUrl(failure) },
    fixture(root) {
      workspace(root);
      stub = listenStub(failure);
    },
    async assert({ transcript, root }) {
      await stub?.close();
      const { failures, check } = checker();
      const given = offered(transcript, root, "deepwiki");
      if (given !== true) {
        failures.push(`${id}: set-up: the session's sdd-researcher was ${given === false ? "offered no DeepWiki tool" : "not shown to hold the DeepWiki tools"} (Given not met)`);
        failures.valid_run = false;
        return failures;
      }
      const rows = tableRows(transcript);
      const dw = rows.find((r) => r.tool === "DeepWiki");
      check(dw?.status === "unreachable", `${id}: DeepWiki status "${dw?.status}", expected unreachable`);
      check(String(dw?.fix ?? "").startsWith(remoteFix("DeepWiki", "failed").replace(/https.*$/, "")), `${id}: DeepWiki Fix "${dw?.fix}", expected to start with "check network; endpoint "`);
      const c7 = rows.find((r) => r.tool === "Context7");
      check(c7?.status === "ok", `${id}: Context7 status "${c7?.status}", expected ok`);
      const t = toolchainRows(root);
      if (t.problem) check(false, `${id}: ${t.problem}`);
      else {
        const r = t.rows.find((x) => x.tool === "DeepWiki");
        check(/^no\b/i.test(r?.detected ?? ""), `${id}: toolchain.md DeepWiki detected "${r?.detected}", expected no`);
        check(Boolean(r?.fallback) && !/^[—–-]*$/.test(r.fallback), `${id}: toolchain.md DeepWiki fallback "${r?.fallback}", expected the fallback in use`);
      }
      return failures;
    },
  };
}

const OC = { targetPackage: { target: "opencode" } };
export default [row("claude-code", "isError"), row("claude-code", "-32603"), row("opencode", "isError", OC), row("opencode", "-32603", OC)];
