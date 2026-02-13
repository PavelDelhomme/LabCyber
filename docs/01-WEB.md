# Catégorie Web – Sécurité des applications web

## Objectifs

- Tester les vulnérabilités **OWASP Top 10**.
- Pratiquer **injection SQL**, **XSS**, **CSRF**, **upload de fichiers**, **authentification faible**, etc.

## Cibles dans le lab

| Cible | URL (host) | Identifiants | Focus |
|-------|------------|--------------|--------|
| **DVWA** | http://localhost:4280 ou http://dvwa | admin / password | SQLi, XSS, Command Injection, File Upload, CSRF |
| **Juice Shop** | http://localhost:3000 ou http://juice-shop | (inscription libre) | Défis OWASP, API, XSS, auth |
| **bWAPP** | http://localhost:4281 ou http://bwapp | bee / bug (après /install.php) | Très large panel de vulns web |

## Tests à réaliser (checklist)

- [ ] **Injection SQL** : DVWA SQL Injection (Low/Medium/High), vuln-api `/api/products?q=`
- [ ] **XSS (réfléchi, stocké, DOM)** : DVWA XSS, Juice Shop défis
- [ ] **CSRF** : DVWA CSRF, modifier un état côté serveur via une requête forgée
- [ ] **Authentification / session** : faible mot de passe, session fixation (DVWA, bWAPP)
- [ ] **Upload de fichiers** : DVWA File Upload (webshell, double extension)
- [ ] **Inclusion de fichiers (LFI/RFI)** : bWAPP
- [ ] **Configuration sécurisée** : désactivation de headers, verbes HTTP (Nikto)
- [ ] **Sensibles data exposure** : fuite d’infos dans réponses, commentaires HTML

## Outils (conteneur attaquant)

```bash
docker compose exec attaquant bash

# Scan générique
nikto -h http://dvwa
nikto -h http://juice-shop
nikto -h http://bwapp

# Énumération répertoires
gobuster dir -u http://dvwa/ -w /usr/share/wordlists/dirb/common.txt
dirb http://dvwa/

# SQLi automatisé (après avoir repéré un paramètre vulnérable)
sqlmap -u "http://dvwa/vulnerabilities/sqli/?id=1&Submit=Submit" --cookie="PHPSESSID=xxx;security=low" --batch
```

Depuis votre machine : **Burp Suite** ou **OWASP ZAP** sur localhost:4280, 3000, 4281.

## Référentiels

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
