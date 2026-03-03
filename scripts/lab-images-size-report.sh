#!/usr/bin/env bash
# Rapport détaillé de la taille des images du lab (isos/) et recommandations pour réduire.
# Usage : ./scripts/lab-images-size-report.sh
# Make  : make disk-report-images

set -e
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ISOS="$ROOT/isos"

echo "=============================================="
echo "  TAILLE DES IMAGES DU LAB (isos/)"
echo "=============================================="
echo ""

if [ ! -d "$ISOS" ] && [ ! -L "$ISOS" ]; then
  echo "  Dossier isos/ absent. Pour initialiser : make lab-init"
  echo "  (ou créez un lien : ln -s /data/LabCyber-isos ./isos)"
  exit 0
fi

# Détecter si isos est un lien symbolique (déjà déplacé)
ISOS_MOVED=""
if [ -L "$ISOS" ]; then
  ISOS_MOVED=1
  target=$(readlink -f "$ISOS" 2>/dev/null || readlink "$ISOS")
  echo "  isos/ → lien symbolique vers : $target"
  echo ""
fi

echo "--- Total projet (racine) ---"
du -sh "$ROOT" 2>/dev/null || true
if [ -n "$ISOS_MOVED" ]; then
  echo "  (isos/ = lien symbolique, contenu sur autre disque)"
fi
echo ""

echo "--- Détail isos/ ---"
du -sh "$ISOS" 2>/dev/null || true
for d in "$ISOS"/*; do
  [ -e "$d" ] || continue
  s=$(du -sh "$d" 2>/dev/null | cut -f1)
  name=$(basename "$d")
  printf "  %-30s %s\n" "$name" "$s"
done
echo ""

# Fichiers .image à la racine (hors isos)
echo "--- Fichiers images à la racine (hors isos) ---"
found=0
for f in "$ROOT"/*.image "$ROOT"/*.qcow2 "$ROOT"/*.iso; do
  [ -e "$f" ] || continue
  found=1
  s=$(du -sh "$f" 2>/dev/null | cut -f1)
  printf "  %s : %s\n" "$(basename "$f")" "$s"
done
[ "${found:-0}" -eq 0 ] && echo "  (aucun)"
echo ""

# lab-images vide ou peu rempli ?
LAB_IMAGES="$ISOS/lab-images"
LAB_EMPTY=""
if [ -d "$LAB_IMAGES" ]; then
  lab_size=$(du -s "$LAB_IMAGES" 2>/dev/null | cut -f1)
  [ "${lab_size:-0}" -lt 100000 ] 2>/dev/null && LAB_EMPTY=1  # < ~100M = vide ou quasi
fi
COMPRESSED="$ISOS/archives-compressed"
HAS_COMPRESSED=""
[ -d "$COMPRESSED" ] && [ -n "$(ls -A "$COMPRESSED" 2>/dev/null)" ] && HAS_COMPRESSED=1

echo "--- Doublons potentiels (archives-compressed) ---"
if [ -f "$COMPRESSED/lab-images-qemu.tar.zst" ] && [ -d "$COMPRESSED/qemu" ]; then
  mono=$(du -sh "$COMPRESSED/lab-images-qemu.tar.zst" 2>/dev/null | cut -f1)
  perimg=$(du -sh "$COMPRESSED/qemu" 2>/dev/null | cut -f1)
  echo "  lab-images-qemu.tar.zst (monolithe) : $mono"
  echo "  qemu/*.tar.zst (par image)          : $perimg"
  echo "  → Même contenu. Supprimer le monolithe : make lab-archives-dedup  (~95G libérés)"
else
  echo "  Pas de doublon monolithe/qemu détecté."
fi
echo ""

echo "=============================================="
echo "  RÉDUIRE LA TAILLE — ACTIONS RECOMMANDÉES"
echo "=============================================="
echo ""

if [ -f "$COMPRESSED/lab-images-qemu.tar.zst" ] && [ -d "$COMPRESSED/qemu" ]; then
  echo "  1. Supprimer le doublon qemu : make lab-archives-dedup  (~95G)"
  echo ""
fi

echo "  2. Ne pas versionner les images (isos/ dans .gitignore)."
echo ""

if [ -z "$ISOS_MOVED" ]; then
  echo "  3. Déplacer isos/ hors du projet : ./scripts/move-isos-to-data.sh"
  echo "     → Libère beaucoup d'espace sur le disque du projet."
  echo ""
fi

if [ -n "$HAS_COMPRESSED" ] && [ -z "$LAB_EMPTY" ]; then
  echo "  4. Vider lab-images/ (extraction à la volée au transfert) :"
  echo "     make lab-isos-free-space"
  echo "     → Puis transfert EVE-NG : make lab-images-transfer-eve-ng-stream"
  echo ""
elif [ -n "$HAS_COMPRESSED" ] && [ -n "$LAB_EMPTY" ]; then
  echo "  5. lab-images/ est vide — OK pour transfert à la volée."
  echo "     make lab-images-transfer-eve-ng-stream  (EVE-NG démarré, clé SSH configurée)"
  echo ""
fi

echo "  6. Init / structure après clone ou nettoyage :"
echo "     make lab-init   # crée lab-images/{qemu,dynamips,iol}, gns3a si besoin"
echo ""
echo "  Voir : platform/docs/21-ESPACE-DISQUE-NETTOYAGE.md"
echo ""
