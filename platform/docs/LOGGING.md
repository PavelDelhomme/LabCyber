# Logging – Lab Cyber

Ce document décrit le **système de logs** de la plateforme Lab Cyber : où et comment les logs sont enregistrés, leur format, et comment les exporter ou les tester. Pour les tests automatisés (dont les tests des logs), voir [TESTS.md](TESTS.md). Pour la doc générale : [00-INDEX.md](00-INDEX.md), [GETTING_STARTED.md](GETTING_STARTED.md).

## Vue d’ensemble

| Composant | Où sont les logs | Format | Export / test |
|-----------|-------------------|--------|----------------|
| **Plateforme web (frontend)** | Mémoire JS + `localStorage` (clé `labcyber-logs`) + panneau « Journal d’activité » | `ts`, `level`, `component`, `action`, `message`, `details` | Export JSON / TXT depuis le panneau ; test via `run-tests.sh` (logs frontend) |
| **vuln-api** | Fichier `/data/app.log` + stdout (docker logs) | Une ligne JSON par événement (même structure) | `docker compose logs vuln-api` ; lecture de `app.log` dans le conteneur |
| **Autres services** | Stdout / stderr | Selon chaque service | `docker compose logs <service>` |

Tous les logs métier utilisent une structure commune pour faciliter l’analyse et l’audit.

---

## Format commun (détaillé)

Chaque entrée de log contient :

- **ts** : Horodatage ISO 8601 (UTC).
- **level** : `DEBUG`, `INFO`, `WARN`, `ERROR`.
- **component** : Composant émetteur (ex. `platform`, `vuln-api`).
- **action** : Action ou type d’événement (ex. `view_changed`, `request`, `login_attempt`).
- **message** : Message lisible (souvent identique ou dérivé de `action`).
- **details** : Objet libre (clés/valeurs) pour préciser le contexte (IDs, statuts, durées, etc.).

Exemple frontend :

```json
{
  "ts": "2025-02-13T10:00:00.000Z",
  "level": "INFO",
  "component": "platform",
  "action": "scenario_opened",
  "message": "scenario_opened",
  "details": { "scenarioId": "intro-nmap", "title": "Découverte réseau avec Nmap" }
}
```

Exemple vuln-api (une ligne JSON par log) :

```json
{"ts": "2025-02-13T10:00:01.000Z", "level": "INFO", "component": "vuln-api", "action": "request", "message": "GET /api/health -> 200", "details": {"method": "GET", "path": "/api/health", "status_code": 200, "duration_ms": 0.5}}
```

---

## Plateforme web (frontend)

### Où c’est enregistré

- **En mémoire** : jusqu’à 500 entrées (dernières conservées).
- **localStorage** : clé `labcyber-logs`, jusqu’à 1000 entrées (pour persistance entre rechargements).
- **Panneau « Journal d’activité »** : affichage des dernières entrées (environ 100), mises à jour en temps réel.

### Événements logués (détaillés)

| Action | Composant | Détails typiques |
|--------|-----------|-------------------|
| `app_init` | platform | Démarrage de l’app |
| `data_load_start` | platform | Début chargement rooms/scenarios |
| `data_load_success` | platform | Succès : `rooms`, `scenarios` (nombre) |
| `data_load_fail` | platform | Erreur (niveau ERROR) : `message` |
| `view_changed` | platform | `viewId` (dashboard, scenario, room) |
| `scenario_opened` | platform | `scenarioId`, `title` |
| `scenario_task_toggled` | platform | `scenarioId`, `taskIndex`, `done` |
| `command_copied` | platform | `scenarioId`, `length` (longueur texte copié) |
| `room_opened` | platform | `roomId`, `title` |
| `machine_link_clicked` | platform | `context` (scenario/room), `scenarioId` ou `roomId`, `name`, `url` |
| `challenge_download_clicked` | platform | `roomId`, `name`, `url` |
| `logs_exported` | platform | `format` (json / txt) |
| `logs_cleared` | platform | Panneau vidé |

