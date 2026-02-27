# Import des images dans EVE-NG et LabCyber

Ce guide explique **où placer tes propres images**, **comment** les importer, et quelles **images sont nécessaires** pour couvrir les besoins du simulateur (PC, serveurs, routeurs Cisco, switchs, Linux, Windows, attaquant, DHCP, WiFi, etc.).

---

## Où placer tes images dans le projet LabCyber

Toutes tes images (récupérées toi-même, fournies par un collègue admin, ou téléchargées) doivent être placées dans :

```
isos/lab-images/
├── qemu/          # Linux, Windows, pfSense, VyOS, appliances QEMU
├── dynamips/      # Routeurs Cisco IOS (.image ou .bin)
├── iol/           # Switchs Cisco IOL (.bin)
└── docker/        # (optionnel) images Docker pour LabCyber
```

**Détection à la demande** : le projet ne charge pas toutes les images au démarrage (trop lourd). Quand tu utilises le simulateur réseau ou EVE-NG, les images sont utilisées **à la demande** selon la topologie que tu construis.

**Licence** : si ton administrateur t'a fourni des images Cisco (IOS, IOL, vIOS), place-les dans les sous-dossiers correspondants. Vérifie que tu as le droit de les utiliser pour ton usage (formation, lab perso, etc.).

---

## Images nécessaires pour couvrir tout le simulateur

Le catalogue `backendImages.json` référence toutes les images attendues. Résumé par catégorie :

| Catégorie | Type | Backend | Exemples à avoir |
|-----------|------|---------|------------------|
| **PC / postes** | Network Multitool, Alpine | Docker | `wbitt/network-multitool` |
| **Serveurs** | Ubuntu, DHCP, DNS | Docker | `networkop/docker-dhcp` |
| **Attaquant** | Kali, Parrot | Docker | `kalilinux/kali-rolling` |
| **Routeurs** | Cisco 7200, vIOS, VyOS | Dynamips, QEMU | `c7200-adventerprisek9-mz.*.image` |
| **Switchs** | Cisco IOL L2/L3, vIOS L2 | IOL, QEMU | `L2-ADVENTERPRISEK9-M.*.bin` |
| **Pare-feu** | pfSense, ASAv | QEMU | `pfSense-*.qcow2` |
| **WiFi** | vWLC | QEMU | `vwlc-*.qcow2` |
| **Windows** | Win 7/10/11, Server | QEMU | `win-*.qcow2` |
| **Linux** | Alpine, Ubuntu, Kali | QEMU | `alpine-*.qcow2`, `linux-kali-*.qcow2` |

Tu n'as pas besoin de tout avoir : seulement les images correspondant aux scénarios que tu utilises.

---

## 1. Images Docker (pour LabCyber)

Utilisées quand le backend LabCyber lance des conteneurs (PC, serveurs). **EVE-NG CE ne supporte pas Docker** — ces images servent au lab Docker du projet.

### Network Multitool (recommandé)

Depuis janvier 2022, l'image officielle est **wbitt/network-multitool** ([GitHub wbitt/Network-MultiTool](https://github.com/wbitt/Network-MultiTool)) :

```bash
docker pull wbitt/network-multitool
```

L'ancienne `praqma/network-multitool` fonctionne encore mais peut disparaître.

### Serveur DHCP (ISC)

```bash
docker pull networkop/docker-dhcp
```

### Tout pull d'un coup

```bash
make lab-images-pull-docker
```

---

## 2. Images Dynamips (Cisco IOS)

### Images Dynamips (c7200, c3700, etc.) — placement manuel

Internet Archive n'est plus fiable pour le téléchargement automatique. **Place tes images manuellement** dans `isos/lab-images/dynamips/` :

- `c7200-adventerprisek9-mz.*.image` (Cisco 7200)
- `c3700-adventerprisek9-mz.*.image` (Cisco 3700)
- `c2691-adventerprisek9-mz.*.image` (Cisco 2691)
- etc.

Fichiers `.bin` fournis par ton admin : souvent c'est un zip — extraire avec `unzip -p fichier.bin > fichier.image`.

```bash
make lab-images-check   # Vérifier quelles images sont installées
```

### Depuis un fichier .gns3a (GNS3 appliance)

