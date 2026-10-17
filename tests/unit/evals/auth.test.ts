// Eval auth switch (CHG-002 D-003): api-key keeps the stored login; subscription gives the child an
// isolated config folder and an OAuth token, and a session that reports another key source is refused.
// No model is called.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { authEnv, checkKeySource, childEnv, resolveAuth } from "../../../evals/harness/env.mjs";

function withEnv(vars: Record<string, string | undefined>, fn: () => void): void {
  const saved: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(vars)) {
    saved[k] = process.env[k];
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  try {
    fn();
  } finally {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
}

test("auth mode: --auth, then EVAL_AUTH, then api-key; unknown modes are refused", () => {
  withEnv({ EVAL_AUTH: undefined }, () => assert.equal(resolveAuth(), "api-key"));
  withEnv({ EVAL_AUTH: "subscription" }, () => assert.equal(resolveAuth(), "subscription"));
  withEnv({ EVAL_AUTH: "subscription" }, () => assert.equal(resolveAuth("api-key"), "api-key"));
  assert.throws(() => resolveAuth("max"), /unknown eval auth mode max/);
});

test("api-key mode adds nothing and still strips the parent's CLAUDE… and ANTHROPIC… variables", () => {
  withEnv({ EVAL_AUTH: undefined, ANTHROPIC_API_KEY: "sk-parent", CLAUDE_CODE_OAUTH_TOKEN: "parent-token", CLAUDE_CONFIG_DIR: "/parent" }, () => {
    assert.deepEqual(authEnv("api-key"), {});
    const env = childEnv({ EXTRA: "1" }, "api-key");
    assert.equal(env["ANTHROPIC_API_KEY"], undefined);
    assert.equal(env["CLAUDE_CODE_OAUTH_TOKEN"], undefined);
    assert.equal(env["CLAUDE_CONFIG_DIR"], undefined);
    assert.equal(env["EXTRA"], "1");
  });
});

test("subscription mode: isolated config folder and the token from the token file", () => {
  const dir = mkdtempSync(join(tmpdir(), "eval-auth-"));
  try {
    const tokenFile = join(dir, "token");
    writeFileSync(tokenFile, "oauth-token-value\n");
    const configDir = join(dir, "cfg");
    withEnv({ EVAL_CLAUDE_OAUTH_TOKEN: undefined, EVAL_CLAUDE_OAUTH_TOKEN_FILE: tokenFile, EVAL_CLAUDE_CONFIG_DIR: configDir, CLAUDE_CODE_OAUTH_TOKEN: "parent-token" }, () => {
      const env = childEnv({}, "subscription");
      assert.equal(env["CLAUDE_CODE_OAUTH_TOKEN"], "oauth-token-value");
      assert.equal(env["CLAUDE_CONFIG_DIR"], configDir);
      assert.ok(existsSync(configDir));
    });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("subscription mode without a token is refused with the setup instruction", () => {
  withEnv({ EVAL_CLAUDE_OAUTH_TOKEN: undefined, EVAL_CLAUDE_OAUTH_TOKEN_FILE: join(tmpdir(), "no-such-token-file") }, () => {
    assert.throws(() => authEnv("subscription"), /claude setup-token/);
  });
});

test("key source check: subscription accepts only oauth; api-key accepts any stored login", () => {
  assert.doesNotThrow(() => checkKeySource("subscription", "oauth"));
  assert.throws(() => checkKeySource("subscription", "/login managed key"), /not the subscription/);
  assert.throws(() => checkKeySource("subscription", "ANTHROPIC_API_KEY"), /not the subscription/);
  assert.doesNotThrow(() => checkKeySource("api-key", "/login managed key"));
});
