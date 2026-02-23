# État du projet Lab Cyber

Ce fichier liste ce qui reste à faire en priorité, puis les améliorations, et en fin la liste des éléments déjà réalisés.

---

## Ce que vous devez faire précisément

- **Tests** : lancer `make test` (14 blocs). Avec lab : `make up` puis `make test`. Rapport : `TEST_REPORT=test-results.txt make test` ou `make test-report`. Voir [docs/TESTS-AUTOMATISES.md](docs/TESTS-AUTOMATISES.md).
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
- **[14]** **Couverture absolue** : storage.js (getLabs, getCurrentLabId, clés IndexedDB), defaultData.js (données embarquées), docker-compose (gateway, platform, attaquant, vuln-api, vuln-network), gateway (terminal-house, server_name api.lab, terminal.lab), rooms.json (structure rooms/categories), toolPacks (au moins un pack), **HTTP /data/docs.json**, **vuln-api POST /api/login**.

**Ce que les tests ne font pas (E2E / manuel)** : comportement UI (clics, panneaux, PiP, navigation), flux métier complets (scénario → lab → terminal → cible, progression, engagements, CVE), envoi réel de requêtes depuis ApiClientView, chargement/analyse .pcap, création de cartes dans le simulateur, config proxy, recherche/sync Doc & Learning, vérification des outils dans le shell du lab. Pour cela : tests manuels et/ou E2E (Playwright/Cypress).

---

## Reste à faire pour continuer le projet

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

3. **Doc & Learning**  
   - Panneau Doc/Cours en panneau droit (sans quitter la page).  
   - PDF dans la Bibliothèque doc.  
   - Sync doc et données learning à jour.

4. **Qualité & robustesse**  
   - Tester à la main : terminal (onglets, PiP, rechargement), barre scénario, abandon scénario, cibles navigateur.  
   - Optionnel : ajouter des tests E2E (Playwright/Cypress) pour les parcours critiques.

5. **Contenu**  
   - Compléter scénarios (howto, tasks, urlKey), ajouter scénarios SIP/téléphonie si besoin.  
   - Vuln-api / vuln-network : ajouter routes ou services selon les scénarios.

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

- **Backend** : lab-terminal (Go, PTY + WebSocket), route `/terminal-house/`, client `?path=terminal-house`. Sessions par onglet (`?session=<tabId>`).
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

- **Persistance des cartes** : carte courante persistée avant changement de carte (select) et avant changement de lab (état du lab quitté sauvegardé). Reste : design, types d'appareils.
- **Nouvelle carte** : pouvoir personnaliser (nom, contexte) dès la création.
- **Design** : le **titre/nom** de l’appareil (ex. « PC ») est **décalé** par rapport au centre du bloc ; ajouter des **éléments visuels minimal** pour distinguer routeur, PC, switch, serveur (icônes ou formes spécifiques).
- **Types d’appareils** : pas seulement PC, Routeur, Switch, Serveur — ajouter **téléphone**, **tablette**, **firewall**, **AP WiFi**, **cloud**, etc. pour un ensemble complet type Packet Tracer.
- **Types de liaisons** : étendre au-delà d’Ethernet/Console/Fibre — **WiFi**, **données mobiles**, **RJ12**, etc. pour modéliser des liens réalistes.
- **Carte et lab par défaut** : une **carte par défaut** avec au moins la **machine Kali (attaquant)** connectée, pour tester les intrusions dans les systèmes virtuels créés ; contexte « lab actuel » ou lab choisi, connecté au simulateur.
- **Routeur / équipements** : pouvoir définir **modèle** (ex. Cisco, type) ; options plus poussées (config routeur/switch) : **interface minimal type terminal** pour configurer le routeur/PC (CLI simulée ou lien vers terminal).
- **Capture pcap** : pouvoir indiquer que la capture s’exécute **dans le lab actuel** ou dans un lab donné ; lien clair simulateur ↔ lab ↔ capture.
- **Scénarios à ajouter plus tard** : scénarios **SIP** et **téléphonie** (VoIP, etc.) en plus des scénarios existants.

### Avertissements connus (logs)

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
- **make test** : **14 blocs**, couverture maximale sans E2E (structure : defaultData, storage.js, vite, Dockerfile, CSS ; tous les JSON ; store, gateway, docker-compose ; HTTP /data/docs.json ; vuln-api POST /api/login). Bloc [14/14] couverture absolue (storage, defaultData, compose, gateway, rooms/toolPacks, docs.json, API login). Rapport : `TEST_REPORT=test-results.txt make test` ou `make test-report`. Voir [docs/TESTS-AUTOMATISES.md](docs/TESTS-AUTOMATISES.md).

---

*Dernière mise à jour : 20 février 2026.*
