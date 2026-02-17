# Tests du système Lab Cyber

Ce document décrit **tous les tests** du projet : ce qui est vérifié, comment les lancer, et la matrice par composant.

---

## Lancer les tests

| Méthode | Commande | Quand |
|--------|----------|--------|
| **Makefile** | `make test` | À la racine du projet |
| **Script** | `./scripts/run-tests.sh` | Idem |
| **Binaire C** | `./lab test` | Après `make lab` |
| **Exiger le lab** | `make test-full` ou `TEST_REQUIRE_LAB=1 ./scripts/run-tests.sh` | Échoue si le lab n’est pas démarré |

- **Sans lab démarré** : les tests 0, 1, 7, 8 sont exécutés (structure, JSON, logs frontend, config hostnames). Les tests 2–6, 9–10 sont **ignorés** (SKIP) avec un message.
- **Avec lab démarré** : tous les tests sont exécutés.
- **Profil minimal** : si seuls les conteneurs minimal (gateway, platform, attaquant, vuln-network, vuln-api) tournent, les tests DVWA/Juice/bWAPP sont **skippés** (SKIP profil minimal).

---

## Matrice des tests (tout le système)

| # | Catégorie | Ce qui est testé | Sans lab | Avec lab |
|---|-----------|------------------|----------|----------|
| **0** | Structure | Présence des fichiers/dossiers obligatoires : `docker-compose.yml`, `Makefile`, `gateway/`, `platform/`, `attacker/`, `vuln-network/`, `vuln-api/`, `scripts/run-tests.sh`, `platform/data/*.json`, `.env.example`, `docker-compose.minimal.yml` | ✅ | ✅ |
| **1** | JSON | Validité de `rooms.json`, `scenarios.json`, `config.json` (parse + structure) | ✅ | ✅ |
| **2** | Conteneurs | Tous les services du compose en état `running` | SKIP | ✅ |
| **3** | HTTP Plateforme | Via gateway (un port) : `/`, `/data/rooms.json`, `/data/scenarios.json`, `/data/config.json`, `/demo-phishing.html`, `/test-logs.html` → 200 | SKIP | ✅ |
| **4** | HTTP Cibles | Via gateway (Host: xxx.lab) : api.lab (vuln-api), dvwa.lab, juice.lab, bwapp.lab (skippés si profil minimal) | SKIP | ✅ |
| **5** | Réseau | Depuis le conteneur attaquant : `nmap -sV vuln-network` → port 22 SSH ouvert | SKIP | ✅ |
| **6** | Logs vuln-api | Après un GET `/api/health`, les logs du conteneur vuln-api contiennent une entrée de type request ou path `/api/health` | SKIP | ✅ |
| **7** | Logs frontend | Présence de `logger.js` (getEntries, LabCyberLogger), `app.js` (logEvent), `index.html` (log-panel, log-entries) | ✅ | ✅ |
| **8** | Config hostnames | `config.json` contient `hostnames` avec au moins : platform, dvwa, juice, api, bwapp, terminal | ✅ | ✅ |
| **9** | Route terminal | Requête avec Host: terminal.lab → 200 ou 101 (WebSocket) | SKIP | ✅ |
| **10** | Fichiers statiques | `/css/style.css` → 200 | SKIP | ✅ |

---

## Détail par composant

### Structure (0)

Fichiers et dossiers requis pour que le projet soit complet et déployable :

- Racine : `docker-compose.yml`, `Makefile`, `.env.example`, `docker-compose.minimal.yml`
- `gateway/` : `nginx.conf`, `Dockerfile`
- `platform/` : `index.html`, `js/app.js`, `js/logger.js`, `data/rooms.json`, `data/scenarios.json`, `data/config.json`
- `attacker/Dockerfile`, `vuln-network/Dockerfile`, `vuln-api/app.py`
- `scripts/run-tests.sh`

### JSON (1)

- **rooms.json** : tableau `rooms`, chaque room a `id`, `category`, `title`, etc.
- **scenarios.json** : tableau `scenarios`, chaque scénario a `id`, `title`, `tasks`, etc.
- **config.json** : objet avec `gateway`, `hostnames` (objet avec clés platform, dvwa, juice, api, bwapp, terminal).

### Conteneurs (2)

