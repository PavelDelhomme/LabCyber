#!/usr/bin/env bash
# Importe un fichier .gns3a (GNS3 appliance) dans isos/lab-images/
# Usage : ./scripts/gns3a-import.sh [fichier.gns3a] [répertoire cible]
# Beaucoup d'URLs dans les .gns3a pointent vers des pages d'inscription (Alcatel, Aruba, Brocade...), pas des liens directs → échecs normaux.

set +e
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LAB_IMAGES="${2:-$ROOT/isos/lab-images}"
GNS3A="${1:-$HOME/Téléchargements/cisco-7200.gns3a}"
ok=0 fail=0 skip=0

if [ ! -f "$GNS3A" ]; then
  echo "Fichier introuvable : $GNS3A"
  exit 1
fi

mkdir -p "$LAB_IMAGES"/{qemu,dynamips,iol}
if ! command -v jq &>/dev/null; then
  echo "jq requis. Installez : sudo apt install jq"
  exit 1
fi

NAME=$(jq -r '.name // "unknown"' "$GNS3A")
echo "Appliance : $NAME"

while IFS='|' read -r filename url version; do
  [ -z "$filename" ] && continue
  echo "  - $filename"
  if [ -n "$url" ] && [ "$url" != "null" ]; then
    DIR="$LAB_IMAGES/qemu"
    [[ "$filename" =~ \.(image)$ ]] && DIR="$LAB_IMAGES/dynamips"
    [[ "$filename" =~ \.(bin)$ ]] && [[ "$filename" =~ [iI][oO][lL]|vios ]] && DIR="$LAB_IMAGES/iol"
    [[ "$filename" =~ \.(bin)$ ]] && [[ "$filename" =~ c7200|c3700|c2691|adventerprise ]] && DIR="$LAB_IMAGES/dynamips"
    mkdir -p "$DIR"
    if [ -f "$DIR/$filename" ]; then
      echo "    ✓ Déjà présent"; skip=$((skip+1))
    elif wget -q --show-progress -O "$DIR/$filename" "$url" 2>/dev/null || curl -sL -o "$DIR/$filename" "$url" 2>/dev/null; then
      [ -s "$DIR/$filename" ] && { echo "    ✓ OK"; ok=$((ok+1)); } || { echo "    ✗ Échec (fichier vide)"; rm -f "$DIR/$filename"; fail=$((fail+1)); }
    else
      echo "    ✗ Échec (URL = page d'inscription?)"; fail=$((fail+1))
    fi
  else
    echo "    (pas d'URL)"; skip=$((skip+1))
  fi
done < <(jq -r '
  (.images[]? | "\(.filename)|\(.url // .direct_download_url // .download_url // "")|root"),
  (.versions[]? | .version as $v | .images[]? | "\(.filename)|\(.url // .direct_download_url // .download_url // "")|\($v)")
' "$GNS3A" 2>/dev/null)

echo "  → OK: $ok | Échec: $fail | Déjà/skip: $skip"
