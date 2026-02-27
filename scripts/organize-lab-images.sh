#!/usr/bin/env bash
# Organise les fichiers d'images à la racine du projet vers isos/
# Renomme et place correctement selon la convention EVE-NG
# Usage : ./scripts/organize-lab-images.sh [--dry-run]
# Note : Ne pas utiliser set -e pour ne pas quitter sur un simple échec d'extraction

set +e
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LAB_IMAGES="${LAB_IMAGES_DIR:-$ROOT/isos/lab-images}"
GNS3A_DIR="${ROOT}/isos/gns3a"
DOCS_DIR="${ROOT}/isos/docs"
ARCHIVES_DIR="${ROOT}/isos/archives"
DRY_RUN="${1:-}"

mkdir -p "$LAB_IMAGES"/{qemu,dynamips,iol}
mkdir -p "$GNS3A_DIR"
mkdir -p "$DOCS_DIR"
mkdir -p "$ARCHIVES_DIR"

run() {
  if [ "$DRY_RUN" = "--dry-run" ]; then
    echo "  [DRY-RUN] $*"
  else
    "$@"
  fi
}

mv_safe() {
  local src="$1" dst="$2"
  [ -f "$src" ] || [ -d "$src" ] || return 0
  if [ -e "$dst" ]; then
    echo "  ⚠ Déjà présent, on garde : $dst"
    return 0
  fi
  run mkdir -p "$(dirname "$dst")"
  run mv "$src" "$dst"
  echo "  ✓ $src → $dst"
}

extract_tgz() {
  local archive="$1" dest="$2" name="$3"
  [ -f "$archive" ] || return 1
  if [ -d "$dest/$name" ]; then
    echo "  ✓ Déjà extrait : $name"
    run mv "$archive" "$ARCHIVES_DIR/" 2>/dev/null || true
    return 0
  fi
  echo "  Extraction : $(basename "$archive") → $dest/"
  if [ "$DRY_RUN" != "--dry-run" ]; then
    if tar -xzf "$archive" -C "$dest" 2>/dev/null; then
      run mv "$archive" "$ARCHIVES_DIR/" 2>/dev/null || true
      return 0
    fi
    echo "  ⚠ Échec extraction, déplacé vers archives/"
    run mv "$archive" "$ARCHIVES_DIR/" 2>/dev/null || true
  fi
  return 1
}

echo "=== Organisation des images lab ==="
echo ""

# --- Dynamips (Cisco IOS .image) ---
echo "--- Dynamips ---"
for f in "$ROOT"/c1710*.image "$ROOT"/c3725*.image "$ROOT"/c7200*.image "$ROOT"/c2691*.image "$ROOT"/c3745*.image; do
  [ -f "$f" ] && mv_safe "$f" "$LAB_IMAGES/dynamips/$(basename "$f")"
done

