#!/usr/bin/env bash
# Affiche le détail d'un scénario par numéro (1-based). Usage: tui-show-scenario.sh <num>
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
with open('platform/data/scenarios.json') as f:
    d = json.load(f)
scenarios = d.get('scenarios', [])
if not 1 <= num <= len(scenarios):
    print('Numéro invalide.')
    sys.exit(1)
s = scenarios[num - 1]
print('=== ' + s.get('title', '') + ' ===')
print()
print(s.get('description', ''))
print()
print('Difficulté:', s.get('difficulty', ''), '| Catégorie:', s.get('category', ''), '| Durée:', s.get('time', ''))
print()
print('--- Machines ---')
for m in s.get('machines', []):
    print('  -', m.get('name', ''), ':', m.get('note', m.get('urlKey', '')))
print()
print('--- Tâches ---')
for i, t in enumerate(s.get('tasks', []), 1):
    print('  {}. {}'.format(i, t.get('title', '')))
    if t.get('content'):
        print('     ', t['content'][:200] + ('...' if len(t.get('content','')) > 200 else ''))
    if t.get('command'):
        print('     Cmd:', t['command'][:80] + ('...' if len(str(t.get('command',''))) > 80 else ''))
    print()
PY

echo ""
read -p "Appuyez sur Entrée pour continuer..." x
