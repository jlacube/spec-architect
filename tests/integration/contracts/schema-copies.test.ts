// C002-ADR-002: each in-repository copy of a JSON Schema contract equals its spec contract (canonical
// JSON: key order and white space ignored). The contracts are read through the spec-file locator, so
// the test keeps working after `sdd archive` moves them. The list starts empty; C002-T-016
// (`src/mcp/tools.schema.json`), C002-T-024 (`plugins/architect/targets/mapping-table.schema.json`)
// and C002-T-040 (`docs/releases/release-record.schema.json`) each add their pair.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { repoRoot } from "../../helpers.ts";
import { specFile } from "../../helpers/spec-file.ts";

interface Pair {
  /** Copy, relative to the repository root (`/` separated). */
  copy: string;
  /** Change number and path of the contract relative to the change folder. */
  change: string;
  contract: string;
}

const PAIRS: Pair[] = [
  { copy: "src/mcp/tools.schema.json", change: "002", contract: "10-spec/50-interfaces/sdd-mcp-tools.schema.json" },
  { copy: "docs/releases/release-record.schema.json", change: "002", contract: "10-spec/50-interfaces/release-record.schema.json" },
];

/** JSON text with object keys sorted at every level and no white space. */
function canonicalJson(text: string): string {
  const sort = (v: unknown): unknown =>
    Array.isArray(v) ? v.map(sort) : v !== null && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, sort((v as Record<string, unknown>)[k])])) : v;
  return JSON.stringify(sort(JSON.parse(text)));
}

test("canonical JSON ignores key order and white space, not values or array order", () => {
  assert.equal(canonicalJson('{ "b": 1, "a": { "y": [1, 2], "x": null } }'), canonicalJson('{"a":{"x":null,"y":[1,2]},"b":1}'));
  assert.notEqual(canonicalJson('{"a":[1,2]}'), canonicalJson('{"a":[2,1]}'));
  assert.notEqual(canonicalJson('{"a":"1"}'), canonicalJson('{"a":1}'));
});

test("each schema copy is listed once", () => {
  assert.equal(new Set(PAIRS.map((p) => p.copy)).size, PAIRS.length);
});

for (const p of PAIRS) {
  test(`${p.copy} equals the contract ${p.contract} of CHG-${p.change}`, () => {
    const copy = readFileSync(join(repoRoot(), ...p.copy.split("/")), "utf8");
    const contract = readFileSync(specFile(p.change, p.contract), "utf8");
    assert.equal(canonicalJson(copy), canonicalJson(contract));
  });
}
