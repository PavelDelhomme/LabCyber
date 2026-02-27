#!/usr/bin/env bash
# Déplace PortProton vers /data et crée un lien symbolique
# Les .desktop (Bureau, .local/share/applications) utilisent /home/pactivisme/PortProton
# Avec le lien, ça pointe vers /data/PortProton : transparent, rien à modifier.
# Usage : ./scripts/move-portproton-to-data.sh

set -e
SRC="$HOME/PortProton"
DEST="/data/PortProton"

if [ ! -d "$SRC" ]; then
  echo "PortProton introuvable : $SRC"
  exit 1
fi

if [ -L "$SRC" ]; then
  echo "PortProton est déjà un lien vers $(readlink "$SRC")"
  exit 0
fi

echo "=== Déplacement PortProton vers /data ==="
echo "Source : $SRC"
echo "Cible  : $DEST"
echo ""
echo "Les raccourcis (.desktop) utilisent $SRC — avec le lien, tout continuera de fonctionner."
echo ""
read -p "Continuer ? [o/N] " r
[ "$r" = "o" ] || [ "$r" = "O" ] || exit 1

mv "$SRC" "$DEST"
ln -s "$DEST" "$SRC"
echo "✓ Terminé. $SRC → $DEST"
df -h /home | tail -1
