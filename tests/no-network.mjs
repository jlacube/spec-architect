// C001-NFR-202 (C001-T-054): preloaded with `node --import` into the test run and, through NODE_OPTIONS,
// into every Node child process (the bundled sdd CLI). Replaces the network entry points with stubs that
// record the attempt in $SDD_NO_NETWORK_LOG and throw; scripts/test.mjs fails the run when the log is
// not empty. Node's permission model does not cover network access in Node 20/22.
import { appendFileSync } from "node:fs";
import dns from "node:dns";
import http from "node:http";
import https from "node:https";
import net from "node:net";
import tls from "node:tls";

function blocked(api) {
  return function () {
    const log = process.env.SDD_NO_NETWORK_LOG;
    if (log) appendFileSync(log, `${api} pid=${process.pid} argv=${process.argv.slice(1).join(" ")}\n`);
    throw new Error(`network access blocked in tests (${api}); the sdd CLI must not use the network (C001-NFR-202)`);
  };
}

net.connect = blocked("net.connect");
net.createConnection = blocked("net.createConnection");
tls.connect = blocked("tls.connect");
dns.lookup = blocked("dns.lookup");
dns.resolve = blocked("dns.resolve");
dns.promises.lookup = blocked("dns.promises.lookup");
http.request = blocked("http.request");
http.get = blocked("http.get");
https.request = blocked("https.request");
https.get = blocked("https.get");
globalThis.fetch = blocked("fetch");
