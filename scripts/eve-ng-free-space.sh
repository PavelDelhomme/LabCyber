#!/usr/bin/env bash
# À exécuter DANS la VM EVE-NG (via SSH avec mot de passe) pour libérer de l'espace
# Connexion : ssh -p 9022 root@127.0.0.1  (mot de passe : eve)
#
# Copie ce script dans la VM ou exécute les commandes une par une.

echo "=== Espace AVANT ==="
df -h /

echo ""
echo "=== Nettoyage EVE-NG ==="

# Logs
rm -rf /var/log/*.gz /var/log/*.1 /var/log/*.old 2>/dev/null
> /var/log/syslog 2>/dev/null
journalctl --vacuum-size=50M 2>/dev/null || true

# Tmp EVE-NG
rm -rf /opt/unetlab/tmp/* 2>/dev/null

# APT cache
apt-get clean 2>/dev/null
rm -rf /var/cache/apt/archives/*.deb 2>/dev/null

# Vieux kernels (libère souvent 1–2 Go)
apt-get autoremove -y --purge 2>/dev/null

echo ""
echo "=== Espace APRÈS ==="
df -h /
echo ""
echo "Si toujours plein : supprime des images inutilisées dans /opt/unetlab/addons/qemu/"
