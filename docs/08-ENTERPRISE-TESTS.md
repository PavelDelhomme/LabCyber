# Tests attendus en entreprise – Mapping avec le lab

Ce document fait le lien entre les **référentiels et types de tests** courants en entreprise et ce que vous pouvez pratiquer dans ce lab.

## Référentiels et normes

| Référentiel | Ce que le lab couvre | Comment |
|-------------|----------------------|--------|
| **OWASP Top 10** | Injection, XSS, CSRF, auth, config, etc. | DVWA, Juice Shop, bWAPP, vuln-api ([01-WEB.md](01-WEB.md), [03-APPLICATIONS.md](03-APPLICATIONS.md)) |
| **OWASP API Security Top 10** | Auth, IDOR, injection, exposition de données | vuln-api, Juice Shop ([03-APPLICATIONS.md](03-APPLICATIONS.md)) |
| **Pentest réseau** | Scan, services, brute force, accès | vuln-network ([02-RESEAU.md](02-RESEAU.md)) |
| **Red Team** | Scénario d’attaque bout en bout | Toutes les cibles, méthodo [04-RED-TEAM.md](04-RED-TEAM.md) |
| **Blue Team / SOC** | Détection, analyse de trafic, réponse à incident | Suricata, pcaps, logs ([05-BLUE-TEAM.md](05-BLUE-TEAM.md), [06-FORENSIQUE.md](06-FORENSIQUE.md)) |
| **Forensique** | Analyse trafic, preuves | tshark, tcpdump ([06-FORENSIQUE.md](06-FORENSIQUE.md)) |
| **OSINT** | Reconnaissance légale | theHarvester, dig, recon interne ([07-OSINT.md](07-OSINT.md)) |
| **Stéganographie** | Données cachées (images, fichiers) | steghide, exiftool, binwalk, défis ([10-STEGANOGRAPHY.md](10-STEGANOGRAPHY.md)) |
| **Cryptographie** | Chiffrement, hachage, encodage | openssl, gpg, base64, john, défis ([11-CRYPTOGRAPHY.md](11-CRYPTOGRAPHY.md)) |

## Types de missions “entreprise” simulables

- **Audit web / OWASP** : tests sur DVWA, Juice Shop, bWAPP (injection, XSS, CSRF, upload, etc.).
- **Audit API** : tests sur vuln-api (auth, IDOR, SQLi) + Juice Shop.
- **Pentest interne / réseau** : scan et exploitation de vuln-network (SSH, Redis).
- **Simulation Red Team** : scénarios [04-RED-TEAM.md](04-RED-TEAM.md) avec livrables type rapport.
- **Exercice Blue Team** : capture trafic + analyse Suricata + fiche incident [05-BLUE-TEAM.md](05-BLUE-TEAM.md).
- **Analyse forensique** : analyse de pcap après “incident” simulé [06-FORENSIQUE.md](06-FORENSIQUE.md).

## Ce que le lab ne remplace pas (à faire en formation / autre env)

- **Active Directory** : pas de domaine Windows dans ce lab ; pour AD, utiliser des labs dédiés (VMs, Detection Lab, etc.).
- **Tests mobiles** : pas d’app mobile dans le lab ; à faire sur émulateur / appareil dédié.
- **Audit physique / social engineering** : hors scope.
- **Conformité complète PCI-DSS / ISO 27001** : le lab donne la **pratique technique** ; la conformité exige processus, documentation, périmètre réel.

## Checklist “prêt entreprise”

- [ ] Avoir réalisé au moins un audit web complet (OWASP) sur une cible du lab.
- [ ] Avoir réalisé un pentest réseau sur vuln-network (scan + exploitation).
- [ ] Avoir réalisé un scénario Red Team solo avec rapport.
- [ ] Avoir analysé un pcap avec Suricata/tshark et rédigé une fiche incident (Blue Team).
- [ ] Connaître le mapping des tests entreprise (ce document) et les docs par catégorie.
