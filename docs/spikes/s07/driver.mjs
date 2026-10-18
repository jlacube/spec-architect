// S-07 throwaway probe driver (C002-ADR-005 feasibility). Never shipped.
//
//   node driver.mjs <workspace> <cases.json> <out.json> [--real <provider/model>]
//
// Starts the stub model (unless --real) and `opencode serve` in <workspace>, then for each case
// creates a session, scripts the stub to answer the first turn with exactly the case's tool call,
// prompts the case's agent, answers question/permission requests as the case says, and records the
// final state of every tool part. With --real, the session runs against the named real model
// (OpenRouter) and the stub is not started.
//
// Case: { id, agent, tool, args, question?: "answer:<label>" | "reject", permission?: "once"|"reject",
//         prompt?: string, script?: [...] }
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { createOpencodeClient } from "@opencode-ai/sdk/v2/client";

const [ws, casesFile, outFile] = process.argv.slice(2);
const realIdx = process.argv.indexOf("--real");
const realModel = realIdx > 0 ? process.argv[realIdx + 1] : null;
const isolate = !process.argv.includes("--no-isolate");
const STUB_PORT = 4199;
const OC_PORT = 4198;
const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const logs = path.join(ws, "..", "logs");
fs.mkdirSync(logs, { recursive: true });
const cases = JSON.parse(fs.readFileSync(casesFile, "utf8"));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const env = { ...process.env, S07_PLUGIN_LOG: path.join(logs, "plugin.jsonl") };
for (const k of Object.keys(env)) if (/^(OPENROUTER|ANTHROPIC|OPENAI|CLAUDE)/i.test(k)) delete env[k];
if (isolate) {
  // isolated XDG folders: no global config, empty cache (rg.exe pre-provisioned), and for stub runs
  // no stored credential (isolated data); a --real run keeps the real data folder, which holds
  // OpenCode's own credential store (never read by this probe)
  const xdg = path.join(ws, "..", realModel ? "xdg-real" : "xdg");
  for (const d of ["config", "data", "cache", "state"]) fs.mkdirSync(path.join(xdg, d), { recursive: true });
  Object.assign(env, {
    XDG_CONFIG_HOME: path.join(xdg, "config"), XDG_CACHE_HOME: path.join(xdg, "cache"), XDG_STATE_HOME: path.join(xdg, "state"),
  });
  if (!realModel) env.XDG_DATA_HOME = path.join(xdg, "data");
  // the real data folder's opencode.db was migrated by a newer OpenCode (1.18.31 on REF-WIN) and
  // 1.15.10 fails on it (NOT NULL constraint failed: session_message.seq); use a probe database
  else env.OPENCODE_DB = path.join(xdg, "data", "opencode-s07.db");
}
if (!realModel) {
  // any non-loopback HTTP(S) request goes to a closed port
  Object.assign(env, { HTTP_PROXY: "http://127.0.0.1:9", HTTPS_PROXY: "http://127.0.0.1:9", NO_PROXY: "127.0.0.1,localhost" });
}
Object.assign(env, {
  // models.dev fetch off for stub runs only: a --real run needs the catalog to resolve openrouter/* ids
  OPENCODE_DISABLE_AUTOUPDATE: "1", ...(realModel ? {} : { OPENCODE_DISABLE_MODELS_FETCH: "1" }), OPENCODE_DISABLE_LSP_DOWNLOAD: "1",
  OPENCODE_DISABLE_SHARE: "1",
  // OpenCode runs npm for <workspace>/.opencode (plugin dependencies); the probe pre-provisions
  // package.json + node_modules there, and npm must not reach the registry
  npm_config_offline: "true", npm_config_audit: "false", npm_config_fund: "false",
});

