// C001-TC-1010 — verifies C001-TS-1010 (C001-AC-1009.1, C001-REQ-1009): structural question with ast-grep
// present. toolchain.md records ast-grep detected; the routes file registers some Express handlers
// without the auth middleware. The transcript contains "ast-grep run --pattern" and the evidence entries
// have layer ast-grep with the pattern recorded.
import { checker, toolCalls } from "../harness/assert.mjs";
import { write } from "../harness/workspaces.mjs";
import { brief, brownfield, cartoRun, EVIDENCE, evidence, read } from "./carto.mjs";

const ROUTES = `// Express routes of the payments API.
import express from "express";
import { requireAuth } from "../auth/session.ts";
import { capture, createIntent } from "../checkout/payments.ts";

export const app = express();
app.post("/intents", requireAuth, (req, res) => res.json(createIntent(req.body.amount)));
app.post("/intents/:id/capture", requireAuth, (req, res) => res.json(capture(req.body, req.body.card)));
app.get("/health", (req, res) => res.send("ok"));
app.get("/intents/:id", (req, res) => res.json({ id: req.params.id }));
app.delete("/intents/:id", (req, res) => res.sendStatus(204));
`;

export default {
  id: "TS-1010",
  title: "Structural question with ast-grep present",
  ...cartoRun("cfg-full", brief("List the Express route handlers registered without the auth middleware (requireAuth).", `\`${EVIDENCE}/routes-without-auth.md\`.`), brownfield({ extra: (root) => write(root, "src/api/routes.ts", ROUTES) })),
  assert({ transcript, root }) {
    const { failures, check } = checker();
    const cmds = toolCalls(transcript, "Bash").filter((c) => c.agent !== null).map((c) => String(c.input?.command ?? ""));
    check(cmds.some((c) => /ast-grep run --pattern/.test(c)), `no "ast-grep run --pattern" call (Bash: ${cmds.join(" | ")})`);
    const entries = evidence(read(root, `${EVIDENCE}/routes-without-auth.md`));
    const ag = entries.filter((e) => e.layer === "ast-grep");
    check(ag.length > 0, `no ast-grep evidence (layers: ${entries.map((e) => e.layer).join(", ")})`);
    for (const e of ag) check(e.pattern.length > 3, `${e.id}: no pattern recorded`);
    return failures;
  },
};
