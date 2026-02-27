# Guide EVE-NG — Une seule référence

**EVE-NG 6.2.0-4 Community**. Ce fichier est le guide unique à suivre de bout en bout.

---

## Connexion à l’interface EVE-NG

| Élément | Valeur |
|---------|--------|
| **URL** | http://127.0.0.1:9080 |
| **Login** | admin |
| **Mot de passe** | eve |

*(SSH root : `ssh -p 9022 root@127.0.0.1` — mot de passe : eve)*

---

## Les 4 commandes principales

### 1. `make lab-setup` — Organisation des images

Organise tout en une seule fois : déplace les fichiers depuis la racine vers `isos/`, extrait les archives, range les `.qcow2` orphelins, vérifie la structure.

```bash
make lab-setup
```

Équivalent à : organiser + extraire + orphelins + vérifier.

---

### 2. `make lab-images-gns3a` — Importer les appliances GNS3

Télécharge les images référencées dans les `.gns3a` de `isos/gns3a/` (avec progression X/Y).

```bash
make lab-images-gns3a
```

Place tes `.gns3a` dans `isos/gns3a/` avant de lancer.

---

### 3. `make lab-images-transfer-eve-ng` — Transférer vers EVE-NG

Transfère toutes les images vers EVE-NG (progression si `rsync` est installé).

**Prérequis :** EVE-NG démarré (`make eve-ng-boot`).  
Si `lab-images` est vide et que `archives-compressed/` existe, extraction automatique avant transfert.

**Éviter les demandes de mot de passe :**

```bash
# Une seule fois
ssh-keygen -t ed25519 -f ~/.ssh/eve-ng -N ""
ssh-copy-id -i ~/.ssh/eve-ng -p 9022 root@127.0.0.1

# Ensuite
EVE_SSH_KEY=~/.ssh/eve-ng make lab-images-transfer-eve-ng
```

---

### 4. `make eve-ng-boot` — Démarrer EVE-NG

Lance la VM EVE-NG (QEMU/KVM). Ferme la fenêtre pour arrêter.

```bash
make eve-ng-boot
```

---

## Workflow complet — Ordre recommandé

```
1. make lab-setup                    # Organiser + extraire + vérifier
2. make lab-images-gns3a             # Importer .gns3a (optionnel)
3. make eve-ng-boot                  # Démarrer EVE-NG (dans une autre fenêtre)
4. EVE_SSH_KEY=~/.ssh/eve-ng make lab-images-transfer-eve-ng   # Transférer
5. Ouvrir http://127.0.0.1:9080      # Connexion : admin / eve
6. Créer un lab, ajouter des nœuds, démarrer, ouvrir la console
7. Utiliser les mots de passe de isos/docs/passwords/PASSWORDS-EVE-NG.md
```

---

## Mots de passe — Où les trouver ?

**Un seul fichier à consulter :**

`isos/docs/passwords/PASSWORDS-EVE-NG.md`

Contient : connexion EVE-NG (admin/eve), identifiants par type d’appareil (Cisco, Juniper, Arista, Linux, etc.).

---

## Environnement virtuel — Configuration

1. Connecte-toi à http://127.0.0.1:9080 (admin / eve).
2. **Add new lab** → nomme ton lab.
3. **Add an object** → **Node** → choisis une image (vIOS, MikroTik, Linux, etc.).
4. **Connect nodes** (câbles).
5. **Start all nodes**.
6. Clic droit sur un nœud → **Open console**.
7. Utilise les identifiants de `PASSWORDS-EVE-NG.md`.

---

## Sauvegarde

```bash
make lab-backup
```

Génère `labcyber-backup-YYYYMMDD-HHMM.tar.gz`. Pour restaurer : `tar xzf labcyber-backup-*.tar.gz -C /destination`.

---

## Compatibilité EVE-NG 6.2.0-4

La structure `/opt/unetlab/addons/` (qemu, dynamips, iol) est compatible avec EVE-NG 6.2.0-4 Community. Les conventions de nommage sont décrites dans [19-EVE-NG-QEMU-NAMING.md](19-EVE-NG-QEMU-NAMING.md).

---

## Récapitulatif des chemins

| Chemin | Rôle |
|--------|------|
| `isos/lab-images/qemu/` | Images QEMU (dossiers EVE-NG) |
| `isos/lab-images/dynamips/` | Cisco IOS (.image) |
| `isos/lab-images/iol/` | Cisco IOL (.bin) |
| `isos/gns3a/` | Fichiers .gns3a |
| `isos/archives/` | Archives à extraire |
| `isos/docs/passwords/` | Mots de passe, PDF, xlsx |
| `isos/docs/passwords/PASSWORDS-EVE-NG.md` | **Identifiants par appareil** |

---

## Récap — À faire après avoir ouvert EVE en web (127.0.0.1:9080)

1. **Clé SSH** (une seule fois) :
   ```bash
   ssh-keygen -t ed25519 -f ~/.ssh/eve-ng -N ""
   ssh-copy-id -i ~/.ssh/eve-ng -p 9022 root@127.0.0.1
   ```
2. **Transférer les images** :
   ```bash
   EVE_SSH_KEY=~/.ssh/eve-ng make lab-images-transfer-eve-ng
   ```
3. Créer un lab → Add nodes → Start → Console → mots de passe dans `isos/docs/passwords/PASSWORDS-EVE-NG.md`

---

## En cas de problème

- **Transfert échoue (mot de passe demandé)** : configure la clé SSH (voir section 3).
- **Images non visibles dans EVE-NG** : Rafraîchir la page web. Si besoin : `ssh -p 9022 root@127.0.0.1 '/opt/unetlab/wrappers/unl_wrapper -a fixpermissions'`.
- **Nommage QEMU** : Voir [19-EVE-NG-QEMU-NAMING.md](19-EVE-NG-QEMU-NAMING.md).
- **Import d’images** : Voir [18-EVE-NG-IMPORT-IMAGES.md](18-EVE-NG-IMPORT-IMAGES.md).
