#!/usr/bin/env bash
# Crée une archive complète du projet LabCyber (sauvegarde récupérable)
# Inclut : code, config, isos/lab-images, isos/gns3a, isos/docs, .env, etc.
# Usage : ./scripts/backup-lab-complete.sh [fichier_sortie.tar.gz]
# Exemple : make lab-backup

set -e
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="${1:-$ROOT/labcyber-backup-$(date +%Y%m%d-%H%M).tar.gz}"
EXCLUDE="--exclude=node_modules --exclude=.git --exclude=*.pyc --exclude=__pycache__ --exclude=playwright-report --exclude=test-results --exclude=.cursor --exclude=isos/eve-ng-disk.qcow2"

echo "=== Sauvegarde complète LabCyber ==="
echo "Cible : $OUT"
echo ""

cd "$ROOT"
tar czf "$OUT" $EXCLUDE \
  --exclude="*.tar.gz" \
  --exclude="labcyber-backup-*.tar.gz" \
  .

echo "✓ Archive créée : $OUT"
ls -lh "$OUT"
echo ""
echo "Pour restaurer : tar xzf $OUT -C /chemin/destination"
echo "Ou extraire ici : tar xzf $OUT"
