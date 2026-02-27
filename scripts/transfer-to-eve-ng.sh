#!/usr/bin/env bash
# Transfère TOUTES les images lab vers EVE-NG (VM ou serveur)
# Usage : ./scripts/transfer-to-eve-ng.sh [host] [port]
#   host : défaut 127.0.0.1
#   port : défaut 9022 (SSH EVE-NG)
# Prérequis : EVE-NG démarré (make eve-ng-boot)
#
# Pour éviter de taper le mot de passe à chaque transfert, configure une clé SSH :
#   ssh-keygen -t ed25519 -f ~/.ssh/eve-ng -N ""
#   ssh-copy-id -i ~/.ssh/eve-ng -p 9022 root@127.0.0.1
#   ssh -i ~/.ssh/eve-ng -p 9022 root@127.0.0.1   # test
# Puis : EVE_SSH_KEY=~/.ssh/eve-ng make lab-images-transfer-eve-ng

set -e
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LAB="${LAB_IMAGES_DIR:-$ROOT/isos/lab-images}"
COMPRESSED="$ROOT/isos/archives-compressed"
EVE_HOST="${1:-127.0.0.1}"
EVE_PORT="${2:-9022}"
EVE_USER="${EVE_USER:-root}"
EVE_SSH_OPTS="-o ConnectTimeout=10 -o StrictHostKeyChecking=no -o BatchMode=yes"
EVE_QEMU="/opt/unetlab/addons/qemu"
EVE_DYNAMIPS="/opt/unetlab/addons/dynamips"
EVE_IOL="/opt/unetlab/addons/iol/bin"

# Clé SSH optionnelle (évite les prompts mot de passe)
[ -n "$EVE_SSH_KEY" ] && [ -f "$EVE_SSH_KEY" ] && EVE_SSH_OPTS="$EVE_SSH_OPTS -i $EVE_SSH_KEY"

echo "=== Transfert des images vers EVE-NG ==="
echo "Cible : $EVE_USER@$EVE_HOST:$EVE_PORT"
[ -n "$EVE_SSH_KEY" ] && echo "Clé SSH : $EVE_SSH_KEY"
echo ""

# Si lab-images vide mais archives compressées présentes → extraction auto
if [ ! -d "$LAB/qemu" ] || [ -z "$(ls -A "$LAB/qemu" 2>/dev/null)" ]; then
  if [ -d "$COMPRESSED" ] && [ -n "$(ls -A "$COMPRESSED" 2>/dev/null)" ]; then
    echo "lab-images vide : extraction depuis archives-compressed..."
    "$ROOT/scripts/lab-images-extract-compressed.sh" || true
    echo ""
  fi
fi

# Sans clé : BatchMode=yes échouera si auth requise. Réessayer sans BatchMode.
check_ssh() {
  ssh $EVE_SSH_OPTS -p "$EVE_PORT" "$EVE_USER@$EVE_HOST" "echo OK" 2>/dev/null
}
if ! check_ssh; then
  echo "Connexion SSH sans mot de passe impossible."
  echo ""
  echo "  Option 1 — Configurer une clé SSH (recommandé) :"
  echo "    ssh-keygen -t ed25519 -f ~/.ssh/eve-ng -N \"\""
  echo "    ssh-copy-id -i ~/.ssh/eve-ng -p 9022 root@127.0.0.1"
  echo "    EVE_SSH_KEY=~/.ssh/eve-ng make lab-images-transfer-eve-ng"
  echo ""
  echo "  Option 2 — Utiliser sshpass (une seule entrée) :"
  echo "    sshpass -p 'eve' ./scripts/transfer-to-eve-ng.sh   # mot de passe défaut EVE-NG"
  echo ""
  echo "  Option 3 — Transfert manuel par étapes :"
  echo "    scp -P 9022 -r isos/lab-images/qemu/* root@127.0.0.1:/opt/unetlab/addons/qemu/"
  echo "    scp -P 9022 isos/lab-images/dynamips/*.image root@127.0.0.1:/opt/unetlab/addons/dynamips/"
  echo "    scp -P 9022 isos/lab-images/iol/*.bin root@127.0.0.1:/opt/unetlab/addons/iol/bin/"
  echo "    ssh -p 9022 root@127.0.0.1 '/opt/unetlab/wrappers/unl_wrapper -a fixpermissions'"
  exit 1
fi

SSH_CMD="ssh $EVE_SSH_OPTS -p $EVE_PORT $EVE_USER@$EVE_HOST"
SCP_CMD="scp $EVE_SSH_OPTS -P $EVE_PORT"

# QEMU : rsync avec progression si dispo, sinon scp
if [ -d "$LAB/qemu" ] && [ "$(ls -A "$LAB/qemu" 2>/dev/null)" ]; then
  echo "--- QEMU ---"
  count=$(find "$LAB/qemu" -mindepth 1 -maxdepth 1 -type d | wc -l)
  echo "  Transfert de $count dossier(s) QEMU..."
  if command -v rsync &>/dev/null; then
    rsync -avz --info=progress2 -e "ssh $EVE_SSH_OPTS -p $EVE_PORT" "$LAB/qemu/" "$EVE_USER@$EVE_HOST:$EVE_QEMU/" && echo "  ✓ QEMU OK" || \
    ($SCP_CMD -r "$LAB/qemu/"* "$EVE_USER@$EVE_HOST:$EVE_QEMU/" && echo "  ✓ QEMU OK (scp)") || echo "  ⚠ Échec partiel QEMU"
  else
    $SCP_CMD -r "$LAB/qemu/"* "$EVE_USER@$EVE_HOST:$EVE_QEMU/" && echo "  ✓ QEMU OK" || echo "  ⚠ Échec partiel QEMU"
  fi
else
  echo "  (aucun dossier QEMU)"
fi

# Dynamips (scp affiche la progression par fichier)
if [ -d "$LAB/dynamips" ] && [ "$(ls -A "$LAB/dynamips" 2>/dev/null)" ]; then
  echo ""
  echo "--- Dynamips ---"
  $SCP_CMD "$LAB/dynamips/"*.image "$EVE_USER@$EVE_HOST:$EVE_DYNAMIPS/" && echo "  ✓ Dynamips OK" || echo "  ⚠ Échec Dynamips"
else
  echo "  (aucune image dynamips)"
fi

# IOL
if [ -d "$LAB/iol" ] && [ "$(ls -A "$LAB/iol" 2>/dev/null)" ]; then
  echo ""
  echo "--- IOL ---"
  $SSH_CMD "mkdir -p $EVE_IOL"
  $SCP_CMD "$LAB/iol/"*.bin "$EVE_USER@$EVE_HOST:$EVE_IOL/" && echo "  ✓ IOL OK" || echo "  ⚠ Échec IOL"
else
  echo "  (aucun IOL)"
fi

# Permissions EVE-NG
echo ""
echo "--- Permissions EVE-NG ---"
$SSH_CMD "/opt/unetlab/wrappers/unl_wrapper -a fixpermissions" 2>/dev/null && echo "  ✓ fixpermissions OK" || echo "  ⚠ fixpermissions (vérifier manuellement)"

echo ""
echo "=== Transfert terminé ==="
echo "Rafraîchis l'interface web EVE-NG pour voir les nouvelles images."
echo "Web : http://$EVE_HOST:9080 (ou 9443 HTTPS)"
