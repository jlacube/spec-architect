// C001-NFR-104: session-start brief time on fx-large, p95 over 10 runs, threshold 1 s. The brief is
// `sdd status --brief`, which the session-start hook (C001-T-052) prints; until the hook exists the
// benchmark measures the command it will call.
import { fileURLToPath } from "node:url";
import { fxLarge, measure, record } from "./lib.mjs";

export function benchSessionStart() {
  const fx = fxLarge();
  try {
    const m = measure(["status", "--brief"], fx.root, 10);
    return record("session-start", { nfr: "C001-NFR-104", fixture: "fx-large", command: "sdd status --brief (hook wiring: C001-T-052)", threshold_ms: 1000, ...m, pass: m.p95_ms <= 1000 });
  } finally {
    fx.cleanup();
  }
}

if (fileURLToPath(import.meta.url) === process.argv[1]) benchSessionStart();
