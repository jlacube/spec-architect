// Native recording stub of the test fixture stub-exe (C002-T-065; test plan §2): compiled once per test
// run with the .NET Framework compiler csc.exe by tests/integration/stub-exe.ts into a temporary folder,
// and copied under each name a row needs (git.exe, serena.exe, taskkill.exe, opencode.exe, node.exe).
//
// A copy named <name>.exe reads its configuration from <name>.stub.txt beside it (absent: no output,
// exit 0). Lines of the configuration:
//   env <NAME>               record the value of this environment variable with each start
//   on <arguments>\t<text>   print <text> when the arguments, joined by one space, equal <arguments>
//   default <text>           print <text> for any other arguments
//   exit <n>                 exit code (default 0)
//   never-ending             start one child copy of itself that never ends, record both process IDs,
//                            and never end
// In <text>, \n stands for a line break. Each start appends one JSON line to <name>.stub.log beside the
// copy: its absolute path, arguments, working folder, the recorded variables and the process IDs.
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Text;
using System.Threading;

static class RecordingStub {
  static string Esc(string s) {
    if (s == null) return "null";
    var b = new StringBuilder("\"");
    foreach (char c in s) {
      if (c == '"') b.Append("\\\"");
      else if (c == '\\') b.Append("\\\\");
      else if (c < ' ') b.Append("\\u").Append(((int)c).ToString("x4"));
      else b.Append(c);
    }
    return b.Append('"').ToString();
  }

  static int Main(string[] args) {
    string self = Process.GetCurrentProcess().MainModule.FileName;
    string dir = Path.GetDirectoryName(self);
    string name = Path.GetFileNameWithoutExtension(self);
    if (args.Length == 1 && args[0] == "--stub-child") {
      Thread.Sleep(Timeout.Infinite);
      return 0;
    }
    var env = new List<string>();
    var on = new Dictionary<string, string>();
    string fallback = null;
    int exit = 0;
    bool neverEnding = false;
    string config = Path.Combine(dir, name + ".stub.txt");
    if (File.Exists(config)) {
      foreach (string raw in File.ReadAllLines(config, Encoding.UTF8)) {
        string line = raw.TrimEnd('\r');
        if (line.StartsWith("env ")) env.Add(line.Substring(4));
        else if (line.StartsWith("on ")) {
          int tab = line.IndexOf('\t');
          if (tab > 3) on[line.Substring(3, tab - 3)] = line.Substring(tab + 1);
        } else if (line.StartsWith("default ")) fallback = line.Substring(8);
        else if (line.StartsWith("exit ")) exit = int.Parse(line.Substring(5));
        else if (line == "never-ending") neverEnding = true;
      }
    }
    int child = 0;
    if (neverEnding) {
      var psi = new ProcessStartInfo(self, "--stub-child") { UseShellExecute = false, CreateNoWindow = true };
      child = Process.Start(psi).Id;
    }
    var rec = new StringBuilder("{\"path\":").Append(Esc(self)).Append(",\"args\":[");
    for (int i = 0; i < args.Length; i++) rec.Append(i > 0 ? "," : "").Append(Esc(args[i]));
    rec.Append("],\"cwd\":").Append(Esc(Directory.GetCurrentDirectory())).Append(",\"env\":{");
    for (int i = 0; i < env.Count; i++) rec.Append(i > 0 ? "," : "").Append(Esc(env[i])).Append(':').Append(Esc(Environment.GetEnvironmentVariable(env[i])));
    rec.Append("},\"pid\":").Append(Process.GetCurrentProcess().Id).Append(",\"child\":").Append(child).Append('}');
    File.AppendAllText(Path.Combine(dir, name + ".stub.log"), rec.ToString() + "\n", new UTF8Encoding(false));
    string joined = string.Join(" ", args);
    string text = on.ContainsKey(joined) ? on[joined] : fallback;
    if (text != null) Console.Out.Write(text.Replace("\\n", "\n") + "\n");
    Console.Out.Flush();
    if (neverEnding) Thread.Sleep(Timeout.Infinite);
    return exit;
  }
}
