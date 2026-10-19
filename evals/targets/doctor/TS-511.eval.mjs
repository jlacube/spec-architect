// C002-TC-511 — verifies C002-TS-511 (C002-AC-507.1, C002-REQ-507; C002-T-038): after the doctor on
// cfg-full in a workspace with `.sdd/`, `.sdd/_constitution/toolchain.md` has the host's rows, in order,
// each stating detected (yes/no), version, path or endpoint, and the fallback in use. Scenario Outline:
//   TS-511-claude-code  node, git, Claude Code, ripwire, Serena, ast-grep, Context7, DeepWiki (C002-T-038 step 4)
//   TS-511-opencode     the same with OpenCode for Claude Code, then sdd CLI          (carried to C002-T-056)
import { checker } from "../../harness/assert.mjs";
import { doctorCase, HOSTS, toolchainRows } from "./doctor-cases.mjs";

/** Problems of the toolchain record of `root` against the rows of `host` (also used by TS-512). */
export function toolchainProblems(root, host, { only } = {}) {
  const out = [];
  const t = toolchainRows(root);
  if (t.problem) return [`${host}: ${t.problem}`];
  const names = t.rows.map((r) => r.tool);
  if (only) {
    for (const n of only) if (!names.includes(n)) out.push(`${host}: toolchain.md has no ${n} row (rows ${JSON.stringify(names)})`);
    return out;
  }
  const want = HOSTS[host].rows;
  if (JSON.stringify(names) !== JSON.stringify(want)) out.push(`${host}: toolchain.md rows ${JSON.stringify(names)}, expected ${JSON.stringify(want)}`);
  for (const r of t.rows) {
    if (!/^(yes|no)\b/i.test(r.detected)) out.push(`${host}: ${r.tool} detected "${r.detected}" is not yes/no`);
    for (const k of ["version", "path", "fallback"]) if (r[k] === "") out.push(`${host}: ${r.tool} has an empty ${k} cell`);
  }
  return out;
}

function row(host, extra = {}) {
  return {
    id: `TS-511-${host}`,
    title: `toolchain.md on ${HOSTS[host].host} (TS-511)`,
    ...doctorCase(host, "cfg-full", extra),
    assert({ root }) {
      const { failures, check } = checker();
      for (const p of toolchainProblems(root, host)) check(false, `TS-511 ${p}`);
      return failures;
    },
  };
}

export default [row("claude-code"), row("opencode", { targetPackage: { target: "opencode" } })];
