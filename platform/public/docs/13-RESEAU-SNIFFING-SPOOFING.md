# Réseau : sniffing, spoofing et construction de paquets

Dans le lab, la **machine attaquant (Kali)** dispose des outils pour capturer le trafic, l’analyser et (en environnement contrôlé) construire ou modifier des paquets.

## Outils disponibles (attaquant)

| Outil | Usage |
|-------|--------|
| **tcpdump** | Capture de paquets (interface, filtre, fichier pcap). |
| **tshark** | Analyse en ligne ou lecture de pcap (style Wireshark en CLI). |
| **scapy** (Python) | Construction et envoi de paquets (ICMP, TCP, UDP, ARP, etc.). |
| **nmap** | Scan de ports et de services (reconnaissance). |

## Sniffing (capture du trafic)

### tcpdump

Depuis l’attaquant, tu peux capturer le trafic vers/depuis une cible du lab :

```bash
# Capturer tout le trafic impliquant vuln-api
tcpdump -i any -w /workspace/cap.pcap host vuln-api

# Dans un autre terminal : générer du trafic
curl http://vuln-api:5000/api/health

# Arrêter tcpdump (Ctrl+C), puis lire le fichier
tcpdump -r /workspace/cap.pcap -n
```

### tshark

```bash
# Capture 10 paquets puis arrêt
tshark -i any -c 10 -w /workspace/capture.pcap

# Lire un pcap avec affichage détaillé
tshark -r /workspace/capture.pcap -V
```

## Spoofing et construction de paquets (Scapy)

En lab, tu peux t’entraîner à construire des paquets avec **Scapy** (Python). Exemples depuis l’attaquant :

```bash
python3
```

```python
from scapy.all import *

# Ping ICMP vers vuln-network
p = IP(dst="vuln-network")/ICMP()
r = sr1(p)
print(r.summary() if r else "Pas de réponse")

# Paquet TCP SYN (scan manuel)
syn = IP(dst="vuln-network")/TCP(dport=22, flags="S")
ans, unans = sr(syn, timeout=2)
ans.show()
```

**Note** : En environnement réel, l’usurpation d’adresse (spoofing) peut être bloquée (filtrage, routage). Dans le lab Docker, les hôtes sont sur le même réseau ; Scapy sert surtout à **comprendre** les protocoles et à construire des paquets pour des exercices (ICMP, TCP, etc.).

## Topologie du lab (réseau Docker)

Toutes les cibles et l’attaquant sont sur le réseau bridge **lab-network**. Schéma conceptuel :

```
[ Navigateur ]  →  gateway:8080  →  platform, /terminal/, /desktop/
                      ↓
[ lab-network ]
    ├── platform (interface web)
    ├── attaquant (Kali, ttyd 7681)  ← point de départ des scans
    ├── vuln-network (SSH 22, Redis 6379)
    ├── vuln-api (Flask 5000)
    ├── dvwa, juice-shop, bwapp (web)
    └── desktop (noVNC 6901)
```

L’attaquant peut joindre **vuln-network**, **vuln-api**, **dvwa**, etc. par leur nom de service (DNS Docker). Pour un « Packet Tracer » avancé (topologies personnalisées, VLAN, etc.), des outils comme GNS3 ou Eve-NG sont plus adaptés ; le lab fournit ici un réseau fixe pour la pratique pentest et l’analyse de trafic.

## Objectifs d’apprentissage

- [ ] Capturer du trafic HTTP vers vuln-api avec tcpdump et l’inspecter avec tshark.
- [ ] Envoyer un paquet ICMP avec Scapy et recevoir la réponse.
- [ ] Comprendre un scan nmap (SYN, versions) en regardant une capture tcpdump pendant un nmap -sV vuln-network.
