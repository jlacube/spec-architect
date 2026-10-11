// C001-NFR-203 (C001-T-054): LINT-SEC-001 detects ≥ 95% of the positives and flags ≤ 2% of the negatives
// of tests/fixtures/secrets/corpus.json, line by line and through the lint of a workspace file.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { findSecrets } from "../../src/lint/rules/sec-001.ts";
import { repoRoot } from "../helpers.ts";
import { makeWorkspace, REBUILD, runBundled } from "../integration/cli/helpers.ts";

interface Corpus {
  positives: { id: string; kind: string; parts: string[] }[];
  negatives: { id: string; line: string }[];
}
const corpus = JSON.parse(readFileSync(join(repoRoot(), "tests", "fixtures", "secrets", "corpus.json"), "utf8")) as Corpus;

test("the fixture set has at least 60 positives and 100 negatives", () => {
  assert.ok(corpus.positives.length >= 60, String(corpus.positives.length));
  assert.ok(corpus.negatives.length >= 100, String(corpus.negatives.length));
});

test("detection ≥ 95% and false positives ≤ 2%", (t) => {
  const missed = corpus.positives.filter((p) => findSecrets(p.parts.join("")).length === 0);
  const flagged = corpus.negatives.filter((n) => findSecrets(n.line).length > 0);
  const detection = 1 - missed.length / corpus.positives.length;
  const fp = flagged.length / corpus.negatives.length;
  t.diagnostic(`detection ${(detection * 100).toFixed(1)}% (${corpus.positives.length - missed.length}/${corpus.positives.length}); false positives ${(fp * 100).toFixed(1)}% (${flagged.length}/${corpus.negatives.length})`);
  if (missed.length) t.diagnostic(`missed: ${missed.map((m) => `${m.id} ${m.kind}`).join(", ")}`);
  if (flagged.length) t.diagnostic(`flagged: ${flagged.map((f) => f.id).join(", ")}`);
  assert.ok(detection >= 0.95, `detection ${detection}`);
  assert.ok(fp <= 0.02, `false positives ${fp}`);
});

test("sdd lint reports LINT-SEC-001 for a positive in a .sdd/ file, naming the kind but never the value", () => {
  const p = corpus.positives.find((x) => x.kind === "GitHub token")!;
  const value = p.parts.join("");
  const ws = makeWorkspace({ ".sdd/SDD.md": "# SDD workspace\n", ".sdd/_constitution/notes.md": `# Notes\n\n${value}\n` });
  try {
    const r = runBundled(["lint"], { cwd: ws.root });
    assert.match(r.stdout, /error LINT-SEC-001 \.sdd\/_constitution\/notes\.md:3 — Secret-like string \(GitHub token\)/);
    const secretPart = p.parts[p.parts.length - 1]!.slice(-20);
    assert.ok(!r.stdout.includes(secretPart) && !r.stderr.includes(secretPart), "the value is not echoed");
    // The post-write hook's quick lint covers constitution files too.
    assert.match(runBundled(["lint", "--quick", "--file", ".sdd/_constitution/notes.md"], { cwd: ws.root }).stdout, /LINT-SEC-001 \.sdd\/_constitution\/notes\.md:3/);
  } finally {
    ws.cleanup();
  }
});
