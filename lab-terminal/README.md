# lab-terminal – Backend terminal maison Lab Cyber

Service Go qui expose un **PTY** (shell) sur **WebSocket**, protocole binaire compatible avec le client `platform/public/terminal-client.html` (xterm.js).

## Protocole

- **Octet 0** : sortie PTY (serveur → client), le reste du message = données à afficher.
- **Octet 0x30** : entrée clavier (client → serveur), le reste = données à envoyer au PTY.
- **Octet 0x31** : resize (client → serveur), payload = JSON `{ "columns": N, "rows": M }`.

Pas de token obligatoire : `/token` retourne `1` pour compatibilité avec le client actuel.

## Lancer en local

```bash
cd lab-terminal
go mod tidy
go run .
# Écoute sur :7682 (ou PORT=7683 go run .)
```

Puis ouvrir le client en pointant vers ce serveur (voir « Intégration »).

## Intégration gateway (Docker)

Le service `lab-terminal` est dans `docker-compose.yml`. La gateway expose **`/terminal-house/`** (proxy vers lab-terminal:7682).

- **Utiliser le backend maison dans le panneau terminal** : ouvrir le terminal avec l’URL  
  `…/terminal-client.html?path=terminal-house`  
  (ex. dans `getTerminalUrl()` retourner cette URL pour tester).
- **Remplacer ttyd par défaut** : dans `gateway/nginx.conf`, changer  
  `upstream terminal { server attaquant:7681; }`  
  en  
  `upstream terminal { server lab-terminal:7682; }`  
  et ajouter `lab-terminal` aux `depends_on` de la gateway.

## Dépendances

- `github.com/creack/pty` : PTY
- `github.com/gorilla/websocket` : WebSocket

## Roadmap

Voir [docs/ROADMAP-SYSTEME-MAISON.md](../docs/ROADMAP-SYSTEME-MAISON.md) – Phase 2 (backend terminal maison). Prochaines étapes : persistance par lab (historique + sorties), multi-sessions, intégration dans le compose par défaut.
