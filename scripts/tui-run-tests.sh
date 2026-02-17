#!/usr/bin/env bash
# Lance les tests et affiche dans le pager (pour TUI)
set -e
cd "$(dirname "$0")/.."
tmp=$(mktemp)
./scripts/run-tests.sh 2>&1 | tee "$tmp"
echo ""
read -p "Appuyez sur Entrée pour continuer..." x
rm -f "$tmp"
