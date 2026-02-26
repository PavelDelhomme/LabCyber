# État du projet Lab Cyber

Ce fichier liste ce qui reste à faire en priorité, puis les améliorations, et en fin la liste des éléments déjà réalisés.

**Phase actuelle** : **Phase 3** (conteneur attaquant, packs/prédéfinitions, terminal par lab, barre scénario, cibles /cible/*). Prochaine : Phase 4 (bureau fait maison), Phase 5 (interconnexion complète, reprise lab). Voir [docs/ROADMAP-SYSTEME-MAISON.md](docs/ROADMAP-SYSTEME-MAISON.md).

---

## Ce que vous devez faire précisément

- **Tests** : **`make tests`** lance tout (lab up + tests automatisés + tests complets + E2E) et génère les rapports (test-results.txt, test-full-results.txt, E2E dans playwright-report/). Sinon : `make test` (15 blocs), `make test-full` (lab requis), **`make test-e2e`** (Playwright — **reconstruit la plateforme** avant de lancer les tests pour que l’UI simulateur, bâtiments, tous les types d’appareils soit à jour). Rapport seul : `make test-report` ou `make test-full-report`. Voir [docs/TESTS-AUTOMATISES.md](docs/TESTS-AUTOMATISES.md) et [docs/TESTS-E2E.md](docs/TESTS-E2E.md).
- **Voir les modifs du simulateur (ou de la plateforme) dans le navigateur** : l’app servie par Docker est celle **construite dans l’image**. Après avoir modifié le code (simulateur, bâtiments, types d’appareils, etc.), il faut **reconstruire la plateforme** : `docker compose build platform && docker compose up -d` (ou `make restart-clean`). Sinon tu continues à voir l’ancienne version (ex. seulement PC, Routeur, Switch, Serveur).
- **Targets** : les cibles (DVWA, Juice, vuln-api, vuln-network, etc.) sont enregistrées dans **`platform/data/targets.json`** et **`platform/public/data/targets.json`** (catalogue JSON, clé `targets`). Ce n’est pas un dossier « targets » mais des **fichiers de catalogue** utilisés par Engagements et Dashboard.
- **vuln-network / vuln-api** : opérationnels quand le lab est up. vuln-api est testé (api.lab, `/api/health`, `/api/products`, `/api/users/1`) ; vuln-network est testé via attaquant → SSH. Améliorations possibles : plus de routes API, plus de services dans vuln-network, selon les scénarios.
- **Packs d’outils** : les packs sont des **métadonnées** (`toolPacks.json`, `labToolPresets.json`, `labToolPresets.byScenario`). Les **outils sont déjà dans l’image attaquant** (Kali). Le terminal ouvert dans le lab = shell du lab actif (conteneur attaquant) ; les packs recommandés par scénario sont appliqués à la création du lab (lab dédié au scénario).
- **Interconnexions** : en place — terminal lab, lab du scénario, barre scénario, cibles via `/cible/*`, gateway → attaquant. À renforcer : simulateur ↔ lab, capture ↔ lab, requêtes API ↔ lab, progression via scénario (tâches/validation), proxy ↔ lab.

---

## Couverture des tests (make test)

La suite `make test` vise la **couverture la plus totale possible sans E2E** (sans navigateur). Elle vérifie :

- **[0]** Structure complète : racine, gateway, scripts TUI, attacker/vuln-network/vuln-api/lab-terminal, **16 vues**, **11 composants**, App.jsx, main.jsx, store.js, **defaultData.js, storage.js (public), vite.config.js, platform/Dockerfile, style.css**, index/html/app/logger, data (rooms, scenarios, config), terminal-client.html.
- **[1]** JSON : rooms, scenarios, config, toolPacks, labToolPresets (structure + byScenario), **docSources** (sources), **challenges**, **docs.json** (entries).
- **[2]** Conteneurs tous running.
- **[3]** HTTP plateforme : /, /data/* (rooms, scenarios, config, **learning, targets, docSources, challenges**), /cible/dvwa/.
- **[4]** HTTP cibles (api.lab, dvwa.lab, juice.lab, bwapp.lab).
- **[5]** Réseau attaquant → vuln-network (SSH).
- **[6]** Logs vuln-api.
- **[7]** Logs frontend (logger.js, app.js, index.html).
- **[8]** Config hostnames (platform, dvwa, juice, api, bwapp, terminal).
- **[9]** Route terminal (Host: terminal.lab).
- **[10]** Fichiers plateforme (/, data/rooms.json).
- **[11]** Terminal Phase 3 : getTerminalUrl (session), **store (lab, terminal, progression, simulateur, capture, proxy, API)**, toolPacks, labToolPresets, lab-terminal, gateway → attaquant.
- **[12]** Docs (ROADMAP, CIBLES, Phase3, STATUS), getMachineUrl, **gateway /cible/* (dvwa, juice, api, bwapp)**, scénarios urlKey, attaquant build, abandon scénario, vues clés.
- **[13]** Plateforme complète : targets, learning, docSources, challenges, toutes les vues et composants, App routes, main.jsx, vuln-api /api/health, /api/products, /api/users/1.
- **[14]** **Couverture absolue** : storage.js, defaultData.js, docker-compose (5 services), gateway (terminal-house, api.lab, terminal.lab), rooms/toolPacks, HTTP /data/docs.json, vuln-api POST /api/login.
- **[15]** **Système lab complet** : **bureau VNC** (gateway /desktop, docker-compose desktop, HTTP /desktop) ; **proxy** (docker-compose proxy, store getProxies/setProxies) ; **capture pcap** (CaptureView pcap/capture/upload, store getCaptureState/setCaptureState) ; **simulateur réseau** (NetworkSimulatorView carte/simulation/topology, store get/setNetworkSimulations) ; **progression** (ProgressionView tâches, store getTaskDone/getScenarioStatus) ; **cours/Learning** (LearningView, learning.json) ; **docs** (DocOfflineView, DocsView, docSources.json) ; **cibles** (targets.json).

**Ce que les tests ne font pas (E2E / manuel)** : comportement UI (clics, panneaux, PiP, navigation), flux métier complets (scénario → lab → terminal → cible, progression, engagements, CVE), envoi réel de requêtes depuis ApiClientView, chargement/analyse .pcap, création de cartes dans le simulateur, config proxy, recherche/sync Doc & Learning, vérification des outils dans le shell du lab. Pour cela : tests manuels et/ou E2E (Playwright/Cypress).

---

## À faire maintenant : analyser / tester quoi

Après `make test` (15 blocs verts), à faire **à la main** ou en E2E :

| À analyser / tester | Où / comment |
|--------------------|-------------|
| **Terminal** | Ouvrir le panneau terminal, plusieurs onglets, PiP, exit, rechargement (replay des sorties). Vérifier que le lab actif = shell attaquant (Kali). Au **démarrage** d’un scénario le terminal passe en « Lab actif » (scénario) ; à l’**abandon** on revient au lab par défaut. |
| **Barre scénario** | Démarrer un scénario → barre en bas visible, avancement des tâches (fait / en cours). **Abandon scénario** → lab actif repasse au **lab par défaut** (plus le lab du scénario). Désactiver le lab (choisir lab par défaut) → terminal affiche le lab par défaut. |
| **Cibles navigateur** | Depuis un scénario ou Engagements : ouvrir DVWA, Juice, bWAPP via /cible/* (même origine). Vérifier que les pages se chargent. |
| **Requêtes API (Postman-like)** | Vue Requêtes API : envoyer GET /api/health, /api/products vers api.lab (Host). Vérifier réponses. |
| **Capture pcap** | Ouvrir la vue Capture, charger un fichier .pcap (capturé sur ton PC). Vérifier colonnes, filtre, détail. |
| **Simulateur réseau** | Ouvrir la vue Simulateur : **Nouvelle carte** ou sélecteur de carte, **placer** des nœuds (PC, routeur, pare-feu, AP, cloud, etc.), **changer le type** d’un appareil déjà placé (panneau Configuration → « Type d’appareil »), **nommer** (champ « Nom (comme Packet Tracer) »). **Relier** 2 appareils (bouton Relier). **Bâtiments** : « Bâtiments / Zones », « Nouveau bâtiment », sélection de zone. Panneau droit : Infos, Config (DNS serveur, SSID AP, L2/L3 routeur/switch), Terminal (nslookup/dig). **Cartes existantes** : migrées automatiquement (champs routerLayer, buildingId, etc.). Persistance par lab. |
| **Proxy** | Vue Proxy : configurer un proxy (ex. Squid du lab si `make proxy`). Vérifier que les requêtes passent par le proxy. |
| **Bureau VNC** | Avec lab up : ouvrir http://127.0.0.1:4080/desktop/ → noVNC (bureau distant). Vérifier connexion WebSocket. |
| **Cours / Learning** | Vue Doc & Cours : parcourir thèmes, ouvrir un doc/cours. Vérifier sync hors ligne si activé. |
| **Docs / Bibliothèque** | Vue Bibliothèque doc : recherche, ouverture d’un doc. Vérifier docSources.json chargé. |
| **Progression** | Scénario en cours : cocher une tâche comme faite. Vérifier que la progression est enregistrée (rechargement). |
| **CVE** | Recherche CVE (NVD), afficher un résultat dans le panneau. (À améliorer : enregistrement par lab.) |
| **Packs outils** | Créer un lab avec un scénario qui a des packs recommandés. Ouvrir le terminal du lab : vérifier que les outils (nmap, sqlmap, etc.) sont disponibles. |

**Résumé** : les tests automatisés (**`make test`**) couvrent **fichiers, JSON, HTTP, store, gateway, vues présentes** (15 blocs). L’**interaction utilisateur** est couverte par les **tests E2E** (**`make test-e2e`**) : Navigation, Terminal (panneau), toutes les vues, barre scénario, cibles, bureau VNC, Bibliothèque doc, Progression, Capture, API client. **E2E Simulateur** (`views-detail.spec.js`) : canvas, toolbar, **sélecteur de carte + Nouvelle carte**, Bâtiments / Nouveau bâtiment, **Relier (liaison)**, Routeur/Switch (L2/L3), **placement d’un PC + sélection + panneau Configuration (Type d’appareil, Nom)**. **À vérifier** : tous les tests E2E ne sont pas encore validés en CI (environnement Docker) ; exécuter **`make test-e2e`** régulièrement et corriger les éventuels échecs (scroll + data-testid sim-buildings / sim-toolbar-devices pour le simulateur). **Prochaines étapes après simulateur** : **Requêtes API (Postman)** et **Capture pcap** (trafic réel, analyse, lien optionnel avec simulateur/lab). Suite complète : **`make tests`**. Voir [docs/TESTS-E2E.md](docs/TESTS-E2E.md).

---

## Reste à faire pour continuer le projet

**Note TUI** : À terme, toutes les fonctionnalités (plateforme web, simulateur, terminal, capture, proxy, scénarios, etc.) devront être intégrées en **TUI** (Terminal User Interface) pour une utilisation en ligne de commande. À planifier (module TUI ou client CLI).

Liste **actionnable** pour avancer après les tests :

1. **Priorité immédiate** (voir section PRIORITÉ ci-dessous)  
   - Simulateur réseau : persistance carte/lab, design, types d’appareils, carte par défaut avec Kali.  
   - Panneaux : Capture / Simulateur / Proxy / API en panneau depuis le lab actif.  
   - CVE : enregistrement par lab, affichage par ID.  
   - Panneau scénario : affichage avancement tâches (fait / en cours).

2. **Interconnexions**  
   - Lier explicitement simulateur ↔ lab (carte = lab actuel).  
   - Lier capture ↔ lab (capture dans le lab actuel).  
   - Lier requêtes API ↔ lab (base URL selon lab/cible).  
   - Progression : mise à jour automatique quand une tâche est validée.  
   - **Plus tard (à voir bien plus tard)** : permettre **optionnellement** de connecter le **panneau terminal du lab** aux **scénarios en cours** (terminal dédié au scénario, commandes en contexte, etc.) ; lier le reste (capture, proxy, API) au scénario si souhaité. À préciser selon les besoins pédagogiques.

3. **Doc & Learning**  
   - Panneau Doc/Cours en panneau droit (sans quitter la page).  
   - PDF dans la Bibliothèque doc.  
   - Sync doc et données learning à jour.

4. **Qualité & robustesse**  
   - Tester à la main : terminal (onglets, PiP, rechargement), barre scénario, abandon scénario, cibles navigateur.  
   - **Tests E2E** : les ~200+ tests E2E ne couvrent pas encore tous les parcours ; exécuter **`make test-e2e`** régulièrement, corriger les échecs et ajouter les scénarios manquants (simulateur : plusieurs cartes, liaison, changement de type ; API client ; capture pcap).

5. **Contenu**  
   - Compléter scénarios (howto, tasks, urlKey), ajouter scénarios SIP/téléphonie si besoin.  
   - Vuln-api / vuln-network : ajouter routes ou services selon les scénarios.

**Prochaines étapes après simulateur** : **Requêtes API (Postman-like)** — champs, historique, lien au lab/cible ; **Capture pcap** — trafic réel, analyse avancée, lien optionnel au simulateur/lab. Puis interconnexions (simulateur ↔ lab, capture ↔ lab).

Ensuite : Phase 4 (bureau fait maison), Phase 5 (interconnexion complète, reprise lab), voir [docs/ROADMAP-SYSTEME-MAISON.md](docs/ROADMAP-SYSTEME-MAISON.md).

---

## 🚨 PRIORITÉ (à traiter en priorité)

*Uniquement ce qui reste à faire. Les points déjà corrigés sont listés en bas dans « Réalisé ».*

### Système maison (terminal + environnement lab)

**Vision** : **système maison** complet – voir [docs/ROADMAP-SYSTEME-MAISON.md](docs/ROADMAP-SYSTEME-MAISON.md). En résumé :
- **Conteneur attaquant** : autant d’outils que Kali (voire plus, ex. Black Arch) + **sélection de packs** + **outils de base** + **prédéfinitions à la création du lab** (outils nécessaires au lab/scénario).
- **Terminal** : plusieurs terminaux par lab ; **historique + sorties conservés** ; à la **reprise d’un lab**, tout retrouver (terminaux, commandes, résultats).
- **Bureau** : **vrai bureau** léger, **fait maison** (pas noVNC/XFCE lourd).
- **Interconnexion** : simulateur réseau, capture pcap, requêtes API, terminal lab, client graphique web – **tous connectés au lab**.
- **Scénario** : au démarrage (lab connecté, lab par défaut), **installation des outils nécessaires** au lab pour ce scénario.
- **Reprise lab** : **ne rien perdre** – terminaux, historique, sorties, panneaux, comme c’était.

- **Court terme** : fait (Phase 1) – terminal panel, backend lab-terminal, exit, resize.
- **Moyen terme** : Phase 2 faite (persistance par lab + sorties PTY). **Phase 3** : config packs + **prédéfinitions à la création du lab** (sélection des packs à la création/édition, `lab.packIds` ; au démarrage scénario, application des packs recommandés au lab si vide). Puis Phase 4 (bureau fait maison), Phase 5 (interconnexion, reprise lab complète).

**Scintillement** : pour le moment plus de scintillement signalé (à surveiller). Si ça revient, désactiver `contain`/`translateZ(0)` et vérifier avec React DevTools Profiler.

### Terminal web attaquant (panneau et PiP)

- **Backend** : lab-terminal (Go, PTY + WebSocket), route `/terminal-house/`, client `?path=terminal-house`. **Correction 502** : le binaire lab-terminal est compilé avec un builder **glibc** (Debian/bookworm) au lieu d’Alpine (musl), pour s’exécuter correctement dans le conteneur Kali. En cas de 502 au démarrage : `make rebuild` ou `docker compose build --no-cache attaquant && docker compose up -d` ; `make terminal-check` pour vérifier que le backend répond.
- **Sessions** par onglet (`?session=<tabId>`).
- **Panneau terminal** : onglets, resize (poignée, curseur col-resize), exit → fermeture de l’onglet. **Exit fonctionne** : le client envoie `postMessage({ type: 'lab-cyber-terminal-exit' })` à la fermeture du WebSocket, l’app ferme l’onglet concerné. Le reste du panneau (onglets, journal, largeur) est opérationnel. **Recherche topbar** : le champ « Rechercher scénarios, rooms, docs… » ne casse plus l’affichage du terminal (contenu des onglets mémoïsé via `TerminalPanelTabsContent`).
- **Persistance par lab** : liste des onglets, onglet actif, journal de session (notes/commandes enregistrées), largeur du panneau, état PiP (ouvert/fermé, onglets PiP, position) – tout est **sauvegardé par lab** et restauré au changement de lab ou au rechargement de la page (côté app).
- **Journal complet** : bouton Journal & Stats → « Journal complet (par lab) » : consultation par lab et par scénario ; les notes du panneau terminal sont aussi enregistrées dans ce journal (type note, sessionId, scenarioId).
- **PiP** : persistance par lab (ouvert/fermé, onglets, position, minimisé) ; restauration à la reprise du lab. Position **absolue** (left/top), spawn bas-droite, **drag par pas de 5 px** ; z-index 99999 ; conteneur **div + object** (plus iframe) pour le rendu. Voir roadmap (2026-02-20) pour le détail.
- **Historique par session** : fait – chaque onglet a son propre buffer (sessionID) ; frontend envoie toujours session dans l’URL ; test 11 vérifie.

**Ce qui est enregistré côté app**  
- Par **lab** : onglets terminal (noms, nombre), onglet actif, journal de session (lignes ajoutées à la main), largeur panneau, état PiP (ouvert, onglets, position, minimisé), scenarioId en vue scénario. Restauré au rechargement et au changement de lab.

**Rechargement de la page**  
- **Sorties PTY persistées** : le backend lab-terminal enregistre les sorties par session (`?session=<tabId>`) et les renvoie au reconnect (replay). Le client `terminal-client.html` envoie le paramètre `session` dans l’URL du WebSocket. Au rechargement, chaque onglet retrouve son historique affiché (scrollback, commandes et sorties). Buffer limité à 512 Ko par session.
- **Exit** : implémenté et opérationnel (panneau et PiP).
- **Double-clic sur un onglet** : ouvre le renommage (délai 500 ms entre deux clics pour distinguer clic simple / double-clic).

### Panneaux et lab

- **Panneau terminal rétracté** : marge à droite pour que Options, Stats, Journal, CVE restent visibles et cliquables.
- **Lab actif – Ouvrir en panneau** : Simulateur, Proxy, Requêtes API, Capture en panneau ; onglets horizontaux (Terminal, Capture, Doc).
- **Session par lab** : panneaux ouverts enregistrés par lab.

### Simulateur réseau (à faire correctement – beaucoup manquant)

- **Persistance des cartes** : carte courante persistée avant changement de carte (select) et avant changement de lab. **Sans carte** : une **Carte 1** est créée automatiquement à l’ouverture du simulateur (pour que la barre d’outils, Bâtiments et types d’appareils soient toujours disponibles). **Migration** : `migrateNode` pour les anciennes topologies.
- **Améliorations récentes (UI)** : **Supprimer un appareil** : bouton « Supprimer cet appareil » dans le panneau droit (Configuration) quand un nœud est sélectionné ; touche Suppr ou bouton « Supprimer le nœud » dans la barre d’outils. **Modèle** : affiché sur une ligne dédiée sous le titre du panneau et dans la section Informations. **Catégorie / placement** : quand une catégorie (ex. PC) est sélectionnée pour le placement, un hint indique « Clique sur la carte pour placer. Pour modifier ou supprimer un appareil, clique sur l’appareil sur la carte. »
- **À faire encore (simulateur)** : rendre plus clair quel appareil est sélectionné (feedback visuel) ; afficher le modèle sur la carte (sous le nom) si souhaité ; éviter que le clic sur une catégorie ne prête à confusion (bien distinguer mode placement vs sélection) ; export/import topologie ; validation de topologie ; CLI étendue par type ; lien simulateur ↔ lab réel.
- **Zoom** : **boutons − / + / 100%** au-dessus de la carte ; molette sur la zone carte ; pan au glisser.
- **Liaisons** : **cliquer sur une liaison** ouvre le panneau **Liaison** (de/vers, type de câble, **ports Fa0/X et Fa0/Y** éditables, **Supprimer la liaison**). Les ports sont affichés sur le trait.
- **Nouvelle carte** : pouvoir personnaliser (nom, contexte) dès la création.
- **Design** : le **titre/nom** de l’appareil (ex. « PC ») est **décalé** par rapport au centre du bloc ; ajouter des **éléments visuels minimal** pour distinguer routeur, PC, switch, serveur (icônes ou formes spécifiques).
- **Types d’appareils** : PC, Routeur, Switch, Serveur, Pare-feu, AP, Cloud, Modem, Hub, Bridge, Backbone, Téléphone IP, Imprimante, Tablette, Caméra IP — avec **changement de type après placement** (panneau Configuration → « Type d’appareil », comme Packet Tracer) et **nommage** (champ « Nom (comme Packet Tracer) »).
- **Modèles par type** : plusieurs modèles pour Pare-feu (Cisco ASA, pfSense, FortiGate, Palo Alto), Point d’accès (Cisco WAP, UniFi, Aruba, Ruckus), Cloud (WAN, FAI, Datacenter), etc.
- **Types de liaisons** : étendre au-delà d’Ethernet/Console/Fibre — **WiFi**, **données mobiles**, **RJ12**, etc. pour modéliser des liens réalistes.
- **Carte et lab par défaut** : une **carte par défaut** avec au moins la **machine Kali (attaquant)** connectée, pour tester les intrusions dans les systèmes virtuels créés ; contexte « lab actuel » ou lab choisi, connecté au simulateur.
- **Liaisons** : clic sur une liaison ouvre le panneau (ports Fa0/X éditables, supprimer). **À faire** : connexions logiques par type d’appareil (PC : WiFi/Bluetooth ; routeur : pas de Bluetooth).
- **Routeur / équipements** : **modèle** (Cisco, HP, Juniper, etc.) ; **niveau L2 ou L3** pour le routeur (config « Niveau (couche) ») ; **commutateur (switch) L2 ou L3** avec libellés clairs (L2 = MAC, L3 = routage IP) ; configuration **ultra poussée mais compréhensible** par type d’appareil ; CLI simulée (terminal) par nœud.
- **Capture pcap** : pouvoir indiquer que la capture s’exécute **dans le lab actuel** ou dans un lab donné ; lien clair simulateur ↔ lab ↔ capture.
- **Scénarios à ajouter plus tard** : scénarios **SIP** et **téléphonie** (VoIP, etc.) en plus des scénarios existants.

#### Roadmap : simulateur ultra perfectionné (objectif au-delà de Packet Tracer)

*Liste exhaustive des éléments à ajouter pour un simulateur d'infrastructure de A à Z, avec bâtiments, couches, applicatif et connexions réelles.*

**Placement et disposition**
- [x] Placement au clic sur la carte (clic type puis clic carte).
- [x] Glisser-déposer pour déplacer les nœuds.
- [x] Zoom et pan sur la carte (molette : zoom, glisser le fond : pan).
- [x] Grille magnétique optionnelle (case « Aligner à la grille », pas 20 px).
- [x] Raccourcis clavier (Suppr / Backspace : supprimer le nœud sélectionné, Échap : annuler mode placement/liaison/sélection).

**Bâtiments et couches physiques**
- [x] **Bâtiments / salles** : conteneurs (bâtiment A, salle serveurs, étage) — liste déroulante « Placer dans », chips par bâtiment (renommer, supprimer), nouveaux nœuds reçoivent `buildingId` ; affichage du bâtiment dans le panneau Infos.
- [ ] **Câblage réel** : chemins de câbles le long de murs/plafonds (visualisation L1), longueur, type de câble par segment.
- [ ] **Rack / baie** : disposition en baie (U), position en U pour serveurs et switches.

**Types d'appareils (étendre)**
- [x] Téléphone IP, tablette, smartphone (phone, tablet) ; pare-feu (firewall), point d'accès (ap), cloud, modem, hub, bridge, backbone, imprimante (printer), caméra IP (camera) — avec modèles (Cisco, HP, Juniper, etc.) et config par type (DNS serveur, SSID AP, placeholder règles pare-feu).
- [ ] IDS/IPS, load balancer ; contrôleur WLC.
- [ ] **Bluetooth** : nœud Bluetooth, liaison Bluetooth (portée, couche applicative simulée).

**Types de câbles et liaisons (étendre)**
- [x] Cuivre : droit, croisé, rollover ; Fibre : monomode, multimode ; Console : RJ-45, Série DTE-DCE ; Sans fil : WiFi 2,4 / 5 GHz (catégorisés dans l'UI).
- [ ] RJ11, RJ12, Coax ; SFP, longueur de câble ; USB-console ; Bluetooth, LoRa, 4G/5G.

**Couches réseau et protocoles**
- [x] Indicateur de couche par nœud (L1/L2/L3).
- [ ] Indication de la couche sur les liens (L1 physique, L2 Ethernet, L3 IP).
- [x] Simulation de paquets : **play / pause / arrêt**, animation le long des liaisons.
- [ ] Vitesse réglable, choix du lien à animer.
- [ ] Visualisation des paquets : type (ARP, ICMP, TCP, UDP), couleur par protocole.
- [ ] Mode « simulation pas à pas » : avancer d'un saut (routeur → routeur) au clic.

**Applicatif et services**
- [ ] **Couche applicative** : par appareil, configurer des services (HTTP, DNS, SSH, etc.) et les lier à des « utilisateurs » (PC) qui les utilisent.
- [ ] **Scénarios de trafic** : « PC1 ping PC2 », « PC1 ouvre http://serveur-web » → génération de paquets simulés et tracé du chemin.
- [ ] **DNS / DHCP simulés** : serveur DHCP dans le simulateur, résolution DNS interne (noms d'hôtes → IP).
- [ ] **VLAN** : configuration VLAN par interface (switch, routeur), étiquetage 802.1Q sur les liens.

**Connexions et tests**
- [ ] **Vraie connexion** : option « lier au lab » : un nœud du simulateur = une cible du lab (DVWA, api.lab, etc.) ; le terminal du lab peut ping/configurer en cohérence avec la topologie.
- [ ] **Test de connectivité** : bouton « Tester » sur un lien (simulation ping ou check L2/L3).
- [ ] **Validation de topologie** : détection d'erreurs (boucle, mauvaise config IP, câble inadapté PC–PC sans croisé).

**Export, import, partage**
- [ ] Export de la topologie (JSON, image PNG/SVG).
- [ ] Import de topologie (JSON).
- [ ] Modèles / templates de topologies (DMZ, petit bureau, datacenter).

**Terminal et CLI par appareil**
- [x] Terminal simulé par nœud (ipconfig, ping, show ip route, show running-config, help).
- [ ] Étendre la CLI : plus de commandes Cisco/HP (ACL, NAT, VLAN, OSPF minimal).
- [ ] Mode « enable » / « config » avec prompt différent (Router#, Router(config)#).

**Documentation et aide**
- [ ] Infobulle par type de câble (quand utiliser droit vs croisé).
- [ ] Aide intégrée (raccourcis, bonnes pratiques).
- [ ] Lien vers la doc projet (topologie, capture, lab) depuis le simulateur.

### Avertissements connus (logs)

- **Erreur JS dans la console** : « A listener indicated an asynchronous response by returning true, but the message channel closed before a response was received » — **provoquée le plus souvent par une extension de navigateur** (Chrome/Edge), pas par le code de l’app. Si tu vois cette erreur avec `terminal-client.html` ou une autre page du lab, tu peux l’ignorer ou désactiver temporairement les extensions pour confirmer.
- **lab-vuln-network (Redis)** : « Memory overcommit must be enabled » – ce sysctl n’est pas dans un namespace isolé, donc on ne peut pas le passer au conteneur (erreur runc). Pour supprimer le warning : sur l’**hôte** : `sudo sysctl vm.overcommit_memory=1` (optionnel ; Redis fonctionne malgré le warning).
- **lab-bwapp** : « CRIT Set uid to user 0 », « WARN Included extra file » (supervisor) – attendu dans l’image actuelle (supervisor en root) ; pas bloquant.

### CVE, formulaire, capture, autre

- **CVE** : flux recherche → résultats clair ; plus tard : afficher par ID dans le panel, enregistrer les CVE (par lab).
- **Champs formulaire** : compléter `id`/`name` partout (autofill).
- **Redimensionnement panneau terminal** : poignée et listeners.
- **Panneau capture** : toggle et persistance (parfois ne s’affiche pas au premier clic).

---

## 🔲 À faire / à améliorer

### Application

1. **Terminal / bureau**  
   - Terminal = lab par défaut ; si lab actif : proposer **terminal lab actif** ou **lab par défaut**.  
   - **Historique / session terminal** : pouvoir enregistrer l’**état historique** du terminal (attaquant, lab, etc.), prendre des **notes par ligne/session**, et option pour **nettoyer** cet historique. Persistance des sessions/onglets et de l’historique des commandes si possible.

2. **Système de panneaux (côté droit)**  
   - Multi-panneaux avec onglets (Terminal, Capture, Doc, Simulateur, Proxy, API). Menu Ouvrir, barre d’icônes des panneaux actifs. Simulateur en panneau avec carte par défaut / lab.

3. **Lab actif – Ouvrir en panneau**  
   - Dans le popup Lab, « Ouvrir dans la page » doit **toujours** ouvrir en **panneau** (terminal, capture, simulateur, proxy, API), jamais en changeant la page courante ni en nouvel onglet.

4. **Terminal PiP**  
   - Plusieurs onglets, position absolue, drag 5 px, conteneur div+object. Exit → fermeture de l’onglet. Persistance par lab. **Historique par session** : à faire – chaque onglet = son propre historique (partage optionnel plus tard).

5. **CVE**  
   - Recherche : résultats dans le panel (déjà en place). À améliorer : affichage par ID dans le panel ; **enregistrer les CVE détectés** (par lab ou global) pour les consulter plus tard.

6. **Capture pcap – analyse côté client (machine du navigateur)**  
   - **À faire** : analyse complète du trafic de la **machine client** (où tourne le navigateur) : cartes réseau, WiFi, etc. — pas côté serveur/lab. **Contrainte** : le navigateur ne peut pas capturer en direct les interfaces (sécurité). Pistes : **(A)** Capturer sur son PC avec Wireshark/tcpdump/npcap, puis charger le .pcap ici (déjà possible). **(B)** À prévoir : agent/script local (npcap/libpcap) sur le client qui capture et produit un .pcap. — Déjà en panneau ou en page. S’assurer que depuis le lab actif on peut tout ouvrir en panneau.

7. **Panneau scénario (barre en bas)**  
   - Afficher l’**avancement** des tâches (fait / en cours / pas commencé), revoir le design (pas décalé à droite).

8. **Autres**  
   - Terminal : redimensionnement, réduction, persistance onglets.  
   - Capture : décodage avancé, Wireshark-like ; **analyse complète client** (voir point 6 ci-dessus).  
   - Cours pentest, vuln-network/vuln-api, doc projet, sync doc, tests, etc. (voir ancienne section « À faire » pour le détail).

### Doc & Cours / Bibliothèque doc

- **Panneau Doc** : ajouter un panneau droit « Doc & Cours » (ou onglet dans un panneau unifié) pour rechercher et lire les docs/cours sans quitter la page (comme le terminal en panneau).
- **PDF** : si une documentation récupérée est un PDF, la gérer correctement (affichage ou lien de téléchargement) dans la Bibliothèque doc.
- Sync doc automatique (déjà en place). Tests, doc & cours à compléter, données dynamiques.

### Scénarios à ajouter plus tard

- Scénarios **SIP** et **téléphonie** (VoIP, IP téléphony, etc.) en plus des scénarios actuels.
- **Scénarios data et IA (ultra poussés)** : emprisonnement de datasets, fuites de données, biais et fairness, poisoning, extraction de modèles, etc. — à concevoir et implémenter de manière approfondie.

### Infrastructure / contenu

- Outils à documenter – voir structure détaillée ci-dessous si besoin.

---

## ⚠️ À vérifier en détail

- Panneau terminal : redimensionnement, réduction, onglets, persistance.  
- Panneau capture : ouverture, fermeture, persistance.  
- Tout ce qui touche aux panneaux et à l’UI : tester en conditions réelles.

---

## 📌 Problèmes signalés (résumés)

- Panneau terminal rétracté cache les boutons topbar/FAB → marge droite en place.  
- Terminal PiP : position fixe, onglets OK ; drag reporté en backlog.  
- **Historique par session** : nouvel onglet terminal peut réafficher l’historique d’une autre session → backlog (chaque onglet = son historique, partage optionnel plus tard).  
- Lab actif : Capture / Simulateur en panneau (système de panneaux) → à faire.  
- Voir [docs/ROADMAP-SYSTEME-MAISON.md](docs/ROADMAP-SYSTEME-MAISON.md) et PRIORITÉ ci-dessus pour le détail.

---

## Où modifier quoi

| Élément              | Emplacement principal        |
|----------------------|------------------------------|
| Documentation        | `platform/docs/`             |
| Catalogue doc hors ligne | `platform/data/docSources.json` |
| Données app          | `platform/data/` (JSON)      |
| Code app             | `platform/src/`              |
| Doc servie           | Copie dans `platform/public/docs/` (et dans `dist/docs/` au build) |
| Cache doc hors ligne | IndexedDB, clé `offlineDocs` (storage.js) |

---

## ✅ Réalisé (référence – à la fin pour ne pas surcharger le focus)

*Ce qui a été corrigé ou livré (à valider en test si pas encore fait).*

- **docModal** : variable définie dans `LearningView.jsx`, modale détail doc/cours au clic.
- **Popup lab bloquée** : touche **Escape** ferme le popup lab et les autres overlays (Stats, Journal, CVE, Options).
- **Lab actif – terminal** : ouverture du terminal en panneau depuis le popup lab ne referme plus le popup immédiatement (persistance via ref).
- **Journal + Stats** : un seul bouton dropdown (📋 ▼) avec Journal d’activité et Stats.
- **Panneau terminal** : onglets, resize, exit (fermeture de l’onglet) OK. Persistance **par lab** : onglets, journal de session, largeur ; restauration au changement de lab et au rechargement. **Session stable** : l’iframe du terminal ne reçoit plus `src` au re-render (src fixé une seule fois au montage) ; contenu des onglets mémoïsé pour que la **recherche topbar** ne casse plus l’affichage. Sorties PTY : buffer par session côté backend, replay au reconnect.
- **Terminal PiP** : plusieurs onglets, persistance **par lab** (ouvert/fermé, onglets, position, minimisé). Exit → fermeture de l’onglet. Restauration à la reprise du lab. Position absolue, drag 5 px, conteneur div+object (voir roadmap 2026-02-20).
- **Journal complet** : Journal & Stats → « Journal complet (par lab) » ; consultation par lab et scénario ; notes du panneau enregistrées avec sessionId et scenarioId.
- **Doc & Cours** : sous-navigation (sidebar thèmes + Doc / Cours / Outils), OWASP Top 10:2021 (catalogue + bloc Learning avec Ouvrir dans l’app / externe).
- **Bibliothèque doc** : isolation du design (`.doc-offline-content-isolated`) pour le HTML récupéré.
- **Capture pcap** : colonnes type Wireshark, filtre, détail ; notice « analyse machine client » (charger .pcap capturé sur son PC).
- Notes par lab, CVE (recherche NVD en app), terminal-full, doc `platform/docs/`, nmap (cap_add), iframe terminal, notes structurées, menu Ouvrir, Lab dropdown, actions flottantes, Options en page, Make help / restart-clean.
- **Scénario 2 (SQLi DVWA)** : ordre des étapes clarifié (1–3 dans le navigateur DVWA, 4 dans le terminal attaquant) ; encadré « Comment faire » (champ `howto`) ; lien « Ouvrir DVWA (navigateur) » ; ouverture fiable du panneau terminal depuis le scénario. Principes UX détaillés dans [docs/ROADMAP-SYSTEME-MAISON.md](docs/ROADMAP-SYSTEME-MAISON.md) (historique 2026-02-20) pour les appliquer aux autres scénarios.
- **Replay terminal après rechargement** : l’URL du terminal garde le même `session` (plus de `-rN`) pour que le backend rejoue le buffer ; paramètre `_r` force uniquement le rechargement de l’iframe.
- **Démarrer un scénario** : si lab par défaut, création automatique d’un lab dédié (« Lab – [titre scénario] ») avec packs recommandés ; une session terminal fraîche pour ce lab ; changement de lab sans état sauvegardé affiche une session fraîche (plus les anciennes sessions).
- **Ouvrir DVWA / cibles dans le navigateur** : URLs en même origine (`/cible/dvwa/`, `/cible/juice/`, etc.) ; routes ajoutées dans la gateway ; plus besoin de /etc/hosts pour tester.
- **Popup détail lab** : z-index 10000 (modal et lab-panel-overlay) pour rester au-dessus de la barre scénario et du panneau terminal (accueil, scénario, gérer les labs, proxy, capture visibles).
- **make test** : **15 blocs**, couverture maximale sans E2E. Bloc [0] : **6 specs E2E** (app, scenario, views-detail, terminal, negative, interconnexion), package.json @playwright/test, docker-compose (gateway, platform, attaquant, profil e2e). Bloc [1] : **learning.json** (structure), **targets.json** (id/name/url), **rooms.json** (structure). Bloc [2] : services attendus (gateway, platform, attaquant, vuln-api, vuln-network). Bloc [11] : store (getUiSession, setUiSession, topologies, notes, offline), **storage.js** (clés KEY_UI_SESSION, KEY_TOPOLOGIES, KEY_TERMINAL_HISTORY, KEY_CAPTURE_META). Bloc [12] : gateway /terminal-house/, /desktop, location /, /terminal/, App VIEWS et parseHash, docs/README.md, platform/docs. Bloc [14] : labToolPresets (presets/byScenario), HTTP /logger.js, /storage.js. Bloc [15] : learning.json (nombre d’entrées), labToolPresets. Rapport : `make test-report`. Voir [docs/TESTS-AUTOMATISES.md](docs/TESTS-AUTOMATISES.md).
- **Tests E2E (février 2026)** : **views-detail.spec.js** étendu : **Progression**, **Capture** (filtre Wireshark), **API client** (Envoyer), **Bibliothèque doc** (#/doc-offline). **Parcours fonctionnels** ajoutés : Doc & Cours (Learning), Documentation projet (Docs), Capture pcap (zone fichier, texte Wireshark), Simulateur réseau (canvas, toolbar), Requêtes API (méthode GET, URL, Envoyer), Config Proxy (champ URL, contenu proxy/squid). **scenario.spec.js** : barre scénario n’apparaît qu’après « Démarrer le scénario » (status in_progress) – helper `startScenarioBar()` ; tous les 10 scénarios testés pour bouton Démarrer/Préparer visible ; contenu vue (titre/howto) et abandon corrigés. **interconnexion.spec.js** et **terminal.spec.js** : clic « Démarrer le scénario » pour la barre, sélecteur `button.scenario-bar-section-terminal`, timeouts panneau terminal portés à 15–18 s. **Terminal 502** : résolu côté backend (build lab-terminal en glibc pour Kali) ; les tests E2E qui ouvrent le panneau terminal peuvent encore voir un délai ou 502 si le conteneur attaquant n’est pas encore healthy (relancer `make test-e2e` si besoin).
- **Tests négatifs renforcés (26 fév. 2026)** : **negative.spec.js** – nouveaux tests HTTP qui vérifient que les requêtes **invalides échouent correctement** : `GET /data/fichier-inexistant-xyz-123.json` renvoie **404** (pas 200) ; `GET /docs/aucun-fichier-12345.md` renvoie **404** ; `GET /api/endpoint-qui-nexiste-pas` (Host: api.lab) renvoie 404/405/502/503. Ces tests s’assurent que ce qui **ne doit pas fonctionner** échoue bien.
- **Catalogue docs.json synchronisé** : ajout des entrées **15-SIMULATEUR-EVE-NG** et **16-CVE-SCENARIOS** dans `platform/data/docs.json` et `platform/public/data/docs.json` pour que la documentation projet soit complète.
- **E2E Doc & Bibliothèque renforcés** : tests supplémentaires pour la vue Documentation (liens entrées cliquables) et la Bibliothèque doc (catégories/sources visibles).

---

*Dernière mise à jour : 26 février 2026.*
