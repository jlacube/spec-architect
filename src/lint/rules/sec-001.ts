// LINT-SEC-001 (error): a secret-like string in an artifact under `.sdd/` (C001-NFR-203). Applies
// everywhere, code blocks included: a secret in an example is still a secret. The detection-rate
// corpus (≥ 60 positives, ≥ 100 negatives) is built and measured by C001-T-054.
import type { LintRule, RuleFinding } from "../types.ts";

interface Pattern {
  name: string;
  re: RegExp;
}

export const SECRET_PATTERNS: readonly Pattern[] = [
  { name: "private key", re: /-----BEGIN (?:RSA |EC |DSA |OPENSSH |ENCRYPTED |PGP )?PRIVATE KEY(?: BLOCK)?-----/ },
  { name: "AWS access key", re: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/ },
  { name: "GitHub token", re: /\b(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{60,})\b/ },
  { name: "Slack token", re: /\bxox[abprs]-[A-Za-z0-9-]{10,}/ },
  { name: "Anthropic API key", re: /\bsk-ant-[A-Za-z0-9_-]{20,}/ },
  { name: "OpenAI-style API key", re: /\bsk-(?:proj-)?[A-Za-z0-9]{32,}\b/ },
  { name: "Stripe live key", re: /\b[rs]k_live_[A-Za-z0-9]{20,}\b/ },
  { name: "Google API key", re: /\bAIza[0-9A-Za-z_-]{35}\b/ },
  { name: "npm token", re: /\bnpm_[A-Za-z0-9]{36}\b/ },
  { name: "JSON Web Token", re: /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/ },
  { name: "Azure storage key", re: /AccountKey=[A-Za-z0-9+/]{40,}={0,2}/ },
  { name: "connection string with password", re: /\b[a-z][a-z0-9+.-]*:\/\/[^\s:@/"'`]+:[^\s@/"'`]{3,}@[^\s/"'`]+/i },
];

/** Values that are obviously illustrative (`<password>`, `xxx`, `changeme`, `${VAR}`). */
const PLACEHOLDER = /<[^>]+>|\$\{[^}]+\}|x{3,}|\*{3,}|changeme|example|placeholder|redacted/i;

export function findSecrets(line: string): string[] {
  const hits: string[] = [];
  for (const p of SECRET_PATTERNS) {
    const m = p.re.exec(line);
    if (m && !PLACEHOLDER.test(m[0])) hits.push(p.name);
  }
  return hits;
}

export const sec001: LintRule = {
  code: "LINT-SEC-001",
  severity: "error",
  fix: "Remove the secret; rotate it if real",
  scope: "file",
  check(ctx) {
    const out: RuleFinding[] = [];
    for (const t of ctx.texts)
      t.lines.forEach((line, i) => {
        const hits = findSecrets(line);
        // The message names the kind of secret, never the value.
        if (hits.length > 0) out.push({ path: t.path, line: i + 1, message: `Secret-like string (${hits.join(", ")})` });
      });
    return out;
  },
};
