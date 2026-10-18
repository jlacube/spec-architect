// Questions-block helper of the eval harness (C001-T-031): extraction and C001-IF-05 validation.
import { test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { questionsBlocks, questionsErrors } from "../../../evals/harness/questions.mjs";
import { repoRoot } from "../../helpers.ts";
import { specFile } from "../../helpers/spec-file.ts";

const SCHEMA = join(repoRoot(), "plugins", "architect", "skills", "interview-protocol", "references", "questions.schema.json");
const base = { id: "Q-budget-01", topic: "budget", question: "What budget is available?", why_it_matters: "Decides the hosting option.", blocking: true, material: false };

test("questionsBlocks finds fenced questions blocks and ignores other JSON", () => {
  const text = 'Digest.\n\n```json\n{"other": 1}\n```\n\n```json questions\n' + JSON.stringify({ questions: [base] }) + "\n```\n";
  const blocks = questionsBlocks(text);
  assert.equal(blocks.length, 1);
  assert.equal(blocks[0].questions[0].id, "Q-budget-01");
  assert.deepEqual(questionsBlocks("```json questions\nnot json\n```"), []);
});

test("questionsErrors accepts a valid block and rejects a material question without analysis", () => {
  assert.deepEqual(questionsErrors({ questions: [base] }, SCHEMA), []);
  const material = { ...base, material: true, options: [{ label: "A", rationale: "a" }, { label: "B", rationale: "b" }] };
  assert.ok(questionsErrors({ questions: [material] }, SCHEMA).length > 0);
  assert.deepEqual(questionsErrors({ questions: [{ ...material, candidates_considered: 4, rejected: [{ label: "C", reason: "c" }] }] }, SCHEMA), []);
});

test("the skill's schema is a copy of C001-IF-05", async () => {
  const { readFileSync } = await import("node:fs");
  const spec = readFileSync(specFile("001", "10-spec/50-interfaces/questions.schema.json"), "utf8");
  assert.equal(readFileSync(SCHEMA, "utf8"), spec);
});
