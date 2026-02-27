#!/usr/bin/env bash
# Extrait les images des archives dans isos/archives/ vers isos/lab-images/
# Usage : make lab-images-extract

set -e
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ARCHIVES="${ARCHIVES_DIR:-$ROOT/isos/archives}"
LAB="${LAB_IMAGES_DIR:-$ROOT/isos/lab-images}"
mkdir -p "$LAB"/{dynamips,iol,qemu}

echo "=== Extraction des archives (isos/archives/) ==="
echo "Source : $ARCHIVES"
echo "Cible  : $LAB"
echo ""

cd "$ARCHIVES"

# Dynamips : Cisco (zip)
for f in "Cisco 2600"*.zip "Cisco 1710"*.zip "Cisco 2691"*.zip "Cisco 3620"*.zip "Cisco 3640"*.zip "Cisco 3660"*.zip "Cisco 3725"*.zip "Cisco 3745"*.zip "Cisco 7200"*.zip; do
  [ -f "$f" ] || continue
  echo "  Dynamips : $f"
  unzip -o -j "$f" "*.image" -d "$LAB/dynamips/" 2>/dev/null && echo "    OK" || echo "    (pas d'image .image)"
done

# IOL : i86bi-linux (zip)
for f in i86bi-linux-*.zip; do
  [ -f "$f" ] || continue
  echo "  IOL : $f"
  unzip -o -j "$f" "*.bin" -d "$LAB/iol/" 2>/dev/null && echo "    OK" || echo "    (ignore)"
done

# vIOS L3, vIOS L2, vEOS, MikroTik, ASAv
for pattern in "vios-adventerprisek9-m*.tgz" "vios-adventerprisek9-m*.tar.gz" "viosl2-*.tgz" "veos-*.tgz" "mikrotik-*.tgz" "asav-*.tgz" "asav-*.tar.gz"; do
  for f in $pattern; do
    [ -f "$f" ] || continue
    name="${f%.*}"
    name="${name%.tgz}"
    name="${name%.tar.gz}"
    name=$(echo "$name" | sed 's/ (1)$//')
    [ -d "$LAB/qemu/$name" ] && echo "  ✓ Déjà : $name" || {
      echo "  QEMU : $f"
      mkdir -p "$LAB/qemu"
      tar -xzf "$f" -C "$LAB/qemu/" 2>/dev/null && echo "    OK" || echo "    ⚠ Échec"
    }
  done
done

# ctxsdw (Citrix SD-WAN), ctxsdwc
for f in ctxsdw*.tgz ctxsdw*.tar.gz ctxsdwc*.tgz; do
  [ -f "$f" ] || continue
  name="${f%.*}"
  name="${name%.tgz}"
  name="${name%.tar.gz}"
  [ -d "$LAB/qemu/$name" ] || { echo "  QEMU : $f"; mkdir -p "$LAB/qemu"; tar -xzf "$f" -C "$LAB/qemu/" 2>/dev/null && echo "    OK" || echo "    ⚠ Échec"; }
done

# firepower6, paloalto, fortinet, sophos, nsvpx, phoebe, clearpass, aruba...
for f in firepower6-*.tgz firepower6-*.tar.gz paloalto-*.tgz fortinet-*.tgz sophos*.tgz nsvpx-*.tgz phoebe-*.tgz clearpass-*.tgz arubacx-*.tgz barracuda-*.tgz; do
  [ -f "$f" ] || continue
  name="${f%.*}"
  name="${name%.tgz}"
  name="${name%.tar.gz}"
  [ -d "$LAB/qemu/$name" ] || { echo "  QEMU : $f"; mkdir -p "$LAB/qemu"; tar -xzf "$f" -C "$LAB/qemu/" 2>/dev/null && echo "    OK" || echo "    ⚠ Échec"; }
done

# linux-* (Ubuntu, CentOS, Debian, Kali, RHEL)
for f in linux-*.tgz; do
  [ -f "$f" ] || continue
  name="${f%.tgz}"
  [ -d "$LAB/qemu/$name" ] || { echo "  QEMU : $f"; mkdir -p "$LAB/qemu"; tar -xzf "$f" -C "$LAB/qemu/" 2>/dev/null && echo "    OK" || echo "    ⚠ Échec"; }
done

# Viptela, c8000v, cat9kv, csr1000vng, titanium, alienvault, vwlc...
for f in vtbond-*.tgz vtedge-*.tgz vtmgmt-*.tgz vtsmart-*.tgz c8000v-*.tgz catalyst8000v-*.tgz cat9kv-*.tgz csr1000vng-*.tgz titanium-*.tgz alienvault-*.tgz vwlc-*.tar.gz netedit-*.tgz; do
  [ -f "$f" ] || continue
  name="${f%.*}"
  name="${name%.tgz}"
  name="${name%.tar.gz}"
  [ -d "$LAB/qemu/$name" ] || { echo "  QEMU : $f"; mkdir -p "$LAB/qemu"; tar -xzf "$f" -C "$LAB/qemu/" 2>/dev/null && echo "    OK" || echo "    ⚠ Échec"; }
done

# Renommage vtmgmt
[ -d "$LAB/qemu/vtmgmt-20.6.2" ] && [ ! -d "$LAB/qemu/vtmgmt-20.6.2-001" ] && mv "$LAB/qemu/vtmgmt-20.6.2" "$LAB/qemu/vtmgmt-20.6.2-001" 2>/dev/null && echo "  ✓ vtmgmt-20.6.2 → vtmgmt-20.6.2-001"
[ -d "$LAB/qemu/vtmgmt-20.7.1" ] && [ ! -d "$LAB/qemu/vtmgmt-20.7.1-002" ] && mv "$LAB/qemu/vtmgmt-20.7.1" "$LAB/qemu/vtmgmt-20.7.1-002" 2>/dev/null && echo "  ✓ vtmgmt-20.7.1 → vtmgmt-20.7.1-002"

echo ""
echo "Terminé. Lance : make lab-images-organize-orphans && make lab-images-check"
