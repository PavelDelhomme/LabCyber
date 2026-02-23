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

- **Avec lab** (`make up` puis `make test`) : tous les tests 0–15 s’exécutent, y compris HTTP, bureau /desktop, vuln-api, etc.

---

## Blocs de tests (0 à 15) – couverture maximale

| Bloc | Description détaillée |
|------|------------------------|
| **[0/15]** … **[14/15]** | (Idem qu’avant : structure, JSON, conteneurs, HTTP, cibles, réseau, logs, hostnames, terminal, Phase 3, docs, plateforme complète, couverture absolue.) |
| **[15/15]** | **Système lab complet** : **bureau VNC** (gateway /desktop, docker-compose desktop, HTTP /desktop si lab up) ; **proxy** (docker-compose proxy, store getProxies/setProxies) ; **capture pcap** (CaptureView + store getCaptureState/setCaptureState) ; **simulateur réseau** (NetworkSimulatorView carte/simulation/topology + store get/setNetworkSimulations) ; **progression** (ProgressionView + store getTaskDone/getScenarioStatus) ; **cours/Learning** (LearningView + learning.json) ; **docs** (DocOfflineView, DocsView, docSources.json) ; **cibles** (targets.json). |

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
