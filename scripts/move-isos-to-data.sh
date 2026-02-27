#!/usr/bin/env bash
# Déplace isos/ vers /data pour libérer ~308G sur /home
# Usage : ./scripts/move-isos-to-data.sh
# Prérequis : LabCyber dans ~/Documents/Cyber/LabCyber

set -e
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ISOS="$ROOT/isos"
DATA_ISOS="/data/LabCyber-isos"

if [ ! -d "$ISOS" ]; then
  echo "Erreur : isos/ introuvable dans $ROOT"
  exit 1
fi

if [ -L "$ISOS" ]; then
  echo "isos/ est déjà un lien symbolique vers $(readlink "$ISOS")"
  exit 0
fi

echo "=== Déplacement isos/ vers /data ==="
echo "Source : $ISOS"
echo "Cible  : $DATA_ISOS"
echo ""
echo "Cela va :"
echo "  1. Déplacer isos/ → $DATA_ISOS"
echo "  2. Créer le lien isos → $DATA_ISOS"
echo ""
read -p "Continuer ? (o/N) " r
[ "$r" = "o" ] || [ "$r" = "O" ] || exit 1

echo ""
echo "Déplacement en cours..."
mv "$ISOS" "$DATA_ISOS"
ln -s "$DATA_ISOS" "$ISOS"
echo ""
echo "✓ Terminé. isos pointe maintenant vers /data/LabCyber-isos"
echo "  Espace libéré sur /home : ~308G"
df -h /home | tail -1
