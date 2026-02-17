# Démarrer le lab – Guide pas à pas

**Tout le lab = un seul port** (gateway, par défaut 8080). Pour savoir exactement quoi faire dans l’ordre : **[USAGE.md](USAGE.md)**.

## 0. Plateforme web (interface du lab)

Une fois le lab démarré, ouvre **http://lab.local:8080** (ou http://localhost:8080) dans ton navigateur. **Prérequis** : avoir ajouté dans `/etc/hosts` la ligne :
```text
127.0.0.1   lab.local dvwa.lab juice.lab api.lab bwapp.lab terminal.lab
```

- **Tableau de bord** : scénarios guidés et rooms par catégorie (Web, Réseau, API, Red Team, Blue Team, Forensique, OSINT, Stéganographie, Cryptographie, Phishing / Spam / Social Engineering).
- **Scénarios guidés** (style TryHackMe / HackTheBox) : parcours pas à pas avec tâches à cocher, commandes à copier, tips et « ce que tu apprends ».
- **Rooms** : objectifs, **accès direct aux machines** (DVWA, Juice Shop, vuln-api, vuln-network, etc.), tâches avec explications et tips.
- **Défis stégano / crypto** : téléchargement des fichiers depuis les rooms concernées.
- **Journal d’activité** : panneau latéral droit avec les logs (navigation, ouverture de scénario/room, copie de commande, etc.) ; boutons Export JSON, Export TXT, Effacer. Voir [LOGGING.md](LOGGING.md).
- **Terminal lab** : lien « Terminal lab » ou carte « Terminal web » → **http://terminal.lab:8080** (terminal dans le navigateur = conteneur attaquant). En CLI : `make shell`.
- **Démo phishing** : http://lab.local:8080/demo-phishing.html (page pédagogique).
- **Test du logger** : http://lab.local:8080/test-logs.html.

Tout le lab est pilotable depuis cette interface.

## 1. Lancer l'environnement

**Avec le Makefile (recommandé)** :

```bash
cd /chemin/vers/LabCyber
make up
```

Ou avec Docker Compose directement :

```bash
docker compose up -d
```

Pour inclure le **profil Blue Team** (Suricata) : `make blue` ou `docker compose --profile blue up -d`.

Pour inclure le **proxy Squid** (port 3128) : `make proxy` ou `docker compose --profile proxy up -d`.

Vérifier que les services sont « running » : `make status` ou `docker compose ps`.

## 2. Accès aux cibles (un seul port, même port que la plateforme)

Toutes les URLs ci-dessous utilisent le **même port** (8080 ou celui défini dans `.env`). Les hostnames doivent être dans `/etc/hosts` (voir [USAGE.md](USAGE.md)).

### Web

| Cible | URL | Identifiants / remarques |
|-------|-----|---------------------------|
| **DVWA** | http://dvwa.lab:8080 | `admin` / `password`. Puis **Create / Reset Database** en bas de page. |
| **Juice Shop** | http://juice.lab:8080 | Inscription libre, défis dans le scoreboard. |
| **bWAPP** | http://bwapp.lab:8080 | Une fois : …/install.php puis `bee` / `bug`. |

### Réseau (pentest)

| Cible | Accès | Identifiants |
|-------|--------|---------------|
| **vuln-network** | Depuis l’**attaquant** uniquement (terminal web ou `make shell`) : `ssh root@vuln-network`, `redis-cli -h vuln-network` | SSH : `root` / `labpassword` — Redis : pas de mot de passe. |

### Applications / API

| Cible | URL | Identifiants |
|-------|-----|---------------|
| **vuln-api** | http://api.lab:8080 | `admin` / `admin123` — `user` / `user123`. Endpoints : `/api/login`, `/api/users/<id>`, `/api/products?q=`. |

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

- **Index** : [00-INDEX.md](00-INDEX.md) — vue d’ensemble, parcours et structure des docs.
- **Par catégorie** : Web [01-WEB.md](01-WEB.md), Réseau [02-RESEAU.md](02-RESEAU.md), API [03-APPLICATIONS.md](03-APPLICATIONS.md), Red Team [04-RED-TEAM.md](04-RED-TEAM.md), Blue Team [05-BLUE-TEAM.md](05-BLUE-TEAM.md), Forensique [06-FORENSIQUE.md](06-FORENSIQUE.md), OSINT [07-OSINT.md](07-OSINT.md), Stégano [10-STEGANOGRAPHY.md](10-STEGANOGRAPHY.md), Crypto [11-CRYPTOGRAPHY.md](11-CRYPTOGRAPHY.md), Phishing / Social Engineering [12-SOCIAL-ENGINEERING-PHISHING.md](12-SOCIAL-ENGINEERING-PHISHING.md).
- **Entreprise** : [08-ENTERPRISE-TESTS.md](08-ENTERPRISE-TESTS.md).
- **Catalogue des labs** : [09-LAB-CATALOG.md](09-LAB-CATALOG.md).
- **Tests** : [TESTS.md](TESTS.md) — lancer `./scripts/run-tests.sh` à la racine du projet (lab démarré).
- **Logs** : [LOGGING.md](LOGGING.md) — format des logs, où ils sont enregistrés, export et tests.

## 5. Tests automatisés

À la racine du projet :

```bash
make test
```

Sans lab démarré, seuls les tests JSON et logs frontend sont exécutés (les tests HTTP/réseau sont ignorés avec un message). Pour exiger que le lab soit démarré : `make test-full`.

Le script vérifie : JSON (rooms, scenarios), conteneurs running, HTTP plateforme et cibles, réseau (attaquant → vuln-network), logs vuln-api et frontend. Détail dans [TESTS.md](TESTS.md).

## 6. Arrêter le lab

```bash
make down
```

ou `docker compose down`. Pour tout supprimer (conteneurs + volumes) : `make clean` ou `docker compose down -v`.

## 6b. Proxy et accès distant (VPN / tunnel)

- **Proxy Squid** : `make proxy` démarre le lab avec un proxy HTTP sur **localhost:3128**. Depuis le conteneur attaquant ou ta machine, tu peux utiliser `http://proxy:3128` (depuis le lab) ou `http://127.0.0.1:3128` (depuis l’hôte) pour des exercices de pivot ou d’analyse de trafic proxy.
- **Accès distant type VPN** : le lab n’inclut pas de serveur VPN intégré. Pour accéder au lab depuis une autre machine, tu peux utiliser un **tunnel SSH** (ex. `ssh -L 8080:localhost:8080 -L 5000:localhost:5000 user@machine-lab`), ou déployer un VPN (WireGuard, OpenVPN) sur l’hôte qui héberge Docker. Voir [docs/PROXY-VPN.md](PROXY-VPN.md) pour plus de détails.

## 7. Dépannage

- **DVWA : "Database not found"**  
  Page d’accueil DVWA → **Create / Reset Database**.

- **bWAPP : page blanche ou erreur**  
  Ouvrir une fois http://localhost:4281/install.php.

- **vuln-api : connexion refusée**  
  Attendre quelques secondes après `docker compose up -d` ; la base est créée au premier démarrage.

- **Le conteneur attaquant ne « voit » pas les cibles**  
  Vérifier : `docker network inspect lab-network`.
