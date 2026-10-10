# Prototype scripts (bootstrap only)

Throw-away Python prototypes used to check and generate CHG-001 artifacts before the real
`sdd` CLI exists. They are **reference material** for tasks T-010, T-018…T-024 and are retired
by T-028 (dogfood) once `sdd lint`, `sdd trace` and `sdd gate` reproduce their results.

| Script | Prototype of | Usage |
|---|---|---|
| `speccheck.py` | `sdd lint` (spec-phase rules: IDs, TR-01…03, EARS, weak words, coverage) | `python speccheck.py <abs path>/10-spec` |
| `specgen.py` | `sdd trace --write` (spec matrix, open items) | `python specgen.py <10-spec dir>` |
| `phasehash.py` | C001-IF-13 §2 approval hash + per-ID hashes | `python phasehash.py <change dir> <phase> <date>` |
| `plantasks.py` + `planrender.py` | planner output: task files, work breakdown, test-case table, plan traceability | `python planrender.py <change dir>` |

Not part of the plugin; not shipped.
