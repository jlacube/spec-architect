---
id: C002-PLAN-WBS
artifact: plan/work-breakdown
change: CHG-002
phase: 20-plan
status: draft
---

# CHG-002 — Work breakdown

Edges are `depends_on` (dependency → dependent). Node IDs are task IDs with `-` replaced by `_`.

```mermaid
flowchart TB
  subgraph M01["C002-M-01 Spikes and P-01 prerequisites"]
    C002_T_001["T-001 Spike S-07: OpenCode (P-01 OpenRouter check first)"]
    C002_T_002["T-002 Spike S-08: Copilot in VS Code"]
    C002_T_003["T-003 P-01: npm account and name"]
    C002_T_060["T-060 Eval auth switch (built)"]
  end
  subgraph M02["C002-M-02 Shared guard and CLI deltas"]
    C002_T_053["T-053 Lint loop honours waivers"]
    C002_T_004["T-004 Version source, --version, first line"]
    C002_T_005["T-005 Repository-root helper"]
    C002_T_006["T-006 Spec locator, schema-copy test, coupled tests"]
    C002_T_007["T-007 Corpus format for replay"]
    C002_T_008["T-008 Bare sdd and node --version (D-011)"]
    C002_T_009["T-009 Writing-command table and --cwd"]
    C002_T_010["T-010 Serena-command confinement"]
    C002_T_011["T-011 Path guard memory option"]
    C002_T_012["T-012 template show and list"]
    C002_T_013["T-013 Serena --user-data and --read-only"]
    C002_T_014["T-014 host-version"]
    C002_T_015["T-015 Claude staging leaves out targets"]
    C002_T_059["T-059 sdd install denied in every form"]
  end
  subgraph M03["C002-M-03 sdd MCP server and architect-sdd"]
    C002_T_016["T-016 MCP binding and profiles"]
    C002_T_017["T-017 MCP write tools"]
    C002_T_018["T-018 MCP quick-lint findings"]
    C002_T_019["T-019 MCP run_command"]
    C002_T_020["T-020 MCP faults and benchmarks"]
    C002_T_021["T-021 Two bundles and licence check"]
    C002_T_022["T-022 npm staging and pack"]
    C002_T_023["T-023 Install smoke and manifest check"]
  end
  subgraph M04["C002-M-04 Target generator and packages"]
    C002_T_024["T-024 Mapping tables"]
    C002_T_025["T-025 Generator frame"]
    C002_T_026["T-026 Translator: frontmatter"]
    C002_T_027["T-027 Translator: body constructs"]
    C002_T_028["T-028 Wiring variants and inlining"]
    C002_T_029["T-029 OpenCode emitter"]
    C002_T_030["T-030 OpenCode permissions"]
    C002_T_031["T-031 Copilot emitter"]
    C002_T_032["T-032 Copilot hook adapter (agent_type, mode, subagent guard)"]
    C002_T_033["T-033 Copilot hook template (both modes) and tool classes"]
    C002_T_034["T-034 Packaging runs the generator, target zips"]
    C002_T_035["T-035 Target structure checks"]
    C002_T_036["T-036 Determinism and benchmark"]
    C002_T_058["T-058 sdd install copilot"]
  end
  subgraph M05["C002-M-05 Workflow on every host"]
    C002_T_037["T-037 Question-tool variants"]
    C002_T_038["T-038 Doctor host rows"]
    C002_T_039["T-039 README target sections"]
  end
  subgraph M06["C002-M-06 Verification tooling"]
    C002_T_040["T-040 Replay framework"]
    C002_T_041["T-041 Replay adapters: server, hooks"]
    C002_T_042["T-042 OpenCode driver and replay adapter"]
    C002_T_043["T-043 S-07 final replay and mode"]
    C002_T_044["T-044 OpenCode eval runner"]
    C002_T_045["T-045 Copilot CLI eval runner"]
    C002_T_046["T-046 VS Code checklist"]
    C002_T_047["T-047 Release check"]
    C002_T_056["T-056 OpenCode carried eval runs"]
  end
  subgraph M07["C002-M-07 Release evidence and release"]
    C002_T_048["T-048 Claude Code regression run"]
    C002_T_049["T-049 OpenCode release evidence"]
    C002_T_051["T-051 OpenCode clean-profile run"]
    C002_T_052["T-052 P-01 publish and OpenCode release"]
    C002_T_054["T-054 Copilot release evidence"]
    C002_T_050["T-050 P-01 checklist run"]
    C002_T_057["T-057 Copilot clean-profile run"]
    C002_T_055["T-055 P-01 Copilot release"]
  end
  C002_T_053 --> C002_T_006
  C002_T_007 --> C002_T_008
  C002_T_005 --> C002_T_009
  C002_T_006 --> C002_T_009
  C002_T_008 --> C002_T_009
  C002_T_005 --> C002_T_010
  C002_T_009 --> C002_T_010
  C002_T_060 --> C002_T_010
  C002_T_006 --> C002_T_012
  C002_T_005 --> C002_T_013
  C002_T_006 --> C002_T_013
  C002_T_006 --> C002_T_014
  C002_T_004 --> C002_T_016
  C002_T_006 --> C002_T_016
  C002_T_011 --> C002_T_017
  C002_T_016 --> C002_T_017
  C002_T_017 --> C002_T_018
  C002_T_008 --> C002_T_019
  C002_T_010 --> C002_T_019
  C002_T_016 --> C002_T_019
  C002_T_059 --> C002_T_019
  C002_T_009 --> C002_T_059
  C002_T_010 --> C002_T_059
  C002_T_018 --> C002_T_020
  C002_T_019 --> C002_T_020
  C002_T_004 --> C002_T_021
  C002_T_016 --> C002_T_021
  C002_T_003 --> C002_T_022
  C002_T_012 --> C002_T_022
  C002_T_013 --> C002_T_022
  C002_T_021 --> C002_T_022
  C002_T_022 --> C002_T_023
  C002_T_001 --> C002_T_024
  C002_T_002 --> C002_T_024
  C002_T_006 --> C002_T_024
  C002_T_015 --> C002_T_024
  C002_T_004 --> C002_T_025
  C002_T_024 --> C002_T_025
  C002_T_025 --> C002_T_026
  C002_T_040 --> C002_T_026
  C002_T_025 --> C002_T_027
  C002_T_027 --> C002_T_028
  C002_T_022 --> C002_T_029
  C002_T_026 --> C002_T_029
  C002_T_028 --> C002_T_029
  C002_T_009 --> C002_T_030
  C002_T_010 --> C002_T_030
  C002_T_029 --> C002_T_030
  C002_T_021 --> C002_T_031
  C002_T_026 --> C002_T_031
  C002_T_028 --> C002_T_031
  C002_T_002 --> C002_T_032
  C002_T_006 --> C002_T_032
  C002_T_010 --> C002_T_032
  C002_T_011 --> C002_T_032
  C002_T_059 --> C002_T_032
  C002_T_031 --> C002_T_033
  C002_T_032 --> C002_T_033
  C002_T_005 --> C002_T_058
  C002_T_009 --> C002_T_058
  C002_T_031 --> C002_T_058
  C002_T_033 --> C002_T_058
  C002_T_022 --> C002_T_034
  C002_T_029 --> C002_T_034
  C002_T_031 --> C002_T_034
  C002_T_022 --> C002_T_035
  C002_T_030 --> C002_T_035
  C002_T_033 --> C002_T_035
  C002_T_034 --> C002_T_036
  C002_T_028 --> C002_T_037
  C002_T_060 --> C002_T_037
  C002_T_013 --> C002_T_038
  C002_T_014 --> C002_T_038
  C002_T_028 --> C002_T_038
  C002_T_060 --> C002_T_038
  C002_T_030 --> C002_T_039
  C002_T_033 --> C002_T_039
  C002_T_006 --> C002_T_040
  C002_T_007 --> C002_T_040
  C002_T_020 --> C002_T_041
  C002_T_022 --> C002_T_041
  C002_T_033 --> C002_T_041
  C002_T_040 --> C002_T_041
  C002_T_001 --> C002_T_042
  C002_T_030 --> C002_T_042
  C002_T_040 --> C002_T_042
  C002_T_042 --> C002_T_043
  C002_T_037 --> C002_T_044
  C002_T_042 --> C002_T_044
  C002_T_002 --> C002_T_045
  C002_T_044 --> C002_T_045
  C002_T_058 --> C002_T_045
  C002_T_033 --> C002_T_046
  C002_T_037 --> C002_T_046
  C002_T_038 --> C002_T_046
  C002_T_058 --> C002_T_046
  C002_T_034 --> C002_T_047
  C002_T_040 --> C002_T_047
  C002_T_046 --> C002_T_047
  C002_T_038 --> C002_T_056
  C002_T_044 --> C002_T_056
  C002_T_022 --> C002_T_048
  C002_T_035 --> C002_T_048
  C002_T_037 --> C002_T_048
  C002_T_038 --> C002_T_048
  C002_T_042 --> C002_T_048
  C002_T_044 --> C002_T_048
  C002_T_045 --> C002_T_048
  C002_T_047 --> C002_T_048
  C002_T_060 --> C002_T_048
  C002_T_036 --> C002_T_049
  C002_T_041 --> C002_T_049
  C002_T_043 --> C002_T_049
  C002_T_044 --> C002_T_049
  C002_T_048 --> C002_T_049
  C002_T_056 --> C002_T_049
  C002_T_023 --> C002_T_051
  C002_T_034 --> C002_T_051
  C002_T_039 --> C002_T_051
  C002_T_043 --> C002_T_051
  C002_T_003 --> C002_T_052
  C002_T_023 --> C002_T_052
  C002_T_047 --> C002_T_052
  C002_T_048 --> C002_T_052
  C002_T_049 --> C002_T_052
  C002_T_051 --> C002_T_052
  C002_T_036 --> C002_T_054
  C002_T_041 --> C002_T_054
  C002_T_045 --> C002_T_054
  C002_T_048 --> C002_T_054
  C002_T_046 --> C002_T_050
  C002_T_054 --> C002_T_050
  C002_T_023 --> C002_T_057
  C002_T_034 --> C002_T_057
  C002_T_039 --> C002_T_057
  C002_T_058 --> C002_T_057
  C002_T_003 --> C002_T_055
  C002_T_023 --> C002_T_055
  C002_T_047 --> C002_T_055
  C002_T_048 --> C002_T_055
  C002_T_050 --> C002_T_055
  C002_T_054 --> C002_T_055
  C002_T_057 --> C002_T_055
```

