#!/usr/bin/env bash
# Compresse lab-images/ en archives ultra-compressées (tar.zst)
# Stockage : isos/archives-compressed/
# À la demande : extraire pour transfert EVE via make lab-images-extract-compressed
# Usage : ./scripts/lab-images-compress-to-archives.sh

set -e
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LAB="$ROOT/isos/lab-images"
COMPRESSED="$ROOT/isos/archives-compressed"
ZSTD_LEVEL="${ZSTD_LEVEL:-19}"

mkdir -p "$COMPRESSED"
echo "=== Compression lab-images vers archives ultra-compressées ==="
echo "Source : $LAB"
echo "Cible  : $COMPRESSED (zstd -$ZSTD_LEVEL)"
echo ""

for subdir in qemu dynamips iol; do
  if [ ! -d "$LAB/$subdir" ] || [ -z "$(ls -A "$LAB/$subdir" 2>/dev/null)" ]; then
    echo "  (skip $subdir — vide ou absent)"
    continue
  fi
  out="$COMPRESSED/lab-images-$subdir.tar.zst"
  echo "  Compression $subdir → $out"
  tar -c -C "$LAB" "$subdir" | zstd -$ZSTD_LEVEL -o "$out" -T0
  echo "    ✓ $(du -sh "$out" | cut -f1)"
done

echo ""
echo "=== Terminé ==="
du -sh "$COMPRESSED"/* 2>/dev/null
echo ""
echo "Pour libérer l'espace des originaux (après vérification) :"
echo "  rm -rf $LAB/qemu/* $LAB/dynamips/* $LAB/iol/*"
echo ""
echo "Pour extraire à la demande (avant transfert EVE) : make lab-images-extract-compressed"
