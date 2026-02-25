# Red Team – Simulation d’attaquant (solo)

## Objectifs

- Mener un **scénario d’attaque complet** comme en Red Team.
- Enchaîner : **reconnaissance → accès → élévation → persistance** (selon le scope du lab).
- Utiliser les **mêmes méthodologies** qu’en entreprise (sans Active Directory ici : focus web, réseau, app).

## Méthodologie (résumée)

1. **Reconnaissance** : cartographie des cibles (nmap, nikto, énumération web/API).
2. **Exploitation** : exploitation des vulnérabilités (SQLi, credentials faibles SSH/Redis, IDOR).
3. **Accès** : accès shell ou compte (ex : SSH sur vuln-network, compte admin sur DVWA).
4. **Post-exploitation** (dans la mesure du possible) : lecture de fichiers, persistence (scripts, crontab dans le lab).

## Scénarios Red Team dans ce lab (solo)

### Scénario 1 : Prise de contrôle “réseau”

- **Cible** : vuln-network.
- **Objectif** : accès root via SSH ou accès Redis.
- **Étapes** : nmap → repérer SSH et Redis → tester Redis (INFO, CONFIG) → SSH avec root/labpassword ou Hydra.
- **Livrable** : note avec commandes et preuve d’accès (screenshot ou output de `id`).

### Scénario 2 : Compromission “web + données”

- **Cibles** : DVWA + vuln-api.
- **Objectif** : extraire des données (DB ou utilisateurs) via SQLi et IDOR.
- **Étapes** : énumérer les formulaires/paramètres → SQLi sur DVWA et sur vuln-api `/api/products` → IDOR sur `/api/users/<id>`.
- **Livrable** : liste des données extraites (ex : users, produits) et requêtes utilisées.

### Scénario 3 : Chaîne d’exploitation “web → app”

- **Cibles** : Juice Shop + vuln-api.
- **Objectif** : combiner vulnérabilités web (XSS, auth) et API (IDOR, SQLi).
- **Étapes** : résoudre des défis Juice Shop (auth, XSS) + tester vuln-api (login, IDOR, SQLi).
- **Livrable** : rapport court (attaques réalisées, impact).

### Scénario 4 : Red Team “full lab” (une journée)

- **Cibles** : toutes (DVWA, Juice Shop, bWAPP, vuln-network, vuln-api).
- **Objectif** : au moins un accès ou une extraction de données par catégorie (web, réseau, app).
- **Livrable** : rapport type pentest (executive summary, méthodo, vulns, preuves, recommandations).

## Outils disponibles (conteneur attaquant)

- **Scan** : nmap, nikto, gobuster, dirb.
- **Exploitation** : sqlmap, hydra, john.
- **Réseau** : curl, wget, netcat, tcpdump, tshark.
- **Recon** : theHarvester (OSINT), scripts Python (requests).

## Bonnes pratiques Red Team (même en solo)

- **Documenter** chaque étape (commandes, screenshots).
- **Ne pas** détruire les cibles : pas de DROP TABLE, pas de suppression de fichiers.
- **Limiter** les brute force (petites wordlists) pour ne pas surcharger le lab.
