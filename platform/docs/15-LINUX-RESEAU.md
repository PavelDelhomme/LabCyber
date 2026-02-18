# Linux et connexion au lab

Ce document regroupe les points utiles pour **approfondir Linux** dans le cadre du lab et pour **configurer la connexion** (proxy, VPN).

## Linux en profondeur

Le terminal attaquant du lab (Kali) et les cibles sont des environnements Linux. Pour progresser :

- **Fichiers et permissions** : arborescence (`/`, `/etc`, `/var`), `chmod` / `chown`, utilisateurs et groupes. En pentest : lecture de fichiers de config, recherche de mots de passe, élévation de privilèges.
- **Processus et services** : `ps`, `top`, `systemctl` ; logs dans `/var/log`. Comprendre quels services tournent sur une cible.
- **Réseau** : `ip addr`, `ss -tlnp`, `/etc/resolv.conf`. Configurer un proxy : `export http_proxy=http://proxy:3128` (voir panneau Proxy de la plateforme, bouton « Exporter (terminal) »).
- **Documentation** : Doc & Cours → thème **Systèmes & Réseau** dans la plateforme ; [Linux man pages](https://man7.org/linux/man-pages/), [Linux Journey](https://linuxjourney.com/).

## Connexion au lab (proxy, VPN)

- **Proxy** : voir [PROXY-VPN.md](PROXY-VPN.md) (Squid dans le lab, tunnel SSH, VPN sur l’hôte).
- **Depuis la plateforme** : panneau Lab → Proxy (config), Capture, Terminal, Bureau. Les **notes du lab** permettent de noter IP, chemins, commandes par lab.
- **Terminal vs bureau** : le **terminal web** = conteneur attaquant (Kali, outils). Le **bureau noVNC** = conteneur desktop (XFCE). Deux environnements distincts ; pour les outils pentest, utilise le terminal.

## Intégration avec le reste du lab

Scénarios, rooms, capture pcap, proxy, requêtes API et CVE sont liés au **lab actif**. Utilise le panneau Lab pour ouvrir le terminal (panneau ou nouvel onglet `#/terminal-full`), la capture, le simulateur réseau et prendre des notes.
