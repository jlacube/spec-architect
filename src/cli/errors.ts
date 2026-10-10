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
