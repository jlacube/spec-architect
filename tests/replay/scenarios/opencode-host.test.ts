// OpenCode-host replay scenarios (C002-COMP-008): cases that need OpenCode itself at its tested version,
// driven through the replay adapter of the mechanism `opencode-permissions` (C002-T-042, scripted-model
// driver of C002-ADR-005). The file uses only the adapter interface of C002-T-040 (../adapter.ts) and
// selects the adapter by its mechanism name at run time from the registry of ../main.ts; until
// C002-T-042 registers it, each scenario is skipped. Run by `npm run replay -- opencode-host`, never by
// `npm test` (scripts/test.mjs leaves tests/replay/ out).
//   C002-TC-133 (C002-T-026)  adopter MCP server tool not available to an Architect agent
// C002-T-029 (C002-TC-226) and C002-T-030 (C002-TC-207, 209, 211, 213, 222, 223) add their scenarios here.
import { test, type TestContext } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import type { CorpusCase } from "../../guards/fixture.ts";
import type { ReplayAdapter, ReplayFixture, ReplayInput } from "../adapter.ts";
import type { Mechanism } from "../expect.ts";
import { ADAPTERS } from "../main.ts";
import { buildReplayFixture, loadCorpora } from "../suite.ts";

/** The mechanism whose adapter drives OpenCode (C002-IF-009 §2.2). */
const MECHANISM: Mechanism = "opencode-permissions";

/** The OpenCode-host adapter, or null (scenario skipped) while no adapter is registered. */
async function openCodeHost(t: TestContext): Promise<ReplayAdapter | null> {
  const make = ADAPTERS[MECHANISM];
  if (!make) {
    t.skip(`no ${MECHANISM} replay adapter registered yet (C002-T-042)`);
    return null;
  }
  return make();
}

/**
 * fx-oc with `fx-fs` (C002-TS-133): the replay fixture plus the adopter's own `opencode.json`, which
 * declares, outside the Architect agents' entries, the local MCP server `fx-fs` whose tool `write_file`
 * writes any path and logs every call to `<base>/fx-fs/calls.log`.
 */
function plantFxFs(fx: ReplayFixture): { log: string } {
  const dir = `${fx.base}/fx-fs`;
  mkdirSync(dir, { recursive: true });
  const log = `${dir}/calls.log`;
  writeFileSync(
    `${dir}/server.mjs`,
    [
      'import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";',
      'import { dirname, resolve } from "node:path";',
      'import { createInterface } from "node:readline";',
      `const LOG = ${JSON.stringify(log)};`,
      "const send = (m) => process.stdout.write(JSON.stringify({ jsonrpc: \"2.0\", ...m }) + \"\\n\");",
      "createInterface({ input: process.stdin }).on(\"line\", (line) => {",
      "  let msg; try { msg = JSON.parse(line); } catch { return; }",
      "  if (msg.id === undefined) return;",
      "  if (msg.method === \"initialize\") send({ id: msg.id, result: { protocolVersion: msg.params?.protocolVersion ?? \"2025-06-18\", capabilities: { tools: {} }, serverInfo: { name: \"fx-fs\", version: \"1.0.0\" } } });",
      "  else if (msg.method === \"tools/list\") send({ id: msg.id, result: { tools: [{ name: \"write_file\", description: \"Writes any file.\", inputSchema: { type: \"object\", properties: { path: { type: \"string\" }, content: { type: \"string\" } }, required: [\"path\", \"content\"] } }] } });",
      "  else if (msg.method === \"tools/call\") {",
      "    appendFileSync(LOG, JSON.stringify(msg.params) + \"\\n\");",
      "    const p = resolve(String(msg.params?.arguments?.path ?? \"\")); mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, String(msg.params?.arguments?.content ?? \"\"));",
      "    send({ id: msg.id, result: { content: [{ type: \"text\", text: \"written\" }] } });",
      "  } else send({ id: msg.id, result: {} });",
      "});",
      "",
    ].join("\n"),
  );
  const config = { $schema: "https://opencode.ai/config.json", mcp: { "fx-fs": { type: "local", command: ["node", `${dir}/server.mjs`] } } };
  writeFileSync(`${fx.repo}/opencode.json`, JSON.stringify(config, null, 2) + "\n");
  return { log };
}

test("C002-TC-133 (C002-TS-133): the adopter's MCP tool fx-fs write_file is not available to sdd-spec-writer on OpenCode", async (t) => {
  const adapter = await openCodeHost(t);
  if (!adapter) return;
  const fx = buildReplayFixture(loadCorpora().path.corpus.fixture);
  try {
    const { log } = plantFxFs(fx);
    const target = `${fx.repo}/src/app.ts`;
    const before = readFileSync(target, "utf8");
    await adapter.setup(fx);
    try {
      const tool = "fx-fs_write_file";
      if (adapter.grants) assert.equal(adapter.grants("sdd-spec-writer", tool), false, "the package grants sdd-spec-writer no fx-fs tool");
      const c: CorpusCase = { id: "TS-133", category: "outside", tool, agent: "architect:sdd-spec-writer", path: "{repo}/src/app.ts", expect: "deny" };
      const input: ReplayInput = {
        id: c.id,
        corpus: "path",
        category: c.category,
        case: c,
        tool,
        caller: "sdd-spec-writer",
        cwd: fx.repo,
        path: target,
        field: "path",
        dialect: "bash",
        malformed: false,
        resolve: fx.resolvePath,
      };
      const d = await adapter.decide(input);
      assert.equal(d.actual, "deny", `the call is not carried out (${d.tool}${d.detail ? `: ${d.detail}` : ""})`);
    } finally {
      await adapter.teardown();
    }
    const calls = existsSync(log) ? readFileSync(log, "utf8").split("\n").filter((l) => l.includes("write_file")) : [];
    assert.deepEqual(calls, [], "fx-fs received no write_file call from the session");
    assert.equal(readFileSync(target, "utf8"), before, "src/app.ts is unchanged");
  } finally {
    fx.cleanup();
  }
});
