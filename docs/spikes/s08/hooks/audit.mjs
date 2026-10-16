// S-08 plugin-level audit hook: records every hook input (tool names, input fields, agent fields) and allows.
import { logHook } from "./log.mjs";

logHook(`audit:${process.argv[2] ?? "unknown"}`);
process.exit(0);