# --- Archives .tgz / .tar.gz (QEMU) : extraire vers qemu/ ---
echo ""
echo "--- Archives QEMU (.tgz à la racine) ---"
for archive in "$ROOT"/*.tgz "$ROOT"/*.tar.gz; do
  [ -f "$archive" ] || continue
  base=$(basename "$archive")
  name="${base%.tgz}"
  name="${name%.tar.gz}"
  # Nettoyer noms avec (1) etc.
  name=$(echo "$name" | sed 's/ (1)$//')
  extract_tgz "$archive" "$LAB_IMAGES/qemu" "$name" || true
done

# Renommer vtmgmt si le tgz avait -001/-002 dans le nom
[ -d "$LAB_IMAGES/qemu/vtmgmt-20.6.2" ] && [ ! -d "$LAB_IMAGES/qemu/vtmgmt-20.6.2-001" ] && run mv "$LAB_IMAGES/qemu/vtmgmt-20.6.2" "$LAB_IMAGES/qemu/vtmgmt-20.6.2-001" 2>/dev/null && echo "  ✓ Renommé vtmgmt-20.6.2 → vtmgmt-20.6.2-001"
[ -d "$LAB_IMAGES/qemu/vtmgmt-20.7.1" ] && [ ! -d "$LAB_IMAGES/qemu/vtmgmt-20.7.1-002" ] && run mv "$LAB_IMAGES/qemu/vtmgmt-20.7.1" "$LAB_IMAGES/qemu/vtmgmt-20.7.1-002" 2>/dev/null && echo "  ✓ Renommé vtmgmt-20.7.1 → vtmgmt-20.7.1-002"

# --- Fichiers .qcow2 isolés à la racine ---
echo ""
echo "--- QEMU (.qcow2 à la racine) ---"
for f in "$ROOT"/FFW_VM64_KVM*.qcow2; do
  [ -f "$f" ] || continue
  if [[ "$f" =~ v7\.4\.2 ]]; then dir="$LAB_IMAGES/qemu/fortinet-7.4.2"
  elif [[ "$f" =~ v7\.0\.13 ]]; then dir="$LAB_IMAGES/qemu/fortinet-7.0.13"
  else continue; fi
  [ -d "$dir" ] || run mkdir -p "$dir"
  [ -f "$dir/virtioa.qcow2" ] || { run mv "$f" "$dir/virtioa.qcow2"; echo "  ✓ $(basename "$f") → $dir/virtioa.qcow2"; }
done

for f in "$ROOT"/cat9kv*.qcow2; do
  [ -f "$f" ] || continue
  dir="$LAB_IMAGES/qemu/cat9kv-17.10.01"
  [ -d "$dir" ] || run mkdir -p "$dir"
  [ -f "$dir/virtioa.qcow2" ] || { run mv "$f" "$dir/virtioa.qcow2"; echo "  ✓ $(basename "$f") → $dir/virtioa.qcow2"; }
done

[ -f "$ROOT/virtioa.qcow2" ] && run mkdir -p "$DOCS_DIR/orphelins" && run mv "$ROOT/virtioa.qcow2" "$DOCS_DIR/orphelins/" 2>/dev/null && echo "  ✓ virtioa.qcow2 (orphelin) → isos/docs/orphelins/"

# --- Palo Alto (format peut varier : sous-dossier ou fichiers directs) ---
if [ -f "$ROOT/paloalto-8.0.0.tar.gz" ]; then
  dest="$LAB_IMAGES/qemu/paloalto-8.0.0"
  if [ ! -d "$dest" ]; then
    run mkdir -p "$dest"
    if tar -xzf "$ROOT/paloalto-8.0.0.tar.gz" -C "$dest" 2>/dev/null; then
      # Flatten si sous-dossier (ex: paloalto-8.0.0/pa-vm-8.0.0/)
      for sub in "$dest"/*/; do [ -d "$sub" ] && mv "$sub"/* "$dest/" 2>/dev/null; rmdir "$sub" 2>/dev/null; done
      run mv "$ROOT/paloalto-8.0.0.tar.gz" "$ARCHIVES_DIR/" 2>/dev/null || true
      echo "  ✓ paloalto-8.0.0 extrait"
    else
      run mv "$ROOT/paloalto-8.0.0.tar.gz" "$ARCHIVES_DIR/" 2>/dev/null || true
      echo "  ⚠ paloalto-8.0.0 : format non reconnu, archivé dans isos/archives/"
    fi
  fi
fi

# --- Check Point (ISO) ---
echo ""
echo "--- Check Point (ISO) ---"
mkdir -p "$DOCS_DIR/checkpoint"
for f in "$ROOT"/Check_Point*.iso; do
  [ -f "$f" ] && mv_safe "$f" "$DOCS_DIR/checkpoint/$(basename "$f")"
done

# --- IOL / bin.zip ---
[ -f "$ROOT/bin.zip" ] && run unzip -o -q "$ROOT/bin.zip" -d "$LAB_IMAGES/iol/" 2>/dev/null && run mv "$ROOT/bin.zip" "$ARCHIVES_DIR/" && echo "  ✓ bin.zip extrait vers iol/"

# --- Fichiers .gns3a à la racine ---
echo ""
echo "--- GNS3 appliances (.gns3a) ---"
for f in "$ROOT"/*.gns3a; do
  [ -f "$f" ] && mv_safe "$f" "$GNS3A_DIR/$(basename "$f")"
done

# --- Documents (PDF, xlsx, txt mots de passe) ---
echo ""
echo "--- Documents (passwords, EVE-NG) ---"
mkdir -p "$DOCS_DIR/passwords"
for f in "$ROOT"/*.pdf "$ROOT"/*.xlsx "$ROOT"/"Viptela username password"*.txt "$ROOT"/"Copy of Viptela username password.txt" "$ROOT"/*passwords*.xlsx "$ROOT"/"Logins and Passwords"*.xlsx "$ROOT"/"Passwords - QEMU.xlsx"; do
  [ -f "$f" ] || continue
  case "$(basename "$f")" in
    test-*.txt|*.env) ;;
    EVE-NG*|Logins*|Passwords*|passwords_eve*|Viptela*|"Copy of Viptela"*)
      mv_safe "$f" "$DOCS_DIR/passwords/$(basename "$f")"
      ;;
  esac
done

[ -f "$ROOT/serialFile.viptela" ] && mv_safe "$ROOT/serialFile.viptela" "$DOCS_DIR/passwords/serialFile.viptela"

echo ""
echo "=== Terminé ==="
echo "Images  : $LAB_IMAGES"
echo "GNS3a   : $GNS3A_DIR"
echo "Docs    : $DOCS_DIR"
echo "Archives: $ARCHIVES_DIR"
echo ""
echo "Suivant : make lab-images-organize-orphans  # organiser qcow2 orphelins dans qemu/"
echo "         make lab-images-extract            # extraire isos/archives/"
echo "         make lab-images-check              # vérifier"