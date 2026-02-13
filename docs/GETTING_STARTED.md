# Démarrer le lab – Guide pas à pas

## 1. Lancer l'environnement

```bash
cd /chemin/vers/LabCyber
docker compose up -d
```

Attendre que tous les services soient « healthy » ou « running » :

```bash
docker compose ps
```

## 2. Accès aux cibles (depuis votre navigateur)

| Cible        | URL (sur votre machine)     | Identifiants / remarques |
|-------------|-----------------------------|---------------------------|
| **DVWA**    | http://localhost:4280       | Login : `admin` / Mot de passe : `password`. Puis **Create / Reset Database** en bas de page. |
| **Juice Shop** | http://localhost:3000   | Pas de login requis pour commencer. Inscription libre. |
| **bWAPP**   | http://localhost:4281       | Premier lancement : aller sur http://localhost:4281/install.php puis login : `bee` / `bug`. |

## 3. Utiliser le conteneur attaquant

Le conteneur **attaquant** est sur le même réseau Docker que les cibles. Vous pouvez l’utiliser pour scanner et tester.

### Se connecter au conteneur

```bash
docker compose exec attaquant bash
```

### Depuis l’intérieur du conteneur : hostnames des cibles

- `dvwa` (et `dvwa-db` pour la base)
- `juice-shop`
- `bwapp`

### Exemples de commandes depuis le conteneur attaquant

```bash
# Scan des hôtes sur le réseau
nmap -sV dvwa
nmap -sV juice-shop
nmap -sV bwapp

# Scan web (DVWA sur le port 80 interne)
nikto -h http://dvwa

# Test SQLi avec sqlmap (après avoir repéré un paramètre vulnérable)
# sqlmap -u "http://dvwa/vulnerabilities/sqli/?id=1&Submit=Submit" --cookie="..." --batch
```

Depuis votre machine, les cibles sont aussi accessibles via **localhost** (ports mappés). Vous pouvez donc utiliser Burp Suite, OWASP ZAP ou votre navigateur sur votre OS, en pointant vers `localhost:4280`, `localhost:3000`, `localhost:4281`.

## 4. Parcours d’apprentissage suggéré

1. **DVWA**  
   - Niveau « Low » pour chaque module (SQL Injection, XSS, Command Injection, File Upload, etc.).  
   - Comprendre la requête, reproduire avec `curl` ou Burp, puis passer aux niveaux Medium / High.

2. **Juice Shop**  
   - Suivre les défis dans le scoreboard (icône sur la page).  
   - S’entraîner à l’injection SQL, XSS, broken authentication, etc.

3. **bWAPP**  
   - Parcourir les catégories (Injection, XSS, etc.) et résoudre les exercices niveau par niveau.

## 5. Arrêter le lab

```bash
docker compose down
```

Pour tout supprimer (conteneurs + volumes, réinitialisation complète) :

```bash
docker compose down -v
```

## Dépannage

- **DVWA : "Database not found"**  
  Aller sur la page d’accueil DVWA et cliquer sur **Create / Reset Database**.

- **bWAPP : page blanche ou erreur**  
  Ouvrir une fois http://localhost:4281/install.php pour lancer l’installation.

- **Le conteneur attaquant ne « voit » pas les cibles**  
  Vérifier que tous les services sont bien sur le réseau `lab-network` : `docker network inspect lab-network`.
