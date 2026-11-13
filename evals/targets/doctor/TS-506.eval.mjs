// C002-TC-506 — verifies C002-TS-506 (C002-AC-504.1, C002-REQ-504; C002-T-038, revised by C002-T-084 for
// defect D-057): the doctor table on cfg-full has the columns Tool, Status, Version, Fallback and Fix and
// the host's rows of C002-IF-006 §1, in order; the Context7 and DeepWiki rows are `ok` with an empty Fix;
// the session holds exactly one Context7 and one DeepWiki tool call, both by `sdd-researcher`
// (C002-IF-006 §2.1); and it writes only `.sdd/_constitution/toolchain.md`, or no file without `.sdd/`.
// Scenario Outline, one case per Examples row:
//   TS-506-claude-code         Claude Code, a workspace with .sdd/       (C002-T-084 step 8)
//   TS-506-opencode            OpenCode, a workspace with .sdd/          (CHG-003)
//   TS-506-claude-code-no-sdd  Claude Code, a repository without .sdd/   (C002-T-084 step 8)
//   TS-506-opencode-no-sdd     OpenCode, a repository without .sdd/      (CHG-003)
import { checker } from "../../harness/assert.mjs";
import { git } from "../../harness/workspaces.mjs";
import { doctorCase, emptyFix, HOSTS, remoteCalls, tableHeader, tableRows, writtenFiles } from "./doctor-cases.mjs";

const COLUMNS = ["Tool", "Status", "Version", "Fallback", "Fix"];
const TOOLCHAIN = ".sdd/_constitution/toolchain.md";

function row(host, sdd, extra = {}) {
  const id = `TS-506-${host}${sdd ? "" : "-no-sdd"}`;
  return {
    id,
    title: `Doctor table on ${HOSTS[host].host}, ${sdd ? "a workspace with .sdd/" : "a repository without .sdd/"} (TS-506)`,
    ...doctorCase(host, "cfg-full", { ...(sdd ? {} : { fixture: (root) => git(root, "init", "-q") }), ...extra }),
    assert({ transcript, root }) {
      const { failures, check } = checker();
      const head = tableHeader(transcript);
      check(JSON.stringify(head) === JSON.stringify(COLUMNS), `${id}: columns ${JSON.stringify(head)}, expected ${JSON.stringify(COLUMNS)}`);
      const rows = tableRows(transcript);
      const names = rows.map((r) => r.tool);
      check(JSON.stringify(names) === JSON.stringify(HOSTS[host].rows), `${id}: rows ${JSON.stringify(names)}, expected ${JSON.stringify(HOSTS[host].rows)}`);
      for (const tool of ["Context7", "DeepWiki"]) {
        const r = rows.find((x) => x.tool === tool);
        check(r?.status === "ok", `${id}: ${tool} status "${r?.status}", expected ok`);
        check(r !== undefined && emptyFix(r.fix), `${id}: ${tool} Fix "${r?.fix}", expected empty`);
      }
      const calls = remoteCalls(transcript);
      for (const server of ["context7", "deepwiki"]) {
        const of = calls.filter((c) => c.server === server);
        check(of.length === 1, `${id}: ${of.length} ${server} tool calls (${of.map((c) => `${c.name} by ${c.by}`).join(", ") || "none"}), expected exactly one`);
        check(of.every((c) => c.by === "sdd-researcher"), `${id}: ${server} calls by ${of.map((c) => c.by).join(", ")}, expected sdd-researcher`);
      }
      const written = writtenFiles(transcript, root);
      const allowed = sdd ? [TOOLCHAIN] : [];
      const other = written.filter((p) => !allowed.includes(p));
      check(other.length === 0, `${id}: wrote ${JSON.stringify(other)}, expected ${sdd ? `no file other than ${TOOLCHAIN}` : "no file"}`);
      return failures;
    },
  };
}

const OC = { targetPackage: { target: "opencode" } };
export default [row("claude-code", true), row("opencode", true, OC), row("claude-code", false), row("opencode", false, OC)];
