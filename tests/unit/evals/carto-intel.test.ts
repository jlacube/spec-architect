// The cartographer evals' code-intelligence filter (evals/cap10/carto.mjs): a Bash command counts as a
// ripwire or ast-grep call only when that program is the command, not when its name appears in an
// argument (C001-T-072, TS-1004 run 3: `sed -i … ripwire-survey.md` was graded as a map call).
import { test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { repoRoot } from "../../helpers.ts";

const { INTEL_COMMAND } = await import(pathToFileURL(join(repoRoot(), "evals", "cap10", "carto.mjs")).href);

test("ripwire and ast-grep as the command count", () => {
  for (const cmd of [
    "ripwire . --max-tokens=4000",
    "cd /tmp/x && ripwire . --callers=createIntent --limit=50",
    "C:/tools/ripwire.exe . --hotspots --limit=50",
    '"C:/Program Files/ripwire/ripwire.exe" . --expand=X',
    "ast-grep run --pattern 'f($A)' --lang ts src",
    "true; ripwire . --test-gate=src/a.ts --limit=50",
  ]) assert.ok(INTEL_COMMAND.test(cmd), cmd);
});

test("a name inside an argument does not count", () => {
  for (const cmd of [
    "sed -i -E 's#a#b#' .sdd/004/00-ideation/evidence/ripwire-survey.md",
    "cat notes/ripwire.md",
    "grep -n ast-grep toolchain.md",
  ]) assert.ok(!INTEL_COMMAND.test(cmd), cmd);
});
