// Corpus replay suite (C002-COMP-008, C002-T-040): the adapter interface between the mechanism-
// independent suite and one enforcement mechanism, and the stub adapter the suite's own tests use.
//
// The suite gives an adapter each replayed case as a ReplayInput: the corpus case, the caller that
// plays it (C002-IF-009 §2.2), its working folder and path or command with the placeholders resolved,
// its dialect, and whether it is fed as a malformed call (raw standard input, or a C002-REQ-630 case).
// The adapter maps it to the mechanism's own input (§2.2 table) and reads the decision (§2.3). The
// real adapters are C002-T-041 (`sdd-mcp-server`, `copilot-hooks`) and C002-T-042
// (`opencode-permissions`, through the scripted-model driver of C002-ADR-005).
import { decideBash } from "../../src/hooks/guard-bash.ts";
import { decidePath } from "../../src/hooks/guard-path.ts";
import { parseHookInput } from "../../src/hooks/input.ts";
import { type Dialect, type EnvStub, withEnv } from "../guards/fixture.ts";
import { ADOPTER_AGENT, type AnyCase, type CorpusName, type Decision, type Mechanism } from "./expect.ts";

export type Actual = Decision | "error";
export type Target = "opencode" | "copilot";
/** How a case is fed: as its own input, or as a malformed call (§2.2 last two rows). */
export type Malformed = false | "raw-stdin" | "missing-field";

/** The replay fixture (C002-IF-009 §2.2): the corpus layout in a temporary folder. */
export interface ReplayFixture {
  base: string;
  /** `{repo}`: the repository root (`.git` and `.sdd/`), forward slashes. */
  repo: string;
  /** Host capabilities the fixture could provide (`file-symlink` when its file symbolic links exist). */
  capabilities: Set<string>;
  /** Placeholders of the path corpus (`{repo}`, `{outside}`, `{short:…}`, …). */
  resolvePath(text: string): string;
  /** Placeholders of the shell corpus (`{sdd}`, `{repo}`). */
  resolveShell(text: string): string;
  cleanup(): void;
}

export interface ReplayInput {
  id: string;
  corpus: CorpusName;
  category: string;
  /** The corpus case as written. */
  case: AnyCase;
  /** Corpus tool name (`Write`, `Bash`, `PowerShell`, …); null when the case has no tool name. */
  tool: string | null;
  /** The generated agent that plays the case (`sdd-spec-writer`), or `adopter-agent`. */
  caller: string;
  /** The case's working folder resolved: `{repo}` when the case has none; null or "" as the case gives it. */
  cwd: string | null;
  /** Path corpus: the target path, placeholders resolved when it is a string, else as written. */
  path?: unknown;
  /** Path corpus: the tool_input field of the path (default file_path). */
  field?: string;
  /** Shell corpus: the command, placeholders resolved when it is a string, else as written. */
  command?: unknown;
  /** Shell dialect of the case's tool (shell corpus; `bash` for path cases). */
  dialect: Dialect;
  /** Raw standard input of a raw-stdin case, unchanged. */
  stdin?: string;
  malformed: Malformed;
  /** Environment stub of the case, applied while it is decided (placeholders resolved by `resolve`). */
  env?: EnvStub;
  resolve(text: string): string;
}

export interface AdapterDecision {
  actual: Actual;
  /** The host or server tool the case was fed as (`write_file`, `edit`, the Copilot edit tool, …). */
  tool: string;
  /** Overrides the case's dialect in `fed_as` when the mechanism decided another one. */
  dialect?: Dialect;
  detail?: string;
}

export interface ReplayAdapter {
  /** The mechanism the report is written for. */
  readonly mechanism: Mechanism;
  /** Default target of the report (`--target` overrides it). */
  readonly target: Target;
  /** Name shown by the runner (`stub` for the stub adapter, else the mechanism). */
  readonly name: string;
  /** True for the stub: its report never goes under docs/releases/. */
  readonly stub?: boolean;
  /** Host versions recorded in the report (`opencode` for opencode-permissions, C002-T-042 step 4). */
  hostVersions?(): Record<string, string> | undefined;
  /**
   * False when the package does not grant the generated agent the tool the corpus tool maps to; the
   * conductor then plays the case (§2.2). Absent: every agent is granted every tool.
   */
  grants?(agent: string, corpusTool: string): boolean;
  setup(fx: ReplayFixture): Promise<void>;
  decide(input: ReplayInput): Promise<AdapterDecision>;
  teardown(): Promise<void>;
}

