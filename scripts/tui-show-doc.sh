#!/usr/bin/env bash
# Affiche une doc par numéro (1-based). Usage: tui-show-doc.sh <num> — utilise PAGER ou less
set -e
cd "$(dirname "$0")/.."
n="${1:-0}"
fpath=$(python3 - "$n" << 'PY' 2>/dev/null
import json, sys
try:
    num = int(sys.argv[1])
except (ValueError, IndexError):
    sys.exit(1)
with open('platform/data/docs.json') as f:
    d = json.load(f)
entries = d.get('entries', [])
if not 1 <= num <= len(entries):
    sys.exit(1)
e = entries[num - 1]
print('docs/' + e.get('file', ''))
PY
) || { echo "Numéro invalide."; read -p "Appuyez sur Entrée..."; exit 1; }
if [ -f "$fpath" ]; then
  ${PAGER:-less} "$fpath"
else
  echo "Fichier introuvable: $fpath"
  read -p "Appuyez sur Entrée pour continuer..." x
fi
