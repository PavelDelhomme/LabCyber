#!/usr/bin/env python3
"""
Synchronise les images GNS3 depuis le registry (github.com/GNS3/gns3-registry).
Parcourt toutes les appliances, extrait les URLs directes et télécharge dans isos/lab-images/.
Appliances avec URLs vers des stores (Cisco, VyOS, etc.) sont ignorées.
"""

import json
import os
import re
import sys
import urllib.request
from pathlib import Path

REGISTRY_BASE = "https://raw.githubusercontent.com/GNS3/gns3-registry/master"
APPLIANCES_URL = "https://api.github.com/repos/GNS3/gns3-registry/contents/appliances"

# URLs à ignorer (pages de téléchargement manuel, pas de lien direct)
SKIP_PATTERNS = [
    r"learningnetworkstore\.cisco\.com",
    r"support\.vyos\.io",
    r"vyos\.io/.*support",
    r"download\.(cisco|juniper|microsoft)\.com.*(login|account)",
    r"myaccount",
    r"/store",
    r"/support",
    r"gns3\.com/marketplace",
]

# Extensions considérées comme directes
DIRECT_EXT = (".qcow2", ".img", ".image", ".bin", ".vmdk", ".vhd", ".iso", ".tar", ".gz", ".zip")


def is_direct_url(url: str) -> bool:
    """Vérifie si l'URL semble être un lien de téléchargement direct."""
    if not url or not url.startswith(("http://", "https://")):
        return False
    url_lower = url.lower()
    for pat in SKIP_PATTERNS:
        if re.search(pat, url_lower):
            return False
    # Archive.org, raw github, dl., etc.
    if "archive.org" in url_lower or "raw.githubusercontent" in url_lower:
        return True
    if any(url_lower.rstrip("/").endswith(ext) for ext in DIRECT_EXT):
        return True
    # Certains CDN
    if "dl." in url_lower or "download." in url_lower or "releases." in url_lower:
        return True
    return False


def get_ext(url: str, filename: str) -> str:
    """Détermine le sous-dossier (qemu/dynamips/iol)."""
    f = (filename or "").lower()
    u = url.lower()
    if ".image" in f or (".image" in u and "c7200" in f):
        return "dynamips"
    if re.search(r"\.(bin)$", f) and re.search(r"iol|vios|l2|l3", f, re.I):
        return "iol"
    if re.search(r"c7200|c3700|c2691|adventerprise.*\.bin", f, re.I):
        return "dynamips"
    return "qemu"


def fetch_json(url: str) -> dict | list | None:
    req = urllib.request.Request(url, headers={"User-Agent": "LabCyber/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.loads(r.read().decode())
    except Exception as e:
        print(f"  Erreur {url}: {e}", file=sys.stderr)
        return None


def main():
    root = Path(__file__).resolve().parent.parent
    lab_images = Path(os.environ.get("LAB_IMAGES_DIR", str(root / "isos" / "lab-images")))
    lab_images.mkdir(parents=True, exist_ok=True)
    for sub in ("qemu", "dynamips", "iol"):
        (lab_images / sub).mkdir(exist_ok=True)

    print("=== Sync GNS3 Registry ===")
    print("Cible :", lab_images)

    # Lister les appliances
    data = fetch_json(APPLIANCES_URL)
    if not data or not isinstance(data, list):
        print("Impossible de lister les appliances.")
        sys.exit(1)

    files = [f["name"] for f in data if isinstance(f, dict) and f.get("name", "").endswith(".gns3a")]
    print(f"Appliances trouvées : {len(files)}")

    downloaded = 0
    skipped_no_url = 0
    skipped_indirect = 0

    for i, fn in enumerate(files, 1):
        url = f"{REGISTRY_BASE}/appliances/{fn}"
        gns3a = fetch_json(url)
        if not gns3a:
            continue

        name = gns3a.get("name", fn)
        images = gns3a.get("images", [])
        versions = gns3a.get("versions", [])

        for v in versions:
            images.extend(v.get("images", []))

        for img in images:
            if not isinstance(img, dict):
                continue
            filename = img.get("filename")
            url_dl = img.get("url") or img.get("download_url")
            if not url_dl:
                skipped_no_url += 1
                continue
            if not is_direct_url(url_dl):
                skipped_indirect += 1
                continue

            ext = get_ext(url_dl, filename)
            dest_dir = lab_images / ext
            dest_file = dest_dir / (filename or url_dl.split("/")[-1].split("?")[0])

            if dest_file.exists():
                print(f"  [{i}/{len(files)}] OK (présent) {name}: {dest_file.name}")
                downloaded += 1
                continue

            print(f"  [{i}/{len(files)}] Téléchargement {name} → {dest_file.name}")
            try:
                req = urllib.request.Request(url_dl, headers={"User-Agent": "LabCyber/1.0"})
                with urllib.request.urlopen(req, timeout=120) as r:
                    dest_file.write_bytes(r.read())
                print(f"    OK")
                downloaded += 1
            except Exception as e:
                print(f"    ÉCHEC: {e}", file=sys.stderr)

    print()
    print(f"Terminé. Images dans {lab_images}")
    print(f"  Téléchargées/OK: {downloaded}")
    print(f"  Ignorées (pas d'URL): {skipped_no_url}")
    print(f"  Ignorées (store manuel): {skipped_indirect}")


if __name__ == "__main__":
    main()
