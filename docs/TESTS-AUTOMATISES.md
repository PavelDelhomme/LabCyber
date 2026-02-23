# Tests automatisés – Lab Cyber

Ce document décrit la suite de tests exécutée par `make test` (script `scripts/run-tests.sh`), ce qu’elle couvre et ce qu’elle ne couvre pas.

---

## Lancement

- **Tous les tests** (sans exiger le lab) :  
  `make test`

- **Avec rapport écrit** dans un fichier :  
  `TEST_REPORT=test-results.txt make test`  
  ou :  
  `make test-report`  
  Le fichier `test-results.txt` à la racine du projet reçoit un résumé (succès/échec + date).

- **Exiger que le lab soit démarré** (échoue si les conteneurs ne tournent pas) :  
  `TEST_REQUIRE_LAB=1 make test`

- **Sans lab** : les tests 0, 1, 7, 8, 13 et 14 (structure, JSON, logs, hostnames, plateforme, couverture absolue) s’exécutent ; les tests 2–6, 9–12 sont skippés.

- **Avec lab** (`make up` puis `make test`) : tous les tests 0–14 s’exécutent, y compris HTTP, réseau, terminal, vuln-api, /data/docs.json, POST /api/login.

---

## Blocs de tests (0 à 14) – couverture maximale

| Bloc | Description détaillée |
|------|------------------------|
| **[0/14]** | **Structure complète** : racine, gateway, scripts, attacker/vuln-network/vuln-api/lab-terminal ; platform index, app.js, logger, terminal-client.html ; data (rooms, scenarios, config) ; **16 vues** ; **11 composants** ; App.jsx, main.jsx, lib/store.js, **lib/defaultData.js, public/storage.js, vite.config.js, platform/Dockerfile, style.css** (css/ ou src/). |
| **[1/14]** | **JSON** : rooms, scenarios, config, toolPacks, labToolPresets ; structure scénarios ; labToolPresets.byScenario ; docSources (sources) ; challenges ; docs (entries). |
| **[2/14]** | Conteneurs : tous les services en état `running`. |
| **[3/14]** | **HTTP Plateforme** : /, /data/* (rooms, scenarios, config, learning, targets, docSources, challenges), /cible/dvwa/. |
| **[4/14]** | HTTP Cibles (Host) : api.lab, dvwa.lab, juice.lab, bwapp.lab. |
| **[5/14]** | Réseau : attaquant → vuln-network (SSH). |
| **[6/14]** | Logs vuln-api. |
| **[7/14]** | Logs frontend : logger.js, app.js, index.html. |
| **[8/14]** | Config hostnames. |
| **[9/14]** | Route terminal : Host: terminal.lab → 200. |
| **[10/14]** | Fichiers plateforme : /, data/rooms.json. |
| **[11/14]** | Terminal + Phase 3 : store (getTerminalUrl, session, contrat lab/terminal/progression/simulateur/capture/proxy/API), toolPacks, labToolPresets, lab-terminal, gateway → attaquant:7682. |
| **[12/14]** | Docs (ROADMAP, CIBLES, Phase3, STATUS), getMachineUrl, gateway /cible/*, scénarios urlKey, attaquant build, abandon scénario, vues clés. |
| **[13/14]** | Plateforme complète : targets, learning, docSources, challenges, toutes vues/composants, App routes, main.jsx, vuln-api /api/health, /api/products, /api/users/1. |
| **[14/14]** | **Couverture absolue** : **storage.js** (getLabs, getCurrentLabId, clés IndexedDB) ; **defaultData.js** (données embarquées) ; **docker-compose** (gateway, platform, attaquant, vuln-api, vuln-network) ; **gateway** (location /terminal-house/, server_name api.lab, terminal.lab) ; **rooms.json** (structure rooms/categories) ; **toolPacks** (au moins un pack) ; **HTTP /data/docs.json** (si lab up) ; **vuln-api POST /api/login** (si lab up). |

---

## Ce que les tests ne font pas (E2E / manuel)

La couverture vise **tout ce qui est vérifiable sans navigateur** (fichiers, JSON, HTTP, store, gateway, vues/composants présents). Reste à valider à la main ou en E2E :

- **Interface** : clics, navigation, panneaux (ouverture/fermeture), PiP (drag, onglets), barre scénario, menu Ouvrir, Lab dropdown.
- **Flux métier** : démarrage scénario → lab dédié → terminal → cible ; progression (tâches validées) ; engagements ; enregistrement CVE par lab.
- **Requêtes API depuis l’app** : envoi réel depuis ApiClientView (les tests vérifient seulement que vuln-api répond en curl).
- **Capture pcap** : chargement .pcap, analyse, filtres.
- **Simulateur réseau** : création/édition de cartes, liens (persistance testée via store, pas en conditions réelles).
- **Proxy** : configuration et trafic.
- **Doc & Learning** : recherche, sync hors ligne, IndexedDB.
- **Packs dans le terminal** : outils effectivement disponibles dans le shell du lab (les tests vérifient les JSON seulement).

---

## Targets (catalogue des cibles)

Les fichiers **`platform/data/targets.json`** et **`platform/public/data/targets.json`** définissent le **catalogue des cibles** du lab (DVWA, Juice Shop, bWAPP, vuln-api, vuln-network, etc.). Ce ne sont pas des dossiers « targets » mais des **fichiers JSON** avec une clé `targets` (liste d’objets : id, name, type, url, credentials, etc.). Le test [13/13] vérifie qu’au moins un de ces fichiers existe, est valide et contient au moins une cible.

---

## vuln-network et vuln-api

- **vuln-network** : testé indirectement via [5/13] (attaquant → vuln-network, SSH). Opérationnel si les conteneurs sont up.
- **vuln-api** : testé via [4/13] (api.lab 200) et [13/13] (`/api/health`, `/api/products`, `/api/users/1`) lorsque le lab est démarré. Opérationnel si les réponses HTTP sont 200 (ou 401 si auth requise).

---

## Rapport

- Avec `TEST_REPORT=<fichier> make test` (ou `make test-report`), un résumé est **ajouté** à la fin du fichier indiqué (succès ou échec + date). Pour un rapport propre à chaque run, rediriger aussi la sortie :  
  `make test 2>&1 | tee test-results.txt`

---

*Dernière mise à jour : février 2026.*
