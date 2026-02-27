#!/usr/bin/env bash
# Rapport d'utilisation disque /home vs /data
# Usage : ./scripts/disk-usage-report.sh

echo "=============================================="
echo "  RAPPORT ESPACE DISQUE"
echo "=============================================="
echo ""

echo "--- Espace global ---"
df -h / /home /data 2>/dev/null | grep -E "Sys|/|home|data"
echo ""

echo "--- Gros dossiers /home (top 20) ---"
du -sh /home/pactivisme/Documents /home/pactivisme/Téléchargements /home/pactivisme/.cache \
  /home/pactivisme/.steam /home/pactivisme/PortProton /home/pactivisme/.wine \
  "/home/pactivisme/GOG Games" /home/pactivisme/.gradle /home/pactivisme/.npm \
  /home/pactivisme/.local /home/pactivisme/.cargo 2>/dev/null | sort -hr

echo ""
echo "--- Documents/Cyber (LabCyber) ---"
du -sh /home/pactivisme/Documents/Cyber 2>/dev/null
du -sh /home/pactivisme/Documents/Cyber/LabCyber/isos 2>/dev/null
du -sh /home/pactivisme/Documents/Cyber/LabCyber/isos/lab-images /home/pactivisme/Documents/Cyber/LabCyber/isos/archives /home/pactivisme/Documents/Cyber/LabCyber/isos/eve-ng-disk.qcow2 2>/dev/null

echo ""
echo "--- Cache (.cache) ---"
du -sh /home/pactivisme/.cache/yay /home/pactivisme/.cache/ms-playwright /home/pactivisme/.cache/debuginfod_client 2>/dev/null

echo ""
echo "--- Contenu /data ---"
ls -la /data 2>/dev/null
du -sh /data/* 2>/dev/null | sort -hr

echo ""
echo "=============================================="
echo "  ACTIONS RECOMMANDÉES"
echo "=============================================="
echo ""
echo "1. DÉPLACER LabCyber vers /data (libère ~315G sur /home) :"
echo "   mv ~/Documents/Cyber /data/"
echo "   ln -s /data/Cyber ~/Documents/Cyber"
echo ""
echo "2. OU juste les images lab (libère ~308G) :"
echo "   ./scripts/move-isos-to-data.sh"
echo "   (Makefile et chemins continuent de fonctionner via le lien)"
echo ""
echo "3. NETTOYER cache yay (libère ~160G) :"
echo "   yay -Scc   # ou: rm -rf ~/.cache/yay/*"
echo ""
echo "4. DÉPLACER PortProton vers /data (libère ~142G) :"
echo "   mv ~/PortProton /data/"
echo "   ln -s /data/PortProton ~/PortProton"
echo ""
echo "5. NETTOYER autres caches :"
echo "   npm cache clean --force"
echo "   rm -rf ~/.gradle/caches"
echo "   rm -rf ~/.cache/ms-playwright ~/.cache/debuginfod_client"
echo ""
