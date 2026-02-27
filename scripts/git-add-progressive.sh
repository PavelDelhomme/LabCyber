#!/usr/bin/env bash
# Ajoute et pousse les fichiers un par un (commit + push à chaque fois)
# Évite les gros commits. Ignore les fichiers >80M (limite GitHub ~100M).
# Usage : ./scripts/git-add-progressive.sh

set -e
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
MAX_SIZE_MB=80

echo "=== Git add progressif (un par un) ==="
echo "Taille max par fichier : ${MAX_SIZE_MB}M"
echo ""

# Liste des éléments à ajouter (fichiers et dossiers)
# Les gros binaires (lab-images, archives, iso, qcow2) sont dans .gitignore
ITEMS=(
  .gitignore
  Makefile
  STATUS.md
  platform/data/backendImages.json
  platform/data/docs.json
  platform/data/customImages.json
  platform/data/eve-ng-passwords.json
  platform/public/data/backendImages.json
  platform/public/data/docs.json
  platform/public/data/customImages.json
  platform/docs/*.md
  platform/src/views/tools/*.jsx
  scripts/*.sh
  scripts/*.py
  isos/gns3a
  isos/docs
)

count=0
for pattern in "${ITEMS[@]}"; do
  for item in $pattern; do
    [ -e "$item" ] || continue
    # Vérifier taille (dossier = somme, fichier = taille)
    size_mb=$(du -sm "$item" 2>/dev/null | cut -f1)
    if [ "${size_mb:-0}" -gt "$MAX_SIZE_MB" ]; then
      echo "  Skip $item (${size_mb}M > ${MAX_SIZE_MB}M)"
      continue
    fi
    git add "$item"
    git diff --cached --quiet && continue
    echo "  [+] $item"
    git commit -m "Add/update $(echo $item | tr '/' ' ')"
    git push
    count=$((count+1))
  done
done

# Gns3a à la racine (si présents)
for f in *.gns3a; do
  [ -f "$f" ] || continue
  echo "  [+] $f"
  git add "$f"
  git commit -m "Add $f"
  git push || true
  count=$((count+1))
done

echo ""
echo "=== $count élément(s) traités ==="
