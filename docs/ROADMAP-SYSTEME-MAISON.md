# Roadmap – Système maison Lab Cyber

Ce document décrit la vision et le plan pour le **système maison** : terminal web, environnement de lab (attaquant riche + prédéfinitions), bureau léger fait maison, persistance complète par lab, et interconnexion de tous les outils (simulateur réseau, capture pcap, requêtes API, terminal, client graphique web).

---

## Objectifs

1. **Conteneur attaquant** : disposition d’**autant d’outils que Kali** (voire plus : Black Arch, autres distros cyber), avec **sélection de packs d’outils** et **outils de base** (non dédiés cyber mais nécessaires). **Prédéfinitions à la création du lab** : packs d’outils choisis par lab/scénario.
2. **Terminal** : simple d’usage mais **maximum de fonctionnalités** ; **plusieurs terminaux** par lab ; **historique complet conservé** (commandes + sorties) ; **connecté au lab** ; à la **reprise d’un lab existant**, ne rien perdre – retrouver tous les terminaux et leur historique/sorties comme avant.
3. **Bureau / interface graphique** : un **vrai bureau** voulu, **léger** mais **fait maison** (pas du noVNC/XFCE lourd) – une interface type bureau réelle, implémentée par nous.
4. **Interconnexion** : **simulateur réseau**, **capture pcap**, **requêtes API**, **terminal lab**, **client graphique web** – tous **connectés au lab** et entre eux (contexte lab, données partagées).
5. **Scénario + lab** : au **démarrage d’un scénario**, avec un lab connecté (toujours un **lab par défaut** créé/connecté), **installation des outils nécessaires** au lab pour ce scénario.
6. **Reprise de lab** : en rouvrant un lab existant, **rien perdre** : tous les terminaux, historique des commandes, résultats de commandes, état des panneaux – tout restauré comme c’était.

---

## État actuel (à remplacer / compléter)

| Composant | Actuel | Cible |
|-----------|--------|--------|
| Terminal web | ttyd + client maison (xterm.js, protocole binaire) | Backend terminal maison (Go/C) ; multi-terminaux ; historique + sorties persistés par lab. |
| Attaquant | Conteneur Kali (riche mais générique) | Même richesse (Kali+ ou plus) + **packs d’outils** + **outils de base** + **prédéfinitions à la création du lab**. |
| Bureau | noVNC + XFCE (lourd) | **Bureau fait maison**, léger, vrai bureau (pas juste web pur). |
| Persistance lab | Liste onglets, journal manuel ; pas d’historique terminal ni sorties | **Tout** persisté par lab : terminaux, historique commandes, sorties, état panneaux. |
| Outils (simulateur, pcap, API) | Présents mais pas tous reliés au lab/terminal | **Interconnectés** : même lab, données partagées, reliés au terminal lab et au client graphique web. |

---

## Architecture cible – Détail

### 1. Conteneur attaquant (environnement lab)

- **Disponibilité** : autant d’outils que Kali (nmap, hydra, sqlmap, tcpdump, scapy, etc.), voire plus (Black Arch, autres).
- **Organisation** :
  - **Outils de base** : indispensables mais pas dédiés cyber (curl, wget, bash, python3, etc.).
  - **Packs d’outils** : sélectionnables (ex. « web », « réseau », « forensique »).
  - **Prédéfinitions à la création du lab** : à la création d’un lab (ou au démarrage d’un scénario), les outils **nécessaires au lab / au scénario** sont indiqués (config) et, si besoin, installés ou activés.
- **Pas** un environnement minimal : on garde un **max de trucs**, avec **sélection et prédéfinitions** pour que chaque lab ait ce qu’il faut.

### 2. Backend « Lab Terminal » (système maison)

- **Rôle** : exposer un ou plusieurs **PTY** (pseudo-terminaux) sur **WebSocket** ; un processus PTY par terminal (ou par onglet) ; shell dans le conteneur attaquant (ou futur conteneur lab).
- **Stack** : Go (ou C) ; protocole binaire (type + payload), compatible client actuel.
- **Persistance** : par **lab** (et par session) – historique des commandes + **sorties** enregistrés ; à la reprise du lab, restauration de tous les terminaux et de leur contenu (historique + sorties).

### 3. Client terminal web (panneau / PiP)

