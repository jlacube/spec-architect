// C001-NFR-104: session-start brief time on fx-large, p95 over 10 runs, threshold 1 s, measured on
// `sdd hook session-start` (the SessionStart hook of hooks.json; no stdin, so the process directory is used).
import { fileURLToPath } from "node:url";
import { fxLarge, measure, record } from "./lib.mjs";

export function benchSessionStart() {
  const fx = fxLarge();
  try {
    const m = measure(["hook", "session-start"], fx.root, 10);
    return record("session-start", { nfr: "C001-NFR-104", fixture: "fx-large", command: "sdd hook session-start", threshold_ms: 1000, ...m, pass: m.p95_ms <= 1000 });
  } finally {
    fx.cleanup();
  }
}

if (fileURLToPath(import.meta.url) === process.argv[1]) benchSessionStart();
