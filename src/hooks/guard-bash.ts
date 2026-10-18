// `sdd guard-bash` (C001-IF-07 §2–3, C001-REQ-1106, C001-REQ-1107): the PreToolUse hook on Bash and
// PowerShell. An Architect agent (`agent_type` = `architect:sdd-*`) may run only the allowlisted read
// commands of C001-IF-07 §3; every other caller is allowed at once.
//
// The command is split by a quote-aware tokeniser. Outside single quotes, command substitution (`$(`,
// backticks) is denied; outside any quotes, `;`, `&`, `||`, `>`, `<`, parentheses, braces (PowerShell)
// and line breaks are denied (GUARD-BASH-002). `|` splits segments: the first must match an entry, the
// others must be pipe-only entries (head, tail, wc, sort, uniq). PowerShell allows only the sdd CLI
// (`sdd …` or `node <path>/sdd.mjs …`, C002-REQ-503) and the version probes, without pipes. A writing
// sdd subcommand (src/cli/writing-commands.ts) takes `--cwd` only inside the repository root
// (C002-REQ-521, C002-IF-008 §1.2); `install` is denied in every form (C002-REQ-325). `serena-config` and `serena-launch` take only `--user-data` or a
// data folder outside the repository root (C002-REQ-517, C002-IF-008 §1.1). When in doubt the guard
// denies (fail closed).
//
// Environment: `decideBash` is not a pure function of its hook input. For the literal
// `${CLAUDE_PLUGIN_DATA}` of a Serena command (Bash dialect) it reads the variable CLAUDE_PLUGIN_DATA of
// its own process (unset or empty: denied), and it reads the file system (repository root, real paths).
import { findWorkspace } from "../workspace/find.ts";
import { WRITING_COMMANDS, type WritingCommand } from "../cli/writing-commands.ts";
import { ambiguousWindowsPath, isCommand, normalisePath, pathKey, realPath } from "../io/paths.ts";
import { findRepositoryRoot, locateInRepository } from "../io/repo-root.ts";
import { isArchitectAgent, type HookInput } from "./input.ts";

export const RULE_ALLOWLIST = "GUARD-BASH-001";
export const RULE_COMPOUND = "GUARD-BASH-002";
// C002-IF-008 §1 deny summary. The parenthesis of the sdd CLI entry holds the install part of
// C002-REQ-325, the Serena part of C002-REQ-517 and the --cwd part of C002-REQ-521.
const ALLOWED =
  "sdd … or node <path>/sdd.mjs … (not install; serena-config and serena-launch only with --user-data or a data folder outside the repository; --cwd of a writing subcommand only with a folder inside the repository), ripwire read verbs, ast-grep run --pattern, git log|show|diff|blame|ls-files|rev-parse|status|grep, version probes (node -v, node --version, git --version, claude --version, serena --version, ast-grep --version, uv --version); head -n N, tail -n N, wc -l, sort, uniq only after |";

export type BashDecision = { allow: true } | { allow: false; message: string };
export type Dialect = "bash" | "powershell";

/** The dialect `decideBash` applies to a tool call: PowerShell syntax for `PowerShell`, Bash otherwise. */
export function dialectOf(toolName: string): Dialect {
  return toolName === "PowerShell" ? "powershell" : "bash";
}

/** The hook tool name whose dialect is `dialect` (the inverse of `dialectOf`, C002-IF-002 §5.2 step 2). */
export function toolOfDialect(dialect: Dialect): "Bash" | "PowerShell" {
  return dialect === "powershell" ? "PowerShell" : "Bash";
}

