# Espace disque — Nettoyage et migration

---

## 0. Doublon archives-compressed (qemu) — ~95G en trop

Si tu as **à la fois** `lab-images-qemu.tar.zst` (95G) et un dossier `qemu/` avec des `*.tar.zst` par image (92G), c’est le **même contenu** stocké deux fois. Conserve uniquement le format par-image (`qemu/*.tar.zst`) — utile pour l’extraction ciblée et le transfert à la volée.

```bash
make lab-archives-dedup   # libère ~95G
```

---

## 1. Cache yay (~160G) — Problème des dossiers download-*

`yay -Scc` échoue sur `/var/cache/pacman/pkg/download-*` car ce sont des dossiers de verrouillage (téléchargements en cours ou interrompus). **Solution rapide :**

```bash
# 1. Ferme tous les pacman/yay (aucun en cours)
pgrep -a pacman
pgrep -a yay

# 2. Supprime les dossiers bloqués (sudo requis)
sudo rm -rf /var/cache/pacman/pkg/download-*

# 3. Relance le nettoyage
yay -Scc
```

**Cache yay (AUR) dans ~/.cache/yay :**

```bash
# Vidage complet (~160G)
rm -rf ~/.cache/yay/*
```

**Script interactif :** `./scripts/cache-yay-clean.sh`

---

## 2. PortProton → /data (libère ~142G)

Les jeux sont soit dans `/data/jeux`, soit dans `~/PortProton/data/prefixes/`. Les raccourcis `.desktop` pointent vers `/home/pactivisme/PortProton/...`. Avec un **lien symbolique**, le chemin reste valide :

```bash
./scripts/move-portproton-to-data.sh
```

Cela fait : `mv ~/PortProton /data/PortProton` puis `ln -s /data/PortProton ~/PortProton`. Les raccourcis continuent de fonctionner.

---

## 3. Lab images (isos) — Options

### Option A : Déplacer vers /data (simple, ~308G libérés)

```bash
./scripts/move-isos-to-data.sh
```

Le Makefile continue de fonctionner via le lien symbolique.

### Option B : Compression par image (organisation préservée)

Compresse `lab-images/` en archives ultra-compressées. Libère beaucoup d’espace, extraction à la demande avant transfert EVE.

```bash
make lab-images-compress
# Extraction d'une image : make lab-images-extract-compressed IMAGE=veos-4.23
# Transfert (extrait auto si vide) : make lab-images-transfer-eve-ng
```

### Option C : Compression + à la demande (avancé)

Idée : stocker les images en `.qcow2.xz` ou `.qcow2.zst`, les décompresser **uniquement lors du transfert** vers EVE.

- **Stockage** : `isos/compressed/veos-4.23/virtioa.qcow2.xz`
- **Transfert** : décompression à la volée vers EVE

Le script `transfer-to-eve-ng.sh` pourrait détecter les `.xz`/`.zst` et faire :
```bash
xz -dc image.qcow2.xz | ssh ... "cat > /opt/.../virtioa.qcow2"
```

**Compression** : les `.qcow2` sont souvent peu compressibles (déjà sparse). Les gains sont limités (~10–30 %). Les `.tgz` sont déjà compressés.

### Option D : Pas de lab-images local — extraction à la demande

Garder uniquement les archives compressées, extraire seulement au moment du transfert. Plus lent, mais économise la place de `lab-images/` (~144G).

### Option E : Libérer isos/ sans tout déplacer (recommandé si archives-compressed OK)

Si `archives-compressed/` contient déjà tout, on peut supprimer `lab-images/` (~211G) et éventuellement `archives/` (~105G). Le transfert EVE-NG extrait automatiquement depuis `archives-compressed` si `lab-images` est vide.

```bash
make lab-isos-free-space          # Mode normal : vide lab-images
./scripts/lab-isos-free-space.sh --aggressive   # Vide aussi archives/
```

**Avant d'exécuter** : vérifier que `archives-compressed/` est complet (`ncdu isos/archives-compressed`).

