// Regrades a scenario from the files its saved transcript wrote (the content of each Write whose path
// contains <marker>), without starting a new session: for fixing an eval's own assertion after a run.
// Usage: node evals/harness/regrade.mjs <scenario.eval.mjs> <transcript.json> <path-marker>
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

const [scenarioFile, transcriptFile, marker] = process.argv.slice(2);
const scenario = (await import(pathToFileURL(scenarioFile).href)).default;
const t = JSON.parse(readFileSync(transcriptFile, "utf8"));
const root = mkdtempSync(join(tmpdir(), "regrade-"));
for (const r of t)
  for (const b of r.message?.message?.content ?? []) {
    if (b.type === "tool_use" && b.name === "Write" && String(b.input.file_path).includes(marker)) {
      const rel = String(b.input.file_path).split("\\").join("/").split("/.sdd/")[1];
      const p = join(root, ".sdd", rel);
      mkdirSync(dirname(p), { recursive: true });
      writeFileSync(p, b.input.content);
    }
  }
console.log(await scenario.assert({ transcript: t, root }));
rmSync(root, { recursive: true, force: true });
