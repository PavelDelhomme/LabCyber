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
- [x] **Étape 3 – Journal / Notes complet + terminal flottant + contexte scénario** (implémenté) :
  - **Journal session** : par lab et par session terminal (chaque onglet = session) ; notes journal distinctes de l’historique commandes.
  - **Terminal flottant (PiP)** : persistance par lab (ouvert/fermé, session PiP) ; restauration à la reprise du lab.
  - **Journal / Notes complet** (bouton Journal & Stats, vue dédiée) :
    - Capture résultats de commandes (output terminal) ; captures d’écran ; pièces jointes.
    - Transfert terminal lab → journal (exporter sortie, commande, sélection).
    - Consultation par lab et par scénario ; filtrage par lab/scénario en cours.
    - Lien optionnel avec scénario actif (un journal peut être « lié » à un scénario pour retrouver les notes dans ce contexte).
  - [x] **Sorties PTY** : backend lab-terminal – buffer des sorties par session (`?session=tabId`), replay au reconnect ; client envoie `session` dans l’URL WS. Au rechargement, l’historique affiché dans chaque onglet terminal est restauré (buffer 512 Ko/session).
  - [x] **Contexte scénario par lab** : scenarioId sauvegardé ; entrées journal liables à un scénario. Référence Phase 3.

**Reste à faire (roadmap système maison)**  
- **Phase 4** : Bureau fait maison.  
- **Phase 5** : Interconnexion + reprise lab complète.

**À faire plus tard (backlog)**  
- **Port knock** : implémenter ou documenter le port knocking (démonstration dans un scénario, service côté cible, client/outil côté attaquant) ; à planifier dans une phase ultérieure ou un scénario dédié.
- **Cibles spécifiques** : **Windows Server**, **Active Directory (AD)**, **DHCP**, et autres machines/services pour scénarios dédiés. À documenter et intégrer dans : `docs/`, `platform/docs/` (voir 05-CIBLES-A-FAIRE.md), `platform/public/data/targets.json`, `platform/public/data/scenarios.json`, `platform/public/data/challenges.json`, `platform/public/docs/`, vuln-network / nouveaux conteneurs (ex. AD, Windows). Voir [platform/docs/05-CIBLES-A-FAIRE.md](platform/docs/05-CIBLES-A-FAIRE.md).
- **Historique par session terminal** : chaque onglet terminal doit avoir **son propre historique** (affichage / replay des sorties PTY) ; partage optionnel entre sessions plus tard. À faire : actuellement un nouvel onglet (ex. Session 2) peut réafficher l’historique d’une autre session ; isoler l’historique par `session` (tabId) côté backend/client et par lab.
- **Terminal PiP déplaçable** (à faire en dernier) : réactiver le drag du terminal flottant PiP une fois les conflits avec l’iframe `terminal-client.html` résolus (position fixe + z-index max pour l’instant).

### Phase 3 – Attaquant riche + packs + prédéfinitions à la création du lab (moyen terme) – en cours

- [x] **Config packs et prédéfinitions** : `platform/data/toolPacks.json` (packs : base, network, web, bruteforce) ; `platform/data/labToolPresets.json` (byScenario, byLab) ; doc `platform/docs/04-PHASE3-OUTILS.md`.
- [x] **Conteneur attaquant** : image Kali pré-construite avec **outils de base** + **tous les packs** (base, network, web, bruteforce, osint) ; alignée sur `toolPacks.json` / `labToolPresets.json` ; opérationnel pour tous les scénarios (ex. scénario 1 scan avec nmap, etc.).
- [x] **UI** : dans la vue Scénario, bloc « Packs d'outils recommandés pour ce scénario » (nom + aperçu outils).
- [x] **Prédéfinitions à la création du lab** : à la création du lab, sélection optionnelle des packs d’outils (stockée dans `lab.packIds`) ; à l’édition du lab, modification des packs. Au **démarrage d’un scénario**, si le lab actif (non défaut) n’a pas encore de packs, application des packs recommandés du scénario (`labToolPresets.byScenario[scenarioId]`). L’image attaquant contient déjà tous les outils ; les packs servent à associer le lab aux préférences / au contexte scénario.
- [ ] Backend terminal : lancer le shell dans ce conteneur attaquant (déjà le cas ; optionnel : conteneur lab dérivé).

