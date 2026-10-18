// C002-T-024 — the mapping tables of plugins/architect/targets/ (C002-IF-001, C002-COMP-002): both
// tables validate against the schema copy, their mode, tested versions and OpenCode models equal the
// spike records named in host.validated_by (C002-IF-009 §3), the table-only semantic rules of
// C002-IF-001 §5 hold, the fixture tables fx-tables validate, and a broken table fails with the JSON
// pointer of each error (ERR-GEN-004). The translator cases that read the tables (C002-TC-106,
// C002-TC-109, C002-TC-110) are written by C002-T-026 and C002-T-027.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import YAML from "yaml";
import { context, files, frontmatter, read, splitTools } from "../../../scripts/check/lib.mjs";
import pathCheck from "../../../scripts/check/path.mjs";
import { loadTable, loadTargetTable, TableError, TARGETS, targetsDir, toolGrants, validateTable, type MappingTable, type Mode } from "../../../scripts/generate/tables.ts";
import { repoRoot } from "../../helpers.ts";

const root = repoRoot();
const tables = Object.fromEntries(TARGETS.map((t) => [t, loadTargetTable(root, t)])) as Record<(typeof TARGETS)[number], MappingTable>;
const FIXTURES = join(root, "tests", "fixtures", "targets");

/** Frontmatter of a spike record. */
function record(path: string): Record<string, unknown> {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(readFileSync(join(root, ...path.split("/")), "utf8"));
  assert.ok(m, `${path}: no frontmatter`);
  return YAML.parse(m[1]!) as Record<string, unknown>;
}

/** Every mode a table entry may be written for: the table's own target modes. */
const MODES: Record<string, Mode[]> = { opencode: ["native-permissions", "sdd-mcp-server"], copilot: ["sdd-mcp-server", "copilot-hooks"] };

test("both tables validate against the schema copy", () => {
  for (const t of TARGETS) assert.deepEqual(validateTable(JSON.parse(readFileSync(join(targetsDir(root), `${t}.json`), "utf8")), t), [], t);
  assert.equal(tables.opencode.target, "opencode");
  assert.equal(tables.copilot.target, "copilot");
});

test("OpenCode: mode, tested version and models are those of the S-07 record", () => {
  const t = tables.opencode;
  assert.equal(t.host.validated_by, "docs/spikes/S-07-opencode.md");
  const r = record(t.host.validated_by) as { enforcement_mode: string; host_versions: { opencode: string; models: Record<string, string> } };
  assert.equal(t.enforcement_mode, r.enforcement_mode);
  assert.deepEqual(t.host.tested_versions, { opencode: r.host_versions.opencode });
  assert.deepEqual(t.models, r.host_versions.models);
});

test("Copilot: mode and tested versions are those of the S-08 record (VS Code Insiders, Copilot Chat)", () => {
  const t = tables.copilot;
  assert.equal(t.host.validated_by, "docs/spikes/S-08-copilot-vscode.md");
  const r = record(t.host.validated_by) as { enforcement_mode: string; host_versions: Record<string, string>; outcomes: { terminal_dialect: string } };
  assert.equal(t.enforcement_mode, r.enforcement_mode);
  assert.deepEqual(t.host.tested_versions, { vscode: r.host_versions["vscode-insiders"], "copilot-chat": r.host_versions["copilot-chat"] });
  const bash = t.hook_tool_classes?.terminal.find((c) => c.tool === "Bash");
  assert.equal(bash?.dialect, r.outcomes.terminal_dialect);
});

test("every tool of every source agent has a tools entry covering the table's mode (C002-IF-001 §5)", () => {
  const agents = (files(join(root, "plugins", "architect", "agents")) as string[]).filter((p) => p.endsWith(".md"));
  const names = new Set<string>();
  for (const a of agents) for (const n of splitTools(frontmatter(read(a)).data.tools ?? "")) if (!n.startsWith("Agent(") && !n.startsWith("mcp__")) names.add(n);
  assert.ok(names.size > 10);
  for (const t of TARGETS) {
    for (const n of names) {
      const e = tables[t].tools[n];
      assert.ok(e !== undefined, `${t}: no tools entry for ${n}`);
      assert.ok(toolGrants(e, tables[t].enforcement_mode) !== undefined, `${t}: ${n} has no entry for ${tables[t].enforcement_mode}`);
    }
  }
});

