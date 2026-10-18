// Corpus replay suite (C002-COMP-008, C002-T-040): applicability and expected decision of a corpus case
// per mechanism, in the rule order of C002-IF-009 §2.1, and the caller that plays it (§2.2).
//
//   1. category identity, mechanism other than opencode-permissions  → not applicable (C002-REQ-626)
//   2. no cwd (null), empty cwd ("") or no tool name (null)            → deny, malformed call (C002-REQ-630)
//   3. identity, caller an architect:sdd-* name none of the ten        → allow (C002-REQ-632; OpenCode only,
//                                                                         the other mechanisms stop at rule 1)
//   4. category memory                                                  → deny (C002-REQ-625)
//   5. every other case                                                 → the corpus value (corpus), per
//                                                                         platform of the replay host
// A case that requires a host capability (C002-REQ-633) is never not applicable and never a malformed
// call: rule 2 does not apply to it, and the other rules give its expectation as for any other case.
import type { BashCase, CorpusCase } from "../guards/fixture.ts";

export type Mechanism = "opencode-permissions" | "sdd-mcp-server" | "copilot-hooks";
export const MECHANISMS: readonly Mechanism[] = ["opencode-permissions", "sdd-mcp-server", "copilot-hooks"];
export type Platform = "win32" | "posix";
export type Decision = "allow" | "deny";
export type ExpectedSource = "corpus" | "C002-REQ-625" | "C002-REQ-630" | "C002-REQ-632";
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

export type Expectation =
  | { applicable: false; rule: "C002-REQ-626" }
  | { applicable: true; expected: Decision; source: ExpectedSource; malformed: boolean }
  /** A case limited by `platforms` to other platforms has no expectation on this host (§2.1, ERR-REL-012). */
  | { applicable: true; omitted: string };

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

export function expectationOf(c: AnyCase, mechanism: Mechanism, platform: Platform): Expectation {
  if (c.category === "identity" && mechanism !== "opencode-permissions") return { applicable: false, rule: "C002-REQ-626" };
  if (missingField(c)) return { applicable: true, expected: "deny", source: "C002-REQ-630", malformed: true };
  if (c.category === "identity" && unknownSddCaller(c.agent)) return { applicable: true, expected: "allow", source: "C002-REQ-632", malformed: false };
  if (c.category === "memory") return { applicable: true, expected: "deny", source: "C002-REQ-625", malformed: false };
  const platforms = (c as CorpusCase).platforms;
  if (platforms && !platforms.includes(platform)) return { applicable: true, omitted: `limited to ${platforms.join(", ")}; no expectation on ${platform}` };
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
