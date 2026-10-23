// Generator of the delegation routing suite (C001-T-063): writes the `claude plugin eval` case files
//   plugins/architect/evals/<case>/{prompt.md,graders/*.md}           the counted suite (PLG-EVAL-001, ≥ 90 %)
//   plugins/architect/evals-implicit/<case>/{prompt.md,graders/*.md}  the implicit set (reported apart)
// Usage: node evals/delegation/gen-suite.mjs   (rewrites both folders; TS-1117 checks they match this file)
//
// Every prompt is self-contained: the runs start in an empty sandbox, so a prompt never refers to code,
// files or changes the sandbox does not hold. The material a task needs (ideation text, requirements, a
// code excerpt) is given inline, and a task that reads a workspace (lint, status) accepts an empty one.
// Every counted case ends with the neutral HINT line (P-01, Q-eval-delegation-01, "Explicit + implicit";
// softened 2026-10-23 after the off-topic misses): the session may delegate when an agent matches, and the
// agent descriptions decide whether one does and which; off-topic,
// must-not-route and conductor cases carry the same hint, and their graders decide what passes. The
// implicit set repeats a few must-route prompts without the hint, one run each, to measure delegation on
// the session's own initiative; it does not count toward the 90 % or PLG-EVAL-001's minimums.
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/** The neutral delegation hint of the counted cases (names no agent). */
export const HINT = "If one of the Architect specialist agents matches this, give it to that agent; otherwise answer directly.";
/** Eval folders below the plugin: the counted suite and the implicit set. */
export const EVAL_DIR_NAME = "evals";
export const IMPLICIT_DIR_NAME = "evals-implicit";
/** Must-route cases repeated without the hint in the implicit set. */
export const IMPLICIT = ["route-researcher-01", "route-cartographer-01", "route-spec-writer-01", "route-critic-01", "route-auditor-01"];

const IDEATION = `Problem: customers cannot use promotional codes, so marketing campaigns need manual refunds.
Goal: a customer applies one percentage coupon at checkout; expired codes are refused; finance gets a monthly report of discounts.
Out of scope: gift cards.`;

const REQS = `- REQ-101: WHEN a customer applies a valid coupon code at checkout, THE checkout SHALL reduce the order total before tax by the coupon's percentage.
- REQ-102: WHEN a customer applies an expired coupon, THE checkout SHALL refuse it and show its expiry date.
- REQ-103: THE checkout SHALL accept at most one coupon per order.`;

const DISCOUNT_CODE = "```ts\n" + `// src/checkout/discount.ts
export function applyDiscount(totalCents: number, pct: number): number {
  return Math.round((totalCents * (100 - pct)) / 100);
}

// src/cart/summary.ts
import { applyDiscount } from "../checkout/discount";
export const cartTotal = (lines: { priceCents: number }[], pct: number) => applyDiscount(lines.reduce((s, l) => s + l.priceCents, 0), pct);

// src/billing/invoice.ts
import { applyDiscount } from "../checkout/discount";
export const invoiceTotal = (inv: { amountCents: number; discountPct: number }) => applyDiscount(inv.amountCents, inv.discountPct);

// tests/cart.test.ts
test("cart total with 10 %", () => expect(cartTotal([{ priceCents: 1000 }], 10)).toBe(900));
` + "```";

const ORDER_CODE = "```ts\n" + `// src/orders/service.ts
export class OrderService { total(o: Order) { return o.lines.reduce((s, l) => s + l.cents, 0); } }

// src/api/orders.ts
router.get("/orders/:id/total", (req, res) => res.json({ total: orders.total(load(req.params.id)) }));

// src/reports/monthly.ts
export const revenue = (all: Order[]) => all.reduce((s, o) => s + orders.total(o), 0);

// tests/orders.test.ts
test("total sums the lines", () => expect(new OrderService().total(order([100, 250]))).toBe(350));
` + "```";