## Critical path

Weights S = 1, M = 2, L = 3. The 60 tasks weigh 121 in total (18 S, 23 M, 19 L). The longest chain
weighs 33 and ends with the Copilot release (unchanged by the D-003 plan updates: C002-T-032, now L
for the subagent guard, finishes at 11, before C002-T-031 at 16, so C002-T-033 still finishes at 18
and C002-T-058 at 21, four units before C002-T-044, and C002-T-045 still starts at 25; C002-T-060,
the eval auth switch, is already built and finishes at 1, before C002-T-010, C002-T-037, C002-T-038
and C002-T-048 need it); the OpenCode release ends one unit earlier, at 32, and
no longer waits for any Copilot release task (C002-T-050, C002-T-054, C002-T-055, C002-T-057).

**Overall (to C002-T-055, weight 33):**

1. C002-T-001 — Spike S-07: OpenCode at its tested version (L)
2. C002-T-024 — Mapping tables, their schema copy and loader (M)
3. C002-T-025 — Generator: entry, source reader, writer and manifest (L)
4. C002-T-027 — Translator: body constructs, templates, plugin data and question tool (M)
5. C002-T-028 — Wiring variants, anchors and skill inlining (L)
6. C002-T-029 — OpenCode emitter: layout, agents, commands, MCP servers and install notes (L)
7. C002-T-030 — OpenCode permission rules for both modes and the quick-lint plugin (L)
8. C002-T-042 — OpenCode session driver and the opencode-permissions replay adapter (L)
9. C002-T-044 — OpenCode eval runner behind the existing case API (L)
10. C002-T-045 — Copilot CLI eval runner (M)
11. C002-T-048 — Claude Code regression set run (M)
12. C002-T-054 — Release evidence for Copilot: corpus replay and Copilot CLI dev-tier evals (M)
13. C002-T-050 — P-01: run the manual VS Code checklist and record it (S)
14. C002-T-055 — P-01: release the Copilot target (S)

