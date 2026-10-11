// C001-TC-121 — verifies C001-TS-121 (C001-AC-115.1, C001-REQ-115): toolchain.md on a machine without
// ripwire and Serena (cfg-bare). /architect:doctor arrives in C001-T-044 and dispatches the cartographer
// with this brief; until then the cartographer is dispatched directly. toolchain.md has one row each for
// node, git, Claude Code, ripwire, Serena, ast-grep, Context7 and DeepWiki, and the ripwire row says
// detected "no" with the fallback in use.
import { checker } from "../harness/assert.mjs";
import { cartoRun, brownfield, read } from "../cap10/carto.mjs";

const BRIEF = `Brief — cartographer: toolchain record (doctor).
- Change: none (workspace level) · step — doctor
- Task: probe the toolchain of this machine and write the toolchain record: node, git, Claude Code, ripwire, Serena, ast-grep, Context7 and DeepWiki — detected (yes/no), version, path or endpoint, fallback in use.
- Inputs: none.
- Outputs: \`.sdd/_constitution/toolchain.md\` (replace the existing file).
- Quality bar: code-discovery, sdd-conventions.
- Return contract: digest (at most 20 lines) and the path written.`;

const TOOLS = ["node", "git", "Claude Code", "ripwire", "Serena", "ast-grep", "Context7", "DeepWiki"];

export default {
  id: "TS-121",
  title: "toolchain.md on a machine without ripwire",
  ...cartoRun("cfg-bare", BRIEF, brownfield()),
  assert({ root }) {
    const { failures, check } = checker();
    const text = read(root, ".sdd/_constitution/toolchain.md");
    const rows = text.split("\n").filter((l) => /^\|/.test(l)).map((l) => l.split("|").map((c) => c.trim()));
    for (const t of TOOLS) check(rows.filter((r) => r[1]?.replace(/[`*]/g, "").toLowerCase() === t.toLowerCase()).length === 1, `no single row for ${t}`);
    const rw = rows.find((r) => r[1]?.replace(/[`*]/g, "").toLowerCase() === "ripwire") ?? [];
    check(/^no\b/i.test(rw[2] ?? ""), `ripwire detected: "${rw[2]}"`);
    check(/grep|serena|lsp/i.test(rw.slice(3).join(" ")), `ripwire fallback: "${rw.slice(3).join(" | ")}"`);
    return failures;
  },
};
