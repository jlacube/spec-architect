// Registered lint rules: one module and one bad/good fixture pair per rule (C001-NFR-503).
// The rule tasks add theirs (C001-T-018 … C001-T-022).
import type { LintRule } from "../types.ts";
import { cov001 } from "./cov-001.ts";
import { cov002 } from "./cov-002.ts";
import { delta001 } from "./delta-001.ts";
import { dod001 } from "./dod-001.ts";
import { ears001 } from "./ears-001.ts";
import { ears002 } from "./ears-002.ts";
import { ears003 } from "./ears-003.ts";
import { liv001 } from "./liv-001.ts";
import { nfr001 } from "./nfr-001.ts";
import { reg001 } from "./reg-001.ts";
import { req001 } from "./req-001.ts";
import { sec001 } from "./sec-001.ts";
import { tr01 } from "./tr-01.ts";
import { tr02 } from "./tr-02.ts";
import { tr03 } from "./tr-03.ts";
import { tr04 } from "./tr-04.ts";
import { tr05 } from "./tr-05.ts";
import { tr09 } from "./tr-09.ts";
import { tr12 } from "./tr-12.ts";
import { tr13 } from "./tr-13.ts";
import { ts001 } from "./ts-001.ts";
import { txt001 } from "./txt-001.ts";
import { us001 } from "./us-001.ts";
import { us002 } from "./us-002.ts";
import { word001 } from "./word-001.ts";
import { ws002 } from "./ws-002.ts";

export const RULES: readonly LintRule[] = [
  tr01, tr02, tr03, tr04, tr05, tr09, tr12, tr13, txt001, sec001, ws002, reg001, liv001,
  us001, us002, req001, ears001, ears002, ears003, word001,
  ts001, cov001, cov002, nfr001, dod001, delta001,
];
