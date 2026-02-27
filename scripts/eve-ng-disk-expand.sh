#!/usr/bin/env bash
# Agrandit le disque virtuel EVE-NG (qcow2) pour résoudre le disque 100% plein
# Usage : make eve-ng-disk-expand [SIZE=80G]
# IMPORTANT : Arrêter EVE-NG (fermer la fenêtre QEMU) avant d'exécuter

set -e
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EVE_NG_DISK="${EVE_NG_DISK:-$ROOT/isos/eve-ng-disk.qcow2}"
NEW_SIZE="${1:-${SIZE:-80G}}"

echo "=== Agrandissement disque EVE-NG ==="
echo ""

if [ ! -f "$EVE_NG_DISK" ]; then
  echo "  Erreur : $EVE_NG_DISK introuvable"
  exit 1
fi

# Vérifier qu'EVE n'est pas en cours d'exécution
if pgrep -f "qemu.*eve-ng-disk.qcow2" >/dev/null 2>&1; then
  echo "  ⚠ EVE-NG semble en cours d'exécution !"
  echo "  Ferme la fenêtre EVE-NG avant de continuer."
  exit 1
fi

current=$(qemu-img info "$EVE_NG_DISK" 2>/dev/null | grep "virtual size" | awk '{print $4}')
echo "  Disque actuel : $EVE_NG_DISK ($current)"
echo "  Nouvelle taille : $NEW_SIZE"
echo ""

qemu-img resize "$EVE_NG_DISK" "$NEW_SIZE"
echo "  ✓ Disque redimensionné."
echo ""
echo "=== À faire ensuite ==="
echo "  1. Démarrer EVE : make eve-ng-boot"
echo "  2. Étendre le FS (automatique via SSH) : make eve-ng-expand-fs"
echo "  3. Rafraîchir http://127.0.0.1:9080/ et se connecter (admin / eve)"
echo ""
echo "  Doc : platform/docs/20-EVE-NG-WORKFLOW-TEST.md (section Erreur 500 / Méthode C)"