### Option F : Supprimer le doublon qemu (~95G)

Si tu as à la fois `lab-images-qemu.tar.zst` (95G) **et** `qemu/*.tar.zst` (92G), c’est le **même contenu** en double. Garde uniquement le format par-image (extraction ciblée, transfert à la volée).

```bash
make lab-archives-dedup   # Demande confirmation
./scripts/lab-archives-remove-duplicate-monolith.sh --yes   # Sans confirmation
```

### Option G : Stockage externe sécurisé (cloud, NAS)

Déplacer `archives-compressed/` hors de la machine, accessible à la demande :

| Solution | Usage | Chiffrement |
|----------|-------|--------------|
| **Nextcloud** | Sync dossier, montage WebDAV | TLS + chiffrement optionnel |
| **Backblaze B2** | `rclone sync` ou `b2 sync` | TLS + option client-side |
| **rsync.net** | `rsync` classique (ZFS snapshots) | SSH |
| **NAS (Synology, etc.)** | Partage NFS/SMB, rsync | Selon config |
| **Restic + B2/S3** | Backup dédupliqué, restauration ciblée | Chiffrement AES-256 |

**Workflow typique** : `archives-compressed/` sur cloud → téléchargement local (ou flux direct) au moment du transfert EVE.

```bash
# Exemple rclone (Backblaze B2)
rclone copy isos/archives-compressed/ b2:labcyber-archives/

# Restaurer un sous-dossier à la demande
rclone copy b2:labcyber-archives/qemu/veos-4.23.tar.zst isos/archives-compressed/qemu/
```

### Option H : Méthode complète — Transfert à la volée (sans disque local)

**Workflow sans lab-images local** : tout reste compressé, décompression directe vers EVE par flux.

1. **Garder uniquement** `archives-compressed/` (qemu/*.tar.zst, lab-images-dynamips.tar.zst, lab-images-iol.tar.zst)
2. **Vider** `lab-images/` : `./scripts/lab-isos-free-space.sh --yes`
3. **Transfert direct** (pas d’extraction locale) :

```bash
# Prérequis : EVE-NG démarré, clé SSH
make eve-ng-boot
ssh-copy-id -i ~/.ssh/eve-ng -p 9022 root@127.0.0.1

# Transfert à la volée (zstd -dc | ssh "tar -x")
EVE_SSH_KEY=~/.ssh/eve-ng make lab-images-transfer-eve-ng-stream
```

**Une seule image** : `IMAGE=veos-4.23 EVE_SSH_KEY=~/.ssh/eve-ng make lab-images-transfer-eve-ng-stream`

**Vérifier les images dans EVE** : `make eve-ng-verify`

---

## 4. Documents/Cyber = LabCyber

Tout le projet LabCyber est sous `~/Documents/Cyber/LabCyber`. La grosse part (308G) vient de `isos/`. Déplacer uniquement `isos/` vers `/data` est suffisant.

---

## Commandes rapides

| Action | Commande |
|--------|----------|
| Rapport espace | `make disk-report` |
| Nettoyer cache yay | `./scripts/cache-yay-clean.sh` |
| Fix pacman download-* | `sudo rm -rf /var/cache/pacman/pkg/download-*` |
| Déplacer isos | `./scripts/move-isos-to-data.sh` |
| Déplacer PortProton | `./scripts/move-portproton-to-data.sh` |
| Compresser lab-images | `make lab-images-compress` |
| **Supprimer doublon qemu** | `make lab-archives-dedup` (~95G) |
| Extraire (avant transfert) | `make lab-images-extract-compressed` |
| **Transfert à la volée** | `EVE_SSH_KEY=~/.ssh/eve-ng make lab-images-transfer-eve-ng-stream` |
| Libérer isos/ (lab-images) | `make lab-isos-free-space` |
| Libérer isos/ + archives | `./scripts/lab-isos-free-space.sh --aggressive` |
| Vérifier accès EVE | `make eve-ng-verify` |
| Git add progressif | `./scripts/git-add-progressive.sh` |
