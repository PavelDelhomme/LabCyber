#!/usr/bin/env bash
# Vérifie quelles images sont présentes dans isos/lab-images/
# Compare avec backendImages.json et les .gns3a dans isos/gns3a/
# Usage : make lab-images-check

set -e
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LAB_IMAGES="${LAB_IMAGES_DIR:-$ROOT/isos/lab-images}"
CATALOG="${ROOT}/platform/public/data/backendImages.json"

echo "=== Vérification des images lab ==="
echo "Répertoire : $LAB_IMAGES"
echo ""

# Patterns attendus (backendImages.json)
# dynamips: c7200-adventerprisek9-mz.image, c3700-*, c2691-*, c1710-*
# iol: L2-ADVENTERPRISEK9-M*.bin, L3-*, viosl2-*, vios-adventerprise*
# qemu: noms de dossiers ou fichiers (alpine-3.18, linux-netem, vyos-1.4, etc.)

check_dir() {
  local dir="$1"
  local pattern="$2"
  local name="$3"
  if [ -d "$dir" ]; then
    count=$(find "$dir" -maxdepth 2 -name "$pattern" 2>/dev/null | wc -l)
    if [ "$count" -gt 0 ]; then
      echo "  ✓ $name : trouvé"
      find "$dir" -maxdepth 2 -name "$pattern" 2>/dev/null | head -3 | while read f; do echo "    - $(basename "$f")"; done
    else
      echo "  ✗ $name : manquant (attendu : $pattern)"
    fi
  else
    echo "  ? $name : dossier $dir absent"
  fi
}

echo "--- Dynamips (Cisco IOS routeurs) ---"
check_dir "$LAB_IMAGES/dynamips" "c7200*.image" "Cisco 7200"
check_dir "$LAB_IMAGES/dynamips" "c3700*.image" "Cisco 3700"
check_dir "$LAB_IMAGES/dynamips" "c2691*.image" "Cisco 2691"
check_dir "$LAB_IMAGES/dynamips" "c3745*.image" "Cisco 3745"
check_dir "$LAB_IMAGES/dynamips" "c3725*.image" "Cisco 3725"
check_dir "$LAB_IMAGES/dynamips" "c3660*.image" "Cisco 3660"
check_dir "$LAB_IMAGES/dynamips" "c3640*.image" "Cisco 3640"
check_dir "$LAB_IMAGES/dynamips" "c3620*.image" "Cisco 3620"
check_dir "$LAB_IMAGES/dynamips" "c1700*.image" "Cisco 1700"
check_dir "$LAB_IMAGES/dynamips" "c2600*.image" "Cisco 2600"
check_dir "$LAB_IMAGES/dynamips" "c1710*.image" "Cisco 1710"

echo ""
echo "--- IOL (Cisco switchs) ---"
check_dir "$LAB_IMAGES/iol" "L2-*.bin" "IOL L2 (L2-*)"
check_dir "$LAB_IMAGES/iol" "i86bi-linux-l2*.bin" "IOL L2 (i86bi)"
check_dir "$LAB_IMAGES/iol" "L3-*.bin" "IOL L3 (L3-*)"
check_dir "$LAB_IMAGES/iol" "i86bi-linux-l3*.bin" "IOL L3 (i86bi)"
check_dir "$LAB_IMAGES/iol" "viosl2*" "vIOS L2 (iol)"
found=$(find "$LAB_IMAGES/qemu" -maxdepth 1 -type d -iname "*vios*" 2>/dev/null | head -1)
[ -n "$found" ] && echo "  ✓ vIOS (qemu) : $(basename "$found")" || echo "  ✗ vIOS (qemu) : manquant"
found=$(find "$LAB_IMAGES/qemu" -maxdepth 1 -type d -iname "*viosl2*" 2>/dev/null | head -1)
[ -n "$found" ] && echo "  ✓ vIOS L2 (qemu) : $(basename "$found")" || echo "  ✗ vIOS L2 (qemu) : manquant"

echo ""
echo "--- QEMU (Linux, routeurs, etc.) ---"
for img in linux-netem vyos alpine mikrotik vios viosl2 asav veos; do
  found=$(find "$LAB_IMAGES/qemu" -maxdepth 2 -iname "*${img}*" 2>/dev/null | head -1)
  if [ -n "$found" ]; then
    echo "  ✓ $img : $(basename "$found")"
  else
    echo "  ✗ $img : manquant"
  fi
done

echo ""
echo "--- Structure EVE-NG QEMU (format attendu) ---"
# Chaque sous-dossier qemu doit contenir hda.qcow2, virtioa.qcow2, ou autre format supporté
QEMU_EVE_PATTERNS="hda.qcow2 virtioa.qcow2 virtiob.qcow2 sataa.qcow2 scsia.qcow2 lsia.qcow2 virtidea.qcow2 megasasa.qcow2"
if [ -d "$LAB_IMAGES/qemu" ]; then
  ok=0
  warn=0
  for d in "$LAB_IMAGES/qemu"/*/; do
    [ -d "$d" ] || continue
    name=$(basename "$d")
    has_qcow=0
    for p in $QEMU_EVE_PATTERNS; do
      [ -f "$d/$p" ] && has_qcow=1 && break
    done
    if [ "$has_qcow" -eq 1 ]; then
      ok=$((ok+1))
    else
      [ $warn -eq 0 ] && echo "  Dossiers sans .qcow2 valide (hda/virtioa/sataa...) :"
      echo "    ⚠ $name (voir platform/docs/19-EVE-NG-QEMU-NAMING.md)"
      warn=$((warn+1))
    fi
  done
  [ $ok -gt 0 ] && echo "  ✓ $ok dossier(s) QEMU avec structure EVE-NG valide"
  [ $warn -gt 0 ] && echo "  Voir : platform/docs/19-EVE-NG-QEMU-NAMING.md pour le nommage"
else
  echo "  ? qemu/ absent"
fi

echo ""
echo "--- Fichiers .gns3a (isos/gns3a/) ---"
GNS3A="${ROOT}/isos/gns3a"
if [ -d "$GNS3A" ]; then
  count=$(find "$GNS3A" -maxdepth 1 -name "*.gns3a" 2>/dev/null | wc -l)
  echo "  $count fichier(s) .gns3a (make lab-images-gns3-server pour tout télécharger)"
else
  echo "  ? isos/gns3a/ absent"
fi

echo ""
echo "--- Mots de passe images ---"
echo "  Référence : isos/docs/passwords/PASSWORDS-EVE-NG.md"
echo "  JSON : platform/data/eve-ng-passwords.json"

echo ""
echo "--- Fichiers dans dynamips/ ---"
ls -la "$LAB_IMAGES/dynamips/" 2>/dev/null | tail -n +2 || echo "  (vide ou absent)"

echo ""
echo "--- Fichiers dans iol/ ---"
ls -la "$LAB_IMAGES/iol/" 2>/dev/null | tail -n +2 || echo "  (vide ou absent)"

echo ""
echo "Place tes images dans les bons dossiers puis relance : make lab-images-check"
