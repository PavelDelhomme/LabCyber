# Documentation du Lab Cyber – Index

Ce lab couvre **toutes les catégories** de la cybersécurité : web, réseau, app, Red/Blue Team, forensique, OSINT, stéganographie, cryptographie, **phishing / spam / social engineering**. **Un seul port** (gateway) pour tout : plateforme, cibles, terminal web. Interface web type TryHackMe / HackTheBox + **ligne de commande** (`make shell`). Modulaire (profils proxy, blue). **Comment faire quoi** : [USAGE.md](USAGE.md).

## Plateforme web (interface unique)

Après `docker compose up -d`, ouvre **http://localhost:4080** pour accéder au lab :

- **Tableau de bord** : scénarios guidés et rooms par catégorie.
- **Scénarios guidés** : parcours pas à pas (style TryHackMe / HackTheBox) avec tâches, commandes à copier, tips et « ce que tu apprends » ; cases à cocher persistées.
- **Rooms** : objectifs, **accès direct aux machines** (liens vers DVWA, Juice Shop, vuln-api, vuln-network, etc.), tâches avec explications et tips.
- **Défis stégano / crypto** : téléchargement des fichiers depuis les rooms concernées.
- **Journal d’activité** : panneau latéral avec les logs (navigation, scénarios, rooms, copie de commandes, etc.) ; export JSON / TXT, effacement.
- **Démo phishing** : http://localhost:4080/demo-phishing.html (page pédagogique).
- **Terminal lab** : dans la plateforme, panneau Lab → Terminal (ouvrir en panneau ou en nouvel onglet `#/terminal-full`) ; ou http://…/terminal/ en direct ; ou `make shell` en CLI. **Notes du lab** : dans le panneau Lab, zone de notes par lab (fichiers, IP, commandes). **CVE** : bouton CVE → recherche par ID ou par mot-clé (NVD), résultats et détails dans l’interface.
- **Test du logger** : http://lab.local:4080/test-logs.html.

## Vue d’ensemble des catégories

| Catégorie | Doc | Cibles / Outils | Tests entreprise |
|-----------|-----|-----------------|------------------|
| **Web** | [01-WEB.md](01-WEB.md) | DVWA, Juice Shop, bWAPP | OWASP Top 10, audit web |
| **Réseau** | [02-RESEAU.md](02-RESEAU.md) | vuln-network (SSH, Redis) | Pentest réseau, scan vulns |
| **Applications / API** | [03-APPLICATIONS.md](03-APPLICATIONS.md) | vuln-api, Juice Shop | API sec, IDOR, SQLi |
| **Red Team** | [04-RED-TEAM.md](04-RED-TEAM.md) | Attaquant + toutes cibles | Simulation d’attaquant |
| **Blue Team** | [05-BLUE-TEAM.md](05-BLUE-TEAM.md) | Suricata, logs | Détection, réponse à incident |
| **Forensique** | [06-FORENSIQUE.md](06-FORENSIQUE.md) | tshark, pcaps | Analyse post-incident |
| **OSINT** | [07-OSINT.md](07-OSINT.md) | theHarvester, recon | Renseignement sources ouvertes |
| **Stéganographie** | [10-STEGANOGRAPHY.md](10-STEGANOGRAPHY.md) | steghide, exiftool, binwalk, défis plateforme | CTF, analyse de fichiers |
| **Cryptographie** | [11-CRYPTOGRAPHY.md](11-CRYPTOGRAPHY.md) | openssl, gpg, base64, john, défis plateforme | Chiffrement, hachage, encodage |
| **Phishing / Spam / Social Engineering** | [12-SOCIAL-ENGINEERING-PHISHING.md](12-SOCIAL-ENGINEERING-PHISHING.md) | Démo page type phishing, sensibilisation | Reconnaissance, défense, cadre légal |
| **Tests entreprise** | [08-ENTERPRISE-TESTS.md](08-ENTERPRISE-TESTS.md) | Mapping des référentiels | PCI-DSS, ISO 27001, pentest |

## Parcours recommandé

