// The built-in GitHub Copilot Chat of `sdd host-version vscode|vscode-insiders` (C002-IF-007 §Output,
// revised for defect D-047): the folders read from the `code` match and the commit of `--version`, on the
// install layouts of tests/fixtures/cfg-vscode-builtin-chat (Windows commit-prefixed, VS Code Insiders with
// stale commit folders beside the current one, macOS app bundle, Linux /usr/share/code, and a package that
// is not GitHub Copilot Chat).
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { builtinCopilotChat, builtinCopilotDirs, compareVersions, parseCommit, pickCopilotChat, readCopilotChatPackage } from "../../../src/cli/host-version.ts";
import { repoRoot } from "../../helpers.ts";

const FX = join(repoRoot(), "tests", "fixtures", "cfg-vscode-builtin-chat");
const STABLE_COMMIT = "c4453f8ea430795f941c1b2ff6c9321135a74a02";
const INSIDERS_COMMIT = "29ce94ad8d36c62affc08484e262d5c4fbdd0b3d";

test("parseCommit reads the 40-digit commit on the second non-empty line of `code --version`", () => {
  assert.equal(parseCommit(`1.145.2\r\n${STABLE_COMMIT}\r\nx64\r\n`), STABLE_COMMIT);
  assert.equal(parseCommit(`\n1.146.0-insider\n${INSIDERS_COMMIT.toUpperCase()}\nx64\n`), INSIDERS_COMMIT);
  assert.equal(parseCommit("1.145.2\n"), null);
  assert.equal(parseCommit("1.145.2\nnot-a-commit\nx64\n"), null);
  assert.equal(parseCommit("1.145.2\nc4453f8ea4\nx64\n"), null, "a short commit is not a commit");
});

test("builtinCopilotDirs: the commit-prefixed folder first, then the install's resources/app and extensions folders", () => {
  const match = join(FX, "win", "bin", "code.cmd");
  assert.deepEqual(builtinCopilotDirs(match, STABLE_COMMIT), [
    join(FX, "win", "c4453f8ea4", "resources", "app", "extensions", "copilot"),
    join(FX, "win", "resources", "app", "extensions", "copilot"),
    join(FX, "win", "extensions", "copilot"),
  ]);
  assert.deepEqual(builtinCopilotDirs(match, null), [join(FX, "win", "resources", "app", "extensions", "copilot"), join(FX, "win", "extensions", "copilot")]);
});

test("Windows layout: <install>/<commit prefix>/resources/app/extensions/copilot of the probed commit, not another commit folder", () => {
  assert.equal(builtinCopilotChat(join(FX, "win", "bin", "code.cmd"), STABLE_COMMIT), "0.73.0");
  assert.equal(builtinCopilotChat(join(FX, "win", "bin", "code"), STABLE_COMMIT), "0.73.0");
  // Without the commit, the stale 0123456789 folder (0.72.0) is never read.
  assert.equal(builtinCopilotChat(join(FX, "win", "bin", "code.cmd"), null), null);
  assert.equal(builtinCopilotChat(join(FX, "win", "bin", "code.cmd"), "0123456789abcdef0123456789abcdef01234567"), "0.72.0");
});

test("VS Code Insiders: the folder of the current commit among stale ones", () => {
  assert.equal(builtinCopilotChat(join(FX, "insiders", "bin", "code-insiders.cmd"), INSIDERS_COMMIT), "0.74.2026110608");
  assert.equal(builtinCopilotChat(join(FX, "insiders", "bin", "code-insiders"), "206844b553" + "0".repeat(30)), "0.73.2026102902");
});

test("macOS layout: <app>/extensions/copilot beside Contents/Resources/app/bin/code", () => {
  assert.equal(builtinCopilotChat(join(FX, "mac", "Visual Studio Code.app", "Contents", "Resources", "app", "bin", "code"), STABLE_COMMIT), "0.73.0");
});

test("Linux layout: /usr/share/code/resources/app/extensions/copilot beside /usr/share/code/bin/code", () => {
  assert.equal(builtinCopilotChat(join(FX, "linux", "share", "code", "bin", "code"), STABLE_COMMIT), "0.73.0");
});

test("a package that is not GitHub Copilot Chat, or no package, gives no version", () => {
  assert.equal(readCopilotChatPackage(join(FX, "not-github", "resources", "app", "extensions", "copilot")), null);
  assert.equal(builtinCopilotChat(join(FX, "not-github", "bin", "code"), STABLE_COMMIT), null);
  assert.equal(readCopilotChatPackage(join(FX, "win", "resources", "app", "extensions", "copilot")), null);
});

test("a symbolic link to the launcher (/usr/local/bin/code, /usr/bin/code) resolves to the install", { skip: process.platform === "win32" && "symbolic links need a privilege on Windows" }, () => {
  const dir = mkdtempSync(join(tmpdir(), "sdd-hv-link-"));
  try {
    mkdirSync(join(dir, "bin"));
    symlinkSync(join(FX, "linux", "share", "code", "bin", "code"), join(dir, "bin", "code"));
    symlinkSync(join(FX, "mac", "Visual Studio Code.app", "Contents", "Resources", "app", "bin", "code"), join(dir, "bin", "code-mac"));
    assert.equal(builtinCopilotChat(join(dir, "bin", "code"), STABLE_COMMIT), "0.73.0");
    assert.equal(builtinCopilotChat(join(dir, "bin", "code-mac"), STABLE_COMMIT), "0.73.0");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("CR-151: pickCopilotChat takes the installed entry only when it is at least the built-in version", () => {
  assert.equal(pickCopilotChat("0.74.0", "0.73.0"), "0.74.0");
  assert.equal(pickCopilotChat("0.73.0", "0.73.0"), "0.73.0");
  assert.equal(pickCopilotChat("0.72.9", "0.73.0"), "0.73.0");
  assert.equal(pickCopilotChat("0.73.0", "0.73.0-pre"), "0.73.0");
  assert.equal(pickCopilotChat("0.73.0-pre", "0.73.0"), "0.73.0");
  assert.equal(pickCopilotChat("0.74.2026110608", "0.74.2026110502"), "0.74.2026110608");
  assert.equal(pickCopilotChat(null, "0.73.0"), "0.73.0");
  assert.equal(pickCopilotChat("0.73.0", null), "0.73.0");
  assert.equal(pickCopilotChat(null, null), null);
  assert.ok(compareVersions("0.10.0", "0.9.9") > 0, "numeric, not text, order");
});
