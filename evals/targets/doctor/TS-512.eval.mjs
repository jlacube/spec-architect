// C002-TC-512 — verifies C002-TS-512 (C002-AC-507.1, C002-REQ-507; C002-T-038, revised by C002-T-084 for
// defect D-057 and critic CR-194): the init command on cfg-full and a repository without `.sdd/` writes
// `.sdd/_constitution/toolchain.md` with the host rows once the baseline survey completes; its Context7 and
// DeepWiki rows state detected "yes"; the session holds exactly one Context7 and one DeepWiki tool call,
// both by `sdd-researcher`, and none by any other agent (C002-IF-006 §2.1). Scenario Outline:
//   TS-512-opencode     the OpenCode row and the sdd CLI row    (CHG-003)
//   TS-512-claude-code  the Claude Code row and no sdd CLI row  (C002-T-084 step 8)
import { checker } from "../../harness/assert.mjs";
import { git } from "../../harness/workspaces.mjs";
import { doctorCase, remoteCalls, toolchainRows } from "./doctor-cases.mjs";
import { remoteDetectedProblems, toolchainProblems } from "./TS-511.eval.mjs";

const PROMPT = { opencode: "/architect-init", "claude-code": "/architect:init" };
const HOST_ROWS = { opencode: ["OpenCode", "sdd CLI"], "claude-code": ["Claude Code"] };

function row(host, extra = {}) {
  const id = `TS-512-${host}`;
  return {
    id,
    title: `toolchain.md written by init on ${host} (TS-512)`,
    ...doctorCase(host, "cfg-full", { prompt: PROMPT[host], fixture: (root) => git(root, "init", "-q"), ...extra }),
    assert({ transcript, root }) {
      const { failures, check } = checker();
      for (const p of toolchainProblems(root, host, { only: HOST_ROWS[host] })) check(false, `${id} ${p}`);
      if (host === "claude-code") {
        const t = toolchainRows(root);
        check(!t.rows?.some((r) => r.tool === "sdd CLI"), `${id}: toolchain.md has an sdd CLI row`);
      }
      for (const p of remoteDetectedProblems(root, host)) check(false, `${id} ${p}`);
      const calls = remoteCalls(transcript);
      for (const server of ["context7", "deepwiki"]) {
        const of = calls.filter((c) => c.server === server);
        check(of.length === 1 && of[0].by === "sdd-researcher", `${id}: ${server} tool calls ${JSON.stringify(of.map((c) => `${c.name} by ${c.by}`))}, expected exactly one, by sdd-researcher`);
      }
      const others = calls.filter((c) => c.by !== "sdd-researcher");
      check(others.length === 0, `${id}: Context7 or DeepWiki calls by another agent: ${others.map((c) => `${c.name} by ${c.by}`).join(", ")}`);
      return failures;
    },
  };
}

export default [row("opencode", { targetPackage: { target: "opencode" } }), row("claude-code")];