### Export

- **Export JSON** : télécharge un fichier avec toutes les entrées en mémoire (format détaillé ci‑dessus).
- **Export TXT** : télécharge un fichier texte lisible (une ligne par entrée).
- **Effacer** : vide la mémoire et le `localStorage` pour les logs Lab Cyber.

### Fichiers

- `platform/js/logger.js` : logger réutilisable (API : `event()`, `INFO()`, `ERROR()`, `getEntries()`, `exportAsJson()`, `exportAsText()`, `clear()`).
- `platform/js/app.js` : appelle le logger pour chaque action utilisateur listée ci‑dessus.
- Panneau : `platform/index.html` (section `#log-panel`), styles dans `platform/css/style.css` (`.log-panel`, `.log-panel-header`, `#log-entries`, etc.).

---

## vuln-api (backend)

### Où c’est enregistré

- **Fichier** : `/data/app.log` dans le conteneur (volume monté si configuré).
- **Stdout** : visible via `docker compose logs vuln-api`.

### Événements logués (détaillés)

- **request** (après chaque requête) : `method`, `path`, `status_code`, `duration_ms`.
- **startup** : au démarrage de l’app (`db`, `log_file`).
- **health** : appel à `/api/health`.
- **login_attempt** : tentative de login (`login`).
- **login_success** / **login_failed** : résultat login (`login`, éventuellement `role`).
- **get_user** : consultation user (`uid`).
- **get_user_not_found** : user introuvable (`uid`).
- **products_query** : liste produits (`q`).
- **products_error** : erreur SQL sur produits (`q`, message d’erreur).

Format : une ligne JSON par log (même structure `ts`, `level`, `component`, `action`, `message`, `details`).

---

## Tests des logs

### Frontend (plateforme)

- **Manuel** : ouvrir la plateforme, naviguer (accueil, scénario, room, copier une commande, cliquer une machine), puis vérifier que le panneau « Journal d’activité » affiche des entrées détaillées ; exporter en JSON et vérifier la structure.
- **Automatisé** : le script `scripts/run-tests.sh` peut inclure une étape « Logs frontend » : charger une page qui injecte le script et vérifier (via un outil headless ou une page de test) que `localStorage.getItem('labcyber-logs')` contient un tableau non vide après une action, ou qu’une requête à une page de test dédiée retourne des entrées.

Une page de test optionnelle `platform/test-logs.html` peut appeler `LabCyberLogger.event('test', 'ping', {})` puis afficher `LabCyberLogger.getEntries()` pour valider que le logger fonctionne.

### vuln-api

- **Manuel** : `curl http://127.0.0.1:5000/api/health` puis `docker compose logs vuln-api --tail=20` : une ligne JSON doit contenir `"action": "request"` et `"path": "/api/health"`.
- **Automatisé** : dans `run-tests.sh`, après l’appel à `/api/health`, vérifier que les logs du conteneur (ou le fichier `app.log` si accessible) contiennent une entrée pour cette requête (par ex. grep sur `request` et `api/health`).

Voir aussi `docs/TESTS.md` pour la liste des tests et comment lancer `scripts/run-tests.sh`.

---

## Bonnes pratiques

- **Ne pas logger de secrets** : pas de mots de passe en clair dans `details` (les logs login peuvent contenir le login, pas le mot de passe).
- **Composant et action** : toujours renseigner `component` et `action` pour filtrer facilement (par composant, par type d’événement).
- **details** : garder des infos utiles (IDs, statuts, durées) sans surcharger (pas de gros payloads).
- **Niveaux** : utiliser `ERROR` pour les échecs critiques, `WARN` pour les échecs métier (ex. login invalide), `INFO` pour le flux normal, `DEBUG` si besoin de traçabilité fine.

Ce système permet de s’assurer que tout est enregistré au bon moment au bon endroit pour la plateforme, avec des logs détaillés et cohérents partout.