1. **Démarrage** : [GETTING_STARTED.md](GETTING_STARTED.md) – lancer le lab, ouvrir la plateforme (http://localhost:4080).
2. **Web** : [01-WEB.md](01-WEB.md) – DVWA, Juice Shop, bWAPP.
3. **Réseau** : [02-RESEAU.md](02-RESEAU.md) – vuln-network.
4. **API** : [03-APPLICATIONS.md](03-APPLICATIONS.md) – vuln-api.
5. **Red Team** : [04-RED-TEAM.md](04-RED-TEAM.md) – scénarios solo.
6. **Blue Team** : [05-BLUE-TEAM.md](05-BLUE-TEAM.md) – Suricata.
7. **Stéganographie** : [10-STEGANOGRAPHY.md](10-STEGANOGRAPHY.md) – défis sur la plateforme.
8. **Cryptographie** : [11-CRYPTOGRAPHY.md](11-CRYPTOGRAPHY.md) – défis sur la plateforme.
9. **Phishing / Spam / Social Engineering** : [12-SOCIAL-ENGINEERING-PHISHING.md](12-SOCIAL-ENGINEERING-PHISHING.md) – reconnaître, se défendre, démo sur la plateforme.
10. **Catalogue** : [09-LAB-CATALOG.md](09-LAB-CATALOG.md) – tous les exercices.
11. **Tests** : [TESTS.md](TESTS.md) – lancer les tests automatisés (`./scripts/run-tests.sh`).
12. **Logs** : [LOGGING.md](LOGGING.md) – système de logs (format, où, export, tests).

## Tests et logs

- **Tests automatisés** : à la racine du projet, avec le lab démarré : `./scripts/run-tests.sh`. Vérifie JSON, conteneurs, HTTP (plateforme et cibles), réseau (attaquant → vuln-network), logs vuln-api et logs frontend. Détail : [TESTS.md](TESTS.md).
- **Logs** : la plateforme enregistre les actions (vue, scénario, room, copie de commande, etc.) dans le journal d’activité et en localStorage ; vuln-api écrit des logs structurés (fichier + stdout). Format et export : [LOGGING.md](LOGGING.md).

## Commandes globales (Makefile)

```bash
make up      # Démarrer le lab
make down    # Arrêter le lab
make test    # Tests (si lab non démarré, seuls JSON + logs frontend)
make shell   # Shell dans le conteneur attaquant
make proxy   # Lab + proxy Squid (3128)
make blue    # Lab + Suricata
make help    # Liste des cibles
```

Sans Makefile : `docker compose up -d`, `docker compose --profile blue up -d`, `docker compose exec attaquant bash`.

## Structure des docs (liste complète)

| Fichier | Contenu |
|---------|---------|
| **00-INDEX.md** | Ce fichier – index, parcours, commandes, structure des docs. |
| **USAGE.md** | **Comment faire quoi** : un seul port, /etc/hosts, make up, URLs (lab.local, dvwa.lab, terminal.lab…), CLI, dépannage. |
| **GETTING_STARTED.md** | Démarrage pas à pas : lancer le lab, plateforme web, URLs des cibles (gateway), identifiants, dépannage. |
| **01-WEB.md** | Web : DVWA, Juice Shop, bWAPP, OWASP. |
| **02-RESEAU.md** | Réseau : vuln-network (SSH, Redis), pentest. |
| **03-APPLICATIONS.md** | Applications / API : vuln-api, Juice Shop, SQLi, IDOR. |
| **04-RED-TEAM.md** | Red Team : scénarios d’attaque (solo). |
| **05-BLUE-TEAM.md** | Blue Team : Suricata, détection. |
| **06-FORENSIQUE.md** | Forensique : tshark, tcpdump, pcaps. |
| **07-OSINT.md** | OSINT : theHarvester, recon. |
| **08-ENTERPRISE-TESTS.md** | Tests entreprise : mapping OWASP, pentest, Red/Blue. |
| **09-LAB-CATALOG.md** | Catalogue de tous les labs par catégorie. |
| **10-STEGANOGRAPHY.md** | Stéganographie : outils, défis plateforme. |
| **11-CRYPTOGRAPHY.md** | Cryptographie : outils, défis plateforme. |
| **12-SOCIAL-ENGINEERING-PHISHING.md** | Phishing, spam, social engineering : reconnaissance, défense, démo. |
| **TESTS.md** | Tests automatisés : `make test` / `scripts/run-tests.sh`, test manuel du logger. |
| **LOGGING.md** | Système de logs : format, plateforme (frontend), vuln-api, export, tests. |
| **PROXY-VPN.md** | Proxy Squid (make proxy), accès distant (tunnel SSH, VPN sur l’hôte). |
| **15-LINUX-RESEAU.md** | Linux en profondeur (fichiers, processus, réseau), connexion (proxy, VPN), intégration lab. |
