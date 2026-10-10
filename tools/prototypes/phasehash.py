"""Prototype of C001-IF-13 §2 (phase hash + per-ID hashes). Usage: python phasehash.py <change-dir> <phase> <date>"""
import hashlib, os, re, json, sys
NL = chr(10)
FENCE = chr(96) * 3
chg, phase, date = sys.argv[1], sys.argv[2], sys.argv[3]
pdir = os.path.join(chg, phase)


def norm(t):
    t = t.replace('\r\n', NL).replace('\r', NL)
    if t.startswith('---' + NL):
        lines = t.split(NL)
        end = next(i for i in range(1, len(lines)) if lines[i] == '---')
        t = NL.join(lines[end + 1:])
    return NL.join(l.rstrip(' \t') for l in t.split(NL))


def h(s):
    return hashlib.sha256(s.encode('utf-8')).hexdigest()


files = []
for dp, _, fns in os.walk(pdir):
    for fn in fns:
        rel = os.path.relpath(os.path.join(dp, fn), pdir).replace(os.sep, '/')
        if rel not in ('80-traceability.md', '85-open-items.md'):
            files.append(rel)
files.sort(key=lambda s: s.encode())
if len(files) == 1:
    phash = 'sha256:' + h(norm(open(os.path.join(pdir, files[0]), encoding='utf-8').read()))
else:
    phash = 'sha256:' + h(''.join('%s\t%s\n' % (r, h(norm(open(os.path.join(pdir, r), encoding='utf-8').read()))) for r in files))
ids = {}
for r in files:
    if not r.endswith('.md'):
        continue
    t = norm(open(os.path.join(pdir, r), encoding='utf-8').read()).split(NL)
    raw = open(os.path.join(pdir, r), encoding='utf-8').read()
    mid = re.search(r'^id: (C001-(?:T|ADR|OA)-[0-9]+)[ 	]*$', raw, re.M)
    if mid and raw.startswith('---'):
        ids[mid.group(1)] = 'sha256:' + h(NL.join(t))
    for i, l in enumerate(t):
        m = re.match(r'^(#{3,4}) (C001-[A-Z]+-[\d.]+) ', l)
        if m:
            lvl, j = len(m.group(1)), i + 1
            while j < len(t) and not re.match(r'^#{1,%d} ' % lvl, t[j]):
                j += 1
            ids[m.group(2)] = 'sha256:' + h(NL.join(t[i:j]))
        m = re.search(r'Scenario(?: Outline)?: (C001-TS-\d+)', l)
        if m:
            s, e = i, i
            while s > 0 and not t[s].startswith(FENCE):
                s -= 1
            while e < len(t) and t[e] != FENCE:
                e += 1
            ids[m.group(1)] = 'sha256:' + h(NL.join(t[s:e + 1]))
        m = re.match(r'^\| (C001-(?:GOAL|SC|CON|DOD|IF|RISK|RB|M)-\d+) \|', l) or re.search(r'\*\*(C001-INV-\d+)\*\*', l)
        if m:
            ids.setdefault(m.group(1), 'sha256:' + h(l))
ap = os.path.join(chg, 'approvals.json')
appr = json.load(open(ap, encoding='utf-8')) if os.path.exists(ap) else {}
appr[phase] = {'hash': phash, 'approved_at': date, 'files': len(files), 'ids': dict(sorted(ids.items()))}
open(ap, 'w', encoding='utf-8', newline=NL).write(json.dumps(appr, indent=2) + NL)
print(phash, len(files), 'files', len(ids), 'ids')