/** Words of each pipe segment, or the reason the command is compound/unsafe. */
export function tokenise(cmd: string, dialect: Dialect): { segments: { words: string[]; raw: string[] }[] } | { error: string } {
  const segments: { words: string[]; raw: string[] }[] = [];
  let words: string[] = [];
  let raw: string[] = [];
  let word: string | null = null;
  let rawWord = "";
  const push = () => {
    if (word !== null) {
      words.push(word);
      raw.push(rawWord);
    }
    word = null;
    rawWord = "";
  };
  const add = (s: string, r = s) => {
    word = (word ?? "") + s;
    rawWord += r;
  };
  let i = 0;
  while (i < cmd.length) {
    const c = cmd[i]!;
    const next = cmd[i + 1];
    if (c === "'") {
      const end = cmd.indexOf("'", i + 1);
      if (end < 0) return { error: "unterminated quote" };
      add(cmd.slice(i + 1, end), cmd.slice(i, end + 1));
      i = end + 1;
      // PowerShell writes a single quote inside single quotes as ''.
      if (dialect === "powershell" && cmd[i] === "'") add("'", "");
      continue;
    }
    if (c === '"') {
      let j = i + 1;
      let s = "";
      for (;;) {
        if (j >= cmd.length) return { error: "unterminated quote" };
        const d = cmd[j]!;
        if (d === '"') break;
        if (d === "`") return { error: "command substitution (backtick)" };
        if (d === "$" && cmd[j + 1] === "(") return { error: "command substitution ($()" };
        if (dialect === "bash" && d === "\\" && j + 1 < cmd.length && '"\\$`'.includes(cmd[j + 1]!)) {
          s += cmd[j + 1];
          j += 2;
          continue;
        }
        s += d;
        j++;
      }
      add(s, cmd.slice(i, j + 1));
      i = j + 1;
      continue;
    }
    if (c === "`") return { error: "command substitution (backtick)" };
    if (c === "$" && next === "(") return { error: "command substitution ($()" };
    if (c === "\\" && dialect === "bash") {
      if (next === undefined || next === "\n" || next === "\r") return { error: "line continuation" };
      add(next, c + next);
      i += 2;
      continue;
    }
    if (c === ";") return { error: "chained command (;)" };
    if (c === "&") return { error: next === "&" ? "chained command (&&)" : "background or call operator (&)" };
    if (c === ">") return { error: "output redirection (>)" };
    if (c === "<") return { error: "input redirection (<)" };
    if (c === "\n" || c === "\r") return { error: "line break" };
    if (c === "(" || c === ")") return { error: "subshell or subexpression" };
    if (dialect === "powershell" && (c === "{" || c === "}" || (c === "@" && next === "("))) return { error: "script block or subexpression" };
    if (c === "|") {
      if (next === "|") return { error: "chained command (||)" };
      if (dialect === "powershell") return { error: "pipe in PowerShell" };
      push();
      if (words.length === 0) return { error: "empty pipe segment" };
      segments.push({ words, raw });
      words = [];
      raw = [];
      i++;
      continue;
    }
    if (c === " " || c === "\t") {
      push();
      i++;
      continue;
    }
    add(c);
    i++;
  }
  push();
  if (words.length === 0) return { error: segments.length > 0 ? "empty pipe segment" : "empty command" };
  segments.push({ words, raw });
  return { segments };
}

const exe = isCommand;
const num = (s: string | undefined) => s !== undefined && /^\d+$/.test(s);

/** `node <path>/sdd.mjs …`; the script must not lie in the agent-writable `.sdd/` folder. */
function sddCli(words: string[], raw: string[], cwd: string): boolean {
  if (!exe(words[0], "node") || words.length < 2) return false;
  const script = words[1]!;
  // The plugin's own spelling (agent bodies): Claude Code sets the variable; agents cannot.
  if (/^"?\$\{CLAUDE_PLUGIN_ROOT\}\/scripts\/sdd\.mjs"?$/.test(raw[1]!)) return true;
  if (/[$*?[\]]/.test(raw[1]!)) return false;
  if (script.split(/[\\/]/).pop() !== "sdd.mjs") return false;
  const repo = findWorkspace(normalisePath(cwd)) ?? cwd;
  const sdd = pathKey(normalisePath(".sdd", { cwd: repo }));
  const inside = (p: string) => pathKey(p) === sdd || pathKey(p).startsWith(sdd + "/");
  const lexical = normalisePath(script, { cwd });
  return !inside(lexical) && !inside(realPath(lexical)) && !pathKey(realPath(lexical)).startsWith(pathKey(realPath(sdd)) + "/");
}

/** `sdd …` with `sdd` as the whole first word (C002-REQ-503): the sdd that PATH resolves, as for git. */
function bareSdd(words: string[]): boolean {
  return words[0] === "sdd";
}

/** The sdd CLI entry in either form (C002-IF-008 §1). */
function sddEntry(words: string[], raw: string[], cwd: string): boolean {
  return bareSdd(words) || sddCli(words, raw, cwd);
}

/** The words after the CLI prefix (`sdd`, or `node <path>/sdd.mjs`) of an sdd CLI entry. */
function cliArgs(words: string[]): string[] {
  return bareSdd(words) ? words.slice(1) : words.slice(2);
}

// Groups whose second word names the subcommand, as the CLI's own lookup (src/cli/run.ts findCommand).
const WRITING_GROUP_NAMES = new Set(WRITING_COMMANDS.filter((w) => w.name.includes(" ")).map((w) => w.name.split(" ")[0]!));