**OpenCode release (to C002-T-052, weight 32):** items 1 to 11 above, then C002-T-049 — Release
evidence for OpenCode (M) and C002-T-052 — P-01: publish architect-sdd and release the OpenCode
target (S). The carried OpenCode eval runs (C002-T-056, L, finishing at 28) have one unit of slack
against C002-T-048 (finishing at 29).

The remaining Copilot coupling of the OpenCode chain is shared tooling, not a release decision:
C002-T-048 waits for C002-T-045 (shared `evals/harness/session.mjs`, critic CR-7), C002-T-047 for the
checklist template of C002-T-046 (which now waits for C002-T-058 and finishes at 23; C002-T-047 at
26, one unit before C002-T-045), and C002-T-039 and C002-T-041 for C002-T-033. The Copilot defer
branch is not taken (signed-off S-08 record, `10-strategy.md` §4); only a later record would remove
these dependencies (`75-rollout.md` §5), and the OpenCode chain would then end at 31 (through
C002-T-044, C002-T-056, C002-T-049 and C002-T-052).

C002-T-002 (S-08) has the same weight as C002-T-001 and is equally critical: C002-T-024 waits for both
spike records. C002-T-053 (finishing at 1) and C002-T-006 (at 3) finish together with the spikes.
C002-T-026 (C002-M-04) also waits for C002-T-040 (C002-M-06), so that `scripts/test.mjs` leaves out
`tests/replay/` before the first replay test file lands (critic CR-17); C002-T-040 finishes at 6,
before C002-T-025 at 8, so the critical path does not move.
Slack: C002-T-021 finishes at 8 and C002-T-031 starts at 13; C002-T-022 finishes at 11 and C002-T-029
starts at 13 (C002-T-034 at 16); C002-T-059 finishes at 8, so C002-T-019 finishes at 11 and
C002-T-020 at 13, and C002-T-041 starts at 18. The guard, CLI and MCP work of C002-M-02 and C002-M-03
can therefore slip by 2 to 5 units without moving the end date.

