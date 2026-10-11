// C001-TC-512 — verifies C001-TS-512 (C001-AC-512.1, C001-REQ-512): broken YAML.
import { test } from "node:test";
import assert from "node:assert/strict";
import { lint, withCode } from "../cap04/spec-fixture.ts";

const IF = ".sdd/004-x/10-spec/50-interfaces";
const REGISTRY =
  "| ID | Interface | Kind | File | Provider | Consumers | Serves |\n|---|---|---|---|---|---|---|\n" +
  "| C004-IF-001 | Pay API | HTTP API | `openapi.yaml` | C004-COMP-01 | web | C004-REQ-012 |\n| C004-IF-002 | Doc | JSON document | `doc.schema.json` | C004-COMP-01 | web | C004-REQ-012 |\n";

function openapi(tabOnLine14: boolean): string {
  const lines = ["openapi: 3.1.0", "info:", "  title: Pay", "  version: 1.0.0", "paths:", "  /intents:", "    post:", "      summary: Create", "      responses:", "        '201':", "          description: Created", "components:", "  schemas:", "    Intent:", "      type: object"];
  if (tabOnLine14) lines[13] = "\tIntent:";
  return lines.join("\n") + "\n";
}

test("a tab-indentation error on line 14 is reported with LINT-IF-001 and line 14", () => {
  const { findings } = lint({ [`${IF}/openapi.yaml`]: openapi(true), [`${IF}/README.md`]: REGISTRY });
  const hits = withCode(findings, "LINT-IF-001");
  assert.equal(hits.length, 1, JSON.stringify(findings));
  assert.equal(hits[0]?.path, `${IF}/openapi.yaml`);
  assert.equal(hits[0]?.line, 14);
  assert.match(hits[0]?.message ?? "", /line 14/);
});

test("valid YAML and JSON parse; broken JSON reports its position", () => {
  assert.deepEqual(withCode(lint({ [`${IF}/openapi.yaml`]: openapi(false), [`${IF}/README.md`]: REGISTRY }).findings, "LINT-IF-001"), []);
  const hits = withCode(lint({ [`${IF}/doc.schema.json`]: '{\n  "type": "object",\n  "required": [}\n', [`${IF}/README.md`]: REGISTRY }).findings, "LINT-IF-001");
  assert.equal(hits.length, 1);
  assert.equal(hits[0]?.line, 3);
});
