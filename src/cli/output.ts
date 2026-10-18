// Output helpers for the sdd CLI (C001-IF-01 "Output"): human finding lines, a single JSON document
// for --json, warnings, and SDD_DEBUG traces on standard error (C001-NFR-702).
import type { Finding } from "../lint/types.ts";
import { CliError, formatError } from "./errors.ts";

export interface Writers {
  stdout(text: string): void;
  stderr(text: string): void;
}

/** `<severity> <code> <path>[:<line>] [<ids>] — <message>. Fix: <fix>` (C001-REQ-702, C001-NFR-601). */
export function formatFinding(f: Finding): string {
  const where = f.line !== undefined ? `${f.path}:${f.line}` : f.path;
  const ids = f.ids && f.ids.length > 0 ? ` [${f.ids.join(", ")}]` : "";
  const message = f.message.replace(/\.+$/, "");
  return `${f.severity} ${f.code} ${where}${ids} — ${message}. Fix: ${f.fix}`;
}

export class Output {
  private readonly started = Date.now();
  private readonly debug: boolean;

  constructor(
    private readonly w: Writers,
    env: Readonly<Record<string, string | undefined>>,
  ) {
    this.debug = (env["SDD_DEBUG"] ?? "") !== "" && env["SDD_DEBUG"] !== "0";
  }

  line(text: string): void {
    this.w.stdout(text + "\n");
  }

  /** Text on standard output exactly as given, no newline added (`template show`, C002-IF-007). */
  raw(text: string): void {
    this.w.stdout(text);
  }

  /** The only standard-output write of a --json run (C001-REQ-703). */
  json(doc: unknown): void {
    this.w.stdout(JSON.stringify(doc, null, 2) + "\n");
  }

  error(e: CliError): void {
    this.w.stderr(formatError(e) + "\n");
  }

  /** A line on standard error (guard decisions, C001-IF-07 §4). */
  errorLine(text: string): void {
    this.w.stderr(text + "\n");
  }

  /** WARN-CLI-* lines go to standard output; the command still succeeds. */
  warn(e: CliError): void {
    this.w.stdout(formatError(e) + "\n");
  }

  /** `[sdd +<ms>ms] <event> key=value …` on standard error when SDD_DEBUG is set. */
  trace(event: string, data: Record<string, string | number | boolean | null | undefined> = {}): void {
    if (!this.debug) return;
    const kv = Object.entries(data)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => `${k}=${typeof v === "string" && /\s/.test(v) ? JSON.stringify(v) : String(v)}`)
      .join(" ");
    this.w.stderr(`[sdd +${Date.now() - this.started}ms] ${event}${kv ? " " + kv : ""}\n`);
  }
}
