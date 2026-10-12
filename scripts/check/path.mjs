// PLG-PATH-001: no absolute machine paths in plugin files (C001-REQ-1120): Windows drive-letter paths
// and paths under /Users/ or /home/. Documentation examples are exempt when they sit in a fenced
// block whose info string contains "example" (```text example).
import { files, finding, mdLines, read, rel } from "./lib.mjs";

const MACHINE_PATH = /(?<![A-Za-z0-9])[A-Za-z]:[\\/](?![\\/])|(?<![\w.])\/(?:Users|home)\//;

export default {
  code: "PLG-PATH-001",
  check(ctx) {
    const out = [];
    for (const p of files(ctx.plugin, (r) => !r.startsWith("scripts/") && /\.(md|json|ya?ml|txt)$/.test(r))) {
      const lines = p.endsWith(".md") ? mdLines(read(p)) : read(p).split("\n").map((line, i) => ({ n: i + 1, line, fenced: false, info: "" }));
      for (const l of lines) if (MACHINE_PATH.test(l.line) && !(l.fenced && /\bexample\b/.test(l.info))) out.push(finding(this.code, rel(ctx, p), l.n, "absolute machine path"));
    }
    return out;
  },
};
