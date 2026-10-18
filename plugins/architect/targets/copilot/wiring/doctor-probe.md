2. **Probe.** Dispatch `sdd-cartographer` to write `.sdd/_constitution/toolchain.md` (code-discovery
   skill, toolchain record): one row each for node, git, {{host_name}}, ripwire, Serena, ast-grep,
   Context7, DeepWiki, sdd CLI and Copilot hooks with detected, version, path or
   endpoint, fallback. Probes: `--version` for the command-line tools (node: `node --version`;
   ripwire: `ripwire --version`, never `--doctor`); {{host_name}}: `sdd host-version vscode`; sdd CLI: `sdd --version`;
   Context7 and DeepWiki: load one of their tools and make one small call (unreachable when it
   fails). Without `.sdd/`, probe the same way and skip the file.
