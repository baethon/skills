"""Validate a state-map source JSON and render it into template.html.

Usage: python3 -I build.py SOURCE.json REPO OUT.html [EVENTS_GLOB]

EVENTS_GLOB (relative to REPO) names event classes that policies may react to
even when no mapped stop raises them, such as 'app/Events/**/*.php'.
"""
import json, sys
from pathlib import Path

source_path, repo, out_path = sys.argv[1], Path(sys.argv[2]), sys.argv[3]
events_glob = sys.argv[4] if len(sys.argv) > 4 else None
src = json.load(open(source_path))
errors = []

def check(ok, message):
    if not ok:
        errors.append(message)

cities = {c['id']: c for c in src['cities']}
countries = {c['id'] for c in src['countries']}
entries = {e['id'] for e in src['entries']}
externals = {x['id'] for x in src['externals']}
events = {s.get('event') for r in src['roads'] for s in r['stops']}
events |= {p.stem for p in repo.glob(events_glob)} if events_glob else set()

for c in src['cities']:
    check(c['country'] in countries, f"city {c['id']}: unknown country {c['country']}")
    c['districts'] = list(dict.fromkeys(c.pop('classes', [])))

for r in src['roads']:
    check(r.get('entry') in entries | {None}, f"road {r['id']}: unknown entry {r.get('entry')}")
    check(all(x in externals for x in r.get('externals', [])), f"road {r['id']}: unknown external")
    for i, s in enumerate(r['stops']):
        where = f"road {r['id']} stop {i + 1}"
        check(s['city'] in cities, f"{where}: unknown city {s['city']}")
        check(bool(s.get('event')), f"{where}: missing event")
        for t in s.get('trigger', []):
            ok = {
                'command': lambda: t.get('from') in entries,
                'callback': lambda: t.get('from') in externals and 'name' in t,
                'policy': lambda: t.get('on') in events,
                'schedule': lambda: 'command' in t and 'every' in t and t.get('scans', None) in events | {None},
                'queued': lambda: True,
            }.get(t.get('kind'), lambda: False)()
            check(ok, f"{where}: bad trigger {t}")
        if s['city'] in cities:
            city = cities[s['city']]
            city['districts'] = list(dict.fromkeys(city['districts'] + s.get('classes', [])))
            if r.get('status') == 'proposed':
                city.setdefault('proposedDistricts', set()).update(s.get('classes', []))

# Proposed code does not exist yet, so only existing elements are path-checked.
for c in src['cities']:
    proposed = c.pop('proposedDistricts', set())
    if c.get('status') == 'proposed':
        continue
    for p in c['districts']:
        check(p in proposed or (repo / p).exists(), f"city {c['id']}: missing path {p}")

if errors:
    sys.exit('\n'.join(errors))

template = (Path(__file__).parent.parent / 'assets' / 'template.html').read_text()
html = template.replace('__TITLE__', src['title']).replace('__MAP_DATA__', json.dumps(src).replace('</', '<\\/'))
Path(out_path).write_text(html)
print(f"wrote {out_path}")
