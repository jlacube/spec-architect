// C001-NFR-102: `sdd lint --quick --file <one requirements.md>` on fx-large, p95 over 20 runs,
// threshold 800 ms.
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { fxLarge, measure, record } from "./lib.mjs";

export function benchLintQuick() {
  const fx = fxLarge();
  try {
    const file = join(fx.root, ".sdd", "010-change-010", "10-spec", "20-capabilities", "CAP-02-area-2", "requirements.md");
    const m = measure(["lint", "--quick", "--file", file, "--quiet"], fx.root, 20);
    return record("lint-quick", { nfr: "C001-NFR-102", fixture: "fx-large", threshold_ms: 800, ...m, pass: m.p95_ms <= 800 });
  } finally {
    fx.cleanup();
  }
}

if (fileURLToPath(import.meta.url) === process.argv[1]) benchLintQuick();
