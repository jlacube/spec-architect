// EARS shapes, singularity, system names and weak words (C001-IF-04 §3–§4), shared by the
// LINT-EARS-* and LINT-WORD-001 rules.

export const PATTERNS = ["ubiquitous", "event-driven", "state-driven", "unwanted-behaviour", "optional-feature", "complex"] as const;

/** Text with code spans removed (they never count as keywords or words). */
export function withoutCode(s: string): string {
  return s.replace(/`[^`]*`/g, " ");
}

/** Text with code spans and double-quoted strings removed (C001-IF-04 §4 exemptions). */
export function withoutCodeAndQuotes(s: string): string {
  return withoutCode(s).replace(/\\"/g, " ").replace(/"[^"]*"|“[^”]*”/g, " ");
}

const MAIN = String.raw`THE .+? SHALL(?: NOT)?\b`;
const SHAPES: Record<string, RegExp> = {
  ubiquitous: new RegExp(`^${MAIN}`, "i"),
  "event-driven": new RegExp(`^WHEN .+?, ${MAIN}`, "i"),
  "state-driven": new RegExp(`^WHILE .+?, ${MAIN}`, "i"),
  "unwanted-behaviour": new RegExp(`^IF .+?, THEN ${MAIN}`, "i"),
  "optional-feature": new RegExp(`^WHERE .+?, ${MAIN}`, "i"),
  complex: new RegExp(`^(?:(?:(?:WHILE|WHEN|WHERE) .+?, ){2,}${MAIN}|WHILE .+?, IF .+?, THEN ${MAIN})`, "i"),
};

/** True when the statement has the keyword shape of the declared pattern (keywords case-insensitive). */
export function matchesShape(pattern: string, statement: string): boolean {
  const re = SHAPES[pattern];
  if (!re) return false;
  const s = withoutCode(statement).replace(/\s+/g, " ").trim();
  if (pattern === "ubiquitous" && /^(?:WHEN|WHILE|IF|WHERE)\b/i.test(s)) return false;
  return re.test(s);
}

/** The shape the statement actually has, for the finding message. */
export function detectShape(statement: string): string {
  const order = ["complex", "unwanted-behaviour", "event-driven", "state-driven", "optional-feature", "ubiquitous"];
  return order.find((p) => matchesShape(p, statement)) ?? "none";
}

/** Occurrences of SHALL (including SHALL NOT) outside code spans. */
export function countShall(statement: string): number {
  return (withoutCode(statement).match(/\bSHALL\b/gi) ?? []).length;
}

/**
 * The system named in the main clause: the last `THE <sys>` clause (at the start or after a comma)
 * before the first SHALL. Backticks are dropped, so a code-formatted name reads as plain text.
 */
export function systemName(statement: string): string | null {
  // The first SHALL outside code spans (spans blanked to keep offsets).
  const at = statement.replace(/`[^`]*`/g, (m) => " ".repeat(m.length)).search(/\bSHALL\b/i);
  if (at < 0) return null;
  const prefix = statement.slice(0, at).replace(/`/g, "").replace(/\s+/g, " ");
  const m = /(?:^|,\s*(?:THEN\s+)?)THE\s+([^,]+?)\s*$/i.exec(prefix);
  return m?.[1]?.trim() || null;
}

/**
 * True when a system name matches the start of `name` (C001-IF-04 §3: the longest matching name
 * wins, so any match is enough here). Entries such as "definitions of" are prefixes by design.
 */
export function knownSystem(name: string, systems: readonly string[]): boolean {
  const n = name.toLowerCase();
  return systems.some((s) => {
    const t = s.toLowerCase();
    return t !== "" && (n === t || n.startsWith(t + " ") || n.startsWith(t + "'"));
  });
}

const WEAK_WORDS = [
  "fast", "quick", "quickly", "easy", "easily", "simple", "flexible", "robust", "user-friendly", "intuitive",
  "appropriate", "adequate", "sufficient", "efficient", "seamless", "optimal", "minimal", "maximal", "several",
  "various", "some", "etc", "and/or", "normally", "usually", "typically", "approximately",
];
const WEAK_PHRASES = ["as needed", "if possible", "as appropriate", "where possible", "as soon as possible", "state of the art"];

/** Weak words and phrases of C001-IF-04 §4 found outside code spans and double quotes. */
export function weakWords(text: string): string[] {
  const plain = withoutCodeAndQuotes(text);
  const lower = plain.toLowerCase();
  const hits = WEAK_WORDS.filter((w) => new RegExp(`(?<![\\w-])${w.replace("/", "\\/")}(?![\\w-])`).test(lower));
  hits.push(...WEAK_PHRASES.filter((p) => new RegExp(`(?<![\\w-])${p}(?![\\w-])`).test(lower)));
  // "support for" is weak unless a named interface or format follows (a capitalised name or a code span).
  const quoteless = text.replace(/\\"/g, " ").replace(/"[^"]*"|“[^”]*”/g, " ");
  if ([...quoteless.matchAll(/\bsupport for\s+(\S)/gi)].some((m) => !/[A-Z0-9`]/.test(m[1] ?? ""))) hits.push("support for");
  return hits;
}
