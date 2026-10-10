"""Prototype spec checker for CHG-001 (precursor of `sdd lint`). Usage: python speccheck.py <10-spec dir>"""
import re, sys, os, collections

root = sys.argv[1]
files = {}
for dp, _, fns in os.walk(root):
    for fn in fns:
        if fn.endswith('.md'):
            p = os.path.join(dp, fn)
            files[os.path.relpath(p, root).replace('\\', '/')] = open(p, encoding='utf-8').read()

findings = []
def F(code, where, msg): findings.append((code, where, msg))

ID = r'C001-(?:US|REQ|NFR|COMP|IF|CON|INV|DOD|GOAL|SC|NG|AS|CAP)-\d+|C001-AC-\d+\.\d+|C001-TS-\d+'
defs = collections.defaultdict(list)
refs = []  # (id, file, line)

def strip_code(text):
    return re.sub(r'```.*?```', lambda m: '\n' * m.group(0).count('\n'), text, flags=re.S)

for f, t in files.items():
    for i, line in enumerate(t.split('\n'), 1):
        m = re.match(r'^#{3,4} (' + ID + r') ', line)
        if m: defs[m.group(1)].append((f, i))
        m = re.search(r'Scenario(?: Outline)?: (C001-TS-\d+)', line)
        if m: defs[m.group(1)].append((f, i))
        m = re.match(r'^\| (C001-(?:GOAL|SC|NG|AS|CON|DOD|IF)-\d+) \|', line)
        if m and not f.endswith('traceability.md'): defs[m.group(1)].append((f, i))
        m = re.search(r'\*\*(C001-INV-\d+)\*\*', line)
        if m: defs[m.group(1)].append((f, i))
        m = re.match(r'^- (C001-NG-\d+):', line)
        if m: defs[m.group(1)].append((f, i))
        m = re.match(r'^id: (C001-CAP-\d+)$', line)
        if m and f.endswith('stories.md'): defs[m.group(1)].append((f, i))
        for r in re.findall(ID, line):
            refs.append((r, f, i))

import json
idsf = os.path.join(os.path.dirname(root.rstrip('/')), 'ids.json')
tomb = set(t['id'] for t in json.load(open(idsf))['tombstones']) if os.path.exists(idsf) else set()
# duplicates
for k, v in defs.items():
    if len(v) > 1: F('TR-13', v, f'{k} defined {len(v)}x')
# dangling (exact refs only)
for r, f, i in refs:
    if r not in defs and r not in tomb:
        F('TR-12', f'{f}:{i}', f'dangling {r}')

# parse stories / requirements / acceptance
stories, reqs = {}, {}
def field(block, name):
    m = re.search(r'- \*\*' + re.escape(name) + r':\*\* (.*)', block)
    return m.group(1) if m else None
for f, t in files.items():
    if f.endswith('stories.md'):
        for m in re.finditer(r'^### (C001-US-\d+).*?(?=^### |\Z)', t, flags=re.S | re.M):
            b = m.group(0)
            stories[m.group(1)] = (f, set(re.findall(r'C001-REQ-\d+', field(b, 'Requirements') or '')), b)
    if f.endswith('requirements.md'):
        for m in re.finditer(r'^### (C001-REQ-\d+).*?(?=^### |\Z)', t, flags=re.S | re.M):
            b = m.group(0)
            reqs[m.group(1)] = dict(file=f, block=b, pattern=field(b, 'Pattern'), stmt=field(b, 'Statement'),
                                     stories=set(re.findall(r'C001-US-\d+', field(b, 'Stories') or '')),
                                     acs=set(re.findall(r'C001-AC-\d+\.\d+', field(b, 'Acceptance') or '')))
# acceptance: AC -> TS
ac_ts, ac_file, ac_title = collections.defaultdict(set), {}, {}
cov_rows = collections.defaultdict(set)
for f, t in files.items():
    if f.endswith('acceptance.md'):
        cur = None
        for line in t.split('\n'):
            m = re.match(r'^#### (C001-AC-\d+\.\d+) — (.*)', line)
            if m: cur = m.group(1); ac_file[cur] = f; ac_title[cur] = m.group(2); continue
            if line.startswith('## '): cur = None
            m = re.search(r'Scenario(?: Outline)?: (C001-TS-\d+)', line)
            if m and cur: ac_ts[cur].add(m.group(1))
            m = re.match(r'^\| (C001-REQ-\d+) \|', line)
            if m: cov_rows[f].add(m.group(1))

# TR-01 / mutual links
for us, (f, rs, b) in stories.items():
    if not rs: F('TR-01', f, f'{us} lists no REQ')
    for r in rs:
        if r in reqs and us not in reqs[r]['stories']: F('TR-01', f, f'{us} lists {r} but {r} does not list {us}')
for r, d in reqs.items():
    if not d['stories']: F('TR-02', d['file'], f'{r} has no story')
    if not d['acs']: F('TR-02', d['file'], f'{r} has no AC')
    for s in d['stories']:
        if s in stories and r not in stories[s][1]: F('TR-01', d['file'], f'{r} lists {s} but {s} does not list {r}')
    for a in d['acs']:
        if a not in ac_file: F('TR-12', d['file'], f'{r} lists undefined {a}')
        elif not a.startswith('C001-AC-' + r.split('-')[-1] + '.'): F('INV-14', d['file'], f'{a} not under {r}')
