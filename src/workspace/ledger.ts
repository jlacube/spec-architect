// The ID ledger `ids.json` of a change (C001-IF-03 §4; C001-REQ-109, 110, 111, 113).
// The next number for a type is the highest of the ledger counter, the numbers defined in the
// change's files, and any tombstone at or above it, plus one, so no ID is ever reused.
import { existsSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { writeTextAtomic } from "../io/atomic.ts";
import { CliError, usage } from "../cli/errors.ts";
import { buildChangeGraph } from "../model/graph.ts";
import { formatId, parseId, type IdType } from "../model/ids.ts";

/** ID types of C001-IF-04 §2 in the order of C001-REQ-113. */
export const LEDGER_TYPES = [
  "GOAL", "SC", "NG", "AS", "CON", "CAP", "US", "REQ", "AC", "TS", "NFR", "INV", "IF", "ERR",
  "COMP", "DEC", "ADR", "OA", "R", "M", "T", "TC", "RISK", "RB", "DOD",
] as const;

const TWO_DIGIT = new Set(["GOAL", "SC", "NG", "AS", "CON", "CAP", "INV", "M"]);

export interface Block {
  type: string;
  from: number;
  to: number;
  capability: string;
  /** Highest number allocated in this block, per type. */
  allocated?: Record<string, number>;
}

export interface Tombstone {
  id: string;
  reason: string;
  date: string;
}

export interface LedgerDoc {
  change: string;
  allocated: Record<string, number>;
  blocks: Block[];
  tombstones: Tombstone[];
  [key: string]: unknown;
}

export interface Ledger extends LedgerDoc {
  dir: string;
  path: string;
  isTombstoned(id: string): boolean;
}

/** Change number of a change folder (`.sdd/004-x` → `004`). */
export function changeNumber(dir: string): string {
  const m = /^(\d{3})-/.exec(basename(dir));
  if (!m?.[1]) throw new Error(`not a change folder: ${dir}`);
  return m[1];
}

export function loadLedger(dir: string): Ledger {
  const path = join(dir, "ids.json");
  const nnn = changeNumber(dir);
  const raw: Partial<LedgerDoc> = existsSync(path) ? (JSON.parse(readFileSync(path, "utf8")) as Partial<LedgerDoc>) : {};
  const doc: LedgerDoc = {
    ...raw,
    change: raw.change ?? `CHG-${nnn}`,
    allocated: raw.allocated ?? {},
    blocks: raw.blocks ?? [],
    tombstones: raw.tombstones ?? [],
  };
  const tomb = new Set(doc.tombstones.map((t) => t.id));
  return { ...doc, dir, path, isTombstoned: (id) => tomb.has(id) };
}

/** One-line JSON with `{ "k": v, … }` spacing. */
function inline(v: unknown): string {
  if (Array.isArray(v)) return "[" + v.map(inline).join(", ") + "]";
  if (v !== null && typeof v === "object") {
    const e = Object.entries(v);
    return e.length === 0 ? "{}" : "{ " + e.map(([k, x]) => `${JSON.stringify(k)}: ${inline(x)}`).join(", ") + " }";
  }
  return JSON.stringify(v);
}
const objLine = (o: Record<string, unknown>) => inline(o);

/** Serialises a ledger with one entry per line (the format of the CHG-001 bootstrap ledger). */
export function formatLedger(doc: LedgerDoc): string {
  const out: string[] = ["{"];
  const keys = Object.keys(doc).filter((k) => !["dir", "path", "isTombstoned"].includes(k));
  keys.forEach((k, i) => {
    const v = doc[k];
    const comma = i < keys.length - 1 ? "," : "";
    if (Array.isArray(v)) {
      if (v.length === 0) out.push(`  ${JSON.stringify(k)}: []${comma}`);
      else {
        out.push(`  ${JSON.stringify(k)}: [`);
        v.forEach((item, j) => out.push(`    ${objLine(item as Record<string, unknown>)}${j < v.length - 1 ? "," : ""}`));
        out.push(`  ]${comma}`);
      }
    } else if (typeof v === "object" && v !== null) {
      out.push(`  ${JSON.stringify(k)}: ${Object.keys(v).length === 0 ? "{}" : objLine(v as Record<string, unknown>)}${comma}`);
    } else {
      out.push(`  ${JSON.stringify(k)}: ${JSON.stringify(v)}${comma}`);
    }
  });
  out.push("}");
  return out.join("\n") + "\n";
}

function save(l: Ledger): void {
  const { dir: _d, path, isTombstoned: _t, ...doc } = l;
  writeTextAtomic(path, formatLedger(doc as LedgerDoc));
}

function capabilityId(nnn: string, name: string): string {
  const m = /^(?:C\d{3}-)?CAP-(\d+)$/.exec(name) ?? /^(\d+)$/.exec(name);
  if (!m?.[1]) throw usage("id next", `--block must name a capability such as CAP-01: ${name}`);
  return `C${nnn}-CAP-${m[1].padStart(2, "0")}`;
}

function blockTypes(b: Block): string[] {
  return b.type.split("|").map((t) => t.trim());
}

export interface NextOptions {
  block?: string;
}

/** Allocates and persists the next ID of `type` in the change folder `dir`. */
export function nextId(dir: string, type: string, options: NextOptions = {}): { id: string } {
  if (!(LEDGER_TYPES as readonly string[]).includes(type)) throw new CliError("ERR-CLI-004", { TYPE: type, list: LEDGER_TYPES.join(", ") });
  if (type === "AC") throw usage("id next", "AC IDs derive from their requirement (AC-<req-seq>.<n>) and are not allocated");
  const nnn = changeNumber(dir);
  const ledger = loadLedger(dir);
  const blocks = ledger.blocks.filter((b) => blockTypes(b).includes(type));
  let block: Block | undefined;
  if (blocks.length > 0) {
    if (options.block === undefined) throw usage("id next", `${type} uses capability blocks; pass --block <capability>`);
    const cap = capabilityId(nnn, options.block);
    block = blocks.find((b) => capabilityId(nnn, b.capability) === cap);
    if (!block) throw usage("id next", `no block for ${type} in capability ${cap}`);
  }
  // Numbers already defined in the change's files (ERR codes are catalogue rows, not definitions).
  const defined = buildChangeGraph(dir)
    .nodes.filter((n) => n.type === (type as IdType))
    .map((n) => Number(parseId(n.id)?.seq ?? 0))
    .filter((n) => !block || (n >= block.from && n <= block.to));
  const counter = block ? (block.allocated?.[type] ?? block.from - 1) : (ledger.allocated[type] ?? 0);
  let seq = Math.max(counter, ...defined, block ? block.from - 1 : 0) + 1;
  const width = TWO_DIGIT.has(type) ? 2 : 3;
  const idOf = (n: number) => formatId({ change: nnn, type: type as IdType, seq: String(n).padStart(width, "0") });
  while (ledger.isTombstoned(idOf(seq))) seq++;
  if (block && seq > block.to) throw usage("id next", `block ${capabilityId(nnn, block.capability)} for ${type} is full (${block.from}–${block.to})`);
  if (block) block.allocated = { ...(block.allocated ?? {}), [type]: seq };
  else ledger.allocated = { ...ledger.allocated, [type]: seq };
  save(ledger); // persisted before the ID is printed (C001-REQ-109)
  return { id: idOf(seq) };
}

/** Records a tombstone for a full ID (C001-REQ-111). */
export function tombstoneId(dir: string, id: string, reason: string, date: Date = new Date()): void {
  const ledger = loadLedger(dir);
  if (ledger.isTombstoned(id)) throw usage("id tombstone", `${id} is already tombstoned`);
  const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  ledger.tombstones = [...ledger.tombstones, { id, reason, date: iso }];
  save(ledger);
}
