// TGT-HOOK-001 (Copilot): every command of `install/hooks.template.json` is `node "@CLI_COPY@"` with
// arguments only (no shell operator, no `${PLUGIN_ROOT}` or `${CLAUDE_PLUGIN_ROOT}`); no agent frontmatter
// declares a hook; in both modes exactly one PreToolUse entry, `hook guard --host copilot` with `--mode`
// equal to the table's mode and the ten Architect agents in `--agents`, and no other file declares a
// PreToolUse hook (C002-REQ-302, C002-REQ-308, C002-REQ-316, C002-REQ-326, C002-REQ-327).
// TGT-CLASS-001 (Copilot, both modes): `hooks/tool-classes.json` classes every tool offered to a
// specialist, by its hook name, and the recorded generic tools `Write` and `Bash`, in exactly one of
// `write`, `terminal`, `read_only`, with the table's terminal dialect (C002-REQ-318, C002-REQ-319,
// C002-REQ-327). A missing template or classes file is TGT-LAYOUT-001's.
import { copilotHookFindings } from "../../generate/emit/copilot.ts";
import { finding } from "./lib.mjs";

const cache = new WeakMap();
const memo = (ctx) => {
  if (!cache.has(ctx)) cache.set(ctx, ctx.target === "copilot" ? copilotHookFindings(ctx.files, ctx.emitInput) : []);
  return cache.get(ctx);
};

const wrap = (code) => ({
  code,
  check(ctx) {
    return memo(ctx)
      .filter((f) => f.code === code)
      .map((f) => finding(code, f.file, null, f.message));
  },
});

export const hook001 = wrap("TGT-HOOK-001");
export const class001 = wrap("TGT-CLASS-001");