## Tasks by milestone

| Milestone | Task | Title | Estimate | Depends on |
|---|---|---|---|---|
| C002-M-01 | C002-T-001 | Spike S-07: OpenCode at its tested version | L | — |
| C002-M-01 | C002-T-002 | Spike S-08: GitHub Copilot in VS Code and Copilot CLI | L | — |
| C002-M-01 | C002-T-003 | P-01: npm account and availability of the name architect-sdd | S | — |
| C002-M-01 | C002-T-060 | Eval harness: auth switch between the prepaid API key and P-01's Claude subscription | S | — |
| C002-M-02 | C002-T-053 | Approved-phase lint loop of frontend.test.ts excludes waived findings | S | — |
| C002-M-02 | C002-T-004 | Single version source, bare sdd --version and the executable first line | M | — |
| C002-M-02 | C002-T-005 | Shared repository-root helper | S | — |
| C002-M-02 | C002-T-006 | Spec-contract locator, schema-copy equality test and CHG-001-coupled CLI tests | M | T-053 |
| C002-M-02 | C002-T-007 | Guard corpora format for per-case cwd, environment and replay fields | M | — |
| C002-M-02 | C002-T-008 | Bash guard: bare sdd and node --version (closes CHG-001 defect D-011) | S | T-007 |
| C002-M-02 | C002-T-009 | Writing-command table as a single source and the --cwd confinement | M | T-005, T-006, T-008 |
| C002-M-02 | C002-T-010 | Bash guard: Serena commands confined to a data folder outside the repository | M | T-005, T-009, T-060 |
| C002-M-02 | C002-T-011 | Path guard core: memory-folder option | S | — |
| C002-M-02 | C002-T-012 | CLI: template show and template list, confined to the profile folder | M | T-006 |
| C002-M-02 | C002-T-013 | CLI: --user-data and --read-only for the Serena commands | M | T-005, T-006 |
| C002-M-02 | C002-T-014 | CLI: host-version command | S | T-006 |
| C002-M-02 | C002-T-015 | Claude Code staging leaves out plugins/architect/targets/ | S | — |
| C002-M-02 | C002-T-059 | Bash guard: sdd install denied in every form | S | T-009, T-010 |
| C002-M-03 | C002-T-016 | sdd MCP server: protocol binding, profiles and standard-output discipline | L | T-004, T-006 |
| C002-M-03 | C002-T-017 | sdd MCP server: write_file and replace_text | M | T-011, T-016 |
| C002-M-03 | C002-T-018 | sdd MCP server: quick-lint findings with each write | S | T-017 |
| C002-M-03 | C002-T-019 | sdd MCP server: run_command without a shell | L | T-008, T-010, T-016, T-059 |
| C002-M-03 | C002-T-020 | sdd MCP server: fault injection and benchmarks | M | T-018, T-019 |
| C002-M-03 | C002-T-021 | Build: two bundles and the licence check over both | M | T-004, T-016 |
| C002-M-03 | C002-T-022 | architect-sdd: staging, template CLI lines and npm pack | L | T-003, T-012, T-013, T-021 |
| C002-M-03 | C002-T-023 | architect-sdd: install smoke test and manifest check | M | T-022 |
| C002-M-04 | C002-T-024 | Mapping tables, their schema copy and loader | M | T-001, T-002, T-006, T-015 |
| C002-M-04 | C002-T-025 | Generator: entry, source reader, writer and manifest | L | T-004, T-024 |
| C002-M-04 | C002-T-026 | Translator: agent frontmatter | M | T-025, T-040 |
| C002-M-04 | C002-T-027 | Translator: body constructs, templates, plugin data and question tool | M | T-025 |
| C002-M-04 | C002-T-028 | Wiring variants, anchors and skill inlining | L | T-027 |
| C002-M-04 | C002-T-029 | OpenCode emitter: layout, agents, commands, MCP servers and install notes | L | T-022, T-026, T-028 |
| C002-M-04 | C002-T-030 | OpenCode permission rules for both modes and the quick-lint plugin | L | T-009, T-010, T-029 |
| C002-M-04 | C002-T-031 | Copilot emitter: plugin part, agents, prompt files, skills, workspace MCP configuration and install notes | L | T-021, T-026, T-028 |
| C002-M-04 | C002-T-032 | CLI: Copilot hook adapter (hook guard by agent_type and mode, subagent guard, session start, subagent stop) | L | T-002, T-006, T-010, T-011, T-059 |
| C002-M-04 | C002-T-033 | Copilot package: hook template, Copilot guard and subagent guard hook, tool classes | M | T-031, T-032 |
| C002-M-04 | C002-T-034 | npm run package runs the generator and zips each target | S | T-022, T-029, T-031 |
| C002-M-04 | C002-T-035 | Target structure checks and the npm run check step | L | T-022, T-030, T-033 |
| C002-M-04 | C002-T-036 | Generation determinism test and generation benchmark | S | T-034 |
| C002-M-04 | C002-T-058 | CLI: Copilot install command (sdd install copilot) | L | T-005, T-009, T-031, T-033 |
| C002-M-05 | C002-T-037 | Conductor: interview and gate variants for the host question tools | M | T-028, T-060 |
| C002-M-05 | C002-T-038 | Doctor host rows, version checks and the toolchain record per host | L | T-013, T-014, T-028, T-060 |
| C002-M-05 | C002-T-039 | README sections for OpenCode and Copilot VS Code | S | T-030, T-033 |
| C002-M-06 | C002-T-040 | Corpus replay suite: framework, expectations, report and its own command | L | T-006, T-007 |
| C002-M-06 | C002-T-041 | Replay adapters: sdd MCP server and Copilot guard hooks | M | T-020, T-022, T-033, T-040 |
| C002-M-06 | C002-T-042 | OpenCode session driver and the opencode-permissions replay adapter | L | T-001, T-030, T-040 |
| C002-M-06 | C002-T-043 | S-07 record: final replay outcomes and the OpenCode enforcement mode | S | T-042 |
| C002-M-06 | C002-T-044 | OpenCode eval runner behind the existing case API | L | T-037, T-042 |
| C002-M-06 | C002-T-045 | Copilot CLI eval runner | M | T-002, T-044, T-058 |
| C002-M-06 | C002-T-046 | Manual VS Code checklist and its record template | M | T-033, T-037, T-038, T-058 |
| C002-M-06 | C002-T-047 | Release check per target and release records | L | T-034, T-040, T-046 |
| C002-M-06 | C002-T-056 | OpenCode dev-tier runs of the carried eval rows | L | T-038, T-044 |
| C002-M-07 | C002-T-048 | Claude Code regression set run | M | T-022, T-035, T-037, T-038, T-042, T-044, T-045, T-047, T-060 |
| C002-M-07 | C002-T-049 | Release evidence for OpenCode: corpus replay and dev-tier evals on the tested host | M | T-036, T-041, T-043, T-044, T-048, T-056 |
| C002-M-07 | C002-T-051 | Timed clean-profile run for OpenCode and the OpenCode toy change to G1 | M | T-023, T-034, T-039, T-043 |
| C002-M-07 | C002-T-052 | P-01: publish architect-sdd and release the OpenCode target | S | T-003, T-023, T-047, T-048, T-049, T-051 |
| C002-M-07 | C002-T-054 | Release evidence for Copilot: corpus replay and Copilot CLI dev-tier evals | M | T-036, T-041, T-045, T-048 |
| C002-M-07 | C002-T-050 | P-01: run the manual VS Code checklist and record it | S | T-046, T-054 |
| C002-M-07 | C002-T-057 | Timed clean-profile run for the Copilot target | S | T-023, T-034, T-039, T-058 |
| C002-M-07 | C002-T-055 | P-01: release the Copilot target | S | T-003, T-023, T-047, T-048, T-050, T-054, T-057 |
