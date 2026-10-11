// Workspace IDs (C001-IF-04 §1–§2): full form `C<NNN>-<TYPE>-<seq>` (AC: `<req-seq>.<n>`) and
// short form `<TYPE>-<seq>`, which resolves to the enclosing change (C001-REQ-112).

/** ID types of C001-IF-04 §2. ERR is excluded: its catalogue rows use codes (`ERR-CLI-007`). */
export const ID_TYPES = [
  "GOAL", "SC", "NG", "AS", "CON", "CAP", "US", "REQ", "AC", "TS", "NFR", "INV", "IF", "COMP",
  "DEC", "ADR", "OA", "R", "M", "T", "TC", "RISK", "RB", "DOD",
] as const;

export type IdType = (typeof ID_TYPES)[number];

export interface IdParts {
  change: string;
  type: IdType;
  seq: string;
  /** AC sub-number (`012.1` → `1`). */
  sub?: string;
}

export interface IdHit {
  /** Full ID. */
  id: string;
  /** Text as written. */
  raw: string;
  short: boolean;
  /** 0-based column of `raw` in the line. */
  column: number;
}

// Longest alternatives first so that `TC`/`TS` win over `T` and `RISK`/`RB` over `R`.
const TYPE_ALT = [...ID_TYPES].sort((a, b) => b.length - a.length).join("|");
const BODY = `(${TYPE_ALT})-(\\d+)(?:\\.(\\d+))?`;
const FULL = new RegExp(`^C(\\d{3})-${BODY}$`);
// A match must not touch letters, digits, `_`, `-` or `§` on either side. A trailing `.` is
// allowed (end of sentence), but not `.` followed by a word character.
const SCAN = new RegExp(`(?<![A-Za-z0-9_§-])(?:C(\\d{3})-)?${BODY}(?![A-Za-z0-9_-]|\\.\\w)`, "g");

function valid(type: string, sub: string | undefined): boolean {
  return type === "AC" ? sub !== undefined : sub === undefined;
}

/** C001-IF-04 §1 sequence widths: ≥ 2 digits for these types, ≥ 3 for the others. */
const TWO_DIGIT: ReadonlySet<string> = new Set(["GOAL", "SC", "NG", "AS", "CON", "CAP", "INV", "M", "COMP", "IF"]);
const minDigits = (type: string) => (TWO_DIGIT.has(type) ? 2 : 3);

export function parseId(text: string): IdParts | null {
  const m = FULL.exec(text);
  if (!m || !valid(m[2]!, m[4])) return null;
  const parts: IdParts = { change: m[1]!, type: m[2] as IdType, seq: m[3]! };
  if (m[4] !== undefined) parts.sub = m[4];
  return parts;
}

export function formatId(p: IdParts): string {
  return `C${p.change}-${p.type}-${p.seq}${p.sub !== undefined ? "." + p.sub : ""}`;
}

/**
 * Every ID occurrence in `line`. Short forms resolve to `change` (the 3-digit number of the
 * enclosing change folder); outside a change (`null`) they are skipped.
 */
export function findIds(line: string, change: string | null): IdHit[] {
  const hits: IdHit[] = [];
  for (const m of line.matchAll(SCAN)) {
    const [raw, own, type, seq, sub] = m;
    if (!type || !seq || !valid(type, sub)) continue;
    const owner = own ?? change;
    if (!owner) continue;
    // A short form must have the specified width; narrower ones are citation labels such as
    // the ideation-era `OA-01` (C001-IF-04 §1). Full forms are taken as written.
    if (own === undefined && seq.length < minDigits(type)) continue;
    const parts: IdParts = { change: owner, type: type as IdType, seq };
    if (sub !== undefined) parts.sub = sub;
    hits.push({ id: formatId(parts), raw, short: own === undefined, column: m.index });
  }
  return hits;
}
