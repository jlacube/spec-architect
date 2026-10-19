// `sdd host-version opencode|vscode|vscode-insiders [--json]` (C002-T-014, C002-IF-007, C002-REQ-508):
// the bundled CLI runs the host shims of tests/fixtures/cfg-hosts/bin and cfg-vscode-no-chat/bin with
// PATH restricted to that folder; the user settings folders point into the throwaway workspace.
import { test } from "node:test";
import assert from "node:assert/strict";
import { chmodSync, copyFileSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { repoRoot } from "../../helpers.ts";
import { makeWorkspace, runBundled, type Result } from "./helpers.ts";

const FIXTURES = join(repoRoot(), "tests", "fixtures");
const HOSTS_BIN = join(FIXTURES, "cfg-hosts", "bin");
const NO_CHAT_BIN = join(FIXTURES, "cfg-vscode-no-chat", "bin");
const WIN = process.platform === "win32";

// The sh shims need the executable bit outside Windows (git on Windows may not record it).
if (!WIN) for (const dir of [HOSTS_BIN, NO_CHAT_BIN]) for (const f of readdirSync(dir)) if (!f.endsWith(".cmd")) chmodSync(join(dir, f), 0o755);

/** Runs host-version in `cwd` with PATH set to `bin` and the user settings under `<cwd>/profile`. */
function hostVersion(args: string[], cwd: string, bin: string): Result {
  const profile = join(cwd, "profile");
  const env: Record<string, string | undefined> = {};
  for (const k of Object.keys(process.env)) if (/^path$/i.test(k)) env[k] = undefined;
  Object.assign(env, { PATH: bin, APPDATA: join(profile, "AppData", "Roaming"), HOME: profile, USERPROFILE: profile, XDG_CONFIG_HOME: join(profile, ".config") });
  return runBundled(["host-version", ...args], { cwd, env });
}

/** The user settings file of VS Code (`Code`) or VS Code Insiders (`Code - Insiders`) for this platform. */
function userSettings(product: "Code" | "Code - Insiders"): string {
  const base = WIN ? "profile/AppData/Roaming" : process.platform === "darwin" ? "profile/Library/Application Support" : "profile/.config";
  return `${base}/${product}/User/settings.json`;
}

function workspace(files: Record<string, string> = {}) {
  return makeWorkspace({ ".git/HEAD": "ref: refs/heads/main\n", ...files });
}

test("host-version opencode prints `opencode <version>` and exits 0", () => {
  const ws = workspace();
  try {
    const r = hostVersion(["opencode"], ws.root, HOSTS_BIN);
    assert.equal(r.stderr, "");
    assert.equal(r.stdout, "opencode 1.4.2\n");
    assert.equal(r.code, 0);
    const j = hostVersion(["opencode", "--json"], ws.root, HOSTS_BIN);
    assert.deepEqual(JSON.parse(j.stdout), { host: "opencode", versions: { opencode: "1.4.2" } });
    assert.equal(j.code, 0);
  } finally {
    ws.cleanup();
  }
});

test("host-version vscode prints the VS Code and Copilot Chat versions and the hooks state of the workspace settings", () => {
  const ws = workspace({ ".vscode/settings.json": '{\n  // hooks for the guard\n  "chat.useHooks": true, /* trailing comma */\n}\n', [userSettings("Code")]: '{ "chat.useHooks": false }' });
  try {
    const r = hostVersion(["vscode"], ws.root, HOSTS_BIN);
    assert.equal(r.stderr, "");
    assert.equal(r.stdout, "vscode 1.105.1\ncopilot-chat 0.32.4\nhooks enabled\n");
    assert.equal(r.code, 0);
    const j = hostVersion(["vscode", "--json"], ws.root, HOSTS_BIN);
    assert.deepEqual(JSON.parse(j.stdout), { host: "vscode", versions: { vscode: "1.105.1", "copilot-chat": "0.32.4" }, hooks: { state: "enabled" } });
  } finally {
    ws.cleanup();
  }
});

test("the hooks line: user settings false is disabled (chat.useHooks); no setting anywhere is unknown, never enabled", () => {
  const off = workspace({ [userSettings("Code")]: '{ "chat.useHooks": false }' });
  const none = workspace({ ".vscode/settings.json": '{ "editor.tabSize": 2 }' });
  const broken = workspace({ ".vscode/settings.json": '{ "chat.useHooks": tru' });
  try {
    assert.equal(hostVersion(["vscode"], off.root, HOSTS_BIN).stdout, "vscode 1.105.1\ncopilot-chat 0.32.4\nhooks disabled (chat.useHooks)\n");
    assert.deepEqual(JSON.parse(hostVersion(["vscode", "--json"], off.root, HOSTS_BIN).stdout).hooks, { state: "disabled", source: "chat.useHooks" });
    for (const ws of [none, broken]) {
      const r = hostVersion(["vscode"], ws.root, HOSTS_BIN);
      assert.equal(r.stdout, "vscode 1.105.1\ncopilot-chat 0.32.4\nhooks unknown\n");
      assert.equal(r.code, 0);
    }
  } finally {
    off.cleanup();
    none.cleanup();
    broken.cleanup();
  }
});

// C002-TS-526 rows (revised for critic CR-45): an unusable workspace file is unknown without reading the user settings.
for (const [label, text] of [
  ["a workspace file that cannot be parsed", '{ "chat.useHooks": tru'],
  ['a workspace file with "chat.useHooks": "yes"', '{ "chat.useHooks": "yes" }'],
  ["a workspace file without an object at its top level", "[true]"],
] as const) {
  test(`C002-TS-526 — the hooks line: ${label} beside user settings with true is hooks unknown`, () => {
    const ws = workspace({ ".vscode/settings.json": text, [userSettings("Code")]: '{ "chat.useHooks": true }' });
    try {
      const r = hostVersion(["vscode"], ws.root, HOSTS_BIN);
      assert.equal(r.stdout, "vscode 1.105.1\ncopilot-chat 0.32.4\nhooks unknown\n");
      assert.equal(r.code, 0);
      assert.deepEqual(JSON.parse(hostVersion(["vscode", "--json"], ws.root, HOSTS_BIN).stdout).hooks, { state: "unknown" });
    } finally {
      ws.cleanup();
    }
  });
}

test("C002-TS-526 — the hooks line: a workspace folder at .vscode/settings.json (cannot be read) beside user settings with true is hooks unknown", () => {
  const ws = workspace({ ".vscode/settings.json/.keep": "", [userSettings("Code")]: '{ "chat.useHooks": true }' });
  try {
    assert.equal(hostVersion(["vscode"], ws.root, HOSTS_BIN).stdout, "vscode 1.105.1\ncopilot-chat 0.32.4\nhooks unknown\n");
  } finally {
    ws.cleanup();
  }
});

test("C002-TS-526 — the hooks line: a missing workspace file, or one without the key, falls back to the user settings", () => {
  const missing = workspace({ [userSettings("Code")]: '{ "chat.useHooks": true }' });
  const noKey = workspace({ ".vscode/settings.json": '{ "editor.tabSize": 2 }', [userSettings("Code")]: '{ "chat.useHooks": true }' });
  const noKeyOff = workspace({ ".vscode/settings.json": "{}", [userSettings("Code")]: '{ "chat.useHooks": false }' });
  try {
    for (const ws of [missing, noKey]) assert.equal(hostVersion(["vscode"], ws.root, HOSTS_BIN).stdout, "vscode 1.105.1\ncopilot-chat 0.32.4\nhooks enabled\n");
    assert.equal(hostVersion(["vscode"], noKeyOff.root, HOSTS_BIN).stdout, "vscode 1.105.1\ncopilot-chat 0.32.4\nhooks disabled (chat.useHooks)\n");
  } finally {
    missing.cleanup();
    noKey.cleanup();
    noKeyOff.cleanup();
  }
});

test("C002-TS-526 — the hooks line: user settings that cannot be parsed or hold another value are hooks unknown", () => {
  const broken = workspace({ [userSettings("Code")]: '{ "chat.useHooks": tru' });
  const other = workspace({ [userSettings("Code")]: '{ "chat.useHooks": "yes" }' });
  try {
    for (const ws of [broken, other]) assert.equal(hostVersion(["vscode"], ws.root, HOSTS_BIN).stdout, "vscode 1.105.1\ncopilot-chat 0.32.4\nhooks unknown\n");
  } finally {
    broken.cleanup();
    other.cleanup();
  }
});

test("host-version vscode-insiders runs code-insiders and reads the Insiders user settings, with the same lines", () => {
  const ws = workspace({ [userSettings("Code - Insiders")]: '{ "chat.useHooks": true }', [userSettings("Code")]: '{ "chat.useHooks": false }' });
  try {
    const r = hostVersion(["vscode-insiders"], ws.root, HOSTS_BIN);
    assert.equal(r.stdout, "vscode 1.142.0-insider\ncopilot-chat 0.35.3\nhooks enabled\n");
    assert.equal(r.code, 0);
    assert.equal(JSON.parse(hostVersion(["vscode-insiders", "--json"], ws.root, HOSTS_BIN).stdout).host, "vscode-insiders");
  } finally {
    ws.cleanup();
  }
});

test("VS Code without the GitHub Copilot Chat extension prints `copilot-chat missing`", () => {
  const ws = workspace();
  try {
    const r = hostVersion(["vscode"], ws.root, NO_CHAT_BIN);
    assert.equal(r.stdout, "vscode 1.105.1\ncopilot-chat missing\nhooks unknown\n");
    assert.equal(r.code, 0);
    assert.equal(JSON.parse(hostVersion(["vscode", "--json"], ws.root, NO_CHAT_BIN).stdout).versions["copilot-chat"], null);
  } finally {
    ws.cleanup();
  }
});

test("a host not found on PATH prints `<host> missing` and exits 1", () => {
  const ws = workspace({ "empty-bin/.keep": "" });
  try {
    const bin = join(ws.root, "empty-bin");
    for (const [host, line] of [["opencode", "opencode missing\n"], ["vscode", "vscode missing\n"], ["vscode-insiders", "vscode missing\n"]] as const) {
      const r = hostVersion([host], ws.root, bin);
      assert.equal(r.stdout, line, host);
      assert.equal(r.stderr, "", host);
      assert.equal(r.code, 1, host);
    }
    const j = hostVersion(["opencode", "--json"], ws.root, bin);
    assert.deepEqual(JSON.parse(j.stdout), { host: "opencode", versions: { opencode: null } });
    assert.equal(j.code, 1);
  } finally {
    ws.cleanup();
  }
});

test("an unknown host is a usage error (ERR-CLI-003, exit 2)", () => {
  const ws = workspace();
  try {
    const r = hostVersion(["claude-code"], ws.root, HOSTS_BIN);
    assert.equal(r.code, 2);
    assert.match(r.stderr, /^ERR-CLI-003: Usage error: `<host> must be one of opencode, vscode, vscode-insiders: claude-code`/);
  } finally {
    ws.cleanup();
  }
});

test("on Windows a host installed only as a `.cmd` shim is found and run", { skip: !WIN && "Windows only" }, () => {
  const ws = workspace();
  try {
    const bin = join(ws.root, "cmd-bin");
    mkdirSync(bin);
    for (const f of ["opencode.cmd", "code.cmd"]) copyFileSync(join(HOSTS_BIN, f), join(bin, f));
    assert.equal(hostVersion(["opencode"], ws.root, bin).stdout, "opencode 1.4.2\n");
    assert.equal(hostVersion(["vscode"], ws.root, bin).stdout, "vscode 1.105.1\ncopilot-chat 0.32.4\nhooks unknown\n");
  } finally {
    ws.cleanup();
  }
});
