#!/usr/bin/env bash
# Étend le système de fichiers EVE-NG après agrandissement du qcow2
# À lancer DEPUIS L'HÔTE : make eve-ng-expand-fs
# (Se connecte en SSH à EVE et exécute les commandes sur la partition LVM)
# Prérequis : make eve-ng-disk-expand déjà fait, EVE-NG démarré

set -e
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EVE_HOST="${1:-127.0.0.1}"
EVE_PORT="${2:-9022}"
EVE_SSH_KEY="${EVE_SSH_KEY/#\~/$HOME}"
[ -z "$EVE_SSH_KEY" ] && [ -f "$HOME/.ssh/eve-ng" ] && EVE_SSH_KEY="$HOME/.ssh/eve-ng"
EVE_PASS="${EVE_PASSWORD:-eve}"

run() {
  if [ -n "$EVE_SSH_KEY" ] && [ -f "$EVE_SSH_KEY" ]; then
    ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -o BatchMode=yes -i "$EVE_SSH_KEY" -p "$EVE_PORT" root@$EVE_HOST "$@"
  elif command -v sshpass &>/dev/null; then
    sshpass -p "$EVE_PASS" ssh -o StrictHostKeyChecking=no -o BatchMode=no -p "$EVE_PORT" root@$EVE_HOST "$@"
  else
    echo "  Installe sshpass : sudo pacman -S sshpass"
    return 1
  fi
}

echo "=== Extension du système de fichiers EVE-NG ==="
echo ""

if ! run "echo OK" 2>/dev/null; then
  echo "  Connexion SSH impossible. Démarrer EVE : make eve-ng-boot"
  exit 1
fi

# Détecter la partition LVM (vda3 sur Ubuntu 22, format liste sans arbre)
PART=$(run "lsblk -ln -o NAME,TYPE,FSTYPE /dev/vda 2>/dev/null | awk '\$2==\"part\" && \$3==\"LVM2_member\" {print \$1}'" 2>/dev/null | head -1)
if [ -z "$PART" ]; then
  PART=$(run "lsblk -ln -o NAME,TYPE,FSTYPE /dev/sda 2>/dev/null | awk '\$2==\"part\" && \$3==\"LVM2_member\" {print \$1}'" 2>/dev/null | head -1)
  DISK="/dev/sda"
else
  DISK="/dev/vda"
fi

if [ -z "$PART" ]; then
  echo "  Partition LVM non trouvée. Vérifier : ssh -p $EVE_PORT root@$EVE_HOST 'lsblk'"
  exit 1
fi

PART_NUM="${PART#vda}"
PART_NUM="${PART_NUM#sda}"
echo "  Disque: $DISK, partition LVM: $PART (n° $PART_NUM)"
echo ""

echo "  1. Mise à jour GPT (backup en fin de disque)..."
run "sgdisk -e $DISK 2>/dev/null || true"
echo "  2. Extension de la partition avec parted..."
run "parted -s $DISK resizepart $PART_NUM 100%"
echo "  3. partprobe..."
run "partprobe $DISK"
echo "  4. pvresize..."
run "pvresize /dev/$PART"
echo "  5. lvextend (peut être déjà à jour)..."
run "lvextend -l +100%FREE /dev/ubuntu-vg/ubuntu-lv" || true
echo "  6. resize2fs..."
run "resize2fs /dev/ubuntu-vg/ubuntu-lv"
echo ""
echo "  df / :"
run "df -h /"
echo ""
echo "=== Terminé. Rafraîchis http://127.0.0.1:9080/ et connecte-toi (admin / eve)."
