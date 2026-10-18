// Minimal zip reader for packaging tests: file entries (directories left out) with their uncompressed
// bytes, read through the central directory. Stored (0) and deflated (8) entries only.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { inflateRawSync } from "node:zlib";

/** Every file entry of the zip at `path`, name ("/"-separated) to its bytes. */
export function readZip(path: string): Map<string, Buffer> {
  const buf = readFileSync(path);
  let eocd = buf.length - 22;
  while (eocd >= 0 && buf.readUInt32LE(eocd) !== 0x06054b50) eocd--;
  assert.ok(eocd >= 0, `${path}: no end of central directory`);
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const out = new Map<string, Buffer>();
  for (let i = 0; i < count; i++) {
    assert.equal(buf.readUInt32LE(p), 0x02014b50, `${path}: bad central directory entry`);
    const method = buf.readUInt16LE(p + 10);
    const size = buf.readUInt32LE(p + 20);
    const n = buf.readUInt16LE(p + 28);
    const local = buf.readUInt32LE(p + 42);
    const name = buf.toString("utf8", p + 46, p + 46 + n);
    p += 46 + n + buf.readUInt16LE(p + 30) + buf.readUInt16LE(p + 32);
    if (name.endsWith("/")) continue;
    assert.equal(buf.readUInt32LE(local), 0x04034b50, `${path}: bad local header of ${name}`);
    const start = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
    const data = buf.subarray(start, start + size);
    assert.ok(method === 0 || method === 8, `${path}: ${name}: compression method ${method}`);
    out.set(name, method === 0 ? Buffer.from(data) : inflateRawSync(data));
  }
  return out;
}
