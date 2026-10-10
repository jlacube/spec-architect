# -*- coding: utf-8 -*-
"""Render CHG-001 20-plan task files, test plan table, work breakdown, hand-off list and plan traceability."""
import os, re, glob, sys, collections
sys.path.insert(0, os.path.dirname(__file__))
from plantasks import TASKS, MILESTONES

CHG = sys.argv[1]
SPEC, PLAN = os.path.join(CHG, '10-spec'), os.path.join(CHG, '20-plan')
NL = chr(10)
FENCE = chr(96) * 3
rd = lambda p: open(p, encoding='utf-8').read()
def wr(p, s):
    os.makedirs(os.path.dirname(p), exist_ok=True)
    open(p, 'w', encoding='utf-8', newline=NL).write(s)

# ---- spec graph
req_ac, ac_ts, req_cap = collections.defaultdict(list), collections.defaultdict(list), {}
for c in sorted(glob.glob(os.path.join(SPEC, '20-capabilities', 'CAP-*'))):
    cap = os.path.basename(c)[:6]
    for m in re.finditer(r'^### (C001-REQ-(\d+)).*?(?=^### |\Z)', rd(c + '/requirements.md'), re.S | re.M):
        req_cap[int(m.group(2))] = cap
        req_ac[int(m.group(2))] = re.findall(r'C001-AC-(\d+\.\d+)', re.search(r'- \*\*Acceptance:\*\* (.*)', m.group(0)).group(1))
    cur = None
    for line in rd(c + '/acceptance.md').split(NL):
        m = re.match(r'^#### C001-AC-(\d+\.\d+)', line)
        if m: cur = m.group(1)
        m = re.search(r'Scenario(?: Outline)?: C001-TS-(\d+)', line)
        if m and cur: ac_ts[cur].append(int(m.group(1)))
all_ts = sorted({t for v in ac_ts.values() for t in v})

# ---- ownership
owner = {}
problems = []
for t in TASKS:
    for r in t['impl']:
        if r in owner: problems.append('REQ %d owned by T-%03d and T-%03d' % (r, owner[r], t['n']))
        owner[r] = t['n']
for r in req_ac:
    if r not in owner: problems.append('TR-06 REQ %d not planned' % r)
ts_req = {}
for r, acs in req_ac.items():
    for a in acs:
        for t in ac_ts[a]: ts_req[t] = r

# ---- test levels
EVAL = set([119, 120, 121, 122, 127, 133]) | set(range(201, 223)) - {204, 205, 219, 220} \
     | {301, 303, 304, 305, 306, 307, 309, 312, 313, 315, 316, 317, 318, 319, 320} \
     | {401, 418, 419, 420, 423, 424} | {504, 505, 506, 507, 508, 511, 515, 517} \
     | {609, 612, 613, 622} | {710, 711, 712, 713, 714, 715} | {802, 803, 804, 815, 817} | {910} \
     | {1001, 1002, 1004, 1005, 1010, 1011, 1012, 1013} | {1111, 1112}
MANUAL = {621, 1102}
def level(t):
    return 'manual' if t in MANUAL else 'eval' if t in EVAL else 'integration'
CFG = {1001: 'cfg-full', 1002: 'cfg-full, cfg-no-ripwire, cfg-bare', 1011: 'cfg-full (ripwire shim exits 134)', 1111: 'cfg-no-ripwire'}
def data(t):
    cap = req_cap[ts_req[t]]
    if t in (101, 203, 1012): return 'fx-empty'
    if t in (129, 806, 130): return 'fx-bootstrap (this repo at G2)'
    if t in (102, 127, 315, 1001, 1002, 1010, 1011, 612, 613, 506): return 'fx-brownfield-ts'
    if t in (705,): return 'fx-large (generated)'
    if level(t) == 'eval': return 'scenario Given data on fx-empty or fx-brownfield-ts copy'
    return 'inline fixture from scenario Given/Examples'
def env(t):
    if t in CFG: return 'REF-WIN, ' + CFG[t]
    if level(t) == 'eval': return 'REF-WIN, Claude Code current, models per C001-IF-09; tiers per C001-ADR-003'
    if level(t) == 'manual': return 'REF-WIN fresh user profile' if t == 1102 else 'REF-WIN with Superpowers installed'
    return 'REF-WIN, Node 20 and 22'
def loc(t):
    cap = req_cap[ts_req[t]].lower().replace('-', '')
    return {'eval': 'evals/%s/TS-%d.eval.mjs', 'manual': 'tests/manual/TS-%d.md', 'integration': 'tests/integration/%s/TS-%d.test.ts'}[level(t)] % ((cap, t) if level(t) != 'manual' else (t,))

