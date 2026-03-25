# Challenges du lab

Défis à valider pour progresser (style CTF / TryHackMe). La liste complète est dans la plateforme : **Ma progression** (onglet Challenges) et **Dashboard**. Données : `platform/data/challenges.json` et `platform/public/data/challenges.json`. Chaque challenge peut être lié à une **room** (`roomId`) pour télécharger les fichiers ou suivre les tâches guidées.

## Réseau

| Challenge | Objectif | Indice |
|-----------|----------|--------|
| **Redis INFO** | Se connecter à Redis sur vuln-network et lancer `INFO`. | `redis-cli -h vuln-network` |
| **SSH root** | Obtenir un shell root sur vuln-network en SSH. | `ssh root@vuln-network` — mot de passe : labpassword |
| **nmap** | Lister les ports ouverts (22, 6379) sur vuln-network. | `nmap -sV vuln-network` |
| **tcpdump** | Capturer du trafic vers vuln-api puis vérifier le fichier pcap. | `tcpdump -i any -w /workspace/cap.pcap host vuln-api` |
| **Scapy ICMP** | Envoyer un ping ICMP avec Scapy vers vuln-network. | `from scapy.all import *; sr1(IP(dst="vuln-network")/ICMP())` |

## API (vuln-api)

| Challenge | Objectif | Indice |
|-----------|----------|--------|
| **Login admin** | Obtenir un token via POST /api/login (admin / admin123). | `curl -X POST http://vuln-api:5000/api/login -H 'Content-Type: application/json' -d '{"login":"admin","password":"admin123"}'` |
| **IDOR** | Lire /api/users/2 sans être connecté. | `curl http://vuln-api:5000/api/users/2` |
| **SQLi products** | Exploiter le paramètre `q` de /api/products pour extraire des données ou erreur SQL. | Payload type `q=1' OR '1'='1` |

## Web (DVWA)

| Challenge | Objectif | Indice |
|-----------|----------|--------|
| **SQL Injection Low** | Afficher plusieurs utilisateurs via une injection sur le champ id. | Créer la base DVWA, puis SQL Injection > Low, payload `1' OR '1'='1` |

## Red Team

| Challenge | Objectif | Indice |
|-----------|----------|--------|
| **Hydra SSH** | Trouver le mot de passe SSH de vuln-network avec Hydra et une petite wordlist. | `hydra -l root -P wordlist.txt ssh://vuln-network -t 4` |

## Documentation

| Challenge | Objectif | Indice |
|-----------|----------|--------|
| **CVE** | Comprendre les CVE, chercher sur NVD un CVE pour un logiciel (ex. Redis, OpenSSH), noter ID et score CVSS. | Bouton CVE ; nvd.nist.gov ; format CVE-ANNÉE-NNNNN |

## Stéganographie

| Challenge | Objectif | Indice |
|-----------|----------|--------|
| **Extraire un flag** | Télécharger l’image (room Stéganographie ou `/challenges/stego/`), extraire le fichier caché avec steghide. | `steghide extract -sf image_stego.jpg` — mot de passe : **labstego** |

Fichiers générés au build : `platform/build-challenges.sh` → `stego/image_stego.jpg`.

## Cryptographie

| Challenge | Objectif | Indice |
|-----------|----------|--------|
| **Base64 + OpenSSL** | Télécharger les défis (room Cryptographie ou `/challenges/crypto/`). Décoder `flag_b64.txt` et déchiffrer `flag.enc`. | `base64 -d flag_b64.txt` ; `openssl enc -d -aes-256-cbc -in flag.enc -out flag.txt -k labcrypto` |

Mots de passe lab : **labcrypto** (flag.enc), pas de mot de passe pour Base64.

---

Après chaque challenge, note ce que tu as appris (commande, vuln, correction possible). Tu peux utiliser la vue **Engagements** pour enregistrer tes sessions et objectifs. Pour les outils : **Simulateur réseau**, **Proxy (config)**, **Requêtes API (Postman)**, **Capture pcap**. Progression enregistrée localement (navigateur). Challenges liés à une room : bouton **Voir la room** dans Ma progression pour ouvrir la room et télécharger les fichiers.

## Validation automatique (terminal)

Quand tu exécutes des commandes dans le **terminal attaquant** (panneau terminal de la plateforme), la plateforme écoute les sorties et les commandes. Si une règle de validation est satisfaite (présence de certains mots dans la sortie et/ou dans ce que tu as tapé), le challenge est **marqué réussi automatiquement** — tu n’as pas besoin de cliquer sur « J’ai réussi ». Les règles sont définies dans `challenges.json` (champ `autoValidate` : `outputContains`, `commandContains`). Ex. : pour « Redis INFO », dès que la sortie contient `redis_version` et `Server`, le défi est validé.

**Validation par actions (style TryHackMe)** : l'app enregistre aussi les actions (CVE ouvert/recherche, requête API, cible ouverte, room/tâche, téléchargement challenge). Avec `autoValidate.actionMatch` (ex. `"action": "cve_searched"`, `"target_opened"` + `"target": "dvwa"`, `"api_request"` + `urlContains: "/api/login"`), le défi est validé dès qu'une action correspondante est détectée. Terminal et action peuvent être combinés (validé si l'un ou l'autre est satisfait).
