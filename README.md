# Lab Cyber – Environnement d'apprentissage cybersécurité

Lab isolé pour s'entraîner à la cybersécurité : **réseau Docker dédié**, **cibles vulnérables** et **conteneur attaquant** avec outils intégrés.

## Prérequis

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/) (v2+)
- Git

## Démarrage rapide

```bash
# Cloner (ou vous êtes déjà dans le repo)
git clone <url-du-repo> && cd LabCyber

# Lancer tout le lab
docker compose up -d

# Voir les services et IPs
docker compose ps
```

Consulter **[docs/GETTING_STARTED.md](docs/GETTING_STARTED.md)** pour les URLs, identifiants et premiers exercices.

## Architecture

| Composant | Rôle |
|-----------|------|
| **Réseau `lab-network`** | Réseau isolé pour cibles + attaquant |
| **attaquant** | Conteneur avec outils (nmap, nikto, sqlmap, etc.) |
| **dvwa** | [Damn Vulnerable Web Application](https://github.com/digininja/DVWA) – injection SQL, XSS, etc. |
| **juice-shop** | [OWASP Juice Shop](https://juice-shop.owasp.org/) – app vulnérable moderne |
| **bwapp** | [buggy Web Application](http://www.itsecgames.com/) – nombreuses vulnérabilités |

## Commandes utiles

```bash
# Démarrer le lab
docker compose up -d

# Se connecter au conteneur attaquant
docker compose exec attaquant bash

# Arrêter le lab
docker compose down

# Tout supprimer (conteneurs + volumes)
docker compose down -v
```

## Structure du projet

```
LabCyber/
├── docker-compose.yml    # Orchestration : réseau, cibles, attaquant
├── attacker/             # Image Docker de la machine attaquant
│   └── Dockerfile
├── docs/                 # Documentation et parcours d'apprentissage
│   └── GETTING_STARTED.md
├── targets/              # Config / scripts spécifiques aux cibles (optionnel)
└── README.md
```

## Licence

À usage éducatif uniquement. Ne pas utiliser sur des systèmes sans autorisation.