1. **Place tes fichiers .gns3a** dans `isos/gns3a/` (téléchargés depuis le [GNS3 Marketplace](https://www.gns3.com/marketplace/appliances) ou fournis par ton admin).
2. **Lance l'import** :

```bash
make lab-images-gns3a
```

Tous les `.gns3a` du dossier sont importés. Le script extrait les URLs de téléchargement si présentes et place les images dans `isos/lab-images/`. Si une image n'a pas d'URL, place le fichier manuellement dans le bon sous-dossier.

### Emplacement des images fournies par ton admin

Place les fichiers `.bin` ou `.image` fournis dans :

```
isos/lab-images/dynamips/
```

---

## 3. Images QEMU (Linux, Windows, appliances)

Structure EVE-NG : chaque image dans un sous-dossier :

```
isos/lab-images/qemu/
├── alpine-3.18/
│   └── virtioa.qcow2
├── linux-netem/
│   └── virtioa.qcow2
├── vios-adventerprisek9-m/
│   └── virtioa.qcow2
└── ...
```

### Téléchargement linux-netem

```bash
make eve-ng-images-download
```

Puis transférer vers EVE-NG (voir ci-dessous).

---

## 4. Transférer vers EVE-NG (à la demande)

Quand tu veux utiliser ces images dans EVE-NG :

1. **Démarrer EVE-NG** : `make eve-ng-boot`
2. **Transférer** (adapter les chemins) :

   ```bash
   # Linux/QEMU
   scp -P 9022 -r isos/lab-images/qemu/linux-netem* root@127.0.0.1:/opt/unetlab/addons/qemu/

   # Dynamips (Cisco IOS)
   scp -P 9022 isos/lab-images/dynamips/*.image root@127.0.0.1:/opt/unetlab/addons/dynamips/

   # IOL
   scp -P 9022 isos/lab-images/iol/*.bin root@127.0.0.1:/opt/unetlab/addons/iol/bin/
   ```

3. **Permissions** :

   ```bash
   ssh -p 9022 root@127.0.0.1 "/opt/unetlab/wrappers/unl_wrapper -a fixpermissions"
   ```

4. Rafraîchir l'interface web EVE-NG.

---

## 5. GNS3 Marketplace

Le [GNS3 Marketplace](https://www.gns3.com/marketplace/appliances) propose des centaines d'appliances. Chaque appliance a une page (ex. [Cisco IOSv](https://www.gns3.com/marketplace/appliances/cisco-iosv)) avec :

- Un fichier `.gns3a` à télécharger
- Des versions multiples (ex. Cisco IOSv 15.9(3)M9, 15.9(3)M8, etc.)
- Des liens **Download** par fichier (qcow2, img, etc.)

**Processus manuel** :

1. Ouvre la page de l'appliance
2. Télécharge le `.gns3a` (bouton Download de l'appliance)
3. Pour chaque version, clique sur les liens Download des fichiers listés
4. Place les fichiers dans `isos/lab-images/qemu/` ou `dynamips/` selon le type
5. Ou utilise `./scripts/gns3a-import.sh chemin/vers/fichier.gns3a` si le .gns3a contient des URLs

**Automatisation** : utilise `make lab-images-gns3-registry` pour télécharger automatiquement les appliances du registry GNS3 qui ont des URLs directes (voir section 7).

---

## 6. Ajouter des images via l'interface

Dans **Simulateur lab (EVE-NG)** de la plateforme :

1. Section **« Ajouter des images personnalisées »** : remplis le formulaire (nom, URL, type qemu/dynamips/iol)
2. Clique **Exporter customImages.json** pour télécharger le fichier
3. Place le fichier dans `platform/data/customImages.json`
4. Lance **`make lab-images-sync`** : les images sont téléchargées automatiquement dans `isos/lab-images/`

Le fichier reste dans le projet, tes images sont conservées.

## 7. Automatisation GNS3 Marketplace

Pour télécharger automatiquement les appliances du [GNS3 Registry](https://github.com/GNS3/gns3-registry) qui ont des URLs directes (archive.org, etc.) :

```bash
make lab-images-gns3-registry
```

Les appliances pointant vers des stores manuels (Cisco, VyOS support, etc.) sont ignorées — tu dois les télécharger toi-même avec tes licences.

## 8. Récapitulatif des commandes

| Action | Commande |
|--------|----------|
| Créer la structure | `mkdir -p isos/lab-images/{qemu,dynamips,iol}` |
| Pull Docker (Network Multitool, DHCP) | `make lab-images-pull-docker` |
| Vérifier les images | `make lab-images-check` |
| Télécharger linux-netem | `make eve-ng-images-download` |
| Importer .gns3a | Place les fichiers dans `isos/gns3a/` puis `make lab-images-gns3a` |
| Sync images personnalisées | `make lab-images-sync` |
| Sync GNS3 registry | `make lab-images-gns3-registry` |
| Télécharger TOUS les .gns3a (GitHub) | `make lab-images-gns3-server` |
| Organiser (racine → isos) | `make lab-images-organize` |
| Organiser orphelins qemu | `make lab-images-organize-orphans` |
| Transférer vers EVE-NG | `make lab-images-transfer-eve-ng` |
| Aide | `make eve-ng-images-help` |

---

## 9. Convention de nommage QEMU EVE-NG

Le **nom du dossier** et le **nom du fichier .qcow2** doivent respecter la convention EVE-NG. Voir la doc détaillée :

- **Doc complète** : [19-EVE-NG-QEMU-NAMING.md](19-EVE-NG-QEMU-NAMING.md) (préfixes, formats hda/virtioa/sataa…)
- **Images et mots de passe** : [hegdepavankumar/Cisco-Images-for-GNS3-and-EVE-NG](https://github.com/hegdepavankumar/Cisco-Images-for-GNS3-and-EVE-NG)
- **Identifiants courants** : `platform/data/eve-ng-passwords.json`

## 10. Télécharger tous les .gns3a GNS3

Pour récupérer **tous** les fichiers `.gns3a` du dépôt officiel GNS3 :

```bash
make lab-images-gns3-server   # télécharge TOUS les .gns3a depuis GitHub
make lab-images-gns3a         # importe les images (URLs si présentes)
```

Source : [gns3-server/appliances](https://github.com/GNS3/gns3-server/tree/master/gns3server/appliances)

---

## Liens utiles

- [Network-MultiTool (wbitt)](https://github.com/wbitt/Network-MultiTool) — image Docker officielle
- [Internet Archive c7200-IOS](https://archive.org/download/c7200-IOS)
- [GNS3 Marketplace](https://www.gns3.com/marketplace/appliances)
- [GNS3 Server appliances (GitHub)](https://github.com/GNS3/gns3-server/tree/master/gns3server/appliances) — tous les .gns3a
- [GNS3 Registry (GitHub)](https://github.com/GNS3/gns3-registry/tree/master/appliances)
- [EVE-NG Supported Images](https://www.eve-ng.net/index.php/documentation/supported-images/)
- [Images + mots de passe EVE-NG](https://github.com/hegdepavankumar/Cisco-Images-for-GNS3-and-EVE-NG) — Cisco, Fortigate, Palo Alto, Sophos…

---

*Dernière mise à jour : février 2026.*
