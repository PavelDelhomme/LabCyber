#!/usr/bin/env bash
# Affiche le détail d'une room par numéro (1-based). Usage: tui-show-room.sh <num>
set -e
cd "$(dirname "$0")/.."
n="${1:-0}"
python3 - "$n" << 'PY'
import json, sys
try:
    num = int(sys.argv[1])
except (ValueError, IndexError):
    print('Numéro invalide.')
    sys.exit(1)
with open('platform/data/rooms.json') as f:
    d = json.load(f)
rooms = d.get('rooms', [])
if not 1 <= num <= len(rooms):
    print('Numéro invalide.')
    sys.exit(1)
r = rooms[num - 1]
print('=== ' + r.get('title', '') + ' ===')
print()
print(r.get('description', ''))
print()
print('Difficulté:', r.get('difficulty', ''), '| Catégorie:', r.get('category', ''))
print()
print('--- Objectifs ---')
for o in r.get('objectives', []):
    print('  -', o)
print()
print('--- Machines ---')
for m in r.get('machines', []):
    print('  -', m.get('name', ''), ':', m.get('note', m.get('credentials', m.get('urlKey', ''))))
print()
print('--- Tâches ---')
for i, t in enumerate(r.get('tasks', []), 1):
    print('  {}. {}'.format(i, t.get('title', '')))
    if t.get('content'):
        print('     ', t['content'][:200] + ('...' if len(t.get('content','')) > 200 else ''))
    print()
PY

echo ""
read -p "Appuyez sur Entrée pour continuer..." x
