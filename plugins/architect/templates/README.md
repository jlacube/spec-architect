# Artifact templates

Starting content for every artifact of a change, by profile (`full/`, `lite/`). `sdd change new`
fills the change-level files; author agents copy the other templates when they create an artifact.

Placeholders, replaced when a template is rendered:

| Placeholder | Example |
|---|---|
| `{{CHANGE}}` | `CHG-004` |
| `{{P}}` | `C004` (ID prefix) |
| `{{NNN}}` | `004` |
| `{{TITLE}}`, `{{KIND}}`, `{{PROFILE}}`, `{{DATE}}` | change title, kind, profile, ISO date |
| `{{SEQ}}`, `{{SLUG}}`, `{{NAME}}` | entity number, slug, entity title |
| `{{NN}}`, `{{B}}` | capability number padded (`01`) and as ID block (`1` → `REQ-101`) |

A repository overrides any template by placing a file with the same relative path under
`.sdd/_templates/<profile>/`, e.g. `.sdd/_templates/full/20-plan/70-risks.md`.
