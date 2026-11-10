# Copilot 0.1.0 — D-047 rerun list

The unpaid rerun list of CHG-002 revision D-047 (`.sdd/002-multi-platform-targets/20-plan/handoff.md`,
D-047 edge; C002-T-076, section "Release candidate moved by revision D-047"). The release candidate
of 0.1.0 is 9eb56c0, for both hosts (P-01's answers to Q-d047-ship-01 and Q-d047-ship-02). This
record is kept here, outside the approved plan, so that recording it does not make `20-plan` stale.

**D-047 rerun results** (2026-11-10, at b96d727, whose `plugins/architect/` and `src/` diff against
9eb56c0 is empty; D-047 approved at G2 and G3 in ffa075b and 4dae1db):

| Rerun item | Result |
|---|---|
| `npm run check` | exit 0, coverage passes (run by the conductor) |
| `npm run package` at 0.1.0 (Copilot, OpenCode and Claude Code packages, `architect-sdd`) | exit 0 (run by the conductor) |
| `sdd-mcp-server` replay, Git Bash | 683 replayed, 26 not applicable, 0 differing |
| `sdd-mcp-server` replay, PowerShell 7.6.9 | 683 replayed, 26 not applicable, 0 differing |
| `copilot-hooks` replay, Git Bash | 683 replayed, 26 not applicable, 0 differing |
| `copilot-hooks` replay, PowerShell 7.6.9 | 683 replayed, 26 not applicable, 0 differing |
| Copilot release dry run | refuses ERR-REL-003 only (checklist record pending, C002-T-050); run by the conductor, and again after the new replay reports with the same result |
| `sdd host-version vscode` on P-01's machine | `vscode 1.145.2`, `copilot-chat 0.73.0`, `hooks unknown` |

The reports in `docs/releases/copilot/0.1.0/` are those of the PowerShell 7 run
(`npm run replay -- --mechanism sdd-mcp-server,copilot-hooks --target copilot --version 0.1.0`), run
on `win32`. The Git Bash reports and the earlier b481e82 reports differ from them only in the
`detail` text: the names of temporary folders (`sdd-guard-*`, `sdd-mcp-run-*`) and a temporary
file's process ID. Every case and decision is the same.