- **Fichier** : `platform/public/terminal-client.html` (ou évolution).
- **Fonctionnalités** : plusieurs terminaux ; chacun **lié à un lab** ; affichage + saisie + resize + exit → fermeture onglet ; à la **reprise du lab**, restauration du contenu (historique + sorties) depuis le backend.

### 4. Bureau / interface graphique (fait maison)

- **Besoin** : un **vrai bureau** (interface type bureau), **léger**, mais **fait maison** (pas noVNC/XFCE tel quel).
- **Solution cible** : implémentation maison d’un bureau (affichage graphique léger, fenêtres, navigation, notes, etc.) – à préciser (stack : web + canvas, ou serveur graphique léger + client web, etc.). L’objectif est d’avoir une **vraie interface bureau** utilisable pour le lab, pas uniquement des onglets web.

### 5. Interconnexion (simulateur, pcap, API, terminal, client web)

- **Simulateur réseau**, **capture pcap**, **requêtes API**, **terminal lab**, **client graphique web** : tous **connectés au même lab**.
- **Données partagées** : contexte lab (machines, IP, scénario), résultats de capture, requêtes – cohérence et lien entre les outils.
- **Terminal lab** et **client graphique web** font partie de ce tout connecté.

### 6. Scénario + lab (outils au démarrage)

- **Toujours** un **lab par défaut** créé/connecté.
- Au **démarrage d’un scénario** (lab connecté) : **installation / activation des outils nécessaires** au lab pour ce scénario (définis en config : packs ou liste d’outils par scénario).

### 7. Reprise d’un lab existant (zéro perte)

- En rouvrant un **lab existant** :
  - **Tous les terminaux** : restaurés (nombre, noms, ordre).
  - **Historique des commandes** et **résultats/sorties** : retrouvés tels quels.
  - **État des panneaux** (simulateur, pcap, API, bureau, etc.) : restauré comme à la dernière session.
- Objectif : **ne rien perdre** ; reprise exacte de l’état du lab.

---

## Plan de mise en œuvre (ordre proposé)

### Phase 1 – Terminal panel fiable (court terme) – validée

- [x] Client `terminal-client.html` en protocole binaire (input 0x30, output 0, resize 0x31).
- [x] PoC backend Go lab-terminal (PTY + WebSocket). Intégration : conteneur, gateway /terminal-house/, client path=terminal-house. Panel, PiP, nouvel onglet OK.
- [x] Exit et resize panel (handle, curseur col-resize pendant drag).

### Phase 2 – Persistance par lab + journal/notes complet (moyen terme)

- [x] Persister par lab : liste terminaux, historique commandes (journal), restauration à la reprise. Sorties (backend) : à venir.
- [x] Plusieurs terminaux par lab ; chaque lab restaure ses onglets et journal. Contenu PTY (output) : à venir.
- [ ] **Étape 3 – Journal / Notes complet + terminal flottant + contexte scénario** (à faire) :
  - **Journal session** : par lab et par session terminal (chaque onglet = session) ; notes journal distinctes de l’historique commandes.
  - **Terminal flottant (PiP)** : persistance par lab (ouvert/fermé, session PiP) ; restauration à la reprise du lab.
  - **Journal / Notes complet** (bouton Journal & Stats, vue dédiée) :
    - Capture résultats de commandes (output terminal) ; captures d’écran ; pièces jointes.
    - Transfert terminal lab → journal (exporter sortie, commande, sélection).
    - Consultation par lab et par scénario ; filtrage par lab/scénario en cours.
    - Lien optionnel avec scénario actif (un journal peut être « lié » à un scénario pour retrouver les notes dans ce contexte).
  - **Sorties PTY** : backend lab-terminal – persister les sorties par session/lab pour restauration (Phase 2 étape 2 complément).
  - **Contexte scénario par lab** : lab peut avoir un scénario associé (en cours) ; le journal et les outils utilisent ce contexte. Référence pour Phase 3 prédéfinitions.

### Phase 3 – Attaquant riche + packs + prédéfinitions à la création du lab (moyen terme)

