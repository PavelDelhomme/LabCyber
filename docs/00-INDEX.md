# Documentation du Lab Cyber – Index

Ce lab couvre **toutes les catégories** de la cybersécurité (web, réseau, app, Red/Blue Team, forensique, OSINT, **stéganographie**, **cryptographie**), avec une **plateforme web** type TryHackMe pour suivre les rooms, accéder aux machines et télécharger les défis.

## Plateforme web (interface unique)

Après `docker compose up -d`, ouvre **http://localhost:8080** pour accéder au lab :

- **Tableau de bord** : toutes les rooms par catégorie.
- **Rooms** : objectifs, **accès direct aux machines** (liens vers DVWA, Juice Shop, vuln-api, etc.), tâches avec **explications et tips**.
- **Défis stégano / crypto** : téléchargement des fichiers depuis la plateforme.

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
| **Tests entreprise** | [08-ENTERPRISE-TESTS.md](08-ENTERPRISE-TESTS.md) | Mapping des référentiels | PCI-DSS, ISO 27001, pentest |

## Parcours recommandé

1. **Démarrage** : [GETTING_STARTED.md](GETTING_STARTED.md) – lancer le lab, ouvrir la plateforme (http://localhost:8080).
2. **Web** : [01-WEB.md](01-WEB.md) – DVWA, Juice Shop, bWAPP.
3. **Réseau** : [02-RESEAU.md](02-RESEAU.md) – vuln-network.
4. **API** : [03-APPLICATIONS.md](03-APPLICATIONS.md) – vuln-api.
5. **Red Team** : [04-RED-TEAM.md](04-RED-TEAM.md) – scénarios solo.
6. **Blue Team** : [05-BLUE-TEAM.md](05-BLUE-TEAM.md) – Suricata.
7. **Stéganographie** : [10-STEGANOGRAPHY.md](10-STEGANOGRAPHY.md) – défis sur la plateforme.
8. **Cryptographie** : [11-CRYPTOGRAPHY.md](11-CRYPTOGRAPHY.md) – défis sur la plateforme.
9. **Catalogue** : [09-LAB-CATALOG.md](09-LAB-CATALOG.md) – tous les exercices.

## Commandes globales

```bash
# Démarrer tout le lab (sans profil blue)
docker compose up -d

# Démarrer avec le profil Blue Team (Suricata)
docker compose --profile blue up -d

# Se connecter au conteneur attaquant
docker compose exec attaquant bash
```

## Structure des docs

- **00-INDEX.md** (ce fichier) – index et parcours.
- **GETTING_STARTED.md** – installation, plateforme web, URLs, identifiants.
- **01-WEB.md** à **07-OSINT.md** – fiches par catégorie.
- **08-ENTERPRISE-TESTS.md** – mapping des tests entreprise.
- **09-LAB-CATALOG.md** – catalogue de tous les labs.
- **10-STEGANOGRAPHY.md** – stéganographie (outils, défis).
- **11-CRYPTOGRAPHY.md** – cryptographie (outils, défis).
