#!/usr/bin/env bash
# Liste numérotée des entrées de documentation (depuis la racine du projet)
set -e
cd "$(dirname "$0")/.."
python3 -c "
import json, sys
with open('platform/data/docs.json') as f:
    d = json.load(f)
for i, e in enumerate(d.get('entries', []), 1):
    print('  {:2}) {}'.format(i, e.get('name', e.get('file', '?'))))
"
