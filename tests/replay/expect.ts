// Corpus replay suite (C002-COMP-008, C002-T-040): applicability and expected decision of a corpus case
// per mechanism, in the rule order of C002-IF-009 §2.1, and the caller that plays it (§2.2).
//
//   1. category identity, mechanism other than opencode-permissions  → not applicable (C002-REQ-626)
//   2. no cwd (null), empty cwd ("") or no tool name (null)            → deny, malformed call (C002-REQ-630)
//   3. identity, caller an architect:sdd-* name none of the ten        → allow (C002-REQ-632; OpenCode only,
//                                                                         the other mechanisms stop at rule 1)
//   4. category memory                                                  → deny (C002-REQ-625)
//   5. shell corpus, a write tool (Write, Edit, MultiEdit, NotebookEdit) → deny on every mechanism
//                                                                         (C001-REQ-1103; D-014 item 1)
//   6. shell corpus, Bash, a Serena command whose data-folder argument  → deny on sdd-mcp-server only
//      is the literal ${CLAUDE_PLUGIN_DATA}, bare or double-quoted        (C002-REQ-517; D-014 item 4)
//   7. path corpus, category cwd, a cwd through the link {repolink}     → deny on sdd-mcp-server only
//                                                                         (C002-REQ-401; D-014 item 2)
//   8. every other case                                                 → the corpus value (corpus), per
//                                                                         platform of the replay host
// Platform rule (§2.1; defect D-018 item 2, critic CR-60, CR-61, CR-66): a case that falls to rule 8 and
// whose `platforms` list (a non-empty list of `win32` and `posix`) does not name the replay host's
// platform is not applicable, rule `platforms`, on every mechanism; a `platforms` field that is not such
// a list excludes nothing (fail-closed). The rows above rule 8 keep their expectation on every host.
// A case that requires a host capability (C002-REQ-633) is never a malformed call and, apart from the
// platform rule, which comes first, never not applicable: rule 2 does not apply to it, and the other
// rules give its expectation as for any other case.
import type { BashCase, CorpusCase } from "../guards/fixture.ts";

export type Mechanism = "opencode-permissions" | "sdd-mcp-server" | "copilot-hooks";
export const MECHANISMS: readonly Mechanism[] = ["opencode-permissions", "sdd-mcp-server", "copilot-hooks"];
export type Platform = "win32" | "posix";
export type Decision = "allow" | "deny";
export type ExpectedSource = "corpus" | "C002-REQ-625" | "C002-REQ-630" | "C002-REQ-632" | "C001-REQ-1103" | "C002-REQ-401" | "C002-REQ-517";
export type CorpusName = "path" | "shell";
export type AnyCase = CorpusCase | BashCase;

/** The ten Architect agents, by their generated names (C002-IF-009 §2.2). */
export const ARCHITECT_AGENTS: readonly string[] = [
  "sdd-conductor", "sdd-researcher", "sdd-cartographer", "sdd-options-analyst", "sdd-spec-writer",
  "sdd-test-designer", "sdd-architect", "sdd-planner", "sdd-critic", "sdd-auditor",
];
export const CONDUCTOR = "sdd-conductor";
/** The replay fixture's adopter agent: none of the ten, no rule of the target package (C002-REQ-626). */
export const ADOPTER_AGENT = "adopter-agent";

/** The rule of a not-applicable entry (§2.1): the identity row, or the platform rule. */
export type NotApplicableRule = "C002-REQ-626" | "platforms";

export type Expectation = { applicable: false; rule: NotApplicableRule } | { applicable: true; expected: Decision; source: ExpectedSource; malformed: boolean };

/** The values a `platforms` list may name: those of `replay_host.platform` (§2.1 Platform rule). */
export const PLATFORMS: readonly Platform[] = ["win32", "posix"];

/** The platforms a case is limited to, or null when its `platforms` field is absent or no non-empty list of `win32`/`posix` (excludes nothing). */
export function platformsOf(c: AnyCase): Platform[] | null {
  const p = (c as { platforms?: unknown }).platforms;
  if (!Array.isArray(p) || p.length === 0 || !p.every((v) => typeof v === "string" && (PLATFORMS as readonly string[]).includes(v))) return null;
  return p as Platform[];
}

/** True when the platform rule excludes a case that falls to the last row on `platform`. */
export const platformExcluded = (c: AnyCase, platform: Platform): boolean => {
  const p = platformsOf(c);
  return p !== null && !p.includes(platform);
};

