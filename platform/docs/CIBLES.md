# Cibles du lab (targets)

Ce document décrit **toutes les cibles** exposées dans le lab : à quoi elles servent, comment y accéder, et quelles vulnérabilités apprendre.

## Vue d’ensemble

| Cible | Type | Accès | Usage |
|-------|------|--------|--------|
| **DVWA** | Web | http://dvwa.lab:8080 | OWASP Top 10 (SQLi, XSS, CSRF, upload) |
| **Juice Shop** | Web | http://juice.lab:8080 | Défis web, auth, XSS |
| **bWAPP** | Web | http://bwapp.lab:8080 | Vulnérabilités web classiques |
| **vuln-api** | API | http://api.lab:8080 | Auth faible, IDOR, SQLi |
| **vuln-network** | Réseau | Depuis attaquant uniquement | SSH (root/labpassword), Redis (sans auth) |
| **Bureau noVNC** | Desktop | http://127.0.0.1:8080/desktop/ | GUI optionnelle (VNC: labcyber) |
| **Machine attaquant** | Terminal | http://127.0.0.1:8080/terminal/ ou `make shell` | Kali – nmap, hydra, scapy, tcpdump, etc. |

## vuln-api (API vulnérable)

- **Rôle** : API REST pour s’entraîner à l’OWASP API Security (auth, IDOR, injection).
- **URL** : http://api.lab:8080 (depuis le navigateur) ou http://vuln-api:5000 (depuis le conteneur attaquant).
- **Comptes** : `admin` / `admin123`, `user` / `user123`.
- **Endpoints** :
  - `POST /api/login` – authentification (vulnérable SQLi en concaténation).
  - `GET /api/users/<id>` – IDOR : pas de vérification du token, accès à tout id.
  - `GET /api/products?q=` – SQLi sur le paramètre `q`.
  - `GET /api/health` – santé de l’API.
- **Logs** : `docker compose logs vuln-api` ; logs structurés JSON dans `/data/app.log` dans le conteneur.

## vuln-network (cible réseau)

- **Rôle** : Machine cible pour pentest réseau (scan, brute force SSH, exploitation Redis).
- **Accès** : **Uniquement depuis la machine attaquant** (même réseau Docker). Pas d’URL web.
- **Hostname** : `vuln-network` ou `vulnbox`.
- **Services** :
  - **SSH** (22) : `root` / `labpassword`.
  - **Redis** (6379) : pas de mot de passe. `redis-cli -h vuln-network`.
- **Commandes typiques** (depuis attaquant) :
  - `nmap -sV vuln-network`
  - `ssh root@vuln-network`
  - `redis-cli -h vuln-network` puis `INFO`, `CONFIG GET dir`

## Machine attaquant (Kali)

- **Rôle** : Point de départ pour tous les scénarios. Contient les outils (nmap, hydra, sqlmap, tcpdump, tshark, scapy, etc.).
- **Accès** : Terminal web http://127.0.0.1:8080/terminal/ ou en CLI : `make shell` (ou `docker compose exec attaquant bash`).
- **Cibles joignables** : vuln-network, vuln-api, dvwa, juice-shop, bwapp (par hostname ou IP du réseau Docker).

## Créer ses propres cibles / labs

- Tu peux utiliser la **vue Engagements** (plateforme) pour noter tes objectifs, cibles personnalisées (URL, notes), sessions et historique.
- Depuis l’attaquant, tu peux lancer tes propres outils, enregistrer des captures (tcpdump, tshark), et documenter dans une session d’engagement.
- Pour ajouter de **nouvelles cibles** au lab (nouvelles images Docker), ajoute un service dans `docker-compose.yml`, expose-le sur le réseau `lab-network`, et documente-le ici ou dans une room.

## Outils du lab (plateforme)

- **Simulateur réseau** : plusieurs cartes (topologies) par lab, config IP (PC, routeur, switch, serveur), types de service (Web, DNS, Mail…) et switch (L2/L3). Type Packet Tracer, intégré aux scénarios.
- **Proxy (config)** : configure un ou plusieurs proxies (HTTP, HTTPS, SOCKS) ou VPN pour le lab ; export des variables pour le terminal (`http_proxy`, etc.).
- **Requêtes API (Postman)** : envoi de requêtes HTTP, collections, historique ; tout enregistré par lab.
- **Capture pcap** : visualiseur type Wireshark, session (fichier, filtre) enregistrée par lab.
