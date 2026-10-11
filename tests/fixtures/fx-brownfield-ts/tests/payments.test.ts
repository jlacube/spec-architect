// fx-brownfield-ts: tests reaching createIntent and capture (the regression set of a payments change).
import { test } from "node:test";
import assert from "node:assert/strict";
import { capture, createIntent } from "../src/checkout/payments.ts";
import { login } from "../src/auth/session.ts";

test("an intent is created and captured for a logged-in user", () => {
  login("ana", "secret");
  const intent = capture(createIntent(1200), { number: "4242424242424242", expiry: "12/30" });
  assert.equal(intent.status, "captured");
});
