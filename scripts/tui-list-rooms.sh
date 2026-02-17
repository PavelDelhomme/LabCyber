#!/usr/bin/env bash
# Liste numérotée des rooms (depuis la racine du projet)
set -e
cd "$(dirname "$0")/.."
python3 -c "
import json, sys
with open('platform/data/rooms.json') as f:
    d = json.load(f)
for i, r in enumerate(d.get('rooms', []), 1):
    print('  {:2}) {}'.format(i, r.get('title', r.get('id', '?'))))
"
