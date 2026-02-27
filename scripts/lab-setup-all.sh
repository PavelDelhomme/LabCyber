#!/usr/bin/env bash
# Tout-en-un : organise, extrait, structure et vérifie les images lab
# Usage : make lab-setup

set +e
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "=============================================="
echo "  LAB SETUP — Organisation complète des images"
echo "=============================================="
echo ""

echo "[1/4] Organisation (racine → isos/)..."
"$ROOT/scripts/organize-lab-images.sh" || true

echo ""
echo "[2/4] Extraction des archives (isos/archives/)..."
"$ROOT/scripts/extract-lab-archives.sh" || true

echo ""
echo "[3/4] Organisation des qcow2 orphelins..."
"$ROOT/scripts/organize-qemu-orphans.sh" || true

echo ""
echo "[4/4] Vérification finale..."
"$ROOT/scripts/lab-images-check.sh" || true

echo ""
echo "=============================================="
echo "  ✓ lab-setup terminé"
echo "=============================================="
echo ""
echo "Étapes suivantes (voir platform/docs/20-EVE-NG-WORKFLOW-TEST.md) :"
echo "  1. make lab-images-gns3a"
echo "  2. make eve-ng-boot"
echo "  3. EVE_SSH_KEY=~/.ssh/eve-ng make lab-images-transfer-eve-ng"
echo "  4. http://127.0.0.1:9080 — admin / eve | Mots de passe : isos/docs/passwords/PASSWORDS-EVE-NG.md"
echo ""
