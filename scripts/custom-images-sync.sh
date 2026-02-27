#!/usr/bin/env bash
# Synchronise les images listées dans customImages.json vers isos/lab-images/
# Usage : ./scripts/custom-images-sync.sh [chemin customImages.json]
# Exemple : make lab-images-sync

set -e
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LAB_IMAGES="${LAB_IMAGES_DIR:-$ROOT/isos/lab-images}"
CUSTOM_JSON="${1:-}"

# Chercher customImages.json
if [ -n "$CUSTOM_JSON" ] && [ -f "$CUSTOM_JSON" ]; then
  :
elif [ -f "$ROOT/platform/data/customImages.json" ]; then
  CUSTOM_JSON="$ROOT/platform/data/customImages.json"
elif [ -f "$ROOT/platform/public/data/customImages.json" ]; then
  CUSTOM_JSON="$ROOT/platform/public/data/customImages.json"
elif [ -f "$ROOT/isos/lab-images/customImages.json" ]; then
  CUSTOM_JSON="$ROOT/isos/lab-images/customImages.json"
else
  echo "Aucun fichier customImages.json trouvé."
  echo "Emplacements : platform/data/, platform/public/data/, isos/lab-images/"
  echo "Ou exportez depuis l'interface (Simulateur lab → Ajouter image → Exporter)."
  exit 1
fi

mkdir -p "$LAB_IMAGES"/{qemu,dynamips,iol}
echo "=== Sync images personnalisées ==="
echo "Source : $CUSTOM_JSON"
echo "Cible  : $LAB_IMAGES"
echo ""

if ! command -v jq &>/dev/null; then
  echo "jq requis. Installez : sudo apt install jq"
  exit 1
fi

count=0
jq -r '.images[]? | "\(.url)|\(.type // "qemu")|\(.filename // .name // "")|\(.name // .filename // "image")"' "$CUSTOM_JSON" 2>/dev/null | while IFS='|' read -r url type filename name; do
  [ -z "$url" ] || [ "$url" = "null" ] && continue
  name="${name//[$'\r']}"
  filename="${filename//[$'\r']}"
  type="${type//[$'\r']}"
  [ -z "$type" ] && type="qemu"

  DIR="$LAB_IMAGES/$type"
  mkdir -p "$DIR"

  # Nom de fichier : celui donné ou extrait de l'URL
  if [ -n "$filename" ] && [ "$filename" != "null" ]; then
    dest="$DIR/$filename"
  else
    base=$(basename "$url" | sed 's/\?.*//')
    dest="$DIR/$base"
  fi

  if [ -f "$dest" ]; then
    echo "  OK (déjà présent) : $(basename "$dest")"
  else
    echo "  Téléchargement : $name → $(basename "$dest")"
    if wget -q --show-progress -O "$dest" "$url" 2>/dev/null; then
      echo "    OK"
    elif curl -sL -o "$dest" "$url" 2>/dev/null; then
      echo "    OK"
    else
      echo "    ÉCHEC"
      rm -f "$dest" 2>/dev/null
    fi
  fi
  count=$((count + 1))
done

echo ""
echo "Terminé. Images dans : $LAB_IMAGES"
