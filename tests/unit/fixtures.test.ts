// The fixture repositories of the test plan build as described (C001-T-027).
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fxBootstrap, fxBrownfieldTs, fxEmpty, fxLarge } from "../fixtures/fixtures.ts";

test("fx-empty is an empty git repository", () => {
  const fx = fxEmpty();
  try {
    assert.deepEqual(readdirSync(fx.root), [".git"]);
  } finally {
    fx.cleanup();
  }
});

test("fx-bootstrap is this repository's workspace with the bootstrap generator", () => {
  const fx = fxBootstrap();
  try {
    assert.ok(existsSync(join(fx.root, ".sdd", "001-architect-agent-suite", "change.md")));
  } finally {
    fx.cleanup();
  }
});

test("fx-brownfield-ts has the service files and a churn history on payments.ts", () => {
  const fx = fxBrownfieldTs();
  try {
    for (const f of ["src/billing/invoice.ts", "src/auth/session.ts", "src/checkout/payments.ts", "tests/payments.test.ts"]) assert.ok(existsSync(join(fx.root, f)), f);
    const log = execFileSync("git", ["log", "--oneline", "--", "src/checkout/payments.ts"], { cwd: fx.root, encoding: "utf8" }).trim().split("\n");
    assert.equal(log.length, 7);
  } finally {
    fx.cleanup();
  }
});

test("fx-large has 20 changes", () => {
  const fx = fxLarge();
  try {
    assert.equal(readdirSync(join(fx.root, ".sdd")).filter((n) => /^\d{3}-/.test(n)).length, 20);
  } finally {
    fx.cleanup();
  }
});
