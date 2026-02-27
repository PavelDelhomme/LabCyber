#!/usr/bin/env bash
# Importe un fichier .gns3a (GNS3 appliance) dans isos/lab-images/
# Usage : ./scripts/gns3a-import.sh [fichier.gns3a] [répertoire cible]
# Beaucoup d'URLs pointent vers des pages d'inscription (Brocade my.brocade.com, etc.) → timeout + échec rapide.

set +e
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LAB_IMAGES="${2:-$ROOT/isos/lab-images}"
GNS3A="${1:-$HOME/Téléchargements/cisco-7200.gns3a}"
ok=0 fail=0 skip=0
# Timeout : 15s connexion, 120s max par fichier (évite blocage sur portails Brocade, etc.)
WGET_OPTS="--connect-timeout=15 --timeout=120 --tries=1 -q"
CURL_OPTS="--connect-timeout 15 --max-time 120 -sL"

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

# Appliances Docker (aaa, etc.) n'ont pas d'images à télécharger
if jq -e '.docker' "$GNS3A" &>/dev/null && ! jq -e '.images | length > 0' "$GNS3A" &>/dev/null; then
  echo "  → Appliance Docker (aucune image à télécharger)"
  exit 0
fi

total_items=0
while IFS='|' read -r filename url version; do
  [ -z "$filename" ] && continue
  total_items=$((total_items + 1))
  echo "  - $filename"
  if [ -n "$url" ] && [ "$url" != "null" ]; then
    DIR="$LAB_IMAGES/qemu"
    [[ "$filename" =~ \.(image)$ ]] && DIR="$LAB_IMAGES/dynamips"
    [[ "$filename" =~ \.(bin)$ ]] && [[ "$filename" =~ [iI][oO][lL]|vios ]] && DIR="$LAB_IMAGES/iol"
    [[ "$filename" =~ \.(bin)$ ]] && [[ "$filename" =~ c7200|c3700|c2691|adventerprise ]] && DIR="$LAB_IMAGES/dynamips"
    mkdir -p "$DIR"
    if [ -f "$DIR/$filename" ]; then
      echo "    ✓ Déjà présent"; skip=$((skip+1))
    elif wget $WGET_OPTS -O "$DIR/$filename" "$url" 2>/dev/null || curl $CURL_OPTS -o "$DIR/$filename" "$url" 2>/dev/null; then
      [ -s "$DIR/$filename" ] && { echo "    ✓ OK"; ok=$((ok+1)); } || { echo "    ✗ Échec (fichier vide)"; rm -f "$DIR/$filename"; fail=$((fail+1)); }
    else
      echo "    ✗ Échec (timeout/page d'inscription?)"; fail=$((fail+1))
    fi
  else
    echo "    (pas d'URL)"; skip=$((skip+1))
  fi
done < <(jq -r '
  (.images[]? | "\(.filename)|\(.url // .direct_download_url // .download_url // "")|root"),
  (.versions[]? | .version as $v | .images[]? | "\(.filename)|\(.url // .direct_download_url // .download_url // "")|\($v)")
' "$GNS3A" 2>/dev/null)

if [ $((ok + fail + skip)) -eq 0 ] && [ $total_items -eq 0 ]; then
  echo "  → Aucune image définie (appliance vide ou format non supporté)"
elif [ $((ok + fail + skip)) -eq 0 ]; then
  echo "  → OK: 0 | Échec: 0 | Skip: 0 (erreur parsing?)"
else
  echo "  → OK: $ok | Échec: $fail | Déjà/skip: $skip"
fi
