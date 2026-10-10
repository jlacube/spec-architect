// Entry point of the `sdd` CLI, bundled into plugins/architect/scripts/sdd.mjs by scripts/build.mjs.
import { runCli } from "./cli/run.ts";

process.exitCode = runCli(process.argv.slice(2), {
  cwd: process.cwd(),
  env: process.env,
  stdout: (text) => process.stdout.write(text),
  stderr: (text) => process.stderr.write(text),
});
