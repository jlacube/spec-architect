2. **Probe.** Dispatch `sdd-cartographer` to write `.sdd/_constitution/toolchain.md` (code-discovery
   skill, toolchain record): one row each for node, git, {{host_name}}, ripwire, Serena, ast-grep,
   Context7, DeepWiki and sdd CLI, in that order, with detected, version, path or endpoint, fallback.
   Probes, one command per call: `node --version`, `git --version`, `ripwire --version` (never
   `--doctor`), `serena --version`, `ast-grep --version`; {{host_name}}: `sdd host-version {{host_version_arg}}`
   (the CLI reads the host version; never run `opencode` itself); sdd CLI: `sdd --version`;
   Context7 and DeepWiki: load one of their tools and make one small call (unreachable when it
   fails). Pass each probe's output and any refusal (an error code with its reason) back to the
   report. Test whether `.sdd/` exists with `sdd status` or with `read` of `.sdd/`, never with
   `glob`, which lists no file inside a dot folder. Without `.sdd/`, probe the same way and skip
   the file.
