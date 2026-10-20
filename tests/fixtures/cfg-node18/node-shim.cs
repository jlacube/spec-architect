// Native Windows version shim of cfg-node18 (tests/fixtures/cfg-README.md), compiled by
// evals/harness/machines.mjs with the .NET Framework compiler (csc.exe) into a temporary folder as
// node.exe. The sdd MCP server's command tool runs only native executables (C002-IF-002 §5.2: no shell,
// a `.cmd` shim is refused), so the `sh` shim `bin/node` never reaches an OpenCode doctor run
// (C002-TC-509 row node18). Like `bin/node`: `-v` and `--version` print v18.20.4; every other call runs
// the real node (%NODE_REAL%) with the same command-line tail, the standard streams inherited.
using System;
using System.Diagnostics;

static class NodeShim {
  static int Main(string[] args) {
    if (args.Length > 0 && (args[0] == "-v" || args[0] == "--version")) {
      Console.WriteLine("v18.20.4");
      return 0;
    }
    string real = Environment.GetEnvironmentVariable("NODE_REAL");
    if (string.IsNullOrEmpty(real)) {
      Console.Error.WriteLine("node shim (cfg-node18): NODE_REAL is not set");
      return 1;
    }
    var psi = new ProcessStartInfo(real, Tail(Environment.CommandLine)) { UseShellExecute = false };
    using (var p = Process.Start(psi)) {
      p.WaitForExit();
      return p.ExitCode;
    }
  }

  // The command line without its first word (the program path), passed on unchanged.
  static string Tail(string line) {
    int i = 0;
    if (line.Length > 0 && line[0] == '"') {
      i = line.IndexOf('"', 1);
      i = i < 0 ? line.Length : i + 1;
    } else {
      while (i < line.Length && line[i] != ' ' && line[i] != '\t') i++;
    }
    return line.Substring(i).TrimStart(' ', '\t');
  }
}
