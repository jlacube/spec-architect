// OpenCode permission rules (C002-COMP-001, C002-COMP-003; C002-IF-001 §6.3, C002-IF-005 §2): the
// `permission` block of each Architect agent entry of `opencode.json`, in both enforcement modes.
//   native-permissions  `edit`: `"*": deny`, then `.sdd/*`: allow (C002-REQ-206). `bash`: `"*": deny`, the
//                       allow forms the generated agents send, then the deny forms a glob can name
//                       (C002-REQ-207), generated from the allowlist data that the bash guard core
//                       exports (src/hooks/guard-bash.ts, src/cli/writing-commands.ts), never from a
//                       copy of it (C002-CON-06). OpenCode evaluates the rules in order and the last
//                       matching rule wins, so the catch-all comes first and every deny after the allow
//                       it narrows; the maps are written in that order (canonicalJson keeps a Map's order).
//   sdd-mcp-server      `edit` and `bash` denied (C002-REQ-209); the agents write and run commands
//                       through the `sdd-files` and `sdd-shell` servers (C002-REQ-210).
// Both modes: `question` is `allow` for each agent whose source `tools` holds AskUserQuestion (the
// conductor) and `deny` for every other Architect agent (C002-REQ-217, C002-REQ-108); `webfetch` and
// `websearch` are `allow` where the agent's tools hold them; `external_directory`, `skill` and `lsp`
// come from the table's mode entry. Agents other than the ten get no rule (C002-REQ-208): the emitter
// writes `agent` entries for the Architect agents only and no top-level `permission`.
//
// The table's `permissions.native-permissions` lists must equal the generated lists, and its
// `permissions.sdd-mcp-server` must set `edit` and `bash` to `deny`; a table that says otherwise is
// ERR-GEN-004 (the table states what the package holds; tests read their expectations from it).
// `GLOB_GAPS` lists the guard rules a glob cannot follow (C002-IF-001 §6.3): C002-T-043 reads it with
// the replay outcome to select the OpenCode mode.
import { WRITING_COMMANDS } from "../../../src/cli/writing-commands.ts";
import { AST_GREP_RUN, GIT_OUTPUT_OPTIONS, GIT_READ, PIPE_ONLY_FORMS, RIPWIRE_FLAG_VERBS, RIPWIRE_VALUE_VERBS, VERSION_PROBES } from "../../../src/hooks/guard-bash.ts";
import { diagnostic, type Diagnostic } from "../diagnostics.ts";
import type { MappingTable, Mode } from "../tables.ts";
import type { TranslatedAgent } from "../translate/frontmatter.ts";

export type PermissionAction = "allow" | "ask" | "deny";
export interface PermissionRule {
  pattern: string;
  action: PermissionAction;
}

/** Package-relative boundary of the `edit` rules (C002-REQ-206, the boundary of C001-REQ-1103 without the memory folder). */
export const SDD_PATTERN = ".sdd/*";

/** ast-grep options that rewrite files: `ast-grep run *--pattern*` would also match them (C002-IF-001 §6.3). */
const AST_GREP_WRITE_OPTIONS = ["--rewrite*", "-r *", "-U*", "--update-all*", "-i*"];

const rule = (pattern: string, action: PermissionAction): PermissionRule => ({ pattern, action });

/** `edit` rules under native permission enforcement. */
export function editRules(): PermissionRule[] {
  return [rule("*", "deny"), rule(SDD_PATTERN, "allow")];
}

/**
 * `bash` rules under native permission enforcement, in evaluation order (C002-IF-001 §6.3): the
 * catch-all deny; `sdd *`; `git <read verb> *`; one rule per ripwire read verb; `ast-grep run
 * *--pattern*`; the version probes and the pipe-only entries as exact strings (`N` → `*`); then the
 * deny forms: git output options, ast-grep rewrite options, the `deny` rows of the writing-command
 * table (`sdd install *`), the Serena commands, then their `--user-data` forms allowed again, and
 * `sdd *--cwd*` last, after every `allow` rule of an `sdd` form. No rule for `node <path>/sdd.mjs`.
 */