/** An absolute path (drive, UNC or root); such a case path is used as it is (§2.2). */
export function isAbsolutePath(p: string): boolean {
  return /^[A-Za-z]:[\\/]/.test(p) || /^[\\/]/.test(p);
}

/**
 * The case's path joined to its cwd without normalisation (§2.2: opencode-permissions and
 * sdd-mcp-server take no working folder per call): PG-134 → `{repo}/src/.sdd/a.md`.
 */
export function joinedPath(input: ReplayInput): unknown {
  const p = input.path;
  if (typeof p !== "string" || p === "" || isAbsolutePath(p) || input.cwd === null || input.cwd === "") return p;
  return `${input.cwd.replace(/[\\/]+$/, "")}/${p}`;
}

/** Seeds of the stub adapter, standing in for the seeded builds of C002-TS-629 and C002-TS-645. */
export interface StubSeed {
  /** Allow every write under `.claude/agent-memory/` (C002-TS-629). */
  allowMemory?: boolean;
  /** Allow a write call whose required arguments are missing (C002-TS-645). */
  allowMalformedWrite?: boolean;
}

export interface StubAdapter extends ReplayAdapter {
  /** Every input the stub received, in order. */
  readonly calls: ReplayInput[];
}

/** The stub's tool name for a case: the sdd MCP server's names of the §2.2 table. */
function stubTool(input: ReplayInput): string {
  if (input.corpus === "shell") return input.tool === "Bash" || input.tool === "PowerShell" || input.tool === null ? "run_command" : input.tool.toLowerCase();
  switch (input.tool) {
    case "Edit":
    case "MultiEdit":
      return "replace_text";
    case "Bash":
      return "run_command";
    case "Read":
    case "Glob":
    case "Grep":
      return input.tool.toLowerCase();
    default:
      return "write_file";
  }
}

/**
 * Stub adapter: decides each case with the guard cores in process, as a generated mechanism would
 * (memory folder off, C002-IF-008 §5; a malformed call refused, C002-CON-08). It reports for the
 * mechanism it emulates, never under docs/releases/.
 */
export function createStubAdapter(opts: { emulate?: Mechanism; target?: Target; seed?: StubSeed } = {}): StubAdapter {
  const seed = opts.seed ?? {};
  const calls: ReplayInput[] = [];
  return {
    mechanism: opts.emulate ?? "sdd-mcp-server",
    target: opts.target ?? "opencode",
    name: "stub",
    stub: true,
    calls,
    async setup() {},
    async teardown() {},
    async decide(input) {
      calls.push(input);
      const tool = stubTool(input);
      if (input.malformed === "missing-field") return { actual: seed.allowMalformedWrite && tool === "write_file" ? "allow" : "deny", tool };
      if (seed.allowMemory && typeof input.path === "string" && /[\\/]\.claude[\\/]agent-memory[\\/]/i.test(joinedPath(input) as string)) return { actual: "allow", tool };
      const agentType = input.caller === ADOPTER_AGENT ? ADOPTER_AGENT : `architect:${input.caller}`;
      let stdin = input.stdin;
      if (stdin === undefined) {
        const doc: Record<string, unknown> = { hook_event_name: "PreToolUse", agent_type: agentType, tool_name: input.tool };
        if (input.cwd !== null) doc["cwd"] = input.cwd;
        doc["tool_input"] =
          input.corpus === "shell"
            ? { command: input.command }
            : input.path === null
              ? undefined
              : { [input.field ?? "file_path"]: input.path, content: "x" };
        stdin = JSON.stringify(doc);
      }
      const decided = withEnv(input.env, input.resolve, () =>
        input.corpus === "shell" ? decideBash(parseHookInput(stdin)) : decidePath(parseHookInput(stdin), { memoryFolder: false }),
      );
      return { actual: decided.allow ? "allow" : "deny", tool, ...(decided.allow ? {} : { detail: decided.message }) };
    },
  };
}
