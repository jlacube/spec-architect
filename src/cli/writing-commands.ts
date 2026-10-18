// The writing subcommands of the sdd CLI (C002-IF-008 §1.2, C002-REQ-521): the single list that the
// CLI's `COMMANDS` rows (their `writes` property) and the bash guard's `--cwd` rule both read. Data only,
// no imports, so the guard does not import the CLI command module. tests/guards/writing-commands.test.ts
// ties it to the §1.2 table in both directions.
//
// `when`  always         the subcommand writes whatever its options
//         with-write     it writes only when `--write` is among its words before the first `--`
//         unless-dry-run it writes unless `--dry-run` is among those words
// `guard` cwd            the `--cwd` rule of §1.2 applies (C002-REQ-521)
//         serena         §1.1 decides the command (C002-REQ-517, C002-T-010)
//         deny           denied in every form (C002-REQ-325, C002-T-059); `install` matches whatever
//                        the second word is

export type WriteWhen = "always" | "with-write" | "unless-dry-run";
export type WritingGuard = "cwd" | "serena" | "deny";

export interface WritingCommand {
  /** The subcommand: one word, or group and verb separated by one space (the group's second word names
   *  the subcommand, as in the CLI's own lookup). */
  readonly name: string;
  readonly when: WriteWhen;
  readonly guard: WritingGuard;
}

export const WRITING_COMMANDS: readonly WritingCommand[] = [
  { name: "init", when: "always", guard: "cwd" },
  { name: "change new", when: "always", guard: "cwd" },
  { name: "change profile", when: "always", guard: "cwd" },
  { name: "change revise", when: "always", guard: "cwd" },
  { name: "change stop", when: "always", guard: "cwd" },
  { name: "id next", when: "always", guard: "cwd" },
  { name: "id tombstone", when: "always", guard: "cwd" },
  { name: "status", when: "with-write", guard: "cwd" },
  { name: "trace", when: "with-write", guard: "cwd" },
  { name: "hook subagent-stop", when: "always", guard: "cwd" },
  { name: "gate approve", when: "always", guard: "cwd" },
  { name: "gate record", when: "always", guard: "cwd" },
  { name: "stale check", when: "always", guard: "cwd" },
  { name: "task set", when: "always", guard: "cwd" },
  { name: "defect add", when: "always", guard: "cwd" },
  { name: "defect close", when: "always", guard: "cwd" },
  { name: "defect reopen", when: "always", guard: "cwd" },
  { name: "archive", when: "unless-dry-run", guard: "cwd" },
  { name: "extract-features", when: "always", guard: "cwd" },
  { name: "serena-config", when: "always", guard: "serena" },
  { name: "serena-launch", when: "always", guard: "serena" },
  { name: "install copilot", when: "always", guard: "deny" },
];
