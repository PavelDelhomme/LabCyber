# Cibles du lab

Les cibles sont définies dans **docker-compose.yml** à la racine. Ce dossier sert à noter des infos par cible, des scripts ou des checklists.

## Vue d’ensemble

| Cible | Catégorie | Hostname (réseau) | Ports exposés (host) |
|-------|------------|-------------------|-----------------------|
| **DVWA** | Web | dvwa | 4280→80 |
| **Juice Shop** | Web / API | juice-shop | 3000→3000 |
| **bWAPP** | Web | bwapp | 4281→80 |
| **vuln-network** | Réseau | vuln-network, vulnbox | 4222→22, 6379→6379 |
| **vuln-api** | Applications / API | vuln-api, api | 5000→5000 |

## Identifiants (rappel)

- **DVWA** : admin / password (puis Create/Reset DB)
- **bWAPP** : bee / bug (après /install.php)
- **vuln-network SSH** : root / labpassword
- **vuln-network Redis** : pas de mot de passe
- **vuln-api** : admin / admin123 ou user / user123

## Documentation par catégorie

- Web : [docs/01-WEB.md](../docs/01-WEB.md)
- Réseau : [docs/02-RESEAU.md](../docs/02-RESEAU.md)
- API : [docs/03-APPLICATIONS.md](../docs/03-APPLICATIONS.md)
- Catalogue de tous les labs : [docs/09-LAB-CATALOG.md](../docs/09-LAB-CATALOG.md)
