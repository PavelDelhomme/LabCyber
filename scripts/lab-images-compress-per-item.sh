#!/usr/bin/env bash
# Compresse CHAQUE image individuellement — organisation préservée.
# Chaque qemu/veos-4.23 → archives-compressed/qemu/veos-4.23.tar.zst
# Chaque dynamips/c7200-xxx.image → archives-compressed/dynamips/c7200-xxx.image.zst
# Extraction à la demande : un seul IOL ou QEMU sans tout décompresser.
# Usage : ./scripts/lab-images-compress-per-item.sh
# Option : IMAGE=veos-4.23  (compresser uniquement cette image)

set -e
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LAB="$ROOT/isos/lab-images"
COMPRESSED="$ROOT/isos/archives-compressed"
ZSTD_LEVEL="${ZSTD_LEVEL:-19}"
ONLY="${IMAGE:-}"

mkdir -p "$COMPRESSED"/{qemu,dynamips,iol}
total=0

echo "=== Compression par image (organisation préservée) ==="
echo "Source : $LAB | Cible : $COMPRESSED | zstd -$ZSTD_LEVEL"
echo ""

# QEMU : chaque sous-dossier → qemu/veos-4.23.tar.zst
if [ -d "$LAB/qemu" ]; then
  for dir in "$LAB/qemu"/*/; do
    [ -d "$dir" ] || continue
    name=$(basename "$dir")
    [ -n "$ONLY" ] && [ "$name" != "$ONLY" ] && continue
    out="$COMPRESSED/qemu/$name.tar.zst"
    if [ -f "$out" ] && [ "$dir" -ot "$out" ]; then
      echo "  [skip] qemu/$name (déjà à jour)"
      continue
    fi
    echo "  [$(($total+1))] qemu/$name"
    tar -c -C "$LAB/qemu" "$name" | zstd -$ZSTD_LEVEL -o "$out" -T0 --force
    total=$((total+1))
  done
fi

# Fichiers qcow2/img/vmdk isolés dans qemu/ (sans sous-dossier)
if [ -d "$LAB/qemu" ]; then
  for f in "$LAB/qemu"/*.qcow2 "$LAB/qemu"/*.img "$LAB/qemu"/*.vmdk "$LAB/qemu"/*.iso 2>/dev/null; do
    [ -f "$f" ] || continue
    base=$(basename "$f")
    out="$COMPRESSED/qemu/$base.zst"
    [ -f "$out" ] && [ "$f" -ot "$out" ] && continue
    echo "  [$(($total+1))] qemu/$base"
    zstd -$ZSTD_LEVEL -o "$out" -T0 --force "$f"
    total=$((total+1))
  done
fi

# Dynamips : chaque .image → dynamips/c7200-xxx.image.zst
if [ -d "$LAB/dynamips" ]; then
  for f in "$LAB/dynamips"/*.image; do
    [ -f "$f" ] || continue
    base=$(basename "$f")
    out="$COMPRESSED/dynamips/$base.zst"
    [ -f "$out" ] && [ "$f" -ot "$out" ] && continue
    echo "  [$(($total+1))] dynamips/$base"
    zstd -$ZSTD_LEVEL -o "$out" -T0 --force "$f"
    total=$((total+1))
  done
fi

# IOL : chaque .bin → iol/xxx.bin.zst
if [ -d "$LAB/iol" ]; then
  for f in "$LAB/iol"/*.bin; do
    [ -f "$f" ] || continue
    base=$(basename "$f")
    out="$COMPRESSED/iol/$base.zst"
    [ -f "$out" ] && [ "$f" -ot "$out" ] && continue
    echo "  [$(($total+1))] iol/$base"
    zstd -$ZSTD_LEVEL -o "$out" -T0 --force "$f"
    total=$((total+1))
  done
fi

echo ""
echo "=== $total image(s) compressée(s) ==="
du -sh "$COMPRESSED" 2>/dev/null
echo ""
echo "Extraction à la demande : make lab-images-extract-compressed IMAGE=veos-4.23"
echo "Extraction totale : make lab-images-extract-compressed"
