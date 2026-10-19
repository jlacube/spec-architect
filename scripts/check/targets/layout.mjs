// TGT-LAYOUT-001: the package holds exactly the files of its contract (C002-IF-005 §2, §3): ten agents,
// 13 commands or prompt files, every skill, manifest, install notes, MCP configuration; on Copilot the
// install sources and the tool classes file, and no `.mcp.json`, `hooks.json` or `plugin.json` at the root.
// TGT-MCP-001: the MCP configuration declares exactly the table's servers for the package's mode; on
// Copilot no other file declares one (C002-REQ-201, C002-REQ-301, C002-REQ-307, C002-REQ-603).
// The expected layout is the one the emitter writes for the same source, table and mode.
import { copilotPackageFindings } from "../../generate/emit/copilot.ts";
import { openCodePackageFindings } from "../../generate/emit/opencode.ts";
import { finding } from "./lib.mjs";

function packageFindings(ctx) {
  if (ctx.target === "opencode") {
    const texts = new Map([...ctx.files].map(([p, b]) => [p, b.toString("utf8")]));
    return openCodePackageFindings(texts, ctx.emitInput);
  }
  return copilotPackageFindings(ctx.files, ctx.emitInput);
}

const cache = new WeakMap();
const memo = (ctx) => {
  if (!cache.has(ctx)) cache.set(ctx, packageFindings(ctx));
  return cache.get(ctx);
};

export const layout001 = {
  code: "TGT-LAYOUT-001",
  check(ctx) {
    return memo(ctx)
      .filter((f) => f.code === this.code)
      .map((f) => finding(this.code, f.file, null, f.message));
  },
};

export const mcp001 = {
  code: "TGT-MCP-001",
  check(ctx) {
    return memo(ctx)
      .filter((f) => f.code === this.code)
      .map((f) => finding(this.code, f.file, null, f.message));
  },
};
