#!/usr/bin/env bash
# Organise les fichiers .qcow2 orphelins dans isos/lab-images/qemu/
# Chaque image doit être dans un sous-dossier EVE-NG (préfixe + version) avec le bon nom de fichier
# Usage : ./scripts/organize-qemu-orphans.sh [--dry-run]

set -e
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
QEMU_DIR="${LAB_IMAGES_DIR:-$ROOT/isos/lab-images}/qemu"
ORPHANS_DIR="${ROOT}/isos/docs/orphelins"
DRY_RUN="${1:-}"

mkdir -p "$QEMU_DIR"
mkdir -p "$ORPHANS_DIR"

run() {
  if [ "$DRY_RUN" = "--dry-run" ]; then
    echo "  [DRY-RUN] $*"
  else
    "$@"
  fi
}

organize() {
  local src="$1" dir="$2" dest_name="$3"
  [ -f "$src" ] || return 0
  [ -d "$dir" ] || run mkdir -p "$dir"
  local dst="$dir/$dest_name"
  if [ -f "$dst" ]; then
    echo "  ⚠ Déjà présent : $dst"
    run mv "$src" "$ORPHANS_DIR/" 2>/dev/null || true
  else
    run mv "$src" "$dst"
    echo "  ✓ $(basename "$src") → $dir/$dest_name"
  fi
}

echo "=== Organisation des qcow2 orphelins dans qemu/ ==="
echo "Répertoire : $QEMU_DIR"
echo ""

cd "$QEMU_DIR"

# F5 BIG-IP : bigip-X.Y.Z.M/virtioa.qcow2 (BIGIP-12.1.2.1.0.271.LTM.qcow2 → bigip-12.1.2.1)
for f in BIGIP-*.qcow2; do
  [ -f "$f" ] || continue
  ver=$(echo "$f" | sed -n 's/BIGIP-\([0-9.]*\)\.\(LTM\.\)*qcow2/\1/p' 2>/dev/null | cut -d. -f1-4)
  [ -z "$ver" ] && ver=$(echo "$f" | sed -n 's/BIGIP-\([0-9.]*\)\.qcow2/\1/p' 2>/dev/null | cut -d. -f1-4)
  [ -z "$ver" ] && ver="unknown"
  dir="$QEMU_DIR/bigip-$ver"
  organize "$f" "$dir" "virtioa.qcow2"
done

# F5 BIG-IQ : bigiq-X.Y/virtioa.qcow2 (BIG-IQ-5.x.DATASTOR.LTM → bigiq-5.x)
for f in BIG-IQ-*.qcow2; do
  [ -f "$f" ] || continue
  ver=$(echo "$f" | sed -n 's/BIG-IQ-\([0-9]*\.[0-9x]*\)\..*/\1/p')
  [ -z "$ver" ] && ver=$(echo "$f" | sed -n 's/BIG-IQ-\([0-9]*\)\..*/\1/p')
  [ -z "$ver" ] && ver="7.1"
  dir="$QEMU_DIR/bigiq-$ver"
  organize "$f" "$dir" "virtioa.qcow2"
done

# A10 vThunder : a10-vthunder-X/virtioa.qcow2 ou hda.qcow2 (doc dit hda)
for f in vThunder_*.qcow2 vth*.qcow2; do
  [ -f "$f" ] || continue
  ver=$(echo "$f" | sed -n 's/.*[Pp]\([0-9]*\).*/\1/p' | head -1)
  [ -z "$ver" ] && ver="410"
  dir="$QEMU_DIR/a10-vthunder-$ver"
  organize "$f" "$dir" "hda.qcow2"
done

# 6wind : 6wind-turbo-X (v3.1.4.m1 → 3.1.4, pas de point final)
for f in 6wind-*.qcow2; do
  [ -f "$f" ] || continue
  ver=$(echo "$f" | sed -n 's/.*v\([0-9]\+\.[0-9]\+\.[0-9]\)\..*/\1/p')
  [ -z "$ver" ] && ver="3.1.4"
  dir="$QEMU_DIR/6wind-turbo-$ver"
  organize "$f" "$dir" "virtioa.qcow2"
done

# Nokia TiMOS : timos-X/virtidea.qcow2
for f in TiMOS-*.qcow2; do
  [ -f "$f" ] || continue
  [ -s "$f" ] || { echo "  ✗ $f (vide) → orphelins"; run mv "$f" "$ORPHANS_DIR/" 2>/dev/null; continue; }
  ver=$(echo "$f" | sed -n 's/TiMOS-SR-\([0-9.]*\).*/\1/p')
  [ -z "$ver" ] && ver="12.0"
  dir="$QEMU_DIR/timos-$ver"
  organize "$f" "$dir" "virtidea.qcow2"
done

# AlmaLinux GenericCloud : linux-almalinux-X.Y (une version par fichier : 8.7, 8.8, 9.2…)
for f in AlmaLinux-*-GenericCloud-*.qcow2; do
  [ -f "$f" ] || continue
  ver=$(echo "$f" | sed -n 's/AlmaLinux-\([0-9]*\)-GenericCloud-\([0-9.]*\).*/\1.\2/p')
  [ -z "$ver" ] && ver=$(echo "$f" | sed -n 's/AlmaLinux-\([0-9]*\)-GenericCloud.*/\1/p')
  [ -z "$ver" ] && ver="9"
  dir="$QEMU_DIR/linux-almalinux-$ver"
  organize "$f" "$dir" "virtioa.qcow2"
done

# generic_alpine : linux-alpine-X ou alpine-X
for f in generic_alpine-*.qcow2; do
  [ -f "$f" ] || continue
  ver=$(echo "$f" | sed -n 's/generic_alpine-\([0-9.]*\).*/\1/p')
  [ -z "$ver" ] && ver="3.21"
  dir="$QEMU_DIR/linux-alpine-$ver"
  organize "$f" "$dir" "virtioa.qcow2"
done

# AsterNOS : asterfusion (format img.gz — laisser en orphelin ou dossier dédié)
for f in AsterNOS*.img.gz; do
  [ -f "$f" ] || continue
  echo "  ? $f (format img.gz) → isos/docs/orphelins (extraire manuellement si besoin)"
  run mv "$f" "$ORPHANS_DIR/" 2>/dev/null || true
done

# ISO cloud-init (garder à la racine ou déplacer — souvent utilisés avec les images)
for f in *-cloud-init-data.iso; do
  [ -f "$f" ] || continue
  echo "  ℹ $f : conservé (cloud-init)"
done

echo ""
echo "Terminé. Lance : make lab-images-check"
