#!/usr/bin/env bash
# Liste numérotée des scénarios (depuis la racine du projet)
set -e
cd "$(dirname "$0")/.."
python3 -c "
import json, sys
with open('platform/data/scenarios.json') as f:
    d = json.load(f)
for i, s in enumerate(d.get('scenarios', []), 1):
    print('  {:2}) {}'.format(i, s.get('title', s.get('id', '?'))))
"