`docker compose ps --format json` : chaque ligne JSON a `State == "running"`. Si un service n’est pas running, le test échoue.

### HTTP Plateforme (3)

Toutes les URLs sont testées sur `http://127.0.0.1:${GATEWAY_PORT}` (port lu depuis `.env` ou 8080). Réponse attendue : 200.

### HTTP Cibles (4)

Requêtes avec en-tête `Host: api.lab`, `Host: dvwa.lab`, etc. sur le même port. Si le conteneur correspondant (ex. lab-dvwa) n’existe pas (profil minimal), le test pour cette cible est SKIP.

### Réseau (5)

`docker compose exec -T attaquant nmap -sV -Pn -p 22 vuln-network` ; la sortie doit contenir une ligne indiquant le port 22 ouvert (SSH).

### Logs vuln-api (6)

Un GET est envoyé vers `/api/health` (Host: api.lab), puis `docker compose logs vuln-api` est parsé pour vérifier la présence d’une ligne de log (request ou path).

### Logs frontend (7)

Vérification par `grep` du contenu des fichiers : `logger.js` (getEntries ou LabCyberLogger), `app.js` (LabCyberLogger ou logEvent), `index.html` (log-panel, log-entries, logger.js).

### Config hostnames (8)

Lecture de `platform/data/config.json` et vérification que `hostnames` contient les clés : platform, dvwa, juice, api, bwapp, terminal.

### Route terminal (9)

`curl -H "Host: terminal.lab" $GATEWAY_URL/` : code 200 ou 101 accepté (ttyd peut renvoyer 101 pour WebSocket).

### Fichiers statiques (10)

`/css/style.css` doit retourner 200.

---

## Test manuel du logger frontend

Ouvrir **http://lab.local:8080/test-logs.html** (ou le port configuré) : la page doit afficher « LabCyberLogger OK » et les entrées retournées par `getEntries()`. Le bouton « Générer un événement (ping) » ajoute une entrée. Voir [LOGGING.md](LOGGING.md).

---

## Lab minimal et tests

Le **profil minimal** (`docker-compose.minimal.yml`) ne lance que : gateway, platform, attaquant, vuln-network, vuln-api. Les conteneurs DVWA, Juice Shop, bWAPP ne sont pas démarrés. Le script de tests détecte leur absence et **ne fait pas échouer** les tests 4 pour ces cibles (il affiche SKIP). Les autres tests (0, 1, 2, 3, 5, 6, 7, 8, 9, 10) s’appliquent normalement.

Démarrer le lab minimal : `make up-minimal` ou `./lab minimal`.

---

## Binaire C `lab`

Le projet fournit un **binaire unique** en C pour piloter le lab (optionnel) :

```bash
make lab       # compile src/lab.c → ./lab
./lab help     # affiche l’aide
./lab up       # docker compose up -d
./lab down     # docker compose down
./lab status   # état détaillé : port, URLs (plateforme, terminal), puis liste des conteneurs
./lab test     # ./scripts/run-tests.sh
./lab minimal  # docker compose -f docker-compose.minimal.yml up -d
./lab shell    # docker compose exec attaquant bash
./lab web      # ouvre la plateforme (http://lab.local:PORT) dans le navigateur
./lab tui      # menu interactif : Up, Down, Status, Test, Web, Shell, Quit
```

Le binaire lit le fichier `.env` à la racine (ex. `GATEWAY_PORT`) et exécute les commandes depuis la racine du projet. Tout le contrôle du lab peut se faire via ce **bloc unique** en C.

---

## Corrections courantes

- **attaquant** : dépôt Debian `non-free` pour nikto.
- **Juice Shop** : image `latest` si un tag précis n’existe plus.
- **DVWA** : variables d’environnement `MYSQL_HOSTNAME`, `MYSQL_USERNAME` (cytopia/dvwa).
- **Redis (vuln-network)** : en cas de refus de connexion depuis l’attaquant, voir la note dans [GETTING_STARTED.md](GETTING_STARTED.md) (mode protégé).

---

## Voir aussi

- [LOGGING.md](LOGGING.md) – format des logs et tests associés  
- [00-INDEX.md](00-INDEX.md) – index de la doc  
- [USAGE.md](USAGE.md) – comment utiliser le lab (un port, hostnames, etc.)
