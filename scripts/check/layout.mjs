// PLG-LAYOUT-001: every path of C001-IF-08 §1 under plugins/architect/ exists (C001-REQ-1101).
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { finding, rel } from "./lib.mjs";

const PATHS = [".claude-plugin/plugin.json", "agents", "skills", "commands", "hooks/hooks.json", ".mcp.json", "serena/architect-read-only.yml", "scripts/sdd.mjs", "templates", "LICENSE", "THIRD_PARTY_NOTICES.md"];

export default {
  code: "PLG-LAYOUT-001",
  check(ctx) {
    const out = PATHS.filter((p) => !existsSync(join(ctx.plugin, p))).map((p) => finding(this.code, rel(ctx, join(ctx.plugin, p)), null, `missing ${p}`));
    const agents = existsSync(join(ctx.plugin, "agents")) ? readdirSync(join(ctx.plugin, "agents")).filter((n) => /^sdd-.+\.md$/.test(n)) : [];
    if (agents.length !== 10) out.push(finding(this.code, rel(ctx, join(ctx.plugin, "agents")), null, `${agents.length} agents, expected 10`));
    for (const s of existsSync(join(ctx.plugin, "skills")) ? readdirSync(join(ctx.plugin, "skills"), { withFileTypes: true }) : [])
      if (s.isDirectory() && !existsSync(join(ctx.plugin, "skills", s.name, "SKILL.md"))) out.push(finding(this.code, rel(ctx, join(ctx.plugin, "skills", s.name)), null, "skill folder without SKILL.md"));
    return out;
  },
};
