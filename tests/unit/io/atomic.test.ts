import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { AtomicWriteError, writeFileAtomic, writeTextAtomic } from "../../../src/io/atomic.ts";

function scratch(): string {
  return mkdtempSync(join(tmpdir(), "sdd-atomic-"));
}

test("writeFileAtomic creates and replaces files without leaving temp files", () => {
  const dir = scratch();
  try {
    const target = join(dir, "registry.json");
    writeFileAtomic(target, "first");
    writeFileAtomic(target, Buffer.from("second"));
    assert.equal(readFileSync(target, "utf8"), "second");
    assert.deepEqual(readdirSync(dir), ["registry.json"]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

for (const stage of ["write", "fsync", "rename"] as const) {
  test(`a failure at the ${stage} stage keeps the previous file and removes the temp file`, () => {
    const dir = scratch();
    try {
      const target = join(dir, "registry.json");
      writeFileSync(target, "previous content");
      assert.throws(
        () =>
          writeFileAtomic(target, "new content that is long enough", {
            fault: (s) => {
              if (s === stage) throw new Error(`injected ${s} fault`);
            },
          }),
        (e: unknown) => e instanceof AtomicWriteError && e.code === "ERR-CLI-017" && e.path === target,
      );
      assert.equal(readFileSync(target, "utf8"), "previous content");
      assert.deepEqual(readdirSync(dir), ["registry.json"]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
}

test("a failed first write leaves no target and no temp file", () => {
  const dir = scratch();
  try {
    const target = join(dir, "ids.json");
    assert.throws(
      () =>
        writeFileAtomic(target, "x", {
          fault: () => {
            throw new Error("boom");
          },
        }),
      AtomicWriteError,
    );
    assert.equal(existsSync(target), false);
    assert.deepEqual(readdirSync(dir), []);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("the error message follows the catalogue entry ERR-CLI-017", () => {
  const dir = scratch();
  try {
    const target = join(dir, "SDD.md");
    try {
      writeFileAtomic(target, "x", {
        fault: () => {
          throw new Error("disk full");
        },
      });
      assert.fail("expected a throw");
    } catch (e) {
      assert.ok(e instanceof AtomicWriteError);
      assert.equal(e.message, `Could not write \`${target}\`; previous version kept`);
      assert.equal(e.fix, "Check disk space and permissions");
      assert.match(String((e.cause as Error).message), /disk full/);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("writeTextAtomic writes UTF-8 without BOM and with LF line endings (C001-NFR-404)", () => {
  const dir = scratch();
  try {
    const target = join(dir, "SDD.md");
    writeTextAtomic(target, "﻿line 1\r\nline 2\rline 3 — é\n");
    const bytes = readFileSync(target);
    assert.notDeepEqual([...bytes.subarray(0, 3)], [0xef, 0xbb, 0xbf]);
    assert.equal(bytes.toString("utf8"), "line 1\nline 2\nline 3 — é\n");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
