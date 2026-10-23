// Registered lint rules: one module and one bad/good fixture pair per rule (C001-NFR-503).
// The rule tasks add theirs (C001-T-018 … C001-T-022, C001-T-076).
import type { LintRule } from "../types.ts";
import { arch001 } from "./arch-001.ts";
import { arch002 } from "./arch-002.ts";
import { arch003 } from "./arch-003.ts";
import { arch004 } from "./arch-004.ts";
import { arch005 } from "./arch-005.ts";
import { con001 } from "./con-001.ts";
import { cov001 } from "./cov-001.ts";
import { cov002 } from "./cov-002.ts";
import { delta001 } from "./delta-001.ts";
import { dod001 } from "./dod-001.ts";
import { ears001 } from "./ears-001.ts";
import { ears002 } from "./ears-002.ts";
import { ears003 } from "./ears-003.ts";
import { err001 } from "./err-001.ts";
import { evd001 } from "./evd-001.ts";
import { gate001 } from "./gate-001.ts";
import { hand001 } from "./hand-001.ts";
import { hand002 } from "./hand-002.ts";
import { ide001 } from "./ide-001.ts";
import { if001 } from "./if-001.ts";
import { if002 } from "./if-002.ts";
import { liv001 } from "./liv-001.ts";
import { nfr001 } from "./nfr-001.ts";
import { oa001 } from "./oa-001.ts";
import { obs001 } from "./obs-001.ts";
import { plan001 } from "./plan-001.ts";
import { reg001 } from "./reg-001.ts";
import { req001 } from "./req-001.ts";
import { res001 } from "./res-001.ts";
import { res002 } from "./res-002.ts";
import { risk001 } from "./risk-001.ts";
import { roll001 } from "./roll-001.ts";
import { sec001 } from "./sec-001.ts";
import { task001 } from "./task-001.ts";
import { task002 } from "./task-002.ts";
import { task003 } from "./task-003.ts";
import { task004 } from "./task-004.ts";
import { tc001 } from "./tc-001.ts";
import { tr01 } from "./tr-01.ts";
import { tr02 } from "./tr-02.ts";
import { tr03 } from "./tr-03.ts";
import { tr04 } from "./tr-04.ts";
import { tr05 } from "./tr-05.ts";
import { tr06 } from "./tr-06.ts";
import { tr07 } from "./tr-07.ts";
import { tr08 } from "./tr-08.ts";
import { tr09 } from "./tr-09.ts";
import { tr10 } from "./tr-10.ts";
import { tr11 } from "./tr-11.ts";
import { tr12 } from "./tr-12.ts";
import { tr13 } from "./tr-13.ts";
import { tr14 } from "./tr-14.ts";
import { tr15 } from "./tr-15.ts";
import { ts001 } from "./ts-001.ts";
import { txt001 } from "./txt-001.ts";
import { us001 } from "./us-001.ts";
import { us002 } from "./us-002.ts";
import { word001 } from "./word-001.ts";
import { ws002 } from "./ws-002.ts";

export const RULES: readonly LintRule[] = [
  tr01, tr02, tr03, tr04, tr05, tr06, tr07, tr08, tr09, tr10, tr11, tr12, tr13, tr14, tr15,
  txt001, sec001, ws002, reg001, liv001,
  us001, us002, req001, ears001, ears002, ears003, word001,
  ts001, cov001, cov002, nfr001, dod001, delta001,
  res001, res002, oa001, ide001, arch001, arch002, arch003, arch004, arch005, if001, if002, err001, con001, evd001,
  plan001, task001, task002, task003, task004, tc001, risk001, roll001, hand001, hand002, obs001, gate001,
];
