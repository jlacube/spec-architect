// Release check error catalogue (C002-COMP-010): a mirror of C002 errors.md §3 (ERR-REL-*), codes,
// conditions, messages, fixes and spec references verbatim (the message without the backticks that
// delimit it in errors.md; a test compares the two). Print form of errors.md "Print form": the release
// check prints `<code>: <message>` alone, one line per refusal, and the release record's `refusals`
// carry the code and the message separately (release-record.schema.json).

export type RelCode =
  | "ERR-REL-001" | "ERR-REL-002" | "ERR-REL-003" | "ERR-REL-004" | "ERR-REL-005" | "ERR-REL-006" | "ERR-REL-007"
  | "ERR-REL-008" | "ERR-REL-009" | "ERR-REL-010" | "ERR-REL-011" | "ERR-REL-012" | "ERR-REL-013";

export interface RelEntry {
  code: RelCode;
  condition: string;
  message: string;
  fix: string;
  spec: string;
}

const rows: [RelCode, string, string, string, string][] = [
  ["ERR-REL-001", "The corpus replay of the target reports a differing decision", "<target>: corpus replay differs on <case ids> (<mechanism>)", "Fix the enforcement mechanism or the generated rules, then replay", "C002-REQ-617, C002-NFR-201, C002-NFR-202"],
  ["ERR-REL-002", "An injection eval of the target shows an instruction acted upon", "<target>: injection case <case ids> acted upon", "Fix the agent prompts or wiring, then re-run the dev-tier evals", "C002-REQ-617, C002-NFR-203"],
  ["ERR-REL-003", "No checklist record exists for the Copilot VS Code release", "copilot: no checklist record for version <version>", "Run the manual VS Code checklist and commit its record", "C002-REQ-618"],
  ["ERR-REL-004", "The checklist record of the version has a step whose result is neither `passed` nor `not-applicable`, lacks a step of the package's enforcement mode, or records such a step as `not-applicable` (C002-IF-009 §4, §5; revised for defects D-015 item 8 and D-016 item 4). A step of the package's mode is a step of the checklist's step index whose mode is `both` or the package's mode, the injection steps excepted: where the record is the injection evidence ERR-REL-011 checks them, elsewhere they may be absent (C002-TS-633). One line per step. `<result>` is the recorded result as text, without quotes (`failed`, or another value that is neither `passed` nor `not-applicable`), `not recorded` for a step of the package's mode that the record does not list, or `not-applicable` for a step of the package's mode recorded as not applicable", "copilot: checklist step <step id> is <result>", "Fix the cause and run the checklist again; record every step of the package's mode once, with the result of its last run (C002-IF-009 §4)", "C002-REQ-618, C002-REQ-615"],
  ["ERR-REL-005", "The spike S-08 record gives `enforcement_mode: deferred`: `subagent_tool_list_confined` is `false` and `guard_hooks_block_subagent_calls` is `false` or absent, that is, subagents are not confined to their tool list and the Copilot guard hooks (plugin-level, keyed by `agent_type`, C002-IF-008 §2) do not block a subagent's tool calls (C002-IF-009 §3). The signed-off record gives `sdd-mcp-server`, so this refusal does not apply at the tested versions", "copilot: deferred by the spike S-08 record <path> (no enforcement mode holds)", "None in this change: the Copilot target is deferred (C002-DEC-005)", "C002-REQ-620"],
  ["ERR-REL-006", "A piece of release evidence ran on a host version other than the tested version", "<target>: <evidence> ran on <version>, tested version is <tested>", "Re-run the evidence on the tested version, or record a new tested version through a spike", "C002-REQ-621"],
  ["ERR-REL-007", "The target package proposed for release differs from a regeneration at the release commit", "<target>: package differs from regeneration: <files>", "Regenerate with `npm run package` at the release commit", "C002-NFR-501, C002-CON-01"],
  ["ERR-REL-008", "The target package was generated with an enforcement-mode override (`--mode`)", "<target>: package generated with --mode <mode>; release packages use the table's mode", "Regenerate without `--mode`", "C002-IF-004, C002-INV-04"],
  ["ERR-REL-009", "A required evidence file is missing or does not parse, a replay report cites corpora other than those of the release commit, or the injection evidence holds fewer than 20 cases (C002-IF-009 §5; revised for defect D-016 items 2 and 3). `<path>` is repository-relative with `/` separators. `<kind>` and `<path>` are: `spike record` and the S-07 or S-08 record; `corpus` and `tests/guards/path-corpus.json` or `tests/guards/bash-corpus.json`, missing or without a `cases` list; `corpus replay` and the replay report of a mechanism of the package's mode (C002-IF-009 §5) that is missing, does not parse as a replay report or names another mechanism; `corpus replay of the corpora at the release commit` and that report, when it cites a corpus file or SHA-256 other than those of the release commit; `checklist` and `docs/checklists/vscode-copilot.md`, missing or without a step index; `checklist record` and the record of the version, whose frontmatter does not parse or whose `steps` is not a list of mappings with an `id`; `injection summary` and `docs/releases/<target>/<version>/injection.json`, missing or not of the injection-summary shape; `injection summary (<n> cases, at least 20 required)` and that file, when it holds fewer than 20 cases; `injection steps (<n> cases, at least 20 required)` and the checklist record, when the record is the injection evidence, lacks no Copilot injection case (else ERR-REL-011) and holds fewer than 20 injection steps run (`passed` or `failed`). `<n>` is the number of cases found", "<target>: evidence <kind> missing or unreadable at <path>", "Produce the evidence (replay, evals, checklist, spike record); for a replay of other corpora, re-run the corpus replay suite at the release commit; for fewer than 20 cases, run the missing injection cases", "C002-REQ-617, C002-NFR-203"],
  ["ERR-REL-010", "In either Copilot enforcement mode, the checklist record does not show hooks enabled during the run: its `hooks_state` is not recorded, its `hooks_sources` are not recorded in full, its `hooks_state` contradicts the value derived from its `hooks_sources` (for example `enabled` with Workspace Trust `untrusted`, `chat.useHooks` `off` or an organisation policy that disables hooks; Q-release-hooks-01), or its `hooks_state` is `disabled` (C002-IF-009 §4, §5). One line per checklist record, for the first step of the C002-IF-009 §5 hooks-state check that applies. `<path>` is the record's repository-relative path with `/` separators. `<problem>` is `shows hooks not recorded`; `does not record hooks_sources <keys>`, `<keys>` being the keys not recorded among `use_hooks`, `workspace_trust` and `policy`, in that order, joined by `, `; `gives hooks_state <recorded>, but its hooks_sources (use_hooks <use_hooks>, workspace_trust <workspace_trust>, policy <policy>) give <derived>`, `<recorded>` and `<derived>` being `enabled` or `disabled` and each source its recorded value; or `shows hooks disabled`. Every value is printed without quotes", "copilot: checklist record <path> <problem>; the Copilot release needs evidence taken with hooks enabled", "Run the checklist again in VS Code with hooks enabled, record the three sources as read in the hooks-state step and `hooks_state` derived from them (C002-IF-009 §4), and commit the record", "C002-REQ-629, C002-REQ-615, C002-REQ-616"],
  ["ERR-REL-011", "Where the checklist record is the Copilot injection evidence (under the Copilot hooks fallback, and under sdd MCP server enforcement when the S-08 record gives `copilot_cli_loads_package: false`, C002-REQ-613; C002-IF-009 §5), the record lacks a step run (`passed` or `failed`) for one or more Copilot injection cases of the checklist's injection steps (results from Copilot CLI do not replace them). `<case ids>` are those cases, comma-separated in the checklist's order (revised for defect D-016 item 4)", "copilot: checklist record <path> lacks the Copilot injection cases <case ids>", "Run the missing injection steps in VS Code with hooks enabled", "C002-REQ-629, C002-REQ-628, C002-REQ-613"],
  ["ERR-REL-012", "A replay report does not list every corpus case exactly once, or its not-applicable list differs from the cases that C002-IF-009 §2.1 excludes for its mechanism, or a replayed case records an expected decision or expected-decision source other than the one C002-IF-009 §2.1 gives for its mechanism and the report's replay host, or the report's replay host lacks a host capability that a case of its cited corpora requires. `<problem>` is one of `omits cases`, `lists cases more than once`, `lists cases as not applicable without a rule`, `replays cases that its mechanism excludes`, `records expectations other than C002-IF-009 §2.1`, `replay host lacks <capability>`; for the last, `<case ids>` are the cases that require the capability. A case limited by `platforms` to platforms other than the report's `replay_host.platform` has no expectation on that host (C002-IF-009 §2.1) and is named under the problem of what the report did with it: `omits cases` when the report leaves it out, `records expectations other than C002-IF-009 §2.1` when the report replays it, `lists cases as not applicable without a rule` when the report lists it as not applicable. An entry that is no case of the cited corpora is named under `records expectations other than C002-IF-009 §2.1` when replayed and under `lists cases as not applicable without a rule` when listed as not applicable. A report that cites corpora other than those of the release commit is not checked case by case; ERR-REL-009 names it (revised for defect D-016 items 3 and 7)", "<target>: replay report <path> (<mechanism>) <problem>: <case ids>", "Re-run the corpus replay suite at the release commit; for `replay host lacks <capability>`, on a replay host that has it (`file-symlink`: REF-WIN with Developer Mode on, or the replay run elevated)", "C002-REQ-617, C002-REQ-626, C002-REQ-627, C002-REQ-630, C002-REQ-632, C002-REQ-633, C002-REQ-634"],
  ["ERR-REL-013", "OpenCode: the S-07 spike record gives `agent_tools_closed: false` or lacks the outcome, so the catch-all tool entry does not close the Architect agents' tool set (C002-IF-009 §3); `<value>` is `false` or `not recorded`, printed without quotes", "opencode: spike S-07 record <path> shows agent_tools_closed <value>; the Architect agents' tool set is not closed", "None in this change: the record triggers a revision of this spec with P-01 (C002-IF-009 §3)", "C002-REQ-108, C002-REQ-617"],
];

export const REL_CATALOGUE: Readonly<Record<RelCode, RelEntry>> = Object.fromEntries(
  rows.map(([code, condition, message, fix, spec]) => [code, { code, condition, message, fix, spec }]),
) as Record<RelCode, RelEntry>;

/** A refusal of the release record: the code and the Message cell with its placeholders filled. */
export interface Refusal {
  code: RelCode;
  message: string;
}

/** Fills every `<name>` placeholder of the code's message in one pass; an unknown placeholder throws. */
export function refusal(code: RelCode, params: Record<string, string>): Refusal {
  const message = REL_CATALOGUE[code].message.replace(/<([^<>]+)>/g, (_m, key: string) => {
    const v = params[key];
    if (v === undefined) throw new Error(`${code}: no value for <${key}>`);
    return v;
  });
  return { code, message };
}

/** Print form of errors.md §3: `<code>: <message>`. */
export function formatRefusal(r: Refusal): string {
  return `${r.code}: ${r.message}`;
}
