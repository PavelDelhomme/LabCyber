# Challenges du lab

Défis à valider pour progresser (style CTF / TryHackMe). La liste complète est aussi dans la plateforme (données `challenges.json`).

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

---

Après chaque challenge, note ce que tu as appris (commande, vuln, correction possible). Tu peux utiliser la vue **Engagements** pour enregistrer tes sessions et objectifs.