# ---- tasks
tid = lambda n: 'C001-T-%03d' % n
fname = {t['n']: 'T-%03d-%s.md' % (t['n'], t['slug']) for t in TASKS}
task_tcs = {}
for t in TASKS:
    acs = []
    for r in t['impl']: acs += req_ac[r]
    acs += [a for a in t.get('acs', []) if a not in acs]
    ts = []
    for a in acs:
        ts += [x for x in ac_ts[a] if x not in ts]
    t['_acs'], t['_ts'] = acs, ts
    task_tcs[t['n']] = ts
    if not acs: problems.append('TR-07 T-%03d has no REQ/AC' % t['n'])
    if not ts: problems.append('TR-07 T-%03d has no TS/TC' % t['n'])
def ylist(xs): return '[' + ', '.join(xs) + ']'
for t in TASKS:
    fm = ['---', 'id: ' + tid(t['n']), 'title: "' + t['title'] + '"', 'change: CHG-001', 'phase: 20-plan', 'artifact: plan/task',
          'milestone: C001-M-%d' % t['m'], 'status: todo', 'depends_on: ' + ylist([tid(d) for d in t['deps']]),
          'implements: ' + ylist(['C001-REQ-%d' % r if r >= 1000 else 'C001-REQ-%03d' % r for r in t['impl']]),
          'satisfies_ac: ' + ylist(['C001-AC-' + a for a in t['_acs']]),
          'verified_by: ' + ylist(['C001-TS-%d' % x for x in t['_ts']] + ['C001-TC-%d' % x for x in t['_ts']]),
          'components: ' + ylist(['C001-COMP-%02d' % c for c in t['comps']]),
          'risk_refs: ' + ylist(['C001-RISK-%03d' % r for r in t['risks']]),
          'estimate: ' + t['est'], 'report: { commit: null, completed_at: null, notes: null }', '---', '']
    body = ['# %s — %s' % (tid(t['n']), t['title']), '', '## Intent', '', t['intent'], '',
            '## Targets', '', '| Kind | Target | Change |', '|---|---|---|']
    body += ['| %s | `%s` | %s |' % (k, tg, ch) for k, tg, ch in t['targets']]
    body += ['', '## Preconditions', ''] + ['- ' + p for p in t['pre']] + ['- Dependencies done: ' + (', '.join(tid(d) for d in t['deps']) or 'none')]
    body += ['', '## Step outline (no production code)', ''] + ['%d. %s' % (i + 1, s) for i, s in enumerate(t['steps'])]
    body += ['', '## Verification', ''] + ['- ' + v for v in t['verify']]
    body += ['- Run `npm run check` (from M-6; before that `npm test`) and `node ' + 'plugins/architect/scripts/sdd.mjs lint` (from T-028).']
    body += ['', '## Done when', ''] + ['- [ ] ' + d for d in t['done']]
    body += ['- [ ] All test cases in `verified_by` pass at the tier required by C001-ADR-003',
             '- [ ] Progress reported: `sdd task set %s --status done --commit <sha>` (or frontmatter fallback before T-026)' % tid(t['n']), '']
    wr(os.path.join(PLAN, '50-tasks', fname[t['n']]), NL.join(fm + body))

# ---- DAG checks + topo order + critical path
deps = {t['n']: t['deps'] for t in TASKS}
known = set(deps)
for n, ds in deps.items():
    for d in ds:
        if d not in known: problems.append('TR-11 T-%03d depends on unknown T-%03d' % (n, d))
order, seen, temp = [], set(), set()
def visit(n, stack):
    if n in seen: return
    if n in temp: problems.append('TR-11 cycle ' + ' -> '.join('T-%03d' % x for x in stack + [n])); return
    temp.add(n)
    for d in sorted(deps[n]): visit(d, stack + [n])
    temp.discard(n); seen.add(n); order.append(n)
for n in sorted(deps): visit(n, [])
W = {'S': 1, 'M': 2, 'L': 3}
est = {t['n']: W[t['est']] for t in TASKS}
dist, prev = {}, {}
for n in order:
    best = max(deps[n], key=lambda d: dist[d], default=None)
    dist[n] = est[n] + (dist[best] if best else 0); prev[n] = best
end = max(dist, key=dist.get); cp = []
while end: cp.append(end); end = prev[end]
cp.reverse()

title = {t['n']: t['title'] for t in TASKS}
ms = {t['n']: t['m'] for t in TASKS}
wb = ['---', 'artifact: plan/work-breakdown', 'change: CHG-001', 'phase: 20-plan', 'status: draft', '---', '',
      '# CHG-001 — Work breakdown', '', 'Generated from the task files by the plan renderer (precursor of the planner agent); edges are `depends_on`.', '',
      FENCE + 'mermaid', 'flowchart TB']
