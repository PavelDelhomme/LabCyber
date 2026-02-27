# Guide EVE-NG — Une seule référence

**EVE-NG 6.2.0-4 Community**. Ce fichier est le guide unique à suivre de bout en bout.

---

## Connexion à l’interface EVE-NG

| Élément | Valeur |
|---------|--------|
| **URL** | http://127.0.0.1:9080 ou https://eve-ng.lab:4443 (via LabCyber) |
| **Login** | admin |
| **Mot de passe** | eve |

Pour intégration dans LabCyber (éviter CORS / erreur 500) : ajoute `127.0.0.1 eve-ng.lab` dans `/etc/hosts`, puis utilise l’iframe depuis la page simulateur (eve-ng.lab sera proxifié par la gateway).

*(SSH root : `ssh -p 9022 root@127.0.0.1` — mot de passe : eve)*

**Mode HTTPS-Only** : utilise **https://127.0.0.1:4443** (port **4443**, pas 8443).

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

## Vérifier les images importées (étape par étape)

Après `make lab-images-transfer-eve-ng` :

1. **Dans EVE** : http://127.0.0.1:9080 → Add new lab → Add an object → **Node**
2. **Liste des images** : vérifier que vIOS, MikroTik, Linux, etc. apparaissent
3. **Tester un nœud** : ajouter un Linux (ex. linux-netem) → Start all nodes → Open console
4. **Depuis l'hôte** : `make eve-ng-verify` affiche le nombre d'images QEMU dans EVE

Si images absentes : `ssh -p 9022 root@127.0.0.1 '/opt/unetlab/wrappers/unl_wrapper -a fixpermissions'` puis F5.

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

### Erreur 500 /api/auth — "Why did API doesn't respond" (disque plein ou base de données)

**Causes possibles** :
- Disque EVE-NG saturé (ex. 99 %) → Apache/PHP ne peut plus écrire
- **Base de données corrompue** → message `"Database error (90003)"` dans la réponse de l’API

**Méthode A — Automatique** : `sudo pacman -S sshpass` puis `make eve-ng-fix-api`  
(le script nettoie le disque, fait **restoredb**, redémarre Apache)

**Méthode B — Manuelle** (si tu peux te connecter en SSH avec mot de passe eve) :

```bash
ssh -p 9022 root@127.0.0.1   # taper 'eve' quand demandé
# Puis coller (nettoyage agressif) :
rm -rf /var/log/*.gz /var/log/*.1 /var/log/*.old /opt/unetlab/tmp/* 2>/dev/null
:> /var/log/syslog; :> /var/log/auth.log 2>/dev/null
journalctl --vacuum-size=5M 2>/dev/null
apt-get clean 2>/dev/null; apt-get autoremove -y --purge 2>/dev/null
/opt/unetlab/wrappers/unl_wrapper -a restoredb
systemctl restart apache2
df -h /
exit
```
Rafraîchir http://127.0.0.1:9080/ (F5). Identifiants : **admin** / **eve**.

**Si l’API renvoie "Database error (90003)"** : la base est corrompue. Exécuter dans EVE (SSH) :  
`/opt/unetlab/wrappers/unl_wrapper -a restoredb` puis `systemctl restart apache2`.

**Méthode C — Disque toujours 100 %** : agrandir le disque puis étendre le FS.

1. **Arrêter EVE-NG** (fermer la fenêtre QEMU)
2. **Sur l'hôte** : `make eve-ng-disk-expand` (ou `make eve-ng-disk-expand SIZE=100G`)
3. **Redémarrer EVE** : `make eve-ng-boot`
4. **Sur l'hôte** : `make eve-ng-expand-fs` (se connecte en SSH et étend la partition LVM + le FS)

Cela détecte la partition LVM (vda3 sur Ubuntu 22), met à jour la GPT, étend la partition, puis le volume LVM et le système de fichiers. À la fin tu dois avoir ~28G libres. Rafraîchis http://127.0.0.1:9080/ et connecte-toi (admin / eve).

*Si `make eve-ng-expand-fs` échoue*, fais-le à la main dans EVE (SSH) — la partition LVM est **vda3** (pas vda5) :

```bash
ssh -p 9022 root@127.0.0.1   # mdp: eve
sgdisk -e /dev/vda
parted -s /dev/vda resizepart 3 100%
partprobe /dev/vda
pvresize /dev/vda3
lvextend -l +100%FREE /dev/ubuntu-vg/ubuntu-lv
resize2fs /dev/ubuntu-vg/ubuntu-lv
df -h /
```

---

- **XML Parsing Error / VERSION** (autres causes) : CORS ou mixed content si iframe HTTPS. **Solution** : ajoute `127.0.0.1 eve-ng.lab` dans `/etc/hosts`, puis utilise l’iframe LabCyber (eve-ng.lab est proxifié par la gateway, même origine). Sinon causes possibles :
  1. **Disque plein** (très fréquent) : l'Apache/PHP d'EVE-NG ne peut plus écrire. Libère l'espace (voir ci-dessous "No space left").
  2. **EVE-NG pas complètement démarré** : attends 1–2 min après le boot, rafraîchis la page (F5).
  3. **Base de données corrompue** : sur la VM EVE-NG, `ssh -p 9022 root@127.0.0.1` puis : `unl_wrapper -a restoredb`.
  4. **Apache/PHP non démarrés** : sur la VM : `systemctl status apache2` et `systemctl restart apache2`.
  5. **Extension de navigateur** : désactive les extensions (mode privé) ou essaie un autre navigateur.
- **"No space left on device"** (ssh-copy-id échoue) : la VM EVE-NG est pleine. Libère l'espace :
  ```bash
  make eve-ng-free-space   # (nécessite sshpass : pacman -S sshpass)
  # Puis réessaie : ssh-copy-id -i ~/.ssh/eve-ng -p 9022 root@127.0.0.1
  ```
  Sinon, connecte-toi manuellement : `ssh -p 9022 root@127.0.0.1` (mot de passe : eve), puis :
  ```bash
  rm -rf /var/log/*.gz /opt/unetlab/tmp/*; apt-get clean; apt-get autoremove -y
  ```
  Si toujours plein : supprime des images inutilisées dans `/opt/unetlab/addons/qemu/` ou agrandis le disque (`qemu-img resize eve-ng-disk.qcow2 100G` puis extension de partition dans la VM).
- **Transfert échoue (mot de passe demandé)** : configure la clé SSH (voir section 3).
- **Images non visibles dans EVE-NG** : Rafraîchir la page web. Si besoin : `ssh -p 9022 root@127.0.0.1 '/opt/unetlab/wrappers/unl_wrapper -a fixpermissions'`.
- **Nommage QEMU** : Voir [19-EVE-NG-QEMU-NAMING.md](19-EVE-NG-QEMU-NAMING.md).
- **Import d’images** : Voir [18-EVE-NG-IMPORT-IMAGES.md](18-EVE-NG-IMPORT-IMAGES.md).
- **Simulateur LabCyber (plans de site, bâtiments, étages)** : Voir [22-EVE-NG-VERS-SIMULATEUR-LABCYBER.md](22-EVE-NG-VERS-SIMULATEUR-LABCYBER.md).
