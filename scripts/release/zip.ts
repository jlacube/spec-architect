// Zip reader of the release check (C002-T-047, C002-NFR-501): the file entries of a target zip with
// their uncompressed bytes, read through the central directory. Stored (0) and deflated (8) entries,
// the two methods Windows' bsdtar and Info-ZIP write for `npm run package` (scripts/package.mjs zipDir).
import { readFileSync } from "node:fs";
import { inflateRawSync } from "node:zlib";

export class ZipError extends Error {}

/** Every file entry of the zip at `path` (directories left out), "/"-separated name to its bytes. Throws ZipError. */
export function readZip(path: string): Map<string, Buffer> {
  const buf = readFileSync(path);
  let eocd = buf.length - 22;
  while (eocd >= 0 && buf.readUInt32LE(eocd) !== 0x06054b50) eocd--;
  if (eocd < 0) throw new ZipError("no end of central directory");
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const out = new Map<string, Buffer>();
  for (let i = 0; i < count; i++) {
    if (p + 46 > buf.length || buf.readUInt32LE(p) !== 0x02014b50) throw new ZipError("bad central directory entry");
    const method = buf.readUInt16LE(p + 10);
    const size = buf.readUInt32LE(p + 20);
    const n = buf.readUInt16LE(p + 28);
    const local = buf.readUInt32LE(p + 42);
    const name = buf.toString("utf8", p + 46, p + 46 + n).split("\\").join("/");
    p += 46 + n + buf.readUInt16LE(p + 30) + buf.readUInt16LE(p + 32);
    if (name.endsWith("/")) continue;
    if (local + 30 > buf.length || buf.readUInt32LE(local) !== 0x04034b50) throw new ZipError(`bad local header of ${name}`);
    const start = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
    const data = buf.subarray(start, start + size);
    if (method === 0) out.set(name, Buffer.from(data));
    else if (method === 8) out.set(name, inflateRawSync(data));
    else throw new ZipError(`${name}: compression method ${method}`);
  }
  return out;
}
