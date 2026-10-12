// PLG-HOOK-001: every hooks.json command is `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdd.mjs"` plus arguments,
// without shell operators (C001-REQ-1121).
import { existsSync } from "node:fs";
import { join } from "node:path";
import { finding, read, rel } from "./lib.mjs";

const PREFIX = 'node "${CLAUDE_PLUGIN_ROOT}/scripts/sdd.mjs"';
const OPERATORS = ["&&", "||", ";", "|", ">", "<", "$(", "`"];

export default {
  code: "PLG-HOOK-001",
  check(ctx) {
    const p = join(ctx.plugin, "hooks", "hooks.json");
    if (!existsSync(p)) return [finding(this.code, rel(ctx, p), null, "hooks.json is missing")];
    const doc = JSON.parse(read(p));
    const out = [];
    for (const [event, entries] of Object.entries(doc.hooks ?? {}))
      for (const e of entries)
        for (const h of e.hooks ?? []) {
          const c = String(h.command ?? "");
          if (!c.startsWith(PREFIX + " ")) out.push(finding(this.code, rel(ctx, p), null, `${event}: command does not start with ${PREFIX}: ${c}`));
          const op = OPERATORS.find((o) => c.slice(PREFIX.length).includes(o));
          if (op) out.push(finding(this.code, rel(ctx, p), null, `${event}: shell operator "${op}" in ${c}`));
        }
    return out;
  },
};
