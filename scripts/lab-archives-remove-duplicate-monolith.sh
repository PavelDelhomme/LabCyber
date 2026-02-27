#!/usr/bin/env bash
# Supprime les archives monolithes (lab-images-*.tar.zst) quand le format par-image existe.
# Doublon : lab-images-qemu.tar.zst (95G) + qemu/*.tar.zst (92G) = même contenu.
# On garde le format par-image (extraction à la demande, transfert à la volée).
# Usage : ./scripts/lab-archives-remove-duplicate-monolith.sh [--yes]

set -e
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPRESSED="$ROOT/isos/archives-compressed"
YES="${1:-}"

echo "=== Suppression des archives monolithes redondantes ==="
echo ""

for typ in qemu dynamips iol; do
  monolith="$COMPRESSED/lab-images-$typ.tar.zst"
  perdir="$COMPRESSED/$typ"
  if [ ! -f "$monolith" ]; then
    continue
  fi
  # Vérifier que le format par-image existe et a du contenu
  count=0
  if [ -d "$perdir" ]; then
    count=$(find "$perdir" -name "*.tar.zst" -o -name "*.zst" 2>/dev/null | wc -l)
  fi
  if [ "$count" -gt 0 ]; then
    size=$(du -sh "$monolith" 2>/dev/null | cut -f1)
    echo "  $monolith : $size (redondant avec $typ/*.tar.zst)"
    if [ "$YES" = "--yes" ]; then
      rm -f "$monolith"
      echo "    ✓ Supprimé"
    else
      read -p "  Supprimer ? (o/N) " r
      if [ "$r" = "o" ] || [ "$r" = "O" ]; then
        rm -f "$monolith"
        echo "    ✓ Supprimé"
      fi
    fi
  else
    echo "  $monolith : conservé (pas de $typ/*.zst équivalent)"
  fi
done

echo ""
echo "=== Espace après ==="
du -sh "$COMPRESSED"/* 2>/dev/null || true
