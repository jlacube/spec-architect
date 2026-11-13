// C002-T-084 (C002-IF-010 §2.1 `mcpOverrides`, revised for defect D-057 and critic CR-195): the case field
// `{ <server>: <url> | false }` on every host, offline. Claude Code: the overlay copy of the plugin whose
// `.mcp.json` has the URL replaced or the server removed, on top of the overlay the row's machine
// configuration gives; OpenCode: `"enabled": false` for `false`, the URL replaced otherwise, in the merged
// `opencode.json`; Copilot CLI: the entry left out of the `--additional-mcp-config` servers file, the URL
// replaced otherwise; a server the configuration does not declare ends the row before any session with
// exit code 1 (`run.mjs` `main`). No host process starts and nothing is billed.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { main } from "../../../evals/harness/run.mjs";
import { applyMcpServerOverrides, architectWithStubs, architectWithout, architectWithUrls, declaredMcpServers, mcpOverridesProblem, pluginsWithOverrides } from "../../../evals/harness/overlay.mjs";
import { placePackage } from "../../../evals/harness/runners/opencode.mjs";
import { serversConfig } from "../../../evals/harness/runners/copilot-cli.mjs";
import { repoRoot } from "../../helpers.ts";

const ROOT = repoRoot();
const mcpOf = (dir: string) => JSON.parse(readFileSync(join(dir, ".mcp.json"), "utf8")).mcpServers as Record<string, { url?: string }>;

test("declaredMcpServers: the Claude Code plugin's .mcp.json, the OpenCode and Copilot mapping tables", () => {
  assert.deepEqual(declaredMcpServers("claude-code").sort(), Object.keys(JSON.parse(readFileSync(join(ROOT, "plugins", "architect", ".mcp.json"), "utf8")).mcpServers).sort());
  for (const [host, target] of [["opencode", "opencode"], ["copilot-cli", "copilot"]] as const) {
    const servers = declaredMcpServers(host);
    assert.deepEqual(servers, Object.keys(JSON.parse(readFileSync(join(ROOT, "plugins", "architect", "targets", `${target}.json`), "utf8")).mcp_servers));
    assert.ok(servers.includes("context7") && servers.includes("deepwiki"), host);
  }
});

