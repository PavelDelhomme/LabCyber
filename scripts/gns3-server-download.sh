#!/usr/bin/env bash
# Télécharge les fichiers .gns3a depuis le dépôt GNS3 server
# https://github.com/GNS3/gns3-server/tree/master/gns3server/appliances
# Usage : ./scripts/gns3-server-download.sh [0|all|N]
#   0 ou all = télécharger TOUS les .gns3a
#   N = limiter à N fichiers (ex: 50)
# Exemple : make lab-images-gns3-server

set -e
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GNS3A_DIR="${GNS3A_DIR:-$ROOT/isos/gns3a}"
API_URL="https://api.github.com/repos/GNS3/gns3-server/contents/gns3server/appliances"
RAW_BASE="https://raw.githubusercontent.com/GNS3/gns3-server/master/gns3server/appliances"
MAX="${1:-0}"

mkdir -p "$GNS3A_DIR"
echo "=== Téléchargement .gns3a depuis GNS3 server ==="
echo "Cible : $GNS3A_DIR"
[ "$MAX" = "0" ] || [ "$MAX" = "all" ] && echo "Mode : TOUS les fichiers" || echo "Limite : $MAX fichiers"
echo ""

if ! command -v jq &>/dev/null; then
  echo "jq requis. Installez : sudo apt install jq"
  exit 1
fi

# Liste tous les .gns3a (API retourne max 1000 par page)
list_gns3a() {
  curl -sL "$API_URL" | jq -r '.[] | select(.type=="file" and (.name | endswith(".gns3a"))) | .name'
}

# Appliquer la limite si nécessaire
if [ "$MAX" = "0" ] || [ "$MAX" = "all" ]; then
  LIST=$(list_gns3a)
else
  LIST=$(list_gns3a | head -n "$MAX")
fi

echo "$LIST" | while IFS= read -r name; do
  [ -z "$name" ] && continue
  dest="$GNS3A_DIR/$name"
  if [ -f "$dest" ]; then
    echo "  OK (présent) : $name"
  else
    echo "  Téléchargement : $name"
    if curl -sL -o "$dest" "$RAW_BASE/$name" 2>/dev/null; then
      echo "    OK"
    else
      echo "    Échec"
      rm -f "$dest" 2>/dev/null
    fi
  fi
done

echo ""
echo "Terminé. Fichiers dans : $GNS3A_DIR"
echo "Lance : make lab-images-gns3a pour importer les images"
