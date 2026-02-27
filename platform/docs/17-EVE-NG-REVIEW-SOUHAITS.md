# Review EVE-NG — ce que je souhaite retrouver dans le simulateur LabCyber

Ce fichier sert à **passer en revue EVE-NG** (une fois lancé via `make eve-ng-boot`) et à noter **tout ce que tu veux implémenter** dans le simulateur réseau du projet LabCyber.

Remplis les cases au fur et à mesure de tes tests. Tu peux cocher, ajouter des notes, prioriser.

### Accès rapide

| Accès | Lien / identifiants |
|-------|---------------------|
| **Web UI EVE-NG** | **http://127.0.0.1:9080** (défaut CE) ou https://127.0.0.1:9443 — login **admin** / **eve**. Attendre 2–5 min après le boot. |
| **Console EVE-NG** | `ssh -p 9022 root@127.0.0.1` — login **root** / **eve** |
| **Simulateur LabCyber** | Vue : `platform/src/views/tools/NetworkSimulatorView.jsx` — URL app : `/#/network-sim` |
| **Doc architecture simulateur** | [15-SIMULATEUR-EVE-NG.md](15-SIMULATEUR-EVE-NG.md) |

---

## Rappel : quand utiliser quelle commande

| Commande | Quand l'utiliser |
|----------|------------------|
| `make eve-ng-run` | **Uniquement pour la 1ère installation** (ISO + disque vierge). Une fois installé, ne plus utiliser. |
| `make eve-ng-boot` | **À chaque fois** que tu veux démarrer EVE-NG (déjà installé sur le disque). |

→ Si EVE-NG est déjà installé, utilise toujours `make eve-ng-boot`. N'utilise `make eve-ng-run` que si tu repars de zéro (disque supprimé).

### Flux réel observé (février 2026)

1. **`make eve-ng-boot`** → fenêtre QEMU s'ouvre, la VM boot.
2. **Console QEMU** : prompt `eve-ng login: admin` puis password `eve` → peut afficher « login incorrect » mais **ouvre automatiquement** le navigateur sur **http://127.0.0.1:9080/#!/login**.
3. **Page web** : « Sign in to start session » → username **admin**, password **eve**. Choisir **HTML console** (recommandé) ou Native console.
4. **HTML console** : File Manager, Manager, System, etc. → possibilité de démarrer un lab avec topologie.
5. **`make status`** : affiche les conteneurs Docker (lab platform, attaquant, etc.), **pas** la VM EVE-NG (QEMU). C'est normal.
6. **127.0.0.1:9080 ou localhost:9080 ne répond pas** : la VM EVE-NG n'est pas démarrée. Lancer `make eve-ng-boot` d'abord.
7. **Add a new node** : par défaut, seul **Virtual PC (VPCS)** est disponible. Les autres types nécessitent d'importer des images → voir [18-EVE-NG-IMPORT-IMAGES.md](18-EVE-NG-IMPORT-IMAGES.md).

8. **Images fournies par ton admin** : place-les dans `isos/lab-images/` (qemu/, dynamips/, iol/). Détection à la demande (pas au démarrage). Voir doc 18.

### Accès direct depuis LabCyber

La page **Simulateur EVE-NG (lab)** (`#/eve-ng-sim`) intègre l'interface EVE-NG dans une **iframe** : tu la vois directement sans ouvrir un nouvel onglet. Sinon : bouton « Ouvrir EVE-NG en nouvel onglet ».

---

## 1. Interface Web (ce que tu vois dans le navigateur)

Explorer **http://127.0.0.1:9080** (admin / eve). Noter ce qui te plaît ou manque.

- [ ] Création de lab / topologie (workflow, étapes)
- [ ] Liste des labs existants
- [ ] Dessin de la topologie (glisser-déposer, types de nœuds)
- [ ] Connexion entre nœuds (câblage, ports)
- [ ] Panneau de configuration par nœud
- [ ] Accès console par nœud (comment s’ouvre la console)
- [ ] Catalogue d’images (Docker, IOL, Dynamips, QEMU)
- [ ] Autre : _______________________________

### Notes (ce que j’ai observé)
```
(écris ici ce que tu vois, ce qui diffère de notre simulateur, ce qui manque)
```

---

## 2. Types de nœuds et backends

Quels types d’appareils propose EVE-NG ? Lesquels veux-tu avoir dans LabCyber ?

- [ ] PC / workstation (VPCS par défaut — seul type disponible sans images importées)
- [ ] Routeur (Dynamips, IOL, etc.)
- [ ] Switch (IOL, Open vSwitch)
- [ ] Firewall (pfSense, etc.)
- [ ] Serveur (Docker, VM)
- [ ] Cloud / WAN
- [ ] Autre : _______________________________

### Notes
```
(quels backends sont les plus utiles pour nos scénarios ?)
```

---

## 3. Gestion des images

Comment EVE-NG gère-t-il les images (Docker, IOL, etc.) ? Que veut-on faire pareil ?

- [ ] Import / téléchargement d’images
- [ ] Association image ↔ type de nœud
- [ ] Stockage local des images
- [ ] Autre : _______________________________

### Notes
```
```

---

## 4. Réseau et câblage

Comment les liens sont-ils gérés ? Ports, types de câbles, etc.

- [ ] Connexion nœud ↔ nœud (ports Fa0/0, etc.)
- [ ] Types de câbles (Ethernet, fibre, console, etc.)
- [ ] Réseaux virtuels (clouds, VLAN)
- [ ] Autre : _______________________________

### Notes
```
```

---

## 5. Fonctions à prioriser pour LabCyber

Liste par priorité (1 = le plus urgent) :

1. _______________________________________________
2. _______________________________________________
3. _______________________________________________
4. _______________________________________________
5. _______________________________________________

---

## 6. Différences LabCyber vs EVE-NG

| Aspect | EVE-NG | LabCyber (actuel) | À faire ? |
|--------|--------|-------------------|-----------|
| Dessin topologie | | Carte + nœuds, liaisons | |
| Types d’appareils | | PC, Routeur, Switch, Pare-feu, AP, Cloud, etc. | |
| Backend réel | Docker, IOL, Dynamips, QEMU | Export JSON seulement | |
| Console / terminal | Par nœud (VNC, console web) | Terminal lab commun, CLI simulé | |
| Intégration lab | Standalone | Intégré au lab Cyber (DVWA, vuln-api, etc.) | |
| Autre | | | |

---

## 7. Idées, remarques, contraintes

*(tout ce qui ne rentre pas ailleurs)*

```
(écris ici)
```

---

## 8. Objectif final

**En une phrase** : ce que tu veux que le simulateur LabCyber fasse comme EVE-NG (ou en plus, ou différemment).

```
Exemple : "Pouvoir dessiner une topologie dans le navigateur, exporter vers EVE-NG ou lancer les nœuds en Docker directement depuis le lab."
```

---

*Dernière mise à jour : compléter après chaque session de test EVE-NG.*