for m, name, _, _ in MILESTONES:
    wb.append('  subgraph M%d["C001-M-%d %s"]' % (m, m, name))
    wb += ['    T%03d["T-%03d %s"]' % (t['n'], t['n'], t['title'].replace('"', "'")) for t in TASKS if t['m'] == m]
    wb.append('  end')
for t in TASKS:
    wb += ['  T%03d --> T%03d' % (d, t['n']) for d in t['deps']]
wb += [FENCE, '', '## Tasks by milestone', '', '| Milestone | Task | Title | Estimate | Depends on |', '|---|---|---|---|---|']
wb += ['| C001-M-%d | %s | %s | %s | %s |' % (t['m'], tid(t['n']), t['title'], t['est'], ', '.join('T-%03d' % d for d in t['deps']) or '—') for t in sorted(TASKS, key=lambda x: (x['m'], x['n']))]
wb += ['', '## Critical path', '', 'Weights S = 1, M = 2, L = 3; total weight %d.' % dist[cp[-1]], '']
wb += ['%d. %s — %s' % (i + 1, tid(n), title[n]) for i, n in enumerate(cp)]
wr(os.path.join(PLAN, '40-work-breakdown.md'), NL.join(wb) + NL)

# ---- test case table
tc = ['| TC | Verifies | Level | Location | Test data | Environment | Task |', '|---|---|---|---|---|---|---|']
for t in all_ts:
    r = ts_req[t]
    tc.append('| C001-TC-%d | C001-TS-%d | %s | `%s` | %s | %s | %s |' % (t, t, level(t), loc(t), data(t), env(t), tid(owner[r])))
wr(os.path.join(PLAN, '_tc-table.md'), NL.join(tc) + NL)
lv = collections.Counter(level(t) for t in all_ts)

# ---- ordered task list for handoff
ol = ['| # | Task | Title | File |', '|---|---|---|---|']
ol += ['| %d | %s | %s | `.sdd/001-architect-agent-suite/20-plan/50-tasks/%s` |' % (i + 1, tid(n), title[n], fname[n]) for i, n in enumerate(order)]
wr(os.path.join(PLAN, '_ordered-list.md'), NL.join(ol) + NL)

# ---- plan traceability
tr = ['---', 'artifact: plan/traceability', 'change: CHG-001', 'phase: 20-plan', 'generated: true', '---', '',
      '# CHG-001 — Plan traceability (generated)', '', '## Coverage', '', '| Rule | Coverage |', '|---|---|',
      '| TR-06 Every REQ implemented by ≥ 1 task | %d / %d |' % (len([r for r in req_ac if r in owner]), len(req_ac)),
      '| TR-07 Every task links ≥ 1 REQ/AC and ≥ 1 TS/TC | %d / %d |' % (len([t for t in TASKS if t['_acs'] and t['_ts']]), len(TASKS)),
      '| TR-08 Every TS mapped to ≥ 1 TC | %d / %d |' % (len(all_ts), len(all_ts)),
      '| TR-11 Task DAG acyclic, dependencies resolve | %s |' % ('yes' if not [p for p in problems if p.startswith('TR-11')] else 'NO'),
      '', '## REQ → task → test cases → DoD', '', '| REQ | Task | Test cases | DoD |', '|---|---|---|---|']
DOD_CAP = {'CAP-01': '001', 'CAP-02': '002', 'CAP-03': '003', 'CAP-04': '004', 'CAP-05': '005', 'CAP-06': '006', 'CAP-07': '007', 'CAP-08': '008', 'CAP-09': '009', 'CAP-10': '010', 'CAP-11': '020'}
for r in sorted(req_ac):
    tcs = ', '.join('TC-%d' % t for a in req_ac[r] for t in ac_ts[a])
    rid = 'C001-REQ-%d' % r if r >= 1000 else 'C001-REQ-%03d' % r
    tr.append('| %s | %s | %s | C001-DOD-%s |' % (rid, tid(owner.get(r, 0)), tcs, DOD_CAP[req_cap[r]]))
tr += ['', '## Task → milestone', '', '| Task | Milestone | Implements (count) | Test cases (count) |', '|---|---|---|---|']
tr += ['| %s | C001-M-%d | %d | %d |' % (tid(t['n']), t['m'], len(t['impl']), len(t['_ts'])) for t in TASKS]
wr(os.path.join(PLAN, '80-traceability.md'), NL.join(tr) + NL)

print('tasks', len(TASKS), 'REQs', len(req_ac), 'owned', len(owner), 'TS', len(all_ts), 'levels', dict(lv))
print('critical path', ' > '.join('T-%03d' % n for n in cp), 'weight', dist[cp[-1]])
print('PROBLEMS', problems or 'none')
