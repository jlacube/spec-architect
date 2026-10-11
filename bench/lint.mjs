// C001-NFR-101: full `sdd lint` on fx-large, p95 over 10 runs, threshold 5 s.
import { fileURLToPath } from "node:url";
import { fxLarge, measure, record } from "./lib.mjs";

export function benchLint() {
  const fx = fxLarge();
  try {
    const m = measure(["lint", "--quiet"], fx.root, 10);
    return record("lint", { nfr: "C001-NFR-101", fixture: "fx-large", threshold_ms: 5000, ...m, pass: m.p95_ms <= 5000 });
  } finally {
    fx.cleanup();
  }
}

if (fileURLToPath(import.meta.url) === process.argv[1]) benchLint();
