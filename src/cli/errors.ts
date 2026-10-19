// CLI error and warning catalogue: a mirror of C001 errors.md §1–§2 (codes, conditions, messages and
// fixes verbatim; a test compares the two). Rendering per C001-IF-01 "Output":
//   ERR-CLI-<nnn>: <message>. Fix: <corrective action>
// Placeholders `<name>` are filled from the parameters given; `…` takes the parameter `list`.

export interface CatalogueEntry {
  code: string;
  condition: string;
  message: string;
  fix: string;
  /** 2 for errors, 3 for internal errors and failed writes, 0 for warnings. */
  exitCode: number;
}

const entries: [string, string, string, string][] = [
  ["ERR-CLI-001", "No `.sdd/` found (command other than `init`)", "Not an SDD workspace", "Run `sdd init` or `/architect:init`"],
  ["ERR-CLI-002", "Change number not found or ambiguous", "Change `<NNN>` not found", "Check `sdd status`"],
  ["ERR-CLI-003", "Invalid arguments or options", "Usage error: `<detail>`", "See `sdd <command> --help`"],
  ["ERR-CLI-004", "Unknown ID type", "Unknown ID type `<TYPE>`; valid: …", "Use a type from C001-IF-04 §2"],
  ["ERR-CLI-005", "Invalid task status", "Invalid status `<s>`; valid: todo, in-progress, blocked, done, dropped", "Use a valid status"],
  ["ERR-CLI-006", "`blocked` without reason", "`--reason` is required for status blocked", "Add `--reason \"<text>\"`"],
  ["ERR-CLI-007", "Profile downgrade requested", "A full change cannot become lite", "Keep full; split the work into a new lite change"],
  ["ERR-CLI-008", "Defect reference unknown", "`<ID>` is not defined in an active change", "Reference an existing REQ/AC/TS/T ID"],
  ["ERR-CLI-009", "Archive preconditions unmet", "Cannot archive `<NNN>`: `<list>`", "Finish/drop tasks, close defects, approve G3"],
  ["ERR-CLI-010", "Unwaived lint errors at approval", "Approval blocked by lint errors: `<list>`", "Fix the findings or `--waive` them with a note"],
  ["ERR-CLI-011", "Open clarification markers at approval", "Approval blocked by open markers: `<list>`", "Answer the questions or `--waive` them"],
  ["ERR-CLI-012", "Unresolved critic blockers at approval", "Approval blocked by critic blockers: `<list>`", "Resolve the findings or `--waive` them"],
  ["ERR-CLI-013", "Task transition not allowed", "Transition `<from>` → `<to>` not allowed", "See task state machine"],
  ["ERR-CLI-014", "Change not active", "Change `<NNN>` is `<stopped|archived>`", "Create a new change"],
  ["ERR-CLI-015", "Predecessor phase not approved at approval", "`<phase>` requires approved `<predecessor>`", "Approve the predecessor first"],
  ["ERR-CLI-016", "Internal error (exit 3)", "Internal error: `<detail>`", "Re-run with `SDD_DEBUG=1` and report"],
  ["ERR-CLI-017", "Atomic write failed (exit 3)", "Could not write `<file>`; previous version kept", "Check disk space and permissions"],
  ["ERR-CLI-018", "Commit at approval impossible", "Cannot commit the approval: `<reason>`", "Run inside a git repository with nothing else staged, or approve without `--commit`"],
  // CHG-002 errors.md §5 (contract delta C002-IF-007).
  ["ERR-CLI-019", "`sdd template show` names an unknown profile, a path that leaves the profile's template folder after `..` segments and links are resolved, or a template that exists neither under `.sdd/_templates/<profile>/` nor among the shipped templates. `<profile>` and `<path>` are the profile and the path as given", "`no <profile> template <path>`", "List the templates with `sdd template list <profile>` (C002-REQ-520)"],
  ["ERR-CLI-020", "`--user-data` is given and the per-user data folder cannot be determined (the variable of the platform rule is unset or empty), is a relative path, or resolves inside the current repository. `<reason>` is `<variable> is not set`, `<variable> is relative: <value>` or `<folder> lies inside the repository <root>`", "`cannot use the user data folder: <reason>`", "Set the variable to an absolute folder outside the repository, or pass such a folder as an argument instead of `--user-data`"],
  ["ERR-CLI-021", "`sdd install copilot` would replace a file or a server entry it did not write: an existing `.github/agents/<agent name>.agent.md` (such as `.github/agents/sdd-critic.agent.md`, C002-REQ-322) or `.github/hooks/architect-guard.json`, or a `servers` entry of `.vscode/mcp.json` with the name of a package server, that the install record does not list with its present SHA-256 and that differs from what the install would write; or `.vscode/mcp.json` does not parse as strict JSON or has no object at its top level or under `servers`. One line per file or server; nothing is written (C002-IF-007 §Install step 4). `<reason>` is `was not written by sdd install copilot`, `server \"<name>\" was not written by sdd install copilot`, or `cannot be parsed as JSON without comments: <detail>`", "`install conflict: <path> <reason>`", "Rename or remove the named agent file, hook file or server entry of your own, or remove the comments from `.vscode/mcp.json`, then run the command again"],
  ["ERR-CLI-022", "`sdd install copilot` cannot use the Copilot package: no `--package` and the running CLI is not the `scripts/sdd.mjs` of a Copilot package; the folder holds no `architect-target.json`, the manifest does not parse or names another target; a source file of C002-IF-005 §3 is missing; or the package's absolute path holds `\"`, `$`, `%`, a backtick or a control character, which a hook command cannot carry (C002-IF-008 §4). Nothing is written", "`cannot install from <path>: <reason>`", "Pass `--package` with the unpacked Copilot package folder, or move the package to a path without those characters"],
  ["WARN-CLI-001", "Task done while dependencies unfinished", "`<T>` done before `<deps>`", "Confirm order or update dependencies"],
];

export const CATALOGUE: Readonly<Record<string, CatalogueEntry>> = Object.fromEntries(
  entries.map(([code, condition, message, fix]) => [
    code,
    { code, condition, message, fix, exitCode: code.startsWith("WARN") ? 0 : /\(exit 3\)/.test(condition) ? 3 : 2 },
  ]),
);

export type Params = Record<string, string>;

function fill(template: string, params: Params): string {
  let s = template.replace(/<([^<>]+)>/g, (m, key: string) => params[key] ?? m);
  if (params["list"] !== undefined) s = s.replace("…", params["list"]);
  return s;
}

/** An error or warning from the catalogue, with the values for its placeholders. */
export class CliError extends Error {
  readonly entry: CatalogueEntry;
  constructor(
    readonly code: string,
    readonly params: Params = {},
  ) {
    const entry = CATALOGUE[code];
    if (!entry) throw new Error(`unknown catalogue code ${code}`);
    super(fill(entry.message, params));
    this.entry = entry;
    this.name = "CliError";
  }
  get exitCode(): number {
    return this.entry.exitCode;
  }
  get fix(): string {
    return fill(this.entry.fix, this.params);
  }
}

/** One line: `<code>: <message>. Fix: <fix>` (C001-IF-01, C001-NFR-601). */
export function formatError(e: CliError): string {
  return `${e.code}: ${e.message}. Fix: ${e.fix}`;
}

/** Usage error (ERR-CLI-003) for `command`. */
export function usage(command: string, detail: string): CliError {
  return new CliError("ERR-CLI-003", { detail, command });
}
