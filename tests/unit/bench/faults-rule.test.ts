// C001-TC-1126 (C001-NFR-301; C001-T-080, finding F-6): the pass rule of the fault campaign
// (`bench/faults.mjs › fileOk`) for one state file of one run. A file passes when it is its previous
// version or a complete version that the command writes to that path in an uninterrupted run,
// intermediate versions included; absence passes when the file did not exist before or the command
// moves it away. A truncated file fails.
import { test } from "node:test";
import assert from "node:assert/strict";
import { fileOk } from "../../../bench/faults.mjs";

const BEFORE = "---\nid: CHG-001\nstatus: done\n---\n# Change 001\n";
const ARCHIVED = "---\nid: CHG-001\nstatus: archived\n---\n# Change 001\n";
const REGISTRY_OLD = '{\n  "changes": []\n}\n';
const REGISTRY_NEW = '{\n  "changes": [{ "id": "CHG-001" }]\n}\n';

/** `change.md` of `archive`: written in place as `status: archived` (intermediate), then moved away. */
const changeMd = { before: BEFORE, after: null, versions: new Set([ARCHIVED]) };
/** `registry.json` of `status --write`: one new complete version. */
const registry = { before: REGISTRY_OLD, after: REGISTRY_NEW, versions: new Set([REGISTRY_NEW]) };
/** `_archive/…/change.md` of `archive`: did not exist before, appears with the folder move. */
const archived = { before: null, after: ARCHIVED, versions: new Set([ARCHIVED]) };

test("the previous version passes", () => {
  assert.equal(fileOk(REGISTRY_OLD, registry), true);
  assert.equal(fileOk(BEFORE, changeMd), true);
});

test("the new complete version passes", () => {
  assert.equal(fileOk(REGISTRY_NEW, registry), true);
  assert.equal(fileOk(ARCHIVED, archived), true);
});

test("an intermediate complete version passes: change.md with status archived before the folder move", () => {
  assert.equal(fileOk(ARCHIVED, changeMd), true);
});

test("absence passes for a file the command moves away and for a file that did not exist before", () => {
  assert.equal(fileOk(null, changeMd), true, "moved away");
  assert.equal(fileOk(null, archived), true, "did not exist before");
});

test("absence fails for a file that existed and that the command does not remove", () => {
  assert.equal(fileOk(null, registry), false);
});

test("a truncated file fails, as does any content the command never writes", () => {
  assert.equal(fileOk(REGISTRY_NEW.slice(0, 12), registry), false);
  assert.equal(fileOk(ARCHIVED.slice(0, ARCHIVED.length - 5), changeMd), false);
  assert.equal(fileOk("", registry), false);
  assert.equal(fileOk(BEFORE, archived), false, "a version written to another path does not pass here");
});

test("a mixed state passes: the rule is per file, so some files new and others previous is fine", () => {
  const files = { "registry.json": [REGISTRY_NEW, registry], "change.md": [BEFORE, changeMd], "_archive/change.md": [null, archived] } as const;
  assert.ok(Object.values(files).every(([now, plan]) => fileOk(now, plan)));
});
