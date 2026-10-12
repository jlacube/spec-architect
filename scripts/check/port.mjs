// PLG-PORT-001: no Claude-Code tool names in skills and templates outside a "Claude Code wiring"
// section (C001-REQ-1118). PLG-PORT-002: no platform-specific constructs in src/ outside the path
// module (C001-NFR-402).
import { join } from "node:path";
import { files, finding, mdLines, read, rel } from "./lib.mjs";

const TOOL_NAMES = /AskUserQuestion|Agent\(|TodoWrite|mcp__/;

export const port001 = {
  code: "PLG-PORT-001",
  check(ctx) {
    const out = [];
    const targets = [...files(join(ctx.plugin, "skills"), (r) => r.endsWith(".md")), ...files(join(ctx.plugin, "templates"), (r) => r.endsWith(".md"))];
    for (const p of targets)
      for (const l of mdLines(read(p))) {
        const m = TOOL_NAMES.exec(l.line);
        if (m && !l.headings.some((h) => /claude code wiring/i.test(h))) out.push(finding(this.code, rel(ctx, p), l.n, `Claude Code tool name "${m[0]}" outside a "Claude Code wiring" section`));
      }
    return out;
  },
};

const PLATFORM = [
  [/process\.platform/, "process.platform"],
  [/\bwin32\b/, "win32"],
  [/["'`][A-Za-z]:\\\\/, "Windows drive path literal"],
  [/\.exe\b/, ".exe"],
];

export const port002 = {
  code: "PLG-PORT-002",
  check(ctx) {
    const out = [];
    for (const p of files(join(ctx.repo, "src"), (r) => r.endsWith(".ts") && r !== "io/paths.ts"))
      read(p)
        .split("\n")
        .forEach((line, i) => {
          for (const [re, what] of PLATFORM) if (re.test(line)) out.push(finding(this.code, rel(ctx, p), i + 1, `platform-specific construct (${what}) outside src/io/paths.ts`));
        });
    return out;
  },
};
