// Questions blocks of the specialist return contract (C001-IF-05): extraction from a hand-back and
// validation against the schema shipped with the interview-protocol skill.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import { ROOT } from "./fixtures.mjs";

const SCHEMA = join(ROOT, "plugins", "architect", "skills", "interview-protocol", "references", "questions.schema.json");
let validator;

/** Parsed JSON of every fenced `json questions` block (or `json` block with a "questions" key) in `text`. */
export function questionsBlocks(text) {
  const out = [];
  for (const m of String(text).matchAll(/```json(?:[ \t]+questions)?[^\n]*\n([\s\S]*?)```/g)) {
    try {
      const v = JSON.parse(m[1]);
      if (v && typeof v === "object" && "questions" in v) out.push(v);
    } catch {
      // not JSON: not a questions block
    }
  }
  return out;
}

/** Schema errors of one block as strings (empty when valid); `schema` defaults to the skill's copy. */
export function questionsErrors(block, schema = SCHEMA) {
  validator ??= new Ajv2020({ allErrors: true, strict: false }).compile(JSON.parse(readFileSync(schema, "utf8")));
  return validator(block) ? [] : validator.errors.map((e) => `${e.instancePath || "/"} ${e.message}`);
}
