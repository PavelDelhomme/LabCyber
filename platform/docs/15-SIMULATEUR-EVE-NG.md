# Simulateur réseau — logique type EVE-NG

Ce document décrit la **cible d’architecture** du simulateur réseau : chaque nœud de la topologie (PC, routeur, switch, serveur) est mappé vers un **backend réel** (Docker, Dynamips, IOL, QEMU), comme dans EVE-NG ou GNS3.

## Principe

- **Topologie** = nœuds + liaisons, dessinée dans l’interface (déjà en place).
- Chaque **nœud** a un type (pc, router, switch, server) et un **backend** qui décide comment l’instancier en lab réel :
  - **PC** → conteneur **Docker** (image type `network-multitool`, Alpine, ou Ubuntu minimal).
  - **Serveur** → conteneur **Docker** (même idée : image légère avec services).
  - **Routeur** → **Dynamips** (émulation Cisco IOS à partir d’images .image) ou **QEMU** pour images VIRL plus récentes.
  - **Switch** → **IOL** (Cisco IOL, IOS on Linux) ou image Docker avec logiciel de commutation (Open vSwitch, Linux bridge).

Les **liens** entre nœuds = réseaux virtuels (paires veth, Open vSwitch, ou réseaux Docker) que le backend devra créer pour connecter les interfaces des conteneurs/VM entre eux.

## Mapping actuel (frontend)

Dans le code du simulateur :

- `NODE_TYPE_TO_BACKEND` : pc → docker, server → docker, router → dynamips, switch → iol.
- `DEFAULT_BACKEND_IMAGE` : image/template par défaut pour l’export (ex. routeur = `c7200`, PC = `network-multitool`).

L’**export** (bouton « Exporter la topologie (backend lab) ») produit un JSON au format :

- `version`, `format: "eve-ng-lab"`
- `nodes` : tableau de `{ id, label, type, backend, image, deviceModel, config }`
- `links` : tableau de `{ id, from, to, fromPort, toPort, linkType }`
- `labId`, `simId` pour rattacher au lab actif.

Un **service backend** (à développer) pourra :

1. Lire ce JSON.
2. Pour chaque nœud : lancer le bon conteneur (Docker) ou émulateur (Dynamips/IOL/QEMU) avec la bonne image.
3. Créer les réseaux virtuels et connecter les interfaces selon `links`.
4. Exposer les accès (console, SSH, VNC) comme EVE-NG (URLs par nœud).

## Backends à implémenter

| Backend   | Rôle              | Outils / images typiques                          |
|-----------|-------------------|----------------------------------------------------|
| **Docker**| PC, serveur       | `network-multitool`, `alpine`, `ubuntu`, images custom |
| **Dynamips** | Routeurs Cisco | Images .image (c7200, c3700, etc.)                 |
| **IOL**   | Switchs Cisco     | Images IOL L2/L3 (Cisco IOS on Linux)             |
| **QEMU**  | Routeurs / VM     | Images VIRL, ISO génériques                        |

## Étapes prévues

1. **Côté frontend** (fait) : mapping type → backend, export JSON topologie.
2. **Catalogue d’images** : fichier de config (ex. `platform/data/backendImages.json`) listant les images disponibles par type (docker image name, dynamips image path, etc.).
3. **API ou script backend** : accepter le JSON exporté, créer les réseaux (Docker network ou veth + bridge), lancer les conteneurs/processus Dynamips/IOL, faire le câblage (fromPort/toPort → interfaces).
4. **Intégration lab** : soit un service dans le repo (Go/Node/Python) qui tourne à côté du lab Docker actuel, soit export vers un EVE-NG externe (import du JSON dans EVE-NG si format compatible).

## Références