# ACs defined but not listed by their REQ
for a in ac_file:
    rq = 'C001-REQ-' + a.split('-')[-1].split('.')[0]
    if rq not in reqs: F('TR-12', ac_file[a], f'{a} has no REQ {rq}')
    elif a not in reqs[rq]['acs']: F('TR-02', ac_file[a], f'{a} defined but not listed in {rq} Acceptance')
    if not ac_ts[a]: F('TR-03', ac_file[a], f'{a} has no scenario')

# coverage tables
for r, d in reqs.items():
    accf = d['file'].replace('requirements.md', 'acceptance.md')
    if r not in cov_rows.get(accf, set()): F('LINT-COV-001', accf, f'{r} missing in coverage table')

# EARS
SYS = None
gl = files.get('40-domain/glossary-delta.md', '')
sysnames = [m.group(1).replace('`','') for m in re.finditer(r'^\| ([^|]+?) \| [^|]+ \| [^|]+ \|$', gl.split('## 2.')[1], flags=re.M)] if '## 2.' in gl else []
sysnames = [s for s in sysnames if s not in ('System name', '---')]
shapes = {
 'ubiquitous': r'^THE .+? SHALL',
 'event-driven': r'^WHEN .+?, THE .+? SHALL',
 'state-driven': r'^WHILE .+?, THE .+? SHALL',
 'unwanted-behaviour': r'^IF .+?, THEN THE .+? SHALL',
 'optional-feature': r'^WHERE .+?, THE .+? SHALL',
 'complex': r'^(?:(?:WHILE|WHEN|WHERE) .+?, ){2,}THE .+? SHALL',
}
WEAK = ['fast','quick','quickly','easy','easily','simple','flexible','robust','user-friendly','intuitive','appropriate','adequate','sufficient','efficient','seamless','optimal','minimal','maximal','several','various','some','etc','and/or','normally','usually','typically','approximately']
PHR = ['as needed','if possible','as appropriate','where possible','as soon as possible','state of the art']
def clean(s):
    s = re.sub(r'`[^`]*`', '', s); s = re.sub(r'"[^"]*"', '', s); return s
def weak(s):
    c = clean(s).lower(); hits = [w for w in WEAK if re.search(r'(?<![\w-])' + re.escape(w) + r'(?![\w-])', c)]
    return hits + [p for p in PHR if p in c]
for r, d in reqs.items():
    st = d['stmt'] or ''
    if d['pattern'] not in shapes: F('LINT-REQ-001', d['file'], f'{r} pattern {d["pattern"]}'); continue
    if not re.match(shapes[d['pattern']], st, flags=re.I) or (d['pattern']=='ubiquitous' and re.match(r'^(WHEN|WHILE|IF|WHERE)', st, re.I)):
        F('LINT-EARS-001', d['file'], f'{r} declared {d["pattern"]}: {st[:70]}')
    n = len(re.findall(r'SHALL', re.sub(r'`[^`]*`', '', st)))
    if n > 1: F('LINT-EARS-002', d['file'], f'{r} has {n} SHALL')
    m = re.search(r'THE (.+?) SHALL', st)
    if m:
        name = m.group(1).replace('`', '')
        if not any(name.lower() == s.lower() or name.lower().startswith(s.lower()) for s in sysnames):
            F('LINT-EARS-003', d['file'], f'{r} system "{name}"')
    h = weak(st)
    if h: F('LINT-WORD-001', d['file'], f'{r}: {h}')
for a, t in ac_title.items():
    h = weak(t)
    if h: F('LINT-WORD-001', ac_file[a], f'{a} title: {h}')
# NFRs
nfr = files.get('30-nfr/nfr.md', '')
for m in re.finditer(r'^### (C001-NFR-\d+).*?(?=^### |^## |\Z)', nfr, flags=re.S | re.M):
    b = m.group(0)
    for fld in ['Category','Statement','Metric','Threshold','Method','Environment','Rationale','DoD']:
        if not field(b, fld): F('LINT-NFR-001', '30-nfr/nfr.md', f'{m.group(1)} missing {fld}')
    h = weak(field(b, 'Statement') or '')
    if h: F('LINT-WORD-001', 'nfr', f'{m.group(1)}: {h}')
# placeholders
for f, t in files.items():
    c = strip_code(t)
    for i, line in enumerate(c.split('\n'), 1):
        cl = clean(line)
        if re.search(r'\b(TBD|TODO|lorem)\b', cl) or re.search(r'\betc\.', cl):
            F('LINT-TXT-001', f'{f}:{i}', line.strip()[:80])

stats = collections.Counter(k.split('-')[1] for k in defs)
print('DEFS', dict(sorted(stats.items())))
print('stories', len(stories), 'reqs', len(reqs), 'acs', len(ac_file), 'ts', sum(1 for k in defs if '-TS-' in k))
for c, w, m in sorted(findings, key=lambda x: x[0]):
    print(c, '|', w, '|', m)
print('TOTAL findings', len(findings))
