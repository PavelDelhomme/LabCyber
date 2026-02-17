# Lab Cyber – Application Preact (framework léger)

L’interface est construite avec **Preact** (~3 Ko) et **Vite** pour un bundle léger et des composants réutilisables.

## Développement

```bash
cd platform
npm install
npm run dev
```

Ouvre http://localhost:5173

## Build production

```bash
cd platform
npm run build
```

Génère `dist/` (HTML, JS, CSS). Les dossiers `data/` et `docs/` sont copiés dans `dist/` pour que l’app charge rooms, scénarios et documentation.

## Version statique (sans Preact)

Si tu préfères l’ancienne version HTML/JS statique, ouvre `index-static.html` dans le navigateur, ou configure le serveur pour servir ce fichier.

## Structure

- `src/main.jsx` – point d’entrée, init storage + rendu Preact
- `src/App.jsx` – layout principal, état global, routage de vues
- `src/components/` – Topbar, Sidebar, LogPanel, PipPanel
- `src/views/` – Dashboard, DocsView, LearningView, EngagementsView, ScenarioView, RoomView
- `src/lib/store.js` – hooks useStore, useStorage, fetch données
- `public/storage.js`, `public/logger.js` – IndexedDB et logger (chargés avant l’app)
