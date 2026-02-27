#!/usr/bin/env bash
# Corrige les erreurs 500 /api/auth et "Why did API doesn't respond" sur EVE-NG
# Causes : disque plein, base corrompue, Apache/PHP non démarrés
# Usage : make eve-ng-fix-api  ou  EVE_SSH_KEY=~/.ssh/eve-ng make eve-ng-fix-api

set -e
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EVE_HOST="${1:-127.0.0.1}"
EVE_PORT="${2:-9022}"

# Expansion du ~ dans EVE_SSH_KEY (make ne développe pas ~)
EVE_SSH_KEY="${EVE_SSH_KEY/#\~/$HOME}"
[ -z "$EVE_SSH_KEY" ] && [ -f "$HOME/.ssh/eve-ng" ] && EVE_SSH_KEY="$HOME/.ssh/eve-ng"

EVE_PASS="${EVE_PASSWORD:-eve}"

try_ssh() {
  if [ -n "$EVE_SSH_KEY" ] && [ -f "$EVE_SSH_KEY" ]; then
    ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -o BatchMode=yes -i "$EVE_SSH_KEY" -p "$EVE_PORT" root@$EVE_HOST "$@"
  elif command -v sshpass &>/dev/null; then
    sshpass -p "$EVE_PASS" ssh -o StrictHostKeyChecking=no -o BatchMode=no -p "$EVE_PORT" root@$EVE_HOST "$@"
  else
    echo "  Aucune clé SSH ni sshpass. Installe : sudo pacman -S sshpass"
    return 1
  fi
}

if ! try_ssh "echo OK" 2>/dev/null; then
  echo "=== Connexion SSH impossible ==="
  echo "  Diagnostic : ssh -v -p $EVE_PORT root@$EVE_HOST   (pour voir l'erreur exacte)"
  echo "  Option 1 — sshpass : sudo pacman -S sshpass && make eve-ng-fix-api (mot de passe défaut : eve)"
  echo "  Option 2 — copier ta clé : ssh-copy-id -i ~/.ssh/eve-ng -p $EVE_PORT root@$EVE_HOST"
  echo "            (taper 'eve' quand demandé, une seule fois)"
  exit 1
fi

echo "=== Diagnostic et correction EVE-NG (api/auth 500) ==="
echo ""

# 1. Espace disque
echo "--- Espace disque ---"
try_ssh "df -h / | tail -1" || true
full=$(try_ssh "df / | tail -1 | awk '{print \$5}'" 2>/dev/null | tr -d '%')

if [ -n "$full" ] && [ "$full" -gt 90 ]; then
  echo "  ⚠ Disque >90% plein ($full%) — risque 500 sur /api/auth"
  echo "  → Nettoyage agressif..."
  try_ssh "
    rm -rf /var/log/*.gz /var/log/*.1 /var/log/*.old 2>/dev/null
    :> /var/log/syslog 2>/dev/null
    :> /var/log/auth.log 2>/dev/null
    journalctl --vacuum-size=5M 2>/dev/null
    rm -rf /opt/unetlab/tmp/* /var/cache/apt/archives/* 2>/dev/null
    apt-get clean 2>/dev/null
    apt-get autoremove -y --purge 2>/dev/null
    find /tmp -type f -mtime +1 -delete 2>/dev/null
  " || true
  echo "  ✓ Nettoyé. df après :"
  try_ssh "df -h / | tail -1"
  free_now=$(try_ssh "df / | tail -1 | awk '{print \$4}'" 2>/dev/null)
  full_after=$(try_ssh "df / | tail -1 | awk '{print \$5}'" 2>/dev/null | tr -d '%')
  if [ -n "$full_after" ] && [ "$full_after" -ge 98 ]; then
    echo ""
    echo "  ⚠ Toujours saturé ($full_after%). Agrandir le disque : make eve-ng-disk-expand"
    echo "  (Arrête EVE, exécute make eve-ng-disk-expand, redémarre EVE, puis dans la VM :"
    echo "   partprobe && pvresize /dev/sda5 && lvextend -l +100%FREE /dev/ubuntu-vg/ubuntu-lv && resize2fs /dev/ubuntu-vg/ubuntu-lv)"
  fi
fi

# 2. Apache
echo ""
echo "--- Apache ---"
try_ssh "systemctl status apache2 2>/dev/null | head -5 || service apache2 status 2>/dev/null | head -5" || true
try_ssh "systemctl restart apache2 2>/dev/null || service apache2 restart 2>/dev/null" && echo "  ✓ Apache redémarré" || echo "  ? Vérifier Apache manuellement"

# 3. Base de données (restoredb corrige souvent les 500)
echo ""
echo "--- Base de données EVE-NG ---"
try_ssh "/opt/unetlab/wrappers/unl_wrapper -a restoredb" 2>/dev/null && echo "  ✓ Base restaurée (restoredb)" || echo "  ? restoredb non exécuté (vérifier manuellement)"

# 4. Permissions
echo ""
echo "--- Permissions ---"
try_ssh "/opt/unetlab/wrappers/unl_wrapper -a fixpermissions" 2>/dev/null && echo "  ✓ fixpermissions OK" || true

# 5. Logs récents (pour debug)
echo ""
echo "--- Dernières erreurs Apache ---"
try_ssh "tail -5 /var/log/apache2/error.log 2>/dev/null || tail -5 /var/log/httpd/error_log 2>/dev/null || echo '  (log non trouvé)'" || true

echo ""
echo "=== Terminé. Rafraîchis http://127.0.0.1:9080/ (F5) et réessaie de te connecter. ==="
echo "  Identifiants : admin / eve"
echo ""
echo "  Si toujours 500 : ouvre une console sur EVE (ssh -p 9022 root@127.0.0.1) et lance :"
echo "    tail -50 /var/log/apache2/error.log"
echo "    /opt/unetlab/wrappers/unl_wrapper -a restoredb"
