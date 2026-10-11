// Entry point of the `sdd` CLI, bundled into plugins/architect/scripts/sdd.mjs by scripts/build.mjs.
import { readFileSync } from "node:fs";
import { runCli } from "./cli/run.ts";

process.exitCode = runCli(process.argv.slice(2), {
  cwd: process.cwd(),
  env: process.env,
  stdout: (text) => process.stdout.write(text),
  stderr: (text) => process.stderr.write(text),
  stdin: () => {
    try {
      return readFileSync(0, "utf8");
    } catch {
      return ""; // no standard input (a terminal or a closed handle)
    }
  },
});
