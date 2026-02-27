#!/usr/bin/env bash
# Transfère les images vers EVE-NG par flux (décompression à la volée, sans écrire sur disque local).
# Usage : ./scripts/transfer-to-eve-ng-stream.sh [host] [port] [IMAGE=veos-4.23]
#   Sans IMAGE : transfère toutes les images de archives-compressed
#   Avec IMAGE : transfère uniquement cette image
#
# Prérequis : EVE-NG démarré, clé SSH configurée (EVE_SSH_KEY=~/.ssh/eve-ng)

set -e
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPRESSED="$ROOT/isos/archives-compressed"
EVE_HOST="${1:-127.0.0.1}"
EVE_PORT="${2:-9022}"
EVE_USER="${EVE_USER:-root}"
EVE_SSH_OPTS="-o ConnectTimeout=10 -o StrictHostKeyChecking=no -o BatchMode=yes"
EVE_QEMU="/opt/unetlab/addons/qemu"
EVE_DYNAMIPS="/opt/unetlab/addons/dynamips"
EVE_IOL="/opt/unetlab/addons/iol/bin"
ONLY="${IMAGE:-}"

[ -n "$EVE_SSH_KEY" ] && [ -f "$EVE_SSH_KEY" ] && EVE_SSH_OPTS="$EVE_SSH_OPTS -i $EVE_SSH_KEY"
SSH_CMD="ssh $EVE_SSH_OPTS -p $EVE_PORT $EVE_USER@$EVE_HOST"

echo "=== Transfert à la volée vers EVE-NG (sans extraction locale) ==="
echo "Cible : $EVE_USER@$EVE_HOST:$EVE_PORT"
echo ""

if ! $SSH_CMD "echo OK" 2>/dev/null; then
  echo "Connexion SSH impossible. Configure une clé : EVE_SSH_KEY=~/.ssh/eve-ng $0"
  exit 1
fi

count=0

# QEMU : flux zstd | tar vers EVE
if [ -d "$COMPRESSED/qemu" ]; then
  for arch in "$COMPRESSED/qemu"/*.tar.zst; do
    [ -f "$arch" ] || continue
    name=$(basename "$arch" .tar.zst)
    [ -n "$ONLY" ] && [ "$name" != "$ONLY" ] && continue
    echo "  qemu/$name (flux...)"
    zstd -dc "$arch" | $SSH_CMD "cd $EVE_QEMU && tar -x"
    count=$((count+1))
  done
fi

# Dynamips : monolithe (flux)
if [ -f "$COMPRESSED/lab-images-dynamips.tar.zst" ] && [ -z "$ONLY" ]; then
  echo "  dynamips (flux...)"
  zstd -dc "$COMPRESSED/lab-images-dynamips.tar.zst" | $SSH_CMD "cd /opt/unetlab/addons && tar -x"
  count=$((count+1))
fi

# IOL : monolithe (flux) — tar a iol/*.bin, EVE attend iol/bin/*.bin
if [ -f "$COMPRESSED/lab-images-iol.tar.zst" ] && [ -z "$ONLY" ]; then
  echo "  iol (flux...)"
  zstd -dc "$COMPRESSED/lab-images-iol.tar.zst" | $SSH_CMD "mkdir -p $EVE_IOL && cd /opt/unetlab/addons && tar -x && mv -n iol/*.bin iol/bin/ 2>/dev/null || true"
  count=$((count+1))
fi

echo ""
echo "--- Permissions EVE-NG ---"
$SSH_CMD "/opt/unetlab/wrappers/unl_wrapper -a fixpermissions" 2>/dev/null || true

echo ""
echo "=== $count flux transféré(s). Rafraîchir l'interface EVE-NG ==="
