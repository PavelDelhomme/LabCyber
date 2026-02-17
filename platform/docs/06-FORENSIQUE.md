# Forensique – Analyse post-incident

## Objectifs

- Analyser du **trafic réseau** (pcap) avec tshark/Wireshark.
- Comprendre les **preuves** (logs, captures) dans un cadre “incident”.

## Outils dans le lab (conteneur attaquant)

- **tshark** : en ligne de commande, équivalent Wireshark.
- **tcpdump** : capture et lecture de paquets.

Pas d’outil forensique disque (type Autopsy/Volatility) dans le conteneur par défaut ; vous pouvez les installer sur votre machine et analyser des images disque ou des exports de volumes Docker.

## Analyse de trafic (pcap)

### Capturer du trafic

Sur la machine hôte (accès au réseau Docker) :

```bash
# Trouver l’interface du bridge Docker (ex: docker0)
ip link show
# Capturer le trafic du bridge
sudo tcpdump -i docker0 -w lab-capture.pcap
```

Depuis le conteneur attaquant (trafic entrant/sortant de ce conteneur) :

```bash
tcpdump -i eth0 -w /workspace/capture.pcap
# Puis lancer des scans/attaques dans un autre terminal
```

### Analyser avec tshark (conteneur attaquant)

```bash
docker compose exec attaquant bash
tshark -r /workspace/capture.pcap -Y "http" -T fields -e frame.number -e ip.src -e ip.dst -e http.request.uri
tshark -r /workspace/capture.pcap -Y "tcp.flags.syn==1"  # connexions TCP
```

## Exercices forensique (solo)

- [ ] Capturer 2–3 minutes de trafic pendant que vous lancez nmap et des requêtes HTTP (curl, nikto).
- [ ] Identifier dans le pcap : IP source de l’attaquant, IP cible, ports scannés, requêtes HTTP.
- [ ] Exporter les requêtes HTTP “suspectes” (ex : paramètres SQLi) et les noter dans un mini-rapport.

## Bonnes pratiques

- **Chaîne de custode** : noter date/heure de capture, outil utilisé, lieu de stockage du fichier.
- **Copie de travail** : analyser une copie du pcap, pas l’original.