const GATEWAY_CODE = "```ts\n" + `// src/billing/gateway.ts
export const gateway = { charge: (cents: number, card: Card) => http.post("/charge", { cents, card }) };

// src/checkout/payments.ts
import { gateway } from "../billing/gateway";
export const capture = (intent: Intent, card: Card) => gateway.charge(intent.cents, card);

// src/checkout/flow.ts
import { capture } from "./payments";
export const placeOrder = (cart: Cart, card: Card) => capture(createIntent(cart), card);

// src/subscriptions/renewal.ts
import { gateway } from "../billing/gateway";
export const renew = (sub: Sub) => gateway.charge(sub.priceCents, sub.card);
` + "```";

const PLAN = `- T-1 coupon service (no estimate)
- T-2 checkout integration, depends on T-3
- T-3 monthly report, depends on T-2
- Milestone M-1: "done when it works"`;

// [case name, kind, target agent, avoided agent (near-miss), trigger words, prompt]
export const CASES = [
  // A1 researcher — research / prior art / library docs
  ["route-researcher-01", "route", "sdd-researcher", null, "prior art", "Research prior art: how Shopify, Stripe Billing and open-source carts model coupon codes, expiry and stacking. I want a dated, sourced research note."],
  ["route-researcher-02", "route", "sdd-researcher", null, "library docs", "Look up the current library documentation of Zod for discriminated unions and refinements, and how it would validate a payload like { code, percent, expiresAt }. Cite the docs with their dates."],
  ["route-researcher-03", "route", "sdd-researcher", null, "research, public repositories, standards", "Research how public repositories implement idempotency keys for payment APIs, and what the IETF draft on the Idempotency-Key header says. Write it up as a sourced research note."],
  // A2 cartographer — codebase / callers / blast radius / hotspots / evidence (the code is given inline)
  ["route-cartographer-01", "route", "sdd-cartographer", null, "blast radius, callers, hotspots, evidence", `This is the part of our brownfield TypeScript codebase that matters:\n\n${DISCOUNT_CODE}\n\nMap the blast radius of changing applyDiscount to take a Coupon object instead of a percentage: its callers, the tests that reach it and the hotspots, with an evidence entry for each claim.`],
  ["route-cartographer-02", "route", "sdd-cartographer", null, "codebase, baseline survey, evidence", `Do the baseline survey of this checkout code for a brownfield change: which modules compute totals, who calls them and which tests cover them. Back every claim with an evidence entry.\n\n${DISCOUNT_CODE}`],
  ["route-cartographer-03", "route", "sdd-cartographer", null, "callers, evidence", `Find every caller of OrderService.total() in the code below and the test reach of each, as evidence for a regression set.\n\n${ORDER_CODE}`],
  // A3 options analyst — options / trade-off / decide
  ["route-options-analyst-01", "route", "sdd-options-analyst", null, "options, decide", "We have to decide how to store coupon redemptions: a Postgres table, Redis counters or an event log. Analyse the options: weighted criteria, four or five candidates scored 1–5, sensitivity and a recommendation."],
  ["route-options-analyst-02", "route", "sdd-options-analyst", null, "trade-off", "A team of four is starting a coupon service: monorepo or a separate repository? Give me the trade-off analysis with weighted criteria and scored candidates, and write it up as an options analysis."],
  ["route-options-analyst-03", "route", "sdd-options-analyst", null, "decide, options", "Help me decide between server-side rendering and a single-page app for an internal admin console: about 200 staff users, mostly forms and tables, a team of three. Weigh the options and recommend one; I'll pick at the next interview round."],
  // A4 spec-writer — user stories / requirements / EARS / NFR / domain (the ideation is given inline)
  ["route-spec-writer-01", "route", "sdd-spec-writer", null, "user stories, requirements, EARS", `Here is an approved ideation:\n\n${IDEATION}\n\nWrite the user stories and the EARS requirements of its coupons capability.`],
  ["route-spec-writer-02", "route", "sdd-spec-writer", null, "NFR", "Write the NFRs of a checkout capability — customers pay for their basket online, peaks of 500 orders a minute, it must work with screen readers: response time, availability and accessibility, each with a metric, a threshold and a method."],
  ["route-spec-writer-03", "route", "sdd-spec-writer", null, "EARS, user stories, domain", "Turn this into user stories and EARS requirements, and add the new domain terms to the domain model: customers enter one percentage coupon at checkout, expired codes are refused, finance gets a monthly report of discounts."],
  // A5 test designer — acceptance criteria / scenarios / test plan / definition of done (requirements inline)
  ["route-test-designer-01", "route", "sdd-test-designer", null, "acceptance criteria, scenarios", `These requirements are written:\n\n${REQS}\n\nWrite their acceptance criteria and Gherkin scenarios, with the coverage table.`],
  ["route-test-designer-02", "route", "sdd-test-designer", null, "definition of done", `Write the definition of done of a small change that adds coupon codes at checkout, with these requirements:\n\n${REQS}\n\nInherit these global DoD items: all automated tests pass in CI; a second person reviews the change.`],
  ["route-test-designer-03", "route", "sdd-test-designer", null, "test plan", "Write the test plan for these acceptance scenarios: TS-101 a valid coupon reduces the total before tax; TS-102 an expired coupon is refused with its date; TS-103 a second coupon is refused. Map each to a test case with its level, fixture and environment."],
  // A6 architect — architecture / components / interfaces / ADR / diagram
  ["route-architect-01", "route", "sdd-architect", null, "architecture, components, diagram", `Write the architecture for adding coupon codes to a web checkout with these requirements:\n\n${REQS}\n\nI need the component catalogue, a Mermaid component diagram and a sequence diagram of applying a coupon.`],
  ["route-architect-02", "route", "sdd-architect", null, "interfaces", "Define the interface of a coupon service — validate a code, apply it to an order, list a month's redemptions — as an OpenAPI contract, add it to the interface registry, and write its error catalogue."],
  ["route-architect-03", "route", "sdd-architect", null, "ADR", "Record an ADR in MADR form: coupon validation moves out of the checkout into its own component. Link it to the constraints and components it affects: the checkout, the coupon service and the order store."],
  // A7 planner — plan / tasks / milestones / rollout / hand-off
  ["route-planner-01", "route", "sdd-planner", null, "tasks, milestones", `An approved spec for coupon codes has these requirements, a coupon-service component and an OpenAPI contract:\n\n${REQS}\n\nBreak it down into tasks with their dependencies, group them into milestones and show the critical path.`],
  ["route-planner-02", "route", "sdd-planner", null, "rollout, hand-off", "Write the rollout and rollback plan and the implementer hand-off, with the ordered task list, for shipping coupon codes behind a feature flag. The work: a coupon service, the checkout integration, a monthly report and a database migration."],
  ["route-planner-03", "route", "sdd-planner", null, "plan, tasks", "Plan the coupons work: a task file per unit of work (coupon service, checkout integration, expiry check, monthly report), each with its estimate and depends_on, ordered into milestones."],
  // A8 critic — review / critique / gaps / ambiguity (the artifact is given inline)
  ["route-critic-01", "route", "sdd-critic", null, "review, gaps, ambiguity", `Review this spec before its gate:\n\n${REQS}\n- NFR-1: the checkout shall be fast.\n\nFind gaps, ambiguity, contradictions and untestable statements, and write the critic report.`],
  ["route-critic-02", "route", "sdd-critic", null, "critique", `Critique this ideation and give me its readiness verdict:\n\n${IDEATION}\nOpen question: do coupons stack? (no owner, no phase)`],
  ["route-critic-03", "route", "sdd-critic", null, "review, gaps", `Is this plan ready for its gate? Review it against the plan rubric and list the gaps as evidence-backed findings.\n\n${PLAN}`],
  // A9 auditor — lint / trace / status / registry (an empty workspace is a valid answer)
  ["route-auditor-01", "route", "sdd-auditor", null, "lint, trace", "Run the sdd lint and traceability checks on the SDD workspace here and report the counts per file. If there is no workspace, report what the commands say."],
  ["route-auditor-02", "route", "sdd-auditor", null, "status, registry", "Refresh the SDD registry and status with the sdd commands, and tell me which phases are stale. An empty workspace is a valid answer; report what the commands say."],
  ["route-auditor-03", "route", "sdd-auditor", null, "lint, trace, status", "Give me the deterministic audit of the SDD workspace here — lint counts, traceability coverage and stale phases — from the sdd commands only, even if they find nothing."],
  // A0 conductor — the workflow itself; main session only, so the right route is the hand-over
  ["route-conductor-01", "handover", "sdd-conductor", null, "ideation → specification → planning, gates", "Take my idea through the Architect workflow — ideation, then the specification, then the plan, with a gate at each phase: customers should be able to enter coupon codes at checkout."],
  ["route-conductor-02", "handover", "sdd-conductor", null, "spec-driven workflow, interview", "Start the spec-driven workflow for a new change and interview me about it as we go, in rounds of questions with options."],
  ["route-conductor-03", "handover", "sdd-conductor", null, "drive a change, gates", "I want the Architect suite to drive a new change for coupon codes from ideation to an approved plan, and ask me at each gate."],
  // Near misses: a sibling's trigger words; the case must route to the owner and not to the neighbour
  ["notroute-researcher-01", "near", "sdd-cartographer", "sdd-researcher", "codebase, callers (not research)", `In our code below, find which modules call the payment gateway client and how deep the call chains go, with evidence for each.\n\n${GATEWAY_CODE}`],
  ["notroute-cartographer-01", "near", "sdd-researcher", "sdd-cartographer", "public repositories, prior art (not codebase)", "Research how other open-source projects structure a plugin marketplace manifest — public repositories and their docs, with dated sources."],
  ["notroute-options-analyst-01", "near", "sdd-researcher", "sdd-options-analyst", "library docs (not options)", "Collect sourced documentation on how Redis and PostgreSQL implement atomic counters, with links and dates. Just the facts, no recommendation."],
  ["notroute-spec-writer-01", "near", "sdd-test-designer", "sdd-spec-writer", "scenarios (not requirements)", "Write the Gherkin acceptance scenarios, including the boundary and error cases, for this requirement: REQ-102 WHEN a customer applies an expired coupon, THE checkout SHALL refuse it and show its expiry date."],
  ["notroute-test-designer-01", "near", "sdd-spec-writer", "sdd-test-designer", "EARS requirement (not acceptance)", "Write this as an EARS requirement with its user story: when a customer applies an expired coupon, the checkout refuses it and shows the expiry date."],
  ["notroute-architect-01", "near", "sdd-planner", "sdd-architect", "tasks, estimates (not architecture)", "Break this architecture into implementation tasks with estimates and dependencies: components checkout, coupon service and order store; the coupon service exposes validate and apply; the checkout calls it before tax."],
  ["notroute-planner-01", "near", "sdd-critic", "sdd-planner", "review, gaps (not plan)", `Review this plan for gaps and ambiguity before its gate:\n\n${PLAN}`],
  ["notroute-critic-01", "near", "sdd-auditor", "sdd-critic", "lint (not review)", "Run sdd lint on the plan phase of the SDD workspace here and report the error and warning counts; zero findings or no workspace is a valid answer."],
  ["notroute-auditor-01", "near", "sdd-critic", "sdd-auditor", "ambiguity (not lint)", "Check these requirements for ambiguity and untestable statements: REQ-1 the checkout shall be fast; REQ-2 WHEN a coupon is applied, THE checkout SHALL reduce the total appropriately."],
  ["notroute-conductor-01", "near", "sdd-auditor", "sdd-conductor", "status, registry (not the workflow)", "Show the status of every SDD change here — phases, stale phases and the registry — from the sdd status command. An empty workspace is a valid answer."],
  // Off-topic: no Architect agent at all
  ["offtopic-01", "none", null, null, "general programming", "What is the difference between let and const in JavaScript? One short paragraph."],
  ["offtopic-02", "none", null, null, "general programming", "Write a regular expression that matches ISO 8601 calendar dates such as 2026-10-23, and explain it in two sentences."],
];