/** The generated agent of an `architect:<name>` caller that is one of the ten, else null. */
export function architectAgent(agent: unknown): string | null {
  if (typeof agent !== "string" || !agent.startsWith("architect:")) return null;
  const name = agent.slice("architect:".length);
  return ARCHITECT_AGENTS.includes(name) ? name : null;
}

/** An `architect:sdd-*` caller that is none of the ten Architect agents (C002-REQ-632). */
export function unknownSddCaller(agent: unknown): boolean {
  return typeof agent === "string" && agent.startsWith("architect:sdd-") && architectAgent(agent) === null;
}

/** C002-REQ-630: the hook input has no cwd, an empty cwd or no tool name; never a case with `requires` (C002-REQ-633). */
export function missingField(c: AnyCase): boolean {
  if (c.requires !== undefined) return false;
  return c.cwd === null || c.cwd === "" || c.tool === null;
}

function corpusValue(c: AnyCase, platform: Platform): Decision {
  return typeof c.expect === "string" ? c.expect : c.expect[platform];
}

/** The write tools of C002-IF-009 §2.1 (shell corpus row of C001-REQ-1103). */
export const WRITE_TOOLS: readonly string[] = ["Write", "Edit", "MultiEdit", "NotebookEdit"];
/** A Serena command whose data-folder argument is the literal `${CLAUDE_PLUGIN_DATA}`, bare or in double quotes. */
const SERENA_PLUGIN_DATA = /(?:^|\s)serena-(?:config|launch)\s+(?:"\$\{CLAUDE_PLUGIN_DATA\}"|\$\{CLAUDE_PLUGIN_DATA\})(?=\s|$)/;

/** Shell corpus, tool Bash, a Serena command with the literal data folder (C002-REQ-517). */
export function serenaPluginDataCase(c: AnyCase, corpus: CorpusName): boolean {
  return corpus === "shell" && c.tool === "Bash" && typeof (c as BashCase).command === "string" && SERENA_PLUGIN_DATA.test((c as BashCase).command as string);
}

/** Path corpus, category cwd, a cwd that reaches the repository root through the link `{repolink}` (C002-REQ-401). */
export function linkedCwdCase(c: AnyCase, corpus: CorpusName): boolean {
  return corpus === "path" && c.category === "cwd" && typeof c.cwd === "string" && (c.cwd === "{repolink}" || c.cwd.startsWith("{repolink}/"));
}

/** The corpus a case belongs to, when the caller does not name it: a shell case has a `command`. */
function corpusOf(c: AnyCase): CorpusName {
  return "command" in c ? "shell" : "path";
}

export function expectationOf(c: AnyCase, mechanism: Mechanism, platform: Platform, corpus: CorpusName = corpusOf(c)): Expectation {
  if (c.category === "identity" && mechanism !== "opencode-permissions") return { applicable: false, rule: "C002-REQ-626" };
  if (missingField(c)) return { applicable: true, expected: "deny", source: "C002-REQ-630", malformed: true };
  if (c.category === "identity" && unknownSddCaller(c.agent)) return { applicable: true, expected: "allow", source: "C002-REQ-632", malformed: false };
  if (c.category === "memory") return { applicable: true, expected: "deny", source: "C002-REQ-625", malformed: false };
  if (corpus === "shell" && c.tool !== null && WRITE_TOOLS.includes(c.tool)) return { applicable: true, expected: "deny", source: "C001-REQ-1103", malformed: c.stdin !== undefined };
  if (mechanism === "sdd-mcp-server" && serenaPluginDataCase(c, corpus)) return { applicable: true, expected: "deny", source: "C002-REQ-517", malformed: c.stdin !== undefined };
  if (mechanism === "sdd-mcp-server" && linkedCwdCase(c, corpus)) return { applicable: true, expected: "deny", source: "C002-REQ-401", malformed: c.stdin !== undefined };
  // The platform rule, for a case of the last row only; it is decided before C002-REQ-633 (a `requires` field).
  if (platformExcluded(c, platform)) return { applicable: false, rule: "platforms" };
  return { applicable: true, expected: corpusValue(c, platform), source: "corpus", malformed: c.stdin !== undefined };
}

/**
 * The caller that plays a replayed case (C002-IF-009 §2.2), before the grant fallback of the adapter:
 * an identity case on OpenCode whose caller is not one of the ten is played by the adopter agent; a
 * memory case always by an Architect agent (its own, else the conductor); any other case by its own
 * generated agent, else the conductor.
 */
export function callerOf(c: AnyCase, mechanism: Mechanism): string {
  const own = architectAgent(c.agent);
  if (c.category === "identity" && mechanism === "opencode-permissions") return own ?? ADOPTER_AGENT;
  return own ?? CONDUCTOR;
}