- EVE-NG : [eve-ng.net](https://www.eve-ng.net/) — topologie + Docker / QEMU / Dynamips.
- Dynamips : émulation Cisco IOS (images .image).
- IOL : Cisco IOL (IOS on Linux) pour switchs légers en conteneur/VM.

## ISO EVE-NG Community Edition

L’ISO **EVE-NG Community Edition** est placée dans le projet pour installation sur une VM ou un bare-metal (Dynamips, IOL, Docker, QEMU).

- **Emplacement dans le projet** : `isos/eve-ce-prod-6.2.0-4-full.iso` (à la racine du dépôt LabCyber).
- **Fichier** : `eve-ce-prod-6.2.0-4-full.iso` (version 6.2.0-4, full).

Pour les scripts ou le Makefile, le chemin peut être défini dans `.env` :

```bash
EVE_NG_ISO_PATH=/chemin/absolu/vers/LabCyber/isos/eve-ce-prod-6.2.0-4-full.iso
```

**Vérifier et lancer EVE-NG** (configuration VM conforme à la doc officielle EVE-NG) :

- **`make eve-ng-check`** — Vérifie la présence et la taille de l'ISO.
- **`make eve-ng-disk`** — Crée le disque virtuel (50 Go par défaut) s'il n'existe pas. Obligatoire pour l'installation.
- **`make eve-ng-run`** — Lance la VM avec l'ISO et le disque : **8 Go RAM**, **4 vCPU**, disque virtuel (VirtIO), réseau. **Uniquement pour l'installation initiale.**
- **`make eve-ng-boot`** — Démarre EVE-NG depuis le disque (sans ISO). **À utiliser après chaque installation.**

### Procédure d'installation (important)

1. **Lancer** `make eve-ng-run` → fenêtre QEMU s'ouvre avec l'installateur.
2. **Suivre l'installation** dans la fenêtre (choisir le disque, valider, etc.) jusqu'à ce qu'elle se termine.
3. **Quand l'installateur annonce un redémarrage** : **fermer immédiatement la fenêtre QEMU** (Ctrl+C ou fermer la fenêtre). Ne pas laisser la VM redémarrer.
4. **Lancer** `make eve-ng-boot` → démarre EVE-NG depuis le disque, sans ISO.
5. **Premier démarrage** : l'écran console demande la config (hostname, domaine, IP DHCP/statique, NTP, proxy). Login : **root** / **eve**. Suis les prompts (entrée pour défauts). À la fin, EVE redémarre.
6. **Après redémarrage** : Web UI → **https://127.0.0.1:9443** (login **admin** / **eve**). SSH → `ssh -p 9022 root@127.0.0.1`.

**Pourquoi fermer avant le redémarrage ?** Avec `eve-ng-run`, le CD reste en priorité de boot (`-boot order=dc`). Si la VM redémarre, elle repart sur le CD → l'installateur se relance → **boucle infinie**. La seule façon de démarrer depuis le disque est `make eve-ng-boot` (pas de CD, boot sur disque uniquement).

Exigences officielles : RAM 8 Go min., 4 cœurs, 50 Go disque min., VT-x/EPT (Intel) ou EPT (AMD) pour KVM.

### Dépannage : l'installateur ne fonctionne pas

Si l'installateur EVE-NG bloque ou échoue :

1. **KVM** : `egrep -c '(vmx|svm)' /proc/cpuinfo` — si le résultat est **> 0** (ex. 32), KVM est activé, c'est bon. **32 = nombre de cœurs/threads avec virtualisation, pas une erreur.** Si 0 : pas de KVM, `make eve-ng-run` utilisera l'émulation logicielle (plus lent).
2. **Boucle installateur** : tu as installé, la VM redémarre et relance l'installateur → ferme la fenêtre dès que l'installation est terminée, puis lance `make eve-ng-boot`.
3. **Permissions** : `sudo chmod 666 /dev/kvm` ou ajoute ton utilisateur au groupe `kvm`.
4. **Graphiques** : si la fenêtre QEMU reste noire, `-vga std` est déjà dans le Makefile.
5. **Repartir de zéro** : `rm isos/eve-ng-disk.qcow2` puis `make eve-ng-run`.
6. **Réseau** : l'option `-nic user` configure un NAT ; pour un accès direct, utilise `-nic bridge,br=br0` (selon ta config).

### Accès à l'interface web EVE-NG (depuis ton PC)

L'interface web d'EVE-NG est **celle de la VM** : c'est l'UI de gestion des topologies (labs, nœuds, Docker, etc.), pas la console texte du système.

- **URL** : **https://127.0.0.1:9443** (depuis ton navigateur sur la machine hôte).
- **Attendre** : la VM met 2–5 minutes à démarrer. Une fois le boot terminé (prompt login sur la fenêtre QEMU), le service web est prêt.
- **Certificat** : le navigateur affiche un avertissement (certificat auto-signé) → « Avancé » → « Accepter le risque et continuer » (ou équivalent).
- **Login** : **admin** / **eve**.

### Que faire maintenant (premier login)

1. **Console** : connecte-toi avec **root** / **eve**.
2. **Configuration** : suis l'assistant (hostname, domaine, IP DHCP/statique, NTP, proxy). Tu peux garder les défauts (entrée).
3. **Redémarrage** : à la fin, EVE redémerge. Ferme la fenêtre, relance `make eve-ng-boot`.
4. **Web UI** : ouvre **https://127.0.0.1:9443** dans ton navigateur. Login : **admin** / **eve**.
5. **Mise à jour** (optionnel) : en SSH (`ssh -p 9022 root@127.0.0.1`) : `apt-get update && apt-get upgrade`.

---

## Review EVE-NG et souhaits pour LabCyber

→ **Fichier dédié** : [17-EVE-NG-REVIEW-SOUHAITS.md](17-EVE-NG-REVIEW-SOUHAITS.md) — passe EVE-NG en revue, note ce que tu veux intégrer au simulateur LabCyber, priorise.

---

## Ce que je souhaite avoir dans le projet (à compléter)

Espace pour noter **tout ce que tu veux retrouver** dans le projet autour du simulateur EVE-NG. On travaillera dessus à partir de cette liste.

### Objectifs / fonctionnalités souhaitées

- [ ] *(exemple : lancer EVE-NG depuis le Makefile sur mon système)*
- [ ]
- [ ]

### Intégration avec l’interface (plateforme web)

- [ ]
- [ ]

### Données / config / images

- [ ]
- [ ]

### Autre (idées, contraintes, remarques)

*(à remplir)*

---
*Remplis les cases et les blocs ci-dessus au fur et à mesure ; on s’appuiera sur cette liste pour les prochaines étapes.*
