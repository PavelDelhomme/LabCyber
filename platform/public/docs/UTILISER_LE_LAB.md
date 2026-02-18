# Utiliser le lab depuis ton PC (ligne de commande)

Ce guide décrit comment te connecter au lab et utiliser les outils depuis ta machine (terminal, scripts, Postman local, etc.).

## Accès au lab

- **Plateforme web** : ouvre `http://127.0.0.1:8080` (ou l’URL de la gateway) pour la vue scénarios, progression, simulateur réseau, proxy, requêtes API, capture pcap.
- **Terminal attaquant (Kali)** :  
  - Dans le navigateur : `http://127.0.0.1:8080/terminal/` ou depuis la plateforme : panneau Lab → « Ouvrir dans un nouvel onglet » (ouvre `#/terminal-full` dans l’app) ou « Ouvrir dans la page (panneau) ».  
  - En CLI sur ton PC : `make shell` ou `docker compose exec attaquant bash` (depuis la racine du projet LabCyber).
- **Bureau noVNC** : `http://127.0.0.1:8080/desktop/` (bureau graphique dans le navigateur).

**Terminal vs bureau** : ce sont **deux environnements distincts**. Le **terminal web** est le conteneur **attaquant** (Kali avec outils : nmap, hydra, tcpdump, etc.). Le **bureau noVNC** est un conteneur **desktop** (environnement graphique type XFCE). Si tu veux les mêmes outils que dans le terminal, utilise le terminal ; le bureau sert à une interface graphique (navigateur, bureautique, etc.) dans le lab.

Pour **configurer la connexion** au lab (proxy Squid, tunnel SSH, VPN sur l’hôte), voir [PROXY-VPN.md](PROXY-VPN.md).

## Depuis ton PC : commandes vers le lab

- **SSH vers la machine attaquant** (si exposée) : selon ta config, tu peux avoir un port SSH mappé ; sinon, utilise le terminal web ou `docker compose exec attaquant bash`.
- **Requêtes vers les cibles du lab** : depuis ton PC les hostnames (`vuln-api`, `dvwa.lab`, etc.) ne sont pas résolus. Deux options :
  1. **Depuis le terminal du lab** (navigateur ou `docker compose exec attaquant bash`) : `curl http://vuln-api:5000/...`, `nmap vuln-network`, etc.
  2. **Depuis ton PC** : utilise l’IP du conteneur (ex. `docker inspect vuln-api` pour l’IP) et le port mappé s’il existe (ex. `http://127.0.0.1:5000` si vuln-api est mappé sur 5000).

## Proxy et client API

- **Config proxy (plateforme)** : dans **Proxy (config)** tu définis un ou plusieurs proxies pour le lab. Le bouton « Exporter (terminal) » copie les variables `http_proxy` / `https_proxy` pour les coller dans le terminal du lab.
- **Depuis ton PC** : pour utiliser un proxy (Burp, mitmproxy) sur ta machine avec des requêtes vers le lab, configure ton outil (Postman, curl) avec le proxy ; pour que le trafic passe par le lab, lance le proxy dans le conteneur attaquant (terminal du lab) et utilise l’URL du proxy depuis le terminal du lab.
- **Requêtes API (Postman)** : l’outil **Requêtes API** de la plateforme enregistre les requêtes et collections par lab. Pour un usage 100 % en ligne de commande, utilise le terminal du lab : `curl`, `httpie`, etc.

## Récap

| Besoin | Où |
|--------|-----|
| Scénarios, progression, simulateur, capture | Plateforme web (8080) |
| Lancer nmap, hydra, tcpdump, curl dans le lab | Terminal web ou `docker compose exec attaquant bash` |
| Configurer des proxies pour le lab | Plateforme → Proxy (config) → exporter pour terminal |
| Envoyer des requêtes HTTP (type Postman) | Plateforme → Requêtes API, ou terminal du lab (curl) |

Tout ce qui est enregistré (proxies, collections, cartes réseau, capture pcap) est lié au **lab actif** et persiste au rechargement.

## Notes du lab

Depuis le panneau **Lab** (icône lab dans la barre du haut), tu peux **prendre des notes** pour le lab actif : chemins de fichiers, IP, commandes utiles, infos importantes. Les notes sont enregistrées par lab et conservées au rechargement.