test("mcpOverridesProblem: a URL or false for a declared server; an undeclared server or another value is a problem", () => {
  const declared = ["context7", "deepwiki", "serena"];
  assert.equal(mcpOverridesProblem(undefined, declared), null);
  assert.equal(mcpOverridesProblem({ deepwiki: "http://127.0.0.1:47391/mcp", context7: false }, declared), null);
  assert.equal(mcpOverridesProblem({ deepwiki: "https://deepwiki-unreachable.invalid/mcp" }, declared), null);
  assert.match(String(mcpOverridesProblem({ deepwki: false }, declared)), /names the server "deepwki", which the session's configuration does not declare/);
  assert.match(String(mcpOverridesProblem({ deepwiki: true }, declared)), /a URL \(http or https\) or false/);
  assert.match(String(mcpOverridesProblem({ deepwiki: "ftp://x" }, declared)), /a URL \(http or https\) or false/);
  assert.match(String(mcpOverridesProblem(["deepwiki"], declared)), /must be an object/);
});

test("applyMcpServerOverrides: the URL replaced, false removes the server, an undeclared server throws", () => {
  const servers = { context7: { type: "http", url: "https://mcp.context7.com/mcp" }, deepwiki: { type: "http", url: "https://mcp.deepwiki.com/mcp" } };
  applyMcpServerOverrides(servers, { deepwiki: "http://127.0.0.1:47392/mcp", context7: false });
  assert.deepEqual(servers, { deepwiki: { type: "http", url: "http://127.0.0.1:47392/mcp" } });
  assert.throws(() => applyMcpServerOverrides({ deepwiki: { url: "x" } }, { nope: false }), /does not declare/);
});

test("Claude Code: the overlay copy carries the overrides on top of the machine configuration's overlay", () => {
  // The cfg-full overlay (stand-ins) with DeepWiki off; the cfg-bare overlay (no serena) with a stub URL.
  const [off] = pluginsWithOverrides([architectWithStubs], { deepwiki: false }) as (() => string)[];
  const offMcp = mcpOf(off!());
  assert.ok(!("deepwiki" in offMcp) && "context7" in offMcp && "serena" in offMcp, JSON.stringify(Object.keys(offMcp)));
  const [stub] = pluginsWithOverrides([architectWithout("serena")], { deepwiki: "http://127.0.0.1:47391/mcp" }) as (() => string)[];
  const stubMcp = mcpOf(stub!());
  assert.equal(stubMcp["deepwiki"]?.url, "http://127.0.0.1:47391/mcp");
  assert.ok(!("serena" in stubMcp), "the configuration's own omission is kept");
  // A row override wins over the configuration's URL; false over the configuration's URL removes the server.
  const [down] = pluginsWithOverrides([architectWithUrls({ deepwiki: "https://deepwiki-unreachable.invalid/mcp" })], { deepwiki: false }) as (() => string)[];
  assert.ok(!("deepwiki" in mcpOf(down!())));
  // The source plugin folder by path is replaced by an overlay too; no overrides leave the list as it is.
  const [src] = pluginsWithOverrides([join(ROOT, "plugins", "architect")], { context7: false }) as (() => string)[];
  assert.equal(typeof src, "function");
  assert.ok(!("context7" in mcpOf(src!())));
  const list = [architectWithStubs];
  assert.equal(pluginsWithOverrides(list, undefined), list);
  // The source plugin itself is never changed.
  assert.ok("deepwiki" in mcpOf(join(ROOT, "plugins", "architect")) && "context7" in mcpOf(join(ROOT, "plugins", "architect")));
});

/** A minimal generated OpenCode package: `.opencode/` and an `opencode.json` with the remote servers. */
function openCodePackage(base: string): string {
  const pkg = join(base, "pkg");
  mkdirSync(join(pkg, ".opencode", "agents"), { recursive: true });
  writeFileSync(join(pkg, ".opencode", "agents", "sdd-researcher.md"), "---\nname: sdd-researcher\n---\n");
  writeFileSync(
    join(pkg, "opencode.json"),
    JSON.stringify({ mcp: { context7: { type: "remote", url: "https://mcp.context7.com/mcp" }, deepwiki: { type: "remote", url: "https://mcp.deepwiki.com/mcp" } } }),
  );
  return pkg;
}

test("OpenCode: false gives the server's entry \"enabled\": false, a URL replaces its URL, an undeclared server throws", () => {
  const base = mkdtempSync(join(tmpdir(), "sdd-mcpov-oc-"));
  try {
    const pkg = openCodePackage(base);
    const project = join(base, "project");
    mkdirSync(project);
    const merged = placePackage(project, pkg, join(ROOT, "plugins", "architect", "scripts"), { context7: false, deepwiki: "http://127.0.0.1:47391/mcp" }) as { mcp: Record<string, Record<string, unknown>> };
    assert.deepEqual(merged.mcp["context7"], { type: "remote", url: "https://mcp.context7.com/mcp", enabled: false });
    assert.deepEqual(merged.mcp["deepwiki"], { type: "remote", url: "http://127.0.0.1:47391/mcp" });
    assert.deepEqual(JSON.parse(readFileSync(join(project, "opencode.json"), "utf8")).mcp, merged.mcp, "written to the project's opencode.json");
    const other = join(base, "other");
    mkdirSync(other);
    assert.throws(() => placePackage(other, pkg, join(ROOT, "plugins", "architect", "scripts"), { nope: false }), /mcpOverrides names the server "nope"/);
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("Copilot CLI: false leaves the entry out of the servers file, a URL replaces its URL, an undeclared server throws", () => {
  const base = mkdtempSync(join(tmpdir(), "sdd-mcpov-cp-"));
  try {
    mkdirSync(join(base, "install"));
    writeFileSync(
      join(base, "install", "mcp.json"),
      JSON.stringify({ servers: { context7: { type: "http", url: "https://mcp.context7.com/mcp" }, deepwiki: { type: "http", url: "https://mcp.deepwiki.com/mcp" } } }),
    );
    const scripts = join(ROOT, "plugins", "architect", "scripts");
    const off = serversConfig(base, scripts, { context7: false }).mcpServers as Record<string, unknown>;
    assert.ok(!("context7" in off), "context7 left out");
    assert.deepEqual(off["deepwiki"], { type: "http", url: "https://mcp.deepwiki.com/mcp", tools: ["*"] });
    const url = serversConfig(base, scripts, { deepwiki: "http://127.0.0.1:47392/mcp" }).mcpServers as Record<string, unknown>;
    assert.deepEqual(url["deepwiki"], { type: "http", url: "http://127.0.0.1:47392/mcp", tools: ["*"] });
    assert.throws(() => serversConfig(base, scripts, { nope: false }), /mcpOverrides names the server "nope"/);
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("run.mjs: a row whose mcpOverrides names an undeclared server ends with exit code 1 before any session, on every host", async () => {
  const fx = mkdtempSync(join(tmpdir(), "sdd-mcpov-run-"));
  try {
    const file = join(fx, "evals", "targets", "doctor", "TS-999.eval.mjs");
    mkdirSync(join(file, ".."), { recursive: true });
    writeFileSync(
      file,
      `export default [
  { id: "TS-999-claude-code", host: "claude-code", title: "x", agent: "architect:sdd-conductor", fixture: null, prompt: "hi", mcpOverrides: { deepwki: false }, assert: () => { throw new Error("a session ran"); } },
  { id: "TS-999-opencode", host: "opencode", title: "x", agent: "architect:sdd-conductor", fixture: null, prompt: "hi", targetPackage: { target: "opencode" }, mcpOverrides: { context7: "not a url" }, assert: () => { throw new Error("a session ran"); } },
  { id: "TS-999-copilot-cli", host: "copilot-cli", title: "x", agent: "architect:sdd-conductor", fixture: null, prompt: "hi", mcpOverrides: { nope: "http://127.0.0.1:1/mcp" }, assert: () => { throw new Error("a session ran"); } },
];\n`,
    );
    const started: string[] = [];
    const runner = Object.assign(async () => {
      started.push("session");
      throw new Error("a session ran");
    }, {});
    for (const [host, re] of [
      ["claude-code", /TS-999-claude-code: mcpOverrides names the server "deepwki", which the session's configuration does not declare/],
      ["opencode", /TS-999-opencode: mcpOverrides gives "context7" "not a url": a URL \(http or https\) or false/],
      ["copilot-cli", /TS-999-copilot-cli: mcpOverrides names the server "nope"/],
    ] as const) {
      const out: string[] = [];
      const err: string[] = [];
      const code = await main([file, "--host", host], { log: (l: string) => out.push(l), error: (l: string) => err.push(l), root: fx, runners: { [host]: runner }, env: {} });
      assert.equal(code, 1, `${host}: ${err.join("\n")}`);
      assert.match(err.join("\n"), re);
      assert.match(err.join("\n"), /no session started/);
    }
    assert.deepEqual(started, [], "no session started");
  } finally {
    rmSync(fx, { recursive: true, force: true });
  }
});
