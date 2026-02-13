# Démarrer le lab – Guide pas à pas

## 0. Plateforme web (interface du lab)

Une fois le lab démarré, ouvre **http://localhost:8080** dans ton navigateur :

- **Tableau de bord** avec toutes les rooms (Web, Réseau, API, Red Team, Blue Team, Forensique, OSINT, Stéganographie, Cryptographie).
- **Chaque room** : objectifs, **accès direct aux machines** (boutons qui ouvrent DVWA, Juice Shop, vuln-api, etc.), tâches avec **explications et tips** (style TryHackMe).
- **Défis stégano / crypto** : téléchargement des fichiers depuis la plateforme, puis travail dans le conteneur attaquant.

Tout le lab est pilotable depuis cette interface.

## 1. Lancer l'environnement

```bash
cd /chemin/vers/LabCyber
docker compose up -d
```

Pour inclure le **profil Blue Team** (Suricata pour l’analyse de pcaps) :

```bash
docker compose --profile blue up -d
```

Vérifier que les services sont « running » :

```bash
docker compose ps
```

## 2. Accès aux cibles (depuis votre machine)

### Web

| Cible | URL (localhost) | Identifiants / remarques |
|-------|------------------|---------------------------|
| **DVWA** | http://localhost:4280 | `admin` / `password`. Puis **Create / Reset Database** en bas de page. |
| **Juice Shop** | http://localhost:3000 | Inscription libre, défis dans le scoreboard. |
| **bWAPP** | http://localhost:4281 | Une fois : http://localhost:4281/install.php puis `bee` / `bug`. |

### Réseau (pentest)

| Cible | Accès | Identifiants |
|-------|--------|---------------|
| **vuln-network** | SSH : `localhost:4222` — Redis : `localhost:6379` | SSH : `root` / `labpassword` — Redis : pas de mot de passe. |

### Applications / API

| Cible | URL | Identifiants |
|-------|-----|---------------|
| **vuln-api** | http://localhost:5000 | `admin` / `admin123` — `user` / `user123`. Endpoints : `/api/login`, `/api/users/<id>`, `/api/products?q=`. |

## 3. Utiliser le conteneur attaquant

```bash
docker compose exec attaquant bash
```

### Hostnames des cibles (depuis l’attaquant)

- **Web** : `dvwa`, `juice-shop`, `bwapp`
- **Réseau** : `vuln-network` (alias : `vulnbox`)
- **API** : `vuln-api` (alias : `api`)

### Exemples de commandes

```bash
# Scan réseau
nmap -sV vuln-network
nmap -sV dvwa

# Web
nikto -h http://dvwa
gobuster dir -u http://dvwa/ -w /usr/share/wordlists/dirb/common.txt

# Réseau : Redis sans auth
redis-cli -h vuln-network
# SSH
ssh root@vuln-network -p 22   # mot de passe : labpassword

# API
curl -X POST http://vuln-api:5000/api/login -H "Content-Type: application/json" -d '{"login":"admin","password":"admin123"}'
curl http://vuln-api:5000/api/users/1
```

Depuis votre machine, utilisez **Burp Suite**, **OWASP ZAP** ou le navigateur sur les URLs localhost ci-dessus.

## 4. Documentation complète (toutes catégories)

- **Index** : [00-INDEX.md](00-INDEX.md) — vue d’ensemble et parcours.
- **Par catégorie** : Web [01-WEB.md](01-WEB.md), Réseau [02-RESEAU.md](02-RESEAU.md), API [03-APPLICATIONS.md](03-APPLICATIONS.md), Red Team [04-RED-TEAM.md](04-RED-TEAM.md), Blue Team [05-BLUE-TEAM.md](05-BLUE-TEAM.md), Forensique [06-FORENSIQUE.md](06-FORENSIQUE.md), OSINT [07-OSINT.md](07-OSINT.md).
- **Entreprise** : [08-ENTERPRISE-TESTS.md](08-ENTERPRISE-TESTS.md).
- **Catalogue des labs** : [09-LAB-CATALOG.md](09-LAB-CATALOG.md).

## 5. Arrêter le lab

```bash
docker compose down
```

Avec le profil blue : `docker compose --profile blue down`.

Pour tout supprimer (conteneurs + volumes) :

```bash
docker compose down -v
```

## Dépannage

- **DVWA : "Database not found"**  
  Page d’accueil DVWA → **Create / Reset Database**.

- **bWAPP : page blanche ou erreur**  
  Ouvrir une fois http://localhost:4281/install.php.

- **vuln-api : connexion refusée**  
  Attendre quelques secondes après `docker compose up -d` ; la base est créée au premier démarrage.

- **Le conteneur attaquant ne « voit » pas les cibles**  
  Vérifier : `docker network inspect lab-network`.
