# Tests E2E (Playwright) – Lab Cyber

Les tests E2E s’exécutent **uniquement via le Makefile**, dans un **conteneur Docker** (image Playwright). Aucune installation Node/Playwright sur l’hôte n’est nécessaire.

## Lancer les tests E2E

```bash
make up        # démarrer le lab (gateway, platform, etc.)
make test-e2e  # lancer les tests E2E (Docker)
```

`make test-e2e` :
1. Démarre les services si besoin (`gateway` et dépendances).
2. Lance un conteneur éphémère (image Playwright) qui monte le projet, installe les dépendances npm et exécute `npx playwright test` contre `http://gateway:80`.

## Ce qui est testé

- **Navigation** : chargement de la page, dashboard, sidebar, lien Scénarios, navigation vers un scénario (hash), bouton Démarrer/Ouvrir le terminal, données chargées.
- **Terminal** : présence du bouton/lien terminal, ouverture du panneau terminal.
- **Vues et parcours** : Doc & Cours (Learning), Documentation projet (Docs), Cibles & Proxy (Engagements), Progression, Labs, Capture pcap, Simulateur réseau, Proxy (config), Requêtes API (Postman), Options ; bouton CVE.
- **Barre scénario et cibles** : barre visible après démarrage d’un scénario, lien cible DVWA, HTTP /cible/dvwa/, lien bureau VNC (desktop).

## Suite complète : make tests

Pour lancer **tous** les tests (automatisés + complets + E2E) avec rapports :

```bash
make tests
```

Cela exécute dans l’ordre : `make up`, puis `make test-report` (→ test-results.txt), `make test-full-report` (→ test-full-results.txt), puis `make test-e2e`. Rapports : test-results.txt, test-full-results.txt, et rapport Playwright (playwright-report/).

## Fichiers

- `docker-compose.yml` : service `e2e` (profil `e2e`), image `mcr.microsoft.com/playwright:v1.58.2-noble`.
- `playwright.config.js` : config (baseURL via `BASE_URL`, timeout), reporter list + HTML (playwright-report/).
- `e2e/app.spec.js` : suites **Navigation**, **Terminal**, **Vues et parcours**, **Barre scénario et cibles**.

## Lancer sans Makefile (optionnel)

Si tu as Node et Playwright sur l’hôte :

```bash
make up
npm install && npx playwright install chromium
BASE_URL=http://127.0.0.1:8080 npx playwright test
```

En production, utiliser **uniquement** `make test-e2e`.

---

*Dernière mise à jour : février 2026.*
