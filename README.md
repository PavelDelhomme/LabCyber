# Lab Cyber – Plateforme d’apprentissage (type TryHackMe)

Environnement **isolé** pour s’entraîner à la cybersécurité, avec **interface web** unique : **plateforme** (http://localhost:8080) pour suivre les **scénarios guidés** (style TryHackMe / HackTheBox), les rooms, accéder aux machines, télécharger les défis et consulter le **journal d’activité (logs)**. Couvre **Web, Réseau, App, Red/Blue Team, Forensique, OSINT, Stéganographie, Cryptographie, Phishing / Spam / Social Engineering**.

## Prérequis

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/) (v2+)
- Git

## Mettre ce projet sur GitHub

1. Créez un **nouveau dépôt** sur [GitHub](https://github.com/new) (sans README, sans .gitignore).
2. Puis dans ce dossier :

```bash
git remote add origin https://github.com/VOTRE_USER/LabCyber.git
git branch -M main
git push -u origin main
```

(Remplacez `VOTRE_USER` par votre identifiant GitHub.)

## Démarrage rapide

**Un seul port** pour tout le lab (gateway). Aucun conflit avec les ports déjà utilisés sur ta machine.

1. **Hostnames** (une fois) : ajoute dans `/etc/hosts` (ou équivalent Windows) :
   ```text
   127.0.0.1   lab.local dvwa.lab juice.lab api.lab bwapp.lab terminal.lab
   ```
2. **Port** (optionnel) : si 8080 est pris, crée `.env` avec `GATEWAY_PORT=8081` (ou autre port libre).
3. **Démarrer** :
   ```bash
   git clone <url-du-repo> && cd LabCyber
   make up
   ```
4. Ouvre **http://127.0.0.1:8080** (plateforme) et **http://localhost:7681** pour le **terminal web** (poste attaquant, ttyd) — pas besoin de /etc/hosts pour le terminal.

**Terminal direct** : ouvre **http://localhost:7681** dans le navigateur pour lancer le terminal (conteneur attaquant). **CLI** : `make shell`.

**Documentation** : [docs/USAGE.md](docs/USAGE.md) (comment faire quoi) · [docs/GETTING_STARTED.md](docs/GETTING_STARTED.md) · [docs/00-INDEX.md](docs/00-INDEX.md) · [docs/TESTS.md](docs/TESTS.md) · [docs/LOGGING.md](docs/LOGGING.md).

## Catégories couvertes

| Catégorie | Cibles / Outils | Doc |
|-----------|------------------|-----|
| **Web** | DVWA, Juice Shop, bWAPP | [docs/01-WEB.md](docs/01-WEB.md) |
| **Réseau** | vuln-network (SSH, Redis) | [docs/02-RESEAU.md](docs/02-RESEAU.md) |
| **Applications / API** | vuln-api (SQLi, IDOR, auth faible) | [docs/03-APPLICATIONS.md](docs/03-APPLICATIONS.md) |
| **Red Team** | Scénarios d’attaque (solo) | [docs/04-RED-TEAM.md](docs/04-RED-TEAM.md) |
| **Blue Team** | Suricata, détection | [docs/05-BLUE-TEAM.md](docs/05-BLUE-TEAM.md) |
| **Forensique** | tshark, tcpdump | [docs/06-FORENSIQUE.md](docs/06-FORENSIQUE.md) |
| **OSINT** | theHarvester, recon | [docs/07-OSINT.md](docs/07-OSINT.md) |
| **Stéganographie** | steghide, exiftool, binwalk, défis plateforme | [docs/10-STEGANOGRAPHY.md](docs/10-STEGANOGRAPHY.md) |
| **Cryptographie** | openssl, gpg, base64, john, défis plateforme | [docs/11-CRYPTOGRAPHY.md](docs/11-CRYPTOGRAPHY.md) |
| **Phishing / Spam / Social Engineering** | Reconnaissance, défense, démo page type phishing | [docs/12-SOCIAL-ENGINEERING-PHISHING.md](docs/12-SOCIAL-ENGINEERING-PHISHING.md) |
| **Tests entreprise** | Mapping OWASP, pentest, Red/Blue | [docs/08-ENTERPRISE-TESTS.md](docs/08-ENTERPRISE-TESTS.md) |

## Architecture du lab

| Composant | Rôle |
|-----------|------|
| **gateway** | Port **8080** (défaut). Plateforme + cibles (lab.local, dvwa.lab, etc. si /etc/hosts). **http://127.0.0.1:8080** = plateforme. |
| **attaquant** | Terminal web **ttyd** sur port **7681** : **http://localhost:7681** = lancer le terminal (sans /etc/hosts). CLI : `make shell` |
| **platform** | Interface web – scénarios, rooms, défis (accès via gateway:8080) |
| **dvwa, juice-shop, bwapp, vuln-api** | Cibles web/API (accès via gateway, aucun port exposé) |
| **vuln-network** | SSH, Redis – pentest (accès uniquement depuis le lab, ex. attaquant) |
| **blue-suricata** | IDS (profil `blue`) |
| **proxy** | Squid HTTP (profil `proxy`, port 3128) – optionnel |

## Commandes utiles (Makefile)

```bash
make up          # Démarrer tout le lab
make down        # Arrêter le lab
make build      # Reconstruire les images
make test       # Tests (JSON + logs toujours ; HTTP/réseau si lab up)
make test-full  # Tests en exigeant que le lab soit démarré
make shell      # Shell dans le conteneur attaquant (session lab)
make proxy      # Démarrer le lab + proxy Squid (port 3128)
make blue       # Démarrer le lab + Suricata (Blue Team)
make status     # État des conteneurs
make clean      # Arrêter et supprimer conteneurs + volumes
make help       # Liste des cibles
```

Sans Makefile : `docker compose up -d`, `docker compose exec attaquant bash`, `./scripts/run-tests.sh`, etc.

## Structure du projet (modulaire)

```
LabCyber/
├── docker-compose.yml      # Un seul port exposé (gateway) ; tout le reste en interne
├── .env.example            # Exemple : GATEWAY_PORT=8080 (copier en .env pour changer le port)
├── gateway/                # Nginx : route par hostname (lab.local, dvwa.lab, …)
│   ├── Dockerfile
│   └── nginx.conf
├── platform/               # Interface web (scénarios, rooms, terminal, cibles)
│   ├── data/               # rooms.json, scenarios.json, config.json (hostnames)
│   ├── js/logger.js, app.js
│   └── …
├── attacker/               # Conteneur attaquant + ttyd (terminal web)
├── vuln-network/, vuln-api/  # Cibles
├── proxy/                  # Squid (profil proxy)
├── docs/                   # USAGE.md (comment faire quoi), 00-INDEX, GETTING_STARTED, …
├── scripts/run-tests.sh    # Tests (gateway, JSON, logs, …)
├── Makefile                # make up, down, test, shell, lab, up-minimal, …
├── docker-compose.minimal.yml  # Profil minimal (faible consommation)
├── src/lab.c               # Pilote unifié en C → make lab → ./lab
└── README.md
```

## Catalogue des exercices et tests

- **Catalogue des labs** : [docs/09-LAB-CATALOG.md](docs/09-LAB-CATALOG.md) — tous les exercices par catégorie (web, réseau, API, Red/Blue Team, forensique, OSINT, stégano, crypto, phishing / social engineering).
- **Tests du système** : [docs/TESTS.md](docs/TESTS.md) — suite complète (structure, JSON, conteneurs, HTTP, réseau, logs, config). `make test` ou `./lab test`.
- **Lab minimal** : peu de ressources (gateway, platform, attaquant, vuln-network, vuln-api uniquement). `make up-minimal` ou `./lab minimal`.
- **Binaire C unique** : `make lab` génère `./lab` (up, down, status, test, minimal, shell, web, tui). `./lab status` = état détaillé + URLs ; `./lab web` = ouvrir la plateforme ; `./lab tui` = menu interactif.
- **Logs** : [docs/LOGGING.md](docs/LOGGING.md) — format, export, tests.

## Licence

À usage **éducatif** uniquement. Ne pas utiliser sur des systèmes sans autorisation.
