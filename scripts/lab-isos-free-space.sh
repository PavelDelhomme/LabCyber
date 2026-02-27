#!/usr/bin/env bash
# Libère l'espace disque dans isos/ (lab-images + archives en doublon)
# Usage : ./scripts/lab-isos-free-space.sh [--aggressive] [--yes]
#
# Mode normal : supprime lab-images/ (211G) car archives-compressed/ contient tout.
#   Le transfert EVE-NG extrait auto depuis archives-compressed si lab-images vide.
#
# --aggressive : supprime aussi archives/ (105G) — garde uniquement archives-compressed.
#   Risque : si archives-compressed est incomplet, tu perds des sources.
#
# --yes : pas de confirmation interactive (pour make / scripts).

set -e
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LAB="$ROOT/isos/lab-images"
ARCHIVES="$ROOT/isos/archives"
COMPRESSED="$ROOT/isos/archives-compressed"
AGGRESSIVE=""
YES=""
for a in "$@"; do
  [ "$a" = "--aggressive" ] && AGGRESSIVE=1
  [ "$a" = "--yes" ] && YES=1
done

echo "=== Libération espace isos/ ==="
echo ""

confirm() {
  if [ -n "$YES" ]; then return 0; fi
  read -p "  $1 (o/N) " r
  [ "$r" = "o" ] || [ "$r" = "O" ]
}

# 1. Supprimer lab-images si archives-compressed existe
if [ -d "$COMPRESSED" ] && [ -n "$(ls -A "$COMPRESSED" 2>/dev/null)" ]; then
  if [ -d "$LAB" ] && [ -n "$(ls -A "$LAB/qemu" 2>/dev/null)" ]; then
    size=$(du -sh "$LAB" 2>/dev/null | cut -f1)
    echo "  lab-images/ : $size (redondant avec archives-compressed)"
    echo "  → Suppression de lab-images/ (extraction auto au transfert EVE-NG)"
    if confirm "Supprimer lab-images/ ?"; then
      rm -rf "$LAB"/qemu/* "$LAB"/dynamips/* "$LAB"/iol/* 2>/dev/null || true
      mkdir -p "$LAB"/{qemu,dynamips,iol}
      echo "  ✓ lab-images vidé. Structure conservée."
    fi
  else
    echo "  lab-images/ déjà vide ou absent."
  fi
else
  echo "  archives-compressed/ vide ou absent — on ne touche pas à lab-images."
fi

echo ""

# 2. Option aggressive : supprimer archives/
if [ -n "$AGGRESSIVE" ]; then
  if [ -d "$ARCHIVES" ] && [ -n "$(ls -A "$ARCHIVES" 2>/dev/null)" ]; then
    size=$(du -sh "$ARCHIVES" 2>/dev/null | cut -f1)
    echo "  archives/ : $size (.tgz sources)"
    echo "  → ATTENTION : archives-compressed doit contenir tout pour pouvoir ré-extraire."
    if confirm "Supprimer archives/ ?"; then
      rm -rf "$ARCHIVES"/*
      echo "  ✓ archives/ vidé."
    fi
  fi
else
  echo "  Pour supprimer aussi archives/ (105G) : ./scripts/lab-isos-free-space.sh --aggressive"
fi

echo ""
echo "=== Espace après ==="
du -sh "$ROOT/isos"/* 2>/dev/null || true
echo ""
echo "Pour transférer vers EVE-NG : make lab-images-transfer-eve-ng (extraction auto si lab-images vide)"
