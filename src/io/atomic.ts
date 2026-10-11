// Atomic file replacement (C001-REQ-126): write a temporary file in the target's directory, fsync
// it, then rename it over the target. On any failure the temporary file is removed and the
// previous target, if any, is left untouched.
import { randomBytes } from "node:crypto";
import { closeSync, fsyncSync, openSync, renameSync, unlinkSync, writeSync } from "node:fs";
import { basename, dirname, join } from "node:path";

export type AtomicStage = "write" | "fsync" | "rename";

export interface AtomicWriteOptions {
  /** Test hook called after each stage; throwing from it simulates a failure at that stage. */
  fault?: (stage: AtomicStage) => void;
}

/** Catalogue entry ERR-CLI-017 (C001-IF-11 errors): exit code 3. */
export class AtomicWriteError extends Error {
  readonly code = "ERR-CLI-017";
  readonly exitCode = 3;
  readonly fix = "Check disk space and permissions";
  constructor(
    readonly path: string,
    cause: unknown,
  ) {
    super(`Could not write \`${path}\`; previous version kept`, { cause });
    this.name = "AtomicWriteError";
  }
}

/**
 * Fault injection for CLI subprocess tests: `SDD_TEST_FAULT=atomic-write-after-bytes=<n>` makes the
 * temporary-file write fail after <n> bytes (C001-TS-132). Not a user-facing setting.
 */
function faultAfterBytes(): number | undefined {
  const m = /(?:^|,)atomic-write-after-bytes=(\d+)(?:,|$)/.exec(process.env["SDD_TEST_FAULT"] ?? "");
  return m?.[1] !== undefined ? Number(m[1]) : undefined;
}

/**
 * `SDD_TEST_FAULT=atomic-write-fail-at=<k>` makes the k-th atomic write of the process fail after
 * half of its bytes reached the temporary file (fault-injection tests of C001-NFR-301).
 */
let writes = 0;
function failThisWrite(): boolean {
  writes++;
  const m = /(?:^|,)atomic-write-fail-at=(\d+)(?:,|$)/.exec(process.env["SDD_TEST_FAULT"] ?? "");
  return m?.[1] !== undefined && Number(m[1]) === writes;
}

function writeAll(fd: number, data: Uint8Array): void {
  let off = 0;
  while (off < data.length) off += writeSync(fd, data, off, data.length - off);
}

function sleep(ms: number): void {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

/**
 * Renames with a short bounded retry: on Windows a rename over a file that another process
 * (indexer, antivirus) holds open fails transiently with EPERM, EACCES or EBUSY.
 */
function renameWithRetry(from: string, to: string): void {
  for (let attempt = 0; ; attempt++) {
    try {
      renameSync(from, to);
      return;
    } catch (e) {
      const code = (e as NodeJS.ErrnoException).code;
      if (attempt >= 8 || (code !== "EPERM" && code !== "EACCES" && code !== "EBUSY")) throw e;
      sleep(10 * (attempt + 1));
    }
  }
}

/** Flushes the directory entry after the rename, where the platform supports it (best effort). */
function fsyncDirectory(dir: string): void {
  let fd: number | undefined;
  try {
    fd = openSync(dir, "r");
    fsyncSync(fd);
  } catch {
    // Windows and some file systems refuse to open or fsync a directory.
  } finally {
    if (fd !== undefined) closeSync(fd);
  }
}

export function writeFileAtomic(path: string, data: string | Uint8Array, options: AtomicWriteOptions = {}): void {
  const bytes = typeof data === "string" ? Buffer.from(data, "utf8") : data;
  const dir = dirname(path);
  const temp = join(dir, `${basename(path)}.tmp-${process.pid}-${randomBytes(4).toString("hex")}`);
  let fd: number | undefined;
  try {
    fd = openSync(temp, "wx");
    const limit = failThisWrite() ? Math.floor(bytes.length / 2) : faultAfterBytes();
    if (limit !== undefined) {
      writeAll(fd, bytes.subarray(0, Math.min(limit, bytes.length)));
      throw new Error(`SDD_TEST_FAULT: temporary-file write failed after ${Math.min(limit, bytes.length)} bytes`);
    }
    writeAll(fd, bytes);
    options.fault?.("write");
    fsyncSync(fd);
    options.fault?.("fsync");
    closeSync(fd);
    fd = undefined;
    options.fault?.("rename");
    renameWithRetry(temp, path);
  } catch (e) {
    if (fd !== undefined) {
      try {
        closeSync(fd);
      } catch {
        // Already failing; the original error is reported.
      }
    }
    try {
      unlinkSync(temp);
    } catch {
      // The temporary file may not exist (open failed) or was already renamed.
    }
    throw new AtomicWriteError(path, e);
  }
  fsyncDirectory(dir);
}

/** Text form for `.sdd/` artifacts (C001-NFR-404): UTF-8 without BOM, LF line endings. */
export function toArtifactText(text: string): string {
  return text.replace(/^﻿/, "").replace(/\r\n?/g, "\n");
}

export function writeTextAtomic(path: string, text: string, options: AtomicWriteOptions = {}): void {
  writeFileAtomic(path, toArtifactText(text), options);
}