**Phase 3 – UX layout et design (en cours)**  
- [x] Barre scénario : z-index au-dessus du panneau terminal (9100) ; design aligné app.
- [x] Panneau terminal : onglets verticaux à gauche (sélection de session).
- [x] Cibles dans la barre : design cohérent (chips, Copier / Terminal).
- [x] Marge droite : contenu et barre = largeur panneau (pas de gap superflu).
- [x] Un seul scénario « en cours » à la fois : au démarrage ou reprise d’un scénario, les autres passent automatiquement en pause.
- [x] **Récap (PiP)** : popup « Récap » positionnée **à gauche, au-dessus** de la barre scénario (z-index 9200), plus en bas à droite sous la barre.
- [x] **Voir tout** : le bouton « Voir tout » dans la barre scénario met à jour le hash puis fait défiler la colonne scénario vers le haut (scrollIntoView).
- [x] **Contenu non couvert** : main avec margin-right quand le panneau terminal est ouvert + transition 0,2 s ; contenu reste lisible.
- [ ] Vérification E2E : scénario + terminal + barre lisibles sans recouvrement.
- [x] **Terminal PiP (position fixe)** : plus de déplacement (drag désactivé) – position **fixe** en bas à droite (`right: 1rem; bottom: 1rem`), **z-index 99999**, pour éviter conflits avec l’iframe terminal-client.html et comportement épileptique. **PiP déplaçable** reporté en fin de backlog.

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
- **platform/docs/** : protocole WebSocket terminal ; config « outils / packs par lab » ; **05-CIBLES-A-FAIRE.md** (Windows Server, AD, DHCP, cibles à intégrer).
- **platform/public/data/** : targets.json, scenarios.json, challenges.json – à compléter quand cibles AD / Windows / DHCP ajoutées.
- **docker-compose** : vuln-network (Redis sysctl) ; à venir : service lab-terminal ; cibles Windows Server / AD / DHCP (voir backlog).

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
- **2026-02** : Phase 2 étape 3 implémentée (PiP par lab, journal complet, journal session avec sessionId/scenarioId). STATUS.md mis à jour (panneau terminal OK, exit OK ; rechargement = perte contenu tant que sorties PTY non persistées). Roadmap : bloc « Reste à faire » ajouté (sorties PTY puis Phases 3–5).
- **2026-02-13** : **Sorties PTY** implémentées : lab-terminal lit `session` en query WS, buffer 512 Ko/session, replay au reconnect ; terminal-client.html envoie `session` dans l’URL WS. Double-clic onglet terminal pour renommer (délai 500 ms). Phase 2 terminée pour le terminal.
- **2026-02** : **Focus terminal** : à l’ouverture du panneau ou au changement d’onglet, focus automatique sur xterm (client : term.focus(), postMessage `lab-cyber-terminal-focus`, focus on window). **Phase 3 démarrée** : toolPacks.json, labToolPresets.json, 04-PHASE3-OUTILS.md ; STATUS et roadmap mis à jour.
- **2026-02-13** : **Phase 3 UX** : barre scénario z-index 9100 (au-dessus du panneau terminal), design unifié ; panneau terminal avec onglets verticaux à gauche ; section Cibles en chips ; marge droite sans gap superflu ; roadmap mise à jour (bloc Phase 3 – UX layout et design).
- **2026-02-13** : **Un seul scénario en cours** : au démarrage ou reprise d’un scénario, tout autre scénario « en cours » passe automatiquement en pause.
- **2026-02-13** (branche `feature/phase3-conteneur-attaquant`) : **Conteneur attaquant Phase 3** : Dockerfile labellisé (Phase 3 packs), `/workspace/phase3-packs.txt` ; image opérationnelle avec tous les packs (base, network, web, bruteforce, osint) pour tests scénarios.
- **2026-02-13** : **Vue scénario** : bouton « Ouvrir le terminal » disponible aussi quand le scénario est **en cours** ou **en pause** (plus seulement au démarrage). Backlog roadmap : **port knock** (à faire plus tard – démo scénario, service cible, outil attaquant).
- **2026-02-13** : **Reprise / démarrage scénario** : au clic sur « Reprendre le scénario » (ou « Reprendre » dans la barre), reprise complète : restauration du **lab** lié au scénario, **ouverture et affichage** du panneau terminal (déminimisé), rappels et contexte corrects. Idem au « Démarrer le scénario » : panneau terminal ouvert et affiché. Callbacks `handleStartScenario` / `handleResumeScenario` dans App.
- **2026-02-13** : **UX scénario** : Récap (popup) déplacé **à gauche, au-dessus** de la barre scénario (plus en bas à droite dessous). Bouton « Voir tout » : scroll vers la colonne scénario. Main : transition sur margin-right pour que l’ouverture du panneau terminal ne « couvre » pas le contenu ; rappel dans la roadmap (contenu non couvert).
- **2026-02-13** : **Backlog** : cibles **Windows Server, AD, DHCP** (platform/docs/05-CIBLES-A-FAIRE.md, roadmap, targets, scenarios, challenges, vuln-network). **Terminal PiP** : drag stabilisé (deps réduites, refs) pour éviter scintillement et déplacements.
- **2026-02-13** : **Bug recherche topbar** : le champ « Rechercher scénarios, rooms, docs… » provoquait un re-render qui cassait l’affichage du terminal en panneau. Correction : contenu des onglets terminal (iframes) extrait dans un composant mémoïsé `TerminalPanelTabsContent` (preact/compat `memo`) pour ne pas re-render quand `searchQuery` change. Build : import `memo` depuis `preact/compat` (pas `preact`).
- **2026-02-13** : **Backlog** : **historique par session terminal** – chaque onglet = son propre historique (partage optionnel plus tard) ; à faire (actuellement nouvel onglet peut réafficher l’historique d’une autre session). STATUS.md mis à jour (système maison, bug recherche, suite roadmap).
- **2026-02-13** : **Prédéfinitions à la création du lab (Phase 3)** : vue Labs – sélection optionnelle des packs à la création et à l’édition du lab (`lab.packIds`) ; au démarrage d’un scénario, si le lab actif (non défaut) n’a pas de packs, application des packs recommandés du scénario (`labToolPresets.byScenario`). Doc 04-PHASE3-OUTILS.md et roadmap mises à jour.
- **2026-02-20** (branche `feature/phase3-conteneur-attaquant`) : **Terminal PiP** : position absolue (left/top), spawn bas-droite, drag par pas de 5 px, z-index 99999 ; conteneur **div + object** (au lieu d’iframe) pour le rendu ; persistance position par lab. **Panneau terminal** : suppression double barre de défilement (overflow hidden sur body/content/tab-pane/iframe-wrap) ; **numéro de session** visible sur les onglets (PiP et panneau vertical). **Rechargement** : nouvelle session côté backend (`sessionId-rN`) pour éviter écran vide et erreur PTY à la déconnexion. **Scénario** : application des packs recommandés aussi à la **reprise** (handleResumeScenario) ; ouverture fiable du panneau terminal depuis le scénario (`setTerminalPanelEverOpened(true)` dans openTerminalPanel). **UX scénarios** : section « Terminal attaquant et cibles » avec clarification (terminal = attaquant pour sqlmap/curl ; cibles = navigateur ou à attaquer) ; lien « Ouvrir DVWA (navigateur) » sur la carte DVWA ; **Scénario 2 (SQLi DVWA)** : champ `howto` + tâches numérotées et explicites (1–3 dans le navigateur DVWA, 4 dans le terminal attaquant), encadré « Comment faire » en tête de scénario.
- **Principes UX à réutiliser sur les autres scénarios / projets** : (1) **Distinguer clairement** : cible (app web/API à ouvrir dans le navigateur) vs **terminal attaquant** (panneau/PiP/onglet – même conteneur, commandes). (2) **Ordre des étapes explicite** : indiquer où faire quoi (« dans le navigateur », « dans le terminal attaquant »). (3) **Un seul terminal « attaquant »** : les boutons « Ouvrir le terminal » ouvrent toujours ce terminal (pas de « terminal DVWA »). (4) **Documenter** les modifs et principes dans ROADMAP-SYSTEME-MAISON.md et STATUS.md pour appliquer la même logique ailleurs.
