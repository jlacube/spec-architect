// C002-TC-924 (supporting, request level; test plan §8, critic CR-59; C002-T-067): the OpenRouter key
// usage reader of evals/harness/key-usage.mjs (C002-IF-010 §2.3 Endpoint, "The key is never logged"),
// and the key check and redaction it shares with the OpenCode runner (C002-IF-010 §4 Key check, Key
// redaction). Every request goes to a stubbed fetch: no socket, no network, no real key (the dummy key
// below stands for P-01's key, whose file is never read).
import { mock, test } from "node:test";
import assert from "node:assert/strict";
import { checkOpenRouterKey, KEY_USAGE_TIMEOUT_MS, KEY_USAGE_URL, readKeyUsage, redactor } from "../../../evals/harness/key-usage.mjs";

const KEY = "sk-or-v1-c002ts698dummykey";

type Call = { url: string; init: { method?: string; headers?: Record<string, string>; body?: unknown; signal?: AbortSignal } };
/** A stubbed fetch that records each call and answers with `respond(call)`. */
function stubFetch(respond: (call: Call) => Promise<unknown> | unknown) {
  const calls: Call[] = [];
  const fetch = async (url: string, init: Call["init"] = {}) => {
    const call = { url: String(url), init };
    calls.push(call);
    return respond(call);
  };
  // The reader calls only `status` and `json()` of the response.
  return { fetch: fetch as unknown as typeof globalThis.fetch, calls };
}
const response = (status: number, body: unknown) => ({ status, ok: status >= 200 && status < 300, json: async () => body, text: async () => JSON.stringify(body) });

/** The reason of a failed read, asserted to hold neither the key, the request's headers nor a response body. */
async function failure(p: Promise<unknown>, bodyText?: string): Promise<string> {
  let reason = "";
  await assert.rejects(p, (e: unknown) => {
    reason = e instanceof Error ? e.message : String(e);
    return true;
  });
  assert.ok(!reason.includes(KEY), `the key in the reason: ${reason}`);
  assert.ok(!/Authorization|Bearer/i.test(reason), `the request's headers in the reason: ${reason}`);
  if (bodyText) assert.ok(!reason.includes(bodyText), `the response body in the reason: ${reason}`);
  return reason;
}

test("C002-TC-924 (request): GET https://openrouter.ai/api/v1/key with the key in the Authorization: Bearer header only, in no URL, query or body", async () => {
  const { fetch, calls } = stubFetch(() => response(200, { data: { usage: 17.24 } }));
  assert.equal(await readKeyUsage(KEY, { fetch }), 17.24);
  assert.equal(calls.length, 1);
  const [c] = calls;
  assert.equal(KEY_USAGE_URL, "https://openrouter.ai/api/v1/key");
  assert.equal(c!.url, KEY_USAGE_URL, "no query");
  assert.equal(c!.init.method, "GET");
  assert.deepEqual(c!.init.headers, { Authorization: `Bearer ${KEY}` }, "the Authorization header is the only credential header");
  assert.equal(c!.init.body, undefined, "no body");
  assert.ok(!c!.url.includes(KEY), "the key is not in the URL");
  assert.ok(c!.init.signal instanceof AbortSignal, "the request can be ended at the timeout");
});

test("C002-TC-924 (request): no response within 30 s fails; the reason holds no request text", async () => {
  assert.equal(KEY_USAGE_TIMEOUT_MS, 30_000);
  mock.timers.enable({ apis: ["setTimeout"] });
  try {
    let aborted = false;
    const { fetch } = stubFetch(
      ({ init }) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener("abort", () => {
            aborted = true;
            reject(new Error(`request to ${KEY_USAGE_URL} with Authorization: Bearer ${KEY} aborted`));
          });
        }),
    );
    let settled = false;
    const p = readKeyUsage(KEY, { fetch }).finally(() => (settled = true));
    p.catch(() => {});
    mock.timers.tick(29_999);
    await new Promise((r) => setImmediate(r));
    assert.equal(settled, false, "still waiting before 30 s");
    mock.timers.tick(1);
    const reason = await failure(p);
    assert.ok(aborted, "the request was ended");
    assert.match(reason, /no response within 30 s/);
  } finally {
    mock.timers.reset();
  }
});

