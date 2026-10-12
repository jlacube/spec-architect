// PLG-README-001: the plugin README has the sections of C001-REQ-1115 (owned by C001-T-062).
import { existsSync } from "node:fs";
import { join } from "node:path";
import { finding, mdLines, read, rel } from "./lib.mjs";

export const SECTIONS = ["Prerequisites", "Install (Windows 11)", "Optional tools", "Quickstart", "Commands", "Agents", "Workspace layout", "Troubleshooting", "License"];

export default {
  code: "PLG-README-001",
  owner: "C001-T-062",
  check(ctx) {
    const out = [];
    for (const p of [join(ctx.plugin, "README.md"), join(ctx.repo, "README.md")]) {
      if (!existsSync(p)) {
        out.push(finding(this.code, rel(ctx, p), null, "README.md is missing"));
        continue;
      }
      const headings = new Set(mdLines(read(p)).filter((l) => !l.fenced && /^#{1,6}\s/.test(l.line)).map((l) => l.line.replace(/^#+\s+/, "").trim()));
      for (const s of SECTIONS) if (!headings.has(s)) out.push(finding(this.code, rel(ctx, p), null, `missing section "${s}"`));
    }
    return out;
  },
};
