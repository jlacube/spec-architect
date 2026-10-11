// LINT-IF-001 (error): a `.json`, `.yaml` or `.yml` contract under `50-interfaces/` does not parse;
// the finding carries the parser message and position (C001-REQ-512).
import { parseAllDocuments } from "yaml";
import type { LintRule, RuleFinding } from "../types.ts";

/** Line and column (1-based) of a character offset. */
function position(text: string, offset: number): { line: number; col: number } {
  const before = text.slice(0, offset).split("\n");
  return { line: before.length, col: (before[before.length - 1]?.length ?? 0) + 1 };
}

/**
 * Offset of the first JSON syntax error (Node's own messages do not always carry one), or -1.
 * A minimal scanner of the JSON grammar, used only after JSON.parse has failed.
 */
export function jsonErrorOffset(s: string): number {
  let i = 0;
  const ws = () => {
    while (i < s.length && " \t\n\r".includes(s[i]!)) i++;
  };
  const fail = (): never => {
    throw i;
  };
  const value = (): void => {
    ws();
    const ch = s[i];
    if (ch === "{") {
      i++;
      ws();
      if (s[i] === "}") return void i++;
      for (;;) {
        ws();
        if (s[i] !== '"') fail();
        string();
        ws();
        if (s[i] !== ":") fail();
        i++;
        value();
        ws();
        if (s[i] === ",") i++;
        else if (s[i] === "}") return void i++;
        else fail();
      }
    }
    if (ch === "[") {
      i++;
      ws();
      if (s[i] === "]") return void i++;
      for (;;) {
        value();
        ws();
        if (s[i] === ",") i++;
        else if (s[i] === "]") return void i++;
        else fail();
      }
    }
    if (ch === '"') return string();
    const lit = /^(?:true|false|null|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)/.exec(s.slice(i));
    if (!lit) fail();
    i += lit![0].length;
  };
  const string = (): void => {
    i++;
    while (i < s.length && s[i] !== '"') {
      if (s[i] === "\\") i++;
      else if (s.charCodeAt(i) < 0x20) fail();
      i++;
    }
    if (i >= s.length) fail();
    i++;
  };
  try {
    value();
    ws();
    return i < s.length ? i : -1;
  } catch (at) {
    return typeof at === "number" ? at : -1;
  }
}

export function parseError(path: string, text: string): { line: number; message: string } | null {
  const src = text.replace(/^﻿/, "");
  if (/\.json$/i.test(path)) {
    try {
      JSON.parse(src);
      return null;
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      const offset = jsonErrorOffset(src);
      const p = position(src, offset < 0 ? 0 : offset);
      return { line: p.line, message: `${message.split("\n")[0]} (line ${p.line}, column ${p.col})` };
    }
  }
  for (const doc of parseAllDocuments(src, { prettyErrors: false })) {
    const err = "errors" in doc ? doc.errors[0] : undefined;
    if (err) {
      const p = err.linePos?.[0] ?? position(src, err.pos[0]);
      return { line: p.line, message: `${err.message.split("\n")[0]} (line ${p.line}, column ${p.col})` };
    }
  }
  return null;
}

export const if001: LintRule = {
  code: "LINT-IF-001",
  severity: "error",
  fix: "Fix syntax at the reported position",
  scope: "file",
  check(ctx) {
    const out: RuleFinding[] = [];
    for (const c of ctx.changes)
      for (const [path, text] of c.spec.interfaces) {
        if (text === null) continue;
        const err = parseError(path, text);
        if (err) out.push({ path: `${c.folder}/${path}`, line: err.line, message: `Contract does not parse: ${err.message}` });
      }
    return out;
  },
};