test("table-only semantic rules of C002-IF-001 §5 hold in every mode of each target", () => {
  for (const t of TARGETS) {
    const tb = tables[t];
    for (const mode of MODES[t]!) {
      for (const [n, e] of Object.entries(tb.tools)) assert.ok(toolGrants(e, mode) !== undefined, `${t}/${mode}: tool ${n}`);
      for (const c of tb.constructs) {
        const r = "replace" in c.action ? c.action.replace : undefined;
        if (r !== undefined && typeof r !== "string") assert.ok(r.by_mode[mode] !== undefined, `${t}/${mode}: construct ${c.id}`);
      }
    }
    // Write, Edit and Bash map to the sdd MCP server profiles under sdd-mcp-server.
    for (const n of ["Write", "Edit", "Bash"]) {
      const g = toolGrants(tb.tools[n]!, "sdd-mcp-server") ?? [];
      assert.ok(g.length > 0 && g.every((x) => x.startsWith(n === "Bash" ? "sdd-shell" : "sdd-files")), `${t}: ${n} under sdd-mcp-server: ${g.join(", ")}`);
    }
    // sdd-files and sdd-shell: sdd-mcp-server on both targets, also copilot-hooks on Copilot.
    for (const s of ["sdd-files", "sdd-shell"]) assert.deepEqual([...tb.mcp_servers[s]!.modes].sort(), t === "copilot" ? ["copilot-hooks", "sdd-mcp-server"] : ["sdd-mcp-server"], `${t}: ${s}`);
    // The Serena entry runs sdd serena-launch with the fixed leading arguments and a --context (TGT-SERENA-001).
    const serena = tb.mcp_servers["serena"]!;
    assert.equal(serena.command, "sdd");
    assert.deepEqual(serena.args?.slice(0, 5), ["serena-launch", "--user-data", "--read-only", "--", "start-mcp-server"]);
    const ci = serena.args?.indexOf("--context") ?? -1;
    assert.ok(ci > 0 && typeof serena.args?.[ci + 1] === "string" && serena.args[ci + 1] !== "", `${t}: serena --context`);
    // Construct ids unique, detectors valid ECMAScript expressions with flag u.
    assert.equal(new Set(tb.constructs.map((c) => c.id)).size, tb.constructs.length, `${t}: construct ids`);
    for (const c of tb.constructs) assert.doesNotThrow(() => new RegExp(c.detect, "u"), `${t}: construct ${c.id}`);
    assert.equal(new Set(tb.variants.map((v) => v.id)).size, tb.variants.length, `${t}: variant ids`);
    // ${CLAUDE_PLUGIN_ROOT} is accepted in no context (C002-REQ-326 on Copilot; bodies on OpenCode).
    assert.deepEqual(tb.variables["${CLAUDE_PLUGIN_ROOT}"], { body: null, "hook-command": null, "mcp-config": null }, t);
    const pr = tb.constructs.find((c) => c.id === "plugin-root");
    assert.deepEqual(pr?.accepted_in, [], `${t}: plugin-root accepted_in`);
  }
  // OpenCode: permissions.<mode>.question is deny or absent (the conductor's allow is written per agent).
  for (const [mode, set] of Object.entries(tables.opencode.permissions ?? {})) assert.ok(set["question"] === undefined || set["question"] === "deny", `opencode/${mode}: question`);
  // Copilot: ${PLUGIN_ROOT} is detected too (S-08 fact F-3); MCP names <server>-<tool>, deferred, per server.
  const pr = new RegExp(tables.copilot.constructs.find((c) => c.id === "plugin-root")!.detect, "u");
  assert.ok(pr.test("node ${PLUGIN_ROOT}/x") && pr.test("${CLAUDE_PLUGIN_ROOT}/serena/x.yml"));
  assert.deepEqual(tables.copilot.mcp_tool_names, { source_pattern: "mcp__plugin_architect_{server}__{tool}", target_pattern: "{server}-{tool}", grant_pattern: "{server}/{tool}", grant: "per-server", deferred: true });
  assert.ok(tables.copilot.tools["AskUserQuestion"]?.toString() === "ask_user");
});

test("no machine path in any table (PLG-PATH-001)", () => {
  const ctx = context({ repo: root });
  const found = (pathCheck.check(ctx) as { path: string }[]).filter((f) => f.path.startsWith("plugins/architect/targets/"));
  assert.deepEqual(found, []);
});

test("the fixture tables fx-tables validate, one per mode of each target", () => {
  const names = readdirSync(FIXTURES).filter((n) => n.endsWith(".json")).sort();
  for (const [t, modes] of Object.entries(MODES)) for (const m of modes) assert.ok(names.includes(`${t}-${m}.json`), `${t}-${m}.json`);
  for (const n of names) assert.equal(loadTable(join(FIXTURES, n), n).target, n.startsWith("copilot") ? "copilot" : "opencode", n);
  // The gap fixture lacks a tools entry on purpose (ERR-GEN-001 rows of C002-T-026, C002-T-027).
  assert.equal(loadTable(join(FIXTURES, "opencode-gap-no-lsp.json")).tools["LSP"], undefined);
});

test("a broken table fails with the JSON pointer of each error (ERR-GEN-004)", () => {
  const dir = mkdtempSync(join(tmpdir(), "sdd-tables-"));
  try {
    const bad = JSON.parse(JSON.stringify(tables.copilot)) as Record<string, unknown> & { models: Record<string, unknown>; mcp_tool_names: Record<string, unknown> };
    bad.models.opus = "";
    bad.mcp_tool_names.target_pattern = "{server}/{tool}";
    bad["permissions"] = { "native-permissions": { edit: "deny", bash: "deny" }, "sdd-mcp-server": { edit: "deny", bash: "deny" } };
    const p = join(dir, "copilot.json");
    writeFileSync(p, JSON.stringify(bad));
    let err: unknown;
    try {
      loadTable(p, "copilot.json");
    } catch (e) {
      err = e;
    }
    assert.ok(err instanceof TableError, "TableError thrown");
    assert.equal(err.code, "ERR-GEN-004");
    const msgs = err.messages;
    assert.ok(msgs.every((m) => /^copilot\.json: \/\S*: \S/.test(m)), msgs.join("\n"));
    assert.ok(msgs.some((m) => m.startsWith("copilot.json: /models/opus: ")), msgs.join("\n"));
    assert.ok(msgs.some((m) => m.startsWith("copilot.json: /mcp_tool_names/target_pattern: ")), msgs.join("\n"));
    // Unreadable JSON is ERR-GEN-004 too, at the root pointer.
    writeFileSync(p, "{ not json");
    assert.throws(() => loadTable(p, "copilot.json"), (e: unknown) => e instanceof TableError && /^copilot\.json: \/: /.test(e.messages[0] ?? ""));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
