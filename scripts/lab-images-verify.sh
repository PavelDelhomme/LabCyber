#!/usr/bin/env bash
# Vérifie la structure des images et génère un rapport (structure + identifiants de test)
# Usage : make lab-images-verify
# Note : Le test réel des VMs (boot + login) nécessite EVE-NG en marche — à faire manuellement.

set -e
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LAB_IMAGES="${LAB_IMAGES_DIR:-$ROOT/isos/lab-images}"
PASSWORDS_JSON="${ROOT}/platform/data/eve-ng-passwords.json"

echo "=== Vérification structure + identifiants pour tests ==="
echo "Répertoire images : $LAB_IMAGES"
echo ""

# Mapping préfixe dossier -> identifiants suggérés (depuis eve-ng-passwords.json)
# Réservé pour évolutions : lecture du JSON avec jq

echo "--- Images QEMU présentes (structure EVE-NG) ---"
QEMU_EVE_PATTERNS="hda.qcow2 virtioa.qcow2 virtiob.qcow2 sataa.qcow2 scsia.qcow2 lsia.qcow2 virtidea.qcow2 megasasa.qcow2"
if [ -d "$LAB_IMAGES/qemu" ]; then
  for d in "$LAB_IMAGES/qemu"/*/; do
    [ -d "$d" ] || continue
    name=$(basename "$d")
    qcow=""
    for p in $QEMU_EVE_PATTERNS; do
      [ -f "$d/$p" ] && qcow="$p" && break
    done
    if [ -n "$qcow" ]; then
      echo "  ✓ $name → $qcow"
    else
      echo "  ✗ $name → PAS DE .qcow2 reconnu (attendu : hda, virtioa, sataa...)"
    fi
  done
else
  echo "  (dossier qemu absent)"
fi

echo ""
echo "--- Identifiants à tester (référence) ---"
if [ -f "$PASSWORDS_JSON" ]; then
  echo "  Fichier : $PASSWORDS_JSON"
  if command -v jq &>/dev/null; then
    jq -r '.credentials | to_entries[] | "  \(.key): \(.value.login)/\(.value.password)"' "$PASSWORDS_JSON" 2>/dev/null | head -15
  else
    echo "  (jq requis pour afficher le détail ; fichier présent)"
  fi
else
  echo "  Fichier absent : $PASSWORDS_JSON"
fi

echo ""
echo "--- Test manuel recommandé ---"
echo "  1. Démarrer EVE-NG : make eve-ng-boot"
echo "  2. Créer un lab avec une image"
echo "  3. Démarrer le nœud, ouvrir la console"
echo "  4. Tester les identifiants depuis eve-ng-passwords.json ou le PDF"
echo ""
echo "  PDF complet : https://github.com/hegdepavankumar/Cisco-Images-for-GNS3-and-EVE-NG"
echo "  Doc nommage : platform/docs/19-EVE-NG-QEMU-NAMING.md"
