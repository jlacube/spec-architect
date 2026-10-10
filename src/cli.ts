// Entry point of the `sdd` CLI, bundled into plugins/architect/scripts/sdd.mjs by scripts/build.mjs.
// Placeholder until the CLI front-end lands (C001-T-012).

declare const __SDD_VERSION__: string;

const VERSION = __SDD_VERSION__;

export function main(argv: readonly string[]): number {
  const [command] = argv;
  if (command === "version") {
    process.stdout.write(`architect-plugin@${VERSION}\n`);
    return 0;
  }
  process.stderr.write(`sdd: unknown command "${command ?? ""}" (only "version" is available yet)\n`);
  return 2;
}

process.exitCode = main(process.argv.slice(2));
