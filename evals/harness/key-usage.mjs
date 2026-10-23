// The OpenRouter key of paid OpenCode sessions (C002-IF-010 §2.3, §4; C002-REQ-639, C002-REQ-641;
// C002-T-067, revision D-023 item 2): the key file, the key check before any use of the key, the
// redaction of the exact key value in everything the OpenCode eval runner and run.mjs write, and the
// read of the key's usage that reconciles a `partial` spend.
//
// The key is never printed, logged or written: a refusal names the key file, never the key; a failed
// usage read is reported by its reason, never by the request, its headers or the response body; of the
// response only the number `data.usage` is kept (never `data.label`, which can show part of the key).
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

/** P-01's key file (one line; never printed, logged or committed), C002-IF-010 §4 Provider key. */
export function defaultOpenRouterKeyFile() {
  return join(homedir(), ".architect-evals", "openrouter-key.txt");
}

/** Shortest key the redaction can match safely (C002-IF-010 §4 Key check). */
export const MIN_KEY_LENGTH = 20;

const missing = (file) => `paid OpenCode session refused: no OpenRouter key in ${file}`;
const unusable = (file) => `paid OpenCode session refused: the OpenRouter key in ${file} is shorter than ${MIN_KEY_LENGTH} characters or holds a character that JSON escapes`;

/**
 * The key check of C002-IF-010 §4 on a key value (the key file's whole content with the white space at
 * its ends removed): returns the key, or throws the second refusal text when the value is empty, shorter
 * than 20 characters, or holds a character that JSON escapes (`"`, `\`, a control character, a line break
 * included). `file` is the key file named in the text.
 */
export function checkOpenRouterKey(key, file) {
  const k = String(key ?? "");
  if (k.length < MIN_KEY_LENGTH || JSON.stringify(k) !== `"${k}"`) throw new Error(unusable(file));
  return k;
}

/**
 * The checked key of the key file (default: P-01's key file), or an error with the refusal text of its
 * case: `no OpenRouter key in <key file>` when the file is missing, else the text of `checkOpenRouterKey`.
 */
export function readOpenRouterKey(file = defaultOpenRouterKeyFile()) {
  if (!existsSync(file)) throw new Error(missing(file));
  return checkOpenRouterKey(readFileSync(file, "utf8").trim(), file);
}

/**
 * The redaction of C002-IF-010 §4 Key redaction: a function that replaces every occurrence of the exact key
 * value with `[REDACTED]` in a complete line or file text (case-sensitive, no partial match). A checked key
 * holds no character that JSON escapes, so it is replaced inside JSON text as well. Without a key the text
 * is returned as it is.
 */
export function redactor(key) {
  if (!key) return (text) => text;
  return (text) => String(text).split(key).join("[REDACTED]");
}

/** The endpoint of the key usage read (C002-IF-010 §2.3 Endpoint). */
export const KEY_USAGE_URL = "https://openrouter.ai/api/v1/key";
/** No response within this time fails the read. */
export const KEY_USAGE_TIMEOUT_MS = 30_000;

/**
 * One read of the key's usage: `GET https://openrouter.ai/api/v1/key` with `Authorization: Bearer <key>`
 * as its only credential header; returns `data.usage` (USD, all time). Throws an error whose message is the
 * reason only when no response arrives within 30 s, the status is not 200, or `data.usage` is not a finite
 * number of at least 0. `fetch` is the test seam of the request level (a stubbed fetch, no socket).
 */
export async function readKeyUsage(key, { fetch = globalThis.fetch, timeoutMs = KEY_USAGE_TIMEOUT_MS } = {}) {
  const abort = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    abort.abort();
  }, timeoutMs);
  const late = () => new Error(`no response within ${Math.round(timeoutMs / 1000)} s`);
  let usage;
  try {
    let res;
    try {
      res = await fetch(KEY_USAGE_URL, { method: "GET", headers: { Authorization: `Bearer ${key}` }, signal: abort.signal });
    } catch {
      // The error of a client library can quote the request; only the reason is reported.
      throw timedOut ? late() : new Error("no response");
    }
    if (res.status !== 200) throw new Error(`HTTP status ${res.status}`);
    try {
      usage = (await res.json())?.data?.usage;
    } catch {
      if (timedOut) throw late();
      usage = undefined;
    }
  } finally {
    clearTimeout(timer);
  }
  if (typeof usage !== "number" || !Number.isFinite(usage) || usage < 0) throw new Error("data.usage is not a finite number of at least 0");
  return usage;
}
