// C002-TC-656 (C002-T-042): the opencode-permissions adapter reads both forms of an unavailable-tool
// result as deny and a call that ran as allow (C002-IF-009 §2.3; S-07 fact F-5). The OpenCode host is an
// in-process stub that answers the `edit` call of PG-050 with each part form of the Examples (no
// socket, so `npm test` and its no-network preload run it); the replay fixture holds README.md.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Corpus } from "../../guards/fixture.ts";
import { createOpenCodeAdapter, type HostResult, type OpenCodeHost, readDecision, type ScriptedCall } from "../../replay/adapters/opencode-permissions.ts";
import { DEFAULT_PATH_CORPUS, DEFAULT_SHELL_CORPUS, runReplay } from "../../replay/suite.ts";

type Row = { label: string; answer: (call: ScriptedCall) => HostResult; changes: boolean; decision: "allow" | "deny"; detail: (d: string) => boolean; shows: string };

const ROWS: Row[] = [
  {
    label: 'a tool part named "edit" with the status "error" and the text "Model tried to call unavailable tool \'edit\'"',
    answer: (c) => ({ parts: [{ type: "tool", tool: "edit", state: { status: "error", input: c.args, error: "Model tried to call unavailable tool 'edit'. Available tools: read." } }] }),
    changes: false,
    decision: "deny",
    detail: (d) => d.includes("Model tried to call unavailable tool 'edit'"),
    shows: "holds the unavailable-tool text",
  },
  {
    label: 'a part named "invalid" with the status "completed" and the output "The arguments provided to the tool are invalid: edit"',
    answer: () => ({ parts: [{ type: "tool", tool: "invalid", state: { status: "completed", input: { tool: "edit" }, output: "The arguments provided to the tool are invalid: edit" } }] }),
    changes: false,
    decision: "deny",
    detail: (d) => d.includes("The arguments provided to the tool are invalid: edit"),
    shows: "holds the invalid-arguments output",
  },
  {
    label: 'a tool part named "edit" with the status "completed"',
    answer: (c) => {
      const args = c.args as { filePath: string; oldString: string; newString: string };
      writeFileSync(args.filePath, readFileSync(args.filePath, "utf8").replace(args.oldString, args.newString));
      return { parts: [{ type: "tool", tool: "edit", state: { status: "completed", input: c.args, output: "Edit applied successfully." } }] };
    },
    changes: true,
    decision: "allow",
    detail: (d) => d === "Edit applied successfully.",
    shows: "is the part's output text",
  },
];

/** A stub OpenCode host: reports the tested version and answers each call with the row's part. */
function stubHost(row: Row, seen: ScriptedCall[]): OpenCodeHost {
  return {
    start: async () => ({ version: "1.18.31" }),
    call: async (_agent, call) => {
      seen.push(call);
      // The one shell case the report schema needs is answered as a call that ran.
      if (call.tool !== "edit") return { parts: [{ type: "tool", tool: call.tool, state: { status: "completed", output: "" } }] };
      return row.answer(call);
    },
    commands: async () => [],
    stop: async () => {},
  };
}

for (const row of ROWS) {
  test(`C002-TS-656 — ${row.label} reads as ${row.decision}`, async () => {
    const dir = mkdtempSync(join(tmpdir(), "sdd-oc-decision-"));
    try {
      const corpus = JSON.parse(readFileSync(DEFAULT_PATH_CORPUS, "utf8")) as Corpus;
      corpus.cases = corpus.cases.filter((c) => c.id === "PG-050");
      assert.equal(corpus.cases.length, 1);
      writeFileSync(join(dir, "path.json"), JSON.stringify(corpus));
      const shell = JSON.parse(readFileSync(DEFAULT_SHELL_CORPUS, "utf8")) as { cases: { id: string }[] };
      writeFileSync(join(dir, "shell.json"), JSON.stringify({ cases: shell.cases.filter((c) => c.id === "BG-001") }));
      const seen: ScriptedCall[] = [];
      const adapter = createOpenCodeAdapter({ host: stubHost(row, seen), testedVersion: "1.18.31" });
      const readme = { before: corpus.fixture.files["README.md"], after: "" };
      const { report, problems } = await runReplay(adapter, {
        pathCorpus: join(dir, "path.json"),
        shellCorpus: join(dir, "shell.json"),
        afterRun: (fx) => (readme.after = readFileSync(`${fx.repo}/README.md`, "utf8")),
      });
      assert.deepEqual(problems, []);
      const edits = seen.filter((c) => c.tool === "edit");
      assert.equal(edits.length, 1, "one edit call, for PG-050");
      assert.match(String((edits[0]!.args as { filePath: string }).filePath), /\/README\.md$/);
      const e = report.cases.find((c) => c.id === "PG-050");
      assert.ok(e, "PG-050 is a replayed case");
      assert.equal(e.actual, row.decision);
      assert.ok(row.detail(e.detail ?? ""), `detail ${row.shows}: ${e.detail}`);
      assert.equal(readme.after !== readme.before, row.changes, `README.md ${row.changes ? "has changed" : "is unchanged"}`);
      assert.deepEqual(report.host_versions, { opencode: "1.18.31" });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
}

test("C002-TS-656 — a refusal whose target changed, a part still running and a session without a tool part read as error", () => {
  const refused = { parts: [{ type: "tool", tool: "edit", state: { status: "error", error: "Model tried to call unavailable tool 'edit'" } }] };
  assert.equal(readDecision(refused, true).actual, "error");
  assert.equal(readDecision(refused, false).actual, "deny");
  assert.equal(readDecision({ parts: [{ type: "tool", tool: "edit", state: { status: "running" } }] }).actual, "error");
  assert.equal(readDecision({ parts: [{ type: "text", text: "done." }], error: "timed out" }).actual, "error");
  // A permission rule and a tool error raised before the permission check (S-07 F-4) read as deny.
  const rule = "The user has specified a rule which prevents you from using this specific tool call.";
  assert.equal(readDecision({ parts: [{ type: "tool", tool: "write", state: { status: "error", error: rule } }] }).actual, "deny");
  assert.equal(readDecision({ parts: [{ type: "tool", tool: "edit", state: { status: "error", error: "Could not find oldString in the file." } }] }).actual, "deny");
});
