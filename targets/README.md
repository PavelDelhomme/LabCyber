# Cibles du lab

Les cibles sont définies et lancées via **docker-compose.yml** à la racine du projet.

Ce dossier peut servir à :

- Noter des **IP / hostnames** et **credentials** spécifiques à votre déploiement
- Ajouter des **scripts** ou **configs** pour des cibles custom (Dockerfile, docker-compose override)
- Stocker des **scénarios** ou **checklists** par cible (ex. `dvwa-checklist.md`)

## Cibles actuelles

| Nom         | Service      | Rôle principal                          |
|------------|--------------|-----------------------------------------|
| DVWA       | `dvwa`       | Web : SQLi, XSS, CSRF, File Upload, etc. |
| Juice Shop | `juice-shop` | Web moderne, défis OWASP                |
| bWAPP      | `bwapp`      | Web : nombreuses vulnérabilités OWASP   |

Pour ajouter une nouvelle cible : ajouter un service dans `docker-compose.yml` sur le réseau `lab-network`, et documenter l’accès ici ou dans `docs/GETTING_STARTED.md`.
