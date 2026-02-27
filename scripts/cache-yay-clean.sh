#!/usr/bin/env bash
# Nettoie le cache yay (~160G) et pacman
# Les dossiers download-* dans pacman sont des verrous : on les force.
# Usage : ./scripts/cache-yay-clean.sh

set -e

echo "=== Nettoyage cache yay + pacman ==="
echo ""

# 1. Vérifier qu'aucun pacman/yay n'est en cours
if pgrep -x pacman >/dev/null || pgrep -x yay >/dev/null; then
  echo "⚠ Ferme tous les pacman/yay en cours, puis relance ce script."
  exit 1
fi

# 2. Dossiers download-* bloqués (à traiter AVANT yay -Scc)
PACMAN_PKG="/var/cache/pacman/pkg"
if [ -d "$PACMAN_PKG" ]; then
  count=$(ls -d "$PACMAN_PKG"/download-* 2>/dev/null | wc -l)
  if [ "$count" -gt 0 ]; then
    echo "Dossiers download-* bloqués : $count"
    echo "Il faut les supprimer en root (sudo)."
    read -p "Exécuter : sudo rm -rf $PACMAN_PKG/download-* ? [o/N] " r
    if [ "$r" = "o" ] || [ "$r" = "O" ]; then
      sudo rm -rf "$PACMAN_PKG"/download-*
      echo "✓ Dossiers download-* supprimés"
    fi
  fi
fi

echo ""

# 3. Cache yay AUR (~160G dans ~/.cache/yay)
YAY_CACHE="$HOME/.cache/yay"
if [ -d "$YAY_CACHE" ]; then
  size=$(du -sh "$YAY_CACHE" 2>/dev/null | cut -f1)
  echo "Cache yay AUR : $YAY_CACHE ($size)"
  read -p "Supprimer le cache yay ? [o/N] " r
  if [ "$r" = "o" ] || [ "$r" = "O" ]; then
    rm -rf "$YAY_CACHE"/*
    echo "✓ Cache yay vidé"
  fi
else
  echo "Aucun cache yay trouvé"
fi

echo ""

# 4. Cache pacman classique
echo "Nettoyage cache pacman (yay -Scc)..."
echo "Réponds 'o' aux questions pour tout supprimer."
yay -Scc || true

echo ""
echo "=== Terminé ==="
df -h /home | tail -1
