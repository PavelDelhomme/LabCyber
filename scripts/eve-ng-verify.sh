#!/usr/bin/env bash
# Vérifie l'accès EVE-NG : SSH + images disponibles dans la VM
# Usage : make eve-ng-verify  ou  EVE_SSH_KEY=~/.ssh/eve-ng ./scripts/eve-ng-verify.sh

set -e
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EVE_HOST="${1:-127.0.0.1}"
EVE_PORT="${2:-9022}"
EVE_SSH_OPTS="-o ConnectTimeout=5 -o StrictHostKeyChecking=no -o BatchMode=yes"
[ -n "$EVE_SSH_KEY" ] && [ -f "$EVE_SSH_KEY" ] && EVE_SSH_OPTS="$EVE_SSH_OPTS -i $EVE_SSH_KEY"
SSH="ssh $EVE_SSH_OPTS -p $EVE_PORT root@$EVE_HOST"

echo "=== Vérification accès EVE-NG ==="
echo "Cible : root@$EVE_HOST:$EVE_PORT"
echo ""

# 1. SSH
if $SSH "echo OK" 2>/dev/null; then
  echo "  ✓ SSH OK"
else
  echo "  ✗ SSH échoué. Démarrer EVE-NG : make eve-ng-boot"
  echo "    Puis configurer clé : ssh-copy-id -i ~/.ssh/eve-ng -p $EVE_PORT root@$EVE_HOST"
  exit 1
fi

# 2. Images QEMU dans EVE
echo ""
echo "--- Images QEMU dans EVE-NG ---"
qemu_count=$($SSH "ls -d /opt/unetlab/addons/qemu/*/ 2>/dev/null | wc -l" 2>/dev/null || echo "0")
echo "  $qemu_count dossier(s) dans /opt/unetlab/addons/qemu/"
$SSH "ls /opt/unetlab/addons/qemu/ 2>/dev/null | head -20" 2>/dev/null || true
[ "$qemu_count" -gt 20 ] 2>/dev/null && echo "  ... (et autres)"

# 3. Web
echo ""
echo "--- Interface web ---"
if curl -sS -o /dev/null -w "%{http_code}" "http://$EVE_HOST:9080/" 2>/dev/null | grep -q 200; then
  echo "  ✓ http://$EVE_HOST:9080 (HTTP)"
else
  echo "  ? http://$EVE_HOST:9080 — vérifier si EVE-NG est démarré"
fi
echo "  HTTPS LabCyber : https://eve-ng.lab:4443 (si /etc/hosts configuré)"
echo ""
echo "Pour transférer des images : EVE_SSH_KEY=~/.ssh/eve-ng make lab-images-transfer-eve-ng-stream"