const SUBAGENT = (a) => `'"subagent_type"\\s*:\\s*"architect:${a}"'`;
const fm = (o) => `---\n${Object.entries(o).map(([k, v]) => `${k}: ${v}`).join("\n")}\n---\n`;

/** Writes one case folder under `root`; `implicit` drops the hint and runs once. */
function writeCase(root, [name, kind, target, avoid, words, prompt], { implicit = false } = {}) {
  const dir = join(root, name);
  mkdirSync(join(dir, "graders"), { recursive: true });
  const expect = kind === "route" ? `must route to architect:${target}` : kind === "handover" ? `must route to architect:${target} (main session: hand over, no subagent)` : kind === "near" ? `must route to architect:${target}, must not route to architect:${avoid}` : "must not route to any Architect agent";
  const tags = ["routing", ...(implicit ? ["implicit"] : []), kind === "none" ? "off-topic" : kind === "near" ? "must-not-route" : "must-route", ...(target ? [target] : []), ...(avoid ? [`not-${avoid}`] : [])];
  writeFileSync(
    join(dir, "prompt.md"),
    fm({
      description: JSON.stringify(`${expect}${implicit ? ", without the delegation hint" : ""} (trigger words: ${words})`),
      tags: `[${tags.join(", ")}]`,
      runs: implicit ? 1 : 3,
      model: "opus",
      max_turns: 6,
      // The routing decision comes in the first 10–30 s; a run that is still waiting for its subagent at the
      // limit is re-graded from its kept trace (suite.mjs regradeTimeouts), so the limit also bounds the spend.
      timeout_seconds: 120,
      allowed_tools: "[Agent]",
      // The plugin commands (Skill tool) are conductor entry points that hand over outside the conductor
      // session; routing is decided on the agent descriptions (C001-IF-09 routing contract).
      disallowed_tools: "[Skill]",
    }) + `\n${prompt}\n${implicit ? "" : `\n${HINT}\n`}`,
  );
  const g = (file, o, body = "") => writeFileSync(join(dir, "graders", `${file}.md`), fm(o) + (body ? `\n${body}\n` : ""));
  if (kind === "route" || kind === "near") g(`routes-to-${target.slice(4)}`, { type: "tool_used", tool: "Agent", input_match: SUBAGENT(target), min: 1 });
  if (kind === "route") g("no-other-architect-agent", { type: "tool_used", tool: "Agent", input_match: `'"subagent_type"\\s*:\\s*"architect:(?!${target}")'`, min: 0, max: 0, arm: "both" });
  if (kind === "near") g(`not-${avoid.slice(4)}`, { type: "tool_used", tool: "Agent", input_match: SUBAGENT(avoid), min: 0, max: 0, arm: "both" });
  if (kind === "near" && avoid === "sdd-conductor") g("no-hand-over-to-conductor", { type: "regex", target: "last_message", match: "not_contains" }, "claude --agent architect:sdd-conductor");
  if (kind === "handover") {
    g("hands-over-to-conductor", { type: "regex", target: "last_message", match: "contains" }, "claude --agent architect:sdd-conductor");
    g("no-architect-subagent", { type: "tool_used", tool: "Agent", input_match: `'"subagent_type"\\s*:\\s*"architect:'`, min: 0, max: 0, arm: "both" });
  }
  if (kind === "none") g("no-architect-agent", { type: "tool_used", tool: "Agent", input_match: `'"subagent_type"\\s*:\\s*"architect:'`, min: 0, max: 0, arm: "both" });
}

/** Writes the counted suite and the implicit set below `pluginDir` (each folder replaced). */
export function writeSuite(pluginDir) {
  const counted = join(pluginDir, EVAL_DIR_NAME);
  const implicit = join(pluginDir, IMPLICIT_DIR_NAME);
  rmSync(counted, { recursive: true, force: true });
  rmSync(implicit, { recursive: true, force: true });
  for (const c of CASES) writeCase(counted, c);
  for (const name of IMPLICIT) {
    const c = CASES.find((x) => x[0] === name);
    writeCase(implicit, [name.replace(/^route-/, "implicit-"), ...c.slice(1)], { implicit: true });
  }
  return { counted: CASES.length, implicit: IMPLICIT.length };
}

// Script entry only.
if (process.argv[1]?.endsWith("gen-suite.mjs") && import.meta.filename === process.argv[1]) {
  const plugin = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "plugins", "architect");
  const n = writeSuite(plugin);
  console.log(`${n.counted} counted cases in ${join(plugin, EVAL_DIR_NAME)}, ${n.implicit} implicit cases in ${join(plugin, IMPLICIT_DIR_NAME)}`);
}