test("C002-TC-924 (request): a request that fails without a response fails with a reason that does not quote the error", async () => {
  const { fetch } = stubFetch(() => Promise.reject(new Error(`connect ECONNREFUSED; headers {"Authorization":"Bearer ${KEY}"}`)));
  const reason = await failure(readKeyUsage(KEY, { fetch }));
  assert.match(reason, /no response/);
});

for (const status of [401, 500]) {
  test(`C002-TC-924 (request): HTTP status ${status} fails; the reason names the status and not the body`, async () => {
    const body = { error: { message: `invalid key ${KEY}` } };
    const { fetch } = stubFetch(() => response(status, body));
    const reason = await failure(readKeyUsage(KEY, { fetch }), JSON.stringify(body));
    assert.match(reason, new RegExp(`HTTP status ${status}`));
  });
}

for (const usage of [null, -1, "x"]) {
  test(`C002-TC-924 (request): a 200 response with data.usage ${JSON.stringify(usage)} fails`, async () => {
    const { fetch } = stubFetch(() => response(200, { data: { usage, label: `sk-or-v1-c00...key` } }));
    const reason = await failure(readKeyUsage(KEY, { fetch }), "sk-or-v1-c00");
    assert.match(reason, /data\.usage is not a finite number of at least 0/);
  });
}

test("C002-TC-924 (request): a 200 response that is no JSON fails without quoting it", async () => {
  const { fetch } = stubFetch(() => ({ status: 200, ok: true, json: async () => JSON.parse(`<html>${KEY}</html>`), text: async () => `<html>${KEY}</html>` }));
  const reason = await failure(readKeyUsage(KEY, { fetch }), "<html>");
  assert.match(reason, /data\.usage is not a finite number of at least 0/);
});

test("C002-TC-924 (request): a 200 response with data.label and data.usage gives data.usage alone; data.label is not kept", async () => {
  const { fetch } = stubFetch(() => response(200, { data: { label: "sk-or-v1-c00...key", usage: 19.3016, limit: null, is_free_tier: false } }));
  const v = await readKeyUsage(KEY, { fetch });
  assert.equal(typeof v, "number", "a number, no object that could carry the label");
  assert.equal(v, 19.3016);
  assert.equal(await readKeyUsage(KEY, { fetch: stubFetch(() => response(200, { data: { usage: 0 } })).fetch }), 0, "0 is a usage");
});

// --- the key check and the redaction shared with the OpenCode runner (C002-IF-010 §4) -----------------

test("C002-TC-925 (supporting): the key check accepts 20 characters without a character that JSON escapes; refuses an empty, short or escaped value with the second text", () => {
  const file = "C:/home/.architect-evals/openrouter-key.txt";
  const SECOND = `paid OpenCode session refused: the OpenRouter key in ${file} is shorter than 20 characters or holds a character that JSON escapes`;
  assert.equal(checkOpenRouterKey("sk-or-v1-01234567890", file), "sk-or-v1-01234567890");
  for (const bad of ["", "sk-or-v1-0123456789", "sk-or-v1-0123\\456789abcdef", "sk-or-v1-c002ts699lineone\nsk-or-v1-c002ts699linetwo", 'sk-or-v1-0123"456789abcdef', "sk-or-v1-0123\t456789abcdef", "sk-or-v1-0123\u0001456789abcdef"])
    assert.throws(() => checkOpenRouterKey(bad, file), (e: unknown) => e instanceof Error && e.message === SECOND && (bad === "" || !e.message.includes(bad)), JSON.stringify(bad));
});

test("C002-TC-924 (supporting): the redaction replaces every exact occurrence of the key with [REDACTED], also inside JSON text, and nothing else", () => {
  const r = redactor(KEY);
  assert.equal(r(`OPENROUTER_API_KEY=${KEY} and ${KEY}`), "OPENROUTER_API_KEY=[REDACTED] and [REDACTED]");
  assert.equal(r(JSON.stringify({ output: `the key is ${KEY}` })), JSON.stringify({ output: "the key is [REDACTED]" }));
  assert.equal(r(KEY.toUpperCase()), KEY.toUpperCase(), "case-sensitive");
  assert.equal(r(KEY.slice(0, 12)), KEY.slice(0, 12), "no partial match");
  assert.equal(redactor(null)("text"), "text", "no key, no change");
});
