# Catalogue des labs – Tous les exercices par catégorie

Liste centralisée des **labs et exercices** que vous pouvez faire dans ce projet, avec la catégorie et la doc associée.

**Depuis la plateforme** (http://localhost:4080) : les **scénarios guidés** (style TryHackMe / HackTheBox) proposent des parcours pas à pas avec tâches et commandes ; les **rooms** par catégorie donnent objectifs, accès aux machines et défis. Voir [GETTING_STARTED.md](GETTING_STARTED.md) et [00-INDEX.md](00-INDEX.md).

---

## Web

| Lab | Cible | Objectif | Doc |
|-----|--------|----------|-----|
| SQLi (niveaux) | DVWA | Low → High, manuel + sqlmap | [01-WEB.md](01-WEB.md) |
| XSS réfléchi / stocké | DVWA, Juice Shop | Vol de cookie, exécution de script | [01-WEB.md](01-WEB.md) |
| CSRF | DVWA | Changer le mot de passe via requête forgée | [01-WEB.md](01-WEB.md) |
| File Upload | DVWA | Upload webshell, bypass extension | [01-WEB.md](01-WEB.md) |
| Command Injection | DVWA | Exécution de commandes via paramètre | [01-WEB.md](01-WEB.md) |
| Défis Juice Shop | Juice Shop | Scoreboard, tous les challenges | [01-WEB.md](01-WEB.md) |
| LFI / RFI | bWAPP | Inclusion de fichiers | [01-WEB.md](01-WEB.md) |
| Scan Nikto / Dirb | Toutes web | Découverte et vulns génériques | [01-WEB.md](01-WEB.md) |

---

## Réseau

| Lab | Cible | Objectif | Doc |
|-----|--------|----------|-----|
| Découverte des services | vuln-network | nmap -sV, -sC | [02-RESEAU.md](02-RESEAU.md) |
| Redis non authentifié | vuln-network:6379 | Connexion, INFO, CONFIG | [02-RESEAU.md](02-RESEAU.md) |
| SSH mot de passe faible | vuln-network:22 | Connexion root/labpassword | [02-RESEAU.md](02-RESEAU.md) |
| Brute force SSH | vuln-network | Hydra sur SSH | [02-RESEAU.md](02-RESEAU.md) |

---

## Applications / API

| Lab | Cible | Objectif | Doc |
|-----|--------|----------|-----|
| Auth faible + pas de rate limit | vuln-api /api/login | Tester mots de passe, absence de blocage | [03-APPLICATIONS.md](03-APPLICATIONS.md) |
| IDOR | vuln-api /api/users/<id> | Accéder aux utilisateurs 1 et 2 | [03-APPLICATIONS.md](03-APPLICATIONS.md) |
| SQLi sur API | vuln-api /api/products?q= | Manuel + sqlmap | [03-APPLICATIONS.md](03-APPLICATIONS.md) |
| API Juice Shop | Juice Shop | Défis liés à l’API | [01-WEB.md](01-WEB.md), [03-APPLICATIONS.md](03-APPLICATIONS.md) |

---

## Red Team

| Lab | Cibles | Objectif | Doc |
|-----|--------|----------|-----|
| Scénario “réseau” | vuln-network | Accès root ou Redis | [04-RED-TEAM.md](04-RED-TEAM.md) |
| Scénario “web + données” | DVWA, vuln-api | Extraction de données (SQLi, IDOR) | [04-RED-TEAM.md](04-RED-TEAM.md) |
| Scénario “web → app” | Juice Shop, vuln-api | Chaîne d’exploitation | [04-RED-TEAM.md](04-RED-TEAM.md) |
| Scénario “full lab” | Toutes | Un accès ou extraction par catégorie + rapport | [04-RED-TEAM.md](04-RED-TEAM.md) |

---

## Blue Team

| Lab | Outil / Donnée | Objectif | Doc |
|-----|----------------|----------|-----|
| Analyse pcap avec Suricata | blue-suricata | Démarrer profil blue, analyser un pcap | [05-BLUE-TEAM.md](05-BLUE-TEAM.md) |
| Capture + détection | tcpdump + Suricata | Capturer pendant des scans, analyser alertes | [05-BLUE-TEAM.md](05-BLUE-TEAM.md) |
| Fiche incident | Logs / alertes | Rédiger identification, preuve, recommandation | [05-BLUE-TEAM.md](05-BLUE-TEAM.md) |

---

## Forensique

| Lab | Outil | Objectif | Doc |
|-----|-------|----------|-----|
| Capture trafic | tcpdump | Générer un pcap pendant des attaques | [06-FORENSIQUE.md](06-FORENSIQUE.md) |
| Analyse pcap | tshark | Filtrer HTTP, TCP, identifier scans et requêtes | [06-FORENSIQUE.md](06-FORENSIQUE.md) |
| Mini-rapport forensique | - | Chaîne de custode + preuves extraites du pcap | [06-FORENSIQUE.md](06-FORENSIQUE.md) |

---

## OSINT

| Lab | Outil | Objectif | Doc |
|-----|-------|----------|-----|
| Harvesting (domaine propre) | theHarvester | Emails, sous-domaines sur un domaine que vous contrôlez | [07-OSINT.md](07-OSINT.md) |
| Recon “interne” lab | nmap, nikto | Cartographie des cibles du lab comme en pentest | [07-OSINT.md](07-OSINT.md) |

---

## Stéganographie

| Lab | Cible / Outil | Objectif | Doc |
|-----|----------------|----------|-----|
| Défi image (steghide) | Plateforme → Défis stego | Télécharger image_stego.jpg, extraire avec steghide (mot de passe : labstego) | [10-STEGANOGRAPHY.md](10-STEGANOGRAPHY.md) |
| file, exiftool, binwalk | Conteneur attaquant | Identifier le type de fichier, métadonnées, fichiers embarqués | [10-STEGANOGRAPHY.md](10-STEGANOGRAPHY.md) |

---

## Cryptographie

| Lab | Cible / Outil | Objectif | Doc |
|-----|----------------|----------|-----|
| Base64 | Plateforme → Défis crypto | Décoder flag_b64.txt | [11-CRYPTOGRAPHY.md](11-CRYPTOGRAPHY.md) |
| OpenSSL (AES) | Plateforme → Défis crypto | Déchiffrer flag.enc (mot de passe : labcrypto) | [11-CRYPTOGRAPHY.md](11-CRYPTOGRAPHY.md) |
| Hachage / John | Conteneur attaquant | Casser un hash avec John the Ripper | [11-CRYPTOGRAPHY.md](11-CRYPTOGRAPHY.md) |

---

## Phishing / Spam / Social Engineering

| Lab | Cible / Outil | Objectif | Doc |
|-----|----------------|----------|-----|
| Reconnaître le phishing | Plateforme → room Phishing + démo /demo-phishing.html | Identifier une page type phishing, indices dans l’email | [12-SOCIAL-ENGINEERING-PHISHING.md](12-SOCIAL-ENGINEERING-PHISHING.md) |
| Spam et arnaques | Plateforme → room Spam | Bonnes pratiques, signalement, ne pas cliquer | [12-SOCIAL-ENGINEERING-PHISHING.md](12-SOCIAL-ENGINEERING-PHISHING.md) |
| Social engineering | Plateforme → room Social Engineering | Vecteurs (vishing, smishing), principes de défense | [12-SOCIAL-ENGINEERING-PHISHING.md](12-SOCIAL-ENGINEERING-PHISHING.md) |

---

## Profils Docker

- **Défaut** : toutes les cibles + attaquant (pas de Suricata).
- **Blue** : en plus, conteneur `blue-suricata` pour l’analyse de pcaps.  
  `docker compose --profile blue up -d`
