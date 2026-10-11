// Fixture workspaces for eval runs (C001-T-029): every run gets a fresh copy, so runs never share
// state and never see this repository (its context and memory would leak into the session).
import { execFileSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { generateLarge } from "../../tests/fixtures/gen-large.mjs";

export const ROOT = join(import.meta.dirname, "..", "..");

function git(cwd, ...args) {
  execFileSync("git", ["-c", "user.name=fixture", "-c", "user.email=fixture@example.invalid", "-c", "commit.gpgsign=false", ...args], { cwd, stdio: "ignore" });
}

/**
 * Builds a fixture into a new temporary directory and returns `{ root, cleanup }`.
 * `fixture` is a fixture name (fx-empty, fx-bootstrap, fx-brownfield-ts, fx-large), a directory to
 * copy, a function that fills the empty directory, or null for an empty directory.
 */
export function makeWorkspace(fixture) {
  const root = realpathSync.native(mkdtempSync(join(tmpdir(), "sdd-eval-")));
  // On Windows the session's child processes can hold the directory for a moment after the run.
  const cleanup = () => {
    try {
      rmSync(root, { recursive: true, force: true, maxRetries: 20, retryDelay: 250 });
    } catch (e) {
      console.warn(`could not remove ${root}: ${e instanceof Error ? e.message : String(e)}`);
    }
  };
  try {
    if (typeof fixture === "function") fixture(root);
    else if (fixture === "fx-empty") git(root, "init", "-q");
    else if (fixture === "fx-bootstrap") {
      // This repository's workspace (metrics/ excluded) in a git repository of its own.
      cpSync(join(ROOT, ".sdd"), join(root, ".sdd"), { recursive: true, filter: (src) => !src.includes(join(".sdd", "metrics")) });
      git(root, "init", "-q");
    }
    else if (fixture === "fx-brownfield-ts") {
      cpSync(join(ROOT, "tests", "fixtures", "fx-brownfield-ts"), root, { recursive: true });
      git(root, "init", "-q");
      git(root, "add", ".");
      git(root, "commit", "-q", "-m", "initial service");
      const payments = join(root, "src", "checkout", "payments.ts");
      for (let i = 1; i <= 6; i++) {
        writeFileSync(payments, readFileSync(payments, "utf8") + `\n// revision ${i}: adjust capture rules\n`);
        git(root, "commit", "-q", "-am", `payments: revision ${i}`);
      }
    } else if (fixture === "fx-large") generateLarge(root);
    else if (typeof fixture === "string") cpSync(fixture, root, { recursive: true });
    return { root, cleanup };
  } catch (e) {
    cleanup();
    throw e;
  }
}
