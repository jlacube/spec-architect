// C001-TC-127 — verifies C001-TS-127 (C001-AC-121.1, C001-REQ-121): brownfield init writes inventory stubs.
// /architect:init on fx-brownfield-ts (modules src/billing, src/auth, tests/) through the conductor on
// cfg-full; _living/ gets CAP-billing.md and CAP-auth.md, each inventory-only with the five sections and
// evidence entries naming a path and a layer.
import { cpSync } from "node:fs";
import { checker } from "../harness/assert.mjs";
import { ROOT } from "../harness/fixtures.mjs";
import { machine } from "../harness/machines.mjs";
import { git } from "../harness/workspaces.mjs";
import { join } from "node:path";
import { read } from "../cap10/carto.mjs";

const m = machine("cfg-full");

export default {
  id: "TS-127",
  title: "Brownfield init writes inventory stubs",
  agent: "architect:sdd-conductor",
  plugins: m.plugins,
  env: m.env,
  fixture: (root) => {
    cpSync(join(ROOT, "tests", "fixtures", "fx-brownfield-ts"), root, { recursive: true });
    git(root, "init", "-q");
    git(root, "add", "-A");
    git(root, "commit", "-q", "-m", "fixture");
  },
  allowTools: ["Agent", "Write", "Edit", "Bash", "ToolSearch", "LSP", ...["find_symbol", "get_symbols_overview", "find_referencing_symbols", "find_declaration", "find_implementations"].map((t) => `mcp__plugin_architect_serena__${t}`)],
  maxTurns: 30,
  prompt: "/architect:init",
  assert({ root }) {
    const { failures, check } = checker();
    for (const cap of ["billing", "auth"]) {
      const text = read(root, `.sdd/_living/CAP-${cap}.md`);
      check(text, `_living/CAP-${cap}.md missing`);
      if (!text) continue;
      check(/^inventory_only:\s*true\s*$/m.test(text), `CAP-${cap}: no inventory_only: true`);
      for (const s of ["Purpose", "Entry points", "Main modules", "Owning tests", "Evidence"]) check(new RegExp(`^#{2,3} ${s}\\s*$`, "m").test(text), `CAP-${cap}: section ${s} missing`);
      const ev = text.slice(text.search(/^#{2,3} Evidence/m));
      const entries = ev.split("\n").filter((l) => /^\s*-\s/.test(l) && /`[^`]+\.(ts|js|json)/.test(l) || /^- \*\*E-\d+/.test(l));
      check(entries.length > 0, `CAP-${cap}: no evidence entry with a path`);
      check(/layer:\s*(ripwire|serena|lsp|grep|ast-grep)/.test(ev), `CAP-${cap}: evidence names no layer`);
    }
    return failures;
  },
};
