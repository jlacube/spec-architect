// Registered lint rules: one module and one bad/good fixture pair per rule (C001-NFR-503).
// The rule tasks add theirs (C001-T-019 … C001-T-022).
import type { LintRule } from "../types.ts";
import { liv001 } from "./liv-001.ts";
import { reg001 } from "./reg-001.ts";
import { sec001 } from "./sec-001.ts";
import { tr02 } from "./tr-02.ts";
import { tr12 } from "./tr-12.ts";
import { tr13 } from "./tr-13.ts";
import { txt001 } from "./txt-001.ts";
import { ws002 } from "./ws-002.ts";

export const RULES: readonly LintRule[] = [tr02, tr12, tr13, txt001, sec001, ws002, reg001, liv001];
