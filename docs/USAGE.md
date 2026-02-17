# Comment utiliser le lab – Pas à pas

Tout le lab est accessible via **un seul port** (par défaut 8080). Tu peux tout faire depuis l’**interface web** ou en **ligne de commande**.

---

## 1. Préparer la machine (une fois)

### 1.1 Port (éviter les conflits)

Si le port 8080 est déjà pris sur ta machine, crée un fichier `.env` à la racine du projet :

```bash
cd /chemin/vers/LabCyber
echo "GATEWAY_PORT=8081" > .env
```

Tu peux utiliser n’importe quel port libre (ex. 8081, 9090). **Tout le lab** (plateforme, cibles, terminal web) passera par ce port.

### 1.2 Hostnames (obligatoire pour la gateway)

Pour que les cibles (DVWA, Juice Shop, API, etc.) et le terminal fonctionnent, ajoute ces lignes dans ton fichier **hosts** :

- **Linux / macOS** : `sudo nano /etc/hosts`
- **Windows** : `C:\Windows\System32\drivers\etc\hosts` (en admin)

Ajoute (en remplaçant `8080` par ton port si tu as changé) :

```
127.0.0.1   lab.local dvwa.lab juice.lab api.lab bwapp.lab terminal.lab
```

Sauvegarde et ferme. Ainsi, le navigateur et les tests pourront joindre chaque service via le **même port** (gateway).

---

## 2. Démarrer le lab

```bash
cd /chemin/vers/LabCyber
make up
```

Ou : `docker compose up -d`.

Vérifier que tout tourne : `make status` (ou `docker compose ps`).

---

## 3. Accéder au lab

### 3.1 Ouvrir la plateforme dans le navigateur (une commande)

À la racine du projet :

```bash
./lab web
```

Cela ouvre **http://lab.local:PORT** dans ton navigateur (sous Linux/macOS/Windows). Tu peux aussi lancer le **menu interactif** : `./lab tui` puis choisir « Ouvrir la plateforme dans le navigateur ».

### 3.2 Interface web (tout-en-un)

Ouvre dans ton navigateur (en utilisant le **même port** que dans `.env` ou 8080) :

- **Plateforme (accueil, scénarios, rooms)** :  
  **http://lab.local:8080**  
  (ou http://localhost:8080)

Depuis la plateforme tu as :

- **Accueil** : scénarios guidés, rooms, section « Mon poste ».
- **Terminal lab** : ouvre **http://localhost:7681** pour lancer le terminal dans le navigateur (ttyd, pas besoin de /etc/hosts). Ou via la plateforme : lien « Terminal lab » → terminal.lab:8080 si tu as configuré /etc/hosts.
- **Cibles** : en ouvrant une room (DVWA, Juice Shop, vuln-api, etc.), les liens « machines » pointent vers :
  - **http://dvwa.lab:8080** (DVWA)
  - **http://juice.lab:8080** (Juice Shop)
  - **http://api.lab:8080** (vuln-api)
  - **http://bwapp.lab:8080** (bWAPP)  
  Toujours le **même port** (8080 ou celui défini dans `.env`).

### 3.2 Ligne de commande (sans navigateur)

- **Shell dans le conteneur attaquant** (équivalent du terminal web) :

```bash
make shell
```

Ou : `docker compose exec attaquant bash`.

Depuis ce shell tu peux lancer nmap, nikto, ssh vers vuln-network, redis-cli, curl vers vuln-api, etc. Les hostnames (dvwa, juice-shop, vuln-api, vuln-network) sont résolus sur le réseau Docker.

### 3.3 Démarrer le lab (make dev = make up)

**make dev** et **make up** font la même chose : ils démarrent le lab **via Docker** (aucun run manuel npm/vite). La plateforme (app Preact/Vite) est servie sur **http://127.0.0.1:8080** (port gateway).

```bash
make up
# ou
make dev
```

---

## 4. Résumé des URLs (un seul port)

| Rôle              | URL (ex. port 8080)     | Remarque                    |
|-------------------|--------------------------|-----------------------------|
| Plateforme        | http://lab.local:8080    | Accueil, scénarios, rooms   |
| Terminal web      | http://terminal.lab:8080 | Terminal = conteneur attaquant (attaques depuis le navigateur) |
| Documentation     | Menu « Documentation » sur la plateforme | Index, usage, tests, catégories (Web, Réseau, API, etc.) |
| DVWA              | http://dvwa.lab:8080     | Créer la base en bas de page |
| Juice Shop        | http://juice.lab:8080    | Inscription libre           |
| vuln-api          | http://api.lab:8080      | /api/login, /api/users/1…   |
| bWAPP             | http://bwapp.lab:8080    | install.php une fois        |

Tout passe par la **gateway** sur le port configuré ; aucun autre port n’est exposé (sauf proxy Squid en option avec `make proxy`).

---

## 5. Options modulaires

- **Proxy Squid** (entraînement proxy / pivot) : `make proxy` puis utiliser le proxy sur le port indiqué (ex. 3128).
- **Blue Team (Suricata)** : `make blue` pour ajouter le conteneur d’analyse.
- **Tests** : `make test` (résilient si le lab n’est pas démarré). `make test-full` exige que le lab soit up.
- **Arrêter** : `make down`. Tout supprimer (conteneurs + volumes) : `make clean`.

---

## 6. Dépannage

- **« Impossible d’accéder au site »**  
  Vérifier que le lab est démarré (`make status`) et que tu utilises le bon port (8080 ou `GATEWAY_PORT` dans `.env`). Vérifier que `lab.local` et les autres hostnames sont bien dans `/etc/hosts`.

- **Les liens DVWA / Juice / API ne marchent pas**  
  Ils pointent vers dvwa.lab, juice.lab, api.lab. Si ces noms ne sont pas dans `/etc/hosts` (127.0.0.1), le navigateur ne trouvera pas l’hôte.

- **Terminal web (terminal.lab) ne s’ouvre pas**  
  Vérifier que `terminal.lab` est dans `/etc/hosts`. Si l’image attaquant n’a pas ttyd, utiliser en attendant : `make shell` en ligne de commande.

- **Port déjà utilisé**  
  Mettre dans `.env` un autre `GATEWAY_PORT` (ex. 8081) et redémarrer : `make down && make up`.

Voir aussi : [GETTING_STARTED.md](GETTING_STARTED.md), [00-INDEX.md](00-INDEX.md).
