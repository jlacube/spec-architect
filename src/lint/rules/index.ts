// Registered lint rules: one module and one bad/good fixture pair per rule (C001-NFR-503).
// The rule tasks add theirs (C001-T-018 … C001-T-022).
import type { LintRule } from "../types.ts";
import { ears001 } from "./ears-001.ts";
import { ears002 } from "./ears-002.ts";
import { ears003 } from "./ears-003.ts";
import { liv001 } from "./liv-001.ts";
import { reg001 } from "./reg-001.ts";
import { req001 } from "./req-001.ts";
import { sec001 } from "./sec-001.ts";
import { tr02 } from "./tr-02.ts";
import { tr12 } from "./tr-12.ts";
import { tr13 } from "./tr-13.ts";
import { txt001 } from "./txt-001.ts";
import { us001 } from "./us-001.ts";
import { us002 } from "./us-002.ts";
import { word001 } from "./word-001.ts";
import { ws002 } from "./ws-002.ts";

export const RULES: readonly LintRule[] = [
  tr02, tr12, tr13, txt001, sec001, ws002, reg001, liv001,
  us001, us002, req001, ears001, ears002, ears003, word001,
];
