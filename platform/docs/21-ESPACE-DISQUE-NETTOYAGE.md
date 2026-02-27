# Espace disque — Nettoyage et migration

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
| Extraire (avant transfert) | `make lab-images-extract-compressed` |
| Git add progressif | `./scripts/git-add-progressive.sh` |