export function bashRules(): PermissionRule[] {
  const out: PermissionRule[] = [rule("*", "deny"), rule("sdd *", "allow")];
  for (const verb of GIT_READ) out.push(rule(`git ${verb} *`, "allow"));
  for (const verb of RIPWIRE_VALUE_VERBS) out.push(rule(`ripwire *${verb}=*`, "allow"));
  for (const verb of RIPWIRE_FLAG_VERBS) out.push(rule(`ripwire *${verb}*`, "allow"));
  out.push(rule(`ast-grep ${AST_GREP_RUN.subcommand} *${AST_GREP_RUN.pattern[0]}*`, "allow"));
  for (const probe of VERSION_PROBES) out.push(rule(probe.join(" "), "allow"));
  for (const form of PIPE_ONLY_FORMS) out.push(rule(form.map((w) => (w === "N" ? "*" : w)).join(" "), "allow"));
  // A short option takes its value as the next word (`-o <file>`); a long one may carry it (`--output=x`).
  for (const o of GIT_OUTPUT_OPTIONS) out.push(rule(o.prefix || o.option.startsWith("--") ? `git * ${o.option}*` : `git * ${o.option} *`, "deny"));
  for (const o of AST_GREP_WRITE_OPTIONS) out.push(rule(`ast-grep * ${o}`, "deny"));
  const firstWords = (guard: string) => [...new Set(WRITING_COMMANDS.filter((w) => w.guard === guard).map((w) => w.name.split(" ")[0]!))];
  for (const w of firstWords("deny")) out.push(rule(`sdd ${w} *`, "deny"));
  const serena = firstWords("serena");
  for (const w of serena) out.push(rule(`sdd ${w} *`, "deny"));
  // The `--user-data` forms: `sdd serena-config --user-data`, `sdd serena-launch --user-data … -- …` (BG-381).
  for (const w of serena) out.push(rule(w === "serena-launch" ? `sdd ${w} --user-data *` : `sdd ${w} --user-data`, "allow"));
  out.push(rule("sdd *--cwd*", "deny"));
  return out;
}

/** One guard rule that a glob cannot follow (C002-IF-001 §6.3, gap table): a replay difference. */
export interface GlobGap {
  /** The guard rule. */
  rule: string;
  /** The glob form the rules use for it, or `none`. */
  glob: string;
  /** How the difference shows on OpenCode. */
  effect: "false allow" | "false deny" | "false allow and false deny";
  /** What the pattern cannot follow. */
  gap: string;
}

/** The glob gaps of the native rules (C002-IF-001 §6.3); any one of them selects `sdd-mcp-server` (C002-T-043). */
export const GLOB_GAPS: readonly GlobGap[] = [
  { rule: "path guard: links resolved through the real path (C001-REQ-1104)", glob: "none", effect: "false allow", gap: "a link under .sdd/ to a folder inside the project passes .sdd/* (S-07 F-2)" },
  { rule: "path guard on a folder path (PG-048)", glob: "none", effect: "false deny", gap: "write and edit read the target before the permission check and fail on a folder (S-07 F-4)" },
  { rule: "redirection >, >>, < is GUARD-BASH-002 (C001-REQ-1107)", glob: "none", effect: "false allow", gap: "OpenCode does not check redirection targets (S-07 F-3)" },
  { rule: "a trailing ; and $((…)) are GUARD-BASH-002", glob: "none", effect: "false allow", gap: "OpenCode allows `git status;` and `git log $((1+1))` (S-07 F-3)" },
  { rule: "pipe position: a pipe-only entry only after | (C001-IF-07 §3)", glob: "the pipe-only entries as exact patterns", effect: "false allow and false deny", gap: "each pipe part is evaluated alone; other spellings are not named (S-07 F-3)" },
  { rule: "script form node <path>/sdd.mjs (C002-REQ-503)", glob: "none", effect: "false deny", gap: "the generated agents call bare sdd" },
  { rule: "Serena data folder outside the repository (C002-REQ-517)", glob: "sdd serena-config|serena-launch denied, --user-data forms allowed", effect: "false deny", gap: "the repository is unknown when the package is generated" },
  { rule: "git output options", glob: "git * <option>* denied", effect: "false allow", gap: "spellings a pattern misses" },
  { rule: "--cwd of a writing sdd subcommand only inside the repository root (C002-REQ-521)", glob: "sdd *--cwd* denied last", effect: "false deny", gap: "the repository root is unknown when the package is generated" },
  { rule: "ripwire: one read verb, bounded flags only (C001-IF-14 §2)", glob: "one allow rule per read verb", effect: "false allow", gap: "two read verbs or another flag still match" },
  { rule: "ast-grep run --pattern without rewrite flags", glob: "ast-grep run *--pattern* allowed, rewrite options denied", effect: "false allow", gap: "spellings a pattern misses" },
  { rule: "PowerShell dialect (C001-IF-07 §3)", glob: "none", effect: "false allow and false deny", gap: "OpenCode has one shell tool; the rules follow the Bash rows" },
];

