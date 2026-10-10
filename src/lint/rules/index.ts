// Registered lint rules. The rule tasks add theirs (C001-T-018 … C001-T-022).
import type { LintRule } from "../types.ts";
import { ws002 } from "./ws-002.ts";

export const RULES: readonly LintRule[] = [ws002];
