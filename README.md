# Lab Cyber – Plateforme d’apprentissage (type TryHackMe)

Environnement **isolé** pour s’entraîner à la cybersécurité, avec **interface web** unique : **plateforme** (http://localhost:8080) pour suivre les rooms, accéder aux machines et télécharger les défis. Couvre **Web, Réseau, App, Red/Blue Team, Forensique, OSINT, Stéganographie, Cryptographie**.

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

```bash
git clone <url-du-repo> && cd LabCyber
docker compose up -d
docker compose ps
```

Ouvre **http://localhost:8080** pour la **plateforme web** : tableau de bord, rooms avec objectifs, **accès direct aux machines** (DVWA, Juice Shop, vuln-api, etc.) et tâches avec explications et tips.

Documentation : **[docs/GETTING_STARTED.md](docs/GETTING_STARTED.md)** · Index : **[docs/00-INDEX.md](docs/00-INDEX.md)**.

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
| **Tests entreprise** | Mapping OWASP, pentest, Red/Blue | [docs/08-ENTERPRISE-TESTS.md](docs/08-ENTERPRISE-TESTS.md) |

## Architecture du lab

| Composant | Rôle |
|-----------|------|
| **platform** | Interface web (http://localhost:8080) – rooms, machines, défis stégano/crypto |
| **Réseau `lab-network`** | Cibles + attaquant (+ Suricata si profil blue) |
| **attaquant** | nmap, nikto, sqlmap, hydra, steghide, openssl, tshark, theHarvester, etc. |
| **dvwa, juice-shop, bwapp** | Cibles web |
| **vuln-network** | SSH, Redis – pentest réseau |
| **vuln-api** | API vulnérable |
| **blue-suricata** | IDS (profil `blue`) |

## Commandes utiles

```bash
# Démarrer tout le lab
docker compose up -d

# Démarrer avec Blue Team (Suricata)
docker compose --profile blue up -d

# Se connecter au conteneur attaquant
docker compose exec attaquant bash

# Arrêter
docker compose down
```

## Structure du projet

```
LabCyber/
├── docker-compose.yml      # Orchestration : platform, cibles, attaquant, blue
├── platform/               # Plateforme web (interface type TryHackMe)
│   ├── Dockerfile          # Build défis stégano/crypto + nginx
│   ├── index.html, css/, js/, data/
│   ├── build-challenges.sh
│   └── nginx-default.conf
├── attacker/               # Image attaquant (Red, stégano, crypto, etc.)
│   └── Dockerfile
├── vuln-network/           # Cible réseau (SSH, Redis)
├── vuln-api/               # API vulnérable (SQLi, IDOR)
├── docs/                   # Documentation (01–11, GETTING_STARTED, INDEX, LAB-CATALOG)
├── targets/, scripts/
└── README.md
```

## Catalogue des exercices

Tous les labs sont listés dans **[docs/09-LAB-CATALOG.md](docs/09-LAB-CATALOG.md)** (web, réseau, API, Red/Blue Team, forensique, OSINT, stéganographie, cryptographie).

## Licence

À usage **éducatif** uniquement. Ne pas utiliser sur des systèmes sans autorisation.