/** The glob gaps of a mode: those of the native rules, none under sdd MCP server enforcement (the guard cores decide). */
export function globGaps(mode: Mode): readonly GlobGap[] {
  return mode === "native-permissions" ? GLOB_GAPS : [];
}

const sameRules = (a: unknown, b: readonly PermissionRule[]) =>
  Array.isArray(a) && a.length === b.length && a.every((r, i) => (r as PermissionRule).pattern === b[i]!.pattern && (r as PermissionRule).action === b[i]!.action);

const describe = (v: unknown) => (Array.isArray(v) ? `[${v.map((r) => `"${(r as PermissionRule).pattern}": ${(r as PermissionRule).action}`).join(", ")}]` : JSON.stringify(v));

/** ERR-GEN-004 for a table whose permission entries disagree with the generated rules or with C002-IF-001 §5. */
export function permissionTableDiagnostics(table: MappingTable, mode: Mode): Diagnostic[] {
  const file = `targets/${table.target}.json`;
  const out: Diagnostic[] = [];
  const err = (pointer: string, message: string) => out.push(diagnostic("ERR-GEN-004", `${file}: ${pointer}: ${message}`, { file, target: table.target }));
  const set = table.permissions?.[mode as "native-permissions" | "sdd-mcp-server"];
  if (set === undefined) {
    err(`/permissions/${mode}`, "the OpenCode table has no permission rules for the mode");
    return out;
  }
  const at = `/permissions/${mode}`;
  if (mode === "native-permissions") {
    for (const [key, rules] of [["edit", editRules()], ["bash", bashRules()]] as const)
      if (!sameRules(set[key], rules)) err(`${at}/${key}`, `differs from the rules generated from the guard allowlist (C002-IF-001 §6.3): expected ${describe(rules)}`);
  } else for (const key of ["edit", "bash"]) if (set[key] !== "deny") err(`${at}/${key}`, `must be "deny" under sdd MCP server enforcement (C002-REQ-209)`);
  if (set["question"] !== undefined && set["question"] !== "deny") err(`${at}/question`, `must be "deny" or absent; the question rule is written per agent (C002-IF-001 §5, C002-REQ-217)`);
  return out;
}

const asMap = (rules: readonly PermissionRule[]) => new Map(rules.map((r) => [r.pattern, r.action]));

/**
 * The `permission` block of one Architect agent entry: the mode's `edit` and `bash`, the table's other
 * keys, the agent's `question`, `webfetch` and `websearch` rules and its agent-start rule `task`.
 */
export function agentPermission(table: MappingTable, mode: Mode, agent: TranslatedAgent): Record<string, unknown> {
  const fm = agent.frontmatter;
  const set = table.permissions?.[mode as "native-permissions" | "sdd-mcp-server"] ?? {};
  const out: Record<string, unknown> = {};
  for (const key of ["external_directory", "skill", "lsp"]) if (typeof set[key] === "string") out[key] = set[key];
  if (mode === "native-permissions") {
    out["edit"] = asMap(editRules());
    out["bash"] = asMap(bashRules());
  } else {
    out["edit"] = "deny";
    out["bash"] = "deny";
  }
  out["question"] = fm.asks ? "allow" : "deny";
  for (const tool of ["webfetch", "websearch"]) if (fm.tools.includes(tool)) out[tool] = "allow";
  if (fm.agentStart.style === "permission-task") out["task"] = fm.agentStart.task;
  return out;
}
