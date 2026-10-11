// The sdd CLI front-end (C001-IF-01): dispatch, option parsing (node:util parseArgs), workspace
// discovery, error rendering and exit codes. No side effects at import; src/cli.ts wires it to the
// process.
import { parseArgs } from "node:util";
import { findWorkspace } from "../workspace/find.ts";
import { AtomicWriteError } from "../io/atomic.ts";
import { normalisePath } from "../io/paths.ts";
import type { LintRule } from "../lint/types.ts";
import { checkOptions, checkPositional, COMMANDS, RULES, type CommandSpec } from "./commands.ts";
import { CliError, usage } from "./errors.ts";
import { Output } from "./output.ts";

export interface CliIo {
  cwd: string;
  env: Readonly<Record<string, string | undefined>>;
  stdout(text: string): void;
  stderr(text: string): void;
  /** Reads standard input (hook commands); absent means empty input. */
  stdin?: () => string;
  /** Replaces the registered lint rules (tests). */
  rules?: readonly LintRule[];
}

const GLOBAL_OPTIONS = {
  cwd: { type: "string" },
  json: { type: "boolean" },
  quiet: { type: "boolean" },
  help: { type: "boolean", short: "h" },
} as const;

const GROUPS = new Set(COMMANDS.filter((c) => c.name.includes(" ")).map((c) => c.name.split(" ")[0]!));

function findCommand(argv: readonly string[]): { spec: CommandSpec; rest: string[] } {
  const [first, second] = argv;
  if (first === undefined) throw usage("<command>", "no command given");
  if (GROUPS.has(first)) {
    const name = `${first} ${second ?? ""}`.trim();
    const spec = COMMANDS.find((c) => c.name === name);
    if (!spec) throw usage(first, `unknown command ${name}`);
    return { spec, rest: argv.slice(2) };
  }
  const spec = COMMANDS.find((c) => c.name === first);
  if (!spec) throw usage("<command>", `unknown command ${first}`);
  return { spec, rest: argv.slice(1) };
}

export { findWorkspace };

function optionHelp(spec: CommandSpec): string {
  return Object.entries({ ...spec.options })
    .map(([k, o]) => `--${k}${o.type === "string" ? " <value>" : ""}${o.required ? " (required)" : ""}`)
    .join(", ");
}

function topHelp(): string {
  const width = Math.max(...COMMANDS.map((c) => c.name.length));
  const lines = COMMANDS.map((c) => `  ${c.name.padEnd(width)}  ${c.summary}`);
  return [
    "Usage: sdd <command> [<subcommand>] [arguments] [options]",
    "",
    "Commands:",
    ...lines,
    "",
    "Global options: --cwd <path>, --json (where supported), --quiet, --help. SDD_DEBUG=1 writes traces to standard error.",
  ].join("\n");
}

function commandHelp(spec: CommandSpec): string {
  const opts = optionHelp(spec);
  return [`Usage: sdd ${spec.name} ${spec.usage}`, "", spec.summary + ".", ...(opts ? ["", `Options: ${opts}`] : [])].join("\n");
}

/** Runs one CLI invocation and returns its exit code (C001-IF-01 "Exit codes"). */
export function runCli(argv: readonly string[], io: CliIo): number {
  const out = new Output(io, io.env);
  let code: number;
  out.trace("start", { argv: argv.join(" ") });
  try {
    if (argv[0] === "--help" || argv[0] === "-h" || argv[0] === "help") {
      out.line(topHelp());
      code = 0;
    } else {
      const { spec, rest } = findCommand(argv);
      out.trace("dispatch", { command: spec.name.replace(" ", ".") });
      code = execute(spec, rest, io, out);
    }
  } catch (e) {
    const err =
      e instanceof CliError
        ? e
        : e instanceof AtomicWriteError
          ? new CliError("ERR-CLI-017", { file: e.path })
          : new CliError("ERR-CLI-016", { detail: e instanceof Error ? e.message : String(e) });
    if (!(e instanceof CliError) && e instanceof Error) out.trace("exception", { stack: e.stack?.split("\n").slice(0, 3).join(" | ") });
    out.error(err);
    code = err.exitCode;
  }
  out.trace("exit", { exit: code });
  return code;
}

function execute(spec: CommandSpec, rest: string[], io: CliIo, out: Output): number {
  let parsed: ReturnType<typeof parseArgs>;
  try {
    parsed = parseArgs({ args: rest, options: { ...GLOBAL_OPTIONS, ...spec.options }, allowPositionals: true, strict: true });
  } catch (e) {
    throw usage(spec.name, (e instanceof Error ? e.message : String(e)).split(". ")[0]!.replace(/\.$/, ""));
  }
  const values = parsed.values as Record<string, string | boolean | string[] | undefined>;
  if (values["help"]) {
    out.line(commandHelp(spec));
    return 0;
  }
  const args: Record<string, string | undefined> = {};
  spec.positionals.forEach((p, i) => {
    const v = parsed.positionals[i];
    if (v === undefined) {
      if (!p.optional) throw usage(spec.name, `missing argument <${p.name}>`);
      return;
    }
    checkPositional(spec.name, p.name, v);
    args[p.name] = v;
  });
  const extra = parsed.positionals[spec.positionals.length];
  if (extra !== undefined) throw usage(spec.name, `unexpected argument ${extra}`);
  for (const [k, o] of Object.entries(spec.options)) if (o.required && values[k] === undefined) throw usage(spec.name, `missing option --${k}`);
  checkOptions(spec, values);

  const cwd = values["cwd"] !== undefined ? normalisePath(values["cwd"] as string, { cwd: io.cwd }) : io.cwd;
  let root = "";
  if (spec.workspace) {
    const found = findWorkspace(cwd);
    if (found === null) throw new CliError("ERR-CLI-001");
    root = found;
    out.trace("workspace", { root });
  }
  if (!spec.run) throw usage(spec.name, `sdd ${spec.name} is not implemented yet`);
  return spec.run({ name: spec.name, out, cwd, root, args, values, rules: io.rules ?? RULES, stdin: io.stdin ?? (() => "") });
}