- [ ] Conteneur attaquant : conserver ou étendre la base type Kali (voire Black Arch, etc.) ; **outils de base** + **packs d’outils** (sélectionnables).
- [ ] **Prédéfinitions à la création du lab** : config (JSON ou API) listant, par lab ou par scénario, les outils/packs nécessaires ; à la création du lab (ou au démarrage scénario), installation/activation de ces outils. *S’appuie sur Phase 2 étapes 2–3 : persistance par lab (terminaux, journal, contexte scénario) ; le scénario associé au lab permet de charger les prédéfinitions correspondantes.*
- [ ] Backend terminal : lancer le shell dans ce conteneur attaquant (ou conteneur lab dérivé).

### Phase 4 – Bureau fait maison (léger, vrai bureau) (moyen / long terme)

- [ ] Spécifier : stack (web + rendu graphique, ou serveur graphique léger + client web).
- [ ] Implémenter un **bureau fait maison** : vrai bureau, léger, pour navigation, notes, outils graphiques du lab.
- [ ] Remplacer ou compléter noVNC/XFCE à terme.

### Phase 5 – Interconnexion + reprise lab complète (long terme)

- [ ] **Interconnexion** : simulateur réseau, capture pcap, requêtes API, terminal lab, client graphique web – tous connectés au lab, données partagées.
- [ ] **Reprise lab** : persister et restaurer tout (terminaux + historique + sorties, panneaux, état bureau, etc.) pour qu’à la reprise d’un lab existant on retrouve tout comme c’était.

---

## Choix techniques à trancher

| Sujet | Options | Recommandation courte |
|-------|---------|------------------------|
| Langage backend terminal | C, C++, Go | **Go** : perf correcte, déploiement simple, stdlib PTY/WebSocket. |
| Protocole WebSocket | Texte vs binaire | **Binaire** : déjà utilisé par le client, faible overhead. |
| Bureau fait maison | Rendu web (canvas), serveur X léger, autre | À définir : objectif = vrai bureau, léger, fait maison. |
| Stockage persistance lab | Fichiers (JSON, SQLite), API dédiée | À définir : par lab, par utilisateur/session ; restaurer terminaux + historique + sorties + panneaux. |

---

## Fichiers et docs à mettre à jour

- **STATUS.md** : section « Système maison » alignée sur cette roadmap (attaquant riche + packs + prédéfinitions, bureau fait maison, terminal multi + persistance, reprise lab, interconnexion).
- **README.md** : lien vers cette roadmap, résumé des objectifs (système maison, pas de perte à la reprise).
- **platform/docs/** : protocole WebSocket terminal ; config « outils / packs par lab » quand elle existera.
- **docker-compose** : vuln-network (Redis sysctl) ; à venir : service lab-terminal, etc.

---

## Résumé

- **Attaquant** : max d’outils (Kali+), packs + outils de base, **prédéfinitions à la création du lab** (et au démarrage scénario).
- **Terminal** : plusieurs terminaux, **historique + sorties conservés**, connecté au lab ; **reprise lab = tout retrouver**.
- **Bureau** : **vrai bureau**, léger, **fait maison** (pas seulement web pur).
- **Interconnexion** : simulateur, pcap, API, terminal, client web – **tous connectés au lab**.
- **Scénario** : au démarrage, **outils nécessaires au lab** installés/activés pour le scénario.
- **Reprise lab** : **rien perdre** – terminaux, historique, sorties, panneaux, comme c’était.

Ce document sera mis à jour au fur et à mesure (phases cochées, décisions techniques, nouveaux fichiers).

---

## Historique des changements

- **2026-02-20** (branche `feature/terminal-integre`) : Client `terminal-client.html` adapté au protocole binaire ttyd. Création de la roadmap, mise à jour STATUS.md et README.md.
- **2026-02-20** : Roadmap réécrite selon specs complètes ; vuln-network (Redis sysctl retiré du compose, note hôte) ; bWAPP en avertissements connus.
- **2026-02-21** : PoC backend terminal **lab-terminal** (Go) : PTY + WebSocket, protocole binaire. Service dans docker-compose, route gateway `/terminal-house/`, client `?path=terminal-house`. Phase 2 partiellement cochée.
- **2026-02-21** : Phase 2 étapes 1–2 implémentées (persistance terminal par lab : onglets, journal, restauration). Phase 2 étape 3 détaillée (journal complet, PiP par lab, contexte scénario, sorties PTY). Phase 3 : référence aux Phase 2 étapes 2–3 pour prédéfinitions.
