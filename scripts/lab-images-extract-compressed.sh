#!/usr/bin/env bash
# Extrait les archives compressées vers lab-images/
# Usage : make lab-images-extract-compressed [IMAGE=veos-4.23]
#   Sans IMAGE : extrait tout
#   Avec IMAGE : extrait uniquement cette image (qemu/veos-4.23 ou dynamips/iol)

set -e
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LAB="$ROOT/isos/lab-images"
COMPRESSED="$ROOT/isos/archives-compressed"
ONLY="${IMAGE:-}"

mkdir -p "$LAB"/{qemu,dynamips,iol}
count=0

echo "=== Extraction archives → lab-images ==="
[ -n "$ONLY" ] && echo "Image cible : $ONLY"
echo ""

# Mode 1 : archives monolithes (dynamips, iol — pas de format par-image)
for archive in "$COMPRESSED"/lab-images-dynamips.tar.zst "$COMPRESSED"/lab-images-iol.tar.zst; do
  [ -f "$archive" ] || continue
  echo "  $(basename "$archive")"
  zstd -dc "$archive" | tar -x -C "$LAB" -f -
  count=$((count+1))
done

# Mode 2 : qemu — format par image (prioritaire) ou monolithe si pas de qemu/*.tar.zst
if [ -d "$COMPRESSED/qemu" ] && [ -n "$(ls "$COMPRESSED/qemu"/*.tar.zst 2>/dev/null)" ]; then
  # Per-image : extraction ciblée possible
  for arch in "$COMPRESSED/qemu"/*.tar.zst; do
    [ -f "$arch" ] || continue
    name=$(basename "$arch" .tar.zst)
    [ -n "$ONLY" ] && [ "$name" != "$ONLY" ] && continue
    [ -d "$LAB/qemu/$name" ] && [ "$arch" -ot "$LAB/qemu/$name" ] && continue
    echo "  qemu/$name"
    zstd -dc "$arch" | tar -x -C "$LAB/qemu" -f -
    count=$((count+1))
  done
  for arch in "$COMPRESSED/qemu"/*.zst; do
    [ -f "$arch" ] || continue
    base=$(basename "$arch" .zst)
    [ -n "$ONLY" ] && [ "$base" != "$ONLY" ] && continue
    [ -f "$LAB/qemu/$base" ] && [ "$arch" -ot "$LAB/qemu/$base" ] && continue
    echo "  qemu/$base"
    zstd -dc "$arch" -o "$LAB/qemu/$base"
    count=$((count+1))
  done
elif [ -f "$COMPRESSED/lab-images-qemu.tar.zst" ]; then
  # Fallback : monolithe qemu si pas de format par-image
  echo "  lab-images-qemu.tar.zst"
  zstd -dc "$COMPRESSED/lab-images-qemu.tar.zst" | tar -x -C "$LAB" -f -
  count=$((count+1))
fi

if [ -d "$COMPRESSED/dynamips" ] && [ -n "$(ls "$COMPRESSED/dynamips"/*.zst 2>/dev/null)" ]; then
  for arch in "$COMPRESSED/dynamips"/*.zst; do
    [ -f "$arch" ] || continue
    base=$(basename "$arch" .zst)
    [ -n "$ONLY" ] && [ "$ONLY" != "all" ] && continue
    echo "  dynamips/$base"
    zstd -dc "$arch" -o "$LAB/dynamips/$base"
    count=$((count+1))
  done
fi

if [ -d "$COMPRESSED/iol" ] && [ -n "$(ls "$COMPRESSED/iol"/*.zst 2>/dev/null)" ]; then
  for arch in "$COMPRESSED/iol"/*.zst; do
    [ -f "$arch" ] || continue
    base=$(basename "$arch" .zst)
    [ -n "$ONLY" ] && [ "$ONLY" != "all" ] && continue
    echo "  iol/$base"
    zstd -dc "$arch" -o "$LAB/iol/$base"
    count=$((count+1))
  done
fi

echo ""
echo "=== $count extrait(s). Lance : make lab-images-transfer-eve-ng"
