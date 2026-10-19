2. **Probe.** Dispatch `sdd-cartographer` to write `.sdd/_constitution/toolchain.md` (code-discovery
   skill, toolchain record): one row each for node, git, {{host_name}}, ripwire, Serena, ast-grep,
   Context7, DeepWiki, sdd CLI and Copilot hooks, in that order, with detected, version, path or
   endpoint, fallback. Probes, one command per call: `node --version`, `git --version`,
   `ripwire --version` (never `--doctor`), `serena --version`, `ast-grep --version`;
   {{host_name}} and Copilot hooks: `sdd host-version {{host_version_arg}}` (its `vscode`, `copilot-chat`
   and `hooks` lines; the CLI reads the VS Code build of the tested version
   {{tested_version:vscode}}; never run `code` or read a VS Code setting yourself); sdd CLI:
   `sdd --version`; Context7 and DeepWiki: load one of their tools and make one small call
   (unreachable when it fails). Pass each probe's output and any refusal (an error code with its
   reason) back to the report. Without `.sdd/`, probe the same way and skip the file.