/**
 * The row of the writing-command table that `args` (the words after the CLI prefix, up to the first
 * `--`) runs, or null (C002-IF-008 §1.2 "Writing command"). The CLI takes its subcommand from the first
 * word, with the second for a group; a first word `install` is the `install copilot` row whatever follows.
 */
function writingCommand(args: string[]): WritingCommand | null {
  const [first, second] = args;
  if (first === undefined) return null;
  const row = WRITING_GROUP_NAMES.has(first)
    ? WRITING_COMMANDS.find((w) => w.name === `${first} ${second ?? ""}` || (w.guard === "deny" && w.name.split(" ")[0] === first))
    : WRITING_COMMANDS.find((w) => w.name === first);
  if (row === undefined) return null;
  if (row.when === "with-write") return args.includes("--write") ? row : null;
  if (row.when === "unless-dry-run") return args.includes("--dry-run") ? null : row;
  return row;
}

const SERENA_COMMANDS = ["serena-config", "serena-launch"];
const PLUGIN_DATA_LITERAL = /^(\$\{CLAUDE_PLUGIN_DATA\}|"\$\{CLAUDE_PLUGIN_DATA\}")$/;

/** A folder word the guard cannot resolve: `~…`, a shell expansion or wildcard, an ambiguous Windows path. */
function unresolvable(folder: string): boolean {
  return folder === "" || folder.startsWith("~") || /[$%`*?[\]]/.test(folder) || ambiguousWindowsPath(folder) !== null;
}

/**
 * The Serena rule of C002-IF-008 §1.1 (C002-REQ-517): a command whose words before the first `--`
 * name `serena-config` or `serena-launch` is allowed only with exactly one data-folder argument
 * (`--user-data`, the literal `${CLAUDE_PLUGIN_DATA}` in the Bash dialect, or a folder outside the
 * repository root, as written and after link resolution) and, for `serena-launch`, `--read-only`.
 * The literal is resolved from this process's own environment (unset or empty: denied). Returns the
 * deny reason, or null when the command is no Serena command or passes.
 */
function serenaViolation(words: string[], raw: string[], cwd: string, dialect: Dialect): string | null {
  const allWords = cliArgs(words);
  const allRaw = bareSdd(words) ? raw.slice(1) : raw.slice(2);
  const dashdash = allWords.indexOf("--");
  const args = dashdash < 0 ? allWords : allWords.slice(0, dashdash);
  const sub = args.find((w) => SERENA_COMMANDS.includes(w));
  if (sub === undefined) return null;
  const cannot = (word: string) => `sdd ${sub} with an argument the guard cannot resolve (${word})`;
  let subSeen = false;
  let readOnlySeen = false;
  let folder: { word: string; raw: string } | null = null;
  for (let i = 0; i < args.length; i++) {
    const w = args[i]!;
    if (w === sub && !subSeen) subSeen = true;
    else if (w === "--read-only" && sub === "serena-launch" && !readOnlySeen) readOnlySeen = true;
    else if (folder === null && (w === "--user-data" || !w.startsWith("-"))) folder = { word: w, raw: allRaw[i]! };
    else return cannot(w);
  }
  if (folder === null) return cannot("no data folder");
  if (folder.word === "--user-data") return null;
  let target = folder.word;
  if (dialect === "bash" && PLUGIN_DATA_LITERAL.test(folder.raw)) {
    const value = process.env["CLAUDE_PLUGIN_DATA"];
    if (value === undefined || value === "") return cannot(folder.word);
    target = value;
  } else if (unresolvable(target)) return cannot(target);
  if (ambiguousWindowsPath(target) !== null) return cannot(target);
  const at = locateInRepository(findRepositoryRoot(cwd), target, cwd);
  if (at.insideWritten) return `sdd ${sub} with a data folder inside the repository (${at.written})`;
  if (at.insideReal) return `sdd ${sub} with a data folder inside the repository (${at.real})`;
  return null;
}

/** The words after the CLI prefix up to the first `--`: the CLI's own subcommand and options. */
function subcommandArgs(words: string[]): string[] {
  const all = cliArgs(words);
  const dashdash = all.indexOf("--");
  return dashdash < 0 ? all : all.slice(0, dashdash);
}

/**
 * The deny rule of C002-IF-008 §1.2 (C002-REQ-325): a row marked `deny` (`install copilot`; a first
 * word `install` selects it whatever follows) is denied in every form. A later word `install`
 * (`sdd lint install`) is no subcommand. Returns the deny reason, or null.
 */
function deniedCommand(words: string[]): string | null {
  return writingCommand(subcommandArgs(words))?.guard === "deny" ? "sdd install writes outside .sdd/; P-03 runs it in their own terminal" : null;
}

/** Every `--cwd` folder word among `args` (`--cwd <dir>` or `--cwd=<dir>`); null for a `--cwd` without a word. */
function cwdWords(args: string[]): (string | null)[] {
  const found: (string | null)[] = [];
  args.forEach((w, i) => {
    if (w === "--cwd") found.push(args[i + 1] ?? null);
    else if (w.startsWith("--cwd=")) found.push(w.slice("--cwd=".length));
  });
  return found;
}

/**
 * The `--cwd` rule of C002-IF-008 §1.2 (C002-REQ-521): a writing command may carry `--cwd` only with a
 * folder that resolves, as written and after link resolution, to the repository root of §1.1 rule 3
 * or a folder under it. Returns the deny reason, or null when the command passes.
 */
function cwdViolation(words: string[], cwd: string): string | null {
  const args = subcommandArgs(words);
  const row = writingCommand(args);
  if (row === null || row.guard !== "cwd") return null;
  const root = findRepositoryRoot(cwd);
  for (const folder of cwdWords(args)) {
    if (folder === null || unresolvable(folder))
      return `sdd ${row.name} with a --cwd the guard cannot resolve (${folder ?? "--cwd"})`;
    const at = locateInRepository(root, folder, cwd);
    if (!at.insideWritten) return `sdd ${row.name} with --cwd outside the repository (${at.written})`;
    if (!at.insideReal) return `sdd ${row.name} with --cwd outside the repository (${at.real})`;
  }
  return null;
}

// Exact word count: `node --version --eval=x` (BG-166) and `node -v -e x` (BG-160) stay denied.
export const VERSION_PROBES: readonly (readonly string[])[] = [["node", "-v"], ["node", "--version"], ["git", "--version"], ["claude", "--version"], ["serena", "--version"], ["ast-grep", "--version"], ["uv", "--version"]];
function versionProbe(words: string[]): boolean {
  return VERSION_PROBES.some((p) => p.length === words.length && exe(words[0], p[0]!) && words[1] === p[1]);
}

export const RIPWIRE_VALUE_VERBS: readonly string[] = ["--for", "--pack-task", "--callers", "--uses", "--impact", "--expand"];
export const RIPWIRE_FLAG_VERBS: readonly string[] = ["--test-gate", "--situ", "--hotspots", "--quality-panel", "--quality-delta", "--pack-signatures", "--doctor", "--help-task", "--version"];
const RIPWIRE_BOUNDS = ["--token-budget", "--max-tokens", "--limit", "--offset", "--top-k"];

/** `ripwire [<path>] <one read verb> [bounding flags] [--json]` (C001-IF-14 §2). */
function ripwire(words: string[]): boolean {
  if (!exe(words[0], "ripwire")) return false;
  let verbs = 0;
  let paths = 0;
  for (const w of words.slice(1)) {
    const eq = w.indexOf("=");
    const name = eq < 0 ? w : w.slice(0, eq);
    const value = eq < 0 ? undefined : w.slice(eq + 1);
    if (RIPWIRE_VALUE_VERBS.includes(name) && value) verbs++;
    else if (RIPWIRE_FLAG_VERBS.includes(w)) verbs++;
    else if (RIPWIRE_BOUNDS.includes(name) && num(value)) continue;
    else if (w === "--json") continue;
    else if (!w.startsWith("-") && w !== "") paths++;
    else return false;
  }
  return verbs === 1 && paths <= 1;
}

/** The ast-grep entry: its subcommand and the pattern option it needs (long form first). */
export const AST_GREP_RUN = { subcommand: "run", pattern: ["--pattern", "-p"] } as const;

/** `ast-grep run --pattern <p> [--lang <l>] [<paths>] [--json]`; rewriting flags are not on the list. */
function astGrep(words: string[]): boolean {
  if (!exe(words[0], "ast-grep") || words[1] !== AST_GREP_RUN.subcommand) return false;
  let pattern = 0;
  for (let i = 2; i < words.length; i++) {
    const w = words[i]!;
    if ((AST_GREP_RUN.pattern as readonly string[]).includes(w)) {
      if (words[i + 1] === undefined) return false;
      pattern++;
      i++;
    } else if (w.startsWith("--pattern=")) pattern++;
    else if (w === "--lang" || w === "-l") {
      if (words[i + 1] === undefined || words[i + 1]!.startsWith("-")) return false;
      i++;
    } else if (w.startsWith("--lang=")) continue;
    else if (w === "--json" || /^--json=(pretty|stream|compact)$/.test(w)) continue;
    else if (w.startsWith("-")) return false;
  }
  return pattern === 1;
}

export const GIT_READ: readonly string[] = ["log", "show", "diff", "blame", "ls-files", "rev-parse", "status", "grep"];
/** Git options that write files or run a pager or external command: an exact word, or a word prefix. */
export const GIT_OUTPUT_OPTIONS: readonly { readonly option: string; readonly prefix: boolean }[] = [
  { option: "-o", prefix: false },
  { option: "--output", prefix: true },
  { option: "-O", prefix: true },
  { option: "--open-files-in-pager", prefix: true },
  { option: "--ext-diff", prefix: false },
];
/** `git <read verb> …` without output files or pager/external commands. */
function gitRead(words: string[]): boolean {
  if (!exe(words[0], "git") || !GIT_READ.includes(words[1] ?? "")) return false;
  return words.slice(2).every((w) => !GIT_OUTPUT_OPTIONS.some((o) => (o.prefix ? w.startsWith(o.option) : w === o.option)));
}

/**
 * The canonical spelling of each pipe-only entry (`N` stands for a number), as the allow summary names
 * them; `pipeOnly` also accepts the other spellings its comment lists.
 */
export const PIPE_ONLY_FORMS: readonly (readonly string[])[] = [["head", "-n", "N"], ["tail", "-n", "N"], ["wc", "-l"], ["sort"], ["uniq"]];

/** Pipe-only entries: `head -n N`, `tail -n N` (also `-N`, `-nN`), `wc -l`, `sort`, `uniq`. */
function pipeOnly(words: string[]): boolean {
  const [cmd, ...args] = words;
  if (cmd === "head" || cmd === "tail") {
    if (args.length === 0) return true;
    if (args.length === 1) return /^-n?\d+$/.test(args[0]!);
    return args.length === 2 && args[0] === "-n" && num(args[1]);
  }
  if (cmd === "wc") return args.length === 1 && args[0] === "-l";
  if (cmd === "sort") return args.every((a) => ["-r", "-n", "-u", "-f"].includes(a));
  if (cmd === "uniq") return args.every((a) => ["-c", "-d", "-u"].includes(a));
  return false;
}

function deny(rule: string, tool: string, cmd: string, reason: string): BashDecision {
  const shown = cmd.length > 200 ? cmd.slice(0, 200) + "…" : cmd;
  return { allow: false, message: `${rule}: ${tool} on ${JSON.stringify(shown)} denied — ${reason}. Allowed: ${ALLOWED}.` };
}

export function decideBash(input: HookInput | null): BashDecision {
  if (input === null) return deny(RULE_ALLOWLIST, "tool call", "", "the hook input is not a JSON object");
  if (!isArchitectAgent(input)) return { allow: true };
  const tool = input.tool_name;
  if (tool !== "Bash" && tool !== "PowerShell") return { allow: true };
  const cmd = input.tool_input?.["command"];
  if (typeof cmd !== "string" || cmd.trim() === "") return deny(RULE_ALLOWLIST, tool, "", "the tool input has no command");
  const cwd = typeof input.cwd === "string" && input.cwd !== "" ? input.cwd : null;
  if (cwd === null) return deny(RULE_ALLOWLIST, tool, cmd, "the hook input has no cwd");
  const dialect = dialectOf(tool);
  const t = tokenise(cmd.trim(), dialect);
  if ("error" in t) return deny(RULE_COMPOUND, tool, cmd, t.error);
  const [first, ...rest] = t.segments;
  const entry = sddEntry(first!.words, first!.raw, cwd);
  const allowed = dialect === "powershell" ? entry || versionProbe(first!.words) : entry || versionProbe(first!.words) || ripwire(first!.words) || astGrep(first!.words) || gitRead(first!.words);
  if (!allowed) {
    const reason = pipeOnly(first!.words) && rest.length === 0 ? `${first!.words[0]} is allowed only after |` : `${first!.words[0]} … is not on the allowlist`;
    return deny(rest.length > 0 ? RULE_COMPOUND : RULE_ALLOWLIST, tool, cmd, reason);
  }
  const bad = rest.find((s) => !pipeOnly(s.words));
  if (bad) return deny(RULE_COMPOUND, tool, cmd, `piped segment "${bad.words.join(" ")}" is not a pipe-only entry`);
  if (entry) {
    const violation = deniedCommand(first!.words) ?? serenaViolation(first!.words, first!.raw, cwd, dialect) ?? cwdViolation(first!.words, cwd);
    if (violation !== null) return deny(RULE_ALLOWLIST, tool, cmd, violation);
  }
  return { allow: true };
}