const procs = [];
if (!realModel) {
  const stub = spawn(process.execPath, [path.join(here, "stub-model.mjs"), String(STUB_PORT), path.join(logs, "stub-model.jsonl")], { stdio: "ignore" });
  procs.push(stub);
}
const oc = spawn("opencode", ["serve", "--port", String(OC_PORT), "--hostname", "127.0.0.1", "--print-logs", "--log-level", "INFO"], { cwd: ws, env, shell: true });
procs.push(oc);
const ocLog = fs.createWriteStream(path.join(logs, "opencode-serve.log"), { flags: "a" });
oc.stdout.pipe(ocLog);
oc.stderr.pipe(ocLog);
const cleanup = () => { for (const p of procs) { try { if (process.platform === "win32") spawnSync("taskkill", ["/pid", String(p.pid), "/t", "/f"]); else p.kill(); } catch {} } };
process.on("exit", cleanup);

const baseUrl = `http://127.0.0.1:${OC_PORT}`;
for (let i = 0; i < 120; i++) {
  try { const r = await fetch(`${baseUrl}/global/health`); if (r.ok) break; } catch {}
  await sleep(500);
}
const client = createOpencodeClient({ baseUrl, directory: ws });

const events = [];
let current = null;
(async () => {
  const sub = await client.event.subscribe();
  for await (const ev of sub.stream) {
    events.push(ev);
    const t = ev.type;
    if (t === "question.asked" && current) {
      const q = ev.properties;
      current.question_event = q;
      if (current.question === "reject") await client.question.reject({ requestID: q.id });
      else {
        const label = (current.question ?? "answer:A").replace(/^answer:/, "");
        await client.question.reply({ requestID: q.id, answers: (q.questions ?? [1]).map(() => [label]) });
      }
    }
    if (t === "permission.asked" && current) {
      const p = ev.properties;
      current.permission_events = [...(current.permission_events ?? []), p];
      await client.permission.reply({ requestID: p.id, reply: current.permission ?? "reject" });
    }
  }
})().catch((e) => console.error("event stream", e));

const results = [];
const [providerID, ...rest] = (realModel ?? "stub/stub-model").split("/");
const model = { providerID, modelID: rest.join("/") };
for (const c of cases) {
  current = { ...c };
  if (!realModel) {
    const script = c.script ?? [{ tool: c.tool, args: c.args }];
    await fetch(`http://127.0.0.1:${STUB_PORT}/script`, { method: "POST", body: JSON.stringify(script) });
  }
  const t0 = Date.now();
  const s = await client.session.create({ title: `s07 ${c.id}` });
  const sessionID = s.data?.id;
  let promptError = null;
  try {
    const m = c.model ? { providerID: c.model.split("/")[0], modelID: c.model.split("/").slice(1).join("/") } : model;
    const r = await client.session.prompt({ sessionID, agent: c.agent, model: m, parts: [{ type: "text", text: c.prompt ?? `probe ${c.id}` }] });
    if (r.error) promptError = r.error;
  } catch (e) { promptError = String(e); }
  const msgs = (await client.session.messages({ sessionID })).data ?? [];
  const parts = msgs.flatMap((m) => m.parts ?? []);
  const tools = parts.filter((p) => p.type === "tool").map((p) => ({
    tool: p.tool, status: p.state?.status, input: p.state?.input,
    error: p.state?.error, output: typeof p.state?.output === "string" ? p.state.output.slice(0, 600) : p.state?.output,
    metadata: p.state?.metadata,
  }));
  const assistant = msgs.filter((m) => m.info?.role === "assistant").map((m) => ({ cost: m.info.cost, tokens: m.info.tokens, error: m.info.error, finish: m.info.finish, modelID: m.info.modelID }));
  const text = parts.filter((p) => p.type === "text").map((p) => p.text).join("\n").slice(0, 1500);
  results.push({ id: c.id, agent: c.agent, sessionID, ms: Date.now() - t0, promptError, tools, assistant, text,
    question_event: current.question_event, permission_events: current.permission_events });
  console.log(c.id, JSON.stringify(tools.map((t) => [t.tool, t.status, (t.error ?? "").slice(0, 120)])));
}
fs.writeFileSync(outFile, JSON.stringify({ realModel, results, eventTypes: [...new Set(events.map((e) => e.type))] }, null, 2));
cleanup();
process.exit(0);
