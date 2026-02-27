#!/usr/bin/env bash
# Vérifie l'utilisation des ressources (mémoire, disque) du projet
# Usage : ./scripts/check-resources.sh

echo "=== Ressources du projet LabCyber ==="
echo ""

echo "--- Mémoire système ---"
free -h | head -2
echo ""

echo "--- Docker (si actif) ---"
docker stats --no-stream 2>/dev/null || echo "  Docker non actif ou non installé"
echo ""

echo "--- Disque /home ---"
df -h /home 2>/dev/null | tail -1
echo ""

echo "--- Projet (isos + platform) ---"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
du -sh "$ROOT/isos" "$ROOT/platform" 2>/dev/null
echo ""

echo "--- Conteneurs lab (si up) ---"
docker compose ps 2>/dev/null | head -15 || true
